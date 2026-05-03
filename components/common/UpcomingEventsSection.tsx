import React, { useMemo } from 'react';
import type { Student, Teacher, UpcomingEvent } from '../../types';
import { useData } from '../../App';
import Card from './Card';
import { toPersianDigits } from './formatters';

const CalendarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const LocationIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const TrophyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 11l3-3m0 0l3 3m-3-3v8m0-13a9 9 0 110 18 9 9 0 010-18z" /></svg>;
const MoneyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
const UserIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const EventsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11.5l1.09 2.22 2.45.36-1.78 1.73.42 2.44L12 16.5l-2.18 1.75.42-2.44-1.78-1.73 2.45-.36L12 11.5z" /></svg>;


interface UpcomingEventsSectionProps {
    user: Student | Teacher;
    role: 'student' | 'teacher';
}

const UpcomingEventsSection: React.FC<UpcomingEventsSectionProps> = ({ user, role }) => {
    const { events } = useData();

    const today = new Date().toLocaleDateString('fa-IR-u-nu-latn', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-');

    const myEvents = useMemo(() => {
        return events
            .filter(event => {
                if (event.dateTime.split('T')[0] < today) return false;

                const audience = event.audience;
                if (role === 'student') {
                    const student = user as Student;
                    if (audience.type === 'all_students') return true;
                    if (audience.type === 'class' && audience.ids.includes(student.classId)) return true;
                    if (audience.type === 'student' && audience.ids.includes(student.id)) return true;
                } else if (role === 'teacher') {
                    const teacher = user as Teacher;
                    if (audience.type === 'all_teachers') return true;
                    if (audience.type === 'teacher' && audience.ids.includes(teacher.id)) return true;
                }
                return false;
            })
            .sort((a, b) => a.dateTime.localeCompare(b.dateTime));
    }, [events, user, role, today]);

    if (myEvents.length === 0) {
        return null;
    }
    
    const formatEventDate = (dateString: string) => {
        const [date, time] = dateString.split('T');
        return { date: toPersianDigits(date), time: toPersianDigits(time || '') };
    }

    return (
        <Card title="رویدادهای پیش رو" icon={<EventsIcon />}>
            <div className="space-y-6">
                {myEvents.map(event => {
                    const { date, time } = formatEventDate(event.dateTime);
                    return (
                        <div key={event.id} className="bg-white rounded-xl shadow-lg overflow-hidden transition-shadow hover:shadow-2xl flex flex-col md:flex-row">
                            {event.imageUrl && (
                                <div className="md:w-1/3 flex-shrink-0">
                                    <img src={event.imageUrl} alt={event.title} className="w-full h-48 md:h-full object-cover" />
                                </div>
                            )}
                            <div className="p-6 flex flex-col flex-grow">
                                <div className="flex-grow">
                                    <p className="flex items-center gap-2 text-sm font-semibold text-[var(--primary-600)] mb-2">
                                        <CalendarIcon />
                                        <span>{date}{time && ` - ساعت ${time}`}</span>
                                    </p>
                                    <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">{event.title}</h3>
                                    {event.description && (
                                        <p className="text-sm text-gray-700 mb-4 pb-4 border-b">{event.description}</p>
                                    )}
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 text-sm text-[var(--text-secondary)]">
                                        {event.location && <div className="flex items-center gap-2"> <LocationIcon /> <span>مکان:</span> <span className="font-medium text-gray-800">{event.location}</span></div>}
                                        {event.host && <div className="flex items-center gap-2"><UserIcon /><span>برگزارکننده:</span><span className="font-medium text-gray-800">{event.host}</span></div>}
                                        <div className="flex items-center gap-2"><MoneyIcon /><span>هزینه:</span><span className="font-medium text-gray-800">{event.cost ? `${toPersianDigits(event.cost.toLocaleString())} ریال` : 'رایگان'}</span></div>
                                        {event.prize && <div className="flex items-center gap-2"><TrophyIcon /><span>جایزه:</span><span className="font-medium text-gray-800">{event.prize}</span></div>}
                                    </div>
                                </div>
                                
                                {event.link && (
                                    <div className="mt-6 text-right">
                                        <a href={event.link} target="_blank" rel="noopener noreferrer" className="inline-block px-6 py-2 bg-[var(--primary-600)] text-white font-bold rounded-lg hover:bg-[var(--primary-700)] transition-transform hover:scale-105 shadow-md hover:shadow-lg">
                                            {event.linkText || 'اطلاعات بیشتر'}
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </Card>
    );
};

export default UpcomingEventsSection;