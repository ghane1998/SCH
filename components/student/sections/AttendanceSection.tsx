import React, { useMemo, useState } from 'react';
import type { Student, AttendanceStatus, Attendance } from '../../../types';
import { useData, useSettings } from '../../../App';
import Card from '../../common/Card';
import { formatFullName, toPersianDigits } from '../../common/formatters';

const AttendanceIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;

const AttendanceDetailModal: React.FC<{ record: Attendance; onClose: () => void }> = ({ record, onClose }) => {
    const { settings } = useSettings();
    const { teachers, admins } = useData();

    const getRecorderName = (recorderId: string) => {
        const user = teachers.find(t => t.id === recorderId) || admins.find(a => a.id === recorderId);
        return formatFullName(user) || 'سیستم';
    };

    const statusInfo: Record<AttendanceStatus, { text: string; color: string }> = {
        'حاضر': { text: 'حاضر', color: 'text-green-600' },
        'غیرموجه': { text: 'غیبت غیرموجه', color: 'text-red-600' },
        'موجه': { text: 'غیبت موجه', color: 'text-orange-600' },
        'تاخیر': { text: 'تاخیر', color: 'text-yellow-600' },
        'خروج': { text: 'خروج زودهنگام', color: 'text-blue-600' },
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center border-b pb-3 mb-4">
                    <h3 className="text-lg font-bold text-[var(--text-primary)]">جزئیات حضور و غیاب</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">&times;</button>
                </div>
                <div className="space-y-3 text-sm">
                    <p><strong>تاریخ:</strong> <span className="font-semibold">{toPersianDigits(record.date)}</span></p>
                    <p><strong>وضعیت:</strong> <span className={`font-bold ${statusInfo[record.status]?.color}`}>{statusInfo[record.status]?.text}</span></p>
                    
                    {settings.studentVisibleAttendanceFields.minutesLate && record.status === 'تاخیر' && record.minutesLate && (
                        <p><strong>مدت تاخیر:</strong> {toPersianDigits(record.minutesLate)} دقیقه</p>
                    )}
                    {settings.studentVisibleAttendanceFields.departureTime && record.status === 'خروج' && record.departureTime && (
                        <p><strong>ساعت خروج:</strong> {toPersianDigits(record.departureTime)}</p>
                    )}
                    {settings.studentVisibleAttendanceFields.isNotified && (record.status === 'موجه' || record.status === 'غیرموجه') && (
                        <p><strong>اطلاع‌رسانی والدین به مدرسه:</strong> {record.isNotified ? 'انجام شده' : 'انجام نشده'}</p>
                    )}
                    {settings.studentVisibleAttendanceFields.hasDoctorsNote && (record.status === 'موجه' || record.status === 'غیرموجه') && (
                         <p><strong>گواهی پزشکی:</strong> {record.hasDoctorsNote ? 'ارائه شده' : 'ارائه نشده'}</p>
                    )}
                    {settings.studentVisibleAttendanceFields.recordedBy && (
                        <p><strong>ثبت توسط:</strong> {getRecorderName(record.recordedBy)}</p>
                    )}
                </div>
                <div className="mt-6 text-right">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition">بستن</button>
                </div>
            </div>
        </div>
    );
};

interface AttendanceSectionProps {
    student: Student;
}

