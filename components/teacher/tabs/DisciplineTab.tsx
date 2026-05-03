
import React, { useState, useMemo, useEffect } from 'react';
import { 
    Search, Filter, Plus, Edit, Trash2, Calendar, FileText, CheckCircle, 
    AlertTriangle, MessageSquare, Info, Users, ShieldAlert, FileSignature
} from 'lucide-react';
import type { Teacher, Student, SchoolClass, DisciplinaryIncident } from '../../../types';
import { useData, useSettings } from '../../../App';
import Card from '../../common/Card';
import { useSortableData } from '../../common/useSortableData';
import { SortableHeader } from '../../common/SortableHeader';
import DateSelector from '../../common/DateSelector';
import { formatFullName, toPersianDigits } from '../../common/formatters';
import DisciplineModal from '../modals/DisciplineModal';

interface DisciplineTabProps {
    teacher: Teacher;
    selectedClass: SchoolClass;
    studentsInClass: Student[];
}

const DisciplineTab: React.FC<DisciplineTabProps> = ({ teacher, selectedClass, studentsInClass }) => {
    const { disciplineIncidents, saveGroupDisciplinaryIncidents, saveDisciplinaryIncident, deleteDisciplinaryIncident } = useData();
    const { settings } = useSettings();

    // State for group entry
    const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
    const [date, setDate] = useState({ year: '', month: '', day: '' });
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');
    const [actionTaken, setActionTaken] = useState('');
    
    // State for list view
    const [filterStudent, setFilterStudent] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [incidentToEdit, setIncidentToEdit] = useState<DisciplinaryIncident | null>(null);
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
        setCategory(settings.disciplineCategories[0] || '');
        setSelectedStudentIds([]);
        setDescription('');
        setActionTaken('');
    }, [settings.disciplineCategories, selectedClass]);

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedStudentIds(sortedStudents.map(s => s.id));
        } else {
            setSelectedStudentIds([]);
        }
    };

    const handleSelectStudent = (studentId: string) => {
        setSelectedStudentIds(prev =>
            prev.includes(studentId)
                ? prev.filter(id => id !== studentId)
                : [...prev, studentId]
        );
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedStudentIds.length === 0 || !category || !description || !actionTaken || !date.year) {
            alert('لطفا دانش آموزان و تمام فیلدهای انضباطی را تکمیل کنید.');
            return;
        }
        const formattedDate = `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
        const newIncidents: DisciplinaryIncident[] = selectedStudentIds.map(studentId => ({
            id: `d-group-${Date.now()}-${studentId}`, studentId, date: formattedDate, category, description, actionTaken, reportedBy: teacher.id
        }));
        saveGroupDisciplinaryIncidents(newIncidents);
        alert(`${newIncidents.length} مورد انضباطی با موفقیت ثبت شد.`);
        setSelectedStudentIds([]);
        setDescription('');
        setActionTaken('');
    };

    const handleSaveDiscipline = (incident: DisciplinaryIncident) => {
        saveDisciplinaryIncident(incident);
        setIncidentToEdit(null);
        setStudentForModal(null);
    };

    const classIncidents = useMemo(() => {
        const studentIds = new Set(studentsInClass.map(s => s.id));
        let filtered = disciplineIncidents
            .filter(i => studentIds.has(i.studentId))
            .map(i => ({...i, student: studentsInClass.find(s => s.id === i.studentId)!}));
        
        if (filterStudent) {
            filtered = filtered.filter(i => formatFullName(i.student).toLowerCase().includes(filterStudent.toLowerCase()));
        }
        if (filterCategory !== 'all') {
            filtered = filtered.filter(i => i.category === filterCategory);
        }

        return filtered;
    }, [disciplineIncidents, studentsInClass, filterStudent, filterCategory]);

    const { items: sortedIncidents, requestSort: requestSortIncidents, sortConfig: sortConfigIncidents } = useSortableData(classIncidents, [{ key: 'date', direction: 'descending' }]);

    return (
        <div className="space-y-6">
            <Card title={`ثبت مورد انضباطی برای کلاس ${selectedClass.name}`}>
                <form onSubmit={handleSubmit} className="p-2 md:p-4 space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Students Selection */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                    <Users className="w-5 h-5 text-indigo-500" />
                                    انتخاب دانش‌آموزان
                                </h3>
                                <span className="text-xs font-medium px-2.5 py-1 bg-indigo-100 text-indigo-800 rounded-full">
                                    {toPersianDigits(selectedStudentIds.length)} نفر انتخاب شده
                                </span>
                            </div>
                            <div className="overflow-y-auto max-h-[300px] border border-gray-200 rounded-xl shadow-inner bg-white">
                                <table className="w-full text-sm text-right">
                                    <thead className="text-xs text-gray-600 uppercase bg-gray-50 sticky top-0 border-b border-gray-200 z-10">
                                        <tr>
                                            <th className="px-4 py-3 w-12 text-center">
                                                <input 
                                                    type="checkbox" 
                                                    onChange={handleSelectAll} 
                                                    checked={selectedStudentIds.length === sortedStudents.length && sortedStudents.length > 0} 
                                                    ref={el => { if (el) { el.indeterminate = selectedStudentIds.length > 0 && selectedStudentIds.length < sortedStudents.length; } }} 
                                                    className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                                                />
                                            </th>
                                            <SortableHeader sortKey="lastName" requestSort={requestSortStudents} sortConfig={sortConfigStudents}>نام و نام خانوادگی</SortableHeader>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {sortedStudents.map(student => (
                                            <tr 
                                                key={student.id} 
                                                onClick={() => handleSelectStudent(student.id)}
                                                className={`cursor-pointer transition-colors hover:bg-gray-50 ${selectedStudentIds.includes(student.id) ? 'bg-indigo-50/50 hover:bg-indigo-50' : ''}`}
                                            >
                                                <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                                                    <input 
                                                        type="checkbox" 
                                                        checked={selectedStudentIds.includes(student.id)} 
                                                        onChange={() => handleSelectStudent(student.id)} 
                                                        className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 cursor-pointer"
                                                    />
                                                </td>
                                                <td className="px-4 py-3 font-medium text-gray-800 select-none">
                                                    {student.firstName} {student.lastName}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Incident Details Form */}
                        <div className="space-y-5 bg-gray-50 p-5 rounded-xl border border-gray-100">
                            <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-4">
                                <FileSignature className="w-5 h-5 text-orange-500" />
                                جزئیات مورد انضباطی
                            </h3>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">تاریخ وقوع</label>
                                    <DateSelector prefix="group-discipline" year={date.year} month={date.month} day={date.day} onYearChange={y => setDate(p=>({...p, year: y}))} onMonthChange={m => setDate(p=>({...p, month: m}))} onDayChange={d => setDate(p=>({...p, day: d}))} years={academicYears} />
                                </div>
                                
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">نوع رفتار/مورد انضباطی</label>
                                    <div className="relative">
                                        <select 
                                            value={category} 
                                            onChange={e => setCategory(e.target.value)} 
                                            className="block w-full pl-3 pr-10 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white" 
                                            required
                                        >
                                            <option value="" disabled>انتخاب کنید...</option>
                                            {settings.disciplineCategories.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                                            <ShieldAlert className="w-4 h-4 text-gray-400" />
                                        </div>
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">شرح دقیق واقعه</label>
                                    <textarea 
                                        value={description} 
                                        onChange={e => setDescription(e.target.value)} 
                                        rows={3} 
                                        className="block w-full p-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white resize-none" 
                                        placeholder="توضیح دهید دقیقا چه اتفاقی افتاد..." 
                                        required 
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">اقدام انجام شده</label>
                                    <textarea 
                                        value={actionTaken} 
                                        onChange={e => setActionTaken(e.target.value)} 
                                        rows={2} 
                                        className="block w-full p-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white resize-none" 
                                        placeholder="مثال: تذکر شفاهی، اطلاع به والدین و..." 
                                        required 
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex justify-end border-t border-gray-100 pt-6 mt-4">
                        <button 
                            type="submit" 
                            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed shadow-sm" 
                            disabled={selectedStudentIds.length === 0}
                        >
                            <CheckCircle className="w-5 h-5" />
                            ثبت برای {toPersianDigits(selectedStudentIds.length)} دانش آموز
                        </button>
                    </div>
                </form>
            </Card>

            <Card title="سوابق انضباطی ثبت شده">
                <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row gap-4 bg-gray-50/50">
                    <div className="relative w-full md:w-1/2">
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input 
                            type="text" 
                            placeholder="جستجوی نام دانش آموز..." 
                            value={filterStudent} 
                            onChange={e => setFilterStudent(e.target.value)} 
                            className="w-full pl-3 pr-10 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm" 
                        />
                    </div>
                    <div className="relative w-full md:w-1/2">
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <Filter className="h-5 w-5 text-gray-400" />
                        </div>
                        <select 
                            value={filterCategory} 
                            onChange={e => setFilterCategory(e.target.value)} 
                            className="w-full pl-3 pr-10 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm appearance-none bg-white"
                        >
                            <option value="all">همه دسته‌بندی‌ها</option>
                            {settings.disciplineCategories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right">
                        <thead className="bg-gray-50 text-gray-600 border-b border-gray-200 text-xs uppercase">
                            <tr>
                                <th className="px-6 py-4 font-semibold">دانش آموز</th>
                                <SortableHeader sortKey="category" requestSort={requestSortIncidents} sortConfig={sortConfigIncidents}>دسته‌بندی</SortableHeader>
                                <SortableHeader sortKey="date" requestSort={requestSortIncidents} sortConfig={sortConfigIncidents}>تاریخ</SortableHeader>
                                <th className="px-6 py-4 font-semibold text-center">اقدامات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {sortedIncidents.map(inc => (
                                <tr key={inc.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-gray-900 border-r-4 border-transparent hover:border-indigo-500 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                                                {inc.student.firstName[0]}
                                            </div>
                                            {formatFullName(inc.student)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                            {inc.category}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600 dir-ltr text-right flex justify-end">
                                        <div className="flex items-center gap-1.5 bg-gray-100 px-2.5 py-1 rounded-md w-fit">
                                            <Calendar className="w-3.5 h-3.5 text-gray-500" />
                                            <span className="font-medium pt-0.5">{toPersianDigits(inc.date)}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {inc.reportedBy === teacher.id ? (
                                            <div className="flex items-center justify-center gap-3">
                                                <button 
                                                    onClick={() => {setIncidentToEdit(inc); setStudentForModal(inc.student);}} 
                                                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
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
                                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="حذف"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-gray-400 flex justify-center">-</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                     {sortedIncidents.length === 0 && (
                        <div className="text-center py-12 px-4">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Search className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-700 mb-1">موردی یافت نشد</h3>
                            <p className="text-gray-500 text-sm">مورد انضباطی با این فیلترها در سیستم وجود ندارد.</p>
                        </div>
                     )}
                </div>
            </Card>
            
            {incidentToEdit && studentForModal && (
                <DisciplineModal 
                    student={studentForModal}
                    teacherId={teacher.id}
                    onClose={() => {setIncidentToEdit(null); setStudentForModal(null);}}
                    onSubmit={handleSaveDiscipline}
                    incidentToEdit={incidentToEdit}
                    years={academicYears}
                />
            )}
        </div>
    );
};

export default DisciplineTab;
