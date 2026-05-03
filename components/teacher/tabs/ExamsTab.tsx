
import React, { useState, useMemo, useEffect } from 'react';
import type { Exam, Teacher, SchoolClass } from '../../../types';
import { useData, useSettings } from '../../../App';
import Card from '../../common/Card';
import DateSelector from '../../common/DateSelector';
import { toPersianDigits } from '../../common/formatters';


const ExamIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>;

interface ExamModalProps {
    examToEdit: Exam | null;
    teacherClasses: SchoolClass[];
    onClose: () => void;
    onSubmit: (exam: Exam) => void;
    teacherId: string;
    years: string[];
}
const ExamModal: React.FC<ExamModalProps> = ({ examToEdit, teacherClasses, onClose, onSubmit, teacherId, years }) => {
    const [subject, setSubject] = useState('');
    const [examDate, setExamDate] = useState({ year: '', month: '', day: '' });
    const [examTime, setExamTime] = useState('');
    const [syllabus, setSyllabus] = useState('');
    const [description, setDescription] = useState('');
    const [targetClassIds, setTargetClassIds] = useState<string[]>([]);
    
    useEffect(() => {
        if (examToEdit) {
            const [date, time] = examToEdit.examDate.split('T');
            const [y, m, d] = date.split('-');
            setExamDate({ year: y, month: String(parseInt(m,10)), day: String(parseInt(d,10)) });
            setSubject(examToEdit.subject);
            setExamTime(time || '');
            setSyllabus(examToEdit.syllabus);
            setDescription(examToEdit.description);
            setTargetClassIds(examToEdit.targetClassIds);
        }
    }, [examToEdit]);

    const handleClassToggle = (classId: string) => {
        setTargetClassIds(prev => prev.includes(classId) ? prev.filter(id => id !== classId) : [...prev, classId]);
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!subject || !examDate.year || !syllabus || targetClassIds.length === 0) {
            alert('لطفا تمامی فیلدهای الزامی (درس، تاریخ آزمون، بودجه بندی و کلاس) را پر کنید.');
            return;
        }
        const formattedExamDate = `${examDate.year}-${String(examDate.month).padStart(2, '0')}-${String(examDate.day).padStart(2, '0')}`;
        const formattedAnnouncementDate = new Date().toLocaleDateString('fa-IR-u-nu-latn', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-');
        
        const newExam: Exam = {
            id: examToEdit ? examToEdit.id : `exam${Date.now()}`,
            subject,
            examDate: `${formattedExamDate}T${examTime || '00:00'}`,
            announcementDate: formattedAnnouncementDate,
            syllabus,
            description,
            targetClassIds,
            createdBy: examToEdit ? examToEdit.createdBy : teacherId,
        };
        onSubmit(newExam);
    };
    
    const inputStyle = {
      backgroundColor: 'var(--input-bg)',
      borderColor: 'var(--input-border)',
      color: 'var(--text-primary)'
    };
    
    const commonInputClass = "mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-[var(--primary-500)] focus:border-[var(--primary-500)]";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-4 text-[var(--text-primary)]">{examToEdit ? 'ویرایش' : 'افزودن'} آزمون</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)]">درس</label>
                            <input type="text" value={subject} onChange={e => setSubject(e.target.value)} required style={inputStyle} className={commonInputClass} />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)]">ساعت آزمون (اختیاری)</label>
                            <input type="text" value={examTime} onChange={e => setExamTime(e.target.value)} placeholder="مثال: 09:30" style={inputStyle} className={commonInputClass} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)]">تاریخ آزمون</label>
                            <DateSelector prefix="exam-date" years={years}
                                year={examDate.year} month={examDate.month} day={examDate.day}
                                onYearChange={y => setExamDate(p => ({...p, year: y}))}
                                onMonthChange={m => setExamDate(p => ({...p, month: m}))}
                                onDayChange={d => setExamDate(p => ({...p, day: d}))}
                            />
                        </div>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)]">بودجه بندی</label>
                        <textarea value={syllabus} onChange={e => setSyllabus(e.target.value)} rows={3} required style={inputStyle} className={commonInputClass} />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)]">توضیحات (اختیاری)</label>
                        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} style={inputStyle} className={commonInputClass} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)]">کلاس های مخاطب</label>
                        <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2 border p-3 rounded-md max-h-32 overflow-y-auto" style={{borderColor: 'var(--input-border)'}}>
                            {teacherClasses.map(cls => (
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
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition">انصراف</button>
                        <button type="submit" className="px-4 py-2 bg-[var(--primary-600)] text-white rounded-md hover:bg-[var(--primary-700)] transition">{examToEdit ? 'ذخیره تغییرات' : 'افزودن آزمون'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


interface ExamsTabProps {
    teacher: Teacher;
    selectedClassId: string;
    myClasses: SchoolClass[];
}

const ExamsTab: React.FC<ExamsTabProps> = ({ teacher, selectedClassId, myClasses }) => {
    const { exams, saveExam, deleteExam } = useData();
    const { settings } = useSettings();
    const [examModalOpen, setExamModalOpen] = useState(false);
    const [examToEdit, setExamToEdit] = useState<Exam | null>(null);
    const [filter, setFilter] = useState('');

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

    const handleSaveExam = (exam: Exam) => {
        saveExam(exam);
        setExamModalOpen(false);
        setExamToEdit(null);
    };

    const classExams = useMemo(() => {
        if (!selectedClassId) return [];
        return exams
            .filter(exam => 
                exam.targetClassIds.includes(selectedClassId) &&
                exam.subject.toLowerCase().includes(filter.toLowerCase())
            )
            .sort((a, b) => b.examDate.localeCompare(a.examDate));
    }, [exams, selectedClassId, filter]);

    const formatExamDate = (dateString: string) => {
        const [date, time] = dateString.split('T');
        return `تاریخ: ${toPersianDigits(date)} - ساعت: ${toPersianDigits(time || 'نامشخص')}`;
    }

    return (
        <div className="space-y-6">
            <Card title="آزمون‌های کلاس" icon={<ExamIcon />}>
                <div className="p-4 border-b">
                    <input
                        type="text"
                        placeholder="جستجوی آزمون بر اساس درس..."
                        value={filter}
                        onChange={e => setFilter(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg shadow-sm"
                    />
                </div>
                <div className="space-y-4 max-h-96 overflow-y-auto pr-2 p-4">
                    {classExams.length > 0 ? (
                        classExams.map(exam => (
                             <div key={exam.id} className="p-4 bg-gray-50 border-r-4 border-gray-400 rounded-lg">
                                <div className="flex justify-between items-start flex-wrap gap-2">
                                    <p className="font-bold text-lg text-gray-800">{exam.subject}</p>
                                    {exam.createdBy === teacher.id && (
                                        <div className="flex gap-3 text-xs">
                                            <button onClick={() => { setExamToEdit(exam); setExamModalOpen(true); }} className="font-medium text-blue-600 hover:underline">ویرایش</button>
                                            <button onClick={() => deleteExam(exam.id)} className="font-medium text-red-600 hover:underline">حذف</button>
                                        </div>
                                    )}
                                </div>
                                <p className="text-sm font-semibold text-gray-600 bg-gray-100 px-2 py-1 rounded my-2 inline-block">{formatExamDate(exam.examDate)}</p>
                                <div className="mt-2 text-sm text-gray-700 space-y-1">
                                    <p><span className="font-semibold">بودجه‌بندی:</span> {exam.syllabus}</p>
                                    {exam.description && <p><span className="font-semibold">توضیحات:</span> {exam.description}</p>}
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-gray-500 py-12">آزمونی برای این کلاس یافت نشد.</p>
                    )}
                </div>
            </Card>

            <div className="text-right">
                <button
                    onClick={() => { setExamToEdit(null); setExamModalOpen(true); }}
                    className="px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600"
                >
                    افزودن آزمون جدید
                </button>
            </div>

            {examModalOpen && (
                <ExamModal
                    examToEdit={examToEdit}
                    teacherClasses={myClasses}
                    onClose={() => setExamModalOpen(false)}
                    onSubmit={handleSaveExam}
                    teacherId={teacher.id}
                    years={academicYears}
                />
            )}
        </div>
    );
};

export default ExamsTab;
