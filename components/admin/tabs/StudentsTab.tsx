import React, { useState, useEffect, useMemo } from 'react';
import type { Student, SchoolClass, Grade, Attendance, DisciplinaryIncident, Teacher, PTAMeeting, PTAAttendance, FinancialBill, Payment, UpcomingEvent, Responsibility, ResponsibilityAssignment, AnecdotalRecord, ParentMeeting, Badge, AwardedBadge, DescriptiveGrade, Admin } from '../../../types';
import { useSortableData } from '../../common/useSortableData';
import { SortableHeader } from '../../common/SortableHeader';
import { formatFullName, toPersianDigits } from '../../common/formatters';
import { useSettings, useData } from '../../../App';
import StudentProfileModal from '../../common/StudentProfileModal';

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
const ThemedTextarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = (props) => (
    <textarea
        {...props}
        className={`w-full mt-1 px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[var(--primary-500)] focus:border-[var(--primary-500)] ${props.className}`}
        style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)', ...props.style }}
    />
);
// #endregion

// #region Modals
interface StudentModalProps {
    studentToEdit: Student | null;
    classes: SchoolClass[];
    onClose: () => void;
    onSubmit: (student: Student) => void;
}

const getInitialStudentData = (): Partial<Student> => ({
    firstName: '', lastName: '', classId: '', nationalId: '', dateOfBirth: '',
    nationality: 'ایرانی', religion: 'اسلام', dominantHand: 'راست دست',
    birthCert: { serial: '', series: '', row: '' },
    placeOfBirth: '', placeOfIssue: '',
    health: { basicInsurance: '', suppInsurance: '', illnessDescription: 'ندارد' },
    family: {
        status: 'با خانواده زندگی می‌کند', totalChildren: 1, birthOrder: 1,
        father: { fullName: '', nationalId: '', nationality: 'ایرانی', occupation: '', educationLevel: '', fieldOfStudy: '' },
        mother: { fullName: '', nationalId: '', nationality: 'ایرانی', occupation: '', educationLevel: '', fieldOfStudy: '' },
    },
    contact: {
        fatherPhone: '', motherPhone: '', virtualPhone: '', homePhone: '',
        emergency: { phone: '', owner: '' },
        address: '', postalCode: '',
    },
    naseebData: {},
    profilePictureUrl: '',
});

