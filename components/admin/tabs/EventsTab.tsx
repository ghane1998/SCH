import React, { useState, useMemo } from 'react';
import type { UpcomingEvent, Student, SchoolClass, Admin, EventAudience, EventAudienceType, Teacher } from '../../../types';
import { useSortableData } from '../../common/useSortableData';
import { SortableHeader } from '../../common/SortableHeader';
import { toPersianDigits, formatFullName } from '../../common/formatters';
import DateSelector from '../../common/DateSelector';

const AmountInput: React.FC<{ value: string; onChange: (value: string) => void; [x: string]: any; }> = ({ value, onChange, ...props }) => {
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value.replace(/,/g, '');
        if (/^\d*$/.test(rawValue)) {
            onChange(rawValue);
        }
    };
    const formattedValue = value ? Number(value).toLocaleString('en-US') : '';
    return <input {...props} className="w-full mt-1 px-3 py-2 border rounded-md" value={formattedValue} onChange={handleInputChange} />;
};


interface EventModalProps {
    eventToEdit: UpcomingEvent | null;
    classes: SchoolClass[];
    students: Student[];
    teachers: Teacher[];
    onClose: () => void;
    onSubmit: (event: UpcomingEvent) => void;
    adminId: string;
    years: string[];
}
const EventModal: React.FC<EventModalProps> = ({ eventToEdit, classes, students, teachers, onClose, onSubmit, adminId, years }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [dateTime, setDateTime] = useState({ year: '', month: '', day: '', time: '' });
    const [location, setLocation] = useState('');
    const [cost, setCost] = useState('');
    const [link, setLink] = useState('');
    const [linkText, setLinkText] = useState('');
    const [prize, setPrize] = useState('');
    const [host, setHost] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [audience, setAudience] = useState<EventAudience>({ type: 'all_students', ids: [] });
    const [classFilterForStudentSelection, setClassFilterForStudentSelection] = useState<string[]>([]);
    
    React.useEffect(() => {
        if (eventToEdit) {
            const [datePart, timePart] = eventToEdit.dateTime.split('T');
            const [y, m, d] = datePart.split('-');
            setTitle(eventToEdit.title);
            setDescription(eventToEdit.description || '');
            setDateTime({ year: y, month: String(parseInt(m,10)), day: String(parseInt(d,10)), time: timePart || '' });
            setLocation(eventToEdit.location);
            setCost(eventToEdit.cost?.toString() || '');
            setLink(eventToEdit.link || '');
            setLinkText(eventToEdit.linkText || '');
            setPrize(eventToEdit.prize || '');
            setHost(eventToEdit.host || '');
            setAudience(eventToEdit.audience);
            setImageUrl(eventToEdit.imageUrl || '');

            if (eventToEdit.audience.type === 'student') {
                const studentClassIds = eventToEdit.audience.ids
                    .map(studentId => students.find(s => s.id === studentId)?.classId)
                    .filter((id): id is string => !!id);
                setClassFilterForStudentSelection([...new Set(studentClassIds)]);
            } else {
                 setClassFilterForStudentSelection([]);
            }
        } else {
            const [y,m,d] = new Date().toLocaleDateString('fa-IR-u-nu-latn').split('/');
            setDateTime(p => ({...p, year: y, month: m, day: d}));
            setClassFilterForStudentSelection([]);
        }
    }, [eventToEdit, students]);
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(!title || !dateTime.year) { alert('عنوان و تاریخ رویداد الزامی است.'); return; }
        
        onSubmit({
            id: eventToEdit ? eventToEdit.id : `evt-${Date.now()}`,
            title,
            description,
            dateTime: `${dateTime.year}-${String(dateTime.month).padStart(2,'0')}-${String(dateTime.day).padStart(2,'0')}T${dateTime.time || '00:00'}`,
            location,
            cost: cost ? Number(cost) : undefined,
            link, linkText, prize, host, audience,
            createdBy: adminId,
            imageUrl,
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e=>e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-4">{eventToEdit ? 'ویرایش' : 'ایجاد'} رویداد</h2>
                <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto space-y-4 pr-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label>عنوان رویداد</label><input value={title} onChange={e=>setTitle(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-md" required /></div>
                        <div><label>مکان</label><input value={location} onChange={e=>setLocation(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-md" /></div>
                        <div className="md:col-span-2"><label>توضیحات</label><textarea value={description} onChange={e=>setDescription(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-md" rows={3} /></div>
                        <div><label>تاریخ</label><DateSelector prefix="evt" year={dateTime.year} month={dateTime.month} day={dateTime.day} onYearChange={y=>setDateTime(p=>({...p, year: y}))} onMonthChange={m=>setDateTime(p=>({...p, month: m}))} onDayChange={d=>setDateTime(p=>({...p, day: d}))} years={years} /></div>
                        <div><label>ساعت</label><input type="time" value={dateTime.time} onChange={e=>setDateTime(p=>({...p, time: e.target.value}))} className="w-full mt-1 px-3 py-2 border rounded-md" /></div>
                        <div><label>هزینه (ریال)</label><AmountInput value={cost} onChange={setCost} placeholder="رایگان" /></div>
                        <div><label>جایزه</label><input value={prize} onChange={e=>setPrize(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-md" /></div>
                        <div><label>لینک اطلاعات بیشتر</label><input value={link} onChange={e=>setLink(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-md" placeholder="https://example.com" /></div>
                        <div><label>متن دکمه لینک</label><input value={linkText} onChange={e=>setLinkText(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-md" placeholder="اطلاعات بیشتر" /></div>
                        <div><label>استاد / برگزار کننده</label><input value={host} onChange={e=>setHost(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-md" /></div>
                        <div className="md:col-span-2"><label>آدرس تصویر رویداد (URL)</label><input value={imageUrl} onChange={e=>setImageUrl(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-md" placeholder="https://example.com/image.png" /></div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">مخاطبین رویداد</label>
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
                                        <select 
                                            multiple 
                                            value={classFilterForStudentSelection} 
                                            onChange={e => setClassFilterForStudentSelection(Array.from(e.target.selectedOptions, option => option.value))} 
                                            className="w-full h-40 p-2 border rounded-md"
                                        >
                                            {classes.sort((a,b) => a.name.localeCompare(b.name, 'fa')).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                        <p className="text-xs text-gray-500 mt-1">برای نمایش دانش آموزان، یک یا چند کلاس را انتخاب کنید. (Ctrl/Cmd + Click)</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">انتخاب دانش آموزان:</label>
                                        <div className="w-full h-40 p-2 border rounded-md overflow-y-auto">
                                            {classFilterForStudentSelection.length === 0 ? (
                                                <div className="flex items-center justify-center h-full">
                                                    <p className="text-xs text-gray-500 text-center">کلاسی برای فیلتر انتخاب نشده است.</p>
                                                </div>
                                            ) : (
                                                students
                                                    .filter(s => classFilterForStudentSelection.includes(s.classId))
                                                    .sort((a,b) => a.lastName.localeCompare(b.lastName, 'fa'))
                                                    .map(student => (
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
                                                    ))
                                            )}
                                        </div>
                                         <p className="text-xs text-gray-500 mt-1">تعداد انتخاب شده: {toPersianDigits(audience.ids.length)} نفر</p>
                                    </div>
                                </div>
                            )}

                             {audience.type === 'teacher' && (
                                <div className="mt-2">
                                    <label className="block text-sm font-medium mb-1">انتخاب معلمان:</label>
                                    <select multiple value={audience.ids} onChange={e => setAudience({type: 'teacher', ids: Array.from(e.target.selectedOptions, option => option.value)})} className="w-full h-32 p-2 border rounded-md">
                                        {teachers.map(t => <option key={t.id} value={t.id}>{formatFullName(t)}</option>)}
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex justify-end gap-4 pt-4 border-t sticky bottom-0 bg-white"><button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">انصراف</button><button type="submit" className="px-4 py-2 bg-[var(--primary-600)] text-white rounded-md hover:bg-[var(--primary-700)]">{eventToEdit ? 'ذخیره' : 'ایجاد'}</button></div>
                </form>
            </div>
        </div>
    );
};

interface EventsTabProps {
    events: UpcomingEvent[]; students: Student[]; teachers: Teacher[]; classes: SchoolClass[]; adminId: string; years: string[];
    saveEvent: (event: UpcomingEvent) => void;
    deleteEvent: (eventId: string) => void;
}
const EventsTab: React.FC<EventsTabProps> = ({ events, students, teachers, classes, adminId, years, saveEvent, deleteEvent }) => {
    const [modal, setModal] = useState<'create' | 'edit' | null>(null);
    const [eventToEdit, setEventToEdit] = useState<UpcomingEvent | null>(null);
    
    const audienceToString = (audience: EventAudience) => {
        switch(audience.type) {
            case 'all_students': return 'همه دانش آموزان';
            case 'all_teachers': return 'همه معلمان';
            case 'class': return audience.ids.map(id => classes.find(c=>c.id === id)?.name || 'کلاس حذف شده').join(', ');
            case 'student': return `${toPersianDigits(audience.ids.length)} دانش آموز خاص`;
            case 'teacher': return `${toPersianDigits(audience.ids.length)} معلم خاص`;
            default: return 'نامشخص';
        }
    };
    
    const enrichedEvents = useMemo(() => events.map(e => ({...e, audienceText: audienceToString(e.audience)})), [events, classes, students, teachers]);
    const { items: sortedEvents, requestSort, sortConfig } = useSortableData(enrichedEvents, [{ key: 'dateTime', direction: 'descending' }]);

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center"><h2 className="text-xl font-bold">مدیریت رویدادها</h2><button onClick={() => { setEventToEdit(null); setModal('create'); }} className="px-4 py-2 bg-blue-500 text-white rounded-md">ایجاد رویداد</button></div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-right bg-white rounded-lg shadow-md">
                    <thead className="bg-gray-50"><tr>
                        <SortableHeader sortKey="title" requestSort={requestSort} sortConfig={sortConfig}>عنوان</SortableHeader>
                        <SortableHeader sortKey="dateTime" requestSort={requestSort} sortConfig={sortConfig}>زمان</SortableHeader>
                        <th className="px-4 py-3">مخاطب</th><th>اقدامات</th>
                    </tr></thead>
                    <tbody>{sortedEvents.map(event => <tr key={event.id} className="border-b">
                        <td className="p-2 font-semibold">{event.title}</td>
                        <td className="p-2">{toPersianDigits(event.dateTime.replace('T', ' ساعت '))}</td>
                        <td className="p-2 text-xs">{event.audienceText}</td>
                        <td className="p-2 text-xs"><button onClick={() => { setEventToEdit(event); setModal('edit'); }} className="font-medium text-blue-600 hover:underline mr-2">ویرایش</button><button onClick={() => deleteEvent(event.id)} className="font-medium text-red-600 hover:underline">حذف</button></td>
                    </tr>)}</tbody>
                </table>
            </div>
            {(modal === 'create' || (modal === 'edit' && eventToEdit)) && <EventModal eventToEdit={eventToEdit} classes={classes} students={students} teachers={teachers} onClose={() => setModal(null)} onSubmit={event => { saveEvent(event); setModal(null); }} adminId={adminId} years={years} />}
        </div>
    );
};
export default EventsTab;