

import React, { useMemo } from 'react';
import { 
  Users, GraduationCap, BookOpen, Calendar, Wallet, 
  TrendingUp, Activity, CheckCircle, Clock, AlertTriangle, ArrowLeft
} from 'lucide-react';
import type { UpcomingEvent, Student, Teacher, Attendance, Grade, FinancialBill } from '../../../types';
import { toPersianDigits } from '../../common/formatters';

interface DashboardTabProps {
    stats: {
        studentCount: number;
        teacherCount: number;
        classCount: number;
    };
    events?: UpcomingEvent[];
    students?: Student[];
    teachers?: Teacher[];
    attendance?: Attendance[];
    grades?: Grade[];
    finance?: FinancialBill[];
}

const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ReactNode;
    trend?: { value: string; positive: boolean };
    colorClass: string;
}> = ({ title, value, icon, trend, colorClass }) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-xl ${colorClass}`}>
                {icon}
            </div>
            {trend && (
                <div className={`flex items-center text-sm font-medium ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
                    {trend.positive ? '+' : '-'}{toPersianDigits(trend.value)}٪
                    <TrendingUp className={`w-4 h-4 mr-1 ${!trend.positive && 'rotate-180'}`} />
                </div>
            )}
        </div>
        <div>
            <h3 className="text-gray-500 text-sm font-medium mb-1">{title}</h3>
            <p className="text-3xl font-bold text-gray-900">{toPersianDigits(value)}</p>
        </div>
    </div>
);

const DashboardTab: React.FC<DashboardTabProps> = ({ 
    stats, events = [], students = [], teachers = [], attendance = [], grades = [], finance = [] 
}) => {
    
    // Quick financial summary
    const financialSummary = useMemo(() => {
        let total = 0;
        let paid = 0;
        finance.forEach(bill => {
            total += bill.totalAmount;
            paid += bill.amountPaid;
        });
        const outstanding = total - paid;
        const progress = total > 0 ? (paid / total) * 100 : 0;
        return { total, paid, outstanding, progress };
    }, [finance]);

    // Upcoming events sorted
    const nextEvents = useMemo(() => {
        return [...events]
            .sort((a, b) => a.dateTime.localeCompare(b.dateTime))
            .slice(0, 4); // Take next 4 events
    }, [events]);

    const todayDate = new Intl.DateTimeFormat('fa-IR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(new Date());

    return (
        <div className="space-y-8 pb-10">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 bg-gradient-to-r from-[var(--primary-600)] to-[var(--primary-800)] p-8 rounded-3xl text-white shadow-lg overflow-hidden relative">
                {/* Decorative background circle */}
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-white opacity-10 rounded-full blur-2xl pointer-events-none"></div>
                
                <div className="relative z-10">
                    <h1 className="text-3xl font-black mb-2 tracking-tight">پیشخوان مدیریت</h1>
                    <p className="text-[var(--primary-100)] opacity-90 text-lg">
                        امروز {todayDate} است. به سیستم مدیریت یکپارچه خوش آمدید.
                    </p>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    title="کل دانش‌آموزان" 
                    value={stats.studentCount} 
                    icon={<Users className="w-6 h-6 text-blue-600" />} 
                    colorClass="bg-blue-50"
                    trend={{ value: '2.4', positive: true }}
                />
                <StatCard 
                    title="کادر آموزشی" 
                    value={stats.teacherCount} 
                    icon={<GraduationCap className="w-6 h-6 text-indigo-600" />} 
                    colorClass="bg-indigo-50"
                />
                <StatCard 
                    title="کلاس‌های فعال" 
                    value={stats.classCount} 
                    icon={<BookOpen className="w-6 h-6 text-emerald-600" />} 
                    colorClass="bg-emerald-50"
                />
                <StatCard 
                    title="رویدادهای پیش‌رو" 
                    value={events.length} 
                    icon={<Calendar className="w-6 h-6 text-amber-600" />} 
                    colorClass="bg-amber-50"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content Area - Left 2 Columns */}
                <div className="lg:col-span-2 space-y-8">
                    
                    {/* Financial Overview Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-800 flex items-center">
                                <Wallet className="w-5 h-5 mr-0 ml-2 text-[var(--primary-500)]" />
                                وضعیت مالی مدرسه
                            </h2>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
                            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                                <p className="text-gray-500 text-sm mb-1">کل بدهی ثبت شده</p>
                                <p className="text-xl font-bold text-gray-900">{toPersianDigits(financialSummary.total.toLocaleString())} <span className="text-xs text-gray-400 font-normal">تومان</span></p>
                            </div>
                            <div className="p-4 rounded-xl bg-green-50 border border-green-100">
                                <p className="text-green-700 text-sm mb-1">دریافتی کل</p>
                                <p className="text-xl font-bold text-green-700">{toPersianDigits(financialSummary.paid.toLocaleString())} <span className="text-xs opacity-70 font-normal">تومان</span></p>
                            </div>
                            <div className="p-4 rounded-xl bg-red-50 border border-red-100">
                                <p className="text-red-700 text-sm mb-1">مطالبات (باقیمانده)</p>
                                <p className="text-xl font-bold text-red-700">{toPersianDigits(financialSummary.outstanding.toLocaleString())} <span className="text-xs opacity-70 font-normal">تومان</span></p>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mt-4">
                            <div className="flex justify-between text-sm mb-2">
                                <span className="font-medium text-gray-700">درصد وصول مطالبات</span>
                                <span className="font-bold text-[var(--primary-600)]">{toPersianDigits(Math.round(financialSummary.progress))}٪</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                                <div 
                                    className="bg-gradient-to-r from-[var(--primary-500)] to-[var(--primary-400)] h-3 rounded-full transition-all duration-1000 ease-out" 
                                    style={{ width: `${financialSummary.progress}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>

                    {/* Quick System Links / Tools (Instead of generic text) */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: 'ثبت نمره جدید', icon: <Activity className="w-5 h-5 text-purple-600" />, bg: 'bg-purple-50', border: 'border-purple-100' },
                            { label: 'حضور و غیاب', icon: <CheckCircle className="w-5 h-5 text-teal-600" />, bg: 'bg-teal-50', border: 'border-teal-100' },
                            { label: 'گزارش انضباطی', icon: <AlertTriangle className="w-5 h-5 text-orange-600" />, bg: 'bg-orange-50', border: 'border-orange-100' },
                            { label: 'پیام رسانی', icon: <Calendar className="w-5 h-5 text-blue-600" />, bg: 'bg-blue-50', border: 'border-blue-100' },
                        ].map((item, idx) => (
                            <button key={idx} className={`p-4 rounded-2xl border ${item.border} ${item.bg} flex flex-col items-center justify-center gap-3 hover:shadow-md transition-all active:scale-95 group`}>
                                <div className="p-3 bg-white rounded-xl shadow-sm group-hover:scale-110 transition-transform">
                                    {item.icon}
                                </div>
                                <span className="text-sm font-semibold text-gray-700">{item.label}</span>
                            </button>
                        ))}
                    </div>

                </div>

                {/* Right Column - Timeline & Feed */}
                <div className="space-y-8">
                    
                    {/* Events Timeline */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 relative overflow-hidden">
                        <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
                            <Clock className="w-5 h-5 mr-0 ml-2 text-[var(--primary-500)]" />
                            رویدادهای پیش‌رو
                        </h2>
                        
                        <div className="space-y-6 relative before:absolute before:inset-0 before:mr-5 before:translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
                            {nextEvents.length > 0 ? nextEvents.map((evt, idx) => (
                                <div key={evt.id || idx} className="relative flex items-center justify-between md:justify-normal md:even:flex-row-reverse group is-active">
                                    {/* Line marker */}
                                    <div className="flex items-center justify-center w-8 h-8 rounded-full border-4 border-white bg-[var(--primary-100)] text-[var(--primary-600)] shadow shrink-0 md:order-1 md:group-even:-translate-x-1/2 md:group-odd:translate-x-1/2 z-10">
                                        <Calendar className="w-3 h-3" />
                                    </div>
                                    {/* Card */}
                                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-gray-100 bg-gray-50 shadow-sm hover:border-[var(--primary-200)] transition-colors">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-bold text-gray-800 text-sm">{evt.title}</span>
                                        </div>
                                        <div className="text-xs text-gray-500 flex items-center gap-1 mb-2">
                                            <Clock className="w-3 h-3" />
                                            {toPersianDigits(new Date(evt.dateTime).toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }))}
                                        </div>
                                        {evt.location && <p className="text-xs text-gray-600 truncate">{evt.location}</p>}
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-8 text-gray-400 text-sm">
                                    رویدادی برای نمایش وجود ندارد
                                </div>
                            )}
                        </div>
                        
                        {nextEvents.length > 0 && (
                            <button className="mt-6 w-full py-3 rounded-xl border border-gray-200 text-gray-600 font-medium text-sm hover:bg-gray-50 flex items-center justify-center gap-2 transition-colors">
                                مشاهده همه تقویم
                                <ArrowLeft className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardTab;