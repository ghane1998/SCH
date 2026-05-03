import React, { useState, useMemo, useEffect } from 'react';
import type { Teacher, Student, SchoolClass, Responsibility, ResponsibilityAssignment } from '../../../types';
// FIX: Imported useSettings to correctly access the settings context.
import { useData, useSettings } from '../../../App';
import Card from '../../common/Card';
import { useSortableData } from '../../common/useSortableData';
import { SortableHeader } from '../../common/SortableHeader';
import { formatFullName, toPersianDigits } from '../../common/formatters';
import DateSelector from '../../common/DateSelector';

const formatDate = (date: Date) => {
    return date.toLocaleDateString('fa-IR-u-nu-latn', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-');
};

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
const ChevronDownIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
);


interface ClassAssistantshipTabProps {
    teacher: Teacher;
    selectedClass: SchoolClass;
    studentsInClass: Student[];
}

const ClassAssistantshipTab: React.FC<ClassAssistantshipTabProps> = ({ teacher, selectedClass, studentsInClass }) => {
    const { 
        responsibilities, 
        responsibilityAssignments, 
        saveResponsibility, 
        deleteResponsibility, 
        saveResponsibilityAssignment, 
        deleteResponsibilityAssignment 
    } = useData();
    const { settings } = useSettings();
    
    const [isDefinePanelOpen, setIsDefinePanelOpen] = useState(false);
    const [newResponsibility, setNewResponsibility] = useState({ name: '', color: '#a855f7' });
    const [assignment, setAssignment] = useState<{ studentId: string; responsibilityId: string; timeFrame: string }>({ studentId: '', responsibilityId: '', timeFrame: '1w' });
    const [customDates, setCustomDates] = useState<{ start: {y:string, m:string, d:string}, end: {y:string, m:string, d:string} }>({ start: {y:'',m:'',d:''}, end: {y:'',m:'',d:''} });
    const [studentSearchTerm, setStudentSearchTerm] = useState('');
    const [isStudentDropdownOpen, setIsStudentDropdownOpen] = useState(false);

    const academicYears = useMemo(() => {
        const year = settings.academicYear;
        if (year.includes('-')) {
            const parts = year.split('-').map(y => y.trim());
            const start = parseInt(parts[0]);
            const end = parseInt(parts[1]);
            return Array.from({ length: end - start + 1 }, (_, i) => String(start + i));
        }
        return [year];
    }, [settings.academicYear]);

    const adminClassResponsibilities = useMemo(() => responsibilities.filter(r => r.type === 'class_assistantship' && r.createdBy !== teacher.id), [responsibilities, teacher.id]);
    const teacherResponsibilities = useMemo(() => responsibilities.filter(r => r.createdBy === teacher.id), [responsibilities, teacher.id]);
    const allAvailableResponsibilities = useMemo(() => [...adminClassResponsibilities, ...teacherResponsibilities], [adminClassResponsibilities, teacherResponsibilities]);

    const sortedStudentsInClass = useMemo(() => 
        [...studentsInClass].sort((a,b) => a.lastName.localeCompare(b.lastName, 'fa')),
    [studentsInClass]);

    const filteredStudentsForDropdown = useMemo(() => {
        if (!studentSearchTerm) {
            return sortedStudentsInClass;
        }
        const term = studentSearchTerm.toLowerCase();
        return sortedStudentsInClass.filter(s => formatFullName(s).toLowerCase().includes(term));
    }, [studentSearchTerm, sortedStudentsInClass]);

    const selectedStudentName = useMemo(() => {
        if (!assignment.studentId) return '';
        const student = studentsInClass.find(s => s.id === assignment.studentId);
        return student ? formatFullName(student) : '';
    }, [assignment.studentId, studentsInClass]);

    useEffect(() => {
        setStudentSearchTerm(selectedStudentName);
    }, [selectedStudentName]);

    useEffect(() => {
        setAssignment(p => ({...p, studentId: ''}));
    }, [selectedClass]);

    const handleStudentSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newSearchTerm = e.target.value;
        setStudentSearchTerm(newSearchTerm);
        setIsStudentDropdownOpen(true);
        if (selectedStudentName !== newSearchTerm) {
            setAssignment(p => ({ ...p, studentId: '' }));
        }
    };

    const handleAddResponsibility = (e: React.FormEvent) => {
        e.preventDefault();
        if (newResponsibility.name.trim()) {
            saveResponsibility({
                id: `resp-${Date.now()}`,
                name: newResponsibility.name.trim(),
                color: newResponsibility.color,
                type: 'class_assistantship',
                createdBy: teacher.id,
            });
            setNewResponsibility({ name: '', color: '#a855f7' });
        }
    };
    
    const handleAddAssignment = (e: React.FormEvent) => {
        e.preventDefault();
        if (!assignment.studentId || !assignment.responsibilityId) {
            alert('لطفا دانش آموز و مسئولیت را انتخاب کنید.');
            return;
        }

        let startDateStr = '';
        let endDateStr = '';
        const today = new Date();

        if (assignment.timeFrame === 'custom') {
            if (!customDates.start.y || !customDates.end.y) {
                alert('لطفا تاریخ شروع و پایان را مشخص کنید.');
                return;
            }
            startDateStr = `${customDates.start.y}-${customDates.start.m.padStart(2,'0')}-${customDates.start.d.padStart(2,'0')}`;
            endDateStr = `${customDates.end.y}-${customDates.end.m.padStart(2,'0')}-${customDates.end.d.padStart(2,'0')}`;
        } else {
            startDateStr = formatDate(today);
            const endDate = new Date(today);
            if (assignment.timeFrame === '1w') endDate.setDate(today.getDate() + 7);
            if (assignment.timeFrame === '2w') endDate.setDate(today.getDate() + 14);
            if (assignment.timeFrame === '1m') endDate.setMonth(today.getMonth() + 1);
            endDateStr = formatDate(endDate);
        }

        saveResponsibilityAssignment({
            id: `assign-${Date.now()}`,
            studentId: assignment.studentId,
            responsibilityId: assignment.responsibilityId,
            startDate: startDateStr,
            endDate: endDateStr,
            assignedBy: teacher.id,
        });

        setAssignment({ studentId: '', responsibilityId: '', timeFrame: '1w' });
        setCustomDates({ start: {y:'',m:'',d:''}, end: {y:'',m:'',d:''} });
    };

    const classStudentIds = useMemo(() => new Set(studentsInClass.map(s => s.id)), [studentsInClass]);
    const enrichedAssignments = useMemo(() => {
        return responsibilityAssignments
            .filter(a => classStudentIds.has(a.studentId))
            .map(a => ({
                ...a,
                studentName: studentsInClass.find(s => s.id === a.studentId)!.firstName + ' ' + studentsInClass.find(s => s.id === a.studentId)!.lastName,
                responsibilityName: responsibilities.find(r => r.id === a.responsibilityId)?.name || 'حذف شده',
            }));
    }, [responsibilityAssignments, studentsInClass, responsibilities, classStudentIds]);

    const { items: sortedAssignments, requestSort, sortConfig } = useSortableData(enrichedAssignments, [{ key: 'endDate', direction: 'descending' }]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
                <Card title="مدیریت مسئولیت‌های کلاسی">
                     <div className="space-y-4">
                        <div>
                            <button
                                type="button"
                                onClick={() => setIsDefinePanelOpen(!isDefinePanelOpen)}
                                className="w-full flex justify-between items-center p-3 bg-gray-100 hover:bg-gray-200 rounded-md text-sm font-semibold text-gray-700 transition"
                            >
                                <span>تعریف/ویرایش مسئولیت‌های شخصی</span>
                                <ChevronDownIcon className={`w-5 h-5 transition-transform ${isDefinePanelOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {isDefinePanelOpen && (
                                <div className="mt-4 space-y-3 border-t pt-4">
                                    <form onSubmit={handleAddResponsibility} className="space-y-3">
                                        <div className="flex gap-2">
                                            <ThemedInput value={newResponsibility.name} onChange={e => setNewResponsibility(p => ({ ...p, name: e.target.value }))} placeholder="نام مسئولیت جدید..." className="flex-grow" />
                                            <input type="color" value={newResponsibility.color} onChange={e => setNewResponsibility(p => ({ ...p, color: e.target.value }))} className="w-10 h-10 p-1 border rounded-md" title="انتخاب رنگ" />
                                        </div>
                                        <button type="submit" className="w-full px-4 py-2 bg-blue-500 text-white rounded-md">افزودن مسئولیت کلاسی</button>
                                    </form>
                                    <div>
                                        <h4 className="text-xs font-semibold mb-2 text-gray-500">مسئولیت‌های تعریف شده توسط شما</h4>
                                        <ul className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-2">
                                            {teacherResponsibilities.length > 0 ? teacherResponsibilities.map(resp => (
                                                <li key={resp.id} className="flex justify-between items-center bg-gray-50 p-2 rounded text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-4 h-4 rounded-full" style={{backgroundColor: resp.color || '#ccc'}}></span>
                                                        <span>{resp.name}</span>
                                                    </div>
                                                    <button onClick={() => deleteResponsibility(resp.id)} className="text-red-500 text-xs hover:underline">حذف</button>
                                                </li>
                                            )) : <p className="text-xs text-center text-gray-400 p-2">موردی تعریف نشده.</p>}
                                        </ul>
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        <div className="border-t pt-4">
                            <h4 className="text-sm font-semibold mb-2">مسئولیت‌های عمومی مدرسه</h4>
                            <ul className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-2 bg-gray-50">
                                {adminClassResponsibilities.length > 0 ? adminClassResponsibilities.map(resp => (
                                    <li key={resp.id} className="p-2 rounded text-sm flex items-center gap-2">
                                        <span className="w-4 h-4 rounded-full" style={{backgroundColor: resp.color || '#ccc'}}></span>
                                        <span className="text-gray-600">{resp.name}</span>
                                    </li>
                                )) : <p className="text-xs text-center text-gray-400 p-2">موردی تعریف نشده.</p>}
                            </ul>
                        </div>
                    </div>
                </Card>
            </div>
            <div className="lg:col-span-2 space-y-6">
                 <Card title={`واگذاری مسئولیت برای کلاس ${selectedClass.name}`}>
                    <form onSubmit={handleAddAssignment} className="space-y-4">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <ThemedSelect value={assignment.responsibilityId} onChange={e => setAssignment(p => ({...p, responsibilityId: e.target.value}))} required>
                                <option value="">انتخاب مسئولیت...</option>
                                {adminClassResponsibilities.length > 0 && <optgroup label="مسئولیت های عمومی">
                                    {adminClassResponsibilities.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                </optgroup>}
                                {teacherResponsibilities.length > 0 && <optgroup label="مسئولیت های شما">
                                    {teacherResponsibilities.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                </optgroup>}
                            </ThemedSelect>
                            <div className="relative">
                                <ThemedInput
                                    type="text"
                                    value={studentSearchTerm}
                                    onChange={handleStudentSearchChange}
                                    onFocus={() => setIsStudentDropdownOpen(true)}
                                    onBlur={() => setTimeout(() => setIsStudentDropdownOpen(false), 200)}
                                    placeholder="جستجوی دانش آموز..."
                                    required={!assignment.studentId}
                                    autoComplete="off"
                                />
                                {isStudentDropdownOpen && (
                                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                        <ul className="py-1">
                                            {filteredStudentsForDropdown.map(s => {
                                                const studentAssignments = responsibilityAssignments
                                                    .filter(as => as.studentId === s.id)
                                                    .map(as => responsibilities.find(r => r.id === as.responsibilityId))
                                                    .filter((r): r is Responsibility => !!r);

                                                return (
                                                    <li
                                                        key={s.id}
                                                        className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer flex justify-between items-center"
                                                        onMouseDown={() => {
                                                            setAssignment(p => ({ ...p, studentId: s.id }));
                                                            setStudentSearchTerm(formatFullName(s));
                                                            setIsStudentDropdownOpen(false);
                                                        }}
                                                    >
                                                        <span>{formatFullName(s)}</span>
                                                        <div className="flex items-center gap-1">
                                                            {studentAssignments.map(resp => (
                                                                <span
                                                                    key={resp.id}
                                                                    title={resp.name}
                                                                    className="w-3 h-3 rounded-full border border-gray-400"
                                                                    style={{ backgroundColor: resp.color || '#ccc' }}
                                                                ></span>
                                                            ))}
                                                        </div>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </div>
                                )}
                            </div>
                         </div>
                         <div>
                            <label className="text-sm font-medium">بازه زمانی</label>
                            <ThemedSelect value={assignment.timeFrame} onChange={e => setAssignment(p => ({...p, timeFrame: e.target.value}))}>
                                <option value="1w">یک هفته</option>
                                <option value="2w">دو هفته</option>
                                <option value="1m">یک ماه</option>
                                <option value="custom">بازه سفارشی</option>
                            </ThemedSelect>
                         </div>
                         {assignment.timeFrame === 'custom' && (
                            <div className="grid grid-cols-2 gap-4 p-3 border rounded-md">
                                <div><label>از تاریخ</label><DateSelector prefix="start" year={customDates.start.y} month={customDates.start.m} day={customDates.start.d} onYearChange={y => setCustomDates(p => ({...p, start: {...p.start, y}}))} onMonthChange={m => setCustomDates(p => ({...p, start: {...p.start, m}}))} onDayChange={d => setCustomDates(p => ({...p, start: {...p.start, d}}))} years={academicYears} /></div>
                                <div><label>تا تاریخ</label><DateSelector prefix="end" year={customDates.end.y} month={customDates.end.m} day={customDates.end.d} onYearChange={y => setCustomDates(p => ({...p, end: {...p.end, y}}))} onMonthChange={m => setCustomDates(p => ({...p, end: {...p.end, m}}))} onDayChange={d => setCustomDates(p => ({...p, end: {...p.end, d}}))} years={academicYears} /></div>
                            </div>
                         )}
                         <button type="submit" className="w-full px-4 py-2 bg-green-500 text-white rounded-md">واگذاری</button>
                    </form>
                </Card>
                <Card title="مسئولیت‌های واگذار شده در این کلاس">
                    <div className="overflow-x-auto max-h-80">
                        <table className="w-full text-sm">
                            <thead className="sticky top-0 bg-gray-50"><tr>
                                {/* FIX: Add missing children prop */}
                                <SortableHeader sortKey="responsibilityName" requestSort={requestSort} sortConfig={sortConfig}>مسئولیت</SortableHeader>
                                {/* FIX: Add missing children prop */}
                                <SortableHeader sortKey="studentName" requestSort={requestSort} sortConfig={sortConfig}>دانش آموز</SortableHeader>
                                {/* FIX: Add missing children prop */}
                                <SortableHeader sortKey="endDate" requestSort={requestSort} sortConfig={sortConfig}>تاریخ پایان</SortableHeader>
                                <th>اقدام</th>
                            </tr></thead>
                            <tbody>{sortedAssignments.map(a => {
                                 const studentAssignments = responsibilityAssignments
                                    .filter(as => as.studentId === a.studentId)
                                    .map(as => responsibilities.find(r => r.id === as.responsibilityId))
                                    .filter((r): r is Responsibility => !!r);

                                return (
                                <tr key={a.id} className="border-t">
                                    <td className="p-2">{a.responsibilityName}</td>
                                    <td className="p-2">
                                        <div>{a.studentName}</div>
                                        <div className="flex items-center gap-1 mt-1">
                                            {studentAssignments.map(resp => (
                                                <span
                                                    key={resp.id}
                                                    title={resp.name}
                                                    className="w-3 h-3 rounded-full border border-gray-400"
                                                    style={{ backgroundColor: resp.color || '#ccc' }}
                                                ></span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="p-2">{toPersianDigits(a.endDate)}</td>
                                    <td className="p-2"><button onClick={() => deleteResponsibilityAssignment(a.id)} className="text-red-500 text-xs">حذف</button></td>
                                </tr>
                                )
                            })}</tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default ClassAssistantshipTab;
