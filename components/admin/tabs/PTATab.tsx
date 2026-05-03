import React, { useState, useMemo } from 'react';
import type { Admin, PTAMeeting, PTAAttendance, Student, SchoolClass } from '../../../types';
import { useData } from '../../../App';
import Card from '../../common/Card';
import DateSelector from '../../common/DateSelector';
import { useSortableData } from '../../common/useSortableData';
import { SortableHeader } from '../../common/SortableHeader';
import { formatFullName, toPersianDigits } from '../../common/formatters';

// #region Helper Components
const ThemedInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
    <input 
        {...props} 
        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[var(--primary-500)] focus:border-[var(--primary-500)] ${props.className}`} 
        style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)', ...props.style }}
    />
);
const ThemedTextarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = (props) => (
    <textarea
        {...props}
        className={`w-full mt-1 px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[var(--primary-500)] focus:border-[var(--primary-500)] ${props.className}`}
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
// #endregion

// #region Modals
interface MeetingModalProps {
    meetingToEdit: PTAMeeting | null;
    onClose: () => void;
    onSubmit: (meeting: PTAMeeting) => void;
    adminId: string;
    years: string[];
}

const MeetingModal: React.FC<MeetingModalProps> = ({ meetingToEdit, onClose, onSubmit, adminId, years }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState({ year: '', month: '', day: '' });

    React.useEffect(() => {
        if (meetingToEdit) {
            setTitle(meetingToEdit.title);
            setDescription(meetingToEdit.description || '');
            const [y, m, d] = meetingToEdit.date.split('-');
            setDate({ year: y, month: String(parseInt(m,10)), day: String(parseInt(d,10)) });
        }
    }, [meetingToEdit]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !date.year || !date.month || !date.day) {
            alert('لطفا عنوان و تاریخ را وارد کنید.');
            return;
        }
        const meeting: PTAMeeting = {
            id: meetingToEdit ? meetingToEdit.id : `pta-${Date.now()}`,
            title,
            description,
            date: `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`,
            scope: 'school',
            scopeId: 'main-school',
            createdBy: meetingToEdit ? meetingToEdit.createdBy : adminId,
        };
        onSubmit(meeting);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-4">{meetingToEdit ? 'ویرایش' : 'ایجاد'} جلسه انجمن اولیا مدرسه</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <ThemedInput value={title} onChange={e => setTitle(e.target.value)} placeholder="عنوان جلسه" required />
                    <DateSelector prefix="pta-meeting" year={date.year} month={date.month} day={date.day} onYearChange={y => setDate(p => ({...p, year: y}))} onMonthChange={m => setDate(p => ({...p, month: m}))} onDayChange={d => setDate(p => ({...p, day: d}))} years={years} />
                    <ThemedTextarea value={description} onChange={e => setDescription(e.target.value)} placeholder="توضیحات (اختیاری)" rows={3} />
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md">انصراف</button>
                        <button type="submit" className="px-4 py-2 bg-[var(--primary-600)] text-white rounded-md">{meetingToEdit ? 'ذخیره' : 'ایجاد'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

interface AttendanceModalProps {
    meeting: PTAMeeting;
    admin: Admin;
    classes: SchoolClass[];
    onClose: () => void;
}
const AttendanceModal: React.FC<AttendanceModalProps> = ({ meeting, admin, classes, onClose }) => {
    const { students, ptaAttendance, saveGroupPtaAttendance } = useData();
    const [attendanceData, setAttendanceData] = useState<Record<string, { attended: boolean; notes?: string }>>({});
    const [classFilter, setClassFilter] = useState<string>('');
    const [nameFilter, setNameFilter] = useState<string>('');
    
    const relevantStudents = useMemo(() => {
        let baseStudents: Student[];
        if (meeting.scope === 'school') {
            baseStudents = students;
        } else {
            baseStudents = students.filter(s => s.classId === meeting.scopeId);
        }

        if (classFilter) {
            baseStudents = baseStudents.filter(s => s.classId === classFilter);
        }
        if (nameFilter) {
            baseStudents = baseStudents.filter(s => formatFullName(s).toLowerCase().includes(nameFilter.toLowerCase()));
        }

        return baseStudents;
    }, [students, meeting, classFilter, nameFilter]);

    React.useEffect(() => {
        const initialData: Record<string, { attended: boolean; notes?: string }> = {};
        const meetingAttendance = ptaAttendance.filter(pa => pa.meetingId === meeting.id);
        const studentsInMeetingScope = meeting.scope === 'school' 
            ? students 
            : students.filter(s => s.classId === meeting.scopeId);

        studentsInMeetingScope.forEach(s => {
            const record = meetingAttendance.find(pa => pa.studentId === s.id);
            initialData[s.id] = { attended: record?.attended || false, notes: record?.notes || '' };
        });
        setAttendanceData(initialData);
    }, [ptaAttendance, students, meeting]);

    const { items: sortedStudents, requestSort, sortConfig } = useSortableData(relevantStudents, [{ key: 'lastName', direction: 'ascending' }]);
    
    const handleDataChange = (studentId: string, field: 'attended' | 'notes', value: boolean | string) => {
        setAttendanceData(prev => ({...prev, [studentId]: {...(prev[studentId] || { attended: false }), [field]: value }}));
    };
    
    const handleMarkAll = (present: boolean) => {
        setAttendanceData(prev => {
            const newData = { ...prev };
            sortedStudents.forEach(student => {
                newData[student.id] = {
                    ...(newData[student.id] || { notes: '' }),
                    attended: present,
                };
            });
            return newData;
        });
    };

    const handleSubmit = () => {
        const studentsInMeetingScope = meeting.scope === 'school' ? students : students.filter(s => s.classId === meeting.scopeId);

        const recordsToSave: PTAAttendance[] = studentsInMeetingScope.map(student => ({
            id: '', 
            meetingId: meeting.id, 
            studentId: student.id, 
            attended: attendanceData[student.id]?.attended || false,
            notes: attendanceData[student.id]?.notes || ''
        }));
        saveGroupPtaAttendance(recordsToSave);
        onClose();
    };
    
    const isEditable = meeting.scope === 'school' && meeting.createdBy === admin.id;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-4">حضور و غیاب جلسه: {meeting.title} ({toPersianDigits(meeting.date)})</h2>
                
                <div className="flex justify-between items-center gap-4 mb-4 pb-4 border-b">
                    <div className="flex gap-2 items-center flex-grow">
                        <ThemedInput 
                            type="text"
                            placeholder="جستجوی نام دانش آموز..."
                            value={nameFilter}
                            onChange={e => setNameFilter(e.target.value)}
                            className="flex-grow"
                        />
                        <ThemedSelect
                            value={classFilter}
                            onChange={e => setClassFilter(e.target.value)}
                            className="max-w-xs"
                        >
                            <option value="">همه کلاس ها</option>
                            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </ThemedSelect>
                    </div>
                </div>

                <div className="overflow-y-auto flex-grow">
                    <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-gray-50">
                            <tr>
                                {/* FIX: Add missing children prop */}
                                <SortableHeader sortKey="lastName" requestSort={requestSort} sortConfig={sortConfig}>نام خانوادگی</SortableHeader>
                                {/* FIX: Add missing children prop */}
                                <SortableHeader sortKey="firstName" requestSort={requestSort} sortConfig={sortConfig}>نام</SortableHeader>
                                {/* FIX: Add missing children prop */}
                                <SortableHeader sortKey="className" requestSort={requestSort} sortConfig={sortConfig}>کلاس</SortableHeader>
                                <th className="p-2 text-center">حاضر؟</th>
                                <th className="p-2">یادداشت</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedStudents.map(s => (
                                <tr key={s.id} className="border-b">
                                    <td className="p-2">{s.lastName}</td>
                                    <td className="p-2">{s.firstName}</td>
                                    <td className="p-2">{s.className}</td>
                                    <td className="p-2 text-center"><input type="checkbox" checked={attendanceData[s.id]?.attended || false} onChange={e => handleDataChange(s.id, 'attended', e.target.checked)} disabled={!isEditable} /></td>
                                    <td className="p-2"><ThemedInput type="text" value={attendanceData[s.id]?.notes || ''} onChange={e => handleDataChange(s.id, 'notes', e.target.value)} disabled={!isEditable} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {sortedStudents.length === 0 && <p className="text-center py-8 text-gray-500">دانش آموزی با این مشخصات یافت نشد.</p>}
                </div>
                 <div className="flex justify-between items-center gap-4 pt-4 border-t">
                    <div>
                        {isEditable && (
                            <div className="flex gap-2">
                                <button type="button" onClick={() => handleMarkAll(true)} className="px-4 py-2 text-sm bg-green-500 text-white rounded-md hover:bg-green-600 transition">حضور همه</button>
                                <button type="button" onClick={() => handleMarkAll(false)} className="px-4 py-2 text-sm bg-red-500 text-white rounded-md hover:bg-red-600 transition">غیبت همه</button>
                            </div>
                        )}
                    </div>
                    <div className="flex gap-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md">بستن</button>
                        {isEditable && <button onClick={handleSubmit} className="px-4 py-2 bg-green-500 text-white rounded-md">ذخیره تغییرات</button>}
                    </div>
                </div>
            </div>
        </div>
    );
};
// #endregion

interface PTATabProps {
    admin: Admin;
    years: string[];
}
const PTATab: React.FC<PTATabProps> = ({ admin, years }) => {
    const { ptaMeetings, deletePtaMeeting, savePtaMeeting, teachers, classes } = useData();
    const [activeModal, setActiveModal] = useState<'create' | 'edit' | 'attendance' | null>(null);
    const [selectedMeeting, setSelectedMeeting] = useState<PTAMeeting | null>(null);

    const enrichedMeetings = useMemo(() => {
        return ptaMeetings.map(m => {
            const creator = [...teachers, admin].find(u => u.id === m.createdBy);
            const scopeName = m.scope === 'school' ? 'مدرسه' : classes.find(c => c.id === m.scopeId)?.name || 'کلاس حذف شده';
            return {
                ...m,
                creatorName: formatFullName(creator) || 'سیستم',
                scopeName,
            };
        });
    }, [ptaMeetings, teachers, classes, admin]);
    
    const { items: sortedMeetings, requestSort, sortConfig } = useSortableData(enrichedMeetings, [{ key: 'date', direction: 'descending' }]);

    const handleCreate = () => {
        setSelectedMeeting(null);
        setActiveModal('create');
    };
    const handleEdit = (meeting: PTAMeeting) => {
        setSelectedMeeting(meeting);
        setActiveModal('edit');
    };
    const handleViewAttendance = (meeting: PTAMeeting) => {
        setSelectedMeeting(meeting);
        setActiveModal('attendance');
    };
    const closeModal = () => setActiveModal(null);
    
    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">مدیریت جلسات انجمن اولیا</h2>
                <button onClick={handleCreate} className="px-4 py-2 bg-blue-500 text-white rounded-md">ایجاد جلسه مدرسه</button>
            </div>
             <div className="overflow-x-auto">
                <table className="w-full text-sm text-right bg-white rounded-lg shadow-md">
                    <thead className="bg-gray-50">
                        <tr>
                            {/* FIX: Add missing children prop */}
                            <SortableHeader sortKey="title" requestSort={requestSort} sortConfig={sortConfig}>عنوان</SortableHeader>
                            {/* FIX: Add missing children prop */}
                            <SortableHeader sortKey="date" requestSort={requestSort} sortConfig={sortConfig}>تاریخ</SortableHeader>
                            {/* FIX: Add missing children prop */}
                            <SortableHeader sortKey="scopeName" requestSort={requestSort} sortConfig={sortConfig}>محدوده</SortableHeader>
                            {/* FIX: Add missing children prop */}
                            <SortableHeader sortKey="creatorName" requestSort={requestSort} sortConfig={sortConfig}>ایجاد کننده</SortableHeader>
                            <th className="px-4 py-3">اقدامات</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedMeetings.map(m => (
                            <tr key={m.id} className="border-b">
                                <td className="p-2 font-semibold">{m.title}</td>
                                <td className="p-2">{toPersianDigits(m.date)}</td>
                                <td className="p-2">{m.scopeName}</td>
                                <td className="p-2">{m.creatorName}</td>
                                <td className="p-2 text-xs">
                                    <button onClick={() => handleViewAttendance(m)} className="font-medium text-green-600 hover:underline mr-2">حضور و غیاب</button>
                                    {m.createdBy === admin.id && m.scope === 'school' && <button onClick={() => handleEdit(m)} className="font-medium text-blue-600 hover:underline mr-2">ویرایش</button>}
                                    {m.createdBy === admin.id && <button onClick={() => deletePtaMeeting(m.id)} className="font-medium text-red-600 hover:underline">حذف</button>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
             </div>
             {activeModal === 'create' && <MeetingModal meetingToEdit={null} onClose={closeModal} onSubmit={meeting => { savePtaMeeting(meeting); closeModal(); }} adminId={admin.id} years={years} />}
             {activeModal === 'edit' && selectedMeeting && <MeetingModal meetingToEdit={selectedMeeting} onClose={closeModal} onSubmit={meeting => { savePtaMeeting(meeting); closeModal(); }} adminId={admin.id} years={years} />}
             {activeModal === 'attendance' && selectedMeeting && <AttendanceModal meeting={selectedMeeting} admin={admin} onClose={closeModal} classes={classes} />}
        </div>
    );
};

export default PTATab;