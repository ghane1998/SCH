import React, { useState, useEffect } from 'react';
import type { Student, Grade, DescriptiveGrade } from '../../../types';
import { DESCRIPTIVE_GRADES } from '../../../types';
import { useSettings } from '../../../App';
import DateSelector from '../../common/DateSelector';
import { formatFullName } from '../../common/formatters';

interface GradeModalProps {
    student: Student;
    teacherId: string;
    onClose: () => void;
    onSubmit: (grade: Grade) => void;
    gradeToEdit: Grade | null;
    years: string[];
    availableSubjects: string[];
}

const GradeModal: React.FC<GradeModalProps> = ({ student, teacherId, onClose, onSubmit, gradeToEdit, years, availableSubjects }) => {
    const { settings } = useSettings();
    const [subject, setSubject] = useState('');
    const [score, setScore] = useState('');
    const [date, setDate] = useState({ year: '', month: '', day: '' });

    useEffect(() => {
        const initialDateStr = gradeToEdit ? gradeToEdit.date : new Date().toLocaleDateString('fa-IR-u-nu-latn').replace(/\//g, '-');
        const [y, m, d] = initialDateStr.split('-');
        setDate({ year: y || years[0] || '', month: String(parseInt(m, 10)), day: String(parseInt(d, 10)) });

        if (gradeToEdit) {
            setSubject(gradeToEdit.subject);
            setScore(String(gradeToEdit.score));
        } else {
            setSubject(availableSubjects[0] || '');
        }
    }, [gradeToEdit, availableSubjects, years]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        let scoreValue: number | DescriptiveGrade;
        
        if (settings.gradingSystem === 'numeric') {
            const scoreNumber = parseFloat(score);
            if (!subject || isNaN(scoreNumber) || scoreNumber < 0 || scoreNumber > 20 || !date.year || !date.month || !date.day) {
                alert('لطفا تمامی فیلدها را به درستی وارد کنید. نمره باید بین ۰ تا ۲۰ باشد.');
                return;
            }
            scoreValue = scoreNumber;
        } else {
            if (!subject || !score || !DESCRIPTIVE_GRADES.includes(score as DescriptiveGrade) || !date.year || !date.month || !date.day) {
                alert('لطفا تمامی فیلدها را به درستی انتخاب کنید.');
                return;
            }
            scoreValue = score as DescriptiveGrade;
        }
        
        const formattedDate = `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
        const newGrade: Grade = {
            id: gradeToEdit ? gradeToEdit.id : `g${Date.now()}`,
            studentId: student.id,
            teacherId: gradeToEdit ? gradeToEdit.teacherId : teacherId,
            subject,
            score: scoreValue,
            date: formattedDate,
        };
        onSubmit(newGrade);
    };

    const inputStyle = {
      backgroundColor: 'var(--input-bg)',
      borderColor: 'var(--input-border)',
      color: 'var(--text-primary)'
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4" onClick={onClose}>
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4 text-[var(--text-primary)]">{gradeToEdit ? 'ویرایش' : 'ثبت'} نمره برای: <span className="text-[var(--primary-600)]">{formatFullName(student)}</span></h2>
            <form onSubmit={handleSubmit} className="space-y-4">
               <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)]">تاریخ</label>
                   <DateSelector
                        prefix="grade"
                        year={date.year}
                        month={date.month}
                        day={date.day}
                        onYearChange={(y) => setDate(prev => ({...prev, year: y}))}
                        onMonthChange={(m) => setDate(prev => ({...prev, month: m}))}
                        onDayChange={(d) => setDate(prev => ({...prev, day: d}))}
                        years={years}
                        className="mt-1"
                    />
              </div>
              <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-[var(--text-secondary)]">درس</label>
                  <select
                    id="subject"
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border focus:outline-none focus:ring-[var(--primary-500)] focus:border-[var(--primary-500)] sm:text-sm rounded-md"
                    required
                    style={inputStyle}
                  >
                    {availableSubjects.length > 0 ? (
                        availableSubjects.map(s => <option key={s} value={s}>{s}</option>)
                    ) : (
                        <option value="" disabled>درسی برای این کلاس تعریف نشده</option>
                    )}
                  </select>
              </div>
              <div>
                  <label htmlFor="score" className="block text-sm font-medium text-[var(--text-secondary)]">نمره</label>
                  {settings.gradingSystem === 'numeric' ? (
                     <input type="number" id="score" value={score} onChange={e => setScore(e.target.value)} className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-[var(--primary-500)] focus:border-[var(--primary-500)]" placeholder="مثلا: ۱۸.۵" required step="0.25" min="0" max="20" style={inputStyle}/>
                  ) : (
                    <select id="score" value={score} onChange={e => setScore(e.target.value)} className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm" required style={inputStyle}>
                        <option value="">انتخاب...</option>
                        {DESCRIPTIVE_GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  )}
              </div>
              <div className="flex justify-end gap-4 pt-4">
                  <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition">انصراف</button>
                  <button type="submit" className="px-4 py-2 bg-[var(--primary-600)] text-white rounded-md hover:bg-[var(--primary-700)] transition">{gradeToEdit ? 'ذخیره تغییرات' : 'ثبت'}</button>
              </div>
            </form>
          </div>
        </div>
    );
};

export default GradeModal;