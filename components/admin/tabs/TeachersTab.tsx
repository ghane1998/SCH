

import React, { useState, useEffect } from 'react';
import type { Teacher, SchoolClass } from '../../../types';
import { useSortableData } from '../../common/useSortableData';
import { SortableHeader } from '../../common/SortableHeader';
import { formatFullName } from '../../common/formatters';
import { useSettings } from '../../../App';

// #region Helper Components
const ThemedInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
    <input 
        {...props} 
        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[var(--primary-500)] focus:border-[var(--primary-500)] ${props.className}`} 
        style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)', ...props.style }}
    />
);
// #endregion

// #region Modals
interface TeacherModalProps {
    teacherToEdit: Teacher | null;
    classes: SchoolClass[];
    teachers: Teacher[];
    onClose: () => void;
    onSubmit: (teacher: Teacher, assignedClassIds: string[]) => void;
}
const TeacherModal: React.FC<TeacherModalProps> = ({ teacherToEdit, classes, teachers, onClose, onSubmit }) => {
    const { settings } = useSettings();
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);

    useEffect(() => {
        if(teacherToEdit) {
            setFirstName(teacherToEdit.firstName);
            setLastName(teacherToEdit.lastName);
            // Include classes where the teacher is actively assigned
            const teacherClasses = classes.filter(c => c.teacherId === teacherToEdit.id || teacherToEdit.classIds?.includes(c.id)).map(c => c.id);
            setSelectedClassIds(Array.from(new Set(teacherClasses)));
        } else {
            setFirstName('');
            setLastName('');
            setSelectedClassIds([]);
        }
    }, [teacherToEdit, classes]);
    
    const handleClassToggle = (classId: string) => {
        setSelectedClassIds(prev => prev.includes(classId) ? prev.filter(id => id !== classId) : [...prev, classId]);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!firstName || !lastName) {
            alert('لطفا نام و نام خانوادگی معلم را وارد کنید.');
            return;
        }
        const newTeacher: Teacher = {
            id: teacherToEdit ? teacherToEdit.id : `t${Date.now()}`,
            firstName,
            lastName,
            classIds: selectedClassIds
        };
        onSubmit(newTeacher, selectedClassIds);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg relative" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-4 text-[var(--text-primary)]">{teacherToEdit ? 'ویرایش' : 'افزودن'} معلم</h2>
                <form onSubmit={handleSubmit} className="space-y-4 relative">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="relative"><label htmlFor="teacherFirstName" className="block text-sm font-medium text-[var(--text-secondary)]">نام</label><ThemedInput type="text" id="teacherFirstName" value={firstName} onChange={e => setFirstName(e.target.value)} required /></div>
                        <div className="relative"><label htmlFor="teacherLastName" className="block text-sm font-medium text-[var(--text-secondary)]">نام خانوادگی</label><ThemedInput type="text" id="teacherLastName" value={lastName} onChange={e => setLastName(e.target.value)} required /></div>
                    </div>
                    <div className="relative">
                        <label className="block text-sm font-medium text-[var(--text-secondary)]">اختصاص کلاس</label>
                        <div className="mt-2 grid grid-cols-2 gap-2 border p-3 rounded-md max-h-48 overflow-y-auto" style={{borderColor: 'var(--input-border)'}}>
                            {classes.map(cls => {
                                const isAssignedToOther = settings.schoolLevel === 'elementary' 
                                    ? (cls.teacherId && cls.teacherId !== teacherToEdit?.id)
                                    : false;
                                
                                const teacher = teachers.find(t => t.id === cls.teacherId);
                                const otherTeacherName = formatFullName(teacher);
                                
                                return (
                                    <div key={cls.id}>
                                        <label className={`flex items-center p-2 rounded-md ${isAssignedToOther ? 'cursor-not-allowed bg-gray-200' : 'cursor-pointer hover:bg-indigo-50'}`}>
                                            <input
                                                type="checkbox"
                                                checked={selectedClassIds.includes(cls.id)}
                                                onChange={() => handleClassToggle(cls.id)}
                                                disabled={isAssignedToOther}
                                                className="h-4 w-4 text-[var(--primary-600)] border-gray-300 rounded focus:ring-[var(--primary-500)]"
                                            />
                                            <span className={`ml-2 text-sm ${isAssignedToOther ? 'text-gray-500' : 'text-gray-800'}`}>{cls.name}</span>
                                        </label>
                                        {isAssignedToOther && settings.schoolLevel === 'elementary' && <span className="text-xs text-gray-400 block ml-8">({otherTeacherName})</span>}
                                    </div>
                                );
                            })}
                        </div>
                         <p className="text-xs text-gray-500 mt-1">
                             {settings.schoolLevel === 'elementary' ? 'کلاس‌هایی که به معلم دیگری اختصاص داده شده‌اند، غیرفعال هستند.' : 'در دبیرستان می‌توانید یک کلاس را به چند معلم اختصاص دهید.'}
                         </p>
                    </div>
                    <div className="flex justify-end gap-4 pt-4 relative">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition">انصراف</button>
                        <button type="submit" className="px-4 py-2 bg-[var(--primary-600)] text-white rounded-md hover:bg-[var(--primary-700)] transition">{teacherToEdit ? 'ذخیره تغییرات' : 'افزودن'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

interface GroupTeacherModalProps {
    onClose: () => void;
    onImport: (newTeachers: Teacher[]) => void;
}
const GroupTeacherModal: React.FC<GroupTeacherModalProps> = ({ onClose, onImport }) => {
    const [teachersData, setTeachersData] = useState([{ id: 1, firstName: '', lastName: '' }]);

    const handleDataChange = (id: number, field: 'firstName' | 'lastName', value: string) => {
        setTeachersData(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
    };

    const addRow = () => {
        setTeachersData(prev => [...prev, { id: Date.now(), firstName: '', lastName: '' }]);
    };
    
    const removeRow = (id: number) => {
        setTeachersData(prev => prev.filter(t => t.id !== id));
    };

    const handleSubmit = () => {
        const validTeachers = teachersData
            .filter(t => t.firstName.trim() && t.lastName.trim())
            .map(({ firstName, lastName }, index) => ({
                id: `t-group-${Date.now()}-${index}`,
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                classIds: [],
            }));

        if (validTeachers.length > 0) {
            onImport(validTeachers);
            onClose();
        } else {
            alert('لطفا حداقل یک معلم را با نام و نام خانوادگی کامل وارد کنید.');
        }
    };

    return (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-4 text-[var(--text-primary)]">ثبت گروهی معلمان</h2>
                <div className="overflow-y-auto space-y-3 flex-grow pr-2">
                    {teachersData.map((teacher, index) => (
                        <div key={teacher.id} className="flex items-center gap-2">
                           <ThemedInput value={teacher.firstName} onChange={e => handleDataChange(teacher.id, 'firstName', e.target.value)} placeholder={`نام معلم ${index + 1}`} />
                           <ThemedInput value={teacher.lastName} onChange={e => handleDataChange(teacher.id, 'lastName', e.target.value)} placeholder={`نام خانوادگی معلم ${index + 1}`} />
                           <button onClick={() => removeRow(teacher.id)} className="p-2 text-red-500 hover:bg-red-100 rounded-full">&times;</button>
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

interface TeachersTabProps {
    teachers: Teacher[];
    classes: SchoolClass[];
    saveTeacher: (teacher: Teacher, classIds: string[]) => void;
    deleteTeacher: (id: string) => void;
    importTeachers: (teachers: Teacher[]) => void;
}

const TeachersTab: React.FC<TeachersTabProps> = ({ teachers, classes, saveTeacher, deleteTeacher, importTeachers }) => {
    const [teacherToEdit, setTeacherToEdit] = useState<Teacher | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);

    const handleAdd = () => {
        setTeacherToEdit(null);
        setIsModalOpen(true);
    };
    const handleEdit = (teacher: Teacher) => {
        setTeacherToEdit(teacher);
        setIsModalOpen(true);
    };
    const handleGroupAdd = () => {
        setIsGroupModalOpen(true);
    };
    const closeModal = () => {
        setIsModalOpen(false);
        setIsGroupModalOpen(false);
    };
    
    const enrichedTeachers = teachers.map(teacher => ({
        ...teacher,
        classNames: classes.filter(c => c.teacherId === teacher.id || teacher.classIds?.includes(c.id)).map(c => c.name).join(', ') || 'ندارد'
    }));

    const { items: sortedTeachers, requestSort, sortConfig } = useSortableData(enrichedTeachers, [{ key: 'lastName', direction: 'ascending' }, { key: 'firstName', direction: 'ascending' }]);

    return (
        <>
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold">مدیریت معلمان</h2>
                    <div className="flex gap-2">
                        <button onClick={handleGroupAdd} className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition text-sm">ثبت گروهی</button>
                        <button onClick={handleAdd} className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition text-sm">افزودن معلم</button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right bg-white rounded-lg shadow-md">
                        <thead className="bg-gray-50">
                            <tr>
                                {/* FIX: Add missing children prop */}
                                <SortableHeader sortKey="lastName" requestSort={requestSort} sortConfig={sortConfig}>نام خانوادگی</SortableHeader>
                                {/* FIX: Add missing children prop */}
                                <SortableHeader sortKey="firstName" requestSort={requestSort} sortConfig={sortConfig}>نام</SortableHeader>
                                <th className="px-4 py-3">کلاس ها</th>
                                <th className="px-4 py-3">اقدامات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {sortedTeachers.map(teacher => (
                                <tr key={teacher.id}>
                                    <td className="px-4 py-3 font-semibold">{teacher.lastName}</td>
                                    <td className="px-4 py-3 font-semibold">{teacher.firstName}</td>
                                    <td className="px-4 py-3 text-xs">{teacher.classNames}</td>
                                    <td className="px-4 py-3 text-xs">
                                        <button onClick={() => handleEdit(teacher)} className="font-medium text-blue-600 hover:underline mr-2">ویرایش</button>
                                        <button onClick={() => deleteTeacher(teacher.id)} className="font-medium text-red-600 hover:underline">حذف</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <TeacherModal
                    teacherToEdit={teacherToEdit}
                    classes={classes}
                    teachers={teachers}
                    onClose={closeModal}
                    onSubmit={(teacher, classIds) => { saveTeacher(teacher, classIds); closeModal(); }}
                />
            )}
            {isGroupModalOpen && (
                <GroupTeacherModal
                    onClose={closeModal}
                    onImport={importTeachers}
                />
            )}
        </>
    );
};

export default TeachersTab;
