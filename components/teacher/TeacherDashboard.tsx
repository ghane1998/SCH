
import React, { useState, useMemo, useEffect } from 'react';
import { 
    ClipboardCheck, GraduationCap, Gavel, FileText, UserCheck, 
    MessageSquare, Calendar, Star, BookOpen, Phone, Trophy, 
    LayoutDashboard, ArrowRight, Heart, Users, LogOut
} from 'lucide-react';
import type { Teacher, SchoolClass, ModuleId } from '../../types';
import { useData, useSettings } from '../../App';
import Layout from '../common/Layout';
import Card from '../common/Card';
import ClassManagementTab from './tabs/ClassManagementTab';
import ExamsTab from './tabs/ExamsTab';
import AttendanceTab from './tabs/AttendanceTab';
import GradesTab from './tabs/GradesTab';
import DisciplineTab from './tabs/DisciplineTab';
import NaseebTab from './tabs/NaseebTab';
import PTATab from './tabs/PTATab';
import UpcomingEventsSection from '../common/UpcomingEventsSection';
import ClassAssistantshipTab from './tabs/ClassAssistantshipTab';
import AnecdotalTab from './tabs/AnecdotalTab';
import ParentMeetingsTab from './tabs/ParentMeetingsTab';

interface TeacherDashboardProps {
    teacher: Teacher;
}

