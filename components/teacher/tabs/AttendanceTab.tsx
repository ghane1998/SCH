import React, { useState, useMemo, useEffect } from 'react';
import type { Teacher, Student, SchoolClass, Attendance, AttendanceStatus } from '../../../types';
import { useData, useSettings } from '../../../App';
import Card from '../../common/Card';
import { useSortableData } from '../../common/useSortableData';
import { SortableHeader } from '../../common/SortableHeader';
import DateSelector from '../../common/DateSelector';
import { formatFullName, toPersianDigits } from '../../common/formatters';

type StudentAttendanceData = {
    status: AttendanceStatus;
    minutesLate?: number;
    departureTime?: string;
    isNotified: boolean;
    hasDoctorsNote: boolean;
}

interface AttendanceTabProps {
    teacher: Teacher;
    selectedClass: SchoolClass;
    studentsInClass: Student[];
}

const AttendanceTab: React.FC<AttendanceTabProps> = ({ teacher, selectedClass, studentsInClass }) => {
    const { attendance, saveGroupAttendance, deleteAttendance } = useData();
    const { settings } = useSettings();

    const [date, setDate] = useState({ year: '', month: '', day: '' });
    const [attendanceData, setAttendanceData] = useState<Record<string, StudentAttendanceData>>({});

    // States for history filter
    const [studentFilter, setStudentFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const academicYears = useMemo(() => {
        const year = settings.academicYear;
        const currentYear = new Date().toLocaleDateString('fa-IR-u-nu-latn').split('/')[0];
        if (year.includes('-')) {
            const parts = year.split('-').map(y => y.trim());
            if (parts.length === 2 && !isNaN(parseInt(parts[0])) && !isNaN(parseInt(parts[1]))) {
                const start = parseInt(parts[0]);
                const end = parseInt(parts[1]);
                const years = [];
                for (let i = start; i <= end; i++) {
                    years.push(String(i));
                }
                if (!years.includes(currentYear)) years.push(currentYear);
                return years;
            }
        }
        const years = year ? [year.trim()] : [];
        if (!years.includes(currentYear)) years.push(currentYear);
        return years;
    }, [settings.academicYear]);

    const { items: sortedStudents } = useSortableData(studentsInClass, [{ key: 'lastName', direction: 'ascending' }, { key: 'firstName', direction: 'ascending' }]);
    
    const inputStyle = {
      backgroundColor: 'var(--input-bg)',
      borderColor: 'var(--input-border)',
      color: 'var(--text-primary)'
    };

    useEffect(() => {
        const [y, m, d] = new Date().toLocaleDateString('fa-IR-u-nu-latn').replace(/\//g, '-').split('-');
        setDate({ year: academicYears.includes(y) ? y : (academicYears[0] || ''), month: String(parseInt(m, 10)), day: String(parseInt(d, 10)) });
    }, [academicYears]);
    
    useEffect(() => {
        const initialData: Record<string, StudentAttendanceData> = {};
        if (!date.year || !date.month || !date.day) return;
        const selectedDate = `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
        
        sortedStudents.forEach(student => {
            const existing = attendance.find(r => r.studentId === student.id && r.date === selectedDate);
            if (existing) {
                initialData[student.id] = {
                    status: existing.status,
                    minutesLate: existing.minutesLate,
                    departureTime: existing.departureTime,
                    isNotified: existing.isNotified,
                    hasDoctorsNote: existing.hasDoctorsNote,
                };
            } else {
                initialData[student.id] = {
                    status: 'حاضر',
                    isNotified: false,
                    hasDoctorsNote: false,
                };
            }
        });
        setAttendanceData(initialData);
    }, [sortedStudents, attendance, date.year, date.month, date.day]);

    const handleDataChange = (studentId: string, field: keyof StudentAttendanceData, value: any) => {
        setAttendanceData(prev => {
            const studentData = { ...prev[studentId], [field]: value } as StudentAttendanceData;
            
            if (field === 'hasDoctorsNote' && value === true && studentData.status === 'غیرموجه') {
                studentData.status = 'موجه';
            }
            if (field === 'status') {
                if (value !== 'تاخیر') studentData.minutesLate = undefined;
                if (value !== 'خروج') studentData.departureTime = undefined;
            }
            return {
                ...prev,
                [studentId]: studentData,
            };
        });
    };
    
    const applyToAll = (status: AttendanceStatus) => {
        const newAttendanceData: Record<string, StudentAttendanceData> = {};
        sortedStudents.forEach(student => {
            newAttendanceData[student.id] = {
                ...(attendanceData[student.id] || { status: 'حاضر', isNotified: false, hasDoctorsNote: false }),
                status: status,
            }
        });
        setAttendanceData(newAttendanceData);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!date.year || !date.month || !date.day) {
            alert('لطفا تاریخ را به صورت کامل مشخص کنید.');
            return;
        }
        const formattedDate = `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
        const newRecords: Attendance[] = Object.entries(attendanceData).map(([studentId, data]) => ({
            id: `att-${Date.now()}-${studentId}`,
            studentId,
            date: formattedDate,
            status: data.status,
            minutesLate: data.status === 'تاخیر' ? (data.minutesLate || 0) : undefined,
            departureTime: data.status === 'خروج' ? (data.departureTime || '') : undefined,
            isNotified: data.isNotified,
            hasDoctorsNote: data.hasDoctorsNote,
            recordedBy: teacher.id,
        }));
        saveGroupAttendance(newRecords);
        alert('حضور و غیاب با موفقیت ثبت شد.');
    };

    const classAttendanceHistory = useMemo(() => {
        const studentIds = new Set(studentsInClass.map(s => s.id));
        let history = attendance
            .filter(a => studentIds.has(a.studentId))
            .map(a => ({...a, student: studentsInClass.find(s => s.id === a.studentId)}));

        if (studentFilter) {
            history = history.filter(a => a.student && formatFullName(a.student).toLowerCase().includes(studentFilter.toLowerCase()));
        }
        if (statusFilter !== 'all') {
            history = history.filter(a => a.status === statusFilter);
        }

        return history;
    }, [attendance, studentsInClass, studentFilter, statusFilter]);
    
    const { items: sortedHistory, requestSort, sortConfig } = useSortableData(classAttendanceHistory, [{key: 'date', direction: 'descending'}]);

    const handleEditHistory = (record: Attendance) => {
        const [y, m, d] = record.date.split('-');
        setDate({ year: y, month: String(parseInt(m,10)), day: String(parseInt(d,10)) });
        alert(`فرم به تاریخ ${record.date} برای ویرایش تنظیم شد. پس از اصلاح، دکمه ذخیره را بزنید.`);
    };

    return (
        <div className="space-y-6">
            <Card title={`حضور و غیاب کلاس ${selectedClass.name}`}>
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div className="flex flex-col md:flex-row gap-4 items-center border-b pb-4">
                        <div className="flex-grow w-full md:w-auto">
                             <label className="block text-sm font-medium text-[var(--text-secondary)]">تاریخ</label>
                              <DateSelector
                                prefix="group-att"
                                year={date.year}
                                month={date.month}
                                day={date.day}
                                onYearChange={(y) => setDate(prev => ({...prev, year: y}))}
                                onMonthChange={(m) => setDate(prev => ({...prev, month: m}))}
                                onDayChange={(d) => setDate(prev => ({...prev, day: d}))}
                                years={academicYears}
                                className="mt-1"
                            />
                        </div>
                        <div className="self-end flex gap-2">
                            <button type="button" onClick={() => applyToAll('حاضر')} className="px-3 py-2 text-sm bg-green-500 text-white rounded-md hover:bg-green-600 transition">همه حاضر</button>
                            <button type="button" onClick={() => applyToAll('غیرموجه')} className="px-3 py-2 text-sm bg-red-500 text-white rounded-md hover:bg-red-600 transition">همه غایب</button>
                        </div>
                    </div>

                    <div className="overflow-y-auto max-h-[50vh]">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {sortedStudents.map(student => {
                                const studentAttData = attendanceData[student.id];
                                if (!studentAttData) return null;
                                return (
                                    <div key={student.id} className="p-3 bg-gray-50 rounded-lg border space-y-2">
                                        <p className="font-semibold text-center pb-2 border-b">{formatFullName(student)}</p>
                                        <select 
                                            value={studentAttData.status || 'حاضر'}
                                            onChange={e => handleDataChange(student.id, 'status', e.target.value as AttendanceStatus)}
                                            className="w-full p-1 border rounded-md text-sm" 
                                            style={inputStyle}
                                        >
                                            <option value="حاضر">حاضر</option>
                                            <option value="غیرموجه">غیبت غیرموجه</option>
                                            <option value="تاخیر">تاخیر</option>
                                        </select>
                                         {studentAttData.status === 'تاخیر' && (
                                            <input
                                                type="number"
                                                placeholder="دقایق تاخیر"
                                                value={studentAttData.minutesLate || ''}
                                                onChange={e => handleDataChange(student.id, 'minutesLate', parseInt(e.target.value))}
                                                className="w-full p-1 border rounded-md text-sm" style={inputStyle}
                                            />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                     <div className="flex justify-end gap-4 pt-4 border-t">
                        <button type="submit" className="px-6 py-2 bg-[var(--primary-600)] text-white rounded-md hover:bg-[var(--primary-700)] transition">ذخیره حضور و غیاب</button>
                    </div>
                </form>
            </Card>

            <Card title="تاریخچه حضور و غیاب">
                <div className="p-4 border-b flex flex-col md:flex-row gap-4">
                    <input 
                        type="text"
                        placeholder="جستجوی دانش آموز..."
                        value={studentFilter}
                        onChange={e => setStudentFilter(e.target.value)}
                        className="w-full md:w-1/2 px-3 py-2 border rounded-lg"
                    />
                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        className="w-full md:w-1/2 px-3 py-2 border rounded-lg"
                    >
                        <option value="all">همه وضعیت‌ها</option>
                        <option value="حاضر">حاضر</option>
                        <option value="غیرموجه">غیبت غیرموجه</option>
                        <option value="تاخیر">تاخیر</option>
                    </select>
                </div>
                <div className="overflow-x-auto max-h-96">
                    <table className="w-full text-sm text-right">
                        <thead className="bg-gray-50 sticky top-0">
                            <tr>
                                {/* FIX: Add missing children prop */}
                                <SortableHeader sortKey="date" requestSort={requestSort} sortConfig={sortConfig}>تاریخ</SortableHeader>
                                <th className="px-4 py-3">دانش آموز</th>
                                {/* FIX: Add missing children prop */}
                                <SortableHeader sortKey="status" requestSort={requestSort} sortConfig={sortConfig}>وضعیت</SortableHeader>
                                <th className="px-4 py-3">اقدامات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {sortedHistory.map(record => (
                                <tr key={record.id}>
                                    <td className="px-4 py-2">{toPersianDigits(record.date)}</td>
                                    <td className="px-4 py-2">{formatFullName(record.student)}</td>
                                    <td className="px-4 py-2 font-semibold">{record.status}</td>
                                    <td className="px-4 py-2 text-xs space-x-2 space-x-reverse">
                                        {record.recordedBy === teacher.id && (
                                            <>
                                                <button onClick={() => handleEditHistory(record)} className="font-medium text-blue-600 hover:underline">ویرایش</button>
                                                <button onClick={() => deleteAttendance(record.id)} className="font-medium text-red-600 hover:underline">حذف</button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                     {sortedHistory.length === 0 && <p className="text-center py-8 text-gray-500">موردی با این فیلتر یافت نشد.</p>}
                </div>
            </Card>
        </div>
    );
};

export default AttendanceTab;
