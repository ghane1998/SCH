import React, { useState, useMemo, useEffect } from 'react';
import type { Student, SchoolClass, Teacher, Badge, AwardedBadge } from '../../../types';
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

interface TeacherBadgesSubTabProps {
    teacher: Teacher;
    studentsInClass: Student[];
    years: string[];
}
const TeacherBadgesSubTab: React.FC<TeacherBadgesSubTabProps> = ({ teacher, studentsInClass, years }) => {
    const { badges, awardedBadges, saveBadge, deleteBadge, saveAwardedBadge, deleteAwardedBadge } = useData();

    const [newBadge, setNewBadge] = useState({ name: '', imageUrl: '', description: '', criteria: '' });
    const [award, setAward] = useState({ studentId: '', badgeId: '', reason: '' });
    const [awardDate, setAwardDate] = useState({ year: '', month: '', day: '' });

    useEffect(() => {
        const [y, m, d] = new Date().toLocaleDateString('fa-IR-u-nu-latn').replace(/\//g, '-').split('-');
        setAwardDate({ year: y, month: m, day: d });
    }, []);

    const teacherBadges = useMemo(() => badges.filter(b => b.createdBy === teacher.id), [badges, teacher.id]);
    const schoolBadges = useMemo(() => badges.filter(b => b.scope === 'school'), [badges]);
    const availableBadges = useMemo(() => [...schoolBadges, ...teacherBadges], [schoolBadges, teacherBadges]);

    const handleAddBadge = (e: React.FormEvent) => {
        e.preventDefault();
        if (newBadge.name.trim()) {
            saveBadge({ ...newBadge, id: `b-${Date.now()}`, createdBy: teacher.id, scope: 'teacher' });
            setNewBadge({ name: '', imageUrl: '', description: '', criteria: '' });
        }
    };
    
    const handleAwardBadge = (e: React.FormEvent) => {
        e.preventDefault();
        if (!award.studentId || !award.badgeId || !awardDate.year) { return alert('لطفا دانش آموز، مدال و تاریخ را انتخاب کنید.'); }
        saveAwardedBadge({ ...award, id: `ab-${Date.now()}`, awardedBy: teacher.id, dateAwarded: `${awardDate.year}-${awardDate.month.padStart(2,'0')}-${awardDate.day.padStart(2,'0')}` });
        setAward({ studentId: '', badgeId: '', reason: '' });
    };
    
    const classStudentIds = useMemo(() => new Set(studentsInClass.map(s => s.id)), [studentsInClass]);
    const classAwardedBadges = useMemo(() => awardedBadges
        .filter(ab => classStudentIds.has(ab.studentId))
        .map(ab => ({ ...ab, student: studentsInClass.find(s => s.id === ab.studentId), badge: badges.find(b => b.id === ab.badgeId) }))
        .filter((ab): ab is typeof ab & { student: Student, badge: Badge } => !!ab.student && !!ab.badge)
        .sort((a,b) => b.dateAwarded.localeCompare(a.dateAwarded)), 
    [awardedBadges, badges, classStudentIds, studentsInClass]);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card title="مدیریت مدال‌های شخصی">
                    <div className="p-4 space-y-4">
                        <form onSubmit={handleAddBadge} className="space-y-3 p-3 bg-gray-50 border rounded-lg">
                            <ThemedInput value={newBadge.name} onChange={e => setNewBadge(p => ({...p, name: e.target.value}))} placeholder="نام مدال جدید..." required />
                            <ThemedInput value={newBadge.imageUrl || ''} onChange={e => setNewBadge(p => ({...p, imageUrl: e.target.value}))} placeholder="لینک تصویر مدال (URL)" />
                            <ThemedInput value={newBadge.description} onChange={e => setNewBadge(p => ({...p, description: e.target.value}))} placeholder="توضیح کوتاه (اختیاری)" />
                            <ThemedTextarea value={newBadge.criteria || ''} onChange={e => setNewBadge(p => ({...p, criteria: e.target.value}))} placeholder="چگونگی دستیابی به این مدال" rows={2} />
                            <button type="submit" className="w-full px-4 py-2 bg-blue-500 text-white rounded-md">افزودن مدال شخصی</button>
                        </form>
                        <ul className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-2">{teacherBadges.map(b => (<li key={b.id} className="flex justify-between items-center p-2 rounded hover:bg-gray-100"><div className="flex items-center gap-3">
                            {b.imageUrl ? (
                                <img src={b.imageUrl} alt={b.name} className="w-8 h-8 rounded-full object-cover bg-gray-200" />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">?</div>
                            )}
                            <span className="font-semibold">{b.name}</span>
                        </div><button onClick={() => deleteBadge(b.id)} className="text-red-500 text-xs hover:underline">حذف</button></li>))}</ul>
                    </div>
                </Card>
                <Card title="اعطای مدال به دانش آموز">
                    <form onSubmit={handleAwardBadge} className="p-4 space-y-4">
                        <select value={award.studentId} onChange={e => setAward(p => ({...p, studentId: e.target.value}))} className="w-full p-2 border rounded-md" required><option value="">انتخاب دانش آموز...</option>{studentsInClass.map(s => <option key={s.id} value={s.id}>{formatFullName(s)}</option>)}</select>
                        <select value={award.badgeId} onChange={e => setAward(p => ({...p, badgeId: e.target.value}))} className="w-full p-2 border rounded-md" required><option value="">انتخاب مدال...</option><optgroup label="مدال‌های مدرسه">{schoolBadges.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</optgroup>{teacherBadges.length > 0 && <optgroup label="مدال‌های شما">{teacherBadges.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</optgroup>}</select>
                        <DateSelector prefix="award" year={awardDate.year} month={awardDate.month} day={awardDate.day} onYearChange={y => setAwardDate(p=>({...p, year: y}))} onMonthChange={m => setAwardDate(p=>({...p, month: m}))} onDayChange={d => setAwardDate(p=>({...p, day: d}))} years={years} />
                        <ThemedInput value={award.reason} onChange={e => setAward(p => ({...p, reason: e.target.value}))} placeholder="دلیل اعطا (اختیاری)" />
                        <button type="submit" className="w-full px-4 py-2 bg-green-500 text-white rounded-md">اعطای مدال</button>
                    </form>
                </Card>
            </div>
            <Card title="مدال‌های اعطا شده در این کلاس"><div className="overflow-x-auto max-h-72"><table className="w-full text-sm"><thead><tr><th className="p-2 text-right">دانش آموز</th><th className="p-2 text-right">مدال</th><th className="p-2 text-right">تاریخ</th><th className="p-2 text-right">اقدام</th></tr></thead><tbody>{classAwardedBadges.map(ab=>(<tr key={ab.id} className="border-t"><td className="p-2">{formatFullName(ab.student)}</td><td className="p-2 flex items-center gap-2">
                 {ab.badge.imageUrl ? (
                    <img src={ab.badge.imageUrl} alt={ab.badge.name} className="w-6 h-6 rounded-full object-cover bg-gray-200" />
                ) : (
                    <div className="w-6 h-6 rounded-full bg-gray-200" />
                )}
                {ab.badge.name}
            </td><td className="p-2">{toPersianDigits(ab.dateAwarded)}</td><td className="p-2">{ab.awardedBy === teacher.id && <button onClick={()=>deleteAwardedBadge(ab.id)} className="text-red-500 text-xs">حذف</button>}</td></tr>))}</tbody></table></div></Card>
        </div>
    );
};