const StudentModal: React.FC<StudentModalProps> = ({ studentToEdit, classes, onClose, onSubmit }) => {
    const { settings } = useSettings();
    const [studentData, setStudentData] = useState<Partial<Student>>(getInitialStudentData());
    const [activeTab, setActiveTab] = useState('personal');

    useEffect(() => {
        if (studentToEdit) {
            setStudentData(JSON.parse(JSON.stringify(studentToEdit))); // Deep copy to avoid mutation
        } else {
            const initialData = getInitialStudentData();
            // Initialize naseeb data based on settings
            initialData.naseebData = settings.naseebChartComponents.reduce((acc, comp) => {
                acc[comp] = { description: '', scores: [] };
                return acc;
            }, {} as Student['naseebData']);
            setStudentData(initialData);
        }
    }, [studentToEdit, settings.naseebChartComponents]);
    
    // Utility for safely updating nested state
    const handleDataChange = (path: string, value: any) => {
        setStudentData(prev => {
            const newState = JSON.parse(JSON.stringify(prev)); // Deep copy
            let current = newState;
            const keys = path.split('.');
            for (let i = 0; i < keys.length - 1; i++) {
                const key = keys[i];
                current[key] = current[key] || {};
                current = current[key];
            }
            current[keys[keys.length - 1]] = value;
            return newState;
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const selectedClass = classes.find(c => c.id === studentData.classId);
        if (!studentData.firstName || !studentData.lastName || !studentData.classId || !selectedClass) {
            alert('لطفا نام، نام خانوادگی و کلاس را به درستی وارد کنید.');
            setActiveTab('personal');
            return;
        }
        
        const finalStudentData: Student = {
            ...getInitialStudentData(),
            ...studentData,
            id: studentToEdit ? studentToEdit.id : `s${Date.now()}`,
            className: selectedClass.name,
        } as Student;

        onSubmit(finalStudentData);
    };

    const tabs = [
        { id: 'personal', label: 'اطلاعات دانش‌آموز' },
        { id: 'family', label: 'اطلاعات خانواده' },
        { id: 'contact', label: 'اطلاعات تماس' },
        { id: 'health', label: 'سایر اطلاعات' },
    ];
    
    const renderActiveTab = () => {
        switch(activeTab) {
            case 'personal': return (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-1"><label>نام</label><ThemedInput value={studentData.firstName} onChange={e => handleDataChange('firstName', e.target.value)} required /></div>
                    <div className="md:col-span-1"><label>نام خانوادگی</label><ThemedInput value={studentData.lastName} onChange={e => handleDataChange('lastName', e.target.value)} required /></div>
                    <div className="md:col-span-1"><label>کلاس</label><ThemedSelect value={studentData.classId} onChange={e => handleDataChange('classId', e.target.value)} required><option value="">انتخاب...</option>{classes.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</ThemedSelect></div>
                    <div className="md:col-span-1"><label>تاریخ تولد</label><ThemedInput value={studentData.dateOfBirth} onChange={e => handleDataChange('dateOfBirth', e.target.value)} placeholder="1394-01-01" /></div>
                    <div className="md:col-span-2"><label>کد ملی</label><ThemedInput value={studentData.nationalId} onChange={e => handleDataChange('nationalId', e.target.value)} required /></div>
                    <div className="md:col-span-1"><label>سریال شناسنامه</label><ThemedInput value={studentData.birthCert?.serial} onChange={e => handleDataChange('birthCert.serial', e.target.value)} /></div>
                    <div className="md:col-span-1"><label>سری شناسنامه</label><ThemedInput value={studentData.birthCert?.series} onChange={e => handleDataChange('birthCert.series', e.target.value)} /></div>
                    <div className="md:col-span-1"><label>ردیف شناسنامه</label><ThemedInput value={studentData.birthCert?.row} onChange={e => handleDataChange('birthCert.row', e.target.value)} /></div>
                    <div className="md:col-span-1"><label>محل تولد</label><ThemedInput value={studentData.placeOfBirth} onChange={e => handleDataChange('placeOfBirth', e.target.value)} /></div>
                    <div className="md:col-span-1"><label>محل صدور</label><ThemedInput value={studentData.placeOfIssue} onChange={e => handleDataChange('placeOfIssue', e.target.value)} /></div>
                    <div className="md:col-span-1"><label>ملیت</label><ThemedInput value={studentData.nationality} onChange={e => handleDataChange('nationality', e.target.value)} /></div>
                    <div className="md:col-span-3">
                        <label>آدرس تصویر پروفایل (URL)</label>
                        <div className="flex items-center gap-4 mt-1">
                            <ThemedInput
                                value={studentData.profilePictureUrl || ''}
                                onChange={e => handleDataChange('profilePictureUrl', e.target.value)}
                                placeholder="https://example.com/image.jpg"
                                className="flex-grow"
                            />
                            <div className="w-20 h-20 rounded-full bg-gray-200 overflow-hidden flex-shrink-0 border-2 border-white shadow-md flex items-center justify-center">
                                {studentData.profilePictureUrl ? (
                                    <img src={studentData.profilePictureUrl} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-gray-400 text-3xl">?</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            );
            case 'family': return(
                <div className="space-y-6">
                    <div>
                        <h4 className="font-semibold text-lg mb-2 border-b pb-1">اطلاعات پدر</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div><label>نام و نام خانوادگی</label><ThemedInput value={studentData.family?.father?.fullName} onChange={e => handleDataChange('family.father.fullName', e.target.value)} /></div>
                            <div><label>کد ملی</label><ThemedInput value={studentData.family?.father?.nationalId} onChange={e => handleDataChange('family.father.nationalId', e.target.value)} /></div>
                            <div><label>ملیت</label><ThemedInput value={studentData.family?.father?.nationality} onChange={e => handleDataChange('family.father.nationality', e.target.value)} /></div>
                            <div><label>شغل</label><ThemedInput value={studentData.family?.father?.occupation} onChange={e => handleDataChange('family.father.occupation', e.target.value)} /></div>
                            <div><label>مدرک تحصیلی</label><ThemedInput value={studentData.family?.father?.educationLevel} onChange={e => handleDataChange('family.father.educationLevel', e.target.value)} /></div>
                            <div><label>رشته تحصیلی</label><ThemedInput value={studentData.family?.father?.fieldOfStudy} onChange={e => handleDataChange('family.father.fieldOfStudy', e.target.value)} /></div>
                        </div>
                    </div>
                     <div>
                        <h4 className="font-semibold text-lg mb-2 border-b pb-1">اطلاعات مادر</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div><label>نام و نام خانوادگی</label><ThemedInput value={studentData.family?.mother?.fullName} onChange={e => handleDataChange('family.mother.fullName', e.target.value)} /></div>
                            <div><label>کد ملی</label><ThemedInput value={studentData.family?.mother?.nationalId} onChange={e => handleDataChange('family.mother.nationalId', e.target.value)} /></div>
                            <div><label>ملیت</label><ThemedInput value={studentData.family?.mother?.nationality} onChange={e => handleDataChange('family.mother.nationality', e.target.value)} /></div>
                            <div><label>شغل</label><ThemedInput value={studentData.family?.mother?.occupation} onChange={e => handleDataChange('family.mother.occupation', e.target.value)} /></div>
                            <div><label>مدرک تحصیلی</label><ThemedInput value={studentData.family?.mother?.educationLevel} onChange={e => handleDataChange('family.mother.educationLevel', e.target.value)} /></div>
                            <div><label>رشته تحصیلی</label><ThemedInput value={studentData.family?.mother?.fieldOfStudy} onChange={e => handleDataChange('family.mother.fieldOfStudy', e.target.value)} /></div>
                        </div>
                    </div>
                </div>
            );
            case 'contact': return (
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div><label>شماره تماس پدر</label><ThemedInput value={studentData.contact?.fatherPhone} onChange={e => handleDataChange('contact.fatherPhone', e.target.value)} /></div>
                    <div><label>شماره تماس مادر</label><ThemedInput value={studentData.contact?.motherPhone} onChange={e => handleDataChange('contact.motherPhone', e.target.value)} /></div>
                    <div><label>شماره تماس مجازی</label><ThemedInput value={studentData.contact?.virtualPhone} onChange={e => handleDataChange('contact.virtualPhone', e.target.value)} /></div>
                    <div><label>شماره منزل</label><ThemedInput value={studentData.contact?.homePhone} onChange={e => handleDataChange('contact.homePhone', e.target.value)} /></div>
                    <div><label>شماره ضروری</label><ThemedInput value={studentData.contact?.emergency?.phone} onChange={e => handleDataChange('contact.emergency.phone', e.target.value)} /></div>
                    <div><label>صاحب شماره ضروری</label><ThemedInput value={studentData.contact?.emergency?.owner} onChange={e => handleDataChange('contact.emergency.owner', e.target.value)} /></div>
                    <div className="md:col-span-2"><label>نشانی منزل</label><ThemedInput value={studentData.contact?.address} onChange={e => handleDataChange('contact.address', e.target.value)} /></div>
                    <div><label>کد پستی</label><ThemedInput value={studentData.contact?.postalCode} onChange={e => handleDataChange('contact.postalCode', e.target.value)} /></div>
                 </div>
            );
            case 'health': return (
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div><label>وضعیت خانواده</label><ThemedInput value={studentData.family?.status} onChange={e => handleDataChange('family.status', e.target.value)} /></div>
                    <div><label>تعداد فرزندان</label><ThemedInput type="number" value={studentData.family?.totalChildren || ''} onChange={e => handleDataChange('family.totalChildren', Number(e.target.value))} /></div>
                    <div><label>فرزند چندم</label><ThemedInput type="number" value={studentData.family?.birthOrder || ''} onChange={e => handleDataChange('family.birthOrder', Number(e.target.value))} /></div>
                    <div><label>دست غالب</label><ThemedSelect value={studentData.dominantHand} onChange={e => handleDataChange('dominantHand', e.target.value)}><option>راست دست</option><option>چپ دست</option><option>هر دو</option></ThemedSelect></div>
                    <div><label>بیمه پایه</label><ThemedInput value={studentData.health?.basicInsurance} onChange={e => handleDataChange('health.basicInsurance', e.target.value)} /></div>
                    <div><label>بیمه تکمیلی</label><ThemedInput value={studentData.health?.suppInsurance} onChange={e => handleDataChange('health.suppInsurance', e.target.value)} /></div>
                    <div className="md:col-span-3"><label>مشکل یا بیماری خاص</label><ThemedTextarea value={studentData.health?.illnessDescription} onChange={e => handleDataChange('health.illnessDescription', e.target.value)} rows={2} /></div>
                 </div>
            );
            default: return null;
        }
    };

    return (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-4 text-[var(--text-primary)]">{studentToEdit ? 'ویرایش' : 'افزودن'} دانش آموز</h2>
                <div className="border-b border-gray-200 mb-4">
                    <div className="overflow-x-auto">
                        <nav className="-mb-px flex space-x-4 space-x-reverse" aria-label="Tabs">
                            {tabs.map(tab => (
                                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                                    className={`${activeTab === tab.id ? 'border-[var(--primary-500)] text-[var(--primary-600)]' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                                    whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors`}>
                                    {tab.label}
                                </button>
                            ))}
                        </nav>
                    </div>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4 flex-grow overflow-y-auto pr-2">
                    <div className="p-1">
                        {renderActiveTab()}
                    </div>
                    <div className="flex justify-end gap-4 pt-4 sticky bottom-0 bg-white">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition">انصراف</button>
                        <button type="submit" className="px-4 py-2 bg-[var(--primary-600)] text-white rounded-md hover:bg-[var(--primary-700)] transition">{studentToEdit ? 'ذخیره تغییرات' : 'افزودن'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

interface BulkStudentImportModalProps {
    classes: SchoolClass[];
    onClose: () => void;
    onImport: (newStudents: Student[]) => void;
}
const BulkStudentImportModal: React.FC<BulkStudentImportModalProps> = ({ classes, onClose, onImport }) => {
    const { settings } = useSettings();
    const [textData, setTextData] = useState('');
    const [parsedData, setParsedData] = useState<{ valid: Student[], invalid: string[] }>({ valid: [], invalid: [] });

    const handleParse = () => {
        const lines = textData.split('\n').filter(line => line.trim() !== '');
        const valid: Student[] = [];
        const invalid: string[] = [];
        const classMap = new Map(classes.map(c => [c.name, c.id]));
        
        const defaultNaseebData = settings.naseebChartComponents.reduce((acc, comp) => {
            acc[comp] = { description: '', scores: [] };
            return acc;
        }, {} as Student['naseebData']);

        lines.forEach((line, index) => {
            const cols = line.split('\t').map(s => s.trim());
            const [
                firstName, lastName, dateOfBirth, className, nationalId,
                birthCertSerial, birthCertSeries, birthCertRow, placeOfBirth, placeOfIssue,
                nationality, religion, dominantHand, basicInsurance, suppInsurance,
                illnessDescription, familyStatus, totalChildren, birthOrder,
                fatherFullName, fatherNationalId, fatherNationality, fatherOccupation, fatherEdu, fatherField,
                motherFullName, motherNationalId, motherNationality, motherOccupation, motherEdu, motherField,
                fatherPhone, motherPhone, virtualPhone, homePhone,
                emergencyPhone, emergencyOwner, address, postalCode
            ] = cols;

            const classId = classMap.get(className);

            if (firstName && lastName && className && classId) {
                valid.push({
                    id: `s-bulk-${Date.now()}-${index}`,
                    firstName, lastName, classId, className, nationalId,
                    dateOfBirth, nationality, religion, dominantHand: dominantHand as any, placeOfBirth, placeOfIssue,
                    birthCert: { serial: birthCertSerial, series: birthCertSeries, row: birthCertRow },
                    health: { basicInsurance, suppInsurance, illnessDescription },
                    family: {
                        status: familyStatus,
                        totalChildren: Number(totalChildren) || undefined,
                        birthOrder: Number(birthOrder) || undefined,
                        father: { fullName: fatherFullName, nationalId: fatherNationalId, nationality: fatherNationality, occupation: fatherOccupation, educationLevel: fatherEdu, fieldOfStudy: fatherField },
                        mother: { fullName: motherFullName, nationalId: motherNationalId, nationality: motherNationality, occupation: motherOccupation, educationLevel: motherEdu, fieldOfStudy: motherField },
                    },
                    contact: {
                        fatherPhone, motherPhone, virtualPhone, homePhone,
                        emergency: { phone: emergencyPhone, owner: emergencyOwner },
                        address, postalCode
                    },
                    naseebData: defaultNaseebData,
                } as Student);
            } else {
                invalid.push(`خط ${index + 1}: ${line.substring(0, 50)}... (نام، نام خانوادگی یا کلاس نامعتبر است)`);
            }
        });
        setParsedData({ valid, invalid });
    };

    const handleImport = () => {
        if (parsedData.valid.length > 0) {
            onImport(parsedData.valid);
            onClose();
        }
    };
    
    const excelColumns = "نام	نام خانوادگی	تاریخ تولد	کلاس	کد ملی	سریال شناسنامه	سری شناسنامه	ردیف شناسنامه	محل تولد	محل صدور	ملیت	دین و مذهب	دست غالب	بیمه پایه	بیمه تکمیلی	بیماری خاص	وضعیت خانواده	تعداد فرزندان	فرزند چندم	نام پدر	کد ملی پدر	ملیت پدر	شغل پدر	تحصیلات پدر	رشته پدر	نام مادر	کد ملی مادر	ملیت مادر	شغل مادر	تحصیلات مادر	رشته مادر	تماس پدر	تماس مادر	تماس مجازی	تماس منزل	تماس ضروری	صاحب تماس ضروری	نشانی	کد پستی";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl relative" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-4 text-[var(--text-primary)]">ورود عمده دانش آموزان (از Excel)</h2>
                <p className="text-sm text-gray-600 mb-2">اطلاعات را مطابق ستون‌های زیر از فایل اکسل کپی کرده و در کادر زیر جای‌گذاری کنید. هر دانش‌آموز در یک ردیف مجزا باشد.</p>
                <p className="text-xs text-red-600 mb-4 font-mono bg-gray-100 p-2 rounded break-words">{excelColumns.replace(/\t/g, ' <--> ')}</p>
                <div className="relative">
                    <ThemedTextarea
                        value={textData}
                        onChange={e => setTextData(e.target.value)}
                        rows={8}
                        className="w-full p-2 border rounded font-mono text-sm"
                        placeholder="علی	ثابت	1394-04-17	چهارم سعدی-خانم عطایی	..."
                    />
                </div>
                <div className="my-4 relative"><button onClick={handleParse} className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition">پردازش اطلاعات</button></div>
                { (parsedData.valid.length > 0 || parsedData.invalid.length > 0) &&
                    <div className="space-y-3 max-h-48 overflow-y-auto border p-3 rounded relative">
                        {parsedData.valid.length > 0 && <p className="text-green-600 font-semibold">{parsedData.valid.length} دانش آموز معتبر یافت شد.</p>}
                        {parsedData.invalid.length > 0 && <div>
                            <p className="text-red-600 font-semibold">{parsedData.invalid.length} ردیف نامعتبر:</p>
                            <ul className="text-xs text-red-500 list-disc pr-4">
                                {parsedData.invalid.map((err, i) => <li key={i}>{err}</li>)}
                            </ul>
                        </div>}
                    </div>
                }
                <div className="flex justify-end gap-4 pt-4 relative">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition">انصراف</button>
                    <button onClick={handleImport} disabled={parsedData.valid.length === 0} className="px-4 py-2 bg-[var(--primary-600)] text-white rounded-md hover:bg-[var(--primary-700)] transition disabled:bg-gray-400">افزودن {toPersianDigits(parsedData.valid.length)} دانش آموز</button>
                </div>
            </div>
        </div>
    );
};

// #endregion

// Helper function to generate a placeholder image blob
const generatePlaceholderImage = (student: Student): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const size = 150;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
            return reject(new Error('Canvas context not available'));
        }

        // A simple hash function to get a color from the student's name
        let hash = 0;
        const name = formatFullName(student);
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        const color = `hsl(${hash % 360}, 50%, 70%)`;

        // Background
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, size, size);

        // Text (initials)
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 60px Vazirmatn';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const initials = `${student.firstName.charAt(0)}${student.lastName.charAt(0)}`;
        ctx.fillText(initials, size / 2, size / 2);
        
        canvas.toBlob(blob => {
            if (blob) {
                resolve(blob);
            } else {
                reject(new Error('Canvas toBlob failed'));
            }
        }, 'image/png');
    });
};

interface ImageExportModalProps {
    onClose: () => void;
    onExport: (namingScheme: 'name' | 'nationalId' | 'random') => void;
    studentCount: number;
}
const ImageExportModal: React.FC<ImageExportModalProps> = ({ onClose, onExport, studentCount }) => {
    const [namingScheme, setNamingScheme] = useState<'name' | 'nationalId' | 'random'>('name');

    const handleExport = () => {
        onExport(namingScheme);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md relative" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-4 text-[var(--text-primary)]">خروجی تصاویر</h2>
                <p className="text-sm text-gray-600 mb-4">
                    شما در حال خروجی گرفتن از تصویر {toPersianDigits(studentCount)} دانش آموز انتخاب شده هستید.
                    قالب نام فایل‌های خروجی را انتخاب کنید.
                </p>
                <div className="space-y-3">
                    <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                        <input type="radio" name="naming-scheme" value="name" checked={namingScheme === 'name'} onChange={() => setNamingScheme('name')} className="h-4 w-4 text-[var(--primary-600)] focus:ring-[var(--primary-500)]" />
                        <div>
                            <span className="font-semibold">بر اساس نام</span>
                            <p className="text-xs text-gray-500">مثال: محمدی-علی.jpg</p>
                        </div>
                    </label>
                    <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                        <input type="radio" name="naming-scheme" value="nationalId" checked={namingScheme === 'nationalId'} onChange={() => setNamingScheme('nationalId')} className="h-4 w-4 text-[var(--primary-600)] focus:ring-[var(--primary-500)]" />
                        <div>
                            <span className="font-semibold">بر اساس کد ملی</span>
                            <p className="text-xs text-gray-500">مثال: 0123456789.jpg</p>
                        </div>
                    </label>
                    <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                        <input type="radio" name="naming-scheme" value="random" checked={namingScheme === 'random'} onChange={() => setNamingScheme('random')} className="h-4 w-4 text-[var(--primary-600)] focus:ring-[var(--primary-500)]" />
                        <div>
                            <span className="font-semibold">نام تصادفی</span>
                             <p className="text-xs text-gray-500">مثال: f8c3-4d5a.jpg</p>
                        </div>
                    </label>
                </div>
                 <p className="text-xs text-gray-500 mt-4">توجه: مرورگر شما ممکن است برای دانلود چندین فایل به صورت همزمان از شما اجازه بگیرد.</p>
                <div className="flex justify-end gap-4 pt-4 mt-4 border-t">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition">انصراف</button>
                    <button onClick={handleExport} className="px-4 py-2 bg-[var(--primary-600)] text-white rounded-md hover:bg-[var(--primary-700)] transition">دانلود</button>
                </div>
            </div>
        </div>
    );
};

interface StudentsTabProps {
    students: Student[];
    classes: SchoolClass[];
    grades: Grade[];
    attendance: Attendance[];
    disciplineIncidents: DisciplinaryIncident[];
    teachers: Teacher[];
    admins: Admin[];
    saveStudent: (student: Student) => void;
    importStudents: (newStudents: Student[]) => void;
    deleteStudent: (id: string) => void;
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

const StudentsTab: React.FC<StudentsTabProps> = (props) => {
    const { 
        students, classes, saveStudent, importStudents, deleteStudent, 
        grades, attendance, disciplineIncidents, teachers, admins,
        ptaMeetings, ptaAttendance, financialBills, payments, events,
        responsibilities, responsibilityAssignments, anecdotalRecords,
        parentMeetings, badges, awardedBadges
    } = props;
    const [nameFilter, setNameFilter] = useState('');
    const [classFilter, setClassFilter] = useState('');
    const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const [profileStudent, setProfileStudent] = useState<Student | null>(null);
    const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    
    const filteredStudents = useMemo(() => {
        return students.filter(student => 
            (nameFilter === '' || formatFullName(student).toLowerCase().includes(nameFilter.toLowerCase())) &&
            (classFilter === '' || student.classId === classFilter)
        );
    }, [students, nameFilter, classFilter]);

    const { items: sortedStudents, requestSort, sortConfig } = useSortableData(filteredStudents, [{ key: 'lastName', direction: 'ascending' }, { key: 'firstName', direction: 'ascending' }]);

    const handleAdd = () => {
        setStudentToEdit(null);
        setIsModalOpen(true);
    };
    const handleEdit = (student: Student) => {
        setStudentToEdit(student);
        setIsModalOpen(true);
    };
    const closeModal = () => {
        setIsModalOpen(false);
        setIsBulkModalOpen(false);
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedStudentIds(filteredStudents.map(s => s.id));
        } else {
            setSelectedStudentIds([]);
        }
    };

    const handleSelectOne = (studentId: string, isChecked: boolean) => {
        if (isChecked) {
            setSelectedStudentIds(prev => [...prev, studentId]);
        } else {
            setSelectedStudentIds(prev => prev.filter(id => id !== studentId));
        }
    };

    const handleExportImages = async (namingScheme: 'name' | 'nationalId' | 'random') => {
        const selectedStudents = students.filter(s => selectedStudentIds.includes(s.id));

        if (selectedStudents.length === 0) {
            alert('دانش آموزی برای خروجی گرفتن انتخاب نشده است.');
            return;
        }
        
        const blobToDataURL = (blob: Blob): Promise<string> => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = (error) => reject(error);
                reader.readAsDataURL(blob);
            });
        };

        let processedCount = 0;
        let errorCount = 0;

        for (const student of selectedStudents) {
            try {
                let blob: Blob | null = null;
                // Try fetching the image first
                if (student.profilePictureUrl) {
                    try {
                        const response = await fetch(student.profilePictureUrl);
                        if (!response.ok) {
                             console.warn(`Failed to fetch image for ${formatFullName(student)}, falling back to placeholder.`);
                        } else {
                            blob = await response.blob();
                        }
                    } catch (fetchError) {
                         console.warn(`Fetch error for ${formatFullName(student)}: ${fetchError}. Falling back to placeholder.`);
                    }
                }
                
                // If fetch failed or no URL, generate a placeholder
                if (!blob) {
                    blob = await generatePlaceholderImage(student);
                }

                const dataUrl = await blobToDataURL(blob);
                const link = document.createElement('a');

                const mimeType = blob.type;
                let extension = 'png'; // Default to png for placeholder
                if (mimeType === 'image/jpeg') extension = 'jpg';
                else if (mimeType === 'image/png') extension = 'png';
                else if (mimeType === 'image/gif') extension = 'gif';
                else if (mimeType === 'image/webp') extension = 'webp';
                
                let filename = '';
                switch (namingScheme) {
                    case 'name':
                        filename = `${student.lastName}-${student.firstName}.${extension}`;
                        break;
                    case 'nationalId':
                        filename = `${student.nationalId}.${extension}`;
                        break;
                    case 'random':
                        filename = `${crypto.randomUUID().substring(0, 8)}.${extension}`;
                        break;
                }

                link.href = dataUrl;
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                processedCount++;
            } catch (error) {
                errorCount++;
                console.error(`Could not process image for ${formatFullName(student)}:`, error);
            }
        }
        
        if (processedCount > 0) {
            alert(`${toPersianDigits(processedCount)} تصویر با موفقیت برای دانلود آماده شد.`);
        }
        if (errorCount > 0) {
            alert(`خطا در پردازش ${toPersianDigits(errorCount)} تصویر. لطفاً کنسول را برای جزئیات بررسی کنید.`);
        }
        
        setSelectedStudentIds([]); // Clear selection after export
    };

    return (
        <>
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold">مدیریت دانش آموزان</h2>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setIsExportModalOpen(true)} 
                            disabled={selectedStudentIds.length === 0}
                            className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition text-sm disabled:bg-gray-400 disabled:cursor-not-allowed">
                            خروجی تصاویر ({toPersianDigits(selectedStudentIds.length)})
                        </button>
                        <button onClick={() => setIsBulkModalOpen(true)} className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition text-sm">ورود عمده</button>
                        <button onClick={handleAdd} className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition text-sm">افزودن دانش آموز</button>
                    </div>
                </div>

                <div className="flex gap-4 p-4 bg-gray-50 rounded-lg border">
                    <input type="text" placeholder="جستجو بر اساس نام..." value={nameFilter} onChange={e => setNameFilter(e.target.value)} className="w-full px-3 py-2 border rounded-lg shadow-sm" />
                    <select value={classFilter} onChange={e => setClassFilter(e.target.value)} className="w-full px-3 py-2 border rounded-lg shadow-sm">
                        <option value="">همه کلاس ها</option>
                        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right bg-white rounded-lg shadow-md">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3">
                                    <input 
                                        type="checkbox"
                                        onChange={handleSelectAll}
                                        checked={filteredStudents.length > 0 && selectedStudentIds.length === filteredStudents.length}
                                        ref={el => { if (el) { el.indeterminate = selectedStudentIds.length > 0 && selectedStudentIds.length < filteredStudents.length; } }}
                                        className="h-4 w-4 rounded text-[var(--primary-600)] focus:ring-[var(--primary-500)]"
                                    />
                                </th>
                                <th className="px-4 py-3">تصویر</th>
                                {/* FIX: Add missing children prop */}
                                <SortableHeader sortKey="lastName" requestSort={requestSort} sortConfig={sortConfig}>نام خانوادگی</SortableHeader>
                                {/* FIX: Add missing children prop */}
                                <SortableHeader sortKey="firstName" requestSort={requestSort} sortConfig={sortConfig}>نام</SortableHeader>
                                {/* FIX: Add missing children prop */}
                                <SortableHeader sortKey="className" requestSort={requestSort} sortConfig={sortConfig}>کلاس</SortableHeader>
                                <th className="px-4 py-3">اقدامات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {sortedStudents.map(student => (
                                <tr key={student.id}>
                                    <td className="px-4 py-3">
                                        <input 
                                            type="checkbox" 
                                            checked={selectedStudentIds.includes(student.id)}
                                            onChange={(e) => handleSelectOne(student.id, e.target.checked)}
                                            className="h-4 w-4 rounded text-[var(--primary-600)] focus:ring-[var(--primary-500)]"
                                        />
                                    </td>
                                    <td className="px-4 py-3">
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
                                    <td className="px-4 py-3 font-semibold">{student.lastName}</td>
                                    <td className="px-4 py-3 font-semibold">{student.firstName}</td>
                                    <td className="px-4 py-3">{student.className}</td>
                                    <td className="px-4 py-3 text-xs">
                                        <button onClick={() => setProfileStudent(student)} className="font-medium text-green-600 hover:underline mr-2">پرونده</button>
                                        <button onClick={() => handleEdit(student)} className="font-medium text-blue-600 hover:underline mr-2">ویرایش</button>
                                        <button onClick={() => deleteStudent(student.id)} className="font-medium text-red-600 hover:underline">حذف</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <StudentModal 
                    studentToEdit={studentToEdit} 
                    classes={classes} 
                    onClose={closeModal} 
                    onSubmit={(student) => { saveStudent(student); closeModal(); }} 
                />
            )}
            {isBulkModalOpen && (
                <BulkStudentImportModal
                    classes={classes}
                    onClose={closeModal}
                    onImport={(newStudents) => { importStudents(newStudents); closeModal(); }}
                />
            )}
            {profileStudent && (
                 <StudentProfileModal
                    student={profileStudent}
                    viewerRole="admin"
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
            {isExportModalOpen && (
                <ImageExportModal
                    onClose={() => setIsExportModalOpen(false)}
                    onExport={handleExportImages}
                    studentCount={selectedStudentIds.length}
                />
            )}
        </>
    );
};

export default StudentsTab;