const AttendanceSection: React.FC<AttendanceSectionProps> = ({ student }) => {
    const { attendance } = useData();
    const { settings } = useSettings();
    const [viewDate, setViewDate] = useState(new Date());
    const [selectedAttendance, setSelectedAttendance] = useState<Attendance | null>(null);
    const [attendanceViewMode, setAttendanceViewMode] = useState<'calendar' | 'list'>('list');

    const myAttendance = useMemo(() => attendance.filter(a => a.studentId === student.id), [attendance, student.id]);
    
    const attendanceMap = useMemo(() => 
        myAttendance.reduce((acc, curr) => {
          acc[curr.date] = curr;
          return acc;
        }, {} as Record<string, Attendance>), 
    [myAttendance]);
  
    const academicYears = useMemo(() => {
        const year = settings.academicYear;
        if (year.includes('-')) {
            const parts = year.split('-').map(y => y.trim());
            if (parts.length === 2 && !isNaN(parseInt(parts[0])) && !isNaN(parseInt(parts[1]))) {
                const start = parseInt(parts[0]);
                const end = parseInt(parts[1]);
                const years = [];
                for (let i = start; i <= end; i++) {
                    years.push(String(i));
                }
                return years.length > 0 ? years : [new Date().toLocaleDateString('fa-IR-u-nu-latn').split('/')[0]];
            }
            return parts.length > 0 ? parts : [new Date().toLocaleDateString('fa-IR-u-nu-latn').split('/')[0]];
        }
        return year ? [year.trim()] : [new Date().toLocaleDateString('fa-IR-u-nu-latn').split('/')[0]];
    }, [settings.academicYear]);
  
    const persianMonths = [
        { value: 0, name: 'فروردین' }, { value: 1, name: 'اردیبهشت' }, { value: 2, name: 'خرداد' },
        { value: 3, name: 'تیر' }, { value: 4, name: 'مرداد' }, { value: 5, name: 'شهریور' },
        { value: 6, name: 'مهر' }, { value: 7, name: 'آبان' }, { value: 8, name: 'آذر' },
        { value: 9, name: 'دی' }, { value: 10, name: 'بهمن' }, { value: 11, name: 'اسفند' },
    ];
  
    const { persianYear, persianMonth } = useMemo(() => {
        const pYear = parseInt(new Intl.DateTimeFormat('fa-IR-u-nu-latn', { year: 'numeric' }).format(viewDate));
        const pMonth = parseInt(new Intl.DateTimeFormat('fa-IR-u-nu-latn', { month: 'numeric' }).format(viewDate)) - 1; // 0-11
        return { persianYear: pYear, persianMonth: pMonth };
    }, [viewDate]);

    const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newPersianMonth = parseInt(e.target.value, 10);
        setViewDate(current => {
            const currentPersianMonth = parseInt(new Intl.DateTimeFormat('fa-IR-u-nu-latn', { month: 'numeric' }).format(current)) - 1;
            const newDate = new Date(current);
            newDate.setDate(15);

            let monthDiff = newPersianMonth - currentPersianMonth;
            if (monthDiff > 6) monthDiff -= 12;
            if (monthDiff < -6) monthDiff += 12;

            newDate.setMonth(newDate.getMonth() + monthDiff);
            
            const landedMonth = parseInt(new Intl.DateTimeFormat('fa-IR-u-nu-latn', { month: 'numeric' }).format(newDate)) -1;
            if (landedMonth !== newPersianMonth) {
                newDate.setDate(newDate.getDate() + 15 * (monthDiff > 0 ? 1 : -1) );
            }
            return newDate;
        });
    };

    const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newPersianYear = parseInt(e.target.value);
        setViewDate(current => {
            const currentPersianYear = parseInt(new Intl.DateTimeFormat('fa-IR-u-nu-latn', { year: 'numeric' }).format(current));
            const yearDiff = newPersianYear - currentPersianYear;
            const newDate = new Date(current);
            newDate.setFullYear(newDate.getFullYear() + yearDiff);
            
            const finalPersianYear = parseInt(new Intl.DateTimeFormat('fa-IR-u-nu-latn', { year: 'numeric' }).format(newDate));
            if(finalPersianYear !== newPersianYear) {
                newDate.setDate(newDate.getDate() + (newPersianYear > finalPersianYear ? 20 : -20) );
            }
            return newDate;
        });
    };

    const calendarDays = useMemo(() => {
        let firstDayOfMonth = new Date(viewDate);
        let day = parseInt(new Intl.DateTimeFormat('fa-IR-u-nu-latn', { day: 'numeric' }).format(firstDayOfMonth));
        firstDayOfMonth.setDate(firstDayOfMonth.getDate() - (day - 1));

        let currentMonth = parseInt(new Intl.DateTimeFormat('fa-IR-u-nu-latn', { month: 'numeric' }).format(firstDayOfMonth)) - 1;
        
        while(currentMonth !== persianMonth) {
            firstDayOfMonth.setDate(firstDayOfMonth.getDate() + 1);
            currentMonth = parseInt(new Intl.DateTimeFormat('fa-IR-u-nu-latn', { month: 'numeric' }).format(firstDayOfMonth)) - 1;
        }
        
        let currentDay = parseInt(new Intl.DateTimeFormat('fa-IR-u-nu-latn', { day: 'numeric' }).format(firstDayOfMonth));
        while(currentDay > 1) {
            firstDayOfMonth.setDate(firstDayOfMonth.getDate() - 1);
            currentDay = parseInt(new Intl.DateTimeFormat('fa-IR-u-nu-latn', { day: 'numeric' }).format(firstDayOfMonth));
        }
        
        const startDayOfWeek = (firstDayOfMonth.getDay() + 1) % 7;

        const daysInMonthList = [];
        const tempDate = new Date(firstDayOfMonth);
        do {
            daysInMonthList.push(new Date(tempDate));
            tempDate.setDate(tempDate.getDate() + 1);
        } while (parseInt(new Intl.DateTimeFormat('fa-IR-u-nu-latn', { month: 'numeric' }).format(tempDate)) - 1 === persianMonth);
        
        const days = [];
        
        for (let i = 0; i < startDayOfWeek; i++) {
            const d = new Date(firstDayOfMonth);
            d.setDate(d.getDate() - (startDayOfWeek - i));
            days.push({ date: d, isCurrentMonth: false });
        }

        days.push(...daysInMonthList.map(d => ({ date: d, isCurrentMonth: true })));

        while(days.length < 42) {
            days.push({ date: new Date(tempDate), isCurrentMonth: false });
            tempDate.setDate(tempDate.getDate() + 1);
        }
        
        return days;
    }, [viewDate, persianMonth]);

    const weekdays = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

    const getAttendanceColor = (status?: AttendanceStatus) => {
        switch (status) {
            case 'حاضر': return 'bg-green-200 text-green-800 border-green-300';
            case 'غیرموجه': return 'bg-red-200 text-red-800 border-red-300 font-bold';
            case 'موجه': return 'bg-orange-200 text-orange-800 border-orange-300';
            case 'تاخیر': return 'bg-yellow-200 text-yellow-800 border-yellow-300';
            case 'خروج': return 'bg-blue-200 text-blue-800 border-blue-300';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };
  
    const inputStyle = {
        backgroundColor: 'var(--input-bg)',
        borderColor: 'var(--input-border)',
        color: 'var(--text-primary)'
    };

    const attendanceLegend = [
        { status: 'حاضر', color: 'bg-green-200' },
        { status: 'غیبت غیرموجه', color: 'bg-red-200' },
        { status: 'غیبت موجه', color: 'bg-orange-200' },
        { status: 'تاخیر', color: 'bg-yellow-200' },
        { status: 'خروج', color: 'bg-blue-200' },
        { status: 'نامشخص', color: 'bg-gray-100' },
    ];

    const sortedAttendance = useMemo(() => 
        [...myAttendance].sort((a, b) => b.date.localeCompare(a.date, 'fa-IR')), 
    [myAttendance]);

    const getStatusInfo = (status: AttendanceStatus) => {
        switch (status) {
            case 'حاضر': return { text: 'حاضر', color: 'text-green-800', bgColor: 'bg-green-100' };
            case 'غیرموجه': return { text: 'غیبت غیرموجه', color: 'text-red-800', bgColor: 'bg-red-100' };
            case 'موجه': return { text: 'غیبت موجه', color: 'text-orange-800', bgColor: 'bg-orange-100' };
            case 'تاخیر': return { text: 'تاخیر', color: 'text-yellow-800', bgColor: 'bg-yellow-100' };
            case 'خروج': return { text: 'خروج زودهنگام', color: 'text-blue-800', bgColor: 'bg-blue-100' };
            default: return { text: status, color: 'text-gray-800', bgColor: 'bg-gray-100' };
        }
    };

    return (
        <>
            {selectedAttendance && <AttendanceDetailModal record={selectedAttendance} onClose={() => setSelectedAttendance(null)} />}
            <Card title="حضور و غیاب" icon={<AttendanceIcon/>}>
                <div className="min-h-[420px]">
                    {attendanceViewMode === 'calendar' ? (
                        <>
                            <div className="flex justify-between items-center mb-4 gap-2">
                                <select
                                    value={persianMonth}
                                    onChange={handleMonthChange}
                                    className="flex-grow px-3 py-1.5 border rounded-lg shadow-sm focus:ring-[var(--primary-500)] focus:border-[var(--primary-500)] transition"
                                    style={inputStyle}
                                    aria-label="انتخاب ماه"
                                >
                                    {persianMonths.map(month => (
                                        <option key={month.value} value={month.value}>{month.name}</option>
                                    ))}
                                </select>
                                <select
                                    value={persianYear}
                                    onChange={handleYearChange}
                                    className="flex-grow px-3 py-1.5 border rounded-lg shadow-sm focus:ring-[var(--primary-500)] focus:border-[var(--primary-500)] transition"
                                    style={inputStyle}
                                    aria-label="انتخاب سال"
                                >
                                    {academicYears.map(year => (
                                        <option key={year} value={year}>{toPersianDigits(year)}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-7 gap-1 md:gap-2 text-center text-sm font-semibold text-gray-500 mb-2">
                                {weekdays.map(day => <div key={day}>{day}</div>)}
                            </div>

                            <div className="grid grid-cols-7 gap-1 md:gap-2">
                                {calendarDays.map(({ date, isCurrentMonth }, index) => {
                                    const dateString = date.toLocaleDateString('fa-IR-u-nu-latn', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-');
                                    const record = attendanceMap[dateString];
                                    const dayOfMonth = toPersianDigits(date.toLocaleDateString('fa-IR-u-nu-latn', { day: 'numeric' }));
                                    const isToday = new Date().toDateString() === date.toDateString();
                                    
                                    return (
                                        <div key={index} title={record ? `${toPersianDigits(record.date)}: ${record.status}` : toPersianDigits(dateString)}
                                            onClick={() => record && setSelectedAttendance(record)}
                                            className={`h-12 w-full flex items-center justify-center rounded-lg text-sm font-semibold transition-all duration-200 border ${isCurrentMonth ? getAttendanceColor(record?.status) : 'bg-gray-50 text-gray-300 border-gray-100'} ${isToday && isCurrentMonth ? '!border-[var(--primary-500)] border-2' : ''} ${record ? 'cursor-pointer hover:ring-2 hover:ring-[var(--primary-400)] hover:scale-105' : ''}`}>
                                            {dayOfMonth}
                                        </div>
                                    )
                                })}
                            </div>
                            <div className="mt-4 flex flex-wrap justify-center gap-x-3 gap-y-2 text-xs">
                                {attendanceLegend.map(item => (
                                    <div key={item.status} className="flex items-center gap-1.5">
                                        <span className={`w-3 h-3 rounded-full ${item.color}`}></span>
                                        <span>{item.status}</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="h-[420px] overflow-y-auto pr-2 space-y-2">
                            {sortedAttendance.length > 0 ? (
                                sortedAttendance.map(record => {
                                    const statusInfo = getStatusInfo(record.status);
                                    return (
                                        <button
                                            key={record.id}
                                            onClick={() => setSelectedAttendance(record)}
                                            className={`w-full flex justify-between items-center p-3 rounded-lg text-sm transition-transform hover:scale-[1.02] ${statusInfo.bgColor}`}
                                            aria-label={`مشاهده جزئیات برای ${toPersianDigits(record.date)} با وضعیت ${statusInfo.text}`}
                                        >
                                            <span className="font-semibold text-gray-800">{toPersianDigits(record.date)}</span>
                                            <span className={`font-bold ${statusInfo.color}`}>{statusInfo.text}</span>
                                        </button>
                                    );
                                })
                            ) : (
                                <p className="text-center text-gray-500 flex items-center justify-center h-full">
                                    هیچ رکورد حضور و غیابی ثبت نشده است.
                                </p>
                            )}
                        </div>
                    )}
                </div>
                <div className="mt-4 border-t border-gray-200 pt-3 text-center">
                   <button
                        onClick={() => setAttendanceViewMode(prev => prev === 'calendar' ? 'list' : 'calendar')}
                        className="px-4 py-2 bg-[var(--primary-100)] text-[var(--primary-700)] rounded-md hover:bg-[var(--primary-200)] transition text-sm font-semibold"
                    >
                        {attendanceViewMode === 'calendar' ? 'نمایش همه رکوردها به صورت لیست' : 'نمایش به صورت تقویم'}
                    </button>
                </div>
            </Card>
        </>
    );
};

export default AttendanceSection;