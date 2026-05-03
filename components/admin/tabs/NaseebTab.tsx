import React, { useState, useMemo, useEffect } from 'react';
import type { Student, SchoolClass, Admin, Badge, AwardedBadge } from '../../../types';
import { useSettings, useData } from '../../../App';
import Card from '../../common/Card';
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

const ThemedTextarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = (props) => (
    <textarea
        {...props}
        className={`w-full mt-1 px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[var(--primary-500)] focus:border-[var(--primary-500)] ${props.className}`}
        style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)', ...props.style }}
    />
);


interface BadgesSubTabProps {
    admin: Admin;
    years: string[];
}
const BadgesSubTab: React.FC<BadgesSubTabProps> = ({ admin, years }) => {
    const { students, badges, awardedBadges, saveBadge, deleteBadge, saveAwardedBadge, deleteAwardedBadge } = useData();

    // State for defining badges
    const [newBadge, setNewBadge] = useState({ name: '', imageUrl: '', description: '', criteria: '' });

    // State for awarding badges
    const [award, setAward] = useState({ studentId: '', badgeId: '', reason: '' });
    const [awardDate, setAwardDate] = useState({ year: '', month: '', day: '' });
    const [studentSearchTerm, setStudentSearchTerm] = useState('');
    const [isStudentDropdownOpen, setIsStudentDropdownOpen] = useState(false);

    useEffect(() => {
        const [y, m, d] = new Date().toLocaleDateString('fa-IR-u-nu-latn').replace(/\//g, '-').split('-');
        setAwardDate({ year: y, month: m, day: d });
    }, []);

    const handleAddBadge = (e: React.FormEvent) => {
        e.preventDefault();
        if (newBadge.name.trim()) {
            saveBadge({
                ...newBadge,
                id: `b-${Date.now()}`,
                createdBy: admin.id,
                scope: 'school',
            });
            setNewBadge({ name: '', imageUrl: '', description: '', criteria: '' });
        }
    };

    const handleAwardBadge = (e: React.FormEvent) => {
        e.preventDefault();
        if (!award.studentId || !award.badgeId || !awardDate.year) {
            alert('لطفا دانش آموز، مدال و تاریخ را انتخاب کنید.');
            return;
        }
        saveAwardedBadge({
            ...award,
            id: `ab-${Date.now()}`,
            awardedBy: admin.id,
            dateAwarded: `${awardDate.year}-${awardDate.month.padStart(2, '0')}-${awardDate.day.padStart(2, '0')}`
        });
        setAward({ studentId: '', badgeId: '', reason: '' });
        setStudentSearchTerm('');
    };

    const filteredStudents = useMemo(() => {
        if (!studentSearchTerm) return [];
        return students.filter(s => formatFullName(s).toLowerCase().includes(studentSearchTerm.toLowerCase()));
    }, [studentSearchTerm, students]);
    
    const enrichedAwards = useMemo(() => {
        return awardedBadges.map(ab => {
            const student = students.find(s => s.id === ab.studentId);
            const badge = badges.find(b => b.id === ab.badgeId);
            return {
                ...ab,
                studentName: formatFullName(student) || 'حذف شده',
                badgeName: badge?.name || 'حذف شده',
                badge,
            };
        });
    }, [awardedBadges, students, badges]);

    const { items: sortedAwards, requestSort, sortConfig } = useSortableData(enrichedAwards, [{ key: 'dateAwarded', direction: 'descending' }]);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card title="مدیریت مدال‌ها و نشان‌ها">
                    <div className="p-4 space-y-4">
                        <form onSubmit={handleAddBadge} className="space-y-3 p-3 bg-gray-50 border rounded-lg">
                            <ThemedInput value={newBadge.name} onChange={e => setNewBadge(p => ({...p, name: e.target.value}))} placeholder="نام مدال جدید..." required />
                            <ThemedInput value={newBadge.imageUrl || ''} onChange={e => setNewBadge(p => ({...p, imageUrl: e.target.value}))} placeholder="لینک تصویر مدال (URL)" />
                            <ThemedInput value={newBadge.description} onChange={e => setNewBadge(p => ({...p, description: e.target.value}))} placeholder="توضیح کوتاه (اختیاری)" />
                            <ThemedTextarea value={newBadge.criteria || ''} onChange={e => setNewBadge(p => ({...p, criteria: e.target.value}))} placeholder="چگونگی دستیابی به این مدال" rows={2} />
                            <button type="submit" className="w-full px-4 py-2 bg-blue-500 text-white rounded-md">افزودن مدال</button>
                        </form>
                        <ul className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-2">
                            {badges.map(b => (
                                <li key={b.id} className="flex justify-between items-center p-2 rounded hover:bg-gray-100">
                                    <div className="flex items-center gap-3">
                                        {b.imageUrl ? (
                                            <img src={b.imageUrl} alt={b.name} className="w-8 h-8 rounded-full object-cover bg-gray-200" />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">?</div>
                                        )}
                                        <span className="font-semibold">{b.name}</span>
                                    </div>
                                    <button onClick={() => deleteBadge(b.id)} className="text-red-500 text-xs hover:underline">حذف</button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </Card>
                <Card title="اعطای مدال">
                    <form onSubmit={handleAwardBadge} className="p-4 space-y-4">
                        <div className="relative">
                            <ThemedInput value={studentSearchTerm} onChange={e => {setStudentSearchTerm(e.target.value); setIsStudentDropdownOpen(true);}} onFocus={() => setIsStudentDropdownOpen(true)} onBlur={() => setTimeout(() => setIsStudentDropdownOpen(false), 200)} placeholder="جستجوی دانش آموز..." required={!award.studentId}/>
                            {isStudentDropdownOpen && filteredStudents.length > 0 && (
                                <ul className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-40 overflow-y-auto">
                                    {filteredStudents.map(s => <li key={s.id} className="p-2 hover:bg-gray-100 cursor-pointer" onMouseDown={() => {setAward(p => ({...p, studentId: s.id})); setStudentSearchTerm(formatFullName(s)); setIsStudentDropdownOpen(false);}}>{formatFullName(s)}</li>)}
                                </ul>
                            )}
                        </div>
                        <select value={award.badgeId} onChange={e => setAward(p => ({...p, badgeId: e.target.value}))} className="w-full p-2 border rounded-md" required>
                            <option value="">انتخاب مدال...</option>
                            {badges.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                        <DateSelector prefix="award" year={awardDate.year} month={awardDate.month} day={awardDate.day} onYearChange={y => setAwardDate(p=>({...p, year: y}))} onMonthChange={m => setAwardDate(p=>({...p, month: m}))} onDayChange={d => setAwardDate(p=>({...p, day: d}))} years={years} />
                        <ThemedInput value={award.reason} onChange={e => setAward(p => ({...p, reason: e.target.value}))} placeholder="دلیل اعطا (اختیاری)" />
                        <button type="submit" className="w-full px-4 py-2 bg-green-500 text-white rounded-md">اعطای مدال</button>
                    </form>
                </Card>
            </div>
            <Card title="تاریخچه مدال‌های اعطا شده">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50"><tr>
                            <SortableHeader sortKey="studentName" requestSort={requestSort} sortConfig={sortConfig}>دانش آموز</SortableHeader>
                            <SortableHeader sortKey="badgeName" requestSort={requestSort} sortConfig={sortConfig}>نام مدال</SortableHeader>
                            <SortableHeader sortKey="dateAwarded" requestSort={requestSort} sortConfig={sortConfig}>تاریخ</SortableHeader>
                            <th className="p-2">دلیل</th>
                            <th className="p-2">اقدام</th>
                        </tr></thead>
                        <tbody>{sortedAwards.map(a => (
                            <tr key={a.id} className="border-b">
                                <td className="p-2 font-semibold">{a.studentName}</td>
                                <td className="p-2 flex items-center gap-2">
                                     {a.badge?.imageUrl ? (
                                        <img src={a.badge.imageUrl} alt={a.badgeName} className="w-6 h-6 rounded-full object-cover bg-gray-200" />
                                    ) : (
                                        <div className="w-6 h-6 rounded-full bg-gray-200" />
                                    )}
                                    {a.badgeName}
                                </td>
                                <td className="p-2">{toPersianDigits(a.dateAwarded)}</td>
                                <td className="p-2 text-xs">{a.reason}</td>
                                <td className="p-2"><button onClick={() => deleteAwardedBadge(a.id)} className="text-red-500 text-xs">حذف</button></td>
                            </tr>
                        ))}</tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};


interface NaseebTabProps {
    admin: Admin;
}

const NaseebTab: React.FC<NaseebTabProps> = ({ admin }) => {
    // FIX: Destructured settings from useSettings and data from useData.
    const { students, classes, saveStudent } = useData();
    const { settings } = useSettings();
    const [activeSubTab, setActiveSubTab] = useState<'scoring' | 'badges'>('scoring');

    const [selectedComponent, setSelectedComponent] = useState('');
    const [date, setDate] = useState({ year: '', month: '', day: '' });
    const [eventTitle, setEventTitle] = useState('');
    const [classFilter, setClassFilter] = useState('');
    const [nameFilter, setNameFilter] = useState('');
    const [editedData, setEditedData] = useState<Record<string, { score?: string; description?: string; teacherDescription?: string }>>({});

    const academicYears = useMemo(() => {
        const year = settings.academicYear;
        const currentYear = new Date().toLocaleDateString('fa-IR-u-nu-latn').split('/')[0];
        if (year.includes('-')) {
            const parts = year.split('-').map(y => y.trim());
            if (parts.length === 2 && !isNaN(parseInt(parts[0])) && !isNaN(parseInt(parts[1]))) {
                const start = parseInt(parts[0]);
                const end = parseInt(parts[1]);
                const years = [];
                for (let i = start; i <= end; i++) { years.push(String(i)); }
                if (!years.includes(currentYear)) years.push(currentYear);
                return years;
            }
        }
        const years = year ? [year.trim()] : [];
        if (!years.includes(currentYear)) years.push(currentYear);
        return years;
    }, [settings.academicYear]);

    const filteredStudents = useMemo(() => {
        return students.filter(student =>
            (classFilter === '' || student.classId === classFilter) &&
            (nameFilter === '' || formatFullName(student).toLowerCase().includes(nameFilter.toLowerCase()))
        );
    }, [students, classFilter, nameFilter]);

    useEffect(() => {
        const [y, m, d] = new Date().toLocaleDateString('fa-IR-u-nu-latn').replace(/\//g, '-').split('-');
        setDate({ year: academicYears.includes(y) ? y : (academicYears[0] || ''), month: String(parseInt(m, 10)), day: String(parseInt(d, 10)) });
        if (settings.naseebChartComponents.length > 0) {
            setSelectedComponent(settings.naseebChartComponents[0]);
        }
    }, [academicYears, settings.naseebChartComponents]);

    useEffect(() => {
        if (!date.year || !date.month || !date.day || !selectedComponent) return;
        const formattedDate = `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
        
        let foundTitle = '';
        for (const student of filteredStudents) {
            const componentData = student.naseebData?.[selectedComponent];
            const scoreForDate = componentData?.scores.find(s => s.date === formattedDate);
            if (scoreForDate?.eventTitle) {
                foundTitle = scoreForDate.eventTitle;
                break;
            }
        }
        setEventTitle(foundTitle);
        setEditedData({});
    }, [classFilter, nameFilter, selectedComponent, date, filteredStudents]);
    
    const { items: sortedStudents, requestSort, sortConfig } = useSortableData(filteredStudents, [{key: 'lastName', direction: 'ascending'}]);

    const handleDataChange = (studentId: string, field: 'score' | 'description' | 'teacherDescription', value: string) => {
        setEditedData(prev => ({
            ...prev,
            [studentId]: { ...prev[studentId], [field]: value }
        }));
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedComponent || !date.year || !date.month || !date.day) {
            alert('لطفا مولفه و تاریخ را به طور کامل مشخص کنید.');
            return;
        }
        const formattedDate = `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
        let updatedCount = 0;
        let errorOccurred = false;
        
        sortedStudents.forEach(student => {
            if (errorOccurred) return;

            const edits = editedData[student.id];
            if (!edits) return;
            
            const scoreStr = edits.score;
            const description = edits.description;
            const teacherDescription = edits.teacherDescription;
            const score = scoreStr !== undefined && scoreStr.trim() !== '' ? parseFloat(scoreStr) : undefined;
            
            if (score === undefined && description === undefined && teacherDescription === undefined) return;
            
            if (score !== undefined && (isNaN(score) || score < 0 || score > 100)) {
                alert(`امتیاز وارد شده برای ${formatFullName(student)} نامعتبر است. باید عددی بین ۰ تا ۱۰۰ باشد.`);
                errorOccurred = true;
                return;
            }
            
            const studentToUpdate = { ...student, naseebData: JSON.parse(JSON.stringify(student.naseebData || {})) };
            if (!studentToUpdate.naseebData[selectedComponent]) {
                studentToUpdate.naseebData[selectedComponent] = { description: '', scores: [] };
            }
            const naseebDataForComponent = studentToUpdate.naseebData[selectedComponent];
            let hasChanged = false;

            if (description !== undefined && naseebDataForComponent.description !== description) {
                naseebDataForComponent.description = description;
                hasChanged = true;
            }

            const existingScoreIndex = naseebDataForComponent.scores.findIndex(s => s.date === formattedDate);

            if (existingScoreIndex > -1) {
                const existingScore = naseebDataForComponent.scores[existingScoreIndex];
                const newScoreData = { ...existingScore };
                let scoreHasChanged = false;
                
                if (score !== undefined && score !== existingScore.score) {
                    newScoreData.score = score;
                    scoreHasChanged = true;
                }
                if (teacherDescription !== undefined && teacherDescription !== existingScore.teacherDescription) {
                    newScoreData.teacherDescription = teacherDescription;
                    scoreHasChanged = true;
                }
                if (eventTitle.trim() !== (existingScore.eventTitle || '')) {
                    newScoreData.eventTitle = eventTitle.trim() || undefined;
                    scoreHasChanged = true;
                }

                if (scoreHasChanged) {
                    newScoreData.recordedBy = admin.id;
                    naseebDataForComponent.scores[existingScoreIndex] = newScoreData;
                    hasChanged = true;
                }
            } else if (score !== undefined) {
                naseebDataForComponent.scores.push({ score, date: formattedDate, recordedBy: admin.id, teacherDescription, eventTitle: eventTitle.trim() || undefined });
                hasChanged = true;
            }

            if (hasChanged) {
                saveStudent(studentToUpdate);
                updatedCount++;
            }
        });

        if (!errorOccurred && updatedCount > 0) {
            alert(`تغییرات برای ${toPersianDigits(updatedCount)} دانش آموز با موفقیت ذخیره شد.`);
            setEditedData({});
        }
    };

    const components = settings.naseebChartComponents;

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">مدیریت نصیب</h2>

            <div className="bg-gray-100 p-1 rounded-lg grid grid-cols-2 max-w-sm">
                <button onClick={() => setActiveSubTab('scoring')} className={`px-4 py-2 text-sm rounded-md transition-colors ${activeSubTab === 'scoring' ? 'bg-white shadow text-gray-800 font-semibold' : 'text-gray-600'}`}>امتیازدهی</button>
                <button onClick={() => setActiveSubTab('badges')} className={`px-4 py-2 text-sm rounded-md transition-colors ${activeSubTab === 'badges' ? 'bg-white shadow text-gray-800 font-semibold' : 'text-gray-600'}`}>مدال‌ها و نشان‌ها</button>
            </div>

             {activeSubTab === 'scoring' && (
                <>
                    {components.length === 0 ? (
                        <Card title="ثبت امتیازات نصیب">
                            <p className="p-4 text-center text-gray-500">ابتدا از بخش تنظیمات، مولفه‌های نصیب را تعریف کنید.</p>
                        </Card>
                    ) : (
                        <Card title="ثبت امتیازات نصیب">
                            <form onSubmit={handleSubmit} className="p-4 space-y-4">
                                <div className="flex gap-4 p-4 bg-gray-50 rounded-lg border">
                                    <input type="text" placeholder="جستجو بر اساس نام..." value={nameFilter} onChange={e => setNameFilter(e.target.value)} className="w-full px-3 py-2 border rounded-lg shadow-sm" />
                                    <select value={classFilter} onChange={e => setClassFilter(e.target.value)} className="w-full px-3 py-2 border rounded-lg shadow-sm">
                                        <option value="">همه کلاس ها</option>
                                        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">مولفه</label>
                                        <select value={selectedComponent} onChange={(e) => setSelectedComponent(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 rounded-md">
                                            {components.map(comp => <option key={comp} value={comp}>{comp}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">تاریخ</label>
                                        <DateSelector prefix="admin-naseeb-date" year={date.year} month={date.month} day={date.day} onYearChange={y => setDate(p => ({ ...p, year: y }))} onMonthChange={m => setDate(p => ({ ...p, month: m }))} onDayChange={d => setDate(p => ({ ...p, day: d }))} years={academicYears} className="mt-1"/>
                                    </div>
                                    <div>
                                        <label htmlFor="event-title-admin" className="block text-sm font-medium text-gray-700">عنوان رویداد (اختیاری)</label>
                                        <input id="event-title-admin" type="text" value={eventTitle} onChange={e => setEventTitle(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="مثال: پروژه کلاسی" />
                                    </div>
                                </div>
                
                                <div className="overflow-x-auto max-h-96">
                                    <table className="w-full text-sm text-right bg-white">
                                        <thead className="bg-gray-50 sticky top-0">
                                            <tr>
                                                <SortableHeader sortKey="lastName" requestSort={requestSort} sortConfig={sortConfig}>دانش آموز</SortableHeader>
                                                <th className="px-2 py-3 text-center">امتیاز (۰ تا ۱۰۰)</th>
                                                <th className="px-2 py-3 text-center">توضیحات این نمره</th>
                                                <th className="px-2 py-3 text-center">توصیف کلی مولفه</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {sortedStudents.map(student => {
                                                const componentData = student.naseebData?.[selectedComponent] || { description: '', scores: [] };
                                                const formattedDate = `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
                                                const scoreForDate = componentData.scores.find(s => s.date === formattedDate);
                                                const currentScore = editedData[student.id]?.score ?? (scoreForDate?.score.toString() ?? '');
                                                const currentTeacherDesc = editedData[student.id]?.teacherDescription ?? (scoreForDate?.teacherDescription ?? '');
                                                const currentDescription = editedData[student.id]?.description ?? componentData.description;
                                                return (
                                                    <tr key={student.id}>
                                                        <td className="px-4 py-2 font-semibold">{formatFullName(student)}</td>
                                                        <td className="px-2 py-1"><input type="number" min="0" max="100" value={currentScore} onChange={e => handleDataChange(student.id, 'score', e.target.value)} className="w-full text-center px-2 py-1 border rounded-md" placeholder={`نمره ${toPersianDigits(date.day)}/...`} /></td>
                                                        <td className="px-2 py-1"><input type="text" value={currentTeacherDesc} onChange={e => handleDataChange(student.id, 'teacherDescription', e.target.value)} className="w-full px-2 py-1 border rounded-md" placeholder="بازخورد این نمره..." /></td>
                                                        <td className="px-2 py-1"><input type="text" value={currentDescription} onChange={e => handleDataChange(student.id, 'description', e.target.value)} className="w-full px-2 py-1 border rounded-md" placeholder="توصیف کلی..." /></td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                                
                                <div className="flex justify-end pt-4 border-t">
                                    <button type="submit" className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition">ذخیره تغییرات</button>
                                </div>
                            </form>
                        </Card>
                    )}
                </>
             )}
             {activeSubTab === 'badges' && <BadgesSubTab admin={admin} years={academicYears} />}
        </div>
    );
};

export default NaseebTab;