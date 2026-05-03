

import React, { useState, useEffect, useMemo } from 'react';
import type { Exam, SchoolClass, Admin } from '../../../types';
import { useSortableData } from '../../common/useSortableData';
import { SortableHeader } from '../../common/SortableHeader';
import { toPersianDigits, formatFullName } from '../../common/formatters';
import DateSelector from '../../common/DateSelector';

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
const ChevronIcon = ({ direction = 'down', className = 'h-6 w-6 text-gray-500' }: { direction: 'up' | 'down', className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`${className} transition-transform duration-300 ${direction === 'up' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
);
// #endregion

// #region Modal
interface ExamModalProps {
    examToEdit: Exam | null;
    classes: SchoolClass[];
    onClose: () => void;
    onSubmit: (exam: Exam) => void;
    adminId: string;
    years: string[];
}
const ExamModal: React.FC<ExamModalProps> = ({ examToEdit, classes, onClose, onSubmit, adminId, years }) => {
    const [subject, setSubject] = useState('');
    const [examDate, setExamDate] = useState({ year: '', month: '', day: '' });
    const [examTime, setExamTime] = useState('');
    const [announcementDate, setAnnouncementDate] = useState({ year: '', month: '', day: '' });
    const [syllabus, setSyllabus] = useState('');
    const [description, setDescription] = useState('');
    const [targetClassIds, setTargetClassIds] = useState<string[]>([]);
    
    useEffect(() => {
        if (examToEdit) {
            const [date, time] = examToEdit.examDate.split('T');
            const [y, m, d] = date.split('-');
            setExamDate({ year: y, month: String(parseInt(m,10)), day: String(parseInt(d,10)) });
            const [annY, annM, annD] = examToEdit.announcementDate.split('-');
            setAnnouncementDate({ year: annY, month: String(parseInt(annM,10)), day: String(parseInt(annD,10)) });
            setSubject(examToEdit.subject);
            setExamTime(time || '');
            setSyllabus(examToEdit.syllabus);
            setDescription(examToEdit.description);
            setTargetClassIds(examToEdit.targetClassIds);
        } else {
             setSubject('');
            setExamDate({ year: '', month: '', day: '' });
            setExamTime('');
            setAnnouncementDate({ year: '', month: '', day: '' });
            setSyllabus('');
            setDescription('');
            setTargetClassIds([]);
        }
    }, [examToEdit]);

    const handleClassToggle = (classId: string) => {
        setTargetClassIds(prev => prev.includes(classId) ? prev.filter(id => id !== classId) : [...prev, classId]);
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!subject || !examDate.year || !announcementDate.year || !syllabus || targetClassIds.length === 0) {
            alert('لطفا تمامی فیلدهای الزامی را پر کنید.');
            return;
        }
        const formattedExamDate = `${examDate.year}-${String(examDate.month).padStart(2, '0')}-${String(examDate.day).padStart(2, '0')}`;
        const formattedAnnouncementDate = `${announcementDate.year}-${String(announcementDate.month).padStart(2, '0')}-${String(announcementDate.day).padStart(2, '0')}`;
        
        const newExam: Exam = {
            id: examToEdit ? examToEdit.id : `exam${Date.now()}`,
            subject,
            examDate: `${formattedExamDate}T${examTime || '00:00'}`,
            announcementDate: formattedAnnouncementDate,
            syllabus,
            description,
            targetClassIds,
            createdBy: examToEdit ? examToEdit.createdBy : adminId,
        };
        onSubmit(newExam);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl relative" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-4 text-[var(--text-primary)]">{examToEdit ? 'ویرایش' : 'افزودن'} آزمون</h2>
                <form onSubmit={handleSubmit} className="space-y-4 relative">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="relative"><label className="block text-sm font-medium text-[var(--text-secondary)]">درس</label><ThemedInput type="text" value={subject} onChange={e => setSubject(e.target.value)} required /></div>
                        <div className="relative"><label className="block text-sm font-medium text-[var(--text-secondary)]">ساعت آزمون (اختیاری)</label><ThemedInput type="text" value={examTime} onChange={e => setExamTime(e.target.value)} placeholder="مثال: 09:30" /></div>
                        <div className="relative"><label className="block text-sm font-medium text-[var(--text-secondary)]">تاریخ آزمون</label>
                           <DateSelector prefix="exam-date" years={years}
                                year={examDate.year} month={examDate.month} day={examDate.day}
                                onYearChange={y => setExamDate(p => ({...p, year: y}))}
                                onMonthChange={m => setExamDate(p => ({...p, month: m}))}
                                onDayChange={d => setExamDate(p => ({...p, day: d}))}
                            />
                        </div>
                         <div className="relative"><label className="block text-sm font-medium text-[var(--text-secondary)]">تاریخ اعلام</label>
                            <DateSelector prefix="ann-date" years={years}
                                year={announcementDate.year} month={announcementDate.month} day={announcementDate.day}
                                onYearChange={y => setAnnouncementDate(p => ({...p, year: y}))}
                                onMonthChange={m => setAnnouncementDate(p => ({...p, month: m}))}
                                onDayChange={d => setAnnouncementDate(p => ({...p, day: d}))}
                            />
                        </div>
                    </div>
                     <div className="relative"><label className="block text-sm font-medium text-[var(--text-secondary)]">بودجه بندی</label><ThemedTextarea value={syllabus} onChange={e => setSyllabus(e.target.value)} rows={3} required /></div>
                     <div className="relative"><label className="block text-sm font-medium text-[var(--text-secondary)]">توضیحات (اختیاری)</label><ThemedTextarea value={description} onChange={e => setDescription(e.target.value)} rows={2} /></div>
                    <div className="relative">
                        <label className="block text-sm font-medium text-[var(--text-secondary)]">کلاس های مخاطب</label>
                        <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2 border p-3 rounded-md max-h-32 overflow-y-auto" style={{borderColor: 'var(--input-border)'}}>
                            {classes.map(cls => (
                                <label key={cls.id} className="flex items-center p-2 rounded-md cursor-pointer hover:bg-indigo-50">
                                    <input
                                        type="checkbox"
                                        checked={targetClassIds.includes(cls.id)}
                                        onChange={() => handleClassToggle(cls.id)}
                                        className="h-4 w-4 text-[var(--primary-600)] border-gray-300 rounded focus:ring-[var(--primary-500)]"
                                    />
                                    <span className="ml-2 text-sm text-gray-800">{cls.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    <div className="flex justify-end gap-4 pt-4 relative">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition">انصراف</button>
                        <button type="submit" className="px-4 py-2 bg-[var(--primary-600)] text-white rounded-md hover:bg-[var(--primary-700)] transition">{examToEdit ? 'ذخیره' : 'افزودن آزمون'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};
// #endregion

interface ExamsTabProps {
    exams: Exam[];
    classes: SchoolClass[];
    admins: Admin[];
    adminId: string;
    years: string[];
    saveExam: (exam: Exam) => void;
    deleteExam: (id: string) => void;
}

const ExamsTab: React.FC<ExamsTabProps> = ({ exams, classes, admins, adminId, years, saveExam, deleteExam }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [examToEdit, setExamToEdit] = useState<Exam | null>(null);
    const [subjectFilter, setSubjectFilter] = useState('');
    const [classFilter, setClassFilter] = useState('');
    const [creatorFilter, setCreatorFilter] = useState('');
    const [startDate, setStartDate] = useState({ year: '', month: '', day: '' });
    const [endDate, setEndDate] = useState({ year: '', month: '', day: '' });
    const [announcementStartDate, setAnnouncementStartDate] = useState({ year: '', month: '', day: '' });
    const [announcementEndDate, setAnnouncementEndDate] = useState({ year: '', month: '', day: '' });
    const [isFilterVisible, setIsFilterVisible] = useState(true);

    const startDateFilter = useMemo(() => {
        if (startDate.year && startDate.month && startDate.day) {
            return `${startDate.year}-${String(startDate.month).padStart(2, '0')}-${String(startDate.day).padStart(2, '0')}`;
        }
        return '';
    }, [startDate]);

    const endDateFilter = useMemo(() => {
        if (endDate.year && endDate.month && endDate.day) {
            return `${endDate.year}-${String(endDate.month).padStart(2, '0')}-${String(endDate.day).padStart(2, '0')}`;
        }
        return '';
    }, [endDate]);

    const announcementStartDateFilter = useMemo(() => {
        if (announcementStartDate.year && announcementStartDate.month && announcementStartDate.day) {
            return `${announcementStartDate.year}-${String(announcementStartDate.month).padStart(2, '0')}-${String(announcementStartDate.day).padStart(2, '0')}`;
        }
        return '';
    }, [announcementStartDate]);

    const announcementEndDateFilter = useMemo(() => {
        if (announcementEndDate.year && announcementEndDate.month && announcementEndDate.day) {
            return `${announcementEndDate.year}-${String(announcementEndDate.month).padStart(2, '0')}-${String(announcementEndDate.day).padStart(2, '0')}`;
        }
        return '';
    }, [announcementEndDate]);

    const handleAdd = () => {
        setExamToEdit(null);
        setIsModalOpen(true);
    };
    const handleEdit = (exam: Exam) => {
        setExamToEdit(exam);
        setIsModalOpen(true);
    };
    const closeModal = () => {
        setIsModalOpen(false);
    };

    const handleClearFilters = () => {
        setSubjectFilter('');
        setClassFilter('');
        setCreatorFilter('');
        setStartDate({ year: '', month: '', day: '' });
        setEndDate({ year: '', month: '', day: '' });
        setAnnouncementStartDate({ year: '', month: '', day: '' });
        setAnnouncementEndDate({ year: '', month: '', day: '' });
    };

    const enrichedExams = useMemo(() => {
        return exams.map(exam => {
            const creator = admins.find(a => a.id === exam.createdBy);
            return {
                ...exam,
                creatorName: creator ? formatFullName(creator) : 'سیستم'
            };
        });
    }, [exams, admins]);

    const filteredExams = useMemo(() => {
        return enrichedExams.filter(exam =>
            (subjectFilter ? exam.subject.toLowerCase().includes(subjectFilter.toLowerCase()) : true) &&
            (classFilter ? exam.targetClassIds.includes(classFilter) : true) &&
            (creatorFilter ? exam.createdBy === creatorFilter : true) &&
            (startDateFilter ? exam.examDate.split('T')[0] >= startDateFilter : true) &&
            (endDateFilter ? exam.examDate.split('T')[0] <= endDateFilter : true) &&
            (announcementStartDateFilter ? exam.announcementDate >= announcementStartDateFilter : true) &&
            (announcementEndDateFilter ? exam.announcementDate <= announcementEndDateFilter : true)
        );
    }, [enrichedExams, subjectFilter, classFilter, creatorFilter, startDateFilter, endDateFilter, announcementStartDateFilter, announcementEndDateFilter]);

    const { items: sortedExams, requestSort, sortConfig } = useSortableData(filteredExams, [{ key: 'examDate', direction: 'descending' }]);

    const getClassNames = (classIds: string[]) => {
        return classIds.map(id => classes.find(c => c.id === id)?.name || 'حذف شده').join(', ');
    };

    const filterInputClass = "w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-[var(--primary-500)] focus:border-[var(--primary-500)]";

    return (
        <>
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold">مدیریت آزمون ها</h2>
                    <button onClick={handleAdd} className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition text-sm">افزودن آزمون</button>
                </div>

                <div className="bg-gray-50 rounded-lg border">
                    <button
                        className="w-full flex justify-between items-center p-4"
                        onClick={() => setIsFilterVisible(!isFilterVisible)}
                        aria-expanded={isFilterVisible}
                        aria-controls="exams-tab-filters"
                    >
                        <h3 className="text-lg font-semibold text-gray-700">فیلترها</h3>
                        <ChevronIcon direction={isFilterVisible ? 'up' : 'down'} />
                    </button>
                    <div
                        id="exams-tab-filters"
                        className={`transition-all duration-300 ease-in-out overflow-hidden ${isFilterVisible ? 'max-h-[500px] p-4 pt-0' : 'max-h-0'}`}
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end pt-4 border-t">
                            <div>
                                <label className="text-sm font-medium text-gray-700">درس</label>
                                <input type="text" placeholder="جستجوی درس..." value={subjectFilter} onChange={e => setSubjectFilter(e.target.value)} className={filterInputClass} />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">کلاس</label>
                                <select value={classFilter} onChange={e => setClassFilter(e.target.value)} className={filterInputClass}>
                                    <option value="">همه کلاس ها</option>
                                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">ایجاد کننده</label>
                                <select value={creatorFilter} onChange={e => setCreatorFilter(e.target.value)} className={filterInputClass}>
                                    <option value="">همه</option>
                                    {admins.map(a => <option key={a.id} value={a.id}>{formatFullName(a)}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">تاریخ آزمون (از)</label>
                                <DateSelector
                                    prefix="exam-start-filter"
                                    year={startDate.year}
                                    month={startDate.month}
                                    day={startDate.day}
                                    onYearChange={(y) => setStartDate(p => ({ ...p, year: y }))}
                                    onMonthChange={(m) => setStartDate(p => ({ ...p, month: m }))}
                                    onDayChange={(d) => setStartDate(p => ({ ...p, day: d }))}
                                    years={years}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">تاریخ آزمون (تا)</label>
                                <DateSelector
                                    prefix="exam-end-filter"
                                    year={endDate.year}
                                    month={endDate.month}
                                    day={endDate.day}
                                    onYearChange={(y) => setEndDate(p => ({ ...p, year: y }))}
                                    onMonthChange={(m) => setEndDate(p => ({ ...p, month: m }))}
                                    onDayChange={(d) => setEndDate(p => ({ ...p, day: d }))}
                                    years={years}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">تاریخ اعلام (از)</label>
                                <DateSelector
                                    prefix="ann-start-filter"
                                    year={announcementStartDate.year}
                                    month={announcementStartDate.month}
                                    day={announcementStartDate.day}
                                    onYearChange={(y) => setAnnouncementStartDate(p => ({ ...p, year: y }))}
                                    onMonthChange={(m) => setAnnouncementStartDate(p => ({ ...p, month: m }))}
                                    onDayChange={(d) => setAnnouncementStartDate(p => ({ ...p, day: d }))}
                                    years={years}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">تاریخ اعلام (تا)</label>
                                <DateSelector
                                    prefix="ann-end-filter"
                                    year={announcementEndDate.year}
                                    month={announcementEndDate.month}
                                    day={announcementEndDate.day}
                                    onYearChange={(y) => setAnnouncementEndDate(p => ({ ...p, year: y }))}
                                    onMonthChange={(m) => setAnnouncementEndDate(p => ({ ...p, month: m }))}
                                    onDayChange={(d) => setAnnouncementEndDate(p => ({ ...p, day: d }))}
                                    years={years}
                                />
                            </div>
                            <div className="lg:col-span-2"></div>
                            <button onClick={handleClearFilters} className="px-4 py-2 text-sm bg-gray-200 hover:bg-gray-300 rounded-md h-10">پاک کردن فیلترها</button>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right bg-white rounded-lg shadow-md">
                        <thead className="bg-gray-50">
                            <tr>
                                {/* FIX: Add missing children prop */}
                                <SortableHeader sortKey="subject" requestSort={requestSort} sortConfig={sortConfig}>درس</SortableHeader>
                                {/* FIX: Add missing children prop */}
                                <SortableHeader sortKey="examDate" requestSort={requestSort} sortConfig={sortConfig}>تاریخ آزمون</SortableHeader>
                                {/* FIX: Add missing children prop */}
                                <SortableHeader sortKey="announcementDate" requestSort={requestSort} sortConfig={sortConfig}>تاریخ اعلام</SortableHeader>
                                {/* FIX: Add missing children prop */}
                                <SortableHeader sortKey="creatorName" requestSort={requestSort} sortConfig={sortConfig}>ایجاد کننده</SortableHeader>
                                <th className="px-4 py-3">کلاس ها</th>
                                <th className="px-4 py-3">اقدامات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {sortedExams.map(exam => (
                                <tr key={exam.id}>
                                    <td className="px-4 py-3 font-semibold">{exam.subject}</td>
                                    <td className="px-4 py-3">{toPersianDigits(exam.examDate.replace('T', ' ساعت '))}</td>
                                    <td className="px-4 py-3">{toPersianDigits(exam.announcementDate)}</td>
                                    <td className="px-4 py-3">{exam.creatorName}</td>
                                    <td className="px-4 py-3 text-xs">{getClassNames(exam.targetClassIds)}</td>
                                    <td className="px-4 py-3 text-xs">
                                        <button onClick={() => handleEdit(exam)} className="font-medium text-blue-600 hover:underline mr-2">ویرایش</button>
                                        <button onClick={() => deleteExam(exam.id)} className="font-medium text-red-600 hover:underline">حذف</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                     {sortedExams.length === 0 && <p className="text-center py-8 text-gray-500">هیچ آزمونی با این مشخصات یافت نشد.</p>}
                </div>
            </div>
            
            {isModalOpen && (
                <ExamModal
                    examToEdit={examToEdit}
                    classes={classes}
                    onClose={closeModal}
                    onSubmit={(exam) => { saveExam(exam); closeModal(); }}
                    adminId={adminId}
                    years={years}
                />
            )}
        </>
    );
};

export default ExamsTab;
