import React, { useMemo, useState, useRef } from 'react';
import type { Student, Grade, SchoolSettings, DescriptiveGrade } from '../../../types';
import { useData, useSettings } from '../../../App';
import Card from '../../common/Card';
import { toPersianDigits } from '../../common/formatters';
import { useSortableData } from '../../common/useSortableData';
import { SortableHeader } from '../../common/SortableHeader';
import { DESCRIPTIVE_GRADES } from '../../../types';
import { GraduationCap, Filter, List, LineChart } from 'lucide-react';


const GradeIcon = () => <GraduationCap className="h-6 w-6" />;

const GradesList: React.FC<{ grades: (Grade & { score: number | DescriptiveGrade })[]; settings: SchoolSettings }> = ({ grades, settings }) => {
    const { items: sortedGrades, requestSort, sortConfig } = useSortableData(grades, [{ key: 'date', direction: 'descending' }]);

    if (grades.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <div className="p-4 bg-gray-50 rounded-full mb-4">
                    <Filter className="w-8 h-8 text-gray-400" />
                </div>
                <p className="font-medium text-gray-600">نمره‌ای مطابق با فیلتر انتخابی یافت نشد.</p>
                <p className="text-sm mt-1">تلاش کنید فیلتر درس را تغییر دهید.</p>
            </div>
        );
    }

    const getScoreStyle = (score: number | DescriptiveGrade): React.CSSProperties => {
        if (typeof score === 'number') {
            return { color: score >= settings.passingGrade ? '#16a34a' : '#dc2626' }; // green-600, red-600
        }
        const colorSetting = settings.descriptiveGradeColors.find(s => s.grade === score);
        if (colorSetting) {
            return { 
                backgroundColor: colorSetting.color, 
                color: 'white', 
                padding: '4px 12px', 
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: 600,
                display: 'inline-block',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            };
        }
        return {};
    };

    return (
        <div className="overflow-x-auto max-h-[350px]">
            <table className="w-full text-sm text-right">
                <thead className="bg-gray-50 border-b border-gray-100 sticky top-0 z-10">
                    <tr className="text-gray-500">
                        {/* FIX: Add missing children prop */}
                        <SortableHeader className="px-6 py-4 font-medium" sortKey="subject" requestSort={requestSort} sortConfig={sortConfig}>درس</SortableHeader>
                        {/* FIX: Add missing children prop */}
                        <SortableHeader sortKey="score" requestSort={requestSort} sortConfig={sortConfig} className="text-center px-6 py-4 font-medium">نمره</SortableHeader>
                        {/* FIX: Add missing children prop */}
                        <SortableHeader className="px-6 py-4 font-medium" sortKey="date" requestSort={requestSort} sortConfig={sortConfig}>تاریخ</SortableHeader>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {sortedGrades.map(grade => (
                        <tr key={grade.id} className="hover:bg-blue-50/30 transition-colors">
                            <td className="px-6 py-4 font-bold text-gray-800">{grade.subject}</td>
                            <td className="px-6 py-4 font-bold text-center">
                                <span style={getScoreStyle(grade.score)}>
                                    {toPersianDigits(grade.score)}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-gray-500 font-mono text-xs">{toPersianDigits(grade.date)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

interface GradesChartProps {
    grades: (Grade & { score: number })[];
    chartSettings: SchoolSettings['studentGradesViewSettings']['chartSettings'];
}

const GradesChart: React.FC<GradesChartProps> = ({ grades, chartSettings }) => {
    const [tooltip, setTooltip] = useState<{ x: number; y: number; grade: Grade } | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const sortedGrades = useMemo(() =>
        [...grades].sort((a, b) => a.date.localeCompare(b.date, 'fa-IR')),
        [grades]
    );

    if (sortedGrades.length < 2) {
        return <p className="text-center text-gray-500 py-12">برای نمایش نمودار حداقل به دو نمره نیاز است.</p>;
    }

    const WIDTH = 500;
    const HEIGHT = 300;
    const PADDING = { top: 20, right: 20, bottom: 40, left: 30 };
    const chartWidth = WIDTH - PADDING.left - PADDING.right;
    const chartHeight = HEIGHT - PADDING.top - PADDING.bottom;

    const yScale = (score: number) => PADDING.top + chartHeight - (score / 20) * chartHeight;
    const xScale = (index: number) => PADDING.left + (index / (sortedGrades.length - 1)) * chartWidth;

    const pathData = sortedGrades.map((grade, index) => {
        const x = xScale(index);
        const y = yScale(grade.score as number);
        return `${index === 0 ? 'M' : 'L'} ${x},${y}`;
    }).join(' ');
    
    const areaData = pathData + ` L ${xScale(sortedGrades.length - 1)},${HEIGHT - PADDING.bottom} L ${xScale(0)},${HEIGHT - PADDING.bottom} Z`;


    const handleMouseOver = (e: React.MouseEvent, grade: Grade, index: number) => {
        if (!containerRef.current) return;
        const containerRect = containerRef.current.getBoundingClientRect();
        const x = xScale(index) * (containerRect.width / WIDTH);
        const y = yScale(grade.score as number) * (containerRect.height / HEIGHT);
        setTooltip({ x, y, grade });
    };

    return (
        <div className="h-[350px]" ref={containerRef}>
            {tooltip && (
                <div 
                    className="absolute z-20 p-2 text-xs text-white bg-gray-800 rounded-md shadow-lg pointer-events-none transition-transform transform -translate-x-1/2 -translate-y-[calc(100%+10px)]"
                    style={{ left: tooltip.x, top: tooltip.y }}
                >
                    <div className="font-bold">{tooltip.grade.subject}: {toPersianDigits(tooltip.grade.score)}</div>
                    <div className="text-gray-300">{toPersianDigits(tooltip.grade.date)}</div>
                </div>
            )}
            <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
                {/* Y-Axis Grid Lines & Labels */}
                {[0, 5, 10, 15, 20].map(score => {
                    const y = yScale(score);
                    return (
                        <g key={score} className="text-xs text-gray-400">
                            <line x1={PADDING.left} y1={y} x2={WIDTH - PADDING.right} y2={y} stroke="currentColor" strokeWidth="0.5" strokeDasharray="2,3" />
                            <text x={PADDING.left - 8} y={y + 4} textAnchor="end">{toPersianDigits(score)}</text>
                        </g>
                    );
                })}
                {/* X-Axis Labels */}
                 <g className="text-xs text-gray-500">
                     <text x={xScale(0)} y={HEIGHT - PADDING.bottom + 15} textAnchor="middle">{toPersianDigits(sortedGrades[0].date)}</text>
                     <text x={xScale(sortedGrades.length - 1)} y={HEIGHT - PADDING.bottom + 15} textAnchor="middle">{toPersianDigits(sortedGrades[sortedGrades.length - 1].date)}</text>
                 </g>

                {/* Area under the line */}
                {chartSettings.showArea && <path d={areaData} fill={chartSettings.areaColor} />}

                {/* Line */}
                {chartSettings.showLine && <path d={pathData} fill="none" stroke={chartSettings.lineColor} strokeWidth="2" />}

                {/* Points */}
                {sortedGrades.map((grade, index) => (
                    <g key={grade.id}>
                        {/* Invisible hover target */}
                         <circle
                            cx={xScale(index)}
                            cy={yScale(grade.score as number)}
                            r={chartSettings.pointRadius + 6}
                            fill="transparent"
                            className="cursor-pointer"
                            onMouseEnter={(e) => handleMouseOver(e, grade, index)}
                            onMouseLeave={() => setTooltip(null)}
                        />
                         {/* Visible point */}
                        <circle
                            cx={xScale(index)}
                            cy={yScale(grade.score as number)}
                            r={chartSettings.pointRadius}
                            fill={chartSettings.pointColor}
                            stroke="white"
                            strokeWidth="2"
                            className="pointer-events-none"
                        />
                    </g>
                ))}
            </svg>
        </div>
    );
};


interface DescriptiveGradesChartProps {
    grades: Grade[];
    chartSettings: SchoolSettings['studentGradesViewSettings']['chartSettings'];
    descriptiveGradeColors: SchoolSettings['descriptiveGradeColors'];
}

const DescriptiveGradesChart: React.FC<DescriptiveGradesChartProps> = ({ grades, chartSettings, descriptiveGradeColors }) => {
    const [tooltip, setTooltip] = useState<{ x: number; y: number; grade: Grade } | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    
    const yAxisLabels: DescriptiveGrade[] = [...DESCRIPTIVE_GRADES].reverse(); 
    
    const gradeToYValue = (grade: DescriptiveGrade): number => {
        const index = yAxisLabels.indexOf(grade);
        return index === -1 ? 0 : index;
    };

    const sortedGrades = useMemo(() =>
        grades
            .filter((g): g is Grade & { score: DescriptiveGrade } => typeof g.score === 'string')
            .sort((a, b) => a.date.localeCompare(b.date, 'fa-IR')),
        [grades]
    );

    if (sortedGrades.length < 2) {
        return <p className="text-center text-gray-500 py-12">برای نمایش نمودار حداقل به دو نمره توصیفی نیاز است.</p>;
    }
    
    const WIDTH = 500;
    const HEIGHT = 300;
    const PADDING = { top: 20, right: 20, bottom: 40, left: 100 }; // Increased left padding for labels
    const chartWidth = WIDTH - PADDING.left - PADDING.right;
    const chartHeight = HEIGHT - PADDING.top - PADDING.bottom;

    const yScale = (gradeValue: number) => PADDING.top + chartHeight - (gradeValue / (yAxisLabels.length - 1)) * chartHeight;
    const xScale = (index: number) => PADDING.left + (index / (sortedGrades.length - 1)) * chartWidth;

    const pathData = sortedGrades.map((grade, index) => {
        const x = xScale(index);
        const y = yScale(gradeToYValue(grade.score));
        return `${index === 0 ? 'M' : 'L'} ${x},${y}`;
    }).join(' ');

    const areaData = pathData + ` L ${xScale(sortedGrades.length - 1)},${HEIGHT - PADDING.bottom} L ${xScale(0)},${HEIGHT - PADDING.bottom} Z`;

    const handleMouseOver = (e: React.MouseEvent, grade: Grade, index: number) => {
        if (!containerRef.current) return;
        const containerRect = containerRef.current.getBoundingClientRect();
        const x = xScale(index) * (containerRect.width / WIDTH);
        const y = yScale(gradeToYValue(grade.score as DescriptiveGrade)) * (containerRect.height / HEIGHT);
        setTooltip({ x, y, grade });
    };

    const getColorForGrade = (grade: DescriptiveGrade) => {
        return descriptiveGradeColors.find(c => c.grade === grade)?.color || '#6b7280';
    };

    return (
        <div className="h-[350px]" ref={containerRef}>
            {tooltip && (
                <div 
                    className="absolute z-20 p-2 text-xs text-white bg-gray-800 rounded-md shadow-lg pointer-events-none transition-transform transform -translate-x-1/2 -translate-y-[calc(100%+10px)]"
                    style={{ left: tooltip.x, top: tooltip.y }}
                >
                    <div className="font-bold">{tooltip.grade.subject}: {tooltip.grade.score}</div>
                    <div className="text-gray-300">{toPersianDigits(tooltip.grade.date)}</div>
                </div>
            )}
            <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
                {/* Y-Axis Grid Lines & Labels */}
                {yAxisLabels.map((label, index) => {
                    const y = yScale(index);
                    return (
                        <g key={label} className="text-xs text-gray-500">
                            <line x1={PADDING.left} y1={y} x2={WIDTH - PADDING.right} y2={y} stroke="#e5e7eb" strokeWidth="1" strokeDasharray="3,4" />
                            <text x={PADDING.left - 12} y={y + 4} textAnchor="end" className="font-semibold">{label}</text>
                        </g>
                    );
                })}
                {/* X-Axis Labels */}
                 <g className="text-xs text-gray-500">
                     <text x={xScale(0)} y={HEIGHT - PADDING.bottom + 15} textAnchor="middle">{toPersianDigits(sortedGrades[0].date)}</text>
                     <text x={xScale(sortedGrades.length - 1)} y={HEIGHT - PADDING.bottom + 15} textAnchor="middle">{toPersianDigits(sortedGrades[sortedGrades.length - 1].date)}</text>
                 </g>

                {/* Area under the line */}
                {chartSettings.showArea && <path d={areaData} fill={chartSettings.areaColor} />}

                {/* Line */}
                {chartSettings.showLine && <path d={pathData} fill="none" stroke={chartSettings.lineColor} strokeWidth="2" />}

                {/* Points */}
                {sortedGrades.map((grade, index) => (
                    <g key={grade.id}>
                         <circle
                            cx={xScale(index)}
                            cy={yScale(gradeToYValue(grade.score))}
                            r={chartSettings.pointRadius + 6}
                            fill="transparent"
                            className="cursor-pointer"
                            onMouseEnter={(e) => handleMouseOver(e, grade, index)}
                            onMouseLeave={() => setTooltip(null)}
                        />
                        <circle
                            cx={xScale(index)}
                            cy={yScale(gradeToYValue(grade.score))}
                            r={chartSettings.pointRadius}
                            fill={getColorForGrade(grade.score)}
                            stroke="white"
                            strokeWidth="2"
                            className="pointer-events-none"
                        />
                    </g>
                ))}
            </svg>
        </div>
    );
};


interface GradesSectionProps {
    student: Student;
}

const GradesSection: React.FC<GradesSectionProps> = ({ student }) => {
    const { grades } = useData();
    const { settings } = useSettings();
    const gradesSettings = settings.studentGradesViewSettings;
    const isDescriptive = settings.gradingSystem === 'descriptive';
    
    const [viewMode, setViewMode] = useState<'list' | 'chart'>(gradesSettings.defaultView);
    const [subjectFilter, setSubjectFilter] = useState('all');

    const myGrades = useMemo(() => 
        grades.filter(g => g.studentId === student.id), 
    [grades, student.id]);
    
    const subjects = useMemo(() => 
        ['all', ...Array.from(new Set(myGrades.map(g => g.subject)))], 
    [myGrades]);

    const filteredGrades = useMemo(() => {
        let tempGrades = [...myGrades];

        if (subjectFilter !== 'all') {
            tempGrades = tempGrades.filter(g => g.subject === subjectFilter);
        }
        
        return tempGrades;
    }, [myGrades, subjectFilter]);
    
    if (!gradesSettings.gradesModuleEnabled) {
        return null;
    }

    return (
        <Card title="نمرات" icon={<GradeIcon />}>
            <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                     <div className="flex items-center gap-3">
                        <label htmlFor="subject-filter" className="text-sm font-medium text-gray-600 whitespace-nowrap">فیلتر درس:</label>
                        <select
                            id="subject-filter"
                            value={subjectFilter}
                            onChange={e => setSubjectFilter(e.target.value)}
                            className="px-4 py-2 pr-10 text-sm border-0bg-white rounded-xl shadow-sm ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-all cursor-pointer hover:bg-gray-50"
                            style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: `left 0.5rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.5em 1.5em`, appearance: 'none' }}
                        >
                            {subjects.map(subject => (
                                <option key={subject} value={subject}>{subject === 'all' ? 'همه دروس' : subject}</option>
                            ))}
                        </select>
                    </div>
                     <div className="bg-gray-200/70 p-1.5 rounded-xl flex">
                        <button onClick={() => setViewMode('list')} className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                            <List className="w-4 h-4" />
                            توضیحی
                        </button>
                        <button onClick={() => setViewMode('chart')} className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${viewMode === 'chart' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                            <LineChart className="w-4 h-4" />
                            نمودار
                        </button>
                    </div>
                </div>
            </div>
            <div className="p-2 sm:p-4">
                {viewMode === 'list' ? (
                    <GradesList grades={filteredGrades} settings={settings} />
                ) : isDescriptive ? (
                    <DescriptiveGradesChart 
                        grades={filteredGrades} 
                        chartSettings={gradesSettings.chartSettings}
                        descriptiveGradeColors={settings.descriptiveGradeColors}
                    />
                ) : (
                    <GradesChart 
                        grades={filteredGrades.filter(g => typeof g.score === 'number') as (Grade & {score: number})[]} 
                        chartSettings={gradesSettings.chartSettings} 
                    />
                )}
            </div>
        </Card>
    );
};

export default GradesSection;
