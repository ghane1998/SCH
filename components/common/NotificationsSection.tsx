

import React, { useMemo } from 'react';
import type { Student, Teacher, Notification } from '../../types';
import { useData } from '../../App';
import { toPersianDigits } from './formatters';

const BellIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>;

interface NotificationsSectionProps {
    user: Student | Teacher;
    role: 'student' | 'teacher';
}

const NotificationsSection: React.FC<NotificationsSectionProps> = ({ user, role }) => {
    const { notifications } = useData();
    
    const myNotifications = useMemo(() => {
        return notifications
            .filter(notification => {
                const audience = notification.audience;
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
            });
    }, [notifications, user, role]);


    if (myNotifications.length === 0) {
        return null;
    }

    return (
        <div className="space-y-4">
            {myNotifications.map(notification => (
                 <div key={notification.id} className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-4 rounded-lg shadow-md flex items-start gap-4" role="alert">
                    <div className="flex-shrink-0 pt-1">
                        <BellIcon />
                    </div>
                    <div className="flex-grow">
                        <p className="font-bold">{notification.title}</p>
                        <p className="text-sm mt-1">{notification.message}</p>
                        <p className="text-xs mt-2 text-yellow-700">{toPersianDigits(notification.createdAt.replace('T', ' - '))}</p>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default NotificationsSection;