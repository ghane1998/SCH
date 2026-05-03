import React, { useMemo, useState, useEffect } from 'react';
import { 
    ShieldAlert, Users, Calendar as CalendarIcon, FileSignature, 
    CheckCircle, X, Search, Filter, Plus, Edit, Trash2, Shield 
} from 'lucide-react';
import type { DisciplinaryIncident, Student, SchoolSettings, Teacher, SchoolClass, Admin } from '../../../types';
import { useSortableData } from '../../common/useSortableData';
import { SortableHeader } from '../../common/SortableHeader';
import { formatFullName, toPersianDigits } from '../../common/formatters';
import DateSelector from '../../common/DateSelector';

// #region Helper Components
const ThemedSelect: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
    <select 
        {...props} 
        className={`block w-full pl-3 pr-10 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white ${props.className || ''}`}
    >{props.children}</select>
);
const ThemedTextarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = (props) => (
    <textarea
        {...props}
        className={`block w-full p-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white resize-none ${props.className || ''}`}
    />
);
const ThemedInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
    <input 
        {...props} 
        className={`w-full pl-3 pr-10 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white ${props.className || ''}`} 
    />
);
const ChevronIcon = ({ direction = 'down', className = 'h-5 w-5 text-gray-400' }: { direction: 'up' | 'down', className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`${className} transition-transform duration-300 ${direction === 'up' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
);
// #endregion

// #region Modals
interface DisciplineRecordModalProps {
    incidentToEdit: DisciplinaryIncident | null;
    students: Student[];
    teachers: Teacher[];
    admins: Admin[];
    settings: SchoolSettings;
    onClose: () => void;
    onSubmit: (incident: DisciplinaryIncident) => void;
    years: string[];
}
const DisciplineRecordModal: React.FC<DisciplineRecordModalProps> = ({ incidentToEdit, students, teachers, admins, settings, onClose, onSubmit, years }) => {
    const [studentId, setStudentId] = useState('');
    const [reportedBy, setReportedBy] = useState('');
    const [date, setDate] = useState({ year: '', month: '', day: ''});
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');
    const [actionTaken, setActionTaken] = useState('');
    
    useEffect(() => {
        if(incidentToEdit) {
            setStudentId(incidentToEdit.studentId);
            setReportedBy(incidentToEdit.reportedBy);
            const [y, m, d] = incidentToEdit.date.split('-');
            setDate({ year: y, month: String(parseInt(m,10)), day: String(parseInt(d,10))});
            setCategory(incidentToEdit.category);
            setDescription(incidentToEdit.description);
            setActionTaken(incidentToEdit.actionTaken);
        } else {
            setCategory(settings.disciplineCategories[0] || '');
            setDate({ year: '', month: '', day: '' });
        }
    }, [incidentToEdit, settings]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!studentId || !date.year || !date.month || !date.day || !category || !description || !actionTaken) {
            alert('لطفا تمامی فیلدها را تکمیل نمایید.');
            return;
        }
        const reporterId = reportedBy || (admins.length > 0 ? admins[0].id : '');
        onSubmit({
            id: incidentToEdit ? incidentToEdit.id : `d${Date.now()}`,
            studentId,
            date: `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`,
            category,
            description,
            actionTaken,
            reportedBy: reporterId,
        });
    };

    const allReporters = [...teachers, ...admins];

    return (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg transform transition-all animate-scale-in" onClick={e => e.stopPropagation()}>
                
                <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-5">
                    <h2 className="text-xl font-black text-gray-800 flex items-center gap-2">
                        <FileSignature className="w-6 h-6 text-orange-500" />
                        {incidentToEdit ? 'ویرایش' : 'ثبت'} مورد انضباطی
                    </h2>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1">
                        <label className="block text-xs font-bold text-gray-700">دانش آموز</label>
                        <ThemedSelect value={studentId} onChange={e => setStudentId(e.target.value)} required>
                            <option value="">انتخاب دانش آموز...</option>
                            {students.map(s => <option key={s.id} value={s.id}>{formatFullName(s)} - {s.className}</option>)}
                        </ThemedSelect>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="block text-xs font-bold text-gray-700">تاریخ وقوع</label>
                            <DateSelector prefix="discipline" year={date.year} month={date.month} day={date.day} onYearChange={(y) => setDate(prev => ({...prev, year: y}))} onMonthChange={(m) => setDate(prev => ({...prev, month: m}))} onDayChange={(d) => setDate(prev => ({...prev, day: d}))} years={years} className="w-full" />
                        </div>
                        <div className="space-y-1">
                            <label className="block text-xs font-bold text-gray-700">نـوع مـورد</label>
                            <div className="relative">
                                <ThemedSelect value={category} onChange={e => setCategory(e.target.value)} required>
                                    {settings.disciplineCategories.map(c => <option key={c} value={c}>{c}</option>)}
                                </ThemedSelect>
                                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                                    <ShieldAlert className="w-4 h-4 text-gray-400" />
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="space-y-1">
                        <label className="block text-xs font-bold text-gray-700">شرح دقیق واقعه</label>
                        <ThemedTextarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="توضیح دهید دقیقا چه اتفاقی افتاد..." required />
                    </div>
                    
                    <div className="space-y-1">
                        <label className="block text-xs font-bold text-gray-700">اقدام انجام شده (تبعات)</label>
                        <ThemedTextarea value={actionTaken} onChange={e => setActionTaken(e.target.value)} rows={2} placeholder="مثال: کسر نمره، احضار ولی..." required />
                    </div>
                    
                    <div className="space-y-1">
                        <label className="block text-xs font-bold text-gray-700">ثبت کننده</label>
                        <div className="relative">
                            <ThemedSelect value={reportedBy} onChange={e => setReportedBy(e.target.value)}>
                                <option value="">(مدیریت)</option>
                                {allReporters.map(r => <option key={r.id} value={r.id}>{formatFullName(r)}</option>)}
                            </ThemedSelect>
                            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                                <Shield className="w-4 h-4 text-gray-400" />
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex justify-end gap-3 pt-5 border-t border-gray-100">
                        <button type="button" onClick={onClose} className="px-5 py-2.5 bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium rounded-xl transition-colors">انصراف</button>
                        <button type="submit" className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl shadow-sm transition-colors">
                            <CheckCircle className="w-5 h-5" />
                            {incidentToEdit ? 'ذخیره تغییرات' : 'ثبت مورد انضباطی'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

interface GroupDisciplineModalProps {
    classes: SchoolClass[];
    students: Student[];
    admins: Admin[];
    onClose: () => void;
    onSubmit: (newIncidents: DisciplinaryIncident[]) => void;
    years: string[];
    settings: SchoolSettings;
}
const GroupDisciplineModal: React.FC<GroupDisciplineModalProps> = ({ classes, students, admins, onClose, onSubmit, years, settings }) => {
    const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
    const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [date, setDate] = useState({ year: '', month: '', day: '' });
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');
    const [actionTaken, setActionTaken] = useState('');

    const studentsToDisplay = useMemo(() => {
        let filtered = students;
        if (selectedClassIds.length > 0) {
            filtered = filtered.filter(s => selectedClassIds.includes(s.classId));
        }
        if (searchTerm) {
            filtered = filtered.filter(s => formatFullName(s).toLowerCase().includes(searchTerm.toLowerCase()));
        }
        return filtered;
    }, [students, selectedClassIds, searchTerm]);

    useEffect(() => {
        setCategory(settings.disciplineCategories[0] || '');
    }, [settings.disciplineCategories]);

    const handleSelectAllStudents = (e: React.ChangeEvent<HTMLInputElement>) => {
        const studentIdsToUpdate = studentsToDisplay.map(s => s.id);
        if (e.target.checked) {
            setSelectedStudentIds(prev => [...new Set([...prev, ...studentIdsToUpdate])]);
        } else {
            setSelectedStudentIds(prev => prev.filter(id => !studentIdsToUpdate.includes(id)));
        }
    };

    const handleSelectAllClasses = (e: React.ChangeEvent<HTMLInputElement>) => {
        if(e.target.checked) {
            setSelectedClassIds(classes.map(c => c.id));
        } else {
            setSelectedClassIds([]);
            setSelectedStudentIds([]); // Also clear students if all classes are deselected
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedStudentIds.length === 0 || !date.year || !category || !description || !actionTaken) {
            alert('لطفا دانش آموزان و تمام فیلدهای انضباطی را تکمیل کنید.');
            return;
        }
        const newIncidents = selectedStudentIds.map(studentId => ({
            id: `d-group-${Date.now()}-${studentId}`,
            studentId,
            date: `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`,
            category,
            description,
            actionTaken,
            reportedBy: admins.length > 0 ? admins[0].id : ''
        }));
        onSubmit(newIncidents);
    };

    return (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col transform transition-all animate-scale-in" onClick={e => e.stopPropagation()}>
                
                <div className="flex items-center justify-between border-b border-gray-100 p-6">
                    <h2 className="text-xl font-black text-gray-800 flex items-center gap-2">
                        <Users className="w-6 h-6 text-indigo-500" />
                        ثبت گروهی موارد انضباطی
                    </h2>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-grow flex flex-col min-h-0">
                    <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-0 overflow-y-auto">
                        
                        {/* Right Column: Student Selection */}
                        <div className="p-6 border-l border-gray-100 flex flex-col h-[60vh] bg-gray-50/30">
                            <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                                انتخاب دانش آموزان
                            </h3>
                            
                            <div className="bg-white border border-gray-200 p-3 rounded-xl max-h-40 overflow-y-auto mb-4 shadow-sm">
                                <label className="flex items-center gap-3 font-semibold text-sm border-b border-gray-100 pb-3 mb-3 cursor-pointer select-none">
                                    <input 
                                        type="checkbox" 
                                        onChange={handleSelectAllClasses} 
                                        checked={selectedClassIds.length === classes.length && classes.length > 0} 
                                        className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                                    />
                                    انتخاب همه کلاس‌ها
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {classes.map(c => (
                                        <label key={c.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors select-none">
                                            <input 
                                                type="checkbox" 
                                                checked={selectedClassIds.includes(c.id)} 
                                                onChange={() => setSelectedClassIds(p => p.includes(c.id) ? p.filter(id => id !== c.id) : [...p, c.id])} 
                                                className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                                            />
                                            {c.name}
                                        </label>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="relative mb-3">
                                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                                    <Search className="h-4 w-4 text-gray-400" />
                                </div>
                                <ThemedInput type="text" placeholder="جستجوی نام دانش آموز..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                            </div>
                            
                            <div className="overflow-y-auto flex-grow bg-white border border-gray-200 rounded-xl shadow-sm">
                                <table className="w-full text-sm">
                                    <thead className="sticky top-0 bg-gray-50 border-b border-gray-200 z-10 text-gray-600">
                                        <tr>
                                            <th className="p-3 text-center w-12">
                                                <input 
                                                    type="checkbox" 
                                                    onChange={handleSelectAllStudents} 
                                                    className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                                                />
                                            </th>
                                            <th className="p-3 text-right font-semibold">دانش آموز</th>
                                            <th className="p-3 text-right font-semibold">کلاس</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {studentsToDisplay.map(s => (
                                            <tr 
                                                key={s.id} 
                                                className={`hover:bg-gray-50 transition-colors cursor-pointer ${selectedStudentIds.includes(s.id) ? 'bg-indigo-50/50' : ''}`}
                                                onClick={() => setSelectedStudentIds(p => p.includes(s.id) ? p.filter(id => id !== s.id) : [...p, s.id])}
                                            >
                                                <td className="p-3 text-center" onClick={e => e.stopPropagation()}>
                                                    <input 
                                                        type="checkbox" 
                                                        checked={selectedStudentIds.includes(s.id)} 
                                                        onChange={() => setSelectedStudentIds(p => p.includes(s.id) ? p.filter(id => id !== s.id) : [...p, s.id])} 
                                                        className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 cursor-pointer"
                                                    />
                                                </td>
                                                <td className="p-3 font-medium text-gray-800">{formatFullName(s)}</td>
                                                <td className="p-3 text-gray-500">{s.className}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Left Column: Form Details */}
                        <div className="p-6 h-[60vh] overflow-y-auto">
                            <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                                جزئیات مورد انضباطی
                            </h3>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">تاریخ وقوع</label>
                                    <DateSelector prefix="g-disc" year={date.year} month={date.month} day={date.day} onYearChange={y=>setDate(p=>({...p, year: y}))} onMonthChange={m=>setDate(p=>({...p, month: m}))} onDayChange={d=>setDate(p=>({...p, day: d}))} years={years} className="w-full" />
                                </div>
                                
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">نوع رفتار/مورد انضباطی</label>
                                    <div className="relative">
                                        <ThemedSelect value={category} onChange={e => setCategory(e.target.value)} required>
                                            <option value="" disabled>انتخاب دسته بندی...</option>
                                            {settings.disciplineCategories.map(c => <option key={c} value={c}>{c}</option>)}
                                        </ThemedSelect>
                                        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                                            <ShieldAlert className="w-4 h-4 text-gray-400" />
                                        </div>
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">شرح دقیق واقعه</label>
                                    <ThemedTextarea placeholder="توضیح دهید دقیقا چه اتفاقی افتاد..." rows={4} value={description} onChange={e=>setDescription(e.target.value)} required />
                                </div>
                                
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">اقدام انجام شده (تبعات)</label>
                                    <ThemedTextarea placeholder="مثال: کسر نمره، احضار ولی، تعهد کتبی و..." rows={3} value={actionTaken} onChange={e=>setActionTaken(e.target.value)} required />
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex justify-between items-center p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
                        <div className="text-sm font-bold text-indigo-700 bg-indigo-100 px-4 py-2 rounded-xl">
                            {toPersianDigits(selectedStudentIds.length)} دانش آموز انتخاب شده
                        </div>
                        <div className="flex gap-3">
                            <button type="button" onClick={onClose} className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 font-medium rounded-xl transition-colors shadow-sm">انصراف</button>
                            <button 
                                type="submit" 
                                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl shadow-sm transition-colors disabled:bg-indigo-300"
                                disabled={selectedStudentIds.length === 0}
                            >
                                <CheckCircle className="w-5 h-5" />
                                ثبت نهایی
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};
// #endregion

interface DisciplineTabProps {
    incidents: DisciplinaryIncident[];
    students: Student[];
    teachers: Teacher[];
    admins: Admin[];
    classes: SchoolClass[];
    settings: SchoolSettings;
    years: string[];
    saveDisciplinaryIncident: (incident: DisciplinaryIncident) => void;
    deleteDisciplinaryIncident: (id: string) => void;
    saveGroupDisciplinaryIncidents: (incidents: DisciplinaryIncident[]) => void;
}

const DisciplineTab: React.FC<DisciplineTabProps> = (props) => {
    const { incidents, students, teachers, admins, classes, settings, years, saveDisciplinaryIncident, deleteDisciplinaryIncident, saveGroupDisciplinaryIncidents } = props;
    const [studentNameFilter, setStudentNameFilter] = useState('');
    const [classFilter, setClassFilter] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [reporterFilter, setReporterFilter] = useState('');
    const [startDate, setStartDate] = useState({ year: '', month: '', day: '' });
    const [endDate, setEndDate] = useState({ year: '', month: '', day: '' });
    const [activeModal, setActiveModal] = useState<'add_edit' | 'group' | null>(null);
    const [incidentToEdit, setIncidentToEdit] = useState<DisciplinaryIncident | null>(null);
    const [isFilterVisible, setIsFilterVisible] = useState(true);
    
    const allReporters = useMemo(() => [...teachers, ...admins], [teachers, admins]);

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
    
    const handleAdd = () => {
        setIncidentToEdit(null);
        setActiveModal('add_edit');
    };
    const handleEdit = (incident: DisciplinaryIncident) => {
        setIncidentToEdit(incident);
        setActiveModal('add_edit');
    };
    const handleGroupAdd = () => {
        setActiveModal('group');
    };
    const closeModal = () => {
        setActiveModal(null);
        setIncidentToEdit(null);
    };
    const handleClearFilters = () => {
        setStudentNameFilter('');
        setClassFilter('');
        setCategoryFilter('');
        setReporterFilter('');
        setStartDate({ year: '', month: '', day: '' });
        setEndDate({ year: '', month: '', day: '' });
    };

    const enrichedIncidents = useMemo(() => {
        return incidents.map(inc => {
            const student = students.find(s => s.id === inc.studentId);
            const reporter = allReporters.find(r => r.id === inc.reportedBy);
            return {
                ...inc,
                studentName: student ? formatFullName(student) : 'حذف شده',
                className: student?.className || 'نامشخص',
                 firstName: student?.firstName || '',
                lastName: student?.lastName || '',
                reporterName: reporter ? formatFullName(reporter) : 'سیستم'
            };
        });
    }, [incidents, students, allReporters]);

     const filteredIncidents = useMemo(() => {
        return enrichedIncidents.filter(inc =>
            (studentNameFilter ? inc.studentName.toLowerCase().includes(studentNameFilter.toLowerCase()) : true) &&
            (classFilter ? inc.className === classes.find(c => c.id === classFilter)?.name : true) &&
            (categoryFilter ? inc.category === categoryFilter : true) &&
            (reporterFilter ? inc.reportedBy === reporterFilter : true) &&
            (startDateFilter ? inc.date >= startDateFilter : true) &&
            (endDateFilter ? inc.date <= endDateFilter : true)
        );
    }, [enrichedIncidents, studentNameFilter, classFilter, categoryFilter, reporterFilter, startDateFilter, endDateFilter, classes]);

    const { items: sortedIncidents, requestSort, sortConfig } = useSortableData(filteredIncidents, [{ key: 'lastName', direction: 'ascending' }, { key: 'firstName', direction: 'ascending' }]);

    const filterInputClass = "block w-full pl-3 pr-10 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white";

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div>
                    <h2 className="text-2xl font-black text-gray-800 flex items-center gap-3">
                        <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
                            <ShieldAlert className="w-7 h-7" />
                        </div>
                        مدیریت انضباطی
                    </h2>
                    <p className="text-gray-500 mt-1 text-sm font-medium">مشاهده و ثبت موارد انضباطی دانش‌آموزان</p>
                </div>
                <div className="flex flex-wrap gap-3 w-full sm:w-auto">
                    <button 
                        onClick={handleGroupAdd} 
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl font-bold transition-colors border border-emerald-200"
                    >
                        <Users className="w-5 h-5" />
                        ثبت گروهی
                    </button>
                    <button 
                        onClick={handleAdd} 
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl font-bold shadow-sm transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                        ثبت مورد جدید
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <button
                    className="w-full flex justify-between items-center p-5 bg-gray-50/50 hover:bg-gray-50 transition-colors"
                    onClick={() => setIsFilterVisible(!isFilterVisible)}
                    aria-expanded={isFilterVisible}
                >
                    <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                        <Filter className="w-4 h-4" />
                        فیلترهای جستجو
                        {/* active filters badge could go here */}
                    </h3>
                    <ChevronIcon direction={isFilterVisible ? 'up' : 'down'} />
                </button>
                
                <div className={`transition-all duration-300 ease-in-out ${isFilterVisible ? 'max-h-[800px] opacity-100 border-t border-gray-100' : 'max-h-0 opacity-0'}`}>
                    <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1.5">نام دانش آموز</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                                    <Search className="h-4 w-4 text-gray-400" />
                                </div>
                                <input type="text" placeholder="جستجو..." value={studentNameFilter} onChange={e => setStudentNameFilter(e.target.value)} className={filterInputClass} />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1.5">کلاس</label>
                            <select value={classFilter} onChange={e => setClassFilter(e.target.value)} className={filterInputClass}>
                                <option value="">همه کلاس ها</option>
                                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1.5">دسته‌بندی</label>
                            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className={filterInputClass}>
                                <option value="">همه</option>
                                {settings.disciplineCategories.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1.5">ثبت کننده</label>
                            <select value={reporterFilter} onChange={e => setReporterFilter(e.target.value)} className={filterInputClass}>
                                <option value="">همه</option>
                                {allReporters.map(r => <option key={r.id} value={r.id}>{formatFullName(r)}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1.5">تاریخ (از)</label>
                            <DateSelector
                                prefix="disc-start-filter"
                                year={startDate.year}
                                month={startDate.month}
                                day={startDate.day}
                                onYearChange={(y) => setStartDate(p => ({ ...p, year: y }))}
                                onMonthChange={(m) => setStartDate(p => ({ ...p, month: m }))}
                                onDayChange={(d) => setStartDate(p => ({ ...p, day: d }))}
                                years={years}
                                className="w-full"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1.5">تاریخ (تا)</label>
                            <DateSelector
                                prefix="disc-end-filter"
                                year={endDate.year}
                                month={endDate.month}
                                day={endDate.day}
                                onYearChange={(y) => setEndDate(p => ({ ...p, year: y }))}
                                onMonthChange={(m) => setEndDate(p => ({ ...p, month: m }))}
                                onDayChange={(d) => setEndDate(p => ({ ...p, day: d }))}
                                years={years}
                                className="w-full"
                            />
                        </div>
                        <div className="lg:col-span-2 flex items-end justify-end">
                            <button onClick={handleClearFilters} className="px-5 py-2.5 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
                                پاک کردن فیلترها
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right min-w-[800px]">
                        <thead className="bg-gray-50 border-b border-gray-100 text-gray-600 font-semibold">
                            <tr>
                                <SortableHeader sortKey="lastName" requestSort={requestSort} sortConfig={sortConfig}>
                                    <span className="px-4 py-3 block">نام و نام خانوادگی</span>
                                </SortableHeader>
                                <th className="px-4 py-4 font-semibold text-center">کلاس</th>
                                <SortableHeader sortKey="category" requestSort={requestSort} sortConfig={sortConfig}>
                                    <span className="px-4 py-3 block text-center">دسته‌بندی</span>
                                </SortableHeader>
                                <SortableHeader sortKey="date" requestSort={requestSort} sortConfig={sortConfig}>
                                    <span className="px-4 py-3 block text-center">تاریخ</span>
                                </SortableHeader>
                                <SortableHeader sortKey="reporterName" requestSort={requestSort} sortConfig={sortConfig}>
                                    <span className="px-4 py-3 block text-center">ثبت کننده</span>
                                </SortableHeader>
                                <th className="px-4 py-4 font-semibold w-1/4">شرح</th>
                                <th className="px-4 py-4 font-semibold w-1/5">اقدام (تبعات)</th>
                                <th className="px-4 py-4 font-semibold text-center">اقدامات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {sortedIncidents.map(inc => (
                                <tr key={inc.id} className="hover:bg-gray-50/80 transition-colors">
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                                                {inc.firstName[0]}
                                            </div>
                                            <span className="font-bold text-gray-800">{inc.firstName} {inc.lastName}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-800">
                                            {inc.className}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800">
                                            {inc.category}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex items-center justify-center gap-1.5 text-gray-600 bg-gray-50 px-2 py-1 rounded-lg mx-auto w-fit">
                                            <CalendarIcon className="w-3.5 h-3.5" />
                                            <span className="font-medium pt-0.5">{toPersianDigits(inc.date)}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                        <div className="inline-flex items-center gap-1.5">
                                            <Shield className="w-3.5 h-3.5 text-gray-400" />
                                            <span className="text-gray-700 font-medium">{inc.reporterName}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed" title={inc.description}>
                                            {inc.description}
                                        </p>
                                    </td>
                                    <td className="px-4 py-4">
                                        <p className="text-xs text-orange-700 line-clamp-2 leading-relaxed bg-orange-50/50 p-2 rounded-lg" title={inc.actionTaken}>
                                            {inc.actionTaken}
                                        </p>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex items-center justify-center gap-2">
                                            <button 
                                                onClick={() => handleEdit(inc)} 
                                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                                                title="ویرایش"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button 
                                                onClick={() => {
                                                    if(window.confirm('آیا از حذف این مورد انضباطی اطمینان دارید؟')) {
                                                        deleteDisciplinaryIncident(inc.id);
                                                    }
                                                }} 
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                                                title="حذف"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                     {sortedIncidents.length === 0 && (
                        <div className="text-center py-16 px-4">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Search className="w-8 h-8 text-gray-300" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-800 mb-1">موردی یافت نشد</h3>
                            <p className="text-gray-500 text-sm">مورد انضباطی با این فیلترها در سیستم وجود ندارد.</p>
                        </div>
                     )}
                </div>
            </div>
            
            {activeModal === 'add_edit' && (
                <DisciplineRecordModal
                    incidentToEdit={incidentToEdit}
                    students={students}
                    teachers={teachers}
                    admins={admins}
                    settings={settings}
                    onClose={closeModal}
                    onSubmit={(incident) => { saveDisciplinaryIncident(incident); closeModal(); }}
                    years={years}
                />
            )}
            {activeModal === 'group' && (
                <GroupDisciplineModal
                    classes={classes}
                    students={students}
                    admins={admins}
                    onClose={closeModal}
                    onSubmit={(incidents) => { saveGroupDisciplinaryIncidents(incidents); closeModal(); }}
                    years={years}
                    settings={settings}
                />
            )}
        </div>
    );
};

export default DisciplineTab;
