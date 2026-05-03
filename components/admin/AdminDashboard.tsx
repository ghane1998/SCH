
import React from 'react';
import { useState, useMemo } from 'react';
import { useSettings, useData } from '../../App';
import type { Admin } from '../../types';
import Layout from '../common/Layout';
import Card from '../common/Card';

// Import Tab Components
import DashboardTab from './tabs/DashboardTab';
import StudentsTab from './tabs/StudentsTab';
import TeachersTab from './tabs/TeachersTab';
import ClassesTab from './tabs/ClassesTab';
import DisciplineTab from './tabs/DisciplineTab';
import GradesTab from './tabs/GradesTab';
import AttendanceTab from './tabs/AttendanceTab';
import ExamsTab from './tabs/ExamsTab';
import SettingsTab from './tabs/SettingsTab';
import NaseebTab from './tabs/NaseebTab';
import PTATab from './tabs/PTATab';
import FinanceTab from './tabs/FinanceTab';
import EventsTab from './tabs/EventsTab';
import SchoolGovernmentTab from './tabs/SchoolGovernmentTab';
import AnecdotalTab from './tabs/AnecdotalTab';
import ParentMeetingsTab from './tabs/ParentMeetingsTab';
import NotificationsTab from './tabs/NotificationsTab';
import AssetsTab from './tabs/AssetsTab';


