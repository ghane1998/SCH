import React, { useMemo, useState, useRef } from 'react';
import { ShieldAlert, Activity, CheckCircle, BarChart2, List } from 'lucide-react';
import type { Student, DisciplinaryIncident, SchoolSettings } from '../../../types';
import { useData, useSettings } from '../../../App';
import Card from '../../common/Card';
import { toPersianDigits } from '../../common/formatters';
import { DEFAULT_SETTINGS } from '../../../data';

const DisciplineIcon = () => <ShieldAlert className="w-6 h-6 text-orange-500" />;

interface DisciplinePieChartProps {
    incidents: DisciplinaryIncident[];
    settings: SchoolSettings['studentDisciplineViewSettings']['chartSettings'];
}

const DisciplinePieChart: React.FC<DisciplinePieChartProps> = ({ incidents, settings }) => {
    const [tooltip, setTooltip] = useState<{ x: number, y: number, category: string, count: number, percent: string } | null>(null);
    const chartRef = useRef<SVGSVGElement>(null);

    const data = useMemo(() => {
        const counts = incidents.reduce((acc, incident) => {
            acc[incident.category] = (acc[incident.category] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        return Object.entries(counts).map(([category, count]) => ({ category, count }));
    }, [incidents]);

    const total = useMemo(() => data.reduce((sum, item) => sum + item.count, 0), [data]);

    if (total === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <CheckCircle className="w-16 h-16 text-emerald-100 mb-4" />
                <h3 className="text-lg font-bold text-gray-700 mb-1">موردی یافت نشد</h3>
                <p className="text-gray-500 text-sm">موردی برای نمایش در نمودار وجود ندارد.</p>
            </div>
        );
    }

    const radius = 80;
    const center = 100;
    let cumulativePercent = 0;

    const slices = data.map(({ category, count }) => {
        const percent = count / total;
        const startAngle = cumulativePercent * 2 * Math.PI - (Math.PI / 2); // Start from top
        cumulativePercent += percent;
        const endAngle = cumulativePercent * 2 * Math.PI - (Math.PI / 2);

        const x1 = center + radius * Math.cos(startAngle);
        const y1 = center + radius * Math.sin(startAngle);
        const x2 = center + radius * Math.cos(endAngle);
        const y2 = center + radius * Math.sin(endAngle);

        const largeArcFlag = percent > 0.5 ? 1 : 0;

        const pathData = `M ${center},${center} L ${x1},${y1} A ${radius},${radius} 0 ${largeArcFlag},1 ${x2},${y2} Z`;

        const midAngle = startAngle + (endAngle - startAngle) / 2;
        const textX = center + (radius / 1.5) * Math.cos(midAngle);
        const textY = center + (radius / 1.5) * Math.sin(midAngle);
        
        return { pathData, color: settings.colorPalette[category] || '#ccc', category, count, percent: (percent * 100).toFixed(1), textX, textY };
    });

    const handleMouseOver = (e: React.MouseEvent, slice: typeof slices[0]) => {
        if (!chartRef.current) return;
        const rect = chartRef.current.getBoundingClientRect();
        setTooltip({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
            category: slice.category,
            count: slice.count,
            percent: slice.percent
        });
    };

    return (
        <div className="flex flex-col md:flex-row items-center justify-center gap-8 p-6 relative">
            <div>
                <svg ref={chartRef} viewBox="0 0 200 200" width="200" height="200" className="drop-shadow-sm">
                    {slices.map((slice, index) => (
                        <g key={index} 
                           onMouseMove={(e) => handleMouseOver(e, slice)} 
                           onMouseLeave={() => setTooltip(null)}
                           className="transition-transform duration-200 hover:scale-105 cursor-pointer origin-center">
                            <path d={slice.pathData} fill={slice.color} stroke="#fff" strokeWidth="2.5" className="transition-all duration-300" />
                        </g>
                    ))}
                    {settings.showPercentages && slices.map((slice, index) => (
                        slice.count / total > 0.05 && // only show percentage for slices > 5%
                        <text key={`label-${index}`} x={slice.textX} y={slice.textY}
                              textAnchor="middle" alignmentBaseline="middle"
                              className="text-xs font-bold fill-white pointer-events-none drop-shadow-md">
                            {toPersianDigits(slice.percent)}%
                        </text>
                    ))}
                </svg>
                {tooltip && (
                    <div className="absolute p-3 text-xs text-white bg-gray-900/90 backdrop-blur-sm rounded-xl shadow-xl pointer-events-none z-10 transition-opacity"
                         style={{ left: tooltip.x, top: tooltip.y, transform: 'translate(-50%, -110%)' }}>
                        <div className="font-bold mb-1">{tooltip.category}</div>
                        <div className="text-gray-300">تعداد: {toPersianDigits(tooltip.count)} مورد ({toPersianDigits(tooltip.percent)}%)</div>
                    </div>
                )}
            </div>
            {settings.showLegend && (
                <div className="grid grid-cols-1 gap-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
                    {slices.map((slice, index) => (
                        <div key={index} className="flex items-center gap-3 text-sm font-medium text-gray-700">
                            <span className="w-4 h-4 rounded shadow-sm" style={{ backgroundColor: slice.color }}></span>
                            <span>{slice.category} <span className="text-gray-400 mr-1">({toPersianDigits(slice.count)})</span></span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

interface DisciplineSectionProps {
    student: Student;
}

const DisciplineSection: React.FC<DisciplineSectionProps> = ({ student }) => {
    const { disciplineIncidents } = useData();
    const { settings } = useSettings();
    const myDiscipline = useMemo(() => disciplineIncidents.filter(d => d.studentId === student.id), [disciplineIncidents, student.id]);
    const disciplineSettings = settings.studentDisciplineViewSettings || DEFAULT_SETTINGS.studentDisciplineViewSettings;
    const [disciplineViewMode, setDisciplineViewMode] = useState<'list' | 'chart'>(disciplineSettings.defaultView);
    
    if (!disciplineSettings.disciplineModuleEnabled) {
        return null;
    }

    return (
        <Card title="سوابق انضباطی" icon={<DisciplineIcon/>}>
            <div className="p-3 border-b border-gray-100 bg-gray-50/50">
                <div className="bg-gray-200/60 p-1.5 rounded-xl flex max-w-[240px] mx-auto gap-1">
                    <button 
                        onClick={() => setDisciplineViewMode('list')} 
                        className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-lg transition-all duration-200 ${disciplineViewMode === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}`}
                    >
                        <List className="w-4 h-4" />
                        لیست
                    </button>
                    <button 
                        onClick={() => setDisciplineViewMode('chart')} 
                        className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-lg transition-all duration-200 ${disciplineViewMode === 'chart' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}`}
                    >
                        <BarChart2 className="w-4 h-4" />
                        نمودار
                    </button>
                </div>
            </div>
            
            <div className="p-0">
                {disciplineViewMode === 'list' ? (
                    <div className="p-5">
                        {myDiscipline.length > 0 ? (
                            <ul className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                                {myDiscipline.map((incident) => (
                                <li key={incident.id} className="relative p-5 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                                        <div className="absolute top-0 right-0 w-1.5 h-full bg-orange-400 rounded-r-2xl"></div>
                                        <div className="flex justify-between items-start flex-wrap gap-2 mb-3">
                                            <div className="flex items-center gap-2">
                                                <div className="p-2 bg-orange-50 rounded-lg text-orange-500">
                                                    <Activity className="w-4 h-4" />
                                                </div>
                                                <p className="font-bold text-gray-800">{incident.category}</p>
                                            </div>
                                            <div className="bg-gray-100 px-3 py-1 rounded-full">
                                                <p className="text-xs font-semibold text-gray-600">{toPersianDigits(incident.date)}</p>
                                            </div>
                                        </div>
                                        <div className="space-y-2.5">
                                            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                                <p className="text-xs text-gray-500 font-bold mb-1">شرح دقیق واقعه</p>
                                                <p className="text-sm text-gray-700 leading-relaxed">{incident.description}</p>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                                <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-4 border-8 border-emerald-50/50">
                                    <CheckCircle className="w-8 h-8 text-emerald-500" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-800 mb-2">پرونده انضباطی شما پاک است! 🎉</h3>
                                <p className="text-gray-500 text-sm max-w-sm">
                                    هیچ مورد انضباطی برای شما ثبت نشده است. از رفتار خوب شما سپاسگزاریم، همینطور ادامه دهید!
                                </p>
                            </div>
                        )}
                    </div>
                ) : (
                    <DisciplinePieChart incidents={myDiscipline} settings={disciplineSettings.chartSettings} />
                )}
            </div>
        </Card>
    );
};

export default DisciplineSection;
