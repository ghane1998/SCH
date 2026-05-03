import React, { useState, useMemo, useEffect } from 'react';
import type { Teacher, Student, SchoolClass, PTAMeeting, PTAAttendance } from '../../../types';
import { useData, useSettings } from '../../../App';
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
// #endregion

// #region Meeting Modal
interface MeetingModalProps {
    meetingToEdit: PTAMeeting | null;
    onClose: () => void;
    onSubmit: (meeting: PTAMeeting) => void;
    teacherId: string;
    classId: string;
    years: string[];
}

const MeetingModal: React.FC<MeetingModalProps> = ({ meetingToEdit, onClose, onSubmit, teacherId, classId, years }) => {
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
            scope: 'class',
            scopeId: classId,
            createdBy: meetingToEdit ? meetingToEdit.createdBy : teacherId,
        };
        onSubmit(meeting);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-4">{meetingToEdit ? 'ویرایش' : 'ایجاد'} جلسه انجمن اولیا</h2>
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
// #endregion

interface PTATabProps {
    teacher: Teacher;
    selectedClass: SchoolClass;
    studentsInClass: Student[];
}
const PTATab: React.FC<PTATabProps> = ({ teacher, selectedClass, studentsInClass }) => {
    const { ptaMeetings, ptaAttendance, savePtaMeeting, deletePtaMeeting, saveGroupPtaAttendance } = useData();
    const { settings } = useSettings();
    
    const [selectedMeetingId, setSelectedMeetingId] = useState('');
    const [attendanceData, setAttendanceData] = useState<Record<string, { attended: boolean; notes?: string }>>({});
    const [modal, setModal] = useState<'create' | 'edit' | null>(null);
    const [meetingToEdit, setMeetingToEdit] = useState<PTAMeeting | null>(null);
    
    const academicYears = useMemo(() => {
        const year = settings.academicYear;
        const currentYear = new Date().toLocaleDateString('fa-IR-u-nu-latn').split('/')[0];
        if (year.includes('-')) {
            const parts = year.split('-').map(y => y.trim());
            const start = parseInt(parts[0]);
            const end = parseInt(parts[1]);
            return Array.from({ length: end - start + 1 }, (_, i) => String(start + i));
        }
        return [year];
    }, [settings.academicYear]);

    const classMeetings = useMemo(() => ptaMeetings.filter(m => m.scope === 'class' && m.scopeId === selectedClass.id), [ptaMeetings, selectedClass.id]);

    useEffect(() => {
        if (classMeetings.length > 0 && !classMeetings.some(m => m.id === selectedMeetingId)) {
            setSelectedMeetingId(classMeetings[0].id);
        } else if (classMeetings.length === 0) {
            setSelectedMeetingId('');
        }
    }, [classMeetings, selectedMeetingId]);

    useEffect(() => {
        const initialData: Record<string, { attended: boolean; notes?: string }> = {};
        if (!selectedMeetingId) {
            setAttendanceData({});
            return;
        }
        const meetingAttendance = ptaAttendance.filter(pa => pa.meetingId === selectedMeetingId);
        studentsInClass.forEach(s => {
            const record = meetingAttendance.find(pa => pa.studentId === s.id);
            initialData[s.id] = { attended: record?.attended || false, notes: record?.notes || '' };
        });
        setAttendanceData(initialData);
    }, [selectedMeetingId, ptaAttendance, studentsInClass]);
    
    const { items: sortedStudents, requestSort, sortConfig } = useSortableData(studentsInClass, [{ key: 'lastName', direction: 'ascending' }]);

    const handleDataChange = (studentId: string, field: 'attended' | 'notes', value: boolean | string) => {
        // FIX: Provide a default object when spreading to avoid errors on potentially undefined values.
        setAttendanceData(prev => ({...prev, [studentId]: {...(prev[studentId] || { attended: false, notes: '' }), [field]: value }}));
    };
    
    const handleMarkAll = (present: boolean) => {
        const newData: Record<string, { attended: boolean; notes?: string }> = {};
        studentsInClass.forEach(student => {
            newData[student.id] = {
                attended: present,
                notes: attendanceData[student.id]?.notes || ''
            };
        });
        setAttendanceData(newData);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const recordsToSave: PTAAttendance[] = Object.entries(attendanceData).map(([studentId, data]) => ({
            id: '', meetingId: selectedMeetingId, studentId, ...data
        }));
        saveGroupPtaAttendance(recordsToSave);
        alert('حضور و غیاب ذخیره شد.');
    };

    const handleSaveMeeting = (meeting: PTAMeeting) => {
        savePtaMeeting(meeting);
        if(!meetingToEdit) setSelectedMeetingId(meeting.id); // auto-select new meeting
        setModal(null);
    };
    
    const handleDeleteMeeting = (id: string) => {
        deletePtaMeeting(id);
        setSelectedMeetingId('');
    };

    return (
        <Card title={`جلسات انجمن اولیا کلاس ${selectedClass.name}`}>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
                <div className="flex flex-wrap gap-4 items-end pb-4 border-b">
                    <div className="flex-grow">
                        <label className="block text-sm font-medium">انتخاب جلسه</label>
                        <select value={selectedMeetingId} onChange={e => setSelectedMeetingId(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 border rounded-md">
                            {classMeetings.length === 0 && <option>جلسه‌ای تعریف نشده</option>}
                            {classMeetings.map(m => <option key={m.id} value={m.id}>{m.title} ({toPersianDigits(m.date)})</option>)}
                        </select>
                    </div>
                    <div>
                        <button type="button" onClick={() => {setMeetingToEdit(null); setModal('create');}} className="px-3 py-2 text-sm bg-green-500 text-white rounded-md">جلسه جدید</button>
                    </div>
                    {selectedMeetingId && <button type="button" onClick={() => { setMeetingToEdit(classMeetings.find(m=>m.id === selectedMeetingId) || null); setModal('edit')}} className="px-3 py-2 text-sm bg-blue-500 text-white rounded-md">ویرایش جلسه</button>}
                    {selectedMeetingId && <button type="button" onClick={() => handleDeleteMeeting(selectedMeetingId)} className="px-3 py-2 text-sm bg-red-500 text-white rounded-md">حذف جلسه</button>}
                </div>
                {selectedMeetingId ? (
                    <>
                        <div className="overflow-y-auto max-h-[60vh]">
                             <table className="w-full text-sm">
                                <thead className="sticky top-0 bg-gray-50">
                                    <tr>
                                        {/* FIX: Add missing children prop */}
                                        <SortableHeader sortKey="lastName" requestSort={requestSort} sortConfig={sortConfig}>نام خانوادگی</SortableHeader>
                                        {/* FIX: Add missing children prop */}
                                        <SortableHeader sortKey="firstName" requestSort={requestSort} sortConfig={sortConfig}>نام</SortableHeader>
                                        <th className="p-2 text-center">حاضر؟</th>
                                        <th className="p-2">یادداشت</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedStudents.map(s => (
                                        <tr key={s.id} className="border-b">
                                            <td className="p-2">{s.lastName}</td>
                                            <td className="p-2">{s.firstName}</td>
                                            <td className="p-2 text-center"><input type="checkbox" checked={attendanceData[s.id]?.attended || false} onChange={e => handleDataChange(s.id, 'attended', e.target.checked)} /></td>
                                            <td className="p-2"><ThemedInput type="text" value={attendanceData[s.id]?.notes || ''} onChange={e => handleDataChange(s.id, 'notes', e.target.value)} /></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex justify-between items-center pt-4 border-t">
                             <div className="flex gap-2">
                                <button type="button" onClick={() => handleMarkAll(true)} className="px-4 py-2 text-sm bg-green-500 text-white rounded-md hover:bg-green-600 transition">حضور همه</button>
                                <button type="button" onClick={() => handleMarkAll(false)} className="px-4 py-2 text-sm bg-red-500 text-white rounded-md hover:bg-red-600 transition">غیبت همه</button>
                            </div>
                            <button type="submit" className="px-6 py-2 bg-[var(--primary-600)] text-white rounded-md">ذخیره حضور و غیاب</button>
                        </div>
                    </>
                ) : <p className="text-center text-gray-500 py-12">یک جلسه را انتخاب کنید یا یک جلسه جدید ایجاد کنید.</p>}
            </form>
            {modal && <MeetingModal meetingToEdit={modal === 'edit' ? meetingToEdit : null} onClose={() => setModal(null)} onSubmit={handleSaveMeeting} teacherId={teacher.id} classId={selectedClass.id} years={academicYears} />}
        </Card>
    );
};

export default PTATab;