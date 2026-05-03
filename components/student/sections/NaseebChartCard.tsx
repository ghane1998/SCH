import React, { useMemo, useState } from 'react';
import type { Student } from '../../../types';
import { useSettings, useData } from '../../../App';
import Card from '../../common/Card';
import { formatFullName, toPersianDigits } from '../../common/formatters';

const NaseebIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>;
const CheckIcon: React.FC<{className?: string}> = ({className}) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>


const ProfilePlaceholder = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-gray-300" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
    </svg>
);

const ChevronDownIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
);

interface NaseebChartCardProps {
    student: Student;
}

const NaseebChartCard: React.FC<NaseebChartCardProps> = ({ student }) => {
    const { settings } = useSettings();
    const { badges, awardedBadges, classes } = useData();
    const components = settings.naseebChartComponents || [];
    const naseebData = student.naseebData || {};
    const [expandedComponent, setExpandedComponent] = useState<string | null>(null);

    // Find the student's teacher
    const myClass = useMemo(() => classes.find(c => c.id === student.classId), [classes, student.classId]);
    const myTeacherId = myClass?.teacherId;

    // Filter for relevant badges (school + my teacher's)
    const relevantBadges = useMemo(() => {
        return badges.filter(badge => {
            if (badge.scope === 'school') return true;
            if (badge.scope === 'teacher' && badge.createdBy === myTeacherId) return true;
            return false;
        }).sort((a,b) => a.name.localeCompare(b.name, 'fa'));
    }, [badges, myTeacherId]);

    // Create a map of my awarded badges for quick lookup
    const myAwardedBadgesMap = useMemo(() => {
        const map = new Map<string, { dateAwarded: string; reason?: string }>();
        awardedBadges
            .filter(ab => ab.studentId === student.id)
            .forEach(ab => {
                map.set(ab.badgeId, { dateAwarded: ab.dateAwarded, reason: ab.reason });
            });
        return map;
    }, [awardedBadges, student.id]);

    const averageScores = useMemo(() => {
        return components.reduce((acc, comp) => {
            const data = naseebData[comp];
            if (data && data.scores.length > 0) {
                const total = data.scores.reduce((sum, s) => sum + s.score, 0);
                acc[comp] = total / data.scores.length;
            } else {
                acc[comp] = 0;
            }
            return acc;
        }, {} as Record<string, number>);
    }, [naseebData, components]);

    const size = 320;
    const center = size / 2;
    const radius = size * 0.35;

    if (components.length < 3) {
        return (
            <Card title="نصیب" icon={<NaseebIcon />}>
                <p className="text-center text-gray-500 py-12">برای نمایش نمودار حداقل به ۳ مولفه نیاز است. (قابل تنظیم توسط مدیر)</p>
            </Card>
        );
    }
    
    const angleSlice = (Math.PI * 2) / components.length;

    // FIX: Define gridLevels for the radar chart grid.
    const gridLevels = 5;

    // Grid lines
    const gridPolygons = Array.from({ length: gridLevels }, (_, i) => {
        const levelRadius = radius * ((i + 1) / gridLevels);
        const points = components.map((_, j) => {
            const angle = angleSlice * j - Math.PI / 2;
            const x = center + levelRadius * Math.cos(angle);
            const y = center + levelRadius * Math.sin(angle);
            return `${x},${y}`;
        }).join(' ');
        return <polygon key={i} points={points} stroke="#e5e7eb" fill="none" />;
    });

    // Axes
    const axes = components.map((_, i) => {
        const angle = angleSlice * i - Math.PI / 2;
        const x = center + radius * Math.cos(angle);
        const y = center + radius * Math.sin(angle);
        return <line key={i} x1={center} y1={center} x2={x} y2={y} stroke="#e5e7eb" />;
    });

    // Labels
    const labels = components.map((comp, i) => {
        const angle = angleSlice * i - Math.PI / 2;
        const labelRadius = radius * 1.15;
        const x = center + labelRadius * Math.cos(angle);
        const y = center + labelRadius * Math.sin(angle);
        const score = averageScores[comp] || 0;
        const tooltipText = `${comp}\nمیانگین امتیاز: ${toPersianDigits(score.toFixed(1))}`;

        return (
            <g key={i} className="cursor-default">
                <title>{tooltipText}</title>
                <text x={x} y={y} textAnchor="middle" alignmentBaseline="middle" className="text-xs font-semibold" fill="var(--text-secondary)">
                    {comp}
                </text>
            </g>
        );
    });

    // Data polygon
    const dataPoints = components.map((comp, i) => {
        const score = averageScores[comp] || 0;
        const value = Math.max(0, Math.min(score, 100)) / 100;
        const angle = angleSlice * i - Math.PI / 2;
        const x = center + radius * value * Math.cos(angle);
        const y = center + radius * value * Math.sin(angle);
        return `${x},${y}`;
    }).join(' ');

    return (
        <Card title="نصیب" icon={<NaseebIcon />}>
             <div className="relative w-full h-[320px] flex items-center justify-center">
                <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full">
                    {gridPolygons}
                    {axes}
                    {labels}
                    <polygon points={dataPoints} fill="rgba(99, 102, 241, 0.4)" stroke="var(--primary-600)" strokeWidth="2">
                        <title>
                            {components.map(comp => `${comp}: ${toPersianDigits((averageScores[comp] || 0).toFixed(1))}`).join('\n')}
                        </title>
                    </polygon>
                </svg>
                 <div className="absolute w-24 h-24 rounded-full bg-white shadow-lg overflow-hidden border-4 border-white">
                    {student.profilePictureUrl ? (
                        <img src={student.profilePictureUrl} alt={formatFullName(student)} className="w-full h-full object-cover" />
                    ) : (
                        <ProfilePlaceholder />
                    )}
                 </div>
             </div>
             
             <div className="mt-6 border-t pt-4">
                <h4 className="text-md font-bold text-[var(--text-primary)] mb-3">توصیف و سوابق مولفه‌ها</h4>
                <div className="space-y-2">
                    {components.map(comp => {
                        const data = naseebData[comp] || { description: '', scores: [] };
                        const isExpanded = expandedComponent === comp;
                        return (
                            <div key={comp} className="p-3 bg-gray-50 rounded-lg border">
                                <div className="flex justify-between items-center cursor-pointer" onClick={() => setExpandedComponent(isExpanded ? null : comp)}>
                                    <div>
                                        <p className="font-semibold text-gray-800">{comp}</p>
                                        {data.description && <p className="text-sm text-gray-600 mt-1">{data.description}</p>}
                                    </div>
                                    {data.scores.length > 0 && <ChevronDownIcon className={`w-5 h-5 text-gray-500 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} />}
                                </div>
                                {isExpanded && data.scores.length > 0 && (
                                    <div className="mt-3 pt-3 border-t max-h-40 overflow-y-auto pr-2">
                                        <ul className="space-y-2 text-sm">
                                            {data.scores.sort((a,b) => b.date.localeCompare(a.date, 'fa-IR')).map((s, i) => (
                                                <li key={i} className="p-2 bg-white rounded border border-gray-200">
                                                    <div className="flex justify-between items-center">
                                                        <div className="flex items-baseline gap-2">
                                                            <span className="text-gray-600 font-semibold">{toPersianDigits(s.date)}</span>
                                                            {s.eventTitle && <span className="text-xs text-gray-500">({s.eventTitle})</span>}
                                                        </div>
                                                        <span className="font-bold text-lg text-[var(--primary-600)]">{toPersianDigits(s.score)}</span>
                                                    </div>
                                                    {s.teacherDescription && (
                                                        <p className="mt-2 text-xs text-gray-700 border-r-2 border-[var(--primary-200)] pr-2">
                                                            {s.teacherDescription}
                                                        </p>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="mt-6 border-t pt-4">
                <h4 className="text-md font-bold text-[var(--text-primary)] mb-3">تالار افتخارات</h4>
                
                <div className="mb-4 p-3 bg-gray-50 border border-dashed rounded-lg flex flex-wrap justify-center items-center gap-x-6 gap-y-2 text-sm">
                    <h5 className="font-semibold text-gray-700">راهنما:</h5>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-amber-50 text-[var(--primary-600)]">
                            <img src="https://placehold.co/40x40/f59e0b/ffffff?text=🏆" alt="مدال کسب شده" className="w-6 h-6 rounded-full" />
                        </div>
                        <span className="text-gray-600">مدال کسب شده</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 filter grayscale opacity-60">
                            <img src="https://placehold.co/40x40/9ca3af/ffffff?text=🏆" alt="مدال کسب نشده" className="w-6 h-6 rounded-full" />
                        </div>
                        <span className="text-gray-500">مدال کسب نشده</span>
                    </div>
                </div>

                {relevantBadges.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {relevantBadges.map(badge => {
                            const awardDetails = myAwardedBadgesMap.get(badge.id);
                            const isAwarded = !!awardDetails;

                            return (
                                <div
                                    key={badge.id}
                                    className={`relative p-4 border rounded-xl text-center flex flex-col items-center justify-start transition-all duration-300 ${
                                        isAwarded
                                            ? 'bg-amber-50 shadow-lg border-amber-400'
                                            : 'bg-gray-100 border-gray-200'
                                    }`}
                                >
                                    <div className={`absolute top-2 left-2 px-2 py-0.5 text-xs font-semibold text-white rounded-full ${badge.scope === 'school' ? 'bg-blue-500' : 'bg-green-500'}`}>
                                        {badge.scope === 'school' ? 'مدرسه' : 'کلاس'}
                                    </div>
                                    <div className={`relative w-16 h-16 mx-auto mb-3 transition-all duration-300 ${
                                        isAwarded ? '' : 'filter grayscale opacity-50'
                                    }`}>
                                        {badge.imageUrl ? (
                                            <img src={badge.imageUrl} alt={badge.name} className="w-full h-full rounded-full object-cover shadow-md" />
                                        ) : (
                                            <div className="w-full h-full rounded-full bg-gray-300 flex items-center justify-center text-gray-500 text-3xl">?</div>
                                        )}
                                        {isAwarded && (
                                            <div className="absolute -top-1 -right-1 bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center border-2 border-amber-50">
                                                <CheckIcon className="h-4 w-4" />
                                            </div>
                                        )}
                                    </div>
                                    <p className={`font-bold text-sm ${isAwarded ? 'text-gray-800' : 'text-gray-500'}`}>{badge.name}</p>
                                    
                                    {isAwarded && awardDetails?.reason ? (
                                        <p className="text-xs text-gray-600 mt-1 italic">«{awardDetails.reason}»</p>
                                    ) : badge.criteria ? (
                                        <p className="text-xs text-gray-500 mt-1">{badge.criteria}</p>
                                    ) : badge.description ? (
                                        <p className="text-xs text-gray-400 mt-1">{badge.description}</p>
                                    ) : null }
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p className="text-sm text-center text-gray-500 py-4">هنوز مدالی در مدرسه تعریف نشده است.</p>
                )}
            </div>
        </Card>
    );
};

export default NaseebChartCard;