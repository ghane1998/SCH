import React from 'react';
import type { Student, Grade, Teacher, SchoolSettings, DescriptiveGrade } from '../../../types';
import { formatFullName, toPersianDigits } from '../../common/formatters';

interface GradeHistoryModalProps {
  student: Student;
  teacherId: string;
  grades: Grade[];
  teachers: Teacher[];
  onClose: () => void;
  onEdit: (grade: Grade) => void;
  onDelete: (gradeId: string) => void;
  settings: SchoolSettings;
}

const GradeHistoryModal: React.FC<GradeHistoryModalProps> = ({ student, teacherId, grades, teachers, onClose, onEdit, onDelete, settings }) => {
  const getTeacherName = (tId: string) => {
    const teacher = teachers.find(t => t.id === tId);
    return formatFullName(teacher) || 'ناشناس';
  };

  const getScoreStyle = (score: number | DescriptiveGrade): React.CSSProperties => {
      if (typeof score === 'number') {
          return { color: score >= settings.passingGrade ? '#16a34a' : '#dc2626' }; // green-600, red-600
      }
      const colorSetting = settings.descriptiveGradeColors.find(s => s.grade === score);
      if (colorSetting) {
          return { 
              backgroundColor: colorSetting.color, 
              color: 'white', 
              padding: '2px 10px', 
              borderRadius: '9999px',
              fontSize: '0.8rem',
              display: 'inline-block'
          };
      }
      return {};
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-3xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-4 text-[var(--text-primary)]">سابقه نمرات: <span className="text-[var(--primary-600)]">{formatFullName(student)}</span></h2>
        <div className="overflow-y-auto flex-grow">
          {grades.length > 0 ? (
            <table className="w-full text-sm text-right">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-2">درس</th>
                  <th className="px-4 py-2 text-center">نمره</th>
                  <th className="px-4 py-2">تاریخ</th>
                  <th className="px-4 py-2">ثبت توسط</th>
                  <th className="px-4 py-2">اقدامات</th>
                </tr>
              </thead>
              <tbody>
                {grades.map(grade => (
                  <tr key={grade.id} className="border-b">
                    <td className="px-4 py-2 font-semibold">{grade.subject}</td>
                    <td className="px-4 py-2 font-bold text-center">
                        <span style={getScoreStyle(grade.score)}>
                            {toPersianDigits(grade.score)}
                        </span>
                    </td>
                    <td className="px-4 py-2 text-gray-600">{toPersianDigits(grade.date)}</td>
                    <td className="px-4 py-2 text-gray-600">{getTeacherName(grade.teacherId)}</td>
                    <td className="px-4 py-2">
                      {grade.teacherId === teacherId && (
                        <div className="flex gap-3">
                          <button onClick={() => onEdit(grade)} className="text-xs font-medium text-blue-600 hover:underline">ویرایش</button>
                          <button onClick={() => onDelete(grade.id)} className="text-xs font-medium text-red-600 hover:underline">حذف</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p className="text-center text-gray-500 py-8">هیچ نمره‌ای برای این دانش آموز ثبت نشده است.</p>}
        </div>
        <div className="pt-4 text-right">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition">بستن</button>
        </div>
      </div>
    </div>
  );
};

export default GradeHistoryModal;