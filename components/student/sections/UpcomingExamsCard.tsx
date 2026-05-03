import React, { useMemo, useState, useEffect } from 'react';
import type { Student, Exam } from '../../../types';
import { useData } from '../../../App';
import Card from '../../common/Card';
import { toPersianDigits } from '../../common/formatters';

const ExamIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>;

const jalaliToGregorianDate = (jalaliString: string): Date | null => {
    try {
        const [datePart, timePart] = jalaliString.split('T');
        if (!datePart) return null;

        const [year, month, day] = datePart.split('-').map(Number);
        if (isNaN(year) || isNaN(month) || isNaN(day)) return null;

        const [hour = 0, minute = 0] = timePart ? timePart.split(':').map(Number) : [0, 0];

        const gregorianYear = year + 621;

        let daysIntoYear;
        if (month <= 6) {
            daysIntoYear = (month - 1) * 31 + day;
        } else {
            daysIntoYear = (6 * 31) + (month - 7) * 30 + day;
        }
        
        const gregorianDate = new Date(gregorianYear, 2, 20, hour, minute);
        gregorianDate.setDate(gregorianDate.getDate() + daysIntoYear);

        return gregorianDate;
    } catch (error) {
        console.error("Error parsing Jalali date:", error);
        return null;
    }
};

interface CountdownTimerProps {
    targetDate: string;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ targetDate }) => {
    const calculateTimeLeft = () => {
        const target = jalaliToGregorianDate(targetDate);
        if (!target) return null;

        const difference = target.getTime() - new Date().getTime();
        let timeLeft: { days: number, hours: number, minutes: number, seconds: number } | null = null;

        if (difference > 0) {
            timeLeft = {
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60),
            };
        }
        return timeLeft;
    };

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    useEffect(() => {
        const timer = setTimeout(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearTimeout(timer);
    });

    if (!timeLeft) {
        return <div className="text-center font-bold text-red-500 py-4">آزمون به پایان رسیده یا در حال برگزاری است.</div>;
    }

    const timeParts = [
        { label: 'روز', value: timeLeft.days },
        { label: 'ساعت', value: timeLeft.hours },
        { label: 'دقیقه', value: timeLeft.minutes },
        { label: 'ثانیه', value: timeLeft.seconds },
    ];

    return (
        <div className="flex justify-center gap-2 md:gap-4 my-4 text-center">
            {timeParts.map(part => (
                <div key={part.label} className="flex flex-col items-center justify-center bg-white rounded-lg shadow-inner p-2 md:p-3 w-16 md:w-20">
                    <span className="text-2xl md:text-3xl font-bold text-[var(--primary-600)]">{toPersianDigits(part.value.toString().padStart(2, '0'))}</span>
                    <span className="text-xs text-gray-500">{part.label}</span>
                </div>
            ))}
        </div>
    );
};

interface UpcomingExamsCardProps {
    student: Student;
}

const UpcomingExamsCard: React.FC<UpcomingExamsCardProps> = ({ student }) => {
    const { exams } = useData();

    const today = new Date().toLocaleDateString('fa-IR-u-nu-latn', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-');

    const upcomingExams = useMemo(() => {
        return exams
            .filter(exam => 
                exam.targetClassIds.includes(student.classId) &&
                exam.announcementDate <= today &&
                exam.examDate.split('T')[0] >= today
            )
            .sort((a, b) => a.examDate.localeCompare(b.examDate));
    }, [exams, student.classId, today]);

    const formatExamDate = (dateString: string) => {
        const [date, time] = dateString.split('T');
        return `تاریخ: ${toPersianDigits(date)} - ساعت: ${toPersianDigits(time || 'نامشخص')}`;
    }

    return (
        <Card title="آزمون‌های پیش رو" icon={<ExamIcon />}>
            <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
                {upcomingExams.length > 0 ? (
                    upcomingExams.map(exam => (
                         <div key={exam.id} className="p-4 bg-indigo-50 border-r-4 border-indigo-400 rounded-lg">
                            <div className="flex justify-between items-start flex-wrap gap-2">
                                <p className="font-bold text-lg text-indigo-800">{exam.subject}</p>
                                <p className="text-sm font-semibold text-gray-600 bg-indigo-100 px-2 py-1 rounded">{formatExamDate(exam.examDate)}</p>
                            </div>
                            
                            <CountdownTimer targetDate={exam.examDate} />
                            
                            <div className="mt-2 text-sm text-gray-700 space-y-1">
                                <p><span className="font-semibold">بودجه‌بندی:</span> {exam.syllabus}</p>
                                {exam.description && <p><span className="font-semibold">توضیحات:</span> {exam.description}</p>}
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-center text-gray-500 py-12">آزمون جدیدی برای شما اعلام نشده است.</p>
                )}
            </div>
        </Card>
    );
};

export default UpcomingExamsCard;
