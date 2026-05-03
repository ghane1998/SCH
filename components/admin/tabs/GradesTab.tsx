
import React, { useMemo, useState, useEffect } from 'react';
import type { Grade, Student, SchoolClass, Teacher, SchoolSettings, DescriptiveGrade, Admin } from '../../../types';
import { DESCRIPTIVE_GRADES } from '../../../types';
import { useSortableData } from '../../common/useSortableData';
import { SortableHeader } from '../../common/SortableHeader';
import { formatFullName, toPersianDigits } from '../../common/formatters';
import DateSelector from '../../common/DateSelector';
import { ChevronDown, ChevronUp, Plus, Users, Search, Filter, Trash2, Edit, X, Save, FileText } from 'lucide-react';

// #region Helper Components
const ThemedInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
    <input 
        {...props} 
        className={`w-full px-3 py-2 border rounded-xl shadow-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm ${props.className || ''}`} 
    />
);
const ThemedSelect: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
    <select 
        {...props} 
        className={`w-full pl-3 pr-10 py-2 border rounded-xl shadow-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm appearance-none ${props.className || ''}`}
        style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: `left 0.5rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.5em 1.5em` }}
    >{props.children}</select>
);
// #endregion

// #region Modals
interface GradeRecordModalProps {
    gradeToEdit: Grade | null;
    students: Student[];
    classes: SchoolClass[];
    teachers: Teacher[];
    admins: Admin[];
    onClose: () => void;
    onSubmit: (grade: Grade) => void;
    years: string[];
    settings: SchoolSettings;
}
const GradeRecordModal: React.FC<GradeRecordModalProps> = ({ gradeToEdit, students, classes, teachers, admins, onClose, onSubmit, years, settings }) => {
    const [studentId, setStudentId] = useState('');
    const [subject, setSubject] = useState('');
    const [score, setScore] = useState('');
    const [teacherId, setTeacherId] = useState('');
    const [date, setDate] = useState({ year: '', month: '', day: '' });
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

    const availableSubjects = useMemo(() => {
        if (!studentId) return [];
        const student = students.find(s => s.id === studentId);
        if (!student) return [];
        const studentClass = classes.find(c => c.id === student.classId);
        return studentClass ? studentClass.subjects : [];
    }, [studentId, students, classes]);

    useEffect(() => {
        if (gradeToEdit) {
            setStudentId(gradeToEdit.studentId);
            const student = students.find(s => s.id === gradeToEdit.studentId);
            if(student) {
                setSearchTerm(formatFullName(student));
            }
            setSubject(gradeToEdit.subject);
            setScore(String(gradeToEdit.score));
            setTeacherId(gradeToEdit.teacherId);
            const [y, m, d] = gradeToEdit.date.split('-');
            setDate({ year: y, month: String(parseInt(m,10)), day: String(parseInt(d,10)) });
        } else {
            setStudentId('');
            setSearchTerm('');
            setSubject('');
            setScore('');
            setTeacherId('');
            setDate({ year: '', month: '', day: '' });
        }
    }, [gradeToEdit, students]);
    
    useEffect(() => {
        if (subject && !availableSubjects.includes(subject)) {
            setSubject(availableSubjects[0] || '');
        }
    }, [availableSubjects, subject]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        let scoreValue: number | DescriptiveGrade;

        if (settings.gradingSystem === 'numeric') {
            const scoreNumber = parseFloat(score);
            if (!studentId || !subject || isNaN(scoreNumber) || scoreNumber < 0 || scoreNumber > 20 || !date.year) {
                alert('لطفا تمامی فیلدها را به درستی وارد کنید. نمره باید بین ۰ تا ۲۰ باشد.');
                return;
            }
            scoreValue = scoreNumber;
        } else {
            if (!studentId || !subject || !score || !DESCRIPTIVE_GRADES.includes(score as DescriptiveGrade) || !date.year) {
                alert('لطفا یک نمره توصیفی معتبر انتخاب کنید.');
                return;
            }
            scoreValue = score as DescriptiveGrade;
        }

        const recorderId = teacherId || (admins.length > 0 ? admins[0].id : '');
        onSubmit({
            id: gradeToEdit ? gradeToEdit.id : `g${Date.now()}`,
            studentId,
            teacherId: recorderId,
            subject,
            score: scoreValue,
            date: `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`,
        });
    };
    
    const allRecorders = [...teachers, ...admins];

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg relative border border-gray-100" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        {gradeToEdit ? <Edit className="w-5 h-5 text-blue-500" /> : <Plus className="w-5 h-5 text-blue-500" />}
                        {gradeToEdit ? 'ویرایش نمره' : 'افزودن نمره جدید'}
                    </h2>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-5 relative">
                    <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 mb-1">دانش آموز</label>
                        <div className="relative">
                            <ThemedInput
                                type="text"
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setIsDropdownOpen(true);
                                    if (e.target.value === '') setStudentId('');
                                }}
                                onFocus={() => setIsDropdownOpen(true)}
                                onBlur={() => setTimeout(() => setIsDropdownOpen(false), 150)}
                                placeholder="جستجوی نام دانش آموز..."
                                required={!studentId}
                                autoComplete="off"
                                className="pl-10"
                            />
                            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        </div>
                        {isDropdownOpen && filteredStudents.length > 0 && (
                            <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                                <ul className="p-1">
                                    {filteredStudents.map(s => (
                                        <li key={s.id}
                                            className="px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg cursor-pointer transition-colors"
                                            onClick={() => {
                                                setStudentId(s.id);
                                                setSearchTerm(formatFullName(s));
                                                setIsDropdownOpen(false);
                                            }}
                                        >
                                            {formatFullName(s)} - <span className="text-gray-400 text-xs">{s.className}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                     <div className="relative"><label className="block text-sm font-medium text-gray-700 mb-1">تاریخ</label><DateSelector prefix="grade" year={date.year} month={date.month} day={date.day} onYearChange={(y) => setDate(prev => ({...prev, year: y}))} onMonthChange={(m) => setDate(prev => ({...prev, month: m}))} onDayChange={(d) => setDate(prev => ({...prev, day: d}))} years={years} /></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="relative"><label className="block text-sm font-medium text-gray-700 mb-1">درس</label><ThemedSelect value={subject} onChange={e => setSubject(e.target.value)} required disabled={availableSubjects.length === 0}>{availableSubjects.length > 0 ? (<><option value="">انتخاب درس...</option>{availableSubjects.map(s => <option key={s} value={s}>{s}</option>)}</>) : (<option>ابتدا دانش آموز را انتخاب کنید</option>)}</ThemedSelect></div>
                        <div className="relative">
                            <label className="block text-sm font-medium text-gray-700 mb-1">نمره</label>
                            {settings.gradingSystem === 'numeric' ? (
                                <ThemedInput type="number" value={score} onChange={e => setScore(e.target.value)} step="0.25" min="0" max="20" required/>
                            ) : (
                                <ThemedSelect value={score} onChange={e => setScore(e.target.value)} required>
                                    <option value="">انتخاب...</option>
                                    {DESCRIPTIVE_GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                                </ThemedSelect>
                            )}
                        </div>
                    </div>
                    <div className="relative"><label className="block text-sm font-medium text-gray-700 mb-1">ثبت توسط</label><ThemedSelect value={teacherId} onChange={e => setTeacherId(e.target.value)}><option value="">(مدیریت)</option>{allRecorders.map(r => <option key={r.id} value={r.id}>{formatFullName(r)}</option>)}</ThemedSelect></div>
                    <div className="flex justify-end gap-3 pt-6 border-t">
                        <button type="button" onClick={onClose} className="px-5 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors">انصراف</button>
                        <button type="submit" className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 shadow-sm transition-colors flex items-center gap-2">
                            <Save className="w-4 h-4" />
                            {gradeToEdit ? 'ذخیره تغییرات' : 'ثبت نمره'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

interface GroupGradeModalProps {
    classes: SchoolClass[];
    students: Student[];
    teachers: Teacher[];
    admins: Admin[];
    onClose: () => void;
    onSubmit: (newGrades: Grade[]) => void;
    years: string[];
    settings: SchoolSettings;
}
const GroupGradeModal: React.FC<GroupGradeModalProps> = ({ classes, students, teachers, admins, onClose, onSubmit, years, settings }) => {
    const [selectedClassId, setSelectedClassId] = useState<string>('');
    const [subject, setSubject] = useState('');
    const [date, setDate] = useState({ year: '', month: '', day: '' });
    const [scores, setScores] = useState<Record<string, string>>({});
    const [bulkGrade, setBulkGrade] = useState('');
    
    const studentsInClass = useMemo(() => students.filter(s => s.classId === selectedClassId), [students, selectedClassId]);
    const classSubjects = useMemo(() => classes.find(c => c.id === selectedClassId)?.subjects || [], [classes, selectedClassId]);

    useEffect(() => {
        if(classes.length > 0) setSelectedClassId(classes[0].id);
    }, [classes]);
    
    useEffect(() => {
        setSubject(classSubjects[0] || '');
    }, [classSubjects]);

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
        for (const student of studentsInClass) {
            newScores[student.id] = bulkGrade;
        }
        setScores(newScores);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newGrades = studentsInClass.reduce((acc, student) => {
            const scoreStr = scores[student.id];
            if (scoreStr && scoreStr.trim() !== '') {
                let scoreValue: number | DescriptiveGrade | undefined;
                if (settings.gradingSystem === 'numeric') {
                    const score = parseFloat(scoreStr);
                    if (!isNaN(score) && score >= 0 && score <= 20) {
                        scoreValue = score;
                    }
                } else {
                    if (DESCRIPTIVE_GRADES.includes(scoreStr as DescriptiveGrade)) {
                        scoreValue = scoreStr as DescriptiveGrade;
                    }
                }
                
                if (scoreValue !== undefined) {
                    acc.push({
                        id: `g-group-${Date.now()}-${student.id}`,
                        studentId: student.id,
                        teacherId: classes.find(c => c.id === selectedClassId)?.teacherId || (admins.length > 0 ? admins[0].id : ''),
                        subject,
                        score: scoreValue,
                        date: `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`
                    });
                }
            }
            return acc;
        }, [] as Grade[]);

        if (newGrades.length > 0) {
            onSubmit(newGrades);
        } else {
            alert('هیچ نمره معتبری برای ثبت وجود ندارد.');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col border border-gray-100" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-6 border-b">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <Users className="w-5 h-5 text-indigo-500" />
                        ثبت گروهی نمرات
                    </h2>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="flex-grow flex flex-col min-h-0">
                    <div className="p-6 space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">کلاس</label><ThemedSelect value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)}><option value="">انتخاب کلاس...</option>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</ThemedSelect></div>
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">درس</label><ThemedSelect value={subject} onChange={e => setSubject(e.target.value)} disabled={!selectedClassId}><option value="">انتخاب درس...</option>{classSubjects.map(s => <option key={s} value={s}>{s}</option>)}</ThemedSelect></div>
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">تاریخ</label><DateSelector prefix="group-grade" year={date.year} month={date.month} day={date.day} onYearChange={y=>setDate(p=>({...p, year: y}))} onMonthChange={m=>setDate(p=>({...p, month: m}))} onDayChange={d=>setDate(p=>({...p, day: d}))} years={years} /></div>
                        </div>
                        <div className="flex items-end gap-4 p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
                            <div className="flex-grow">
                                <label htmlFor="bulk-grade-input" className="block text-sm font-medium text-indigo-900 mb-1">ثبت یک نمره برای همه</label>
                             {settings.gradingSystem === 'numeric' ? (
                                <ThemedInput 
                                    id="bulk-grade-input"
                                    type="number"
                                    step="0.25"
                                    min="0"
                                    max="20"
                                    value={bulkGrade}
                                    onChange={e => setBulkGrade(e.target.value)}
                                />
                            ) : (
                                <ThemedSelect
                                    id="bulk-grade-input"
                                    value={bulkGrade}
                                    onChange={e => setBulkGrade(e.target.value)}
                                >
                                    <option value="">انتخاب...</option>
                                    {DESCRIPTIVE_GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                                </ThemedSelect>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={handleApplyToAll}
                            className="px-4 py-2 bg-indigo-500 text-white rounded-md text-sm whitespace-nowrap"
                        >
                            اعمال برای همه
                        </button>
                    </div>
                    <div className="overflow-y-auto flex-grow border-t pt-2">
                        <table className="w-full text-sm">
                           <thead><tr className="text-right"><th className="p-2">دانش آموز</th><th className="p-2">نمره</th></tr></thead>
                           <tbody>
                               {studentsInClass.map(s => (
                                   <tr key={s.id} className="border-b">
                                       <td className="p-2">{formatFullName(s)}</td>
                                       <td className="p-2">
                                            {settings.gradingSystem === 'numeric' ? (
                                                <ThemedInput type="number" step="0.25" min="0" max="20" value={scores[s.id] || ''} onChange={e => setScores(prev => ({...prev, [s.id]: e.target.value}))} />
                                            ) : (
                                                <ThemedSelect value={scores[s.id] || ''} onChange={e => setScores(prev => ({...prev, [s.id]: e.target.value}))}>
                                                    <option value="">...</option>
                                                    {DESCRIPTIVE_GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                                                </ThemedSelect>
                                            )}
                                       </td>
                                   </tr>
                               ))}
                           </tbody>
                        </table>
                    </div>
                    </div>
                    <div className="flex justify-end gap-4 p-6 border-t bg-gray-50 rounded-b-2xl">
                         <button type="button" onClick={onClose} className="px-5 py-2 text-gray-600 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-medium shadow-sm">انصراف</button>
                         <button type="submit" className="px-5 py-2 bg-blue-600 font-medium text-white shadow-sm rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2">
                            <Save className="w-4 h-4" />
                            ذخیره
                         </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

interface ReportDetailModalProps {
    data: { studentName: string; matchingGrades: Grade[]; filterCriteria: string };
    onClose: () => void;
    settings: SchoolSettings;
}
const ReportDetailModal: React.FC<ReportDetailModalProps> = ({ data, onClose, settings }) => {
    const getScoreStyle = (score: number | DescriptiveGrade): React.CSSProperties => {
        if (typeof score === 'number') {
            return { color: score >= settings.passingGrade ? '#16a34a' : '#dc2626' };
        }
        const colorSetting = settings.descriptiveGradeColors.find(s => s.grade === score);
        if (colorSetting) {
            return { 
                backgroundColor: colorSetting.color, 
                color: 'white', 
                padding: '2px 8px', 
                borderRadius: '9999px',
                fontSize: '0.75rem',
                display: 'inline-block'
            };
        }
        return {};
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg border border-gray-100" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-gray-800">جزئیات گزارش</h3>
                        <p className="mt-1 text-sm text-gray-500">برای {data.studentName}</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="bg-blue-50 text-blue-800 p-3 rounded-xl text-sm mb-4 border border-blue-100 flex items-center gap-2">
                    <Filter className="w-4 h-4 text-blue-500" />
                    <span>مطابق با فیلتر: <span className="font-semibold">{data.filterCriteria}</span></span>
                </div>
                <div className="max-h-80 overflow-y-auto bg-gray-50/50 rounded-xl border border-gray-100">
                    <table className="w-full text-sm text-right">
                        <thead className="bg-gray-100/80 sticky top-0 backdrop-blur-sm">
                            <tr className="text-gray-600">
                                <th className="px-4 py-3 font-medium">تاریخ</th>
                                <th className="px-4 py-3 font-medium">درس</th>
                                <th className="px-4 py-3 font-medium text-center">نمره</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {data.matchingGrades.map(grade => (
                                <tr key={grade.id} className="hover:bg-white transition-colors">
                                    <td className="px-4 py-3 text-gray-600">{toPersianDigits(grade.date)}</td>
                                    <td className="px-4 py-3 font-medium text-gray-800">{grade.subject}</td>
                                    <td className="px-4 py-3 text-center">
                                        <span style={getScoreStyle(grade.score)} className="shadow-sm">
                                            {toPersianDigits(grade.score)}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="mt-6 flex justify-end">
                    <button onClick={onClose} className="px-6 py-2 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors">بستن</button>
                </div>
            </div>
        </div>
    );
};
// #endregion

interface GradesTabProps {
    grades: Grade[];
    students: Student[];
    classes: SchoolClass[];
    teachers: Teacher[];
    admins: Admin[];
    years: string[];
    saveGrade: (grade: Grade) => void;
    deleteGrade: (id: string) => void;
    saveGroupGrades: (grades: Grade[]) => void;
    settings: SchoolSettings;
}

const GradesTab: React.FC<GradesTabProps> = (props) => {
    const { grades, students, classes, teachers, admins, years, saveGrade, deleteGrade, saveGroupGrades, settings } = props;
    const [studentNameFilter, setStudentNameFilter] = useState('');
    const [classFilter, setClassFilter] = useState('');
    const [subjectFilter, setSubjectFilter] = useState('');
    const [teacherFilter, setTeacherFilter] = useState('');
    const [minScoreFilter, setMinScoreFilter] = useState('');
    const [maxScoreFilter, setMaxScoreFilter] = useState('');
    const [descriptiveScoreFilter, setDescriptiveScoreFilter] = useState('');
    const [startDate, setStartDate] = useState({ year: '', month: '', day: '' });
    const [endDate, setEndDate] = useState({ year: '', month: '', day: '' });
    const [activeModal, setActiveModal] = useState<'add_edit' | 'group' | null>(null);
    const [gradeToEdit, setGradeToEdit] = useState<Grade | null>(null);
    const [isFilterVisible, setIsFilterVisible] = useState(true);
    
    // New state for reporting
    const [isReportSectionVisible, setIsReportSectionVisible] = useState(false);
    const [reportFilters, setReportFilters] = useState({
        grade: settings.gradingSystem === 'descriptive' ? 'نیاز به تلاش بیشتر' as DescriptiveGrade : '',
        numericOperator: 'lt' as 'lt' | 'gt' | 'eq',
        numericValue: 10,
        count: 2,
        subject: 'all',
        startDate: { year: '', month: '', day: '' },
        endDate: { year: '', month: '', day: '' },
    });
    const [reportResults, setReportResults] = useState<{ studentId: string; studentName: string; className: string; firstName: string; lastName: string; count: number; matchingGrades: Grade[] }[]>([]);
    const [detailModalData, setDetailModalData] = useState<ReportDetailModalProps['data'] | null>(null);

    const allRecorders = useMemo(() => [...teachers, ...admins], [teachers, admins]);
    const allSubjects = useMemo(() => Array.from(new Set(classes.flatMap(c => c.subjects))), [classes]);

    const startDateFilter = useMemo(() => (startDate.year ? `${startDate.year}-${String(startDate.month).padStart(2, '0')}-${String(startDate.day).padStart(2, '0')}` : ''), [startDate]);
    const endDateFilter = useMemo(() => (endDate.year ? `${endDate.year}-${String(endDate.month).padStart(2, '0')}-${String(endDate.day).padStart(2, '0')}` : ''), [endDate]);

    const handleAdd = () => { setGradeToEdit(null); setActiveModal('add_edit'); };
    const handleEdit = (grade: Grade) => { setGradeToEdit(grade); setActiveModal('add_edit'); };
    const handleGroupAdd = () => setActiveModal('group');
    const closeModal = () => { setActiveModal(null); setGradeToEdit(null); };

    const handleClearFilters = () => {
        setStudentNameFilter(''); setClassFilter(''); setSubjectFilter(''); setTeacherFilter('');
        setMinScoreFilter(''); setMaxScoreFilter(''); setDescriptiveScoreFilter('');
        setStartDate({ year: '', month: '', day: '' }); setEndDate({ year: '', month: '', day: '' });
    };

    const enrichedGrades = useMemo(() => grades.map(grade => {
        const student = students.find(s => s.id === grade.studentId);
        const teacher = allRecorders.find(t => t.id === grade.teacherId);
        return {
            ...grade,
            studentName: student ? formatFullName(student) : 'حذف شده',
            className: student?.className || 'نامشخص',
            firstName: student?.firstName || '',
            lastName: student?.lastName || '',
            teacherName: teacher ? formatFullName(teacher) : 'سیستم'
        };
    }), [grades, students, allRecorders]);

    const filteredGrades = useMemo(() => {
        const minScore = minScoreFilter ? parseFloat(minScoreFilter) : -Infinity;
        const maxScore = maxScoreFilter ? parseFloat(maxScoreFilter) : Infinity;
    
        return enrichedGrades.filter(grade => {
            if (studentNameFilter && !grade.studentName.toLowerCase().includes(studentNameFilter.toLowerCase())) return false;
            if (classFilter && grade.className !== classes.find(c => c.id === classFilter)?.name) return false;
            if (subjectFilter && !grade.subject.toLowerCase().includes(subjectFilter.toLowerCase())) return false;
            if (teacherFilter && grade.teacherId !== teacherFilter) return false;
            if (startDateFilter && grade.date < startDateFilter) return false;
            if (endDateFilter && grade.date > endDateFilter) return false;
    
            if (settings.gradingSystem === 'numeric') {
                if (typeof grade.score !== 'number') return false;
                if (minScoreFilter && grade.score < minScore) return false;
                if (maxScoreFilter && grade.score > maxScore) return false;
            } else {
                if (typeof grade.score !== 'string') return false;
                if (descriptiveScoreFilter && grade.score !== descriptiveScoreFilter) return false;
            }
            return true;
        });
    }, [enrichedGrades, studentNameFilter, classFilter, subjectFilter, teacherFilter, minScoreFilter, maxScoreFilter, descriptiveScoreFilter, startDateFilter, endDateFilter, classes, settings.gradingSystem]);

    const { items: sortedGrades, requestSort, sortConfig } = useSortableData(filteredGrades, [{ key: 'lastName', direction: 'ascending' }, { key: 'firstName', direction: 'ascending' }]);

    const filterInputClass = "w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-[var(--primary-500)] focus:border-[var(--primary-500)]";

    const getScoreStyle = (score: number | DescriptiveGrade): React.CSSProperties => {
        if (typeof score === 'number') return { color: score >= settings.passingGrade ? '#16a34a' : '#dc2626' };
        const colorSetting = settings.descriptiveGradeColors.find(s => s.grade === score);
        if (colorSetting) return { backgroundColor: colorSetting.color, color: 'white', padding: '2px 10px', borderRadius: '9999px', fontSize: '0.8rem', display: 'inline-block' };
        return {};
    };

    // Reporting Logic
    const handleReportFilterChange = (field: keyof typeof reportFilters, value: any) => setReportFilters(prev => ({ ...prev, [field]: value }));
    
    const handleGenerateReport = () => {
        const { grade, numericOperator, numericValue, count, subject, startDate, endDate } = reportFilters;
        
        const startDateStr = startDate.year ? `${startDate.year}-${String(startDate.month).padStart(2, '0')}-${String(startDate.day).padStart(2, '0')}` : '';
        const endDateStr = endDate.year ? `${endDate.year}-${String(endDate.month).padStart(2, '0')}-${String(endDate.day).padStart(2, '0')}` : '9999-99-99';

        const results: typeof reportResults = [];

        students.forEach(student => {
            const studentGrades = grades.filter(g => g.studentId === student.id);
            const matchingGrades = studentGrades.filter(g => {
                if (startDateStr && g.date < startDateStr) return false;
                if (g.date > endDateStr) return false;
                if (subject !== 'all' && g.subject !== subject) return false;
                if (settings.gradingSystem === 'descriptive') return g.score === grade;
                if (typeof g.score !== 'number') return false;
                switch (numericOperator) {
                    case 'lt': return g.score < numericValue;
                    case 'gt': return g.score > numericValue;
                    case 'eq': return g.score === numericValue;
                    default: return false;
                }
            });

            if (matchingGrades.length > count) {
                results.push({
                    studentId: student.id, studentName: formatFullName(student), className: student.className,
                    firstName: student.firstName, lastName: student.lastName, count: matchingGrades.length,
                    matchingGrades: matchingGrades.sort((a,b) => b.date.localeCompare(a.date, 'fa-IR')),
                });
            }
        });
        setReportResults(results);
    };
    
    const { items: sortedReportResults, requestSort: requestSortReport, sortConfig: sortConfigReport } = useSortableData(reportResults, [{ key: 'count', direction: 'descending' }]);

    return (
        <>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">مدیریت نمرات</h2>
                        <p className="text-sm text-gray-500 mt-1">مشاهده، جستجو و ثبت نمرات دانش‌آموزان</p>
                    </div>
                     <div className="flex gap-3">
                        <button onClick={handleGroupAdd} className="px-4 py-2 bg-white border border-indigo-200 text-indigo-700 font-medium rounded-xl hover:bg-indigo-50 transition flex items-center gap-2 shadow-sm">
                            <Users className="w-4 h-4" />
                            <span>ثبت گروهی</span>
                        </button>
                        <button onClick={handleAdd} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition flex items-center gap-2 shadow-sm shadow-blue-600/20">
                            <Plus className="w-4 h-4" />
                            <span>افزودن نمره</span>
                        </button>
                    </div>
                </div>

                {/* Report Section */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <button className="w-full flex justify-between items-center p-5 hover:bg-gray-50 transition-colors" onClick={() => setIsReportSectionVisible(!isReportSectionVisible)}>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                <FileText className="w-5 h-5" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-800">گزارش‌گیری پیشرفته</h3>
                        </div>
                        {isReportSectionVisible ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                    </button>
                    <div className={`transition-all duration-300 ease-in-out ${isReportSectionVisible ? 'max-h-[1500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                        <div className="p-5 border-t border-gray-100 bg-gray-50/30">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                                 <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">شرط نمره</label>
                                {settings.gradingSystem === 'descriptive' ? (
                                    <ThemedSelect value={reportFilters.grade} onChange={e => handleReportFilterChange('grade', e.target.value)}>
                                        {DESCRIPTIVE_GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                                    </ThemedSelect>
                                ) : (
                                    <div className="flex gap-2">
                                        <ThemedSelect value={reportFilters.numericOperator} onChange={e => handleReportFilterChange('numericOperator', e.target.value)} className="w-2/5">
                                            <option value="lt">کمتر از</option><option value="gt">بیشتر از</option><option value="eq">مساوی با</option>
                                        </ThemedSelect>
                                        <ThemedInput type="number" value={reportFilters.numericValue} onChange={e => handleReportFilterChange('numericValue', Number(e.target.value))} className="w-3/5" />
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">بیشتر از (تعداد)</label>
                                <ThemedInput type="number" min="0" value={reportFilters.count} onChange={e => handleReportFilterChange('count', Number(e.target.value))} />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">درس</label>
                                <ThemedSelect value={reportFilters.subject} onChange={e => handleReportFilterChange('subject', e.target.value)}>
                                    <option value="all">همه دروس</option>
                                    {allSubjects.map(s => <option key={s} value={s}>{s}</option>)}
                                </ThemedSelect>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">از تاریخ</label>
                                <DateSelector prefix="rep-start" years={years} year={reportFilters.startDate.year} month={reportFilters.startDate.month} day={reportFilters.startDate.day} onYearChange={y=>handleReportFilterChange('startDate', {...reportFilters.startDate, year:y})} onMonthChange={m=>handleReportFilterChange('startDate', {...reportFilters.startDate, month:m})} onDayChange={d=>handleReportFilterChange('startDate', {...reportFilters.startDate, day:d})} />
                                                       </div>
                                <div className="lg:col-span-5 flex justify-end mt-2">
                                    <button onClick={handleGenerateReport} className="px-6 py-2.5 bg-gray-800 text-white font-medium rounded-xl hover:bg-gray-900 transition shadow-sm flex items-center gap-2">
                                        <FileText className="w-4 h-4" />
                                        ایجاد گزارش
                                    </button>
                                </div>
                            </div>
    
                            {reportResults.length > 0 && (
                                <div className="mt-6 border-t border-gray-200 pt-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="font-bold text-gray-800 text-lg">نتایج گزارش</h4>
                                        <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-full">{toPersianDigits(reportResults.length)} دانش‌آموز</span>
                                    </div>
                                    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                                        <div className="overflow-x-auto max-h-96">
                                            <table className="w-full text-sm text-right">
                                                <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                                                    <tr className="text-gray-600">
                                                        <SortableHeader sortKey="lastName" requestSort={requestSortReport} sortConfig={sortConfigReport}>دانش آموز</SortableHeader>
                                                        <SortableHeader sortKey="className" requestSort={requestSortReport} sortConfig={sortConfigReport}>کلاس</SortableHeader>
                                                        <SortableHeader className="text-center" sortKey="count" requestSort={requestSortReport} sortConfig={sortConfigReport}>تعداد موارد</SortableHeader>
                                                        <th className="px-4 py-3 font-medium">اقدامات</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {sortedReportResults.map(res => (
                                                    <tr key={res.studentId} className="hover:bg-gray-50/50 transition-colors">
                                                        <td className="px-4 py-3 font-medium text-gray-800">{res.studentName}</td>
                                                        <td className="px-4 py-3 text-gray-600">{res.className}</td>
                                                        <td className="px-4 py-3 font-bold text-red-600 text-center text-base">{toPersianDigits(res.count)}</td>
                                                        <td className="px-4 py-3">
                                                            <button onClick={() => setDetailModalData({ studentName: res.studentName, matchingGrades: res.matchingGrades, filterCriteria: `بیش از ${toPersianDigits(reportFilters.count)} نمره '${settings.gradingSystem === 'numeric' ? reportFilters.numericOperator + ' ' + reportFilters.numericValue : reportFilters.grade}'` })} className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1 bg-blue-50 px-2 py-1.5 rounded-lg transition-colors">
                                                                <Search className="w-3.5 h-3.5" />
                                                                جزئیات
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                
                {/* Filters & Table */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                     <button className="w-full flex justify-between items-center p-5 hover:bg-gray-50 transition-colors border-b border-gray-100" onClick={() => setIsFilterVisible(!isFilterVisible)}>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                <Filter className="w-5 h-5" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-800">لیست و فیلتر نمرات</h3>
                        </div>
                        {isFilterVisible ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                    </button>
                     <div className={`transition-all duration-300 ease-in-out ${isFilterVisible ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'}`}>
                        <div className="p-5 bg-gray-50/50">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                                <div><label className="block text-xs font-medium text-gray-500 mb-1 ml-1">جستجوی نام</label><ThemedInput placeholder="نام دانش آموز..." value={studentNameFilter} onChange={e => setStudentNameFilter(e.target.value)} /></div>
                                <div><label className="block text-xs font-medium text-gray-500 mb-1 ml-1">کلاس</label><ThemedSelect value={classFilter} onChange={e => setClassFilter(e.target.value)}><option value="">همه کلاس ها</option>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</ThemedSelect></div>
                                <div><label className="block text-xs font-medium text-gray-500 mb-1 ml-1">درس</label><ThemedInput placeholder="جستجوی درس..." value={subjectFilter} onChange={e => setSubjectFilter(e.target.value)} /></div>
                                <div><label className="block text-xs font-medium text-gray-500 mb-1 ml-1">ثبت کننده</label><ThemedSelect value={teacherFilter} onChange={e => setTeacherFilter(e.target.value)}><option value="">همه ثبت کنندگان</option>{allRecorders.map(r => <option key={r.id} value={r.id}>{formatFullName(r)}</option>)}</ThemedSelect></div>
                                <div className="lg:col-span-2">
                                    <label className="block text-xs font-medium text-gray-500 mb-1 ml-1">محدوده نمره</label>
                                    {settings.gradingSystem === 'numeric' ? (
                                        <div className="flex gap-2"><ThemedInput type="number" placeholder="حداقل نمره" value={minScoreFilter} onChange={e => setMinScoreFilter(e.target.value)} /><ThemedInput type="number" placeholder="حداکثر نمره" value={maxScoreFilter} onChange={e => setMaxScoreFilter(e.target.value)} /></div>
                                    ) : (
                                        <ThemedSelect value={descriptiveScoreFilter} onChange={e => setDescriptiveScoreFilter(e.target.value)}>
                                            <option value="">همه نمرات</option>{DESCRIPTIVE_GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                                        </ThemedSelect>
                                    )}
                                </div>
                                <div><label className="block text-xs font-medium text-gray-500 mb-1 ml-1">از تاریخ</label><DateSelector prefix="grade-start" year={startDate.year} month={startDate.month} day={startDate.day} onYearChange={y=>setStartDate(p=>({...p, year: y}))} onMonthChange={m=>setStartDate(p=>({...p, month: m}))} onDayChange={d=>setStartDate(p=>({...p, day: d}))} years={years} /></div>
                                <div><label className="block text-xs font-medium text-gray-500 mb-1 ml-1">تا تاریخ</label><DateSelector prefix="grade-end" year={endDate.year} month={endDate.month} day={endDate.day} onYearChange={y=>setEndDate(p=>({...p, year: y}))} onMonthChange={m=>setEndDate(p=>({...p, month: m}))} onDayChange={d=>setEndDate(p=>({...p, day: d}))} years={years} /></div>
                                <button onClick={handleClearFilters} className="px-4 py-2 mt-2 text-sm font-medium bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl h-[42px] transition-colors lg:col-start-4">پاک کردن فیلترها</button>
                            </div>
                        </div>

                        <div className="overflow-x-auto border-t border-gray-100">
                            <table className="w-full text-sm text-right">
                                <thead className="bg-white border-b border-gray-200">
                                    <tr className="text-gray-500">
                                        <SortableHeader sortKey="lastName" requestSort={requestSort} sortConfig={sortConfig}>نام خانوادگی</SortableHeader>
                                        <SortableHeader sortKey="firstName" requestSort={requestSort} sortConfig={sortConfig}>نام</SortableHeader>
                                        <SortableHeader sortKey="subject" requestSort={requestSort} sortConfig={sortConfig}>درس</SortableHeader>
                                        <SortableHeader sortKey="score" requestSort={requestSort} sortConfig={sortConfig} className="text-center">نمره</SortableHeader>
                                        <SortableHeader sortKey="date" requestSort={requestSort} sortConfig={sortConfig}>تاریخ</SortableHeader>
                                        <SortableHeader sortKey="teacherName" requestSort={requestSort} sortConfig={sortConfig}>ثبت توسط</SortableHeader>
                                        <th className="px-4 py-3 font-medium">اقدامات</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {sortedGrades.map(grade => (
                                        <tr key={grade.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-4 py-3 font-medium text-gray-800">{grade.lastName}</td>
                                            <td className="px-4 py-3 font-medium text-gray-800">{grade.firstName}</td>
                                            <td className="px-4 py-3 text-gray-600">{grade.subject}</td>
                                            <td className="px-4 py-3 font-bold text-center"><span style={getScoreStyle(grade.score)} className="shadow-sm">{toPersianDigits(grade.score)}</span></td>
                                            <td className="px-4 py-3 text-gray-500 font-mono text-xs">{toPersianDigits(grade.date)}</td>
                                            <td className="px-4 py-3 text-gray-600 text-xs">{grade.teacherName}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => handleEdit(grade)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="ویرایش">
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => deleteGrade(grade.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="حذف">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
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
                                    <p className="text-gray-500 font-medium">هیچ نمره‌ای با این مشخصات یافت نشد.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            
            {activeModal === 'add_edit' && <GradeRecordModal gradeToEdit={gradeToEdit} students={students} classes={classes} teachers={teachers} admins={admins} onClose={closeModal} onSubmit={grade => { saveGrade(grade); closeModal(); }} years={years} settings={settings} />}
            {activeModal === 'group' && <GroupGradeModal classes={classes} students={students} teachers={teachers} admins={admins} onClose={closeModal} onSubmit={grades => { saveGroupGrades(grades); closeModal(); }} years={years} settings={settings} />}
            {detailModalData && <ReportDetailModal data={detailModalData} onClose={() => setDetailModalData(null)} settings={settings} />}
        </>
    );
};

export default GradesTab;
