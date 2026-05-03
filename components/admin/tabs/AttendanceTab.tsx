

import React, { useMemo, useState, useEffect } from 'react';
import type { Attendance, Student, SchoolClass, Teacher, AttendanceStatus, Admin } from '../../../types';
import { useSortableData } from '../../common/useSortableData';
import { SortableHeader } from '../../common/SortableHeader';
import { formatFullName, toPersianDigits } from '../../common/formatters';
import DateSelector from '../../common/DateSelector';

// #region Helper Components
const ThemedInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
    <input 
        {...props} 
        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[var(--primary-500)] focus:border-[var(--primary-500)] ${props.className}`} 
        style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)', ...props.style }}
    />
);
const ThemedSelect: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
    <select 
        {...props} 
        className={`w-full pl-3 pr-10 py-2 text-base border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[var(--primary-500)] focus:border-[var(--primary-500)] ${props.className}`}
        style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)', ...props.style }}
    >{props.children}</select>
);
const ChevronIcon = ({ direction = 'down', className = 'h-6 w-6 text-gray-500' }: { direction: 'up' | 'down', className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`${className} transition-transform duration-300 ${direction === 'up' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
);
// #endregion

// #region Modals
interface AttendanceRecordModalProps {
    recordToEdit: Attendance | null;
    students: Student[];
    teachers: Teacher[];
    admins: Admin[];
    onClose: () => void;
    onSubmit: (record: Attendance) => void;
    years: string[];
}
const AttendanceRecordModal: React.FC<AttendanceRecordModalProps> = ({ recordToEdit, students, teachers, admins, onClose, onSubmit, years }) => {
    const [studentId, setStudentId] = useState('');
    const [date, setDate] = useState({ year: '', month: '', day: '' });
    const [status, setStatus] = useState<AttendanceStatus>('حاضر');
    const [minutesLate, setMinutesLate] = useState<number | undefined>();
    const [departureTime, setDepartureTime] = useState<string | undefined>();
    const [isNotified, setIsNotified] = useState(false);
    const [hasDoctorsNote, setHasDoctorsNote] = useState(false);
    const [recordedBy, setRecordedBy] = useState('');
    
    const [searchTerm, setSearchTerm] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const filteredStudents = useMemo(() => {
        if (!searchTerm) return [];
        const term = searchTerm.toLowerCase();
        return students.filter(s =>
            formatFullName(s).toLowerCase().includes(term) ||
            s.className.toLowerCase().includes(term)
        );
    }, [searchTerm, students]);
    
    useEffect(() => {
        if(recordToEdit) {
            setStudentId(recordToEdit.studentId);
            const student = students.find(s => s.id === recordToEdit.studentId);
            if(student) {
                setSearchTerm(formatFullName(student));
            }
            const [y, m, d] = recordToEdit.date.split('-');
            setDate({ year: y, month: String(parseInt(m,10)), day: String(parseInt(d,10))});
            setStatus(recordToEdit.status);
            setMinutesLate(recordToEdit.minutesLate);
            setDepartureTime(recordToEdit.departureTime);
            setIsNotified(recordToEdit.isNotified);
            setHasDoctorsNote(recordToEdit.hasDoctorsNote);
            setRecordedBy(recordToEdit.recordedBy);
        } else {
            // Reset state for new record
            setStudentId('');
            setSearchTerm('');
            setDate({ year: '', month: '', day: '' });
            setStatus('حاضر');
            setMinutesLate(undefined);
            setDepartureTime(undefined);
            setIsNotified(false);
            setHasDoctorsNote(false);
            setRecordedBy('');
        }
    }, [recordToEdit, students]);

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const isChecked = e.target.checked;
        setHasDoctorsNote(isChecked);
        if (isChecked && status === 'غیرموجه') {
            setStatus('موجه');
        }
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!studentId || !date.year || !date.month || !date.day) {
            alert('لطفا دانش آموز و تاریخ را انتخاب کنید.');
            return;
        }

        onSubmit({
            id: recordToEdit ? recordToEdit.id : `att-${Date.now()}`,
            studentId,
            date: `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`,
            status,
            minutesLate: status === 'تاخیر' ? minutesLate : undefined,
            departureTime: status === 'خروج' ? departureTime : undefined,
            isNotified,
            hasDoctorsNote,
            recordedBy: recordedBy || (admins.length > 0 ? admins[0].id : ''),
        });
    };

    const allRecorders = [...teachers, ...admins];
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg relative" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-4 text-[var(--text-primary)]">{recordToEdit ? 'ویرایش' : 'افزودن'} رکورد حضور و غیاب</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative">
                        <label className="block text-sm font-medium text-[var(--text-secondary)]">دانش آموز</label>
                        <ThemedInput
                            type="text"
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setIsDropdownOpen(true); if (e.target.value === '') setStudentId(''); }}
                            onFocus={() => setIsDropdownOpen(true)}
                            onBlur={() => setTimeout(() => setIsDropdownOpen(false), 150)}
                            placeholder="جستجوی نام دانش آموز..."
                            required={!studentId}
                            autoComplete="off"
                        />
                        {isDropdownOpen && filteredStudents.length > 0 && (
                            <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                <ul>
                                    {filteredStudents.map(s => (
                                        <li key={s.id}
                                            className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                                            onClick={() => { setStudentId(s.id); setSearchTerm(formatFullName(s)); setIsDropdownOpen(false); }}>
                                            {formatFullName(s)} - <span className="text-gray-500">{s.className}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                     <div className="relative"><label className="block text-sm font-medium text-[var(--text-secondary)]">تاریخ</label><DateSelector prefix="att" year={date.year} month={date.month} day={date.day} onYearChange={(y) => setDate(prev => ({...prev, year: y}))} onMonthChange={(m) => setDate(prev => ({...prev, month: m}))} onDayChange={(d) => setDate(prev => ({...prev, day: d}))} years={years} /></div>
                    <ThemedSelect value={status} onChange={e => setStatus(e.target.value as AttendanceStatus)}>
                        <option value="حاضر">حاضر</option>
                        <option value="غیرموجه">غیرموجه</option>
                        <option value="موجه">موجه</option>
                        <option value="تاخیر">تاخیر</option>
                        <option value="خروج">خروج</option>
                    </ThemedSelect>
                    {status === 'تاخیر' && <div><label>دقایق تاخیر</label><ThemedInput type="number" value={minutesLate || ''} onChange={e => setMinutesLate(e.target.value ? parseInt(e.target.value, 10) : undefined)} /></div>}
                    {status === 'خروج' && <div><label>ساعت خروج</label><ThemedInput type="time" value={departureTime || ''} onChange={e => setDepartureTime(e.target.value)} /></div>}
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2"><input type="checkbox" checked={isNotified} onChange={e => setIsNotified(e.target.checked)} /> اطلاع داده شده؟</label>
                        {(status === 'موجه' || status === 'غیرموجه') && <label className="flex items-center gap-2"><input type="checkbox" checked={hasDoctorsNote} onChange={handleCheckboxChange} /> گواهی پزشکی</label>}
                    </div>
                     <div className="relative"><label className="block text-sm font-medium text-[var(--text-secondary)]">ثبت توسط</label><ThemedSelect value={recordedBy} onChange={e => setRecordedBy(e.target.value)}><option value="">(مدیریت)</option>{allRecorders.map(r => <option key={r.id} value={r.id}>{formatFullName(r)}</option>)}</ThemedSelect></div>

                     <div className="flex justify-end gap-4 pt-4 relative">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition">انصراف</button>
                        <button type="submit" className="px-4 py-2 bg-[var(--primary-600)] text-white rounded-md hover:bg-[var(--primary-700)] transition">{recordToEdit ? 'ذخیره' : 'افزودن'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

interface GroupAttendanceModalProps {
    classes: SchoolClass[];
    students: Student[];
    admins: Admin[];
    onClose: () => void;
    onSubmit: (newRecords: Attendance[]) => void;
    years: string[];
}
const GroupAttendanceModal: React.FC<GroupAttendanceModalProps> = ({ classes, students, admins, onClose, onSubmit, years }) => {
    const [selectedClassId, setSelectedClassId] = useState<string>('');
    const [date, setDate] = useState({ year: '', month: '', day: '' });
    const [attendanceData, setAttendanceData] = useState<Record<string, { status: AttendanceStatus, minutesLate?: number }>>({});

    const studentsToDisplay = useMemo(() => {
        if (!selectedClassId) return [];
        return students.filter(s => s.classId === selectedClassId);
    }, [students, selectedClassId]);

    const handleDataChange = (studentId: string, field: 'status' | 'minutesLate', value: any) => {
        setAttendanceData(prev => ({
            ...prev,
            [studentId]: {
                ...(prev[studentId] || { status: 'حاضر' }),
                [field]: value
            }
        }));
    };
    
    const applyToAll = (status: AttendanceStatus) => {
        const newData: Record<string, { status: AttendanceStatus, minutesLate?: number }> = {};
        studentsToDisplay.forEach(student => {
            newData[student.id] = { status };
        });
        setAttendanceData(newData);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedClassId || !date.year) {
            alert('لطفا کلاس و تاریخ را انتخاب کنید.');
            return;
        }
        const newRecords = studentsToDisplay.map(student => ({
            id: `att-group-${Date.now()}-${student.id}`,
            studentId: student.id,
            date: `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`,
            status: attendanceData[student.id]?.status || 'حاضر',
            minutesLate: attendanceData[student.id]?.status === 'تاخیر' ? attendanceData[student.id]?.minutesLate : undefined,
            isNotified: false,
            hasDoctorsNote: false,
            recordedBy: admins.length > 0 ? admins[0].id : ''
        }));
        onSubmit(newRecords);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-4">ثبت گروهی حضور و غیاب</h2>
                <form onSubmit={handleSubmit} className="flex-grow flex flex-col min-h-0">
                    <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-6 min-h-0">
                        {/* Left Column: Form Details */}
                        <div className="flex flex-col space-y-4">
                           <DateSelector prefix="g-att" year={date.year} month={date.month} day={date.day} onYearChange={y=>setDate(p=>({...p, year: y}))} onMonthChange={m=>setDate(p=>({...p, month: m}))} onDayChange={d=>setDate(p=>({...p, day: d}))} years={years} />
                           <ThemedSelect value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)}>
                                <option value="">انتخاب کلاس...</option>
                                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                           </ThemedSelect>
                           <div className="flex gap-2">
                               <button type="button" onClick={() => applyToAll('حاضر')} className="w-full px-4 py-2 bg-green-500 text-white rounded-md">همه حاضر</button>
                               <button type="button" onClick={() => applyToAll('غیرموجه')} className="w-full px-4 py-2 bg-red-500 text-white rounded-md">همه غایب</button>
                           </div>
                        </div>
                        {/* Right Column: Student List */}
                        <div className="overflow-y-auto flex-grow border rounded-md mt-2 p-2">
                            <table className="w-full text-sm">
                                <thead><tr><th className="p-2 text-right">دانش آموز</th><th className="p-2 text-right">وضعیت</th><th className="p-2 text-right">جزئیات</th></tr></thead>
                                <tbody>{studentsToDisplay.map(s => (
                                    <tr key={s.id}>
                                        <td>{formatFullName(s)}</td>
                                        <td><ThemedSelect value={attendanceData[s.id]?.status || 'حاضر'} onChange={e => handleDataChange(s.id, 'status', e.target.value)}>
                                            <option value="حاضر">حاضر</option><option value="غیرموجه">غیرموجه</option><option value="موجه">موجه</option><option value="تاخیر">تاخیر</option><option value="خروج">خروج</option>
                                        </ThemedSelect></td>
                                        <td>{attendanceData[s.id]?.status === 'تاخیر' && <ThemedInput type="number" placeholder="دقایق" value={attendanceData[s.id]?.minutesLate || ''} onChange={e => handleDataChange(s.id, 'minutesLate', parseInt(e.target.value))} />}</td>
                                    </tr>
                                ))}</tbody>
                            </table>
                        </div>
                    </div>
                     <div className="flex justify-end gap-4 pt-4 border-t mt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition">انصراف</button>
                        <button type="submit" className="px-4 py-2 bg-[var(--primary-600)] text-white rounded-md hover:bg-[var(--primary-700)] transition">ذخیره</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

interface ReportDetailModalProps {
    data: { studentName: string; dates: string[]; status: string };
    onClose: () => void;
}
const ReportDetailModal: React.FC<ReportDetailModalProps> = ({ data, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold mb-4">جزئیات گزارش برای {data.studentName}</h3>
                <p className="mb-3">لیست تاریخ‌های ثبت شده برای وضعیت <span className="font-semibold">{data.status}</span>:</p>
                <div className="max-h-60 overflow-y-auto bg-gray-50 p-3 rounded-md border">
                    <ul className="list-disc pr-5 space-y-1">
                        {data.dates.map(date => (
                            <li key={date} className="font-mono text-sm">{toPersianDigits(date)}</li>
                        ))}
                    </ul>
                </div>
                <div className="mt-6 text-right">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition">بستن</button>
                </div>
            </div>
        </div>
    );
};
// #endregion

interface AttendanceTabProps {
    attendance: Attendance[];
    students: Student[];
    teachers: Teacher[];
    admins: Admin[];
    classes: SchoolClass[];
    years: string[];
    saveAttendance: (record: Attendance) => void;
    deleteAttendance: (id: string) => void;
    saveGroupAttendance: (records: Attendance[]) => void;
}

type EnrichedAttendance = Attendance & { studentName: string; className: string; teacherName: string; firstName: string; lastName: string; };

const AttendanceTab: React.FC<AttendanceTabProps> = (props) => {
    const { attendance, students, teachers, admins, classes, years, saveAttendance, deleteAttendance, saveGroupAttendance } = props;
    
    const [studentNameFilter, setStudentNameFilter] = useState('');
    const [classFilter, setClassFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [startDate, setStartDate] = useState({ year: '', month: '', day: '' });
    const [endDate, setEndDate] = useState({ year: '', month: '', day: '' });
    const [activeModal, setActiveModal] = useState<'add_edit' | 'group' | null>(null);
    const [recordToEdit, setRecordToEdit] = useState<Attendance | null>(null);
    const [isFilterVisible, setIsFilterVisible] = useState(true);

    const [isReportSectionVisible, setIsReportSectionVisible] = useState(true);
    const [reportFilters, setReportFilters] = useState({
        status: 'غیرموجه' as AttendanceStatus,
        count: 2,
        startDate: { year: '', month: '', day: '' },
        endDate: { year: '', month: '', day: '' },
    });
    const [reportResults, setReportResults] = useState<{ studentId: string; studentName: string; className: string; firstName: string; lastName: string; count: number; dates: string[] }[]>([]);
    const [detailModalData, setDetailModalData] = useState<{ studentName: string; dates: string[]; status: string } | null>(null);

    const allRecorders = useMemo(() => [...teachers, ...admins], [teachers, admins]);

    const enrichedAttendance = useMemo(() => {
        return attendance.map(a => {
            const student = students.find(s => s.id === a.studentId);
            const teacher = allRecorders.find(t => t.id === a.recordedBy);
            return {
                ...a,
                studentName: student ? formatFullName(student) : 'حذف شده',
                className: student?.className || 'نامشخص',
                firstName: student?.firstName || '',
                lastName: student?.lastName || '',
                teacherName: teacher ? formatFullName(teacher) : 'سیستم',
            };
        });
    }, [attendance, students, allRecorders]);

    const startDateFilter = useMemo(() => startDate.year ? `${startDate.year}-${String(startDate.month).padStart(2, '0')}-${String(startDate.day).padStart(2, '0')}` : '', [startDate]);
    const endDateFilter = useMemo(() => endDate.year ? `${endDate.year}-${String(endDate.month).padStart(2, '0')}-${String(endDate.day).padStart(2, '0')}` : '', [endDate]);

    const filteredAttendance = useMemo(() => {
        return enrichedAttendance.filter(rec =>
            (studentNameFilter ? rec.studentName.toLowerCase().includes(studentNameFilter.toLowerCase()) : true) &&
            (classFilter ? rec.className === classes.find(c => c.id === classFilter)?.name : true) &&
            (statusFilter ? rec.status === statusFilter : true) &&
            (startDateFilter ? rec.date >= startDateFilter : true) &&
            (endDateFilter ? rec.date <= endDateFilter : true)
        );
    }, [enrichedAttendance, studentNameFilter, classFilter, statusFilter, startDateFilter, endDateFilter, classes]);

    const { items: sortedAttendance, requestSort, sortConfig } = useSortableData(filteredAttendance, [{ key: 'date', direction: 'descending' }, { key: 'lastName', direction: 'ascending' }]);
    
    const handleAdd = () => { setRecordToEdit(null); setActiveModal('add_edit'); };
    const handleEdit = (record: Attendance) => { setRecordToEdit(record); setActiveModal('add_edit'); };
    const handleGroupAdd = () => setActiveModal('group');
    const closeModal = () => { setActiveModal(null); setRecordToEdit(null); };
    const handleClearFilters = () => {
        setStudentNameFilter(''); setClassFilter(''); setStatusFilter('');
        setStartDate({ year: '', month: '', day: '' }); setEndDate({ year: '', month: '', day: '' });
    };
    
    const handleStatusChangeInTable = (record: EnrichedAttendance, newStatus: AttendanceStatus) => {
        const updatedRecord: Attendance = {
            id: record.id,
            studentId: record.studentId,
            date: record.date,
            status: newStatus,
            minutesLate: newStatus === 'تاخیر' ? record.minutesLate : undefined,
            departureTime: newStatus === 'خروج' ? record.departureTime : undefined,
            isNotified: record.isNotified,
            hasDoctorsNote: (newStatus === 'موجه' || newStatus === 'غیرموجه') ? record.hasDoctorsNote : false,
            recordedBy: record.recordedBy,
        };
        saveAttendance(updatedRecord);
    };

    const handleHasDoctorsNoteChange = (record: EnrichedAttendance, checked: boolean) => {
        const updatedRecord: Attendance = {
            id: record.id,
            studentId: record.studentId,
            date: record.date,
            status: record.status,
            minutesLate: record.minutesLate,
            departureTime: record.departureTime,
            isNotified: record.isNotified,
            hasDoctorsNote: checked,
            recordedBy: record.recordedBy,
        };
        if (checked && updatedRecord.status === 'غیرموجه') {
            updatedRecord.status = 'موجه';
        }
        saveAttendance(updatedRecord);
    };

    const handleReportFilterChange = (field: keyof typeof reportFilters, value: any) => {
        setReportFilters(prev => ({ ...prev, [field]: value }));
    };

    const handleGenerateReport = () => {
        const { status, count, startDate, endDate } = reportFilters;
        
        const startDateStr = startDate.year ? `${startDate.year}-${String(startDate.month).padStart(2, '0')}-${String(startDate.day).padStart(2, '0')}` : '';
        const endDateStr = endDate.year ? `${endDate.year}-${String(endDate.month).padStart(2, '0')}-${String(endDate.day).padStart(2, '0')}` : '9999-99-99';

        const results: { studentId: string, studentName: string, className: string, firstName: string, lastName: string, count: number, dates: string[] }[] = [];

        students.forEach(student => {
            const studentIncidents = attendance.filter(a => 
                a.studentId === student.id &&
                a.status === status &&
                (startDateStr ? a.date >= startDateStr : true) &&
                a.date <= endDateStr
            );

            if (studentIncidents.length > count) {
                results.push({
                    studentId: student.id,
                    studentName: formatFullName(student),
                    className: student.className,
                    firstName: student.firstName,
                    lastName: student.lastName,
                    count: studentIncidents.length,
                    dates: studentIncidents.map(a => a.date).sort((a,b) => b.localeCompare(a, 'fa-IR')),
                });
            }
        });
        
        setReportResults(results);
    };
    
    const { items: sortedReportResults, requestSort: requestSortReport, sortConfig: sortConfigReport } = useSortableData(reportResults, [{ key: 'count', direction: 'descending' }]);


    return (
        <>
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold">مدیریت حضور و غیاب</h2>
                    <div className="flex gap-2">
                        <button onClick={handleGroupAdd} className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition text-sm">ثبت گروهی</button>
                        <button onClick={handleAdd} className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition text-sm">افزودن رکورد</button>
                    </div>
                </div>

                <div className="bg-white rounded-lg border shadow-md">
                    <button className="w-full flex justify-between items-center p-4" onClick={() => setIsReportSectionVisible(!isReportSectionVisible)}>
                        <h3 className="text-lg font-semibold text-gray-800">گزارش گیری حضور و غیاب</h3>
                        <ChevronIcon direction={isReportSectionVisible ? 'up' : 'down'} className="text-gray-700" />
                    </button>
                    <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isReportSectionVisible ? 'max-h-[1500px] p-4 pt-0' : 'max-h-0'}`}>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end pt-4 border-t">
                            <div>
                                <label className="text-sm font-medium text-gray-700">وضعیت</label>
                                <ThemedSelect value={reportFilters.status} onChange={e => handleReportFilterChange('status', e.target.value)}>
                                    <option value="غیرموجه">غیبت غیرموجه</option>
                                    <option value="موجه">غیبت موجه</option>
                                    <option value="تاخیر">تاخیر</option>
                                    <option value="خروج">خروج زودهنگام</option>
                                </ThemedSelect>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">بیشتر از (تعداد)</label>
                                <ThemedInput type="number" min="0" value={reportFilters.count} onChange={e => handleReportFilterChange('count', Number(e.target.value))} />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">از تاریخ (اختیاری)</label>
                                <DateSelector prefix="rep-start" years={years}
                                    year={reportFilters.startDate.year} month={reportFilters.startDate.month} day={reportFilters.startDate.day}
                                    onYearChange={y=>handleReportFilterChange('startDate', {...reportFilters.startDate, year:y})}
                                    onMonthChange={m=>handleReportFilterChange('startDate', {...reportFilters.startDate, month:m})}
                                    onDayChange={d=>handleReportFilterChange('startDate', {...reportFilters.startDate, day:d})}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">تا تاریخ (اختیاری)</label>
                                <DateSelector prefix="rep-end" years={years}
                                    year={reportFilters.endDate.year} month={reportFilters.endDate.month} day={reportFilters.endDate.day}
                                    onYearChange={y=>handleReportFilterChange('endDate', {...reportFilters.endDate, year:y})}
                                    onMonthChange={m=>handleReportFilterChange('endDate', {...reportFilters.endDate, month:m})}
                                    onDayChange={d=>handleReportFilterChange('endDate', {...reportFilters.endDate, day:d})}
                                />
                            </div>
                            <div className="lg:col-span-4">
                                <button onClick={handleGenerateReport} className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition font-semibold">ایجاد گزارش</button>
                            </div>
                        </div>

                        {reportResults.length > 0 && (
                            <div className="mt-6 border-t pt-4">
                                <h4 className="font-semibold mb-2">نتایج گزارش ({toPersianDigits(reportResults.length)} دانش آموز)</h4>
                                <div className="overflow-x-auto max-h-96">
                                    <table className="w-full text-sm text-right">
                                        <thead className="bg-gray-100 sticky top-0">
                                            <tr>
                                                <SortableHeader sortKey="lastName" requestSort={requestSortReport} sortConfig={sortConfigReport}>دانش آموز</SortableHeader>
                                                <SortableHeader sortKey="className" requestSort={requestSortReport} sortConfig={sortConfigReport}>کلاس</SortableHeader>
                                                <SortableHeader sortKey="count" requestSort={requestSortReport} sortConfig={sortConfigReport}>تعداد موارد</SortableHeader>
                                                <th className="px-4 py-3">اقدامات</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {sortedReportResults.map(res => (
                                                <tr key={res.studentId}>
                                                    <td className="px-4 py-3 font-semibold">{res.studentName}</td>
                                                    <td className="px-4 py-3">{res.className}</td>
                                                    <td className="px-4 py-3 font-bold text-red-600 text-center">{toPersianDigits(res.count)}</td>
                                                    <td className="px-4 py-3">
                                                        <button onClick={() => setDetailModalData({ studentName: res.studentName, dates: res.dates, status: reportFilters.status })} className="text-xs text-blue-600 hover:underline">مشاهده جزئیات</button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                         {reportResults.length === 0 && (
                            <div className="mt-6 border-t pt-4 text-center text-gray-500 text-sm">
                                برای مشاهده نتایج، گزارش را ایجاد کنید.
                            </div>
                         )}
                    </div>
                </div>

                <div className="bg-gray-50 rounded-lg border">
                    <button className="w-full flex justify-between items-center p-4" onClick={() => setIsFilterVisible(!isFilterVisible)}>
                        <h3 className="text-lg font-semibold text-gray-700">فیلتر لیست کلی</h3>
                        <ChevronIcon direction={isFilterVisible ? 'up' : 'down'} />
                    </button>
                    <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isFilterVisible ? 'max-h-[500px] p-4 pt-0' : 'max-h-0'}`}>
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end pt-4 border-t">
                            <ThemedInput placeholder="جستجوی نام دانش آموز..." value={studentNameFilter} onChange={e => setStudentNameFilter(e.target.value)} />
                            <ThemedSelect value={classFilter} onChange={e => setClassFilter(e.target.value)}><option value="">همه کلاس‌ها</option>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</ThemedSelect>
                            <ThemedSelect value={statusFilter} onChange={e => setStatusFilter(e.target.value)}><option value="">همه وضعیت‌ها</option><option>حاضر</option><option>غیرموجه</option><option>موجه</option><option>تاخیر</option><option>خروج</option></ThemedSelect>
                            <div><label className="text-sm">از تاریخ</label><DateSelector prefix="start-filter" year={startDate.year} month={startDate.month} day={startDate.day} onYearChange={y=>setStartDate(p=>({...p, year: y}))} onMonthChange={m=>setStartDate(p=>({...p, month: m}))} onDayChange={d=>setStartDate(p=>({...p, day: d}))} years={years} /></div>
                            <div><label className="text-sm">تا تاریخ</label><DateSelector prefix="end-filter" year={endDate.year} month={endDate.month} day={endDate.day} onYearChange={y=>setEndDate(p=>({...p, year: y}))} onMonthChange={m=>setEndDate(p=>({...p, month: m}))} onDayChange={d=>setEndDate(p=>({...p, day: d}))} years={years} /></div>
                            <button onClick={handleClearFilters} className="px-4 py-2 text-sm bg-gray-200 hover:bg-gray-300 rounded-md h-10">پاک کردن فیلترها</button>
                         </div>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right bg-white rounded-lg shadow-md">
                        <thead className="bg-gray-50">
                            <tr>
                                <SortableHeader sortKey="lastName" requestSort={requestSort} sortConfig={sortConfig}>نام خانوادگی</SortableHeader>
                                <SortableHeader sortKey="firstName" requestSort={requestSort} sortConfig={sortConfig}>نام</SortableHeader>
                                <SortableHeader sortKey="date" requestSort={requestSort} sortConfig={sortConfig}>تاریخ</SortableHeader>
                                <SortableHeader sortKey="status" requestSort={requestSort} sortConfig={sortConfig}>وضعیت</SortableHeader>
                                <th className="px-4 py-3 text-center">جزئیات</th>
                                <SortableHeader sortKey="teacherName" requestSort={requestSort} sortConfig={sortConfig}>ثبت توسط</SortableHeader>
                                <th className="px-4 py-3 text-center">اطلاع؟</th>
                                <th className="px-4 py-3 text-center">گواهی؟</th>
                                <th className="px-4 py-3">اقدامات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {sortedAttendance.map(rec => (
                                <tr key={rec.id}>
                                    <td className="px-4 py-3 font-semibold">{rec.lastName}</td>
                                    <td className="px-4 py-3 font-semibold">{rec.firstName}</td>
                                    <td className="px-4 py-3">{toPersianDigits(rec.date)}</td>
                                    <td className="px-4 py-3">
                                        <ThemedSelect
                                            value={rec.status}
                                            onChange={(e) => handleStatusChangeInTable(rec, e.target.value as AttendanceStatus)}
                                            className="text-sm p-1 w-full"
                                        >
                                            <option value="حاضر">حاضر</option>
                                            <option value="غیرموجه">غیرموجه</option>
                                            <option value="موجه">موجه</option>
                                            <option value="تاخیر">تاخیر</option>
                                            <option value="خروج">خروج</option>
                                        </ThemedSelect>
                                    </td>
                                    <td className="px-4 py-3 text-xs">{rec.minutesLate ? `${toPersianDigits(rec.minutesLate)} دقیقه تاخیر` : ''}{rec.departureTime ? `خروج ${toPersianDigits(rec.departureTime)}` : ''}</td>
                                    <td className="px-4 py-3">{rec.teacherName}</td>
                                    <td className="px-4 py-3 text-center"><input type="checkbox" checked={rec.isNotified} readOnly className="h-4 w-4" /></td>
                                    <td className="px-4 py-3 text-center">
                                        {(rec.status === 'موجه' || rec.status === 'غیرموجه') && (
                                            <input
                                                type="checkbox"
                                                checked={rec.hasDoctorsNote}
                                                onChange={(e) => handleHasDoctorsNoteChange(rec, e.target.checked)}
                                                className="h-4 w-4 rounded text-[var(--primary-600)] focus:ring-[var(--primary-500)]"
                                            />
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-xs">
                                        <button onClick={() => handleEdit(rec)} className="font-medium text-blue-600 hover:underline mr-2">ویرایش</button>
                                        <button onClick={() => deleteAttendance(rec.id)} className="font-medium text-red-600 hover:underline">حذف</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            {activeModal === 'add_edit' && <AttendanceRecordModal recordToEdit={recordToEdit} students={students} teachers={teachers} admins={admins} onClose={closeModal} onSubmit={record => { saveAttendance(record); closeModal(); }} years={years} />}
            {activeModal === 'group' && <GroupAttendanceModal classes={classes} students={students} admins={admins} onClose={closeModal} onSubmit={records => { saveGroupAttendance(records); closeModal(); }} years={years} />}
            {detailModalData && <ReportDetailModal data={detailModalData} onClose={() => setDetailModalData(null)} />}
        </>
    );
};

export default AttendanceTab;