const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ teacher }) => {
    const { classes, students } = useData();
    const { settings } = useSettings();
    const { moduleSettings } = settings;

    const myClasses = useMemo(() => classes.filter(c => c.teacherId === teacher.id || teacher.classIds?.includes(c.id)).sort((a,b) => a.name.localeCompare(b.name, 'fa')), [classes, teacher.id, teacher.classIds]);
    const [selectedClassId, setSelectedClassId] = useState<string | undefined>(myClasses[0]?.id);
    const [showGrid, setShowGrid] = useState(true);

    useEffect(() => {
        if (!selectedClassId || !myClasses.some(c => c.id === selectedClassId)) {
            setSelectedClassId(myClasses[0]?.id);
        }
    }, [myClasses, selectedClassId]);

    const selectedClass = useMemo(() => myClasses.find(c => c.id === selectedClassId), [myClasses, selectedClassId]);
    const studentsInClass = useMemo(() => students.filter(s => s.classId === selectedClassId), [students, selectedClassId]);

    const teacherTabs: (ModuleId | 'classManagement')[] = [
        'classManagement',
        'attendance',
        'grades',
        'discipline',
        'exams',
        'naseeb',
        'pta',
        'events',
        'responsibilities',
        'anecdotal',
        'parentMeetings',
    ];

    const [activeTab, setActiveTab] = useState<string>('classManagement');
    
    useEffect(() => {
        // Reset to default tab if the current one becomes unavailable for the selected class
        if (!selectedClass) {
            setActiveTab('classManagement');
        }
    }, [selectedClass]);

    const allTabs: Record<string, { label: string, icon: React.ReactNode, component: React.ReactNode, color?: string }> = {
        classManagement: { label: 'مدیریت کلاس', icon: <LayoutDashboard />, color: 'bg-indigo-50 text-indigo-600', component: <ClassManagementTab teacher={teacher} selectedClass={selectedClass} studentsInClass={studentsInClass} /> },
        attendance: { label: moduleSettings.attendance.label, icon: <UserCheck />, color: 'bg-emerald-50 text-emerald-600', component: <AttendanceTab teacher={teacher} selectedClass={selectedClass!} studentsInClass={studentsInClass} /> },
        grades: { label: moduleSettings.grades.label, icon: <GraduationCap />, color: 'bg-blue-50 text-blue-600', component: <GradesTab teacher={teacher} selectedClass={selectedClass!} studentsInClass={studentsInClass} /> },
        discipline: { label: moduleSettings.discipline.label, icon: <Gavel />, color: 'bg-orange-50 text-orange-600', component: <DisciplineTab teacher={teacher} selectedClass={selectedClass!} studentsInClass={studentsInClass} /> },
        exams: { label: moduleSettings.exams.label, icon: <FileText />, color: 'bg-purple-50 text-purple-600', component: <ExamsTab teacher={teacher} selectedClassId={selectedClassId!} myClasses={myClasses} /> },
        naseeb: { label: moduleSettings.naseeb.label, icon: <Heart />, color: 'bg-rose-50 text-rose-600', component: <NaseebTab teacher={teacher} selectedClass={selectedClass!} studentsInClass={studentsInClass} /> },
        pta: { label: moduleSettings.pta.label, icon: <Users />, color: 'bg-cyan-50 text-cyan-600', component: <PTATab teacher={teacher} selectedClass={selectedClass!} studentsInClass={studentsInClass} /> },
        events: { label: moduleSettings.events.label, icon: <Calendar />, color: 'bg-amber-50 text-amber-600', component: <UpcomingEventsSection user={teacher} role="teacher" /> },
        responsibilities: { label: 'کلاسیاری', icon: <Star />, color: 'bg-yellow-50 text-yellow-600', component: <ClassAssistantshipTab teacher={teacher} selectedClass={selectedClass!} studentsInClass={studentsInClass} /> },
        anecdotal: { label: moduleSettings.anecdotal.label, icon: <BookOpen />, color: 'bg-green-50 text-green-600', component: <AnecdotalTab teacher={teacher} selectedClass={selectedClass!} studentsInClass={studentsInClass} /> },
        parentMeetings: { label: moduleSettings.parentMeetings.label, icon: <Phone />, color: 'bg-slate-50 text-slate-600', component: <ParentMeetingsTab teacher={teacher} selectedClass={selectedClass!} studentsInClass={studentsInClass} /> },
    };

    const visibleTabs = teacherTabs.filter(tabId => {
        if (['finance', 'notifications', 'assets'].includes(tabId)) return false;
        if (tabId === 'classManagement') return true;
        if (tabId === 'responsibilities') return moduleSettings.responsibilities.teacherVisible;
        return moduleSettings[tabId as ModuleId]?.teacherVisible ?? false;
    });

    const renderActiveTab = () => {
        if (!selectedClass && activeTab !== 'events') {
            return (
                <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl shadow-sm border-2 border-dashed border-gray-200">
                    <p className="text-xl font-bold text-gray-400 mb-4">لطفاً برای مشاهده این بخش، ابتدا یک کلاس انتخاب کنید.</p>
                    <LayoutDashboard className="h-16 w-16 text-gray-200" />
                </div>
            );
        }
        return allTabs[activeTab as keyof typeof allTabs]?.component ?? null;
    };

    if (showGrid) {
        const totalStudents = myClasses.reduce((acc, curr) => acc + students.filter(s => s.classId === curr.id).length, 0);
        const todayDate = new Intl.DateTimeFormat('fa-IR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(new Date());

        return (
            <Layout user={teacher} autoOpenNotifications={true}>
               <div className="max-w-7xl mx-auto py-8 px-4 space-y-8 animate-fade-in pb-10">
                    {/* Header Section */}
                    <div className="flex flex-col justify-between overflow-hidden relative bg-gradient-to-r from-[var(--primary-600)] to-[var(--primary-800)] p-8 rounded-3xl text-white shadow-lg shrink-0">
                        {/* Decorative background circle */}
                        <div className="absolute -top-24 -right-24 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl pointer-events-none"></div>
                        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-white opacity-5 rounded-full blur-2xl pointer-events-none"></div>
                        
                        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <h1 className="text-3xl font-black mb-2 tracking-tight">سلام، {teacher.firstName} عزیز! 👋</h1>
                                <p className="text-[var(--primary-100)] opacity-90 text-lg">
                                    امروز {todayDate} است. روز کاری خوبی داشته باشید.
                                </p>
                            </div>
                            {teacher.profilePictureUrl && (
                                <div className="w-20 h-20 rounded-full border-4 border-white/20 overflow-hidden shadow-xl shrink-0 hidden sm:block">
                                    <img src={teacher.profilePictureUrl} alt={teacher.name} className="w-full h-full object-cover" />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Column */}
                        <div className="lg:col-span-2 space-y-8">
                            
                            {/* Quick Stats Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                                    <div className="p-4 bg-indigo-50 text-indigo-600 rounded-xl">
                                        <BookOpen className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 font-medium">کلاس‌های من</p>
                                        <p className="text-2xl font-bold text-gray-900">{myClasses.length}</p>
                                    </div>
                                </div>
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                                    <div className="p-4 bg-emerald-50 text-emerald-600 rounded-xl">
                                        <Users className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 font-medium">دانش‌آموزان من</p>
                                        <p className="text-2xl font-bold text-gray-900">{totalStudents}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Navigation Tiles */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <h2 className="text-xl font-bold text-gray-800 flex items-center mb-6">
                                    <span className="w-2 h-6 bg-[var(--primary-500)] rounded-full ml-3"></span>
                                    بخش‌های مدیریتی
                                </h2>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {visibleTabs.map(tabId => {
                                        let borderColor = "border-gray-100 hover:border-gray-300";
                                        let bgColor = "hover:bg-gray-50";
                                        
                                        if (allTabs[tabId].color) {
                                            const colorClasses = allTabs[tabId].color.split(' ');
                                            const bgClass = colorClasses.find(c => c.startsWith('bg-'));
                                            if (bgClass) {
                                                const baseColorName = bgClass.replace('bg-', '').replace('-50', ''); // extract 'indigo', 'blue'
                                                borderColor = `border-${baseColorName}-100 hover:border-${baseColorName}-300`;
                                                bgColor = `hover:bg-${baseColorName}-50`;
                                            }
                                        }

                                        return (
                                        <button
                                            key={tabId}
                                            onClick={() => {
                                                setActiveTab(tabId);
                                                setShowGrid(false);
                                            }}
                                            className={`group bg-white p-6 rounded-2xl border ${borderColor} transition-all duration-300 flex flex-col items-center justify-center gap-4 relative overflow-hidden`}
                                        >
                                            <div className={`p-4 rounded-xl shadow-sm group-hover:scale-110 transition-transform duration-300 z-10 w-16 h-16 flex items-center justify-center ${allTabs[tabId].color || 'bg-indigo-50 text-indigo-600'}`}>
                                                {allTabs[tabId].icon && React.cloneElement(allTabs[tabId].icon as React.ReactElement, { size: 32 })}
                                            </div>
                                            <span className="font-bold z-10 text-center text-sm text-gray-800">{allTabs[tabId].label}</span>
                                        </button>
                                    )})}
                                </div>
                            </div>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-8">
                            <UpcomingEventsSection user={teacher} role="teacher" />
                        </div>
                    </div>
                </div>
            </Layout>
        );
    }
    
    return (
        <Layout user={teacher} onBack={() => setShowGrid(true)} autoOpenNotifications={true}>
            <div className="max-w-7xl mx-auto py-8 px-4">
                <main className="w-full animate-fade-in">
                    {myClasses.length > 0 && activeTab !== 'events' && (
                        <div className="mb-8 bg-white p-6 rounded-[2rem] shadow-xl border border-indigo-50 flex flex-col md:flex-row md:items-center justify-between gap-6 overflow-hidden relative">
                            {/* Decorative background element */}
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-50 rounded-full opacity-30" />
                            
                            <div className="flex items-center gap-6 z-10">
                                <div className="p-5 bg-indigo-600 text-white rounded-[1.5rem] shadow-lg shadow-indigo-200 ring-4 ring-indigo-50">
                                    <LayoutDashboard size={32} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-indigo-400 text-sm font-black uppercase tracking-wider mb-1">بخش: {allTabs[activeTab].label}</span>
                                    <h3 className="text-3xl font-black text-gray-900">کلاس {selectedClass?.name || '---'}</h3>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-4 bg-gray-50/80 backdrop-blur-sm p-3 rounded-[1.5rem] border border-gray-100 z-10">
                                <span className="text-gray-500 font-bold ml-2">تغییر کلاس:</span>
                                <select
                                    value={selectedClassId || ''}
                                    onChange={(e) => setSelectedClassId(e.target.value)}
                                    className="p-3 bg-white border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all font-black text-gray-800 min-w-[220px] shadow-sm cursor-pointer outline-none"
                                >
                                    {myClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                        </div>
                    )}
                    
                    <div className="bg-white rounded-[3rem] p-6 md:p-10 shadow-2xl shadow-gray-200/50 border border-gray-50 min-h-[600px] transition-all duration-500">
                        {renderActiveTab()}
                    </div>
                </main>
            </div>
        </Layout>
    );
};

export default TeacherDashboard;