interface AdminDashboardProps {
    admin: Admin;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ admin }) => {
    const data = useData();
    const { settings, setSettings } = useSettings();
    const [activeTab, setActiveTab] = useState('dashboard');
    
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

    const SchoolIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
    const StudentsIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.653-.122-1.28-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.653.122-1.28.356-1.857m0 0a5.002 5.002 0 019.288 0M12 14a5 5 0 100-10 5 5 0 000 10z" /></svg>;
    const TeachersIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197m0 0A5.995 5.995 0 0012 12a5.995 5.995 0 00-3 5.197" /></svg>;
    const ClassesIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>;
    const DisciplineIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
    const GradeIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
    const AttendanceIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
    const ExamIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>;
    const SettingsIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066 2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
    const NaseebIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>;
    const PTAIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.653-.122-1.28-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.653.122-1.28.356-1.857m0 0a5.002 5.002 0 019.288 0M12 14a5 5 0 100-10 5 5 0 000 10z" /></svg>;
    const FinanceIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>;
    const EventsIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11.5l1.09 2.22 2.45.36-1.78 1.73.42 2.44L12 16.5l-2.18 1.75.42-2.44-1.78-1.73 2.45-.36L12 11.5z" /></svg>;
    const GovernmentIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>;
    const AnecdotalIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
    const ParentMeetingIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>;
    const NotificationsIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>;
    const AssetsIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7h1a2 2 0 012 2v5a2 2 0 01-2 2h-1m-6 0H7a2 2 0 01-2-2V9a2 2 0 012-2h1.586a1 1 0 01.707.293l1.414 1.414c.391.391.391 1.023 0 1.414l-1.414 1.414A1 1 0 019.586 16H9m6-9v.01" /></svg>;


    const tabs = [
        { id: 'dashboard', label: 'پیشخوان', icon: <SchoolIcon className="h-5 w-5"/> },
        { id: 'students', label: 'دانش آموزان', icon: <StudentsIcon className="h-5 w-5"/> },
        { id: 'teachers', label: 'معلمان', icon: <TeachersIcon className="h-5 w-5"/> },
        { id: 'classes', label: 'کلاس ها', icon: <ClassesIcon className="h-5 w-5"/> },
        { id: 'finance', label: 'مدیریت مالی', icon: <FinanceIcon className="h-5 w-5"/> },
        { id: 'naseeb', label: 'نصیب', icon: <NaseebIcon className="h-5 w-5"/> },
        { id: 'discipline', label: 'انضباطی', icon: <DisciplineIcon className="h-5 w-5"/> },
        { id: 'grades', label: 'نمرات', icon: <GradeIcon className="h-5 w-5"/> },
        { id: 'attendance', label: 'حضور و غیاب', icon: <AttendanceIcon className="h-5 w-5"/> },
        { id: 'exams', label: 'آزمون ها', icon: <ExamIcon className="h-5 w-5" /> },
        { id: 'events', label: 'رویدادها', icon: <EventsIcon className="h-5 w-5" /> },
        { id: 'notifications', label: 'اطلاع رسانی', icon: <NotificationsIcon className="h-5 w-5" /> },
        { id: 'assets', label: 'امانات', icon: <AssetsIcon className="h-5 w-5"/> },
        { id: 'schoolGovernment', label: 'دولت مدرسه', icon: <GovernmentIcon className="h-5 w-5" /> },
        { id: 'anecdotal', label: 'واقعه نگاری', icon: <AnecdotalIcon className="h-5 w-5" /> },
        { id: 'parentMeetings', label: 'جلسات با اولیا', icon: <ParentMeetingIcon className="h-5 w-5" /> },
        { id: 'pta', label: 'انجمن اولیا', icon: <PTAIcon className="h-5 w-5"/> },
        { id: 'settings', label: 'تنظیمات', icon: <SettingsIcon className="h-5 w-5"/> },
    ];
    
    const renderActiveTab = () => {
        switch (activeTab) {
            case 'dashboard':
                return <DashboardTab 
                    stats={{ studentCount: data.students.length, teacherCount: data.teachers.length, classCount: data.classes.length }} 
                    events={data.events}
                    students={data.students}
                    teachers={data.teachers}
                    attendance={data.attendance}
                    grades={data.grades}
                    finance={data.financialBills}
                />;
            case 'students':
                return <StudentsTab 
                    students={data.students} 
                    classes={data.classes} 
                    saveStudent={data.saveStudent} 
                    importStudents={data.importStudents} 
                    deleteStudent={data.deleteStudent}
                    grades={data.grades}
                    attendance={data.attendance}
                    disciplineIncidents={data.disciplineIncidents}
                    teachers={data.teachers}
                    ptaMeetings={data.ptaMeetings}
                    ptaAttendance={data.ptaAttendance}
                    financialBills={data.financialBills}
                    payments={data.payments}
                    events={data.events}
                    responsibilities={data.responsibilities}
                    responsibilityAssignments={data.responsibilityAssignments}
                    anecdotalRecords={data.anecdotalRecords}
                    parentMeetings={data.parentMeetings}
                    badges={data.badges}
                    awardedBadges={data.awardedBadges}
                    admins={data.admins}
                />;
            case 'teachers':
                return <TeachersTab teachers={data.teachers} classes={data.classes} saveTeacher={data.saveTeacher} deleteTeacher={data.deleteTeacher} importTeachers={data.importTeachers} />;
            case 'classes':
                return <ClassesTab classes={data.classes} teachers={data.teachers} students={data.students} saveClass={data.saveClass} deleteClass={data.deleteClass} importClasses={data.importClasses} />;
            case 'naseeb':
                return <NaseebTab admin={admin} />;
            case 'discipline':
                return <DisciplineTab incidents={data.disciplineIncidents} students={data.students} teachers={data.teachers} classes={data.classes} admins={data.admins} settings={settings} years={academicYears} saveDisciplinaryIncident={data.saveDisciplinaryIncident} deleteDisciplinaryIncident={data.deleteDisciplinaryIncident} saveGroupDisciplinaryIncidents={data.saveGroupDisciplinaryIncidents} />;
            case 'grades':
                return <GradesTab grades={data.grades} students={data.students} classes={data.classes} teachers={data.teachers} admins={data.admins} years={academicYears} saveGrade={data.saveGrade} deleteGrade={data.deleteGrade} saveGroupGrades={data.saveGroupGrades} settings={settings} />;
            case 'attendance':
                return <AttendanceTab attendance={data.attendance} students={data.students} teachers={data.teachers} classes={data.classes} admins={data.admins} years={academicYears} saveAttendance={data.saveAttendance} deleteAttendance={data.deleteAttendance} saveGroupAttendance={data.saveGroupAttendance} />;
            case 'exams':
                return <ExamsTab exams={data.exams} classes={data.classes} admins={data.admins} adminId={admin.id} years={academicYears} saveExam={data.saveExam} deleteExam={data.deleteExam} />;
            case 'events':
                return <EventsTab 
                    events={data.events}
                    students={data.students}
                    teachers={data.teachers}
                    classes={data.classes}
                    adminId={admin.id}
                    saveEvent={data.saveEvent}
                    deleteEvent={data.deleteEvent}
                    years={academicYears}
                />;
            case 'notifications':
                return <NotificationsTab admin={admin} years={academicYears} />;
            case 'assets':
                return <AssetsTab admin={admin} />;
            case 'schoolGovernment':
                return <SchoolGovernmentTab admin={admin} years={academicYears} />;
            case 'anecdotal':
                return <AnecdotalTab admin={admin} years={academicYears} />;
            case 'parentMeetings':
                return <ParentMeetingsTab admin={admin} years={academicYears} />;
            case 'pta':
                return <PTATab admin={admin} years={academicYears} />;
            case 'finance':
                return <FinanceTab admin={admin} years={academicYears} />;
            case 'settings':
                return <SettingsTab settings={settings} setSettings={setSettings} />;
            default:
                return null;
        }
    };
    
    return (
        <Layout user={admin}>
            <div className="flex flex-col lg:flex-row gap-8">
                <aside className="lg:w-1/5">
                    <Card title="منوی مدیریت" className="sticky top-24">
                        <nav>
                            <ul className="space-y-2">
                                {tabs.map(tab => (
                                    <li key={tab.id}>
                                        <button 
                                            onClick={() => setActiveTab(tab.id)} 
                                            className={`w-full text-right px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-3 ${activeTab === tab.id ? 'bg-[var(--primary-500)] text-white shadow-md' : 'hover:bg-[var(--primary-100)] hover:text-[var(--primary-700)]'}`}
                                        >
                                            {tab.icon}
                                            <span className="font-semibold">{tab.label}</span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </nav>
                    </Card>
                </aside>
                <main className="flex-1">
                    {renderActiveTab()}
                </main>
            </div>
        </Layout>
    );
};

export default AdminDashboard;