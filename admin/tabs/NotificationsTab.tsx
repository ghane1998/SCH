import React, { useState, useMemo } from 'react';
import type { Notification, Student, SchoolClass, Admin, NotificationAudience, Teacher, NotificationTag } from '../../../types';
import { useData } from '../../../App';
import { useSortableData } from '../../common/useSortableData';
import { SortableHeader } from '../../common/SortableHeader';
import { toPersianDigits, formatFullName } from '../../common/formatters';
import DateSelector from '../../common/DateSelector';

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
                                // FIX: Cast option to HTMLOptionElement to access value property
                                <select multiple value={audience.ids} onChange={e => setAudience({type: 'class', ids: Array.from(e.target.selectedOptions, option => (option as HTMLOptionElement).value)})} className="w-full h-32 p-2 border rounded-md mt-2">
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
                                <div className="mt-2">
                                    <label className="block text-sm font-medium mb-1">انتخاب معلمان:</label>
                                    {/* FIX: Cast option to HTMLOptionElement to access value property */}
                                    <select multiple value={audience.ids} onChange={e => setAudience({type: 'teacher', ids: Array.from(e.target.selectedOptions, option => (option as HTMLOptionElement).value)})} className="w-full h-32 p-2 border rounded-md">
                                        {teachers.map(t => <option key={t.id} value={t.id}>{formatFullName(t)}</option>)}
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex justify-end gap-4 pt-4 border-t sticky bottom-0 bg-white"><button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">انصراف</button><button type="submit" className="px-4 py-2 bg-[var(--primary-600)] text-white rounded-md hover:bg-[var(--primary-700)]">{notificationToEdit ? 'ذخیره' : 'ارسال'}</button></div>
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
    const { students, teachers, classes, notifications, saveNotification, deleteNotification } = useData();
    const [modal, setModal] = useState<'create' | 'edit' | null>(null);
    const [notificationToEdit, setNotificationToEdit] = useState<Notification | null>(null);
    
    const audienceToString = (audience: NotificationAudience) => {
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

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center"><h2 className="text-xl font-bold">مدیریت اطلاع رسانی</h2><button onClick={() => { setNotificationToEdit(null); setModal('create'); }} className="px-4 py-2 bg-blue-500 text-white rounded-md">ایجاد اطلاعیه</button></div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-right bg-white rounded-lg shadow-md">
                    <thead className="bg-gray-50"><tr>
                        {/* FIX: Add missing children prop */}
                        <SortableHeader sortKey="title" requestSort={requestSort} sortConfig={sortConfig}>عنوان</SortableHeader>
                        {/* FIX: Add missing children prop */}
                        <SortableHeader sortKey="createdAt" requestSort={requestSort} sortConfig={sortConfig}>زمان ارسال</SortableHeader>
                        <th className="px-4 py-3">مخاطب</th>
                        <th className="px-4 py-3">وضعیت</th>
                        <th>اقدامات</th>
                    </tr></thead>
                    <tbody>{sortedNotifications.map(notification => <tr key={notification.id} className="border-b">
                        <td className="p-2 font-semibold flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: notification.color || '#facc15' }}></span>
                            {notification.title}
                        </td>
                        <td className="p-2">{toPersianDigits(notification.createdAt.replace('T', ' ساعت '))}</td>
                        <td className="p-2 text-xs">{notification.audienceText}</td>
                        <td className="p-2 text-xs">
                            {notification.isActive ? (
                                <span className="px-2 py-1 rounded-full bg-green-100 text-green-800">فعال</span>
                            ) : (
                                <span className="px-2 py-1 rounded-full bg-red-100 text-red-800">غیرفعال</span>
                            )}
                            {notification.deactivateAt && (
                                <div className="mt-1 text-gray-500">
                                    تا: {toPersianDigits(notification.deactivateAt.replace('T', ' '))}
                                </div>
                            )}
                        </td>
                        <td className="p-2 text-xs"><button onClick={() => { setNotificationToEdit(notification); setModal('edit'); }} className="font-medium text-blue-600 hover:underline mr-2">ویرایش</button><button onClick={() => deleteNotification(notification.id)} className="font-medium text-red-600 hover:underline">حذف</button></td>
                    </tr>)}</tbody>
                </table>
            </div>
            {(modal === 'create' || (modal === 'edit' && notificationToEdit)) && <NotificationModal notificationToEdit={notificationToEdit} classes={classes} students={students} teachers={teachers} onClose={() => setModal(null)} onSubmit={notif => { saveNotification(notif); setModal(null); }} adminId={admin.id} years={years} />}
        </div>
    );
};
export default NotificationsTab;