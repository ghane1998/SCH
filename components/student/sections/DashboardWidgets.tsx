import React, { useMemo } from 'react';
import type { Student, Grade, DescriptiveGrade } from '../../../types';
import { useData, useSettings } from '../../../App';
import { toPersianDigits } from '../../common/formatters';
import { DEFAULT_SETTINGS } from '../../../data';

const CheckBadgeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>;
const NoSymbolIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>;
const HourglassIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const DisciplineIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;


const ClassicStatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; color: string }> = ({ title, value, icon, color }) => (
    <div className={`rounded-xl shadow-lg p-5 flex items-center gap-5 text-white relative`} style={{ backgroundColor: color }}>
        <div>
            <p className="text-sm font-medium text-white/90">{title}</p>
            <p className="text-3xl font-bold">{value}</p>
        </div>
    </div>
);

const ModernStatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; theme: { from: string; to: string; } }> = ({ title, value, icon, theme }) => (
    <div 
        className="rounded-xl shadow-lg p-5 text-white relative overflow-hidden transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl group"
        style={{ background: `linear-gradient(135deg, ${theme.from}, ${theme.to})` }}
    >
        <div className="absolute -right-4 -bottom-4 text-white/10 text-8xl transform rotate-12 pointer-events-none transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
            {icon}
        </div>
        <div className="relative z-10">
            <div className="bg-white/20 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                {icon}
            </div>
            <p className="text-sm font-medium text-white/90">{title}</p>
            <p className="text-3xl font-bold">{value}</p>
        </div>
    </div>
);

interface DashboardWidgetsProps {
    student: Student;
}

const DashboardWidgets: React.FC<DashboardWidgetsProps> = ({ student }) => {
    const { grades, attendance, disciplineIncidents } = useData();
    const { settings } = useSettings();

    const myGrades = useMemo(() => grades.filter(g => g.studentId === student.id), [grades, student.id]);
    const myAttendance = useMemo(() => attendance.filter(a => a.studentId === student.id), [attendance, student.id]);
    const myDiscipline = useMemo(() => disciplineIncidents.filter(d => d.studentId === student.id), [disciplineIncidents, student.id]);
    
    const averageGrade: string | number = useMemo(() => {
        if (myGrades.length === 0) return 'N/A';

        const weightMap = new Map(settings.subjectWeights.map(item => [item.subject, item.weight]));
        const gradeValueMap = new Map(settings.descriptiveGradeValues.map(item => [item.grade, item.value]));
        const defaultWeight = 1;

        let totalPoints = 0;
        let totalWeight = 0;

        myGrades.forEach(grade => {
            let numericValue: number | undefined;
            if (typeof grade.score === 'number') {
                numericValue = grade.score;
            } else { // Descriptive
                numericValue = gradeValueMap.get(grade.score as DescriptiveGrade);
            }
            
            if (numericValue !== undefined) {
                const weight = weightMap.get(grade.subject) ?? defaultWeight;
                totalPoints += numericValue * weight;
                totalWeight += weight;
            }
        });

        if (totalWeight === 0) return 'N/A';

        const numericAverage = totalPoints / totalWeight;

        if (settings.gradingSystem === 'descriptive') {
            // Sort by value ascending to find the correct threshold
            const sortedGradeValues = [...settings.descriptiveGradeValues].sort((a, b) => a.value - b.value);
            
            // Find the lowest grade threshold that the average is less than or equal to
            for (const gradeDef of sortedGradeValues) {
                if (numericAverage <= gradeDef.value) {
                    return gradeDef.grade;
                }
            }
            
            // If average is higher than the highest threshold, return the highest grade
            return sortedGradeValues.length > 0 
                ? sortedGradeValues[sortedGradeValues.length - 1].grade 
                : 'N/A';
        } else {
            // For numeric system, return the number formatted to two decimal places
            return numericAverage.toFixed(2);
        }
    }, [myGrades, settings.gradingSystem, settings.descriptiveGradeValues, settings.subjectWeights]);
    
    const unexcusedAbsences = useMemo(() => myAttendance.filter(a => a.status === 'غیرموجه').length, [myAttendance]);
    const tardies = useMemo(() => myAttendance.filter(a => a.status === 'تاخیر').length, [myAttendance]);
    
    const studentStatCardsSettings = settings.studentStatCardsSettings || DEFAULT_SETTINGS.studentStatCardsSettings;

    const displayAverage = typeof averageGrade === 'string' && isNaN(parseFloat(averageGrade))
        ? averageGrade
        : toPersianDigits(averageGrade);

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {studentStatCardsSettings.style === 'modern' ? (
                <>
                    <ModernStatCard title="معدل کل" value={displayAverage} icon={<CheckBadgeIcon />} theme={studentStatCardsSettings.themes.average} />
                    <ModernStatCard title="غیبت غیرموجه" value={toPersianDigits(unexcusedAbsences)} icon={<NoSymbolIcon />} theme={studentStatCardsSettings.themes.absence} />
                    <ModernStatCard title="تأخیر" value={toPersianDigits(tardies)} icon={<HourglassIcon />} theme={studentStatCardsSettings.themes.tardy} />
                    <ModernStatCard title="موارد انضباطی" value={toPersianDigits(myDiscipline.length)} icon={<DisciplineIcon />} theme={studentStatCardsSettings.themes.discipline} />
                </>
            ) : (
                <>
                    <ClassicStatCard title="معدل کل" value={displayAverage} icon={<CheckBadgeIcon />} color="var(--primary-500)" />
                    <ClassicStatCard title="غیبت غیرموجه" value={toPersianDigits(unexcusedAbsences)} icon={<NoSymbolIcon />} color="#ef4444" />
                    <ClassicStatCard title="تأخیر" value={toPersianDigits(tardies)} icon={<HourglassIcon />} color="#f97316" />
                    <ClassicStatCard title="موارد انضباطی" value={toPersianDigits(myDiscipline.length)} icon={<DisciplineIcon />} color="#8b5cf6" />
                </>
            )}
        </div>
    );
};

export default DashboardWidgets;