import React, { useState, useMemo, useEffect } from 'react';
import type { Teacher, Student, SchoolClass, Grade, DescriptiveGrade } from '../../../types';
import { DESCRIPTIVE_GRADES } from '../../../types';
import { useData, useSettings } from '../../../App';
import Card from '../../common/Card';
import { useSortableData } from '../../common/useSortableData';
import { SortableHeader } from '../../common/SortableHeader';
import DateSelector from '../../common/DateSelector';
import { formatFullName, toPersianDigits } from '../../common/formatters';
import GradeModal from '../modals/GradeModal';
import { Users, Search, Edit, Trash2, Save, BookOpen } from 'lucide-react';

interface GradesTabProps {
    teacher: Teacher;
    selectedClass: SchoolClass;
    studentsInClass: Student[];
}

const GradesTab: React.FC<GradesTabProps> = ({ teacher, selectedClass, studentsInClass }) => {
    const { grades, saveGroupGrades, saveGrade, deleteGrade } = useData();
    const { settings } = useSettings();

    // State for group entry
    const [subject, setSubject] = useState('');
    const [scores, setScores] = useState<{[studentId: string]: string}>({});
    const [date, setDate] = useState({ year: '', month: '', day: '' });
    const [bulkGrade, setBulkGrade] = useState('');


    // State for list view
    const [filterStudent, setFilterStudent] = useState('');
    const [filterSubject, setFilterSubject] = useState('all');
    const [gradeToEdit, setGradeToEdit] = useState<Grade | null>(null);
    const [studentForModal, setStudentForModal] = useState<Student | null>(null);

    const { items: sortedStudents, requestSort: requestSortStudents, sortConfig: sortConfigStudents } = useSortableData(studentsInClass, [{ key: 'lastName', direction: 'ascending' }, { key: 'firstName', direction: 'ascending' }]);
    
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

    useEffect(() => {
        const [y, m, d] = new Date().toLocaleDateString('fa-IR-u-nu-latn').replace(/\//g, '-').split('-');
        setDate({ year: academicYears.includes(y) ? y : (academicYears[0] || ''), month: String(parseInt(m, 10)), day: String(parseInt(d, 10)) });
    }, [academicYears]);

    useEffect(() => { 
        setSubject(selectedClass.subjects[0] || ''); 
        setScores({});
    }, [selectedClass]);

    const handleApplyToAll = () => {
        if (bulkGrade.trim() === '') {
            alert('لطفا یک نمره برای اعمال انتخاب کنید.');
            return;
        }
        if (settings.gradingSystem === 'numeric') {
            const num = parseFloat(bulkGrade);
            if(isNaN(num) || num < 0 || num > 20) {
                alert('لطفا نمره عددی معتبر بین ۰ تا ۲۰ وارد کنید.');
                return;
            }
        } else {
             if (!DESCRIPTIVE_GRADES.includes(bulkGrade as DescriptiveGrade)) {
                alert('لطفا یک نمره توصیفی معتبر انتخاب کنید.');
                return;
             }
        }

        const newScores: {[studentId: string]: string} = {};
        for (const student of sortedStudents) {
            newScores[student.id] = bulkGrade;
        }
        setScores(newScores);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!subject || !date.year || !date.month || !date.day) {
            alert('لطفا درس و تاریخ را مشخص کنید.');
            return;
        }

        const newGrades: Grade[] = [];
        for (const student of studentsInClass) {
            const scoreStr = scores[student.id];
            if (scoreStr && scoreStr.trim() !== '') {
                let scoreValue: number | DescriptiveGrade | undefined;
                
                if (settings.gradingSystem === 'numeric') {
                    const score = parseFloat(scoreStr);
                    if (!isNaN(score) && score >= 0 && score <= 20) {
                        scoreValue = score;
                    } else {
                        alert(`نمره وارد شده برای ${formatFullName(student)} معتبر نیست.`);
                        return;
                    }
                } else { // descriptive
                    if (DESCRIPTIVE_GRADES.includes(scoreStr as DescriptiveGrade)) {
                        scoreValue = scoreStr as DescriptiveGrade;
                    } else {
                         alert(`نمره توصیفی وارد شده برای ${formatFullName(student)} معتبر نیست.`);
                        return;
                    }
                }
                
                if (scoreValue !== undefined) {
                    const formattedDate = `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
                    newGrades.push({
                        id: `g${Date.now()}-${student.id}`,
                        studentId: student.id,
                        teacherId: teacher.id,
                        subject,
                        score: scoreValue,
                        date: formattedDate,
                    });
                }
            }
        }
        
        if (newGrades.length === 0) {
            alert('لطفا حداقل یک نمره را وارد کنید.');
            return;
        }
        saveGroupGrades(newGrades);
        alert(`${toPersianDigits(newGrades.length)} نمره با موفقیت ثبت شد.`);
        setScores({});
    };

    const handleSaveGrade = (grade: Grade) => {
        saveGrade(grade);
        setGradeToEdit(null);
        setStudentForModal(null);
    };

    const classGrades = useMemo(() => {
        const classStudentIds = new Set(studentsInClass.map(s => s.id));
        let filtered = grades
            .filter(g => classStudentIds.has(g.studentId))
            .map(g => ({...g, student: studentsInClass.find(s => s.id === g.studentId)!}));
        
        if (filterStudent) {
            filtered = filtered.filter(g => formatFullName(g.student).toLowerCase().includes(filterStudent.toLowerCase()));
        }
        if (filterSubject !== 'all') {
            filtered = filtered.filter(g => g.subject === filterSubject);
        }

        return filtered;
    }, [grades, studentsInClass, filterStudent, filterSubject]);

    const { items: sortedGrades, requestSort: requestSortGrades, sortConfig: sortConfigGrades } = useSortableData(classGrades, [{key: 'date', direction: 'descending'}]);

    const inputStyle = {};
    const inputClassName = "px-3 py-2 border rounded-xl shadow-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm";
    const selectClassName = "px-3 py-2 border rounded-xl shadow-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm appearance-none";

    const getScoreStyle = (score: number | DescriptiveGrade): React.CSSProperties => {
        if (typeof score === 'number') {
            return { color: score >= settings.passingGrade ? '#16a34a' : '#dc2626' }; // green-600, red-600
        }
        const colorSetting = settings.descriptiveGradeColors.find(s => s.grade === score);
        if (colorSetting) {
            return { 
                backgroundColor: colorSetting.color, 
                color: 'white', 
                padding: '2px 10px', 
                borderRadius: '9999px',
                fontSize: '0.8rem',
                display: 'inline-block'
            };
        }
        return {};
    };
    
    return (
        <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                        <Users className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-800">ثبت نمره گروهی</h2>
                        <p className="text-sm text-gray-500">برای کلاس {selectedClass.name}</p>
                    </div>
                </div>
                <form onSubmit={handleSubmit} className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <label htmlFor="subject-group" className="block text-sm font-medium text-gray-700 mb-1">درس</label>
                            <select id="subject-group" value={subject} onChange={e => setSubject(e.target.value)} className={`w-full ${selectClassName}`} required style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: `left 0.5rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.5em 1.5em` }}>
                                {selectedClass.subjects.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">تاریخ</label>
                            <DateSelector
                                prefix="group-grade"
                                year={date.year}
                                month={date.month}
                                day={date.day}
                                onYearChange={(y) => setDate(prev => ({...prev, year: y}))}
                                onMonthChange={(m) => setDate(prev => ({...prev, month: m}))}
                                onDayChange={(d) => setDate(prev => ({...prev, day: d}))}
                                years={academicYears}
                            />
                        </div>
                    </div>
                    
                    <div className="flex items-end gap-4 p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl mb-6">
                        <div className="flex-grow relative">
                            <label htmlFor="bulk-grade-input" className="block text-sm font-medium text-indigo-900 mb-1">ثبت یک نمره برای همه</label>
                             {settings.gradingSystem === 'numeric' ? (
                                <input 
                                    id="bulk-grade-input"
                                    type="number"
                                    step="0.25"
                                    min="0"
                                    max="20"
                                    value={bulkGrade}
                                    onChange={e => setBulkGrade(e.target.value)}
                                    className={`w-full ${inputClassName}`}
                                />
                            ) : (
                                <select
                                    id="bulk-grade-input"
                                    value={bulkGrade}
                                    onChange={e => setBulkGrade(e.target.value)}
                                    className={`w-full ${selectClassName}`}
                                    style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: `left 0.5rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.5em 1.5em` }}
                                >
                                    <option value="">انتخاب...</option>
                                    {DESCRIPTIVE_GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                                </select>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={handleApplyToAll}
                            className="px-5 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-sm font-medium whitespace-nowrap shadow-sm transition-colors"
                        >
                            اعمال برای همه
                        </button>
                    </div>


                    <div className="overflow-x-auto border border-gray-100 rounded-xl max-h-96">
                        <table className="w-full text-sm text-right">
                            <thead className="bg-gray-50 border-b border-gray-100 sticky top-0 z-10">
                                <tr className="text-gray-600">
                                    <SortableHeader sortKey="lastName" requestSort={requestSortStudents} sortConfig={sortConfigStudents}>نام خانوادگی</SortableHeader>
                                    <SortableHeader sortKey="firstName" requestSort={requestSortStudents} sortConfig={sortConfigStudents}>نام</SortableHeader>
                                    <th className="px-4 py-3 font-medium text-center w-1/3">نمره</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {sortedStudents.map(student => (
                                    <tr key={student.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-4 py-3 font-medium text-gray-800">{student.lastName}</td>
                                        <td className="px-4 py-3 font-medium text-gray-800">{student.firstName}</td>
                                        <td className="px-4 py-3">
                                            {settings.gradingSystem === 'numeric' ? (
                                                <input 
                                                    type="number" 
                                                    value={scores[student.id] || ''}
                                                    onChange={e => setScores(prev => ({ ...prev, [student.id]: e.target.value }))}
                                                    className={`w-full text-center ${inputClassName}`}
                                                    step="0.25" min="0" max="20"
                                                    placeholder="وارد کنید..."
                                                />
                                            ) : (
                                                <select
                                                    value={scores[student.id] || ''}
                                                    onChange={e => setScores(prev => ({ ...prev, [student.id]: e.target.value }))}
                                                    className={`w-full ${selectClassName}`}
                                                    style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: `left 0.5rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.5em 1.5em` }}
                                                >
                                                    <option value="">...</option>
                                                    {DESCRIPTIVE_GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                                                </select>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex justify-end pt-6 mt-6 border-t border-gray-100">
                        <button type="submit" className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors shadow-sm flex items-center gap-2">
                            <Save className="w-4 h-4" />
                            ذخیره نمرات
                        </button>
                    </div>
                </form>
            </div>
            
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                        <BookOpen className="w-5 h-5" />
                    </div>
                    <h2 className="text-lg font-bold text-gray-800">لیست نمرات ثبت شده</h2>
                </div>
                 <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row gap-4 bg-gray-50/50">
                     <div className="relative w-full md:w-1/2">
                         <input type="text" placeholder="جستجوی دانش آموز..." value={filterStudent} onChange={e => setFilterStudent(e.target.value)} className={`w-full pl-10 ${inputClassName}`} />
                         <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                     </div>
                     <select value={filterSubject} onChange={e => setFilterSubject(e.target.value)} className={`w-full md:w-1/2 ${selectClassName}`} style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: `left 0.5rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.5em 1.5em` }}>
                         <option value="all">همه دروس</option>
                         {selectedClass.subjects.map(s => <option key={s} value={s}>{s}</option>)}
                     </select>
                 </div>
                 <div className="overflow-x-auto max-h-[500px]">
                    <table className="w-full text-sm text-right">
                       <thead className="bg-white border-b border-gray-200 sticky top-0 z-10 text-gray-500">
                           <tr>
                               <th className="px-6 py-4 font-medium">دانش آموز</th>
                               <SortableHeader sortKey="subject" requestSort={requestSortGrades} sortConfig={sortConfigGrades}>درس</SortableHeader>
                               <SortableHeader sortKey="score" requestSort={requestSortGrades} sortConfig={sortConfigGrades} className="text-center">نمره</SortableHeader>
                               <SortableHeader sortKey="date" requestSort={requestSortGrades} sortConfig={sortConfigGrades}>تاریخ</SortableHeader>
                               <th className="px-6 py-4 font-medium">اقدامات</th>
                           </tr>
                       </thead>
                       <tbody className="divide-y divide-gray-100">
                           {sortedGrades.map(grade => (
                               <tr key={grade.id} className="hover:bg-gray-50/50 transition-colors">
                                   <td className="px-6 py-4 font-medium text-gray-800">{formatFullName(grade.student)}</td>
                                   <td className="px-6 py-4 text-gray-600">{grade.subject}</td>
                                   <td className="px-6 py-4 font-bold text-center">
                                       <span style={getScoreStyle(grade.score)} className="shadow-sm">
                                           {toPersianDigits(grade.score)}
                                       </span>
                                   </td>
                                   <td className="px-6 py-4 text-gray-500 font-mono text-xs">{toPersianDigits(grade.date)}</td>
                                   <td className="px-6 py-4">
                                     {grade.teacherId === teacher.id && (
                                       <div className="flex items-center gap-2">
                                         <button onClick={() => {setGradeToEdit(grade); setStudentForModal(grade.student);}} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="ویرایش">
                                            <Edit className="w-4 h-4" />
                                         </button>
                                         <button onClick={() => deleteGrade(grade.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="حذف">
                                            <Trash2 className="w-4 h-4" />
                                         </button>
                                       </div>
                                     )}
                                   </td>
                               </tr>
                           ))}
                       </tbody>
                    </table>
                     {sortedGrades.length === 0 && (
                        <div className="text-center py-12">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-50 mb-4">
                                <Search className="w-8 h-8 text-gray-300" />
                            </div>
                            <p className="text-gray-500 font-medium">نمره‌ای با این مشخصات یافت نشد.</p>
                        </div>
                     )}
                 </div>
            </div>

            {studentForModal && (
                <GradeModal
                    student={studentForModal}
                    teacherId={teacher.id}
                    onClose={() => {setGradeToEdit(null); setStudentForModal(null);}}
                    onSubmit={handleSaveGrade}
                    gradeToEdit={gradeToEdit}
                    years={academicYears}
                    availableSubjects={selectedClass.subjects}
                />
            )}
        </div>
    );
};

export default GradesTab;