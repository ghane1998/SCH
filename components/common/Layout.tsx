

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth, useSettings, useData } from '../../App';
import type { User, Student, Teacher, Notification } from '../../types';
import { formatFullName, toPersianDigits } from './formatters';
import { ArrowRight } from 'lucide-react';

interface LayoutProps {
  user: User;
  children: React.ReactNode;
  onBack?: () => void;
  autoOpenNotifications?: boolean;
}

const BellIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
);
  
const LogoutIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
);

const HomeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
)

const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const Layout: React.FC<LayoutProps> = ({ user, children, onBack, autoOpenNotifications }) => {
  const { logout, role } = useAuth();
  const { settings } = useSettings();
  const { notifications, scheduledNotifications } = useData();

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [hasAutoOpened, setHasAutoOpened] = useState(false);

  const [lastSeenTimestamp, setLastSeenTimestamp] = useState<string | null>(
      () => localStorage.getItem(`lastSeenNotificationTimestamp_${user.id}`)
  );
  const notificationsRef = useRef<HTMLDivElement>(null);
  
  const studentUser = user as Student;
  const isStudentWithPic = 'classId' in user && studentUser.profilePictureUrl;

  const replacePlaceholders = (template: string, student: Student) => {
    return template
        .replace(/{firstName}/g, student.firstName || '')
        .replace(/{lastName}/g, student.lastName || '')
        .replace(/{fullName}/g, `${student.firstName || ''} ${student.lastName || ''}`.trim())
        .replace(/{className}/g, student.className || '');
  };

  const myNotifications = useMemo(() => {
    if (!role) return [];

    const now = new Date();
    const currentJalaliDate = new Intl.DateTimeFormat('fa-IR-u-nu-latn', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).format(now).replace(/\//g, '-');
    const currentTime = new Intl.DateTimeFormat('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    }).format(now);
    const currentDateTimeString = `${currentJalaliDate}T${currentTime}`;

    // 1. Regular Notifications
    const relevantNotifications = notifications.filter(notification => {
        if (!notification.isActive) {
            return false;
        }

        if (notification.deactivateAt && notification.deactivateAt <= currentDateTimeString) {
            return false;
        }

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

    // 2. Scheduled Notifications
    const currentMonthDay = currentJalaliDate.split('-').slice(1).join('-');
    const synthesizedScheduled = scheduledNotifications.filter(sn => {
        if (!sn.isActive) return false;
        
        // Audience check
        const audience = sn.audience;
        let isAudience = false;
        if (role === 'student') {
            const student = user as Student;
            if (audience.type === 'all_students') isAudience = true;
            else if (audience.type === 'class' && audience.ids.includes(student.classId)) isAudience = true;
            else if (audience.type === 'student' && audience.ids.includes(student.id)) isAudience = true;
        } else if (role === 'teacher') {
            const teacher = user as Teacher;
            if (audience.type === 'all_teachers') isAudience = true;
            else if (audience.type === 'teacher' && audience.ids.includes(teacher.id)) isAudience = true;
        }
        
        if (!isAudience) return false;

        // Date match
        if (sn.type === 'birthday' && role === 'student') {
            const student = user as Student;
            if (!student.dateOfBirth) return false;
            const dobParts = student.dateOfBirth.split('-');
            if (dobParts.length < 3) return false;
            const studentMonthDay = `${dobParts[1]}-${dobParts[2]}`;
            return studentMonthDay === currentMonthDay;
        } else if (sn.type === 'annual_event') {
            return sn.scheduledDate === currentMonthDay;
        } else if (sn.type === 'specific_date') {
            return sn.scheduledDate === currentJalaliDate;
        }
        
        return false;
    }).map(sn => ({
        id: `scheduled-${sn.id}-${currentJalaliDate}`,
        title: role === 'student' ? replacePlaceholders(sn.titleTemplate, user as Student) : sn.titleTemplate,
        message: role === 'student' ? replacePlaceholders(sn.messageTemplate, user as Student) : sn.messageTemplate,
        createdAt: `${currentJalaliDate}T00:00`,
        createdBy: sn.createdBy,
        color: sn.color,
        imageUrl: sn.imageUrl,
        tags: sn.tags,
        link: sn.link,
        linkText: sn.linkText,
        isActive: true,
        audience: sn.audience
    } as Notification));

    return [...relevantNotifications, ...synthesizedScheduled].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [notifications, scheduledNotifications, user, role]);

  useEffect(() => {
    if (autoOpenNotifications && myNotifications.length > 0 && !hasAutoOpened) {
      // Small delay to ensure smooth entrance
      const timer = setTimeout(() => {
          setIsNotificationsOpen(true);
          setHasAutoOpened(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [autoOpenNotifications, myNotifications.length, hasAutoOpened]);

  const unreadCount = useMemo(() => {
    if (!lastSeenTimestamp) return myNotifications.length;
    return myNotifications.filter(n => n.createdAt > lastSeenTimestamp).length;
  }, [myNotifications, lastSeenTimestamp]);
  
  const handleBellClick = () => {
    setIsNotificationsOpen(prev => !prev);
    if (!isNotificationsOpen) {
        const now = new Date().toISOString();
        localStorage.setItem(`lastSeenNotificationTimestamp_${user.id}`, now);
        setLastSeenTimestamp(now);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
            setIsNotificationsOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-white shadow-md w-full p-4 flex justify-between items-center sticky top-0 z-20">
        <div className="flex items-center gap-4">
            {settings.schoolLogoUrl && (
                <img src={settings.schoolLogoUrl} alt={settings.schoolName} className="h-12 w-auto object-contain" />
            )}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--primary-500)] rounded-full flex items-center justify-center text-white font-bold text-lg overflow-hidden flex-shrink-0">
                {isStudentWithPic ? (
                    <img src={studentUser.profilePictureUrl} alt={formatFullName(user)} className="w-full h-full object-cover" />
                ) : (
                    user.firstName.charAt(0)
                )}
              </div>
              <div>
                <h1 className="text-lg font-bold text-[var(--text-primary)]">خوش آمدید، {formatFullName(user)}</h1>
                <p className="text-sm text-[var(--text-secondary)]">{settings.schoolName}</p>
              </div>
            </div>
        </div>
        <div className="flex items-center gap-4">
            <div className="relative" ref={notificationsRef}>
                <button
                    onClick={handleBellClick}
                    className="p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary-500)]"
                    aria-label={`شما ${toPersianDigits(unreadCount)} اطلاعیه جدید دارید`}
                >
                    <BellIcon />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                            {toPersianDigits(unreadCount)}
                        </span>
                    )}
                </button>
                {isNotificationsOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        {/* Backdrop */}
                        <div 
                            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
                            onClick={() => setIsNotificationsOpen(false)}
                        />
                        
                        {/* Modal content */}
                        <div className="relative bg-white w-[95%] sm:w-full max-w-xl rounded-[2.5rem] shadow-2xl flex flex-col animate-in fade-in zoom-in duration-300 max-h-[90vh]">
                            <div className="p-6 border-b flex justify-between items-center bg-gray-50/80 backdrop-blur-md rounded-t-[2.5rem] shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-100">
                                        <BellIcon />
                                    </div>
                                    <h3 className="text-2xl font-black text-gray-900">اطلاعیه‌ها</h3>
                                </div>
                                <button 
                                    onClick={() => setIsNotificationsOpen(false)}
                                    className="p-3 hover:bg-gray-200 text-gray-400 hover:text-gray-600 rounded-2xl transition-all"
                                >
                                    <CloseIcon />
                                </button>
                            </div>
                            
                            <div className="overflow-y-auto custom-scrollbar p-6 space-y-6">
                                {myNotifications.length > 0 ? (
                                    <div className="pb-20 space-y-6">
                                        {myNotifications.map(n => (
                                            <div key={n.id} className="p-6 bg-white border-2 border-gray-50 rounded-[2.5rem] shadow-sm hover:shadow-md transition-all relative overflow-hidden group" style={{ borderRight: `10px solid ${n.color || '#E5E7EB'}` }}>
                                                <div className="flex justify-between items-start mb-4">
                                                    <h4 className="font-black text-xl text-gray-900 leading-tight pr-2">{n.title}</h4>
                                                    <span className="text-[10px] font-black text-gray-400 bg-gray-50 px-3 py-1 rounded-full whitespace-nowrap">
                                                        {toPersianDigits(n.createdAt.split('T')[0])}
                                                    </span>
                                                </div>
                                                
                                                {n.imageUrl && (
                                                    <div className="mb-4 rounded-[1.5rem] overflow-hidden border">
                                                        <img src={n.imageUrl} alt={n.title} className="w-full h-auto max-h-64 object-cover" />
                                                    </div>
                                                )}
                                                
                                                <p className="text-gray-600 leading-relaxed mb-6 whitespace-pre-wrap break-words text-sm md:text-base">{n.message}</p>
                                                
                                                <div className="flex flex-col gap-4">
                                                    {n.tags && n.tags.length > 0 && (
                                                        <div className="flex flex-wrap gap-2">
                                                            {n.tags.map((tag, index) => (
                                                                <span key={index} className="px-3 py-1 text-[10px] font-bold rounded-lg text-white shadow-sm" style={{ backgroundColor: tag.color }}>
                                                                    {tag.text}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                    
                                                    {n.link && (
                                                        <div className="pt-2">
                                                            <a href={n.link} target="_blank" rel="noopener noreferrer" 
                                                               className="inline-flex items-center gap-3 px-6 py-3 bg-indigo-600 text-white text-xs font-black rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 w-full sm:w-auto justify-center">
                                                                <span>{n.linkText || 'مشاهده جزئیات'}</span>
                                                                <ArrowRight className="h-4 w-4" />
                                                            </a>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-24 opacity-30">
                                        <div className="p-8 bg-gray-100 rounded-[2rem] mb-6 shadow-inner">
                                            <BellIcon />
                                        </div>
                                        <p className="text-2xl font-black text-gray-400">اطلاعیه‌ای یافت نشد</p>
                                    </div>
                                )}
                            </div>
                            
                            <div className="p-6 bg-gray-50/50 backdrop-blur-md border-t flex justify-center rounded-b-[2.5rem] shrink-0">
                                <button 
                                    onClick={() => setIsNotificationsOpen(false)}
                                    className="px-12 py-4 bg-white border-2 border-gray-200 text-gray-600 font-black rounded-2xl hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all text-sm shadow-sm"
                                >
                                    بستن پنل اطلاعیه‌ها
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <button
            onClick={onBack || logout}
            className={`${onBack ? 'bg-indigo-500 hover:bg-indigo-600' : 'bg-red-500 hover:bg-red-600'} text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300 flex items-center gap-2`}
            >
            {onBack ? <HomeIcon /> : <LogoutIcon />}
            <span className="hidden md:inline">{onBack ? 'بازگشت به پیشخوان' : 'خروج'}</span>
            </button>
        </div>
      </header>
      <main className="flex-grow p-6 md:p-8">
        {children}
      </main>
      <footer className="text-center p-4 bg-white text-gray-500 text-sm border-t">
        © 1403 - کلیه حقوق برای {settings.schoolName} محفوظ است.
      </footer>
    </div>
  );
};

export default Layout;