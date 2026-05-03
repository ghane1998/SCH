import React, { useMemo, useState } from 'react';
import type { Student, Grade, DescriptiveGrade, Attendance, DisciplinaryIncident, Teacher, SchoolClass, PTAMeeting, PTAAttendance, FinancialBill, Payment, UpcomingEvent, Responsibility, ResponsibilityAssignment, AnecdotalRecord, ParentMeeting, Badge, AwardedBadge, Admin } from '../../types';
import { useSettings } from '../../App';
import { toPersianDigits, formatFullName } from './formatters';

const downloadCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
        alert('دیتایی برای گزارش گیری وجود ندارد.');
        return;
    }
    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(header => JSON.stringify(row[header])).join(','))
    ].join('\n');

    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' }); // BOM for Excel
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};


interface StudentProfileModalProps {
    student: Student;
    viewerRole: 'admin' | 'teacher';
    grades: Grade[];
    attendance: Attendance[];
    disciplineIncidents: DisciplinaryIncident[];
    teachers: Teacher[];
    admins: Admin[];
    classes: SchoolClass[];
    onClose: () => void;
    // New props
    ptaMeetings: PTAMeeting[];
    ptaAttendance: PTAAttendance[];
    financialBills: FinancialBill[];
    payments: Payment[];
    events: UpcomingEvent[];
    responsibilities: Responsibility[];
    responsibilityAssignments: ResponsibilityAssignment[];
    anecdotalRecords: AnecdotalRecord[];
    parentMeetings: ParentMeeting[];
    badges: Badge[];
    awardedBadges: AwardedBadge[];
}
const StudentProfileModal: React.FC<StudentProfileModalProps> = (props) => {
    const { 
        student, viewerRole, grades, attendance, disciplineIncidents, teachers, admins, classes, onClose,
        ptaMeetings, ptaAttendance, financialBills, payments, events,
        responsibilities, responsibilityAssignments, anecdotalRecords,
        parentMeetings, badges, awardedBadges
    } = props;
    
    const { settings } = useSettings();
    const [activeTab, setActiveTab] = useState('info');
    const allRecorders = useMemo(() => [...teachers, ...admins], [teachers, admins]);

    const InfoField: React.FC<{ label: string; value?: string | number | null; className?: string }> = ({ label, value, className }) => (
        <div className={className}>
            <p className="text-xs text-gray-500">{label}</p>
            <p className="text-sm font-semibold text-gray-800">{value ? toPersianDigits(value) : '-'}</p>
        </div>
    );

    const getScoreStyle = (score: number | DescriptiveGrade): React.CSSProperties => {
        if (typeof score === 'number') {
            return { color: score >= settings.passingGrade ? '#16a34a' : '#dc2626' }; // green-600, red-600
        }
        const colorSetting = settings.descriptiveGradeColors.find(s => s.grade === score);
        if (colorSetting) {
            return { 
                backgroundColor: colorSetting.color, 
                color: 'white', 
                padding: '2px 8px', 
                borderRadius: '9999px',
                fontSize: '0.75rem',
                display: 'inline-block'
            };
        }
        return {};
    };

    const tabs = useMemo(() => {
        const allTabs = [
            { id: 'info', label: 'اطلاعات کامل' },
            { id: 'grades', label: 'نمرات' },
            { id: 'attendance', label: 'حضور و غیاب' },
            { id: 'discipline', label: 'انضباطی' },
            { id: 'naseeb', label: 'نصیب و افتخارات' },
            { id: 'finance', label: 'مالی' },
            { id: 'activities', label: 'فعالیت‌ها' },
            { id: 'records', label: 'سوابق' },
        ];

        if (viewerRole === 'teacher') {
            return allTabs.filter(tab => tab.id !== 'finance');
        }
        return allTabs;
    }, [viewerRole]);
    
    const handleDownload = (type: 'grades' | 'attendance' | 'discipline') => {
        let dataForCsv: any[] = [];
        let filename = `${type}_${student.nationalId}.csv`;

        switch(type) {
            case 'grades':
                dataForCsv = grades.filter(g => g.studentId === student.id).map(g => ({
                    'درس': g.subject,
                    'نمره': g.score,
                    'تاریخ': g.date,
                    'ثبت توسط': allRecorders.find(r => r.id === g.teacherId) ? formatFullName(allRecorders.find(r => r.id === g.teacherId)) : 'سیستم',
                }));
                break;
            case 'attendance':
                 dataForCsv = attendance.filter(a => a.studentId === student.id).map(a => ({
                    'تاریخ': a.date,
                    'وضعیت': a.status,
                    'دقایق تاخیر': a.minutesLate || '',
                    'ساعت خروج': a.departureTime || '',
                    'اطلاع رسانی شده': a.isNotified ? 'بله' : 'خیر',
                    'گواهی پزشکی': a.hasDoctorsNote ? 'بله' : 'خیر',
                    'ثبت توسط': allRecorders.find(r => r.id === a.recordedBy) ? formatFullName(allRecorders.find(r => r.id === a.recordedBy)) : 'سیستم',
                }));
                break;
            case 'discipline':
                 dataForCsv = disciplineIncidents.filter(d => d.studentId === student.id).map(d => ({
                    'تاریخ': d.date,
                    'دسته بندی': d.category,
                    'شرح': d.description,
                    'اقدام انجام شده': d.actionTaken,
                    'گزارش توسط': allRecorders.find(r => r.id === d.reportedBy) ? formatFullName(allRecorders.find(r => r.id === d.reportedBy)) : 'سیستم',
                }));
                break;
        }
        downloadCSV(dataForCsv, filename);
    };

    const renderActiveTab = () => {
        // Existing tabs
        switch(activeTab) {
            case 'info': return (
                <div className="space-y-6 p-1">
                    <div className="border-b pb-4">
                        <h3 className="font-bold text-lg mb-2">اطلاعات دانش آموز</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                           <InfoField label="نام و نام خانوادگی" value={formatFullName(student)} className="col-span-2" />
                           <InfoField label="کلاس" value={student.className} />
                           <InfoField label="کد ملی" value={student.nationalId} />
                           <InfoField label="تاریخ تولد" value={student.dateOfBirth} />
                           <InfoField label="محل تولد" value={student.placeOfBirth} />
                           <InfoField label="محل صدور" value={student.placeOfIssue} />
                           <InfoField label="ملیت" value={student.nationality} />
                           <InfoField label="سریال شناسنامه" value={student.birthCert?.serial} />
                           <InfoField label="سری شناسنامه" value={student.birthCert?.series} />
                           <InfoField label="ردیف شناسنامه" value={student.birthCert?.row} />
                        </div>
                    </div>
                    <div className="border-b pb-4">
                        <h3 className="font-bold text-lg mb-2">اطلاعات خانواده</h3>
                         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <InfoField label="نام پدر" value={student.family?.father?.fullName} className="col-span-2" />
                            <InfoField label="کد ملی پدر" value={student.family?.father?.nationalId} />
                            <InfoField label="شغل پدر" value={student.family?.father?.occupation} />
                            <InfoField label="نام مادر" value={student.family?.mother?.fullName} className="col-span-2" />
                            <InfoField label="کد ملی مادر" value={student.family?.mother?.nationalId} />
                            <InfoField label="شغل مادر" value={student.family?.mother?.occupation} />
                        </div>
                    </div>
                    <div className="border-b pb-4">
                        <h3 className="font-bold text-lg mb-2">اطلاعات تماس</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-start">
                            <div>
                                <p className="text-xs text-gray-500">تلفن پدر</p>
                                <div className="flex items-center gap-2">
                                    <p className="text-sm font-semibold text-gray-800">{student.contact?.fatherPhone ? toPersianDigits(student.contact.fatherPhone) : '-'}</p>
                                    {student.contact?.fatherPhone && (
                                        <a href={`tel:${student.contact.fatherPhone}`} className="px-2 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-xs transition-colors">تماس</a>
                                    )}
                                </div>
                            </div>
                             <div>
                                <p className="text-xs text-gray-500">تلفن مادر</p>
                                <div className="flex items-center gap-2">
                                    <p className="text-sm font-semibold text-gray-800">{student.contact?.motherPhone ? toPersianDigits(student.contact.motherPhone) : '-'}</p>
                                    {student.contact?.motherPhone && (
                                        <a href={`tel:${student.contact.motherPhone}`} className="px-2 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-xs transition-colors">تماس</a>
                                    )}
                                </div>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">تلفن منزل</p>
                                <div className="flex items-center gap-2">
                                    <p className="text-sm font-semibold text-gray-800">{student.contact?.homePhone ? toPersianDigits(student.contact.homePhone) : '-'}</p>
                                    {student.contact?.homePhone && (
                                        <a href={`tel:${student.contact.homePhone}`} className="px-2 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-xs transition-colors">تماس</a>
                                    )}
                                </div>
                            </div>
                             <div>
                                <p className="text-xs text-gray-500">تلفن ضروری</p>
                                <div className="flex items-center gap-2">
                                    <p className="text-sm font-semibold text-gray-800">
                                        {student.contact?.emergency?.phone ? `${toPersianDigits(student.contact.emergency.phone)} (${student.contact.emergency.owner})` : '-'}
                                    </p>
                                </div>
                            </div>
                            <InfoField label="آدرس" value={student.contact?.address} className="col-span-full" />
                        </div>
                    </div>
                </div>
            );
            case 'grades': return (
                <div>
                    <button onClick={() => handleDownload('grades')} className="mb-4 px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600">خروجی CSV</button>
                    <table className="w-full text-sm">
                        <thead><tr className="text-right bg-gray-50"><th className="p-2">درس</th><th className="p-2 text-center">نمره</th><th className="p-2">تاریخ</th><th className="p-2">ثبت توسط</th></tr></thead>
                        <tbody>{grades.filter(g => g.studentId === student.id).map(g => <tr key={g.id} className="border-b">
                            <td className="p-2">{g.subject}</td>
                            <td className="p-2 font-bold text-center">
                                <span style={getScoreStyle(g.score)}>
                                    {toPersianDigits(g.score)}
                                </span>
                            </td>
                            <td className="p-2">{toPersianDigits(g.date)}</td><td className="p-2">{formatFullName(allRecorders.find(r => r.id === g.teacherId)) || 'سیستم'}</td></tr>)}</tbody>
                    </table>
                     {grades.filter(g => g.studentId === student.id).length === 0 && <p className="text-center py-8 text-gray-500">نمره‌ای ثبت نشده.</p>}
                </div>
            );
            case 'attendance': return (
                <div>
                     <button onClick={() => handleDownload('attendance')} className="mb-4 px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600">خروجی CSV</button>
                    <table className="w-full text-sm">
                        <thead><tr className="text-right bg-gray-50"><th className="p-2">تاریخ</th><th className="p-2">وضعیت</th><th className="p-2">جزئیات</th><th className="p-2">ثبت توسط</th></tr></thead>
                        <tbody>{attendance.filter(a => a.studentId === student.id).map(a => <tr key={a.id} className="border-b"><td className="p-2">{toPersianDigits(a.date)}</td><td className="p-2 font-bold">{a.status}</td><td className="p-2 text-xs">{a.minutesLate ? `تاخیر: ${toPersianDigits(a.minutesLate)}دقیقه` : ''}{a.departureTime ? `خروج: ${toPersianDigits(a.departureTime)}` : ''}</td><td className="p-2">{formatFullName(allRecorders.find(r => r.id === a.recordedBy)) || 'سیستم'}</td></tr>)}</tbody>
                    </table>
                    {attendance.filter(a => a.studentId === student.id).length === 0 && <p className="text-center py-8 text-gray-500">موردی ثبت نشده.</p>}
                </div>
            );
            case 'discipline': return (
                <div>
                     <button onClick={() => handleDownload('discipline')} className="mb-4 px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600">خروجی CSV</button>
                    <table className="w-full text-sm">
                        <thead><tr className="text-right bg-gray-50"><th className="p-2">تاریخ</th><th className="p-2">مورد</th><th className="p-2">شرح</th><th className="p-2">اقدام</th><th className="p-2">ثبت توسط</th></tr></thead>
                        <tbody>{disciplineIncidents.filter(d => d.studentId === student.id).map(d => <tr key={d.id} className="border-b"><td className="p-2">{toPersianDigits(d.date)}</td><td className="p-2 font-bold">{d.category}</td><td className="p-2">{d.description}</td><td className="p-2">{d.actionTaken}</td><td className="p-2">{formatFullName(allRecorders.find(r => r.id === d.reportedBy)) || 'سیستم'}</td></tr>)}</tbody>
                    </table>
                     {disciplineIncidents.filter(d => d.studentId === student.id).length === 0 && <p className="text-center py-8 text-gray-500">موردی ثبت نشده.</p>}
                </div>
            );
            // New Tabs
            case 'naseeb': {
                const studentBadges = awardedBadges.filter(ab => ab.studentId === student.id)
                    .map(ab => ({ ...ab, badge: badges.find(b => b.id === ab.badgeId) }))
                    .filter(ab => ab.badge);

                return <div className="space-y-4">
                    <h4 className="font-semibold">مدال‌های کسب شده</h4>
                    {studentBadges.length > 0 ? (
                         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {studentBadges.map(ab => (
                                <div key={ab.id} className="p-2 border rounded-lg text-center">
                                    {ab.badge!.imageUrl && <img src={ab.badge!.imageUrl} alt={ab.badge!.name} className="w-12 h-12 rounded-full mx-auto mb-2" />}
                                    <p className="font-bold text-sm">{ab.badge!.name}</p>
                                    <p className="text-xs text-gray-500">{toPersianDigits(ab.dateAwarded)}</p>
                                </div>
                            ))}
                        </div>
                    ): <p className="text-sm text-gray-500">مدالی کسب نشده است.</p>}
                </div>;
            }
            case 'finance': {
                const studentBills = financialBills.filter(f => f.studentId === student.id);
                if (studentBills.length === 0) {
                    return <p className="text-sm text-gray-500">صورت‌حسابی برای سال تحصیلی جاری ثبت نشده.</p>;
                }
                
                const totalOwed = studentBills.reduce((sum, bill) => sum + bill.totalAmount, 0);
                const totalPaid = studentBills.reduce((sum, bill) => sum + bill.amountPaid, 0);
                
                return <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-gray-100 rounded-lg">
                        <InfoField label="مجموع بدهی" value={`${toPersianDigits(totalOwed.toLocaleString())} ریال`} />
                        <InfoField label="مجموع پرداختی" value={`${toPersianDigits(totalPaid.toLocaleString())} ریال`} />
                        <InfoField label="مانده کل" value={`${toPersianDigits((totalOwed - totalPaid).toLocaleString())} ریال`} />
                    </div>
                    {studentBills.map(bill => (
                        <div key={bill.id} className="p-3 border rounded-lg">
                            <h4 className="font-semibold text-md">{bill.title}</h4>
                            <p className="text-xs text-gray-500 mb-2">سال تحصیلی: {toPersianDigits(bill.academicYear)} - تاریخ صدور: {toPersianDigits(bill.issueDate)}</p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                                <InfoField label="مبلغ کل" value={`${toPersianDigits(bill.totalAmount.toLocaleString())} ریال`} />
                                <InfoField label="پرداختی" value={`${toPersianDigits(bill.amountPaid.toLocaleString())} ریال`} />
                                <InfoField label="مانده" value={`${toPersianDigits((bill.totalAmount - bill.amountPaid).toLocaleString())} ریال`} />
                                <InfoField label="وضعیت" value={bill.status} />
                            </div>
                        </div>
                    ))}
                </div>;
            }
             case 'activities': {
                const studentResponsibilities = responsibilityAssignments.filter(ra => ra.studentId === student.id).map(ra => ({ ...ra, resp: responsibilities.find(r => r.id === ra.responsibilityId) })).filter(ra => ra.resp);
                const studentEvents = events.filter(e => {
                    if (e.audience.type === 'all_students') return true;
                    if (e.audience.type === 'class' && e.audience.ids.includes(student.classId)) return true;
                    if (e.audience.type === 'student' && e.audience.ids.includes(student.id)) return true;
                    return false;
                });
                return <div className="space-y-6">
                    <div>
                        <h4 className="font-semibold mb-2">مسئولیت‌ها</h4>
                        {studentResponsibilities.length > 0 ? (
                            <ul className="list-disc pr-5 space-y-1 text-sm">{studentResponsibilities.map(ra => <li key={ra.id}>{ra.resp!.name} (تا {toPersianDigits(ra.endDate)})</li>)}</ul>
                        ) : <p className="text-sm text-gray-500">مسئولیتی واگذار نشده.</p>}
                    </div>
                    <div>
                        <h4 className="font-semibold mb-2">رویدادها</h4>
                        {studentEvents.length > 0 ? (
                             <ul className="list-disc pr-5 space-y-1 text-sm">{studentEvents.map(e => <li key={e.id}>{e.title} ({toPersianDigits(e.dateTime.split('T')[0])})</li>)}</ul>
                        ) : <p className="text-sm text-gray-500">رویدادی برای این دانش آموز وجود ندارد.</p>}
                    </div>
                </div>;
            }
            case 'records': {
                const studentPta = ptaAttendance.filter(pa => pa.studentId === student.id).map(pa => ({ ...pa, meeting: ptaMeetings.find(m => m.id === pa.meetingId) })).filter(pa => pa.meeting);
                const studentAnecdotal = anecdotalRecords.filter(ar => ar.studentIds.includes(student.id));
                const studentParentMeetings = parentMeetings.filter(pm => pm.studentId === student.id);
                return <div className="space-y-6">
                    <div>
                        <h4 className="font-semibold mb-2">حضور در جلسات انجمن اولیا</h4>
                        {studentPta.length > 0 ? (
                            <ul className="list-disc pr-5 space-y-1 text-sm">{studentPta.map(pa => <li key={pa.id}>{pa.meeting!.title} ({toPersianDigits(pa.meeting!.date)}): <span className={pa.attended ? 'text-green-600' : 'text-red-600'}>{pa.attended ? 'حاضر' : 'غایب'}</span></li>)}</ul>
                        ) : <p className="text-sm text-gray-500">سابقه‌ای یافت نشد.</p>}
                    </div>
                     <div>
                        <h4 className="font-semibold mb-2">وقایع‌نگاری</h4>
                        {studentAnecdotal.length > 0 ? (
                            <ul className="list-disc pr-5 space-y-1 text-sm">{studentAnecdotal.map(ar => <li key={ar.id}>{ar.subject} ({toPersianDigits(ar.date)}): {ar.description}</li>)}</ul>
                        ) : <p className="text-sm text-gray-500">سابقه‌ای یافت نشد.</p>}
                    </div>
                     <div>
                        <h4 className="font-semibold mb-2">جلسات خصوصی با اولیا</h4>
                        {studentParentMeetings.length > 0 ? (
                            <ul className="list-disc pr-5 space-y-1 text-sm">{studentParentMeetings.map(pm => <li key={pm.id}>{pm.reason} ({toPersianDigits(pm.date)}): {pm.summary}</li>)}</ul>
                        ) : <p className="text-sm text-gray-500">سابقه‌ای یافت نشد.</p>}
                    </div>
                </div>;
            }
            default: return null;
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex items-center gap-4 mb-4 pb-4 border-b">
                    <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200 flex-shrink-0 border-2 border-white shadow-md">
                        {student.profilePictureUrl ? (
                            <img src={student.profilePictureUrl} alt={formatFullName(student)} className="w-full h-full object-cover" />
                        ) : (
                             <span className="w-full h-full flex items-center justify-center text-gray-500 text-4xl font-bold">
                                {student.firstName.charAt(0)}
                            </span>
                        )}
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-[var(--text-primary)]">پرونده دانش آموز: {formatFullName(student)}</h2>
                        <p className="text-md text-[var(--text-secondary)]">{student.className}</p>
                    </div>
                </div>
                 <div className="border-b border-gray-200 mb-4">
                    <nav className="-mb-px flex space-x-4 space-x-reverse overflow-x-auto" aria-label="Tabs">
                        {tabs.map(tab => (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                                className={`${activeTab === tab.id ? 'border-[var(--primary-500)] text-[var(--primary-600)]' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                                whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors`}>
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>
                <div className="flex-grow overflow-y-auto pr-2">
                    {renderActiveTab()}
                </div>
                <div className="flex justify-end gap-4 pt-4 border-t mt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition">بستن</button>
                </div>
            </div>
        </div>
    );
};

export default StudentProfileModal;