

import React, { useState, useMemo, useEffect } from 'react';
import type { Teacher, AnecdotalRecord, Student, SchoolClass } from '../../../types';
import { useData } from '../../../App';
import { useSortableData } from '../../common/useSortableData';
import { SortableHeader } from '../../common/SortableHeader';
import { formatFullName, toPersianDigits } from '../../common/formatters';
import DateSelector from '../../common/DateSelector';

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

interface AnecdotalRecordModalProps {
    recordToEdit: AnecdotalRecord | null;
    studentsInClass: Student[];
    subjects: string[];
    onClose: () => void;
    onSubmit: (record: AnecdotalRecord) => void;
    teacherId: string;
    years: string[];
}

const AnecdotalRecordModal: React.FC<AnecdotalRecordModalProps> = ({ recordToEdit, studentsInClass, subjects, onClose, onSubmit, teacherId, years }) => {
    const [studentIds, setStudentIds] = useState<string[]>([]);
    const [date, setDate] = useState({ year: '', month: '', day: '' });
    const [subject, setSubject] = useState('');
    const [location, setLocation] = useState('');
    const [description, setDescription] = useState('');
    
    useEffect(() => {
        if (recordToEdit) {
            setStudentIds(recordToEdit.studentIds);
            const [y, m, d] = recordToEdit.date.split('-');
            setDate({ year: y, month: String(parseInt(m,10)), day: String(parseInt(d,10)) });
            setSubject(recordToEdit.subject);
            setLocation(recordToEdit.location);
            setDescription(recordToEdit.description);
        } else {
            const today = new Date().toLocaleDateString('fa-IR-u-nu-latn').replace(/\//g, '-').split('-');
            setDate({ year: today[0], month: today[1], day: today[2] });
            setSubject(subjects[0] || '');
        }
    }, [recordToEdit, subjects]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (studentIds.length === 0 || !date.year || !subject || !location || !description) {
            alert('لطفا تمامی فیلدها را تکمیل نمایید.');
            return;
        }
        onSubmit({
            id: recordToEdit ? recordToEdit.id : `anec-${Date.now()}`,
            studentIds,
            date: `${date.year}-${date.month.padStart(2, '0')}-${date.day.padStart(2, '0')}`,
            subject,
            location,
            description,
            recordedBy: teacherId,
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-4">{recordToEdit ? 'ویرایش' : 'ثبت'} واقعه</h2>
                <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto space-y-4 pr-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label>تاریخ مشاهده</label><DateSelector prefix="anec" year={date.year} month={date.month} day={date.day} onYearChange={y=>setDate(p=>({...p, year: y}))} onMonthChange={m=>setDate(p=>({...p, month: m}))} onDayChange={d=>setDate(p=>({...p, day: d}))} years={years} /></div>
                        <div><label>موضوع/درس</label><ThemedSelect value={subject} onChange={e=>setSubject(e.target.value)}>{subjects.map(s => <option key={s} value={s}>{s}</option>)}</ThemedSelect></div>
                        <div className="md:col-span-2"><label>محل مشاهده</label><ThemedInput value={location} onChange={e=>setLocation(e.target.value)} required /></div>
                        <div className="md:col-span-2"><label>شرح واقعه</label><ThemedTextarea value={description} onChange={e=>setDescription(e.target.value)} rows={4} required /></div>
                    </div>
                    <div>
                        <label className="font-semibold text-sm">دانش آموز(ان)</label>
                        <div className="border rounded-md p-2 h-48 overflow-y-auto mt-1">
                            {studentsInClass.map(s => <label key={s.id} className="flex items-center gap-2"><input type="checkbox" checked={studentIds.includes(s.id)} onChange={() => setStudentIds(p => p.includes(s.id) ? p.filter(id => id !== s.id) : [...p, s.id])} />{formatFullName(s)}</label>)}
                        </div>
                    </div>
                    <div className="flex justify-end gap-4 pt-4 border-t sticky bottom-0 bg-white"><button type="button" onClick={onClose}>انصراف</button><button type="submit">{recordToEdit ? 'ذخیره' : 'ثبت'}</button></div>
                </form>
            </div>
        </div>
    );
};

interface AnecdotalTabProps {
    teacher: Teacher;
    selectedClass: SchoolClass;
    studentsInClass: Student[];
}

const AnecdotalTab: React.FC<AnecdotalTabProps> = ({ teacher, selectedClass, studentsInClass }) => {
    const { anecdotalRecords, saveAnecdotalRecord, deleteAnecdotalRecord, admins } = useData();
    const [modalOpen, setModalOpen] = useState(false);
    const [recordToEdit, setRecordToEdit] = useState<AnecdotalRecord | null>(null);

    const academicYears = useMemo(() => {
        const currentYear = new Date().toLocaleDateString('fa-IR-u-nu-latn').split('/')[0];
        return [String(Number(currentYear)-1), currentYear, String(Number(currentYear)+1)];
    }, []);

    const classStudentIds = useMemo(() => new Set(studentsInClass.map(s => s.id)), [studentsInClass]);
    
    const allRecorders = useMemo(() => [...admins, teacher], [admins, teacher]);

    const classRecords = useMemo(() => {
        return anecdotalRecords
            .filter(rec => rec.studentIds.some(id => classStudentIds.has(id)))
            .map(rec => ({
                ...rec,
                studentNames: rec.studentIds.map(id => formatFullName(studentsInClass.find(s => s.id === id)) || 'دانش آموز دیگر').join('، '),
                recordedByName: formatFullName(allRecorders.find(r => r.id === rec.recordedBy)) || 'سیستم',
            }));
    }, [anecdotalRecords, classStudentIds, studentsInClass, allRecorders]);

    const { items: sortedRecords, requestSort, sortConfig } = useSortableData(classRecords, [{key: 'date', direction: 'descending'}]);

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">واقعه نگاری کلاس {selectedClass.name}</h2>
                <button onClick={() => {setRecordToEdit(null); setModalOpen(true);}} className="px-4 py-2 bg-blue-500 text-white rounded-md">ثبت واقعه جدید</button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm bg-white rounded-lg shadow-md">
                    <thead className="bg-gray-50"><tr>
                        {/* FIX: Add missing children prop */}
                        <SortableHeader sortKey="date" requestSort={requestSort} sortConfig={sortConfig}>تاریخ</SortableHeader>
                        {/* FIX: Add missing children prop */}
                        <SortableHeader sortKey="studentNames" requestSort={requestSort} sortConfig={sortConfig}>دانش آموز(ان)</SortableHeader>
                        {/* FIX: Add missing children prop */}
                        <SortableHeader sortKey="subject" requestSort={requestSort} sortConfig={sortConfig}>موضوع</SortableHeader>
                        <th className="px-4 py-3">شرح</th>
                        {/* FIX: Add missing children prop */}
                        <SortableHeader sortKey="recordedByName" requestSort={requestSort} sortConfig={sortConfig}>ثبت کننده</SortableHeader>
                        <th className="px-4 py-3">اقدامات</th>
                    </tr></thead>
                    <tbody className="divide-y">{sortedRecords.map(rec => (
                        <tr key={rec.id}>
                            <td className="p-2">{toPersianDigits(rec.date)}</td>
                            <td className="p-2 font-semibold">{rec.studentNames}</td>
                            <td className="p-2">{rec.subject}</td>
                            <td className="p-2 text-xs max-w-xs truncate" title={rec.description}>{rec.description}</td>
                            <td className="p-2">{rec.recordedByName}</td>
                            <td className="p-2 text-xs">
                                {rec.recordedBy === teacher.id && (
                                    <>
                                        <button onClick={() => {setRecordToEdit(rec); setModalOpen(true);}} className="font-medium text-blue-600 hover:underline mr-2">ویرایش</button>
                                        <button onClick={() => deleteAnecdotalRecord(rec.id)} className="font-medium text-red-600 hover:underline">حذف</button>
                                    </>
                                )}
                            </td>
                        </tr>
                    ))}</tbody>
                </table>
            </div>
            {modalOpen && <AnecdotalRecordModal recordToEdit={recordToEdit} studentsInClass={studentsInClass} subjects={selectedClass.subjects} onClose={() => setModalOpen(false)} onSubmit={rec => {saveAnecdotalRecord(rec); setModalOpen(false);}} teacherId={teacher.id} years={academicYears} />}
        </div>
    );
};

export default AnecdotalTab;