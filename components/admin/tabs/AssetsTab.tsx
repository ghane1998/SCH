import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { Admin, Student, SchoolAsset, AssetAssignment, SchoolClass } from '../../../types';
import { useData } from '../../../App';
import Card from '../../common/Card';
import { useSortableData } from '../../common/useSortableData';
import { SortableHeader } from '../../common/SortableHeader';
import { formatFullName, toPersianDigits } from '../../common/formatters';

declare const Html5Qrcode: any;

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

const CameraIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;

// #region Modals
interface AssetModalProps {
    assetToEdit: SchoolAsset | null;
    onClose: () => void;
    onSubmit: (asset: SchoolAsset) => void;
}
const AssetModal: React.FC<AssetModalProps> = ({ assetToEdit, onClose, onSubmit }) => {
    const [barcode, setBarcode] = useState('');
    const [type, setType] = useState('');
    const [description, setDescription] = useState('');

    useEffect(() => {
        if (assetToEdit) {
            setBarcode(assetToEdit.barcode);
            setType(assetToEdit.type);
            setDescription(assetToEdit.description || '');
        }
    }, [assetToEdit]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!barcode.trim() || !type.trim()) return;
        onSubmit({
            id: assetToEdit?.id && assetToEdit.id !== '' ? assetToEdit.id : `asset-${Date.now()}`,
            barcode: barcode.trim(),
            type: type.trim(),
            description: description.trim(),
            status: assetToEdit ? assetToEdit.status : 'available',
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-4">{assetToEdit?.id ? 'ویرایش' : 'افزودن'} اموال</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div><label>کد بارکد</label><ThemedInput value={barcode} onChange={e=>setBarcode(e.target.value)} required /></div>
                    <div><label>نوع</label><ThemedInput value={type} onChange={e=>setType(e.target.value)} placeholder="مثلا: صندلی، کتاب" required /></div>
                    <div><label>توضیحات</label><ThemedInput value={description} onChange={e=>setDescription(e.target.value)} /></div>
                    <div className="flex justify-end gap-4 pt-4"><button type="button" onClick={onClose}>انصراف</button><button type="submit">{assetToEdit?.id ? 'ذخیره' : 'افزودن'}</button></div>
                </form>
            </div>
        </div>
    );
};

interface GroupAssetModalProps {
    onClose: () => void;
    onSubmit: (newAssets: SchoolAsset[]) => void;
}
const GroupAssetModal: React.FC<GroupAssetModalProps> = ({ onClose, onSubmit }) => {
    const [rows, setRows] = useState<{ id: number; barcode: string; type: string; description: string }[]>([{ id: 1, barcode: '', type: '', description: '' }]);

    const handleAddRow = () => setRows(prev => [...prev, { id: Date.now(), barcode: '', type: '', description: '' }]);
    const handleRemoveRow = (id: number) => setRows(prev => prev.filter(r => r.id !== id));
    const handleRowChange = (id: number, field: 'barcode' | 'type' | 'description', value: string) => {
        setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
    };

    const handleSubmit = () => {
        const newAssets = rows
            .filter(r => r.barcode.trim() && r.type.trim())
            .map(r => ({
                id: `asset-${Date.now()}-${r.id}`,
                barcode: r.barcode.trim(),
                type: r.type.trim(),
                description: r.description.trim(),
                status: 'available' as const,
            }));
        if (newAssets.length > 0) {
            onSubmit(newAssets);
            onClose();
        } else {
            alert('لطفا حداقل یک ردیف با بارکد و نوع معتبر وارد کنید.');
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-3xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-4 text-[var(--text-primary)]">افزودن گروهی اموال</h2>
                <div className="overflow-y-auto space-y-3 flex-grow pr-2">
                    {rows.map((row, index) => (
                        <div key={row.id} className="flex items-center gap-2">
                            <ThemedInput value={row.barcode} onChange={e => handleRowChange(row.id, 'barcode', e.target.value)} placeholder={`بارکد ${index + 1}`} className="w-1/3" />
                            <ThemedInput value={row.type} onChange={e => handleRowChange(row.id, 'type', e.target.value)} placeholder={`نوع ${index + 1}`} className="w-1/4" />
                            <ThemedInput value={row.description} onChange={e => handleRowChange(row.id, 'description', e.target.value)} placeholder="توضیحات (اختیاری)" className="flex-grow" />
                           <button onClick={() => handleRemoveRow(row.id)} className="p-2 text-red-500 hover:bg-red-100 rounded-full flex-shrink-0">&times;</button>
                        </div>
                    ))}
                </div>
                <button onClick={handleAddRow} className="mt-4 text-sm text-[var(--primary-600)] font-semibold hover:underline">افزودن ردیف جدید</button>
                <div className="flex justify-end gap-4 pt-4 border-t mt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition">انصراف</button>
                    <button onClick={handleSubmit} className="px-4 py-2 bg-[var(--primary-600)] text-white rounded-md hover:bg-[var(--primary-700)] transition">ذخیره</button>
                </div>
            </div>
        </div>
    );
};

interface ExcelImportModalProps {
    onClose: () => void;
    onSubmit: (newAssets: SchoolAsset[]) => void;
}

const ExcelImportModal: React.FC<ExcelImportModalProps> = ({ onClose, onSubmit }) => {
    const [pastedText, setPastedText] = useState('');
    const [processedData, setProcessedData] = useState<{ valid: SchoolAsset[], errors: string[] } | null>(null);

    const handleProcess = () => {
        const lines = pastedText.trim().split('\n');
        const valid: SchoolAsset[] = [];
        const errors: string[] = [];
        const seenBarcodes = new Set<string>();

        lines.forEach((line, index) => {
            if (!line.trim()) return;
            const [barcode, type, description] = line.split('\t');
            if (!barcode || !type || !barcode.trim() || !type.trim()) {
                errors.push(`ردیف ${index + 1}: بارکد و نوع الزامی است.`);
                return;
            }
            if (seenBarcodes.has(barcode.trim())) {
                errors.push(`ردیف ${index + 1}: بارکد "${barcode.trim()}" در این لیست تکراری است.`);
                return;
            }
            
            seenBarcodes.add(barcode.trim());
            valid.push({
                id: `asset-excel-${Date.now()}-${index}`,
                barcode: barcode.trim(),
                type: type.trim(),
                description: description?.trim() || '',
                status: 'available',
            });
        });

        setProcessedData({ valid, errors });
    };

    const handleSubmit = () => {
        if (processedData && processedData.valid.length > 0) {
            onSubmit(processedData.valid);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-4">ورود گروهی اموال از اکسل</h2>
                <p className="text-sm text-gray-600 mb-2">اطلاعات را از فایل اکسل خود (شامل سه ستون: <strong>کد بارکد</strong>، <strong>نوع</strong>، <strong>توضیحات</strong>) کپی کرده و در کادر زیر جای‌گذاری کنید.</p>
                <p className="text-xs text-gray-500 mb-4">هر ردیف در یک خط جدید و ستون‌ها با Tab از هم جدا شده باشند.</p>
                <textarea
                    value={pastedText}
                    onChange={e => setPastedText(e.target.value)}
                    rows={8}
                    className="w-full p-2 border rounded font-mono text-sm"
                    placeholder="SCH-CHR-101	صندلی	ردیف سوم، کنار پنجره..."
                />
                <div className="my-4">
                    <button onClick={handleProcess} className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">پردازش اطلاعات</button>
                </div>
                {processedData && (
                    <div className="space-y-3 max-h-40 overflow-y-auto border p-3 rounded bg-gray-50 text-sm">
                        <p className="font-semibold text-green-700">{toPersianDigits(processedData.valid.length)} مورد معتبر برای ورود یافت شد.</p>
                        {processedData.errors.length > 0 && (
                            <div>
                                <p className="font-semibold text-red-700">{toPersianDigits(processedData.errors.length)} خطا یافت شد:</p>
                                <ul className="text-xs text-red-600 list-disc pr-4">
                                    {processedData.errors.map((err, i) => <li key={i}>{err}</li>)}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
                <div className="flex justify-end gap-4 pt-4 mt-4 border-t">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md">انصراف</button>
                    <button onClick={handleSubmit} disabled={!processedData || processedData.valid.length === 0} className="px-4 py-2 bg-green-600 text-white rounded-md disabled:bg-gray-400">ورود موارد معتبر</button>
                </div>
            </div>
        </div>
    );
};

interface BarcodeScannerModalProps {
    onScanSuccess: (decodedText: string) => void;
    onClose: () => void;
}
const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({ onScanSuccess, onClose }) => {
    const scannerRef = useRef<any>(null);

    useEffect(() => {
        const scanner = new Html5Qrcode("group-barcode-scanner-view");
        scannerRef.current = scanner;

        const successCallback = (decodedText: string) => {
            onScanSuccess(decodedText);
        };

        scanner.start(
            { facingMode: "environment" },
            { fps: 10, qrbox: { width: 250, height: 250 } },
            successCallback,
            (errorMessage: string) => { /* ignore */ }
        ).catch((err: any) => {
            alert('خطا در فعالسازی دوربین.');
            onClose();
        });

        return () => {
             if (scannerRef.current && scannerRef.current.isScanning) {
                scannerRef.current.stop().catch((err: any) => console.warn("Error stopping group scanner:", err));
            }
        };
    }, [onScanSuccess, onClose]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex flex-col items-center justify-center z-50">
            <div id="group-barcode-scanner-view" className="w-11/12 md:w-1/2 bg-white rounded-lg overflow-hidden"></div>
            <button onClick={onClose} className="mt-4 px-4 py-2 bg-red-500 text-white rounded-md">لغو اسکن</button>
        </div>
    );
};


interface GroupAssignmentModalProps {
    students: Student[];
    classes: SchoolClass[];
    onClose: () => void;
    onSubmit: (assignments: { barcode: string; studentId: string; notes?: string }[]) => { successCount: number; errors: string[] };
}
const GroupAssignmentModal: React.FC<GroupAssignmentModalProps> = ({ students, classes, onClose, onSubmit }) => {
    const [selectedClassId, setSelectedClassId] = useState<string>('');
    const [assignmentsData, setAssignmentsData] = useState<Record<string, { barcode: string; notes: string }>>({});
    const [scanningForStudent, setScanningForStudent] = useState<Student | null>(null);
    
    const studentsInClass = useMemo(() => {
        if (!selectedClassId) return [];
        return students.filter(s => s.classId === selectedClassId).sort((a,b) => a.lastName.localeCompare(b.lastName, 'fa'));
    }, [students, selectedClassId]);

    const handleDataChange = (studentId: string, field: 'barcode' | 'notes', value: string) => {
        setAssignmentsData(prev => ({
            ...prev,
            [studentId]: {
                // FIX: Added a default object to prevent spreading undefined.
                ...(prev[studentId] || { barcode: '', notes: '' }),
                [field]: value
            }
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const assignments = Object.entries(assignmentsData)
            .filter(([, data]) => data.barcode && data.barcode.trim() !== '')
            .map(([studentId, data]) => ({ 
                studentId, 
                barcode: data.barcode.trim(),
                notes: data.notes.trim() || undefined,
            }));
        
        if (assignments.length === 0) {
            alert('هیچ بارکدی برای واگذاری وارد نشده است.');
            return;
        }

        const result = onSubmit(assignments);
        
        if (result.errors.length > 0) {
            alert(`عملیات با ${toPersianDigits(result.errors.length)} خطا مواجه شد:\n- ${result.errors.join('\n- ')}\n\n${toPersianDigits(result.successCount)} مورد با موفقیت واگذار شد.`);
        } else {
            alert(`${toPersianDigits(result.successCount)} مورد با موفقیت واگذار شد.`);
        }
        onClose();
    };

    return (
        <>
        {scanningForStudent && (
            <BarcodeScannerModal
                onClose={() => setScanningForStudent(null)}
                onScanSuccess={(scannedBarcode) => {
                    handleDataChange(scanningForStudent.id, 'barcode', scannedBarcode);
                    setScanningForStudent(null);
                }}
            />
        )}
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-4">واگذاری گروهی اموال</h2>
                <form onSubmit={handleSubmit} className="flex-grow flex flex-col min-h-0 space-y-4">
                    <div>
                        <label>کلاس را انتخاب کنید</label>
                        <ThemedSelect value={selectedClassId} onChange={e => { setSelectedClassId(e.target.value); setAssignmentsData({}); }}>
                            <option value="">انتخاب کلاس...</option>
                            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </ThemedSelect>
                    </div>
                    <div className="flex-grow overflow-y-auto border-t pt-2">
                        {studentsInClass.length > 0 ? (
                            <table className="w-full text-sm">
                                <thead><tr><th className="p-2 text-right">دانش آموز</th><th className="p-2 text-right">بارکد اموال</th><th className="p-2 text-right">توضیحات</th></tr></thead>
                                <tbody>
                                    {studentsInClass.map(s => (
                                        <tr key={s.id} className="border-b">
                                            <td className="p-2 font-semibold">{formatFullName(s)}</td>
                                            <td className="p-2">
                                                <div className="flex items-center gap-1">
                                                    <ThemedInput 
                                                        value={assignmentsData[s.id]?.barcode || ''}
                                                        onChange={e => handleDataChange(s.id, 'barcode', e.target.value)}
                                                        placeholder="بارکد را وارد یا اسکن کنید..."
                                                    />
                                                     <button type="button" onClick={() => setScanningForStudent(s)} className="p-2 bg-gray-200 rounded-md hover:bg-gray-300 flex-shrink-0"><CameraIcon /></button>
                                                </div>
                                            </td>
                                             <td className="p-2">
                                                <ThemedInput 
                                                    value={assignmentsData[s.id]?.notes || ''}
                                                    onChange={e => handleDataChange(s.id, 'notes', e.target.value)}
                                                    placeholder="اختیاری..."
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p className="text-center text-gray-500 pt-8">ابتدا یک کلاس را انتخاب کنید.</p>
                        )}
                    </div>
                    <div className="flex justify-end gap-4 pt-4 border-t">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition">انصراف</button>
                        <button type="submit" className="px-4 py-2 bg-[var(--primary-600)] text-white rounded-md hover:bg-[var(--primary-700)] transition">واگذاری موارد ثبت شده</button>
                    </div>
                </form>
            </div>
        </div>
        </>
    );
};
// #endregion

interface AssetsTabProps {
    admin: Admin;
}

const AssetsTab: React.FC<AssetsTabProps> = ({ admin }) => {
    const { students, classes, schoolAssets, assetAssignments, saveSchoolAsset, deleteSchoolAsset, assignAsset, returnAsset, importSchoolAssets, assignGroupAssets } = useData();
    const [activeSubTab, setActiveSubTab] = useState('assignments');
    const [modal, setModal] = useState<'asset' | 'group_asset' | 'group_assignment' | 'excel_import' | null>(null);
    const [assetToEdit, setAssetToEdit] = useState<SchoolAsset | null>(null);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [barcode, setBarcode] = useState('');
    const [studentId, setStudentId] = useState('');
    
    // States for searchable student dropdown
    const [studentSearchTerm, setStudentSearchTerm] = useState('');
    const [isStudentDropdownOpen, setIsStudentDropdownOpen] = useState(false);

    const scannerRef = useRef<any | null>(null);
    const studentInputContainerRef = useRef<HTMLDivElement>(null);

     useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (studentInputContainerRef.current && !studentInputContainerRef.current.contains(event.target as Node)) {
                setIsStudentDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredStudents = useMemo(() => {
        if (!studentSearchTerm) return [];
        const term = studentSearchTerm.toLowerCase();
        return students.filter(s =>
            formatFullName(s).toLowerCase().includes(term) ||
            s.className.toLowerCase().includes(term)
        );
    }, [studentSearchTerm, students]);


    useEffect(() => {
        // This effect only STARTS the scanner. Stopping is handled by the cleanup.
        if (!isScannerOpen) {
            return;
        }

        const scanner = new Html5Qrcode("barcode-scanner-view");
        scannerRef.current = scanner;

        const config = { fps: 10, qrbox: { width: 250, height: 250 } };

        const successCallback = (decodedText: string) => {
            // This state change will trigger the cleanup function, which stops the scanner.
            setBarcode(decodedText);
            setIsScannerOpen(false);
        };

        const errorCallback = (errorMessage: string) => { /* ignore */ };

        scanner.start({ facingMode: "environment" }, config, successCallback, errorCallback)
            .catch((err: any) => {
                alert('خطا در دسترسی به دوربین. لطفا مطمئن شوید به این سایت اجازه دسترسی به دوربین را داده‌اید.');
                setIsScannerOpen(false);
            });

        // This cleanup runs when `isScannerOpen` changes from true to false, or on unmount.
        return () => {
            // Using getState() === 2 (SCANNING) is a robust way to check if the scanner is active.
            if (scannerRef.current && scannerRef.current.getState() === 2) { 
                scannerRef.current.stop()
                    .catch((err: any) => {
                        // This error can be noisy if the component unmounts while the scanner
                        // is already stopping. We can safely ignore it.
                        console.warn("Scanner stop failed on cleanup, this might be expected.", err);
                    });
            }
        };
    }, [isScannerOpen]);

    const handleAssign = (e: React.FormEvent) => {
        e.preventDefault();
        if(!barcode || !studentId) {
            alert('لطفا بارکد و دانش‌آموز را مشخص کنید.');
            return;
        }
        
        const assetExists = schoolAssets.some(a => a.barcode === barcode);
    
        if (assetExists) {
            assignAsset({ barcode, studentId });
            setBarcode('');
            setStudentId('');
            setStudentSearchTerm('');
        } else {
            if (window.confirm(`اموالی با بارکد "${barcode}" یافت نشد. آیا مایل به تعریف آن هستید؟`)) {
                setAssetToEdit({
                    id: '', // Temporary
                    barcode: barcode,
                    type: '',
                    description: '',
                    status: 'available',
                });
                setModal('asset');
            }
        }
    };

    const handleAssetSubmit = (asset: SchoolAsset) => {
        saveSchoolAsset(asset);
        
        if (asset.barcode === barcode && studentId) {
            setTimeout(() => {
                assignAsset({ barcode: asset.barcode, studentId });
                setBarcode('');
                setStudentId('');
                setStudentSearchTerm('');
            }, 100);
        }
    
        setModal(null);
        setAssetToEdit(null);
    };

    const activeAssignments = useMemo(() => assetAssignments.filter(a => !a.returnedDate), [assetAssignments]);
    const enrichedAssignments = useMemo(() => {
        return activeAssignments.map(a => {
            const student = students.find(s => s.id === a.studentId);
            const asset = schoolAssets.find(s => s.id === a.assetId);
            return {
                ...a,
                studentName: formatFullName(student) || 'حذف شده',
                className: student?.className || 'نامشخص',
                assetType: asset?.type || 'حذف شده',
                barcode: asset?.barcode || 'نامشخص',
            };
        });
    }, [activeAssignments, students, schoolAssets]);

    const { items: sortedAssignments } = useSortableData(enrichedAssignments, [{ key: 'assignedDate', direction: 'descending' }]);

    const enrichedAssets = useMemo(() => {
        return schoolAssets.map(asset => {
            let assignedTo = '';
            if (asset.status === 'assigned') {
                const assignment = activeAssignments.find(a => a.assetId === asset.id);
                if (assignment) {
                    const student = students.find(s => s.id === assignment.studentId);
                    assignedTo = formatFullName(student) || 'نامشخص';
                }
            }
            return { ...asset, assignedTo };
        });
    }, [schoolAssets, activeAssignments, students]);

    const { items: sortedAssets, requestSort: requestSortAssets, sortConfig: sortConfigAssets } = useSortableData(enrichedAssets, [{key: 'type', direction: 'ascending'}]);
    
    const statusText = { available: 'موجود', assigned: 'امانت', damaged: 'خراب', lost: 'مفقود' };

    return (
        <div className="space-y-4">
            {isScannerOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex flex-col items-center justify-center z-50">
                    <div id="barcode-scanner-view" className="w-11/12 md:w-1/2 bg-white rounded-lg overflow-hidden"></div>
                    <button onClick={() => setIsScannerOpen(false)} className="mt-4 px-4 py-2 bg-red-500 text-white rounded-md">بستن اسکنر</button>
                </div>
            )}
            <h2 className="text-xl font-bold">مدیریت اموال و امانات</h2>
            <div className="bg-gray-100 p-1 rounded-lg grid grid-cols-2 max-w-sm">
                <button onClick={() => setActiveSubTab('assignments')} className={`px-4 py-2 text-sm rounded-md ${activeSubTab === 'assignments' ? 'bg-white shadow' : ''}`}>واگذاری و بازگشت</button>
                <button onClick={() => setActiveSubTab('inventory')} className={`px-4 py-2 text-sm rounded-md ${activeSubTab === 'inventory' ? 'bg-white shadow' : ''}`}>مدیریت اموال</button>
            </div>
            
            {activeSubTab === 'assignments' && (
                <div className="space-y-6">
                    <Card title="واگذاری امانت">
                         <div className="p-4 flex justify-end">
                            <button onClick={() => setModal('group_assignment')} className="px-4 py-2 bg-purple-500 text-white rounded-md text-sm">واگذاری گروهی</button>
                        </div>
                        <form onSubmit={handleAssign} className="p-4 pt-0 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                            <div className="md:col-span-1">
                                <label>بارکد اموال</label>
                                <div className="flex items-center gap-2">
                                    <ThemedInput value={barcode} onChange={e=>setBarcode(e.target.value)} required />
                                    <button type="button" onClick={() => setIsScannerOpen(true)} className="p-2 bg-gray-200 rounded-md hover:bg-gray-300 flex-shrink-0"><CameraIcon /></button>
                                </div>
                            </div>
                             <div className="md:col-span-1 relative" ref={studentInputContainerRef}>
                                <label>دانش آموز</label>
                                <ThemedInput
                                    type="text"
                                    value={studentSearchTerm}
                                    onChange={(e) => {
                                        setStudentSearchTerm(e.target.value);
                                        setIsStudentDropdownOpen(true);
                                        if (e.target.value === '') setStudentId('');
                                    }}
                                    onFocus={() => setIsStudentDropdownOpen(true)}
                                    placeholder="جستجوی نام دانش آموز..."
                                    required={!studentId}
                                    autoComplete="off"
                                />
                                {isStudentDropdownOpen && filteredStudents.length > 0 && (
                                    <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                        <ul className="py-1">
                                            {filteredStudents.map(s => (
                                                <li 
                                                    key={s.id} 
                                                    className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                                                    onMouseDown={() => {
                                                        setStudentId(s.id);
                                                        setStudentSearchTerm(formatFullName(s));
                                                        setIsStudentDropdownOpen(false);
                                                    }}
                                                >
                                                    {formatFullName(s)} - <span className="text-gray-500">{s.className}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                             </div>
                             <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-md h-10">واگذاری</button>
                        </form>
                    </Card>
                    <Card title="لیست امانات فعال">
                         <div className="overflow-x-auto"><table className="w-full text-sm">
                            <thead className="bg-gray-50"><tr><th className="p-2 text-right">نوع</th><th className="p-2 text-right">بارکد</th><th className="p-2 text-right">دانش آموز</th><th className="p-2 text-right">کلاس</th><th className="p-2 text-right">تاریخ واگذاری</th><th className="p-2 text-right">اقدام</th></tr></thead>
                            <tbody>{sortedAssignments.map(a=><tr key={a.id} className="border-t">
                                <td className="p-2">{a.assetType}</td>
                                <td className="p-2 font-mono">{a.barcode}</td>
                                <td className="p-2 font-semibold">{a.studentName}</td>
                                <td className="p-2">{a.className}</td>
                                <td className="p-2">{toPersianDigits(a.assignedDate)}</td>
                                <td className="p-2"><button onClick={() => returnAsset(a.id)} className="px-3 py-1 bg-green-500 text-white rounded-md text-xs">بازگشت</button></td>
                            </tr>)}</tbody>
                         </table></div>
                    </Card>
                </div>
            )}

            {activeSubTab === 'inventory' && (
                 <div className="space-y-4">
                     <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold">لیست اموال مدرسه</h3>
                        <div className="flex gap-2">
                             <button onClick={() => setModal('excel_import')} className="px-4 py-2 bg-teal-500 text-white rounded-md text-sm">ورود از اکسل</button>
                             <button onClick={() => setModal('group_asset')} className="px-4 py-2 bg-green-500 text-white rounded-md text-sm">افزودن گروهی</button>
                            <button onClick={() => {setAssetToEdit(null); setModal('asset');}} className="px-4 py-2 bg-blue-500 text-white rounded-md text-sm">افزودن اموال</button>
                        </div>
                    </div>
                     <div className="overflow-x-auto"><table className="w-full text-sm">
                        <thead className="bg-gray-50"><tr>
                            {/* FIX: Add missing children prop */}
                            <SortableHeader sortKey="barcode" requestSort={requestSortAssets} sortConfig={sortConfigAssets}>بارکد</SortableHeader>
                            {/* FIX: Add missing children prop */}
                            <SortableHeader sortKey="type" requestSort={requestSortAssets} sortConfig={sortConfigAssets}>نوع</SortableHeader>
                            {/* FIX: Add missing children prop */}
                            <SortableHeader sortKey="status" requestSort={requestSortAssets} sortConfig={sortConfigAssets}>وضعیت</SortableHeader>
                            <th className="p-2 text-right">تحویل گیرنده</th>
                            <th className="p-2 text-right">اقدامات</th>
                        </tr></thead>
                        <tbody>{sortedAssets.map(asset => <tr key={asset.id} className="border-t">
                            <td className="p-2 font-mono">{asset.barcode}</td>
                            <td className="p-2">{asset.type}</td>
                            <td className="p-2">{statusText[asset.status]}</td>
                            <td className="p-2 font-semibold">{asset.assignedTo}</td>
                            <td className="p-2 text-xs space-x-2 space-x-reverse"><button onClick={() => {setAssetToEdit(asset); setModal('asset')}} className="font-medium text-blue-600">ویرایش</button><button onClick={() => deleteSchoolAsset(asset.id)} className="font-medium text-red-600">حذف</button></td>
                        </tr>)}</tbody>
                     </table></div>
                 </div>
            )}
            
            {modal === 'asset' && <AssetModal assetToEdit={assetToEdit} onClose={() => setModal(null)} onSubmit={handleAssetSubmit}/>}
            {modal === 'group_asset' && <GroupAssetModal onClose={() => setModal(null)} onSubmit={assets => importSchoolAssets(assets)} />}
            {modal === 'excel_import' && <ExcelImportModal onClose={() => setModal(null)} onSubmit={assets => { importSchoolAssets(assets); setModal(null); }} />}
            {modal === 'group_assignment' && <GroupAssignmentModal students={students} classes={classes} onClose={() => setModal(null)} onSubmit={assignGroupAssets} />}
        </div>
    );
};

export default AssetsTab;