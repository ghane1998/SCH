import React, { useState, useMemo, useEffect } from 'react';
import type { Notification, Student, SchoolClass, Admin, NotificationAudience, Teacher, NotificationTag, ScheduledNotification, ScheduledNotificationType } from '../../../types';
import { useData } from '../../../App';
import { useSortableData } from '../../common/useSortableData';
import { SortableHeader } from '../../common/SortableHeader';
import { toPersianDigits, formatFullName } from '../../common/formatters';
import DateSelector from '../../common/DateSelector';
import { Calendar, Gift, Clock, Plus, Edit, Trash2, Info } from 'lucide-react';

interface NotificationModalProps {
    notificationToEdit: Notification | null;
    classes: SchoolClass[];
    students: Student[];
    teachers: Teacher[];
    onClose: () => void;
    onSubmit: (notification: Notification) => void;
    adminId: string;
    years: string[];
}
const NotificationModal: React.FC<NotificationModalProps> = ({ notificationToEdit, classes, students, teachers, onClose, onSubmit, adminId, years }) => {
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [audience, setAudience] = useState<NotificationAudience>({ type: 'all_students', ids: [] });
    const [color, setColor] = useState('#facc15'); // yellow-400
    const [tags, setTags] = useState<NotificationTag[]>([]);
    const [link, setLink] = useState('');
    const [linkText, setLinkText] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [isDeactivationScheduled, setIsDeactivationScheduled] = useState(false);
    const [deactivateDateTime, setDeactivateDateTime] = useState({ year: '', month: '', day: '', time: '' });

    const [newTag, setNewTag] = useState({ text: '', color: '#e5e7eb' });

    const [classFilterForStudentSelection, setClassFilterForStudentSelection] = useState<string[]>([]);
    const [studentSearchTerm, setStudentSearchTerm] = useState('');
    
    React.useEffect(() => {
        if (notificationToEdit) {
            setTitle(notificationToEdit.title);
            setMessage(notificationToEdit.message);
            setAudience(notificationToEdit.audience);
            setColor(notificationToEdit.color || '#facc15');
            setTags(notificationToEdit.tags || []);
            setLink(notificationToEdit.link || '');
            setLinkText(notificationToEdit.linkText || '');
            setImageUrl(notificationToEdit.imageUrl || '');
            setIsActive(notificationToEdit.isActive);
            if (notificationToEdit.deactivateAt) {
                setIsDeactivationScheduled(true);
                const [datePart, timePart] = notificationToEdit.deactivateAt.split('T');
                const [y, m, d] = datePart.split('-');
                setDeactivateDateTime({ year: y, month: String(parseInt(m,10)), day: String(parseInt(d,10)), time: timePart || '' });
            } else {
                setIsDeactivationScheduled(false);
                setDeactivateDateTime({ year: '', month: '', day: '', time: '' });
            }
        } else {
            setIsActive(true);
            setIsDeactivationScheduled(false);
            setDeactivateDateTime({ year: '', month: '', day: '', time: '' });
        }
    }, [notificationToEdit]);

    const studentsToDisplay = useMemo(() => {
        let filtered = students;
        if (classFilterForStudentSelection.length > 0) {
            filtered = filtered.filter(s => classFilterForStudentSelection.includes(s.classId));
        }
        if (studentSearchTerm) {
            filtered = filtered.filter(s => formatFullName(s).toLowerCase().includes(studentSearchTerm.toLowerCase()));
        }
        return filtered.sort((a,b) => a.lastName.localeCompare(b.lastName, 'fa'));
    }, [students, classFilterForStudentSelection, studentSearchTerm]);

    const PRESET_COLORS = [
        '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#6b7280',
    ];

    const handleAddTag = () => {
        if (newTag.text.trim()) {
            setTags(prev => [...prev, { text: newTag.text.trim(), color: newTag.color }]);
            setNewTag({ text: '', color: '#e5e7eb' });
        }
    };

    const handleRemoveTag = (index: number) => {
        setTags(prev => prev.filter((_, i) => i !== index));
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(!title || !message) { alert('عنوان و متن پیام الزامی است.'); return; }
        
        const now = new Date();
        const date = now.toLocaleDateString('fa-IR-u-nu-latn').replace(/\//g, '-');
        const time = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        
        const deactivateAt = isDeactivationScheduled && deactivateDateTime.year && deactivateDateTime.month && deactivateDateTime.day
            ? `${deactivateDateTime.year}-${String(deactivateDateTime.month).padStart(2,'0')}-${String(deactivateDateTime.day).padStart(2,'0')}T${deactivateDateTime.time || '23:59'}`
            : undefined;

        onSubmit({
            id: notificationToEdit ? notificationToEdit.id : `notif-${Date.now()}`,
            title,
            message,
            audience,
            createdAt: notificationToEdit ? notificationToEdit.createdAt : `${date}T${time}`,
            createdBy: adminId,
            color,
            tags,
            link,
            linkText,
            imageUrl,
            isActive,
            deactivateAt
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-3xl max-h-[90vh] flex flex-col" onClick={e=>e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-4">{notificationToEdit ? 'ویرایش' : 'ایجاد'} اطلاعیه</h2>
                <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto space-y-4 pr-2">
                    <div><label>عنوان</label><input value={title} onChange={e=>setTitle(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-md" required /></div>
                    <div><label>متن پیام</label><textarea value={message} onChange={e=>setMessage(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-md" rows={5} required /></div>
                    
                    <div className="space-y-4 border-t pt-4">
                        <div className="flex items-center gap-6">
                             <label className="flex items-center gap-2 text-sm font-medium">
                                <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="h-4 w-4 rounded" />
                                فعال باشد
                            </label>
                            <label className="flex items-center gap-2 text-sm font-medium">
                                <input type="checkbox" checked={isDeactivationScheduled} onChange={e => setIsDeactivationScheduled(e.target.checked)} className="h-4 w-4 rounded" />
                                تنظیم زمان غیرفعال‌سازی خودکار
                            </label>
                        </div>
                        {isDeactivationScheduled && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 border rounded-md bg-gray-50">
                                <div>
                                    <label className="text-sm">تاریخ غیرفعال‌سازی</label>
                                    <DateSelector
                                        prefix="deactivate-date"
                                        year={deactivateDateTime.year} month={deactivateDateTime.month} day={deactivateDateTime.day}
                                        onYearChange={y => setDeactivateDateTime(p => ({...p, year: y}))}
                                        onMonthChange={m => setDeactivateDateTime(p => ({...p, month: m}))}
                                        onDayChange={d => setDeactivateDateTime(p => ({...p, day: d}))}
                                        years={years}
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm">ساعت غیرفعال‌سازی</label>
                                    <input type="time" value={deactivateDateTime.time} onChange={e => setDeactivateDateTime(p => ({...p, time: e.target.value}))} className="w-full mt-1 px-3 py-2 border rounded-md" />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                        <div>
                            <label>رنگ اطلاعیه</label>
                            <input type="color" value={color} onChange={e=>setColor(e.target.value)} className="w-full h-10 p-1 border rounded-md" />
                        </div>
                        <div className="space-y-2">
                            <label>برچسب‌ها</label>
                            <div className="flex gap-2">
                                <input value={newTag.text} onChange={e => setNewTag(p => ({...p, text: e.target.value}))} className="w-full px-3 py-2 border rounded-md" placeholder="متن برچسب..."/>
                                <input type="color" value={newTag.color} onChange={e => setNewTag(p => ({...p, color: e.target.value}))} className="w-12 h-10 p-1 border rounded-md" />
                                <button type="button" onClick={handleAddTag} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md">افزودن</button>
                            </div>
                            <div className="flex flex-wrap gap-2 pt-1 items-center">
                                <span className="text-xs text-gray-500 self-center">رنگ‌های پیشنهادی:</span>
                                {PRESET_COLORS.map(c => (
                                    <button
                                        key={c}
                                        type="button"
                                        onClick={() => setNewTag(p => ({...p, color: c}))}
                                        className="w-6 h-6 rounded-full border shadow-inner"
                                        style={{ backgroundColor: c }}
                                        title={c}
                                    />
                                ))}
                            </div>
                             <div className="flex flex-wrap gap-2 pt-1 min-h-[2rem]">
                                {tags.map((tag, index) => (
                                    <span key={index} className="flex items-center gap-2 px-2 py-1 text-xs rounded-full text-white" style={{ backgroundColor: tag.color }}>
                                        {tag.text}
                                        <button type="button" onClick={() => handleRemoveTag(index)} className="w-4 h-4 rounded-full bg-black/20 text-white flex items-center justify-center font-mono leading-none">&times;</button>
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label>لینک</label>
                            <input value={link} onChange={e=>setLink(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-md" placeholder="https://example.com" />
                        </div>
                        <div>
                            <label>متن دکمه لینک</label>
                            <input value={linkText} onChange={e=>setLinkText(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-md" placeholder="اطلاعات بیشتر" />
                        </div>
                        <div className="md:col-span-2">
                            <label>آدرس تصویر (اختیاری)</label>
                            <input value={imageUrl} onChange={e=>setImageUrl(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-md" placeholder="https://..." />
                        </div>
                    </div>

                    <div className="border-t pt-4">
                        <label className="block text-sm font-medium mb-2">مخاطبین</label>
                        <div className="space-y-2">
                            <div className="flex gap-4 flex-wrap">
                                <label className="flex items-center gap-1"><input type="radio" value="all_students" checked={audience.type === 'all_students'} onChange={() => setAudience({type: 'all_students', ids: []})} /> همه دانش آموزان</label>
                                <label className="flex items-center gap-1"><input type="radio" value="all_teachers" checked={audience.type === 'all_teachers'} onChange={() => setAudience({type: 'all_teachers', ids: []})} /> همه معلمان</label>
                                <label className="flex items-center gap-1"><input type="radio" value="class" checked={audience.type === 'class'} onChange={() => setAudience({type: 'class', ids: []})} /> کلاس(های) خاص</label>
                                <label className="flex items-center gap-1"><input type="radio" value="student" checked={audience.type === 'student'} onChange={() => setAudience({type: 'student', ids: []})} /> دانش آموز(ان) خاص</label>
                                <label className="flex items-center gap-1"><input type="radio" value="teacher" checked={audience.type === 'teacher'} onChange={() => setAudience({type: 'teacher', ids: []})} /> معلم(ان) خاص</label>
                            </div>
                            
                            {audience.type === 'class' && (
                                <select multiple value={audience.ids} onChange={e => setAudience({type: 'class', ids: Array.from(e.target.selectedOptions, option => option.value)})} className="w-full h-32 p-2 border rounded-md mt-2">
                                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            )}
                    
                            {audience.type === 'student' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 border-t pt-2">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">فیلتر بر اساس کلاس:</label>
                                        <div className="w-full h-40 p-2 border rounded-md overflow-y-auto">
                                            {classes.sort((a,b) => a.name.localeCompare(b.name, 'fa')).map(c => (
                                                <label key={c.id} className="flex items-center gap-2 text-sm p-1 rounded hover:bg-gray-100 cursor-pointer">
                                                    <input 
                                                        type="checkbox"
                                                        className="h-4 w-4 rounded text-indigo-600 border-gray-300 focus:ring-indigo-500"
                                                        checked={classFilterForStudentSelection.includes(c.id)}
                                                        onChange={e => {
                                                            const checked = e.target.checked;
                                                            setClassFilterForStudentSelection(prev => 
                                                                checked ? [...prev, c.id] : prev.filter(id => id !== c.id)
                                                            );
                                                        }}
                                                    />
                                                    {c.name}
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">انتخاب دانش آموزان:</label>
                                        <input type="search" value={studentSearchTerm} onChange={e => setStudentSearchTerm(e.target.value)} placeholder="جستجوی نام..." className="w-full px-3 py-1.5 border rounded-md mb-1" />
                                        <div className="w-full h-32 p-2 border rounded-md overflow-y-auto">
                                            {studentsToDisplay.map(student => (
                                                <label key={student.id} className="flex items-center gap-2 text-sm p-1 rounded hover:bg-gray-100 cursor-pointer">
                                                    <input 
                                                        type="checkbox"
                                                        className="h-4 w-4 rounded text-indigo-600 border-gray-300 focus:ring-indigo-500"
                                                        checked={audience.ids.includes(student.id)}
                                                        onChange={e => {
                                                            const checked = e.target.checked;
                                                            setAudience(prev => ({
                                                                type: 'student',
                                                                ids: checked 
                                                                    ? [...new Set([...prev.ids, student.id])]
                                                                    : prev.ids.filter(id => id !== student.id)
                                                            }));
                                                        }}
                                                    />
                                                    {formatFullName(student)}
                                                </label>
                                            ))}
                                        </div>
                                         <p className="text-xs text-gray-500 mt-1">تعداد انتخاب شده: {toPersianDigits(audience.ids.length)} نفر</p>
                                    </div>
                                </div>
                            )}

                             {audience.type === 'teacher' && (
                                <select multiple value={audience.ids} onChange={e => setAudience({type: 'teacher', ids: Array.from(e.target.selectedOptions, option => option.value)})} className="w-full h-32 p-2 border rounded-md">
                                    {teachers.map(t => <option key={t.id} value={t.id}>{formatFullName(t)}</option>)}
                                </select>
                            )}
                        </div>
                    </div>
                    <div className="flex justify-end gap-4 pt-4 border-t sticky bottom-0 bg-white"><button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">انصراف</button><button type="submit" className="px-4 py-2 bg-[var(--primary-600)] text-white rounded-md hover:bg-[var(--primary-700)]">{notificationToEdit ? 'ذخیره' : 'ارسال'}</button></div>
                </form>
            </div>
        </div>
    );
};

interface ScheduledNotificationModalProps {
    scheduledToEdit: ScheduledNotification | null;
    classes: SchoolClass[];
    students: Student[];
    teachers: Teacher[];
    onClose: () => void;
    onSubmit: (scheduled: ScheduledNotification) => void;
    adminId: string;
    years: string[];
}

const ScheduledNotificationModal: React.FC<ScheduledNotificationModalProps> = ({ scheduledToEdit, classes, students, teachers, onClose, onSubmit, adminId, years }) => {
    const [titleTemplate, setTitleTemplate] = useState('');
    const [messageTemplate, setMessageTemplate] = useState('');
    const [type, setType] = useState<ScheduledNotificationType>('birthday');
    const [audience, setAudience] = useState<NotificationAudience>({ type: 'all_students', ids: [] });
    const [color, setColor] = useState('#ef4444'); 
    const [tags, setTags] = useState<NotificationTag[]>([]);
    const [link, setLink] = useState('');
    const [linkText, setLinkText] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [imageUrl, setImageUrl] = useState('');
    
    // For date selection
    const [month, setMonth] = useState('1');
    const [day, setDay] = useState('1');
    const [fullDate, setFullDate] = useState({ year: '', month: '', day: '' });

    useEffect(() => {
        if (scheduledToEdit) {
            setTitleTemplate(scheduledToEdit.titleTemplate);
            setMessageTemplate(scheduledToEdit.messageTemplate);
            setType(scheduledToEdit.type);
            setAudience(scheduledToEdit.audience);
            setColor(scheduledToEdit.color || '#ef4444');
            setTags(scheduledToEdit.tags || []);
            setLink(scheduledToEdit.link || '');
            setLinkText(scheduledToEdit.linkText || '');
            setIsActive(scheduledToEdit.isActive);
            setImageUrl(scheduledToEdit.imageUrl || '');
            
            if (scheduledToEdit.type === 'specific_date') {
                const [y, m, d] = (scheduledToEdit.scheduledDate || '').split('-');
                setFullDate({ year: y || '', month: String(parseInt(m, 10)) || '', day: String(parseInt(d, 10)) || '' });
            } else if (scheduledToEdit.scheduledDate) {
                const [m, d] = (scheduledToEdit.scheduledDate || '').split('-');
                setMonth(String(parseInt(m, 10)) || '1');
                setDay(String(parseInt(d, 10)) || '1');
            }
        }
    }, [scheduledToEdit]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        let scheduledDate = '';
        if (type === 'specific_date') {
            if (!fullDate.year || !fullDate.month || !fullDate.day) {
                alert('لطفا تاریخ کامل را وارد کنید');
                return;
            }
            scheduledDate = `${fullDate.year}-${String(fullDate.month).padStart(2, '0')}-${String(fullDate.day).padStart(2, '0')}`;
        } else if (type === 'annual_event') {
            scheduledDate = `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        }
        // birthday uses student data, so scheduledDate can be empty or just meta

        onSubmit({
            id: scheduledToEdit ? scheduledToEdit.id : `scheduled-${Date.now()}`,
            titleTemplate,
            messageTemplate,
            type,
            audience,
            scheduledDate,
            color,
            tags,
            imageUrl,
            link,
            linkText,
            isActive,
            createdBy: adminId
        });
    };

    const placeholders = [
        { code: '{firstName}', label: 'نام' },
        { code: '{lastName}', label: 'نام خانوادگی' },
        { code: '{fullName}', label: 'نام و نام خانوادگی' },
        { code: '{className}', label: 'نام کلاس' }
    ];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-3xl max-h-[90vh] flex flex-col" onClick={e=>e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-4">{scheduledToEdit ? 'ویرایش' : 'ایجاد'} اعلان زمانبندی شده</h2>
                
                <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto space-y-6 pr-2">
                    <div className="bg-blue-50 p-4 rounded-lg flex items-start gap-3">
                        <Info className="w-5 h-5 text-blue-600 mt-1" />
                        <div className="text-sm text-blue-800">
                            <p className="font-bold mb-1">راهنمای شخصی‌سازی:</p>
                            <p>می‌توانید از متغیرهای زیر در عنوان و متن پیام استفاده کنید تا پیام به صورت خودکار برای هر دانش‌آموز شخصی‌سازی شود:</p>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {placeholders.map(p => (
                                    <span key={p.code} className="px-2 py-0.5 bg-blue-100 rounded border border-blue-200 font-mono text-xs cursor-help" title={p.label}>
                                        {p.code}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">نوع اعلان</label>
                            <select value={type} onChange={e => setType(e.target.value as any)} className="w-full px-3 py-2 border rounded-md">
                                <option value="birthday">تبریک تولد</option>
                                <option value="annual_event">مناسبت سالیانه (تکرار هر سال)</option>
                                <option value="specific_date">تاریخ خاص (یکبار مصرف)</option>
                            </select>
                        </div>
                        
                        {type !== 'birthday' && (
                            <div>
                                <label className="block text-sm font-medium mb-1">زمان‌بندی</label>
                                {type === 'annual_event' ? (
                                    <div className="flex gap-2">
                                        <select value={day} onChange={e => setDay(e.target.value)} className="w-1/2 b-px-3 py-2 border rounded-md">
                                            {Array.from({length: 31}, (_, i) => i + 1).map(d => (
                                                <option key={d} value={d}>{toPersianDigits(d)}</option>
                                            ))}
                                        </select>
                                        <select value={month} onChange={e => setMonth(e.target.value)} className="w-1/2 px-3 py-2 border rounded-md">
                                            {['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'].map((m, i) => (
                                                <option key={i+1} value={i+1}>{m}</option>
                                            ))}
                                        </select>
                                    </div>
                                ) : (
                                    <DateSelector
                                        prefix="scheduled-date"
                                        year={fullDate.year} month={fullDate.month} day={fullDate.day}
                                        onYearChange={y => setFullDate(p => ({...p, year: y}))}
                                        onMonthChange={m => setFullDate(p => ({...p, month: m}))}
                                        onDayChange={d => setFullDate(p => ({...p, day: d}))}
                                        years={years}
                                    />
                                )}
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">قالب عنوان</label>
                        <input value={titleTemplate} onChange={e=>setTitleTemplate(e.target.value)} className="w-full px-3 py-2 border rounded-md" placeholder="مثلاً: تولدت مبارک {firstName} جان" required />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium mb-1">قالب متن پیام</label>
                        <textarea value={messageTemplate} onChange={e=>setMessageTemplate(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm" rows={4} placeholder="متن تبریک یا اطلاع‌رسانی..." required />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">رنگ تم</label>
                            <input type="color" value={color} onChange={e=>setColor(e.target.value)} className="w-full h-10 p-1 border rounded-md" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">آدرس تصویر (اختیاری)</label>
                            <input value={imageUrl} onChange={e=>setImageUrl(e.target.value)} className="w-full px-3 py-2 border rounded-md" placeholder="https://..." />
                        </div>
                    </div>

                    <div className="border-t pt-4">
                        <label className="block text-sm font-medium mb-2">مخاطبین هدف</label>
                        <div className="flex gap-4 flex-wrap mb-4">
                            <label className="flex items-center gap-1 text-sm"><input type="radio" checked={audience.type === 'all_students'} onChange={() => setAudience({type: 'all_students', ids: []})} /> همه دانش‌آموزان</label>
                            <label className="flex items-center gap-1 text-sm"><input type="radio" checked={audience.type === 'class'} onChange={() => setAudience({type: 'class', ids: []})} /> کلاس‌های خاص</label>
                            {type !== 'birthday' && (
                                <label className="flex items-center gap-1 text-sm"><input type="radio" checked={audience.type === 'all_teachers'} onChange={() => setAudience({type: 'all_teachers', ids: []})} /> همه معلمان</label>
                            )}
                        </div>
                        
                        {audience.type === 'class' && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 border rounded-md bg-gray-50 h-32 overflow-y-auto">
                                {classes.map(c => (
                                    <label key={c.id} className="flex items-center gap-2 text-xs">
                                        <input 
                                            type="checkbox" 
                                            checked={audience.ids.includes(c.id)}
                                            onChange={e => {
                                                const checked = e.target.checked;
                                                setAudience(prev => ({
                                                    type: 'class',
                                                    ids: checked ? [...prev.ids, c.id] : prev.ids.filter(id => id !== c.id)
                                                }));
                                            }}
                                        />
                                        {c.name}
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 sticky bottom-0 bg-white pt-4 border-t">
                        <button type="button" onClick={onClose} className="px-4 py-2 border rounded-md hover:bg-gray-50">انصراف</button>
                        <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 shadow-md">ثبت اعلان</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

interface NotificationsTabProps {
    admin: Admin;
    years: string[];
}
const NotificationsTab: React.FC<NotificationsTabProps> = ({ admin, years }) => {
    const { students, teachers, classes, notifications, scheduledNotifications, saveNotification, deleteNotification, saveScheduledNotification, deleteScheduledNotification } = useData();
    const [modal, setModal] = useState<'create' | 'edit' | 'scheduled_create' | 'scheduled_edit' | null>(null);
    const [notificationToEdit, setNotificationToEdit] = useState<Notification | null>(null);
    const [scheduledToEdit, setScheduledToEdit] = useState<ScheduledNotification | null>(null);
    const [activeTab, setActiveTab] = useState<'immediate' | 'scheduled'>('immediate');
    
    const audienceToString = (audience: NotificationAudience) => {
        if (!audience) return 'نامشخص';
        switch(audience.type) {
            case 'all_students': return 'همه دانش آموزان';
            case 'all_teachers': return 'همه معلمان';
            case 'class': return audience.ids.map(id => classes.find(c=>c.id === id)?.name || 'کلاس حذف شده').join(', ');
            case 'student': return `${toPersianDigits(audience.ids.length)} دانش آموز خاص`;
            case 'teacher': return `${toPersianDigits(audience.ids.length)} معلم خاص`;
            default: return 'نامشخص';
        }
    };
    
    const enrichedNotifications = useMemo(() => notifications.map(e => ({...e, audienceText: audienceToString(e.audience)})), [notifications, classes]);
    const { items: sortedNotifications, requestSort, sortConfig } = useSortableData(enrichedNotifications, [{ key: 'createdAt', direction: 'descending' }]);

    const getTypeLabel = (type: string) => {
        switch(type) {
            case 'birthday': return 'تبریک تولد';
            case 'annual_event': return 'مناسبت سالیانه';
            case 'specific_date': return 'تاریخ خاص';
            default: return type;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
                    <button 
                        onClick={() => setActiveTab('immediate')}
                        className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'immediate' ? 'bg-white shadow-sm text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        اطلاعیه‌های فوری
                    </button>
                    <button 
                        onClick={() => setActiveTab('scheduled')}
                        className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'scheduled' ? 'bg-white shadow-sm text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        اعلانات زمان‌بندی شده
                    </button>
                </div>
                
                {activeTab === 'immediate' ? (
                    <button onClick={() => { setNotificationToEdit(null); setModal('create'); }} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all font-bold text-sm">
                        <Plus size={18} />
                        ایجاد اطلاعیه فوری
                    </button>
                ) : (
                    <button onClick={() => { setScheduledToEdit(null); setModal('scheduled_create'); }} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all font-bold text-sm">
                        <Plus size={18} />
                        برنامه‌ریزی اعلان جدید
                    </button>
                )}
            </div>

            {activeTab === 'immediate' ? (
                <div className="overflow-x-auto bg-white rounded-2xl shadow-sm border border-gray-100">
                    <table className="w-full text-sm text-right">
                        <thead className="bg-gray-50/50 text-gray-500 uppercase font-black text-xs">
                            <tr>
                                <SortableHeader sortKey="title" requestSort={requestSort} sortConfig={sortConfig} className="px-6 py-4">عنوان</SortableHeader>
                                <SortableHeader sortKey="createdAt" requestSort={requestSort} sortConfig={sortConfig} className="px-6 py-4">زمان ارسال</SortableHeader>
                                <th className="px-6 py-4">مخاطب</th>
                                <th className="px-6 py-4 text-center">وضعیت</th>
                                <th className="px-6 py-4 text-center">عملیات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {sortedNotifications.map(notification => (
                                <tr key={notification.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <span className="w-2.5 h-2.5 rounded-full ring-4 ring-offset-2" style={{ backgroundColor: notification.color || '#facc15', '--tw-ring-color': `${notification.color}22` } as any}></span>
                                            <span className="font-bold text-gray-900">{notification.title}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-mono text-gray-500">
                                        {toPersianDigits(notification.createdAt.replace('T', ' '))}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded-md">
                                            {notification.audienceText}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {notification.isActive ? (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-50 text-green-700">
                                                فعال
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-700">
                                                غیرفعال
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-center gap-2">
                                            <button onClick={() => { setNotificationToEdit(notification); setModal('edit'); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="ویرایش">
                                                <Edit size={16} />
                                            </button>
                                            <button onClick={() => deleteNotification(notification.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all" title="حذف">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {scheduledNotifications.map(sn => (
                        <div key={sn.id} className="relative bg-white border border-gray-100 rounded-3xl shadow-sm hover:shadow-md transition-all overflow-hidden p-6 group">
                            <div className="absolute top-0 right-0 w-2 h-full" style={{ backgroundColor: sn.color }}></div>
                            
                            <div className="flex items-start justify-between mb-4">
                                <div className={`p-3 rounded-2xl ${sn.type === 'birthday' ? 'bg-pink-50 text-pink-600' : sn.type === 'annual_event' ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'}`}>
                                    {sn.type === 'birthday' ? <Gift size={24} /> : sn.type === 'annual_event' ? <Calendar size={24} /> : <Clock size={24} />}
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => { setScheduledToEdit(sn); setModal('scheduled_edit'); }} className="p-2 bg-gray-50 text-blue-600 rounded-xl hover:bg-blue-50">
                                        <Edit size={16} />
                                    </button>
                                    <button onClick={() => deleteScheduledNotification(sn.id)} className="p-2 bg-gray-50 text-red-600 rounded-xl hover:bg-red-50">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                            
                            <h3 className="text-lg font-black text-gray-900 mb-2 truncate" title={sn.titleTemplate}>{sn.titleTemplate}</h3>
                            <p className="text-xs text-gray-500 line-clamp-2 mb-4" title={sn.messageTemplate}>{sn.messageTemplate}</p>
                            
                            {sn.imageUrl && (
                                <div className="mb-4 w-full h-32 rounded-xl overflow-hidden border border-gray-100">
                                    <img src={sn.imageUrl} alt="Notification Preview" className="w-full h-full object-cover" />
                                </div>
                            )}

                            <div className="space-y-3 pt-4 border-t border-gray-50 text-xs">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400">نوع:</span>
                                    <span className="font-bold text-gray-700">{getTypeLabel(sn.type)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400">مخاطب:</span>
                                    <span className="font-bold text-gray-700 truncate max-w-[120px]">{audienceToString(sn.audience)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400">زمان‌بندی:</span>
                                    <span className="font-bold text-indigo-600">
                                        {sn.type === 'birthday' ? 'روز تولد هر فرد' : toPersianDigits(sn.scheduledDate)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400">وضعیت:</span>
                                    <span className={`font-bold ${sn.isActive ? 'text-green-600' : 'text-red-600'}`}>
                                        {sn.isActive ? 'فعال' : 'غیرفعال'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                    
                    {scheduledNotifications.length === 0 && (
                        <div className="col-span-full py-20 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-400 font-bold">هیچ اعلان زمان‌بندی شده‌ای یافت نشد</p>
                            <button 
                                onClick={() => { setScheduledToEdit(null); setModal('scheduled_create'); }}
                                className="mt-4 text-indigo-600 font-bold text-sm hover:underline"
                            >
                                اولین برنامه را بسازید
                            </button>
                        </div>
                    )}
                </div>
            )}

            {(modal === 'create' || (modal === 'edit' && notificationToEdit)) && (
                <NotificationModal 
                    notificationToEdit={notificationToEdit} 
                    classes={classes} 
                    students={students} 
                    teachers={teachers} 
                    onClose={() => setModal(null)} 
                    onSubmit={notif => { saveNotification(notif); setModal(null); }} 
                    adminId={admin.id} 
                    years={years} 
                />
            )}

            {(modal === 'scheduled_create' || (modal === 'scheduled_edit' && scheduledToEdit)) && (
                <ScheduledNotificationModal
                    scheduledToEdit={scheduledToEdit}
                    classes={classes}
                    students={students}
                    teachers={teachers}
                    onClose={() => setModal(null)}
                    onSubmit={sch => { saveScheduledNotification(sch); setModal(null); }}
                    adminId={admin.id}
                    years={years}
                />
            )}
        </div>
    );
};
export default NotificationsTab;