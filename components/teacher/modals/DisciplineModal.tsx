
import React, { useState, useEffect } from 'react';
import { ShieldAlert, FileSignature, CheckCircle, X } from 'lucide-react';
import type { Student, DisciplinaryIncident } from '../../../types';
import { useSettings } from '../../../App';
import DateSelector from '../../common/DateSelector';
import { formatFullName } from '../../common/formatters';

interface DisciplineModalProps {
  student: Student;
  teacherId: string;
  onClose: () => void;
  onSubmit: (incident: DisciplinaryIncident) => void;
  incidentToEdit: DisciplinaryIncident | null;
  years: string[];
}

const DisciplineModal: React.FC<DisciplineModalProps> = ({ student, teacherId, onClose, onSubmit, incidentToEdit, years }) => {
  const { settings } = useSettings();
  const [date, setDate] = useState({ year: '', month: '', day: '' });
  const [category, setCategory] = useState<DisciplinaryIncident['category']>(settings.disciplineCategories[0] || 'بی‌نظمی');
  const [description, setDescription] = useState('');
  const [actionTaken, setActionTaken] = useState('');

  useEffect(() => {
    const initialDateStr = incidentToEdit ? incidentToEdit.date : new Date().toLocaleDateString('fa-IR-u-nu-latn').replace(/\//g, '-');
    const [y, m, d] = initialDateStr.split('-');
    
    setDate({ year: y || years[0] || '', month: String(parseInt(m, 10)), day: String(parseInt(d, 10)) });

    if (incidentToEdit) {
      setCategory(incidentToEdit.category);
      setDescription(incidentToEdit.description);
      setActionTaken(incidentToEdit.actionTaken);
    }
  }, [incidentToEdit, years]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !actionTaken || !date.year || !date.month || !date.day) {
      alert('لطفا تمامی فیلدها را پر کنید.');
      return;
    }
    const formattedDate = `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
    const newIncident: DisciplinaryIncident = {
      id: incidentToEdit ? incidentToEdit.id : `d${Date.now()}`,
      studentId: student.id,
      date: formattedDate,
      category,
      description,
      actionTaken,
      reportedBy: incidentToEdit ? incidentToEdit.reportedBy : teacherId,
    };
    onSubmit(newIncident);
  };

  const categories = settings.disciplineCategories;
  const inputStyle = {
      backgroundColor: 'var(--input-bg)',
      borderColor: 'var(--input-border)',
      color: 'var(--text-primary)'
  };

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg transform transition-all animate-scale-in" onClick={e => e.stopPropagation()}>
        
        <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-5">
            <h2 className="text-xl font-black text-gray-800 flex items-center gap-2">
                <FileSignature className="w-6 h-6 text-orange-500" />
                {incidentToEdit ? 'ویرایش' : 'ثبت'} مورد انضباطی
            </h2>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
                <X className="w-5 h-5" />
            </button>
        </div>

        <div className="mb-6 p-4 bg-orange-50/50 border border-orange-100 rounded-xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-sm shrink-0">
                {student.firstName[0]}
            </div>
            <div>
                <p className="text-xs font-semibold text-orange-600/80 mb-0.5">دانش آموز تحت بررسی</p>
                <p className="font-bold text-gray-900">{formatFullName(student)}</p>
            </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">تاریخ وقوع</label>
                <DateSelector
                    prefix="discipline"
                    year={date.year}
                    month={date.month}
                    day={date.day}
                    onYearChange={(y) => setDate(prev => ({...prev, year: y}))}
                    onMonthChange={(m) => setDate(prev => ({...prev, month: m}))}
                    onDayChange={(d) => setDate(prev => ({...prev, day: d}))}
                    years={years}
                    className="w-full"
                />
              </div>
              <div>
                <label htmlFor="category" className="block text-xs font-bold text-gray-700 mb-1.5">نـوع مـورد</label>
                <div className="relative">
                    <select
                        id="category"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="block w-full pl-3 pr-10 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                        required
                    >
                        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                        <ShieldAlert className="w-4 h-4 text-gray-400" />
                    </div>
                </div>
              </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-xs font-bold text-gray-700 mb-1.5">شرح دقیق واقعه</label>
            <textarea
              id="description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="block w-full p-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white resize-none shadow-sm"
              placeholder="توضیح دهید دقیقا چه اتفاقی افتاد..."
              required
            />
          </div>

          <div>
            <label htmlFor="actionTaken" className="block text-xs font-bold text-gray-700 mb-1.5">اقدام انجام شده (تبعات)</label>
            <textarea
              id="actionTaken"
              rows={2}
              value={actionTaken}
              onChange={(e) => setActionTaken(e.target.value)}
              className="block w-full p-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white resize-none shadow-sm"
              placeholder="مثال: کسر نمره، احضار ولی، تعهد کتبی و..."
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-5 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium rounded-xl transition-colors"
            >
              انصراف
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl shadow-sm transition-colors"
            >
              <CheckCircle className="w-5 h-5" />
              {incidentToEdit ? 'ذخیره تغییرات' : 'ثبت مورد انضباطی'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DisciplineModal;