interface NaseebTabProps {
    teacher: Teacher;
    selectedClass: SchoolClass;
    studentsInClass: Student[];
}

const NaseebTab: React.FC<NaseebTabProps> = ({ teacher, selectedClass, studentsInClass }) => {
    // FIX: Destructured settings from useSettings and data-related functions from useData.
    const { saveStudent } = useData();
    const { settings } = useSettings();
    const [activeSubTab, setActiveSubTab] = useState<'scoring' | 'badges'>('scoring');
    const [selectedComponent, setSelectedComponent] = useState('');
    const [date, setDate] = useState({ year: '', month: '', day: '' });
    const [eventTitle, setEventTitle] = useState('');
    const [editedData, setEditedData] = useState<Record<string, { score?: string; description?: string; teacherDescription?: string }>>({});

    const { items: sortedStudents, requestSort, sortConfig } = useSortableData(studentsInClass, [{ key: 'lastName', direction: 'ascending' }]);
    
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
        if (settings.naseebChartComponents.length > 0) {
            setSelectedComponent(settings.naseebChartComponents[0]);
        }
    }, [academicYears, settings.naseebChartComponents, selectedClass]);
    
    useEffect(() => {
        if (!date.year || !date.month || !date.day || !selectedComponent) return;
        const formattedDate = `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
        
        let foundTitle = '';
        for (const student of studentsInClass) {
            const componentData = student.naseebData?.[selectedComponent];
            const scoreForDate = componentData?.scores.find(s => s.date === formattedDate);
            if (scoreForDate?.eventTitle) {
                foundTitle = scoreForDate.eventTitle;
                break;
            }
        }
        setEventTitle(foundTitle);
        setEditedData({});
    }, [selectedClass, selectedComponent, date, studentsInClass]);

    const handleDataChange = (studentId: string, field: 'score' | 'description' | 'teacherDescription', value: string) => {
        setEditedData(prev => ({ ...prev, [studentId]: { ...prev[studentId], [field]: value } }));
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedComponent || !date.year || !date.month || !date.day) { return alert('لطفا مولفه و تاریخ را به طور کامل مشخص کنید.'); }

        const formattedDate = `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
        let updatedCount = 0;
        let errorOccurred = false;

        sortedStudents.forEach(student => {
            if (errorOccurred) return;
            const edits = editedData[student.id];
            if (!edits) return;
            const scoreStr = edits.score, description = edits.description, teacherDescription = edits.teacherDescription;
            const score = scoreStr !== undefined && scoreStr.trim() !== '' ? parseFloat(scoreStr) : undefined;
            if (score === undefined && description === undefined && teacherDescription === undefined) return;
            if (score !== undefined && (isNaN(score) || score < 0 || score > 100)) { alert(`امتیاز وارد شده برای ${formatFullName(student)} نامعتبر است.`); errorOccurred = true; return; }
            
            const studentToUpdate = { ...student, naseebData: JSON.parse(JSON.stringify(student.naseebData || {})) };
            if (!studentToUpdate.naseebData[selectedComponent]) studentToUpdate.naseebData[selectedComponent] = { description: '', scores: [] };
            const naseebDataForComponent = studentToUpdate.naseebData[selectedComponent];
            let hasChanged = false;

            if (description !== undefined && naseebDataForComponent.description !== description) { naseebDataForComponent.description = description; hasChanged = true; }

            const existingScoreIndex = naseebDataForComponent.scores.findIndex(s => s.date === formattedDate);
            if (existingScoreIndex > -1) {
                const existingScore = naseebDataForComponent.scores[existingScoreIndex], newScoreData = { ...existingScore };
                let scoreHasChanged = false;
                if (score !== undefined && score !== existingScore.score) { newScoreData.score = score; scoreHasChanged = true; }
                if (teacherDescription !== undefined && teacherDescription !== existingScore.teacherDescription) { newScoreData.teacherDescription = teacherDescription; scoreHasChanged = true; }
                if (eventTitle.trim() !== (existingScore.eventTitle || '')) { newScoreData.eventTitle = eventTitle.trim() || undefined; scoreHasChanged = true; }
                if (scoreHasChanged) { newScoreData.recordedBy = teacher.id; naseebDataForComponent.scores[existingScoreIndex] = newScoreData; hasChanged = true; }
            } else if (score !== undefined) {
                naseebDataForComponent.scores.push({ score, date: formattedDate, recordedBy: teacher.id, teacherDescription, eventTitle: eventTitle.trim() || undefined });
                hasChanged = true;
            }
            if (hasChanged) { saveStudent(studentToUpdate); updatedCount++; }
        });
        if (!errorOccurred && updatedCount > 0) { alert(`تغییرات برای ${toPersianDigits(updatedCount)} دانش آموز ذخیره شد.`); setEditedData({}); }
    };

    const components = settings.naseebChartComponents;

    return (
        <div className="space-y-6">
            <div className="bg-gray-100 p-1 rounded-lg grid grid-cols-2 max-w-sm">
                <button onClick={() => setActiveSubTab('scoring')} className={`px-4 py-2 text-sm rounded-md transition ${activeSubTab === 'scoring' ? 'bg-white shadow font-semibold' : 'text-gray-600'}`}>امتیازدهی</button>
                <button onClick={() => setActiveSubTab('badges')} className={`px-4 py-2 text-sm rounded-md transition ${activeSubTab === 'badges' ? 'bg-white shadow font-semibold' : 'text-gray-600'}`}>مدال‌ها و نشان‌ها</button>
            </div>

            {activeSubTab === 'scoring' && (
                components.length === 0 ? (
                    <Card title="نصیب"><p className="p-4 text-center text-gray-500">هیچ مولفه نصیبی توسط مدیر تعریف نشده است.</p></Card>
                ) : (
                    <Card title={`ثبت نمرات نصیب برای کلاس ${selectedClass.name}`}>
                        <form onSubmit={handleSubmit} className="p-4 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">مولفه</label>
                                    <select value={selectedComponent} onChange={(e) => setSelectedComponent(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 rounded-md">
                                        {components.map(comp => <option key={comp} value={comp}>{comp}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">تاریخ</label>
                                    <DateSelector prefix="naseeb-date" year={date.year} month={date.month} day={date.day} onYearChange={(y) => setDate(p => ({ ...p, year: y }))} onMonthChange={(m) => setDate(p => ({ ...p, month: m }))} onDayChange={(d) => setDate(p => ({ ...p, day: d }))} years={academicYears} className="mt-1"/>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">عنوان رویداد (اختیاری)</label>
                                    <input type="text" value={eventTitle} onChange={e => setEventTitle(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" placeholder="مثال: ارائه کلاسی" />
                                </div>
                            </div>
                            <div className="overflow-y-auto flex-grow border-t pt-4 max-h-96">
                                <table className="w-full text-sm text-right">
                                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0">
                                        <tr><SortableHeader sortKey="lastName" requestSort={requestSort} sortConfig={sortConfig}>دانش آموز</SortableHeader><th className="px-2 py-3 text-center">امتیاز</th><th className="px-2 py-3 text-center">توضیحات نمره</th><th className="px-2 py-3 text-center">توصیف کلی</th></tr>
                                    </thead>
                                    <tbody>
                                        {sortedStudents.map(student => {
                                            const componentData = student.naseebData?.[selectedComponent] || { description: '', scores: [] };
                                            const formattedDate = `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
                                            const scoreForDate = componentData.scores.find(s => s.date === formattedDate);
                                            const currentScore = editedData[student.id]?.score ?? (scoreForDate?.score.toString() ?? '');
                                            const currentTeacherDesc = editedData[student.id]?.teacherDescription ?? (scoreForDate?.teacherDescription ?? '');
                                            const currentDescription = editedData[student.id]?.description ?? componentData.description;
                                            return (
                                                <tr key={student.id} className="border-b">
                                                    <td className="px-4 py-2 font-semibold">{formatFullName(student)}</td>
                                                    <td className="px-2 py-1"><input type="number" min="0" max="100" value={currentScore} onChange={e => handleDataChange(student.id, 'score', e.target.value)} className="w-full text-center px-2 py-1 border rounded-md shadow-sm" /></td>
                                                    <td className="px-2 py-1"><input type="text" value={currentTeacherDesc} onChange={e => handleDataChange(student.id, 'teacherDescription', e.target.value)} className="w-full px-2 py-1 border rounded-md shadow-sm" /></td>
                                                    <td className="px-2 py-1"><input type="text" value={currentDescription} onChange={e => handleDataChange(student.id, 'description', e.target.value)} className="w-full px-2 py-1 border rounded-md shadow-sm" /></td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            <div className="flex justify-end pt-4"><button type="submit" className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition">ذخیره تغییرات</button></div>
                        </form>
                    </Card>
                )
            )}
            {activeSubTab === 'badges' && <TeacherBadgesSubTab teacher={teacher} studentsInClass={studentsInClass} years={academicYears} />}
        </div>
    );
};
export default NaseebTab;