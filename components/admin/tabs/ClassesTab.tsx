

import React, { useState } from 'react';
import type { SchoolClass, Teacher, Student } from '../../../types';
import { useSortableData } from '../../common/useSortableData';
import { SortableHeader } from '../../common/SortableHeader';
import { formatFullName, toPersianDigits } from '../../common/formatters';
import { useSettings } from '../../../App';

// #region Helper Components
const ThemedInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
    <input 
        {...props} 
        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[var(--primary-500)] focus:border-[var(--primary-500)] ${props.className}`} 
        style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)', ...props.style }}
    />
);
const ThemedSelect: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
    <select 
        {...props} 
        className={`w-full pl-3 pr-10 py-2 text-base border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[var(--primary-500)] focus:border-[var(--primary-500)] ${props.className}`}
        style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)', ...props.style }}
    >{props.children}</select>
);
// #endregion

// #region Modals
interface ClassModalProps {
    classToEdit: SchoolClass | null;
    teachers: Teacher[];
    onClose: () => void;
    onSubmit: (schoolClass: SchoolClass) => void;
}
const ClassModal: React.FC<ClassModalProps> = ({ classToEdit, teachers, onClose, onSubmit }) => {
    const { settings } = useSettings();
    const [name, setName] = useState('');
    const [teacherId, setTeacherId] = useState('');
    const [subjects, setSubjects] = useState('');

    React.useEffect(() => {
        if (classToEdit) {
            setName(classToEdit.name);
            setTeacherId(classToEdit.teacherId);
            setSubjects(classToEdit.subjects.join(', '));
        } else {
            setName('');
            setTeacherId('');
            setSubjects('');
        }
    }, [classToEdit]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(!name) { 
            alert('لطفا نام کلاس را مشخص کنید.');
            return;
        }
        const newClass: SchoolClass = {
            id: classToEdit ? classToEdit.id : `c${Date.now()}`,
            name,
            teacherId,
            subjects: subjects.split(',').map(s => s.trim()).filter(Boolean)
        };
        onSubmit(newClass);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg relative" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-4 text-[var(--text-primary)]">{classToEdit ? 'ویرایش' : 'افزودن'} کلاس</h2>
                <form onSubmit={handleSubmit} className="space-y-4 relative">
                    <div className="relative"><label htmlFor="className" className="block text-sm font-medium text-[var(--text-secondary)]">نام کلاس</label><ThemedInput type="text" id="className" value={name} onChange={e => setName(e.target.value)} required /></div>
                    
                    {settings.schoolLevel === 'elementary' && (
                        <div className="relative">
                            <label htmlFor="classTeacher" className="block text-sm font-medium text-[var(--text-secondary)]">معلم پایه</label>
                            <ThemedSelect id="classTeacher" value={teacherId} onChange={e => setTeacherId(e.target.value)}>
                                <option value="">(بدون معلم)</option>
                                {teachers.map(t => <option key={t.id} value={t.id}>{formatFullName(t)}</option>)}
                            </ThemedSelect>
                        </div>
                    )}
                    
                     <div className="relative"><label htmlFor="classSubjects" className="block text-sm font-medium text-[var(--text-secondary)]">دروس</label><ThemedInput type="text" id="classSubjects" value={subjects} onChange={e => setSubjects(e.target.value)} placeholder="مثلا: ریاضی, علوم, فارسی" /><p className="text-xs text-gray-500 mt-1">درس ها را با کاما (,) از هم جدا کنید.</p></div>
                    <div className="flex justify-end gap-4 pt-4 relative">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition">انصراف</button>
                        <button type="submit" className="px-4 py-2 bg-[var(--primary-600)] text-white rounded-md hover:bg-[var(--primary-700)] transition">{classToEdit ? 'ذخیره تغییرات' : 'افزودن'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

interface GroupClassModalProps {
    onClose: () => void;
    onImport: (newClasses: SchoolClass[]) => void;
}
const GroupClassModal: React.FC<GroupClassModalProps> = ({ onClose, onImport }) => {
    const [classesData, setClassesData] = useState([{ id: 1, name: '', subjects: '' }]);

    const handleDataChange = (id: number, field: 'name' | 'subjects', value: string) => {
        setClassesData(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
    };

    const addRow = () => {
        setClassesData(prev => [...prev, { id: Date.now(), name: '', subjects: '' }]);
    };
    
    const removeRow = (id: number) => {
        setClassesData(prev => prev.filter(c => c.id !== id));
    };

    const handleSubmit = () => {
        const validClasses = classesData
            .filter(c => c.name.trim())
            .map(({ name, subjects }, index) => ({
                id: `c-group-${Date.now()}-${index}`,
                name: name.trim(),
                teacherId: '',
                subjects: subjects.split(',').map(s => s.trim()).filter(Boolean),
            }));

        if (validClasses.length > 0) {
            onImport(validClasses);
            onClose();
        } else {
            alert('لطفا حداقل نام یک کلاس را وارد کنید.');
        }
    };

    return (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-4 text-[var(--text-primary)]">ثبت گروهی کلاس ها</h2>
                <div className="overflow-y-auto space-y-3 flex-grow pr-2">
                    {classesData.map((cls, index) => (
                        <div key={cls.id} className="flex items-center gap-2">
                           <ThemedInput value={cls.name} onChange={e => handleDataChange(cls.id, 'name', e.target.value)} placeholder={`نام کلاس ${index + 1}`} className="w-1/3" />
                           <ThemedInput value={cls.subjects} onChange={e => handleDataChange(cls.id, 'subjects', e.target.value)} placeholder="دروس (جدا شده با کاما)" className="w-2/3" />
                           <button onClick={() => removeRow(cls.id)} className="p-2 text-red-500 hover:bg-red-100 rounded-full">&times;</button>
                        </div>
                    ))}
                </div>
                <button onClick={addRow} className="mt-4 text-sm text-[var(--primary-600)] font-semibold hover:underline">افزودن ردیف جدید</button>
                <div className="flex justify-end gap-4 pt-4 border-t mt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition">انصراف</button>
                    <button onClick={handleSubmit} className="px-4 py-2 bg-[var(--primary-600)] text-white rounded-md hover:bg-[var(--primary-700)] transition">ذخیره</button>
                </div>
            </div>
        </div>
    );
};
// #endregion

interface ClassesTabProps {
    classes: SchoolClass[];
    teachers: Teacher[];
    students: Student[];
    saveClass: (cls: SchoolClass) => void;
    deleteClass: (id: string) => void;
    importClasses: (classes: SchoolClass[]) => void;
}

const ClassesTab: React.FC<ClassesTabProps> = ({ classes, teachers, students, saveClass, deleteClass, importClasses }) => {
    const { settings } = useSettings();
    const [classToEdit, setClassToEdit] = useState<SchoolClass | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);

    const handleAdd = () => {
        setClassToEdit(null);
        setIsModalOpen(true);
    };
    const handleEdit = (cls: SchoolClass) => {
        setClassToEdit(cls);
        setIsModalOpen(true);
    };
    const handleGroupAdd = () => {
        setIsGroupModalOpen(true);
    };
    const closeModal = () => {
        setIsModalOpen(false);
        setIsGroupModalOpen(false);
    };
    
    const enrichedClasses = classes.map(cls => {
        let teacherNames = '';
        if (settings.schoolLevel === 'elementary') {
            teacherNames = formatFullName(teachers.find(t => t.id === cls.teacherId)) || 'ندارد';
        } else {
            const assignedTeachers = teachers.filter(t => t.classIds?.includes(cls.id));
            teacherNames = assignedTeachers.length > 0 ? assignedTeachers.map(formatFullName).join('، ') : 'ندارد';
        }

        return {
            ...cls,
            teacherName: teacherNames,
            studentCount: students.filter(s => s.classId === cls.id).length
        };
    });

    const { items: sortedClasses, requestSort, sortConfig } = useSortableData(enrichedClasses, [{ key: 'name', direction: 'ascending' }]);

    return (
        <>
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold">مدیریت کلاس ها</h2>
                    <div className="flex gap-2">
                         <button onClick={handleGroupAdd} className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition text-sm">ثبت گروهی</button>
                        <button onClick={handleAdd} className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition text-sm">افزودن کلاس</button>
                    </div>
                </div>
                 <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right bg-white rounded-lg shadow-md">
                        <thead className="bg-gray-50">
                            <tr>
                                {/* FIX: Add missing children prop */}
                                <SortableHeader sortKey="name" requestSort={requestSort} sortConfig={sortConfig}>نام کلاس</SortableHeader>
                                {/* FIX: Add missing children prop */}
                                <SortableHeader sortKey="teacherName" requestSort={requestSort} sortConfig={sortConfig}>معلم</SortableHeader>
                                {/* FIX: Add missing children prop */}
                                <SortableHeader sortKey="studentCount" requestSort={requestSort} sortConfig={sortConfig}>تعداد دانش آموزان</SortableHeader>
                                <th className="px-4 py-3">دروس</th>
                                <th className="px-4 py-3">اقدامات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {sortedClasses.map(cls => (
                                <tr key={cls.id}>
                                    <td className="px-4 py-3 font-semibold">{cls.name}</td>
                                    <td className="px-4 py-3">{cls.teacherName}</td>
                                    <td className="px-4 py-3">{toPersianDigits(cls.studentCount)}</td>
                                    <td className="px-4 py-3 text-xs">{cls.subjects.join('، ')}</td>
                                    <td className="px-4 py-3 text-xs">
                                        <button onClick={() => handleEdit(cls)} className="font-medium text-blue-600 hover:underline mr-2">ویرایش</button>
                                        <button onClick={() => deleteClass(cls.id)} className="font-medium text-red-600 hover:underline">حذف</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <ClassModal
                    classToEdit={classToEdit}
                    teachers={teachers}
                    onClose={closeModal}
                    onSubmit={(cls) => { saveClass(cls); closeModal(); }}
                />
            )}
            {isGroupModalOpen && (
                <GroupClassModal
                    onClose={closeModal}
                    onImport={importClasses}
                />
            )}
        </>
    );
};

export default ClassesTab;
