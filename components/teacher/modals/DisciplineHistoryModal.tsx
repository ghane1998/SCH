
import React from 'react';
import type { Student, DisciplinaryIncident, Teacher } from '../../../types';
import { formatFullName } from '../../common/formatters';

interface DisciplinaryHistoryModalProps {
  student: Student;
  teacherId: string;
  incidents: DisciplinaryIncident[];
  teachers: Teacher[];
  onClose: () => void;
  onEdit: (incident: DisciplinaryIncident) => void;
  onDelete: (incidentId: string) => void;
}

const DisciplineHistoryModal: React.FC<DisciplinaryHistoryModalProps> = ({ student, teacherId, incidents, teachers, onClose, onEdit, onDelete }) => {
  const getReporterName = (reporterId: string) => {
    const teacher = teachers.find(t => t.id === reporterId);
    return formatFullName(teacher) || 'ناشناس';
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-4 text-[var(--text-primary)]">سابقه انضباطی: <span className="text-[var(--primary-600)]">{formatFullName(student)}</span></h2>
        <div className="overflow-y-auto space-y-3 flex-grow">
          {incidents.length > 0 ? incidents.map(incident => (
            <div key={incident.id} className="p-3 bg-gray-50 rounded-lg border">
              <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm font-semibold text-gray-600">{incident.date} - <span className="font-bold">{incident.category}</span></p>
                    <p className="text-xs text-gray-500 mt-1">ثبت توسط: {getReporterName(incident.reportedBy)}</p>
                </div>
                 {incident.reportedBy === teacherId && (
                    <div className="flex gap-2 flex-shrink-0 ml-2">
                        <button onClick={() => onEdit(incident)} className="text-xs font-medium text-blue-600 hover:underline">ویرایش</button>
                        <button onClick={() => onDelete(incident.id)} className="text-xs font-medium text-red-600 hover:underline">حذف</button>
                    </div>
                )}
              </div>
              <p className="text-sm mt-2"><span className="font-semibold">شرح:</span> {incident.description}</p>
              <p className="text-sm"><span className="font-semibold">اقدام:</span> {incident.actionTaken}</p>
            </div>
          )) : <p className="text-center text-gray-500 py-8">هیچ مورد انضباطی برای این دانش آموز ثبت نشده است.</p>}
        </div>
        <div className="pt-4 text-right">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition">بستن</button>
        </div>
      </div>
    </div>
  );
};

export default DisciplineHistoryModal;
