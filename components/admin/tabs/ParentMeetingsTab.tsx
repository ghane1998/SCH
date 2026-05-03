import React, { useState, useMemo } from 'react';
import type { Admin, ParentMeeting, Student, SchoolClass } from '../../../types';
import { useData } from '../../../App';
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
const ThemedTextarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = (props) => (
    <textarea
        {...props}
        className={`w-full mt-1 px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[var(--primary-500)] focus:border-[var(--primary-500)] ${props.className}`}
        style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)', ...props.style }}
    />
);
// #endregion

// #region Modal
interface ParentMeetingModalProps {
    meetingToEdit: ParentMeeting | null;
    students: Student[];
    onClose: () => void;
    onSubmit: (meeting: ParentMeeting) => void;
    adminId: string;
    years: string[];
}
const ParentMeetingModal: React.FC<ParentMeetingModalProps> = ({ meetingToEdit, students, onClose, onSubmit, adminId, years }) => {
    const [studentId, setStudentId] = useState('');
    const [date, setDate] = useState({ year: '', month: '', day: '' });
    const [attendees, setAttendees] = useState('');
    const [reason, setReason] = useState('');
    const [summary, setSummary] = useState('');
    const [actionItems, setActionItems] = useState('');
    
    const [studentSearchTerm, setStudentSearchTerm] = useState('');
    const [isStudentDropdownOpen, setIsStudentDropdownOpen] = useState(false);

    const filteredStudents = useMemo(() => {
        if (!studentSearchTerm) return [];
        const term = studentSearchTerm.toLowerCase();
        return students
            .filter(s => formatFullName(s).toLowerCase().includes(term) || s.className.toLowerCase().includes(term))
            .sort((a, b) => a.lastName.localeCompare(b.lastName, 'fa'));
    }, [studentSearchTerm, students]);


    React.useEffect(() => {
        if (meetingToEdit) {
            setStudentId(meetingToEdit.studentId);
            const student = students.find(s => s.id === meetingToEdit.studentId);
            if (student) {
                setStudentSearchTerm(formatFullName(student));
            }
            const [y, m, d] = meetingToEdit.date.split('-');
            setDate({ year: y, month: String(parseInt(m,10)), day: String(parseInt(d,10)) });
            setAttendees(meetingToEdit.attendees);
            setReason(meetingToEdit.reason);
            setSummary(meetingToEdit.summary);
            setActionItems(meetingToEdit.actionItems);
        } else {
             const today = new Date().toLocaleDateString('fa-IR-u-nu-latn').replace(/\//g, '-').split('-');
            setDate({ year: today[0], month: today[1], day: today[2] });
            setStudentSearchTerm('');
        }
    }, [meetingToEdit, students]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!studentId || !date.year || !attendees || !reason || !summary || !actionItems) {
            alert('لطفا تمامی فیلدها را تکمیل نمایید.');
            return;
        }
        onSubmit({
            id: meetingToEdit ? meetingToEdit.id : `pm-${Date.now()}`,
            studentId,
            date: `${date.year}-${date.month.padStart(2, '0')}-${date.day.padStart(2, '0')}`,
            attendees,
            reason,
            summary,
            actionItems,
            recordedBy: adminId,
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-4">{meetingToEdit ? 'ویرایش' : 'ثبت'} گزارش جلسه</h2>
                <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto space-y-4 pr-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label>دانش آموز</label>
                            <div className="relative">
                                <ThemedInput
                                    type="text"
                                    value={studentSearchTerm}
                                    onChange={(e) => {
                                        setStudentSearchTerm(e.target.value);
                                        setIsStudentDropdownOpen(true);
                                        if (e.target.value === '') setStudentId('');
                                    }}
                                    onFocus={() => setIsStudentDropdownOpen(true)}
                                    onBlur={() => setTimeout(() => setIsStudentDropdownOpen(false), 200)}
                                    placeholder="جستجوی دانش آموز..."
                                    required={!studentId}
                                    autoComplete="off"
                                />
                                {isStudentDropdownOpen && filteredStudents.length > 0 && (
                                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                        <ul className="py-1">
                                            {filteredStudents.map(s => (
                                                <li
                                                    key={s.id}
                                                    className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                                                    onMouseDown={() => {
                                                        setStudentId(s.id);
                                                        setStudentSearchTerm(formatFullName(s));
                                                        setIsStudentDropdownOpen(false);
                                                    }}
                                                >
                                                    {formatFullName(s)} - <span className="text-gray-500">{s.className}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div><label>تاریخ جلسه</label><DateSelector prefix="pm" year={date.year} month={date.month} day={date.day} onYearChange={y=>setDate(p=>({...p, year: y}))} onMonthChange={m=>setDate(p=>({...p, month: m}))} onDayChange={d=>setDate(p=>({...p, day: d}))} years={years} /></div>
                        <div><label>شرکت کنندگان</label><ThemedInput value={attendees} onChange={e=>setAttendees(e.target.value)} placeholder="مثال: پدر و مادر دانش آموز" required /></div>
                        <div><label>موضوع/دلیل جلسه</label><ThemedInput value={reason} onChange={e=>setReason(e.target.value)} placeholder="مثال: تحصیلی، انضباطی" required /></div>
                    </div>
                    <div><label>خلاصه مباحث</label><ThemedTextarea value={summary} onChange={e=>setSummary(e.target.value)} rows={4} required /></div>
                    <div><label>اقدامات و تصمیمات بعدی</label><ThemedTextarea value={actionItems} onChange={e=>setActionItems(e.target.value)} rows={3} required /></div>
                    <div className="flex justify-end gap-4 pt-4 border-t sticky bottom-0 bg-white"><button type="button" onClick={onClose}>انصراف</button><button type="submit">{meetingToEdit ? 'ذخیره' : 'ثبت'}</button></div>
                </form>
            </div>
        </div>
    );
};
// #endregion

interface ParentMeetingsTabProps {
    admin: Admin;
    years: string[];
}

const ParentMeetingsTab: React.FC<ParentMeetingsTabProps> = ({ admin, years }) => {
    const { students, classes, teachers, parentMeetings, saveParentMeeting, deleteParentMeeting } = useData();
    const [modalOpen, setModalOpen] = useState(false);
    const [meetingToEdit, setMeetingToEdit] = useState<ParentMeeting | null>(null);

    const allRecorders = useMemo(() => [...teachers, admin], [teachers, admin]);

    const enrichedMeetings = useMemo(() => {
        return parentMeetings.map(rec => ({
            ...rec,
            studentName: formatFullName(students.find(s => s.id === rec.studentId)) || 'حذف شده',
            className: students.find(s => s.id === rec.studentId)?.className || 'نامشخص',
            recordedByName: formatFullName(allRecorders.find(r => r.id === rec.recordedBy)) || 'سیستم',
        }));
    }, [parentMeetings, students, allRecorders]);

    const { items: sortedMeetings, requestSort, sortConfig } = useSortableData(enrichedMeetings, [{key: 'date', direction: 'descending'}]);

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center"><h2 className="text-xl font-bold">گزارش جلسات با اولیا</h2><button onClick={() => {setMeetingToEdit(null); setModalOpen(true);}} className="px-4 py-2 bg-blue-500 text-white rounded-md">ثبت جلسه جدید</button></div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm bg-white rounded-lg shadow-md">
                    <thead className="bg-gray-50"><tr>
                        <SortableHeader sortKey="date" requestSort={requestSort} sortConfig={sortConfig}>تاریخ</SortableHeader>
                        <SortableHeader sortKey="studentName" requestSort={requestSort} sortConfig={sortConfig}>دانش آموز</SortableHeader>
                        <SortableHeader sortKey="className" requestSort={requestSort} sortConfig={sortConfig}>کلاس</SortableHeader>
                        <SortableHeader sortKey="reason" requestSort={requestSort} sortConfig={sortConfig}>موضوع</SortableHeader>
                        <SortableHeader sortKey="recordedByName" requestSort={requestSort} sortConfig={sortConfig}>ثبت کننده</SortableHeader>
                        <th className="px-4 py-3">اقدامات</th>
                    </tr></thead>
                    <tbody className="divide-y">{sortedMeetings.map(rec => (
                        <tr key={rec.id}>
                            <td className="p-2">{toPersianDigits(rec.date)}</td>
                            <td className="p-2 font-semibold">{rec.studentName}</td>
                            <td className="p-2">{rec.className}</td>
                            <td className="p-2">{rec.reason}</td>
                            <td className="p-2">{rec.recordedByName}</td>
                            <td className="p-2 text-xs"><button onClick={() => {setMeetingToEdit(rec); setModalOpen(true);}} className="font-medium text-blue-600 hover:underline mr-2">ویرایش</button><button onClick={() => deleteParentMeeting(rec.id)} className="font-medium text-red-600 hover:underline">حذف</button></td>
                        </tr>
                    ))}</tbody>
                </table>
            </div>
            {modalOpen && <ParentMeetingModal meetingToEdit={meetingToEdit} students={students} onClose={() => setModalOpen(false)} onSubmit={rec => {saveParentMeeting(rec); setModalOpen(false);}} adminId={admin.id} years={years} />}
        </div>
    );
};

export default ParentMeetingsTab;