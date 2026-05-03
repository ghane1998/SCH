import React, { useState, useMemo } from 'react';
import type { Teacher, Student, DisciplinaryIncident, Grade, SchoolClass } from '../../../types';
import { useSettings, useData } from '../../../App';
import Card from '../../common/Card';
import { useSortableData } from '../../common/useSortableData';
import { SortableHeader } from '../../common/SortableHeader';
import DisciplineModal from '../modals/DisciplineModal';
import GradeModal from '../modals/GradeModal';
import StudentProfileModal from '../../common/StudentProfileModal';
import { formatFullName } from '../../common/formatters';


interface ClassManagementTabProps {
    teacher: Teacher;
    selectedClass: SchoolClass | undefined;
    studentsInClass: Student[];
}

const ClassManagementTab: React.FC<ClassManagementTabProps> = ({ teacher, selectedClass, studentsInClass }) => {
    const { settings } = useSettings();
    const { 
        saveDisciplinaryIncident, 
        disciplineIncidents, 
        saveGrade, 
        grades, 
        teachers,
        admins,
        attendance,
        classes,
        ptaMeetings,
        ptaAttendance,
        financialBills,
        payments,
        events,
        responsibilities,
        responsibilityAssignments,
        anecdotalRecords,
        parentMeetings,
        badges,
        awardedBadges
    } = useData();

    const [disciplineModal, setDisciplineModal] = useState<{ student: Student; incident: DisciplinaryIncident | null } | null>(null);
    const [gradeModal, setGradeModal] = useState<{ student: Student; grade: Grade | null } | null>(null);
    const [profileStudent, setProfileStudent] = useState<Student | null>(null);
    
    const { items: sortedStudents, requestSort, sortConfig } = useSortableData(studentsInClass, [{ key: 'lastName', direction: 'ascending' }, { key: 'firstName', direction: 'ascending' }]);

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

    const handleSaveDiscipline = (incident: DisciplinaryIncident) => {
        saveDisciplinaryIncident(incident);
        setDisciplineModal(null);
    };
    
    const handleSaveGrade = (grade: Grade) => {
        saveGrade(grade);
        setGradeModal(null);
    };
    
    if (!selectedClass) {
        return null;
    }

    return (
        <>
            <Card title={`دانش آموزان کلاس ${selectedClass.name}`}>
                <div className="overflow-x-auto max-h-96">
                    <table className="w-full text-sm text-right">
                        <thead className="bg-gray-50 sticky top-0">
                            <tr>
                                <th className="px-4 py-3">تصویر</th>
                                {/* FIX: Add missing children prop */}
                                <SortableHeader sortKey="lastName" requestSort={requestSort} sortConfig={sortConfig}>نام خانوادگی</SortableHeader>
                                {/* FIX: Add missing children prop */}
                                <SortableHeader sortKey="firstName" requestSort={requestSort} sortConfig={sortConfig}>نام</SortableHeader>
                                <th className="px-4 py-3">اقدامات فردی</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {sortedStudents.map(student => (
                                <tr key={student.id}>
                                    <td className="px-4 py-2">
                                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 mx-auto">
                                            {student.profilePictureUrl ? (
                                                <img src={student.profilePictureUrl} alt={formatFullName(student)} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="w-full h-full flex items-center justify-center text-gray-500 text-lg font-bold">
                                                    {student.firstName.charAt(0)}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-2">{student.lastName}</td>
                                    <td className="px-4 py-2">{student.firstName}</td>
                                    <td className="px-4 py-2 text-xs space-x-2 space-x-reverse">
                                        <button onClick={() => setProfileStudent(student)} className="font-medium text-green-600 hover:underline">پرونده</button>
                                        <button onClick={() => setGradeModal({ student, grade: null })} className="font-medium text-blue-600 hover:underline">ثبت نمره</button>
                                        <button onClick={() => setDisciplineModal({ student, incident: null })} className="font-medium text-red-600 hover:underline">ثبت انضباطی</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Modals */}
            {profileStudent && (
                 <StudentProfileModal
                    student={profileStudent}
                    viewerRole="teacher"
                    onClose={() => setProfileStudent(null)}
                    grades={grades}
                    attendance={attendance}
                    disciplineIncidents={disciplineIncidents}
                    teachers={teachers}
                    admins={admins}
                    classes={classes}
                    ptaMeetings={ptaMeetings}
                    ptaAttendance={ptaAttendance}
                    financialBills={financialBills}
                    payments={payments}
                    events={events}
                    responsibilities={responsibilities}
                    responsibilityAssignments={responsibilityAssignments}
                    anecdotalRecords={anecdotalRecords}
                    parentMeetings={parentMeetings}
                    badges={badges}
                    awardedBadges={awardedBadges}
                />
            )}
            {disciplineModal && <DisciplineModal student={disciplineModal.student} teacherId={teacher.id} onClose={() => setDisciplineModal(null)} onSubmit={handleSaveDiscipline} incidentToEdit={disciplineModal.incident} years={academicYears} />}
            {gradeModal && <GradeModal student={gradeModal.student} teacherId={teacher.id} onClose={() => setGradeModal(null)} onSubmit={handleSaveGrade} gradeToEdit={gradeModal.grade} years={academicYears} availableSubjects={selectedClass?.subjects || []}/>}
        </>
    );
};

export default ClassManagementTab;
