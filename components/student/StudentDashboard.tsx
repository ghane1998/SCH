



import React, { useMemo } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { 
    ArrowRight, LogOut, Heart, GraduationCap, ClipboardCheck, 
    Gavel, Star, Calendar, FileText, Info
} from 'lucide-react';
import type { Student, ModuleId } from '../../types';
import Layout from '../common/Layout';
import DashboardWidgets from './sections/DashboardWidgets';
import GradesSection from './sections/GradesSection';
import DisciplineSection from './sections/DisciplineSection';
import NaseebChartCard from './sections/NaseebChartCard';
import UpcomingExamsCard from './sections/UpcomingExamsCard';
import AttendanceSection from './sections/AttendanceSection';
import { useSettings } from '../../App';
import UpcomingEventsSection from '../common/UpcomingEventsSection';
import ResponsibilitiesSection from './sections/ResponsibilitiesSection';
import { formatJalaliDate, toPersianDigits } from '../../common/formatters';

const STUDENT_MODULE_CONFIG: Record<string, { label: string, icon: React.ReactNode, color: string, border: string }> = {
    grades: { label: 'نمرات و کارنامه', icon: <GraduationCap size={32} className="text-blue-600" />, color: 'bg-blue-50/50 hover:bg-blue-50 text-blue-800', border: 'border-blue-100 hover:border-blue-300' },
    attendance: { label: 'حضور و غیاب', icon: <ClipboardCheck size={32} className="text-emerald-600" />, color: 'bg-emerald-50/50 hover:bg-emerald-50 text-emerald-800', border: 'border-emerald-100 hover:border-emerald-300' },
    discipline: { label: 'انضباطی', icon: <Gavel size={32} className="text-orange-600" />, color: 'bg-orange-50/50 hover:bg-orange-50 text-orange-800', border: 'border-orange-100 hover:border-orange-300' },
    exams: { label: 'امتحانات', icon: <FileText size={32} className="text-purple-600" />, color: 'bg-purple-50/50 hover:bg-purple-50 text-purple-800', border: 'border-purple-100 hover:border-purple-300' },
    naseeb: { label: 'طرح نصیب', icon: <Heart size={32} className="text-rose-600" />, color: 'bg-rose-50/50 hover:bg-rose-50 text-rose-800', border: 'border-rose-100 hover:border-rose-300' },
    responsibilities: { label: 'کلاسیاری', icon: <Star size={32} className="text-yellow-600" />, color: 'bg-yellow-50/50 hover:bg-yellow-50 text-yellow-800', border: 'border-yellow-100 hover:border-yellow-300' },
    events: { label: 'رویدادها', icon: <Calendar size={32} className="text-amber-600" />, color: 'bg-amber-50/50 hover:bg-amber-50 text-amber-800', border: 'border-amber-100 hover:border-amber-300' },
};

const NavigationTile: React.FC<{ path: string; label: string; icon: React.ReactNode; color: string; border: string }> = ({ path, label, icon, color, border }) => (
    <Link to={path} className={`group ${color} p-6 rounded-2xl border ${border} transition-all duration-300 flex flex-col items-center justify-center gap-4 relative overflow-hidden`}>
        <div className="bg-white p-4 rounded-xl shadow-sm group-hover:scale-110 transition-transform duration-300 z-10 w-16 h-16 flex items-center justify-center">
            {icon}
        </div>
        <span className="font-bold z-10 text-center text-sm">{label}</span>
    </Link>
);


const DashboardHome: React.FC<{ student: Student }> = ({ student }) => {
    const { settings } = useSettings();
    const { moduleSettings } = settings;

    const navItems = (Object.keys(moduleSettings) as ModuleId[])
        .filter(key => moduleSettings[key].studentVisible && !['exams', 'events', 'notifications', 'finance', 'assets'].includes(key))
        .map(key => ({
            path: key,
            ...(STUDENT_MODULE_CONFIG[key] || { label: moduleSettings[key].label, icon: <Info size={32} className="text-gray-600" />, color: 'bg-gray-50/50 text-gray-800 hover:bg-gray-50', border: 'border-gray-200' })
        }));

    const todayDate = new Intl.DateTimeFormat('fa-IR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(new Date());

    return (
        <div className="max-w-7xl mx-auto py-8 px-4 space-y-8 animate-fade-in pb-10">
            {/* Header Section */}
            <div className="flex flex-col justify-between overflow-hidden relative bg-gradient-to-r from-[var(--primary-600)] to-[var(--primary-800)] p-8 rounded-3xl text-white shadow-lg shrink-0">
                {/* Decorative background circle */}
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-white opacity-5 rounded-full blur-2xl pointer-events-none"></div>
                
                <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-black mb-2 tracking-tight">سلام، {student.firstName} عزیز! 👋</h1>
                        <p className="text-[var(--primary-100)] opacity-90 text-lg">
                            امروز {todayDate} است. وضعیت تحصیلی‌ات را بررسی کن.
                        </p>
                    </div>
                    {student.profilePictureUrl && (
                        <div className="w-20 h-20 rounded-full border-4 border-white/20 overflow-hidden shadow-xl shrink-0 hidden sm:block">
                            <img src={student.profilePictureUrl} alt={student.name} className="w-full h-full object-cover" />
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left Column (Stats & Tiles) */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Quick Stats Grid */}
                    <DashboardWidgets student={student} />

                    {/* Navigation Tiles */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-xl font-bold text-gray-800 flex items-center mb-6">
                            <span className="w-2 h-6 bg-[var(--primary-500)] rounded-full ml-3"></span>
                            بخش‌های تحصیلی
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {navItems.map(item => <NavigationTile key={item.path} {...item} />)}
                        </div>
                    </div>
                </div>

                {/* Right Column (Exams & Events) */}
                <div className="space-y-8">
                    <UpcomingExamsCard student={student} />
                    <UpcomingEventsSection user={student} role="student" />
                </div>
            </div>
        </div>
    );
};

const SectionWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <div className="max-w-7xl mx-auto py-8 px-4 animate-fade-in">
            <div className="bg-white rounded-[3rem] p-6 md:p-10 shadow-2xl shadow-gray-200/50 border border-gray-50 min-h-[600px] transition-all duration-500">
                {children}
            </div>
        </div>
    );
};


interface StudentDashboardProps {
  student: Student;
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({ student }) => {
  const navigate = useNavigate();
  const location = useMemo(() => window.location.hash.replace('#/', ''), [window.location.hash]);
  const isHome = location === '' || location === '/';

  return (
    <Layout user={student} onBack={!isHome ? () => navigate('/') : undefined} autoOpenNotifications={true}>
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
      `}</style>
      <Routes>
        <Route index element={<DashboardHome student={student} />} />
        <Route path="grades" element={<SectionWrapper><GradesSection student={student} /></SectionWrapper>} />
        <Route path="attendance" element={<SectionWrapper><AttendanceSection student={student} /></SectionWrapper>} />
        <Route path="discipline" element={<SectionWrapper><DisciplineSection student={student} /></SectionWrapper>} />
        <Route path="naseeb" element={<SectionWrapper><NaseebChartCard student={student} /></SectionWrapper>} />
        <Route path="responsibilities" element={<SectionWrapper><ResponsibilitiesSection student={student} /></SectionWrapper>} />
      </Routes>
    </Layout>
  );
};

export default StudentDashboard;