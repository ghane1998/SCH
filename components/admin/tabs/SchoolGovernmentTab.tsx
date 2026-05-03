import React, { useState, useMemo, useEffect } from 'react';
import type { Admin, Responsibility, ResponsibilityAssignment, Student } from '../../../types';
import { useData } from '../../../App';
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

interface SchoolGovernmentTabProps {
    admin: Admin;
    years: string[];
}

const SchoolGovernmentTab: React.FC<SchoolGovernmentTabProps> = ({ admin, years }) => {
    const { 
        students, 
        responsibilities, 
        responsibilityAssignments, 
        saveResponsibility, 
        deleteResponsibility, 
        saveResponsibilityAssignment, 
        deleteResponsibilityAssignment 
    } = useData();

    // State for managing responsibilities
    const [newSchoolGovResp, setNewSchoolGovResp] = useState({ name: '', color: '#3b82f6' });
    const [newClassAssistResp, setNewClassAssistResp] = useState({ name: '', color: '#ef4444' });


    // State for managing assignments
    const [assignment, setAssignment] = useState<{ studentId: string; responsibilityId: string; timeFrame: string }>({ studentId: '', responsibilityId: '', timeFrame: '1w' });
    const [customDates, setCustomDates] = useState<{ start: {y:string, m:string, d:string}, end: {y:string, m:string, d:string} }>({ start: {y:'',m:'',d:''}, end: {y:'',m:'',d:''} });
    const [studentSearchTerm, setStudentSearchTerm] = useState('');
    const [isStudentDropdownOpen, setIsStudentDropdownOpen] = useState(false);

    const schoolGovResponsibilities = useMemo(() => responsibilities.filter(r => r.type === 'school_government'), [responsibilities]);
    const adminClassAssistResponsibilities = useMemo(() => responsibilities.filter(r => r.type === 'class_assistantship' && r.createdBy === admin.id), [responsibilities, admin.id]);
    
    const filteredStudents = useMemo(() => {
        if (!studentSearchTerm) return [];
        const term = studentSearchTerm.toLowerCase();
        return students
            .filter(s => formatFullName(s).toLowerCase().includes(term))
            .sort((a, b) => a.lastName.localeCompare(b.lastName, 'fa'));
    }, [studentSearchTerm, students]);
    
    const selectedStudentName = useMemo(() => {
        if (!assignment.studentId) return '';
        const student = students.find(s => s.id === assignment.studentId);
        return student ? formatFullName(student) : '';
    }, [assignment.studentId, students]);

    useEffect(() => {
        if (studentSearchTerm !== selectedStudentName) {
            setAssignment(p => ({ ...p, studentId: '' }));
        }
    }, [studentSearchTerm, selectedStudentName]);

    const handleAddResponsibility = (resp: { name: string, color: string }, type: 'school_government' | 'class_assistantship') => {
        if (resp.name.trim()) {
            saveResponsibility({
                id: `resp-${Date.now()}`,
                name: resp.name.trim(),
                color: resp.color,
                type: type,
                createdBy: admin.id,
            });
            if (type === 'school_government') setNewSchoolGovResp({ name: '', color: '#3b82f6' });
            else setNewClassAssistResp({ name: '', color: '#ef4444' });
        }
    };
    
    // FIX: Completed the truncated handleAddAssignment function.
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
            assignedBy: admin.id,
        });
        
        // Reset form
        setAssignment({ studentId: '', responsibilityId: '', timeFrame: '1w' });
        setCustomDates({ start: {y:'',m:'',d:''}, end: {y:'',m:'',d:''} });
        setStudentSearchTerm('');
    };
    
    const schoolGovResponsibilityIds = useMemo(() => new Set(schoolGovResponsibilities.map(r => r.id)), [schoolGovResponsibilities]);
    
    const enrichedAssignments = useMemo(() => {
        return responsibilityAssignments
            .filter(a => schoolGovResponsibilityIds.has(a.responsibilityId))
            .map(a => {
                const student = students.find(s => s.id === a.studentId);
                const responsibility = responsibilities.find(r => r.id === a.responsibilityId);
                return {
                    ...a,
                    studentName: student ? formatFullName(student) : 'حذف شده',
                    responsibilityName: responsibility ? responsibility.name : 'حذف شده',
                };
            });
    }, [responsibilityAssignments, students, responsibilities, schoolGovResponsibilityIds]);

    const { items: sortedAssignments, requestSort, sortConfig } = useSortableData(enrichedAssignments, [{ key: 'endDate', direction: 'descending' }]);

    return (
        <div className="space-y-6">
            <Card title="بخش دولت مدرسه">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg border-b pb-2">۱. تعریف مسئولیت‌های دولت مدرسه</h3>
                        <form onSubmit={(e) => { e.preventDefault(); handleAddResponsibility(newSchoolGovResp, 'school_government'); }} className="space-y-3">
                           <div className="flex gap-2">
                                <ThemedInput value={newSchoolGovResp.name} onChange={e => setNewSchoolGovResp(p => ({ ...p, name: e.target.value }))} placeholder="نام مسئولیت جدید..." className="flex-grow" />
                                <input type="color" value={newSchoolGovResp.color} onChange={e => setNewSchoolGovResp(p => ({ ...p, color: e.target.value }))} className="w-10 h-10 p-1 border rounded-md" title="انتخاب رنگ" />
                            </div>
                            <button type="submit" className="w-full px-4 py-2 bg-blue-500 text-white rounded-md">افزودن</button>
                        </form>
                        <ul className="p-2 space-y-2 max-h-40 overflow-y-auto border rounded-md">
                            {schoolGovResponsibilities.map(resp => (
                                <li key={resp.id} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                                    <div className="flex items-center gap-2">
                                        <span className="w-4 h-4 rounded-full" style={{backgroundColor: resp.color || '#ccc'}}></span>
                                        <span>{resp.name}</span>
                                    </div>
                                    <button onClick={() => deleteResponsibility(resp.id)} className="text-red-500 text-xs">حذف</button>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg border-b pb-2">۲. واگذاری مسئولیت</h3>
                        <form onSubmit={handleAddAssignment} className="space-y-4">
                            <ThemedSelect value={assignment.responsibilityId} onChange={e => setAssignment(p => ({...p, responsibilityId: e.target.value}))} required><option value="">انتخاب مسئولیت...</option>{schoolGovResponsibilities.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</ThemedSelect>
                            <div className="relative">
                                <ThemedInput
                                    type="text"
                                    value={studentSearchTerm}
                                    onChange={(e) => {
                                        setStudentSearchTerm(e.target.value);
                                        setIsStudentDropdownOpen(true);
                                    }}
                                    onFocus={() => setIsStudentDropdownOpen(true)}
                                    onBlur={() => setTimeout(() => setIsStudentDropdownOpen(false), 200)}
                                    placeholder="جستجوی دانش آموز..."
                                    required={!assignment.studentId}
                                    autoComplete="off"
                                />
                                {isStudentDropdownOpen && filteredStudents.length > 0 && (
                                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                        <ul className="py-1">
                                            {filteredStudents.map(s => {
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
                                                        <span>{formatFullName(s)} ({s.className})</span>
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
                                    <div><label>از تاریخ</label><DateSelector prefix="start" year={customDates.start.y} month={customDates.start.m} day={customDates.start.d} onYearChange={y => setCustomDates(p => ({...p, start: {...p.start, y}}))} onMonthChange={m => setCustomDates(p => ({...p, start: {...p.start, m}}))} onDayChange={d => setCustomDates(p => ({...p, start: {...p.start, d}}))} years={years} /></div>
                                    <div><label>تا تاریخ</label><DateSelector prefix="end" year={customDates.end.y} month={customDates.end.m} day={customDates.end.d} onYearChange={y => setCustomDates(p => ({...p, end: {...p.end, y}}))} onMonthChange={m => setCustomDates(p => ({...p, end: {...p.end, m}}))} onDayChange={d => setCustomDates(p => ({...p, end: {...p.end, d}}))} years={years} /></div>
                                </div>
                            )}
                            <button type="submit" className="w-full px-4 py-2 bg-green-500 text-white rounded-md">واگذاری</button>
                        </form>
                    </div>
                </div>
                <div className="p-4 border-t">
                    <h3 className="font-semibold text-lg mb-2">مسئولیت‌های واگذار شده دولت مدرسه</h3>
                    <div className="overflow-x-auto max-h-80">
                        <table className="w-full text-sm">
                            <thead className="sticky top-0 bg-gray-50"><tr>
                                <SortableHeader sortKey="responsibilityName" requestSort={requestSort} sortConfig={sortConfig}>مسئولیت</SortableHeader>
                                <SortableHeader sortKey="studentName" requestSort={requestSort} sortConfig={sortConfig}>دانش آموز</SortableHeader>
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
                </div>
            </Card>

            <Card title="بخش مسئولیت‌های عمومی کلاسیاری">
                <div className="p-4">
                    <h3 className="font-semibold text-lg border-b pb-2">تعریف مسئولیت‌های ثابت کلاسی</h3>
                    <p className="text-sm text-gray-500 my-2">این مسئولیت‌ها در پنل معلمان برای واگذاری به دانش‌آموزان کلاس نمایش داده می‌شوند.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <form onSubmit={(e) => { e.preventDefault(); handleAddResponsibility(newClassAssistResp, 'class_assistantship'); }} className="space-y-3">
                            <div className="flex gap-2">
                                <ThemedInput value={newClassAssistResp.name} onChange={e => setNewClassAssistResp(p => ({ ...p, name: e.target.value }))} placeholder="نام مسئولیت جدید..." className="flex-grow" />
                                <input type="color" value={newClassAssistResp.color} onChange={e => setNewClassAssistResp(p => ({ ...p, color: e.target.value }))} className="w-10 h-10 p-1 border rounded-md" title="انتخاب رنگ" />
                            </div>
                            <button type="submit" className="w-full px-4 py-2 bg-blue-500 text-white rounded-md">افزودن</button>
                        </form>
                         <ul className="p-2 space-y-2 max-h-48 overflow-y-auto border rounded-md">
                            {adminClassAssistResponsibilities.map(resp => (
                                <li key={resp.id} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                                    <div className="flex items-center gap-2">
                                        <span className="w-4 h-4 rounded-full" style={{backgroundColor: resp.color || '#ccc'}}></span>
                                        <span>{resp.name}</span>
                                    </div>
                                    <button onClick={() => deleteResponsibility(resp.id)} className="text-red-500 text-xs">حذف</button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default SchoolGovernmentTab;