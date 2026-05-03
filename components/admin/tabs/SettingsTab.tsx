import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { SchoolSettings, ModuleId } from '../../../types';
import Card from '../../common/Card';
import { useData } from '../../../App';
import { IconPicker } from '../../common/IconPicker';
import { toPersianDigits } from '../../common/formatters';

const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>;
const PencilIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>;
const CheckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>;
const XIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>;

const ThemedInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
    <input 
        {...props} 
        className={`w-full mt-1 px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[var(--primary-500)] focus:border-[var(--primary-500)] ${props.className}`}
        style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)', ...props.style }}
    />
);

interface SettingsTabProps {
    settings: SchoolSettings;
    setSettings: React.Dispatch<React.SetStateAction<SchoolSettings>>;
}

interface DynamicListEditorProps {
    title: string;
    items: string[];
    onUpdate: (newItems: string[]) => void;
    newItemPlaceholder: string;
}

const DynamicListEditor: React.FC<DynamicListEditorProps> = ({ title, items, onUpdate, newItemPlaceholder }) => {
    const [newItem, setNewItem] = useState('');
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editingText, setEditingText] = useState('');

    const handleAddItem = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = newItem.trim();
        if (trimmed && !items.includes(trimmed)) {
            onUpdate([...items, trimmed]);
            setNewItem('');
        }
    };
    
    const handleDeleteItem = (index: number) => {
        if (window.confirm('آیا از حذف این آیتم اطمینان دارید؟')) {
            onUpdate(items.filter((_, i) => i !== index));
        }
    };

    const handleSaveEdit = (index: number) => {
        const trimmed = editingText.trim();
        if (trimmed && !items.some((item, i) => item === trimmed && i !== index)) {
            const updatedItems = [...items];
            updatedItems[index] = trimmed;
            onUpdate(updatedItems);
            setEditingIndex(null);
        }
    };

    return (
        <div className="space-y-4">
            <div>
                <ul className="border rounded-md divide-y">
                    {items.map((item, index) => (
                        <li key={`${item}-${index}`} className="p-2 flex items-center justify-between gap-2">
                            {editingIndex === index ? (
                                <>
                                    <ThemedInput value={editingText} onChange={(e) => setEditingText(e.target.value)} autoFocus onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEdit(index); if (e.key === 'Escape') setEditingIndex(null); }} />
                                    <div className="flex items-center gap-1"><button onClick={() => handleSaveEdit(index)} className="p-1 text-green-600"><CheckIcon /></button><button onClick={() => setEditingIndex(null)} className="p-1 text-gray-500"><XIcon /></button></div>
                                </>
                            ) : (
                                <>
                                    <span className="text-gray-800 flex-grow">{item}</span>
                                    <div className="flex items-center gap-1"><button onClick={() => { setEditingIndex(index); setEditingText(item); }} className="p-1 text-blue-600"><PencilIcon /></button><button onClick={() => handleDeleteItem(index)} className="p-1 text-red-600"><TrashIcon /></button></div>
                                </>
                            )}
                        </li>
                    ))}
                </ul>
            </div>
            <form onSubmit={handleAddItem} className="flex items-center gap-2">
                <ThemedInput value={newItem} onChange={(e) => setNewItem(e.target.value)} placeholder={newItemPlaceholder}/>
                <button type="submit" className="flex items-center gap-1 px-4 py-2 bg-[var(--primary-600)] text-white font-semibold rounded-md hover:bg-[var(--primary-700)] transition-colors"><PlusIcon /><span>افزودن</span></button>
            </form>
        </div>
    );
};

const IconRenderer = ({ iconName }: { iconName: string | null }) => {
    const [Icon, setIcon] = useState<React.ComponentType | null>(null);

    useEffect(() => {
        let isMounted = true;
        setIcon(null); 

        if (!iconName) {
            return;
        }

        const loadIcon = async () => {
            let module;
            try {
                if (iconName.startsWith('Fa')) module = await import('react-icons/fa');
                else if (iconName.startsWith('Md')) module = await import('react-icons/md');
                else if (iconName.startsWith('Bs')) module = await import('react-icons/bs');
                else return;

                if (isMounted && module && module[iconName as keyof typeof module]) {
                    setIcon(() => module[iconName as keyof typeof module]);
                } else {
                    setIcon(null);
                }
            } catch (e) {
                if (isMounted) setIcon(null);
                console.error(`Failed to load icon ${iconName}`, e);
            }
        };

        loadIcon();

        return () => { isMounted = false; };
    }, [iconName]);
    
    if (Icon) return <Icon />;
    if (!iconName) return <span>?</span>;
    return <span className="text-xs animate-pulse">...</span>;
};


const SettingsTab: React.FC<SettingsTabProps> = ({ settings, setSettings }) => {
    const allData = useData();
    const [newWeight, setNewWeight] = useState({ subject: '', weight: 1 });

    const [newIconKey, setNewIconKey] = useState('');
    const [selectedIcon, setSelectedIcon] = useState<string | null>(null);
    const [isPickerOpen, setIsPickerOpen] = useState(false);
    const pickerButtonRef = useRef<HTMLButtonElement>(null);

    const handleFieldChange = (field: keyof SchoolSettings, value: any) => {
        setSettings(prev => ({...prev, [field]: value}));
    }

    const handleModuleChange = (id: ModuleId, field: 'label' | 'studentVisible' | 'teacherVisible', value: string | boolean) => {
        setSettings(prev => ({
            ...prev,
            moduleSettings: {
                ...prev.moduleSettings,
                [id]: {
                    ...prev.moduleSettings[id],
                    [field]: value
                }
            }
        }));
    };

    const handleDescriptiveColorChange = (index: number, color: string) => {
        setSettings(prev => {
            const newColors = [...(prev.descriptiveGradeColors || [])];
            if (newColors[index]) {
                newColors[index] = { ...newColors[index], color };
                return { ...prev, descriptiveGradeColors: newColors };
            }
            return prev;
        });
    };

    const handleDescriptiveValueChange = (index: number, value: number) => {
        setSettings(prev => {
            const newValues = [...prev.descriptiveGradeValues];
            if (newValues[index]) {
                 newValues[index] = { ...newValues[index], value };
                return { ...prev, descriptiveGradeValues: newValues };
            }
            return prev;
        });
    };

    const handleAddSubjectWeight = (e: React.FormEvent) => {
        e.preventDefault();
        const subject = newWeight.subject.trim();
        const weight = newWeight.weight;
        if (subject && weight > 0) {
            setSettings(prev => ({
                ...prev,
                subjectWeights: [...prev.subjectWeights.filter(sw => sw.subject !== subject), { subject, weight }]
            }));
            setNewWeight({ subject: '', weight: 1 });
        }
    };
    
    const handleDeleteSubjectWeight = (index: number) => {
        setSettings(prev => ({
            ...prev,
            subjectWeights: prev.subjectWeights.filter((_, i) => i !== index)
        }));
    };
    
    const handleAddIconSetting = (e: React.FormEvent) => {
        e.preventDefault();
        const key = newIconKey.trim();
        if (!key || !selectedIcon) {
            alert('لطفا یک کلید و یک آیکون انتخاب کنید.');
            return;
        }
        if (settings.iconSettings?.some(s => s.key === key)) {
            alert('این کلید قبلا استفاده شده است.');
            return;
        }

        const newSetting = { key, icon: selectedIcon };
        setSettings(prev => ({
            ...prev,
            iconSettings: [...(prev.iconSettings || []), newSetting]
        }));
        
        setNewIconKey('');
        setSelectedIcon(null);
    };

    const handleDeleteIconSetting = (keyToDelete: string) => {
        if (window.confirm(`آیا از حذف آیکون با کلید "${keyToDelete}" اطمینان دارید؟`)) {
            setSettings(prev => ({
                ...prev,
                iconSettings: prev.iconSettings.filter(s => s.key !== keyToDelete)
            }));
        }
    };

    const handleExportData = () => {
        const dataStr = JSON.stringify(allData, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.download = `school_data_backup_${new Date().toLocaleDateString('fa-IR-u-nu-latn').replace(/\//g, '-')}.json`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
    };

    const moduleIds: ModuleId[] = ['grades', 'attendance', 'discipline', 'exams', 'naseeb', 'pta', 'finance'];

    return (
        <div className="space-y-6">
             <h2 className="text-2xl font-bold text-gray-800">تنظیمات مدرسه</h2>

            <Card title="اطلاعات کلی مدرسه">
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className="text-sm font-medium">نام مدرسه</label><ThemedInput value={settings.schoolName} onChange={e => handleFieldChange('schoolName', e.target.value)} /></div>
                    <div><label className="text-sm font-medium">سال تحصیلی</label><ThemedInput value={settings.academicYear} onChange={e => handleFieldChange('academicYear', e.target.value)} /></div>
                    <div><label className="text-sm font-medium">شماره تلفن</label><ThemedInput value={settings.schoolPhone} onChange={e => handleFieldChange('schoolPhone', e.target.value)} /></div>
                    <div><label className="text-sm font-medium">آدرس</label><ThemedInput value={settings.schoolAddress} onChange={e => handleFieldChange('schoolAddress', e.target.value)} /></div>
                    <div className="md:col-span-2"><label className="text-sm font-medium">آدرس URL لوگوی مدرسه</label><ThemedInput value={settings.schoolLogoUrl} onChange={e => handleFieldChange('schoolLogoUrl', e.target.value)} placeholder="https://example.com/logo.png" /></div>
                    <div className="md:col-span-2 mt-2">
                        <label className="block text-sm font-medium mb-2 text-gray-800">مقطع تحصیلی</label>
                        <div className="flex gap-4 p-3 bg-gray-50 border border-gray-200 rounded-xl">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="schoolLevel"
                                    value="elementary"
                                    checked={settings.schoolLevel === 'elementary'}
                                    onChange={() => {
                                        setSettings(prev => ({ ...prev, schoolLevel: 'elementary', gradingSystem: 'descriptive' }));
                                    }}
                                    className="h-4 w-4 text-[var(--primary-600)] focus:ring-[var(--primary-500)]"
                                />
                                <span className="text-gray-700 font-medium">دبستان (معلم پایه، نمره توصیفی)</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="schoolLevel"
                                    value="high_school"
                                    checked={settings.schoolLevel === 'high_school'}
                                    onChange={() => {
                                        setSettings(prev => ({ ...prev, schoolLevel: 'high_school', gradingSystem: 'numeric' }));
                                    }}
                                    className="h-4 w-4 text-[var(--primary-600)] focus:ring-[var(--primary-500)]"
                                />
                                <span className="text-gray-700 font-medium">دبیرستان (معلمان دروس تخصصی، نمره عددی)</span>
                            </label>
                        </div>
                    </div>
                </div>
            </Card>
            
            <Card title="تنظیمات عملکردی">
                <div className="p-4 space-y-4">
                    <div>
                        <label className="text-sm font-medium text-gray-800">سیستم نمره‌دهی</label>
                        <div className={`mt-2 flex gap-6 p-3 rounded-lg ${settings.schoolLevel ? 'bg-gray-50 opacity-70 pointer-events-none' : 'bg-gray-100'}`}>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="gradingSystem"
                                    value="numeric"
                                    checked={settings.gradingSystem === 'numeric'}
                                    onChange={() => handleFieldChange('gradingSystem', 'numeric')}
                                    className="h-4 w-4 text-[var(--primary-600)] focus:ring-[var(--primary-500)]"
                                    disabled={settings.schoolLevel !== undefined}
                                />
                                <span className="text-gray-700">عددی (۰ تا ۲۰)</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="gradingSystem"
                                    value="descriptive"
                                    checked={settings.gradingSystem === 'descriptive'}
                                    onChange={() => handleFieldChange('gradingSystem', 'descriptive')}
                                    className="h-4 w-4 text-[var(--primary-600)] focus:ring-[var(--primary-500)]"
                                    disabled={settings.schoolLevel !== undefined}
                                />
                                <span className="text-gray-700">توصیفی (خیلی خوب، خوب...)</span>
                            </label>
                        </div>
                        {settings.schoolLevel && (
                             <p className="text-xs text-blue-600 mt-2">سیستم نمره‌دهی به‌صورت خودکار بر اساس مقطع تحصیلی تنظیم می‌شود.</p>
                        )}
                    </div>
                    {settings.gradingSystem === 'descriptive' && (
                        <div className="pt-4 mt-4 border-t">
                            <label className="text-sm font-medium text-gray-800">رنگ‌بندی نمرات توصیفی</label>
                            <div className="mt-2 space-y-3 p-4 bg-gray-100 rounded-lg">
                                {(settings.descriptiveGradeColors || []).map((item, index) => (
                                    <div key={item.grade} className="flex items-center justify-between gap-4">
                                        <span className="text-gray-700 font-medium">{item.grade}</span>
                                        <input
                                            type="color"
                                            value={item.color}
                                            onChange={(e) => handleDescriptiveColorChange(index, e.target.value)}
                                            className="w-24 h-8 p-1 border-none cursor-pointer rounded-md bg-transparent"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </Card>

            <Card title="تنظیمات نمره‌دهی پیشرفته">
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h4 className="font-semibold mb-2">مقدار عددی نمرات توصیفی</h4>
                        <div className="space-y-2 p-3 bg-gray-100 rounded-lg">
                            {(settings.descriptiveGradeValues || []).map((item, index) => (
                                <div key={item.grade} className="flex items-center justify-between">
                                    <label className="text-sm font-medium text-gray-700">{item.grade}</label>
                                    <ThemedInput 
                                        type="number"
                                        value={item.value}
                                        onChange={(e) => handleDescriptiveValueChange(index, Number(e.target.value))}
                                        className="w-24 text-center"
                                        disabled={settings.gradingSystem !== 'descriptive'}
                                        min="0"
                                        max="20"
                                        step="0.5"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-2">وزن دروس (برای معدل‌گیری)</h4>
                        <div className="space-y-3">
                             <form onSubmit={handleAddSubjectWeight} className="flex items-end gap-2 p-3 bg-gray-100 rounded-lg">
                                <div className="flex-grow">
                                    <label className="text-xs text-gray-600">نام درس</label>
                                    <ThemedInput value={newWeight.subject} onChange={e => setNewWeight(p => ({...p, subject: e.target.value}))} placeholder="مثلا: ریاضی" />
                                </div>
                                <div className="w-24">
                                    <label className="text-xs text-gray-600">ضریب</label>
                                    <ThemedInput type="number" value={newWeight.weight} onChange={e => setNewWeight(p => ({...p, weight: Number(e.target.value) || 1}))} min="0.5" step="0.5" />
                                </div>
                                <button type="submit" className="px-3 py-2 bg-blue-500 text-white rounded-md h-10 self-end">افزودن</button>
                            </form>
                            <ul className="space-y-1 max-h-40 overflow-y-auto border rounded-md p-1">
                                {settings.subjectWeights.length > 0 ? settings.subjectWeights.map((item, index) => (
                                     <li key={index} className="flex justify-between items-center bg-gray-50 p-2 rounded text-sm">
                                        <span><span className="font-semibold">{item.subject}</span> (ضریب: {toPersianDigits(item.weight)})</span>
                                        <button onClick={() => handleDeleteSubjectWeight(index)} className="text-red-500 text-xs font-semibold hover:underline">حذف</button>
                                    </li>
                                )) : <p className="text-xs text-center text-gray-500 p-4">هنوز وزنی تعریف نشده است.</p>}
                            </ul>
                        </div>
                    </div>
                </div>
            </Card>

            <Card title="مدیریت آیکون‌ها">
                <div className="p-4 space-y-4">
                    <div className="space-y-2">
                        <h4 className="text-md font-semibold text-gray-800">آیکون‌های تعریف شده</h4>
                        {(settings.iconSettings?.length || 0) > 0 ? (
                            <ul className="border rounded-md divide-y max-h-60 overflow-y-auto">
                                {settings.iconSettings.map(setting => (
                                    <li key={setting.key} className="p-2 flex items-center justify-between hover:bg-gray-50">
                                        <div className="flex items-center gap-3">
                                            <span className="w-8 h-8 flex items-center justify-center text-xl bg-gray-100 rounded text-gray-700">
                                                <IconRenderer iconName={setting.icon} />
                                            </span>
                                            <span className="font-mono text-sm text-gray-700">{setting.key}</span>
                                        </div>
                                        <button onClick={() => handleDeleteIconSetting(setting.key)} className="p-1 text-red-500 hover:bg-red-100 rounded-full">
                                            <TrashIcon />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-gray-500 text-center py-4">هنوز آیکونی تعریف نشده است.</p>
                        )}
                    </div>

                    <form onSubmit={handleAddIconSetting} className="space-y-3 border-t pt-4">
                        <h4 className="text-md font-semibold text-gray-800">افزودن آیکون جدید</h4>
                        <div className="flex items-end gap-2">
                            <div className="flex-grow">
                                <label className="text-sm font-medium text-gray-600">کلید (منحصر به فرد)</label>
                                <ThemedInput value={newIconKey} onChange={e => setNewIconKey(e.target.value)} placeholder="مثال: جایزه، انضباطی" />
                            </div>
                            <div className="relative">
                                <label className="text-sm font-medium text-gray-600">آیکون</label>
                                <button
                                    ref={pickerButtonRef}
                                    type="button"
                                    onClick={() => setIsPickerOpen(prev => !prev)}
                                    className="w-24 h-10 border rounded-md flex items-center justify-center text-2xl bg-white"
                                >
                                    <IconRenderer iconName={selectedIcon} />
                                </button>
                                {isPickerOpen && (
                                    <IconPicker
                                        onIconSelect={(iconName) => {
                                            setSelectedIcon(iconName);
                                            setIsPickerOpen(false);
                                        }}
                                        onClose={() => setIsPickerOpen(false)}
                                    />
                                )}
                            </div>
                            <button type="submit" className="px-4 py-2 bg-[var(--primary-600)] text-white font-semibold rounded-md h-10 self-end">
                                افزودن
                            </button>
                        </div>
                    </form>
                </div>
            </Card>

            <Card title="شخصی‌سازی ظاهری و برندینگ">
                <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div><label className="text-sm font-medium">رنگ اصلی متن</label><ThemedInput type="color" value={settings.textColorPrimary} onChange={e => handleFieldChange('textColorPrimary', e.target.value)} /></div>
                    <div><label className="text-sm font-medium">رنگ فرعی متن</label><ThemedInput type="color" value={settings.textColorSecondary} onChange={e => handleFieldChange('textColorSecondary', e.target.value)} /></div>
                    <div><label className="text-sm font-medium">پس‌زمینه اصلی</label><ThemedInput type="color" value={settings.bgColorPrimary} onChange={e => handleFieldChange('bgColorPrimary', e.target.value)} /></div>
                    <div><label className="text-sm font-medium">پس‌زمینه کارت‌ها</label><ThemedInput type="color" value={settings.cardBgColor} onChange={e => handleFieldChange('cardBgColor', e.target.value)} /></div>
                    <div><label className="text-sm font-medium">پس‌زمینه ورودی‌ها</label><ThemedInput type="color" value={settings.inputBgColor} onChange={e => handleFieldChange('inputBgColor', e.target.value)} /></div>
                    <div><label className="text-sm font-medium">حاشیه ورودی‌ها</label><ThemedInput type="color" value={settings.inputBorderColor} onChange={e => handleFieldChange('inputBorderColor', e.target.value)} /></div>
                </div>
            </Card>

            <Card title="مدیریت ماژول‌ها و دسترسی‌ها">
                <div className="p-4 overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead><tr className="text-right"><th className="p-2">ماژول</th><th className="p-2">نام نمایشی</th><th className="p-2 text-center">پنل دانش‌آموز</th><th className="p-2 text-center">پنل معلم</th></tr></thead>
                        <tbody>
                            {moduleIds.map(id => (
                                <tr key={id} className="border-t">
                                    <td className="p-2 font-semibold">{id}</td>
                                    <td className="p-2"><ThemedInput value={settings.moduleSettings[id]?.label || id} onChange={e => handleModuleChange(id, 'label', e.target.value)} /></td>
                                    <td className="p-2 text-center"><input type="checkbox" checked={settings.moduleSettings[id]?.studentVisible || false} onChange={e => handleModuleChange(id, 'studentVisible', e.target.checked)} className="h-5 w-5" /></td>
                                    <td className="p-2 text-center"><input type="checkbox" checked={settings.moduleSettings[id]?.teacherVisible || false} onChange={e => handleModuleChange(id, 'teacherVisible', e.target.checked)} className="h-5 w-5" /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card title="مدیریت دسته‌بندی‌های انضباطی">
                    <div className="p-4"><DynamicListEditor title="دسته‌بندی‌های انضباطی" items={settings.disciplineCategories} onUpdate={items => handleFieldChange('disciplineCategories', items)} newItemPlaceholder="دسته‌بندی جدید..." /></div>
                </Card>
                <Card title="مدیریت مولفه‌های نصیب">
                    <div className="p-4"><DynamicListEditor title="مولفه‌های نصیب" items={settings.naseebChartComponents} onUpdate={items => handleFieldChange('naseebChartComponents', items)} newItemPlaceholder="مولفه جدید..." /></div>
                </Card>
            </div>
            
            <Card title="تنظیمات پیشرفته">
                <div className="p-4 space-y-4">
                    <div className="p-4 border border-red-300 bg-red-50 rounded-lg">
                        <h4 className="font-bold text-red-700">منطقه خطرناک</h4>
                        <p className="text-sm text-red-600 my-2">عملیات زیر غیرقابل بازگشت هستند. لطفا با احتیاط کامل اقدام کنید.</p>
                        <div className="flex gap-4">
                            <button onClick={handleExportData} className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition text-sm">تهیه نسخه پشتیبان (JSON)</button>
                            <button onClick={() => alert('این قابلیت هنوز پیاده‌سازی نشده است.')} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition text-sm">بازنشانی اطلاعات سال تحصیلی</button>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default SettingsTab;
