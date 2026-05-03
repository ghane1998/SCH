import React, { useState, useMemo, useEffect } from 'react';
import type { Admin, Student, SchoolClass, FinancialBill, Payment, TuitionStatus, ChequeInfo } from '../../../types';
import { useData } from '../../../App';
import { useSortableData } from '../../common/useSortableData';
import { SortableHeader } from '../../common/SortableHeader';
import { formatFullName, toPersianDigits } from '../../common/formatters';
import DateSelector from '../../common/DateSelector';

declare const Html5Qrcode: any;

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
const AmountInput: React.FC<{ value: string; onChange: (value: string) => void; [x: string]: any; }> = ({ value, onChange, ...props }) => {
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value.replace(/,/g, '');
        if (/^\d*$/.test(rawValue)) { // Allow empty string or numbers
            onChange(rawValue);
        }
    };
    
    const formattedValue = value ? Number(value).toLocaleString('en-US') : '';

    return <ThemedInput {...props} value={formattedValue} onChange={handleInputChange} />;
};

const CameraIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
// #endregion

// #region Modals
interface FinancialBillModalProps {
    billToEdit: FinancialBill | null;
    students: Student[];
    onClose: () => void;
    onSubmit: (bill: FinancialBill) => void;
    years: string[];
}

const FinancialBillModal: React.FC<FinancialBillModalProps> = ({ billToEdit, students, onClose, onSubmit, years }) => {
    const [studentId, setStudentId] = useState('');
    const [title, setTitle] = useState('');
    const [academicYear, setAcademicYear] = useState('');
    const [totalAmount, setTotalAmount] = useState('');
    const [issueDate, setIssueDate] = useState({ year: '', month: '', day: '' });
    const [dueDate, setDueDate] = useState({ year: '', month: '', day: '' });

    React.useEffect(() => {
        if (billToEdit) {
            setStudentId(billToEdit.studentId);
            setTitle(billToEdit.title);
            setAcademicYear(billToEdit.academicYear);
            setTotalAmount(String(billToEdit.totalAmount));
            const [iY, iM, iD] = billToEdit.issueDate.split('-');
            setIssueDate({ year: iY, month: String(parseInt(iM,10)), day: String(parseInt(iD,10)) });
            if (billToEdit.dueDate) {
                const [dY, dM, dD] = billToEdit.dueDate.split('-');
                setDueDate({ year: dY, month: String(parseInt(dM,10)), day: String(parseInt(dD,10)) });
            }
        } else {
            setAcademicYear(years[0] || '');
            const today = new Date().toLocaleDateString('fa-IR-u-nu-latn').replace(/\//g, '-').split('-');
            setIssueDate({ year: today[0], month: today[1], day: today[2] });
        }
    }, [billToEdit, years]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!studentId || !title || !academicYear || !totalAmount || isNaN(Number(totalAmount)) || !issueDate.year) {
            alert('لطفا تمامی فیلدهای ضروری را به درستی پر کنید.');
            return;
        }

        onSubmit({
            id: billToEdit ? billToEdit.id : `fb-${Date.now()}`,
            studentId, title, academicYear, totalAmount: Number(totalAmount),
            issueDate: `${issueDate.year}-${issueDate.month.padStart(2, '0')}-${issueDate.day.padStart(2, '0')}`,
            dueDate: dueDate.year ? `${dueDate.year}-${dueDate.month.padStart(2, '0')}-${dueDate.day.padStart(2, '0')}` : undefined,
            amountPaid: billToEdit?.amountPaid || 0,
            status: billToEdit?.status || 'unpaid',
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-4">{billToEdit ? 'ویرایش' : 'ایجاد'} صورت‌حساب</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <ThemedSelect value={studentId} onChange={e => setStudentId(e.target.value)} required><option value="">انتخاب دانش آموز...</option>{students.map(s => <option key={s.id} value={s.id}>{formatFullName(s)} - {s.className}</option>)}</ThemedSelect>
                    <ThemedInput value={title} onChange={e=>setTitle(e.target.value)} placeholder="عنوان صورت‌حساب (مثلا: شهریه سالانه)" required />
                    <div className="grid grid-cols-2 gap-4">
                        <ThemedSelect value={academicYear} onChange={e => setAcademicYear(e.target.value)} required>{years.map(y => <option key={y} value={y}>{y}</option>)}</ThemedSelect>
                        <AmountInput value={totalAmount} onChange={setTotalAmount} placeholder="مبلغ کل (به ریال)" required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label>تاریخ صدور*</label><DateSelector prefix="issue" year={issueDate.year} month={issueDate.month} day={issueDate.day} onYearChange={y=>setIssueDate(p=>({...p, year: y}))} onMonthChange={m=>setIssueDate(p=>({...p, month: m}))} onDayChange={d=>setIssueDate(p=>({...p, day: d}))} years={years} /></div>
                        <div><label>تاریخ سررسید</label><DateSelector prefix="due" year={dueDate.year} month={dueDate.month} day={dueDate.day} onYearChange={y=>setDueDate(p=>({...p, year: y}))} onMonthChange={m=>setDueDate(p=>({...p, month: m}))} onDayChange={d=>setDueDate(p=>({...p, day: d}))} years={years} /></div>
                    </div>
                    <div className="flex justify-end gap-4 pt-4"><button type="button" onClick={onClose}>انصراف</button><button type="submit">{billToEdit ? 'ذخیره' : 'ثبت'}</button></div>
                </form>
            </div>
        </div>
    );
};

interface GroupFinancialBillModalProps {
    onClose: () => void;
    onSubmit: (bills: FinancialBill[]) => void;
    students: Student[];
    classes: SchoolClass[];
    years: string[];
    existingBills: FinancialBill[];
}

const GroupFinancialBillModal: React.FC<GroupFinancialBillModalProps> = ({ onClose, onSubmit, students, classes, years, existingBills }) => {
    const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
    const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
    const [academicYear, setAcademicYear] = useState(years[0] || '');
    const [totalAmount, setTotalAmount] = useState('');
    const [title, setTitle] = useState('');
    const [issueDate, setIssueDate] = useState({ year: '', month: '', day: '' });

    React.useEffect(() => {
        const today = new Date().toLocaleDateString('fa-IR-u-nu-latn').replace(/\//g, '-').split('-');
        setIssueDate({ year: today[0], month: today[1], day: today[2] });
    }, []);
    
    const studentsToDisplay = useMemo(() => {
        if (selectedClassIds.length === 0) return students;
        return students.filter(s => selectedClassIds.includes(s.classId));
    }, [students, selectedClassIds]);

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) setSelectedStudentIds(studentsToDisplay.map(s => s.id));
        else setSelectedStudentIds([]);
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const amount = Number(totalAmount);
        if (selectedStudentIds.length === 0 || !academicYear || !title || !totalAmount || isNaN(amount) || amount <= 0 || !issueDate.year) {
            alert('لطفا حداقل یک دانش آموز را انتخاب کرده و عنوان، مبلغ و تاریخ معتبر وارد کنید.');
            return;
        }
        const formattedIssueDate = `${issueDate.year}-${issueDate.month.padStart(2, '0')}-${issueDate.day.padStart(2, '0')}`;
        const newBills: FinancialBill[] = selectedStudentIds.map(studentId => ({
            id: `fb-group-${Date.now()}-${studentId}`, studentId, academicYear, totalAmount: amount, title, issueDate: formattedIssueDate,
            amountPaid: 0, status: 'unpaid',
        }));
        onSubmit(newBills);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-3xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-4">ایجاد صورت‌حساب گروهی</h2>
                <form onSubmit={handleSubmit} className="flex-grow flex flex-col space-y-4 min-h-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <ThemedInput value={title} onChange={e=>setTitle(e.target.value)} placeholder="عنوان صورت‌حساب (مثلا: هزینه کتاب)" required />
                        <ThemedSelect value={academicYear} onChange={e => setAcademicYear(e.target.value)} required>{years.map(y => <option key={y} value={y}>{y}</option>)}</ThemedSelect>
                        <AmountInput value={totalAmount} onChange={setTotalAmount} placeholder="مبلغ (به ریال)" required />
                        <div><label>تاریخ صدور*</label><DateSelector prefix="issue-group" year={issueDate.year} month={issueDate.month} day={issueDate.day} onYearChange={y=>setIssueDate(p=>({...p, year: y}))} onMonthChange={m=>setIssueDate(p=>({...p, month: m}))} onDayChange={d=>setIssueDate(p=>({...p, day: d}))} years={years} /></div>
                    </div>
                    <div className="flex-grow grid grid-cols-3 gap-4 min-h-0">
                        <div className="col-span-1 border p-2 rounded-md overflow-y-auto">
                            {classes.map(c => (<label key={c.id} className="flex items-center gap-2"><input type="checkbox" checked={selectedClassIds.includes(c.id)} onChange={() => setSelectedClassIds(p => p.includes(c.id) ? p.filter(id => id !== c.id) : [...p, c.id])}/>{c.name}</label>))}
                        </div>
                        <div className="col-span-2 border p-2 rounded-md overflow-y-auto">
                            <label className="flex items-center gap-2 font-semibold"><input type="checkbox" onChange={handleSelectAll} checked={studentsToDisplay.length > 0 && selectedStudentIds.length === studentsToDisplay.length} />انتخاب همه</label>
                            <hr className="my-2"/>
                            {studentsToDisplay.map(s => (<label key={s.id} className="flex items-center gap-2"><input type="checkbox" checked={selectedStudentIds.includes(s.id)} onChange={() => setSelectedStudentIds(p => p.includes(s.id) ? p.filter(id => id !== s.id) : [...p, s.id])} />{formatFullName(s)}</label>))}
                        </div>
                    </div>
                    <div className="flex justify-end gap-4 pt-4 border-t">
                        <button type="button" onClick={onClose}>انصراف</button>
                        <button type="submit">ثبت برای {toPersianDigits(selectedStudentIds.length)} نفر</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

interface GroupPaymentModalProps {
    onClose: () => void;
    onSubmit: (payments: Payment[]) => void;
    students: Student[];
    classes: SchoolClass[];
    financialBills: FinancialBill[];
    admin: Admin;
    years: string[];
}

const GroupPaymentModal: React.FC<GroupPaymentModalProps> = ({ onClose, onSubmit, students, classes, financialBills, admin, years }) => {
    const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
    const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState({ year: '', month: '', day: '' });
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'cheque'>('cash');
    const [description, setDescription] = useState('');
    
    React.useEffect(() => {
        const today = new Date().toLocaleDateString('fa-IR-u-nu-latn').replace(/\//g, '-').split('-');
        setDate({ year: today[0], month: today[1], day: today[2] });
    }, []);

    const studentsToDisplay = useMemo(() => {
        let filtered = selectedClassIds.length > 0
            ? students.filter(s => selectedClassIds.includes(s.classId))
            : students;
        return filtered.sort((a,b) => a.lastName.localeCompare(b.lastName, 'fa'));
    }, [students, selectedClassIds]);

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) setSelectedStudentIds(studentsToDisplay.map(s => s.id));
        else setSelectedStudentIds([]);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const numAmount = Number(amount);
        if (selectedStudentIds.length === 0 || !amount || isNaN(numAmount) || numAmount <= 0 || !date.year) {
            alert('لطفا حداقل یک دانش آموز را انتخاب کرده و مبلغ و تاریخ معتبر وارد کنید.');
            return;
        }

        const newPayments: Payment[] = [];
        const studentsWithoutBills: string[] = [];
        const formattedDate = `${date.year}-${date.month.padStart(2, '0')}-${date.day.padStart(2, '0')}`;

        selectedStudentIds.forEach(studentId => {
            const studentOpenBills = financialBills
                .filter(b => b.studentId === studentId && (b.status === 'unpaid' || b.status === 'partially_paid'))
                .sort((a, b) => a.issueDate.localeCompare(b.issueDate));

            if (studentOpenBills.length > 0) {
                const targetBill = studentOpenBills[0];
                newPayments.push({
                    id: `p-group-${Date.now()}-${studentId}`, studentId, financialBillId: targetBill.id,
                    date: formattedDate, amount: numAmount, paymentMethod, description,
                    recordedBy: admin.id,
                });
            } else {
                studentsWithoutBills.push(formatFullName(students.find(s => s.id === studentId)));
            }
        });

        if (studentsWithoutBills.length > 0) {
            alert(`توجه: پرداخت برای ${toPersianDigits(studentsWithoutBills.length)} دانش آموز ثبت نشد زیرا صورت‌حساب باز نداشتند:\n${studentsWithoutBills.join('\n')}`);
        }

        if (newPayments.length > 0) {
            onSubmit(newPayments);
        } else {
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-3xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-4">ثبت پرداخت گروهی</h2>
                <form onSubmit={handleSubmit} className="flex-grow flex flex-col space-y-4 min-h-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <AmountInput value={amount} onChange={setAmount} placeholder="مبلغ (به ریال)" required />
                        <div><label>تاریخ پرداخت*</label><DateSelector prefix="payment-group" year={date.year} month={date.month} day={date.day} onYearChange={y=>setDate(p=>({...p, year: y}))} onMonthChange={m=>setDate(p=>({...p, month: m}))} onDayChange={d=>setDate(p=>({...p, day: d}))} years={years} /></div>
                    </div>
                     <div className="flex-grow grid grid-cols-3 gap-4 min-h-0">
                        <div className="col-span-1 border p-2 rounded-md overflow-y-auto">
                            {classes.map(c => (<label key={c.id} className="flex items-center gap-2"><input type="checkbox" checked={selectedClassIds.includes(c.id)} onChange={() => setSelectedClassIds(p => p.includes(c.id) ? p.filter(id => id !== c.id) : [...p, c.id])}/>{c.name}</label>))}
                        </div>
                        <div className="col-span-2 border p-2 rounded-md overflow-y-auto">
                            <label className="flex items-center gap-2 font-semibold"><input type="checkbox" onChange={handleSelectAll} checked={studentsToDisplay.length > 0 && selectedStudentIds.length === studentsToDisplay.length} />انتخاب همه</label>
                            <hr className="my-2"/>
                            {studentsToDisplay.map(s => (<label key={s.id} className="flex items-center gap-2"><input type="checkbox" checked={selectedStudentIds.includes(s.id)} onChange={() => setSelectedStudentIds(p => p.includes(s.id) ? p.filter(id => id !== s.id) : [...p, s.id])} />{formatFullName(s)}</label>))}
                        </div>
                    </div>
                    <div className="flex justify-end gap-4 pt-4 border-t"><button type="button" onClick={onClose}>انصراف</button><button type="submit">ثبت برای {toPersianDigits(selectedStudentIds.length)} نفر</button></div>
                </form>
            </div>
        </div>
    );
};

interface PaymentModalProps {
    paymentToEdit: Payment | null;
    financialBills: FinancialBill[];
    students: Student[];
    admin: Admin;
    onClose: () => void;
    onSubmit: (payment: Payment) => void;
    years: string[];
}
const PaymentModal: React.FC<PaymentModalProps> = ({ paymentToEdit, financialBills, students, admin, onClose, onSubmit, years }) => {
    const [studentId, setStudentId] = useState('');
    const [financialBillId, setFinancialBillId] = useState('');
    const [date, setDate] = useState({ year: '', month: '', day: '' });
    const [amount, setAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'cheque'>('cash');
    const [description, setDescription] = useState('');
    const [chequeInfo, setChequeInfo] = useState<Partial<ChequeInfo>>({ status: 'pending' });
    const [checkDate, setCheckDate] = useState({ year: '', month: '', day: '' });
    const [isScanning, setIsScanning] = useState(false);
    const [studentSearchTerm, setStudentSearchTerm] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const filteredStudents = useMemo(() => {
        if (!studentSearchTerm) return [];
        const term = studentSearchTerm.toLowerCase();
        return students.filter(s =>
            formatFullName(s).toLowerCase().includes(term) ||
            s.className.toLowerCase().includes(term)
        );
    }, [studentSearchTerm, students]);

    const selectedStudentDebt = useMemo(() => {
        if (!studentId) return 0;
        return financialBills
            .filter(b => b.studentId === studentId)
            .reduce((sum, bill) => sum + (bill.totalAmount - bill.amountPaid), 0);
    }, [studentId, financialBills]);

    const studentBills = useMemo(() => {
        if (!studentId) return [];
        return financialBills.filter(f => f.studentId === studentId && f.status !== 'paid' && f.status !== 'overpaid');
    }, [financialBills, studentId]);

    React.useEffect(() => {
        const today = new Date().toLocaleDateString('fa-IR-u-nu-latn').replace(/\//g, '-').split('-');
        const [y, m, d] = today;

        if (paymentToEdit) {
            const student = students.find(s => s.id === paymentToEdit.studentId);
            if (student) {
                setStudentSearchTerm(formatFullName(student));
            }
            setStudentId(paymentToEdit.studentId);
            setFinancialBillId(paymentToEdit.financialBillId);
            const [payY, payM, payD] = paymentToEdit.date.split('-');
            setDate({ year: payY, month: String(parseInt(payM,10)), day: String(parseInt(payD,10)) });
            setAmount(String(paymentToEdit.amount));
            setPaymentMethod(paymentToEdit.paymentMethod);
            setDescription(paymentToEdit.description || '');
            if (paymentToEdit.chequeInfo) {
                setChequeInfo(paymentToEdit.chequeInfo);
                const [checkY, checkM, checkD] = paymentToEdit.chequeInfo.checkDate.split('-');
                setCheckDate({ year: checkY, month: String(parseInt(checkM,10)), day: String(parseInt(checkD,10)) });
            } else {
                 setCheckDate({ year: y, month: m, day: d });
            }
        } else {
            setDate({ year: y, month: m, day: d });
            setCheckDate({ year: y, month: m, day: d });
        }
    }, [paymentToEdit, students]);
    
    const parseBarcodeData = (barcodeData: string) => {
        let dataPayload = barcodeData;
        try {
            const url = new URL(barcodeData);
            if (url.searchParams.has('d')) { dataPayload = url.searchParams.get('d') || ''; }
        } catch (e) { /* Not a URL */ }
    
        const parts = dataPayload.trim().split(/[|\n\r]+/);
        if (parts.length < 7) { alert("بارکد اسکن شده نامعتبر است."); return; }
        const [,, holderNationalId, iban, branchCode, chequeSerial, sayadiNumber] = parts;
        if (!sayadiNumber || sayadiNumber.length !== 16 || !/^\d+$/.test(sayadiNumber)) { alert("شماره صیادی ۱۶ رقمی در بارکد یافت نشد."); return; }
    
        setChequeInfo(prev => ({ ...prev, holderNationalId, iban, branchCode: branchCode?.replace('_', '-'), chequeSerial, sayadiNumber }));
        alert("اطلاعات چک با موفقیت از بارکد اسکن شد.");
    };

    useEffect(() => {
        if (!isScanning) return;
        const scannerElementId = "qr-reader-container";
        if (!document.getElementById(scannerElementId)) return;

        const html5QrCode = new Html5Qrcode(scannerElementId);
        const qrCodeSuccessCallback = (decodedText: string) => {
            html5QrCode.stop().then(() => { setIsScanning(false); parseBarcodeData(decodedText); }).catch(err => { console.error("Failed to stop scanner", err); setIsScanning(false); });
        };
        html5QrCode.start({ facingMode: "environment" }, { fps: 10, qrbox: { width: 250, height: 250 } }, qrCodeSuccessCallback, undefined)
            .catch(err => { alert('خطا در فعالسازی دوربین.'); setIsScanning(false); });

        return () => {
            if (html5QrCode && typeof html5QrCode.getRunningTrackCapabilities === 'function' && html5QrCode.isScanning) {
                html5QrCode.stop().catch(err => console.error("Failed to stop scanner on cleanup.", err));
            }
        };
    }, [isScanning]);


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!studentId || !financialBillId || !amount || isNaN(Number(amount))) {
            alert('دانش آموز، صورت‌حساب و مبلغ معتبر را وارد کنید.');
            return;
        }
        
        let finalChequeInfo: ChequeInfo | undefined = undefined;
        if (paymentMethod === 'cheque') {
            if (!chequeInfo.holderName || !chequeInfo.chequeSeries || !chequeInfo.chequeSerial || !checkDate.year) { alert('لطفا فیلدهای ضروری چک را تکمیل کنید.'); return; }
            finalChequeInfo = {
                ...chequeInfo,
                holderName: chequeInfo.holderName!, chequeSeries: chequeInfo.chequeSeries!, chequeSerial: chequeInfo.chequeSerial!,
                checkDate: `${checkDate.year}-${String(checkDate.month).padStart(2, '0')}-${String(checkDate.day).padStart(2, '0')}`,
                status: chequeInfo.status || 'pending',
            };
        }

        onSubmit({
            id: paymentToEdit ? paymentToEdit.id : `p-${Date.now()}`,
            financialBillId, studentId,
            date: `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`,
            amount: Number(amount), paymentMethod, description, chequeInfo: finalChequeInfo, recordedBy: admin.id,
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] flex flex-col relative" onClick={e => e.stopPropagation()}>
                {isScanning && (
                    <div className="absolute inset-0 bg-white flex flex-col items-center justify-center z-20">
                        <p className="text-gray-800 text-lg mb-4">بارکد چک را مقابل دوربین قرار دهید</p>
                        <div id="qr-reader-container" style={{ width: '300px' }}></div>
                        <button onClick={() => setIsScanning(false)} className="mt-4 px-4 py-2 bg-red-500 text-white rounded-md">لغو اسکن</button>
                    </div>
                )}
                <h2 className="text-xl font-bold mb-4">{paymentToEdit ? 'ویرایش' : 'ثبت'} پرداخت</h2>
                <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto flex-grow pr-2">
                    <div className="grid grid-cols-2 gap-4">
                         <div>
                            <ThemedInput
                                type="text"
                                value={studentSearchTerm}
                                onChange={(e) => {
                                    setStudentSearchTerm(e.target.value);
                                    setIsDropdownOpen(true);
                                    if(e.target.value === '') {
                                        setStudentId('');
                                        setFinancialBillId('');
                                    }
                                }}
                                onFocus={() => setIsDropdownOpen(true)}
                                onBlur={() => setTimeout(() => setIsDropdownOpen(false), 150)}
                                placeholder="جستجوی نام دانش آموز..."
                                required={!studentId}
                                autoComplete="off"
                            />
                            {isDropdownOpen && filteredStudents.length > 0 && (
                                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                    <ul>
                                        {filteredStudents.map(s => (
                                            <li key={s.id}
                                                className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                                                onClick={() => {
                                                    setStudentId(s.id);
                                                    setStudentSearchTerm(formatFullName(s));
                                                    setFinancialBillId('');
                                                    setIsDropdownOpen(false);
                                                }}
                                            >
                                                {formatFullName(s)} - <span className="text-gray-500">{s.className}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                             {studentId && selectedStudentDebt > 0 && (
                                <p className="text-xs text-red-600 mt-1">
                                    مجموع بدهی باقی‌مانده: {toPersianDigits(selectedStudentDebt.toLocaleString())} ریال
                                </p>
                            )}
                        </div>
                        <ThemedSelect value={financialBillId} onChange={e => setFinancialBillId(e.target.value)} required disabled={!studentId}>
                            <option value="">انتخاب صورت‌حساب...</option>
                            {studentBills.map(bill => <option key={bill.id} value={bill.id}>{bill.title} (مانده: {toPersianDigits((bill.totalAmount - bill.amountPaid).toLocaleString())})</option>)}
                        </ThemedSelect>
                    </div>
                    <AmountInput value={amount} onChange={setAmount} placeholder="مبلغ" required />
                    <DateSelector prefix="payment" year={date.year} month={date.month} day={date.day} onYearChange={y => setDate(p=>({...p, year: y}))} onMonthChange={m => setDate(p=>({...p, month: m}))} onDayChange={d => setDate(p=>({...p, day: d}))} years={years} />
                    <div className="flex gap-4"><label className="flex items-center gap-2"><input type="radio" value="cash" checked={paymentMethod === 'cash'} onChange={() => setPaymentMethod('cash')} /> نقدی</label><label className="flex items-center gap-2"><input type="radio" value="cheque" checked={paymentMethod === 'cheque'} onChange={() => setPaymentMethod('cheque')} /> چکی</label></div>
                    
                    {paymentMethod === 'cheque' && (
                        <div className="p-4 border rounded-lg space-y-3 bg-gray-50">
                            <div className="flex justify-between items-center"><h3 className="font-semibold">اطلاعات چک</h3><button type="button" onClick={() => setIsScanning(true)} className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-200 rounded-md"><CameraIcon /><span>اسکن بارکد</span></button></div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div><label>نام صاحب چک*</label><ThemedInput value={chequeInfo.holderName || ''} onChange={e => setChequeInfo(p => ({...p, holderName: e.target.value}))} required /></div>
                                <div><label>کد ملی صاحب چک</label><ThemedInput value={chequeInfo.holderNationalId || ''} onChange={e => setChequeInfo(p => ({...p, holderNationalId: e.target.value}))} /></div>
                                <div><label>سری چک*</label><ThemedInput value={chequeInfo.chequeSeries || ''} onChange={e => setChequeInfo(p => ({...p, chequeSeries: e.target.value}))} required /></div>
                                <div><label>سریال چک*</label><ThemedInput value={chequeInfo.chequeSerial || ''} onChange={e => setChequeInfo(p => ({...p, chequeSerial: e.target.value}))} required /></div>
                                <div><label>شماره چک صیادی</label><ThemedInput value={chequeInfo.sayadiNumber || ''} onChange={e => setChequeInfo(p => ({...p, sayadiNumber: e.target.value}))} /></div>
                                <div><label>کد شعبه</label><ThemedInput value={chequeInfo.branchCode || ''} onChange={e => setChequeInfo(p => ({...p, branchCode: e.target.value}))} /></div>
                                <div className="md:col-span-2"><label>شماره شبا</label><ThemedInput value={chequeInfo.iban || ''} onChange={e => setChequeInfo(p => ({...p, iban: e.target.value}))} /></div>
                                <div className="md:col-span-1"><label>تاریخ چک*</label><DateSelector prefix="check" year={checkDate.year} month={checkDate.month} day={checkDate.day} onYearChange={y => setCheckDate(p=>({...p, year: y}))} onMonthChange={m => setCheckDate(p=>({...p, month: m}))} onDayChange={d => setCheckDate(p=>({...p, day: d}))} years={years} /></div>
                                <div className="md:col-span-1"><label>وضعیت چک</label><ThemedSelect value={chequeInfo.status} onChange={e => setChequeInfo(p => ({...p, status: e.target.value as any}))}><option value="pending">در انتظار</option><option value="cleared">وصول شده</option><option value="bounced">برگشت خورده</option></ThemedSelect></div>
                            </div>
                        </div>
                    )}
                    <ThemedInput value={description} onChange={e => setDescription(e.target.value)} placeholder="توضیحات (اختیاری)" />
                    <div className="flex justify-end gap-4 pt-4 sticky bottom-0 bg-white border-t"><button type="button" onClick={onClose}>انصراف</button><button type="submit" disabled={!financialBillId}>{paymentToEdit ? 'ذخیره' : 'ثبت'}</button></div>
                </form>
            </div>
        </div>
    );
};
// #endregion

interface FinanceTabProps {
    admin: Admin;
    years: string[];
}

const FinanceTab: React.FC<FinanceTabProps> = ({ admin, years }) => {
    const { students, classes, financialBills, payments, saveFinancialBill, deleteFinancialBill, savePayment, deletePayment, saveGroupFinancialBills, saveGroupPayments } = useData();
    const [activeTab, setActiveTab] = useState('bills');
    const [activeModal, setActiveModal] = useState<'bill' | 'payment' | 'group_bill' | 'group_payment' | null>(null);
    const [itemToEdit, setItemToEdit] = useState<FinancialBill | Payment | null>(null);
    
    // Filters for bills
    const [billStudentFilter, setBillStudentFilter] = useState('');
    const [billClassFilter, setBillClassFilter] = useState('');
    const [billStatusFilter, setBillStatusFilter] = useState<TuitionStatus | 'all'>('all');
    
    // Filters for payments
    const [paymentStudentFilter, setPaymentStudentFilter] = useState('');
    const [paymentBillFilter, setPaymentBillFilter] = useState('');

    const enrichedBills = useMemo(() => {
        return financialBills.map(bill => {
            const student = students.find(s => s.id === bill.studentId);
            return { ...bill, studentName: formatFullName(student) || 'حذف شده', className: student?.className || 'نامشخص', remainingAmount: bill.totalAmount - bill.amountPaid };
        });
    }, [financialBills, students]);

    const filteredBills = useMemo(() => {
        return enrichedBills.filter(bill =>
            (billStudentFilter ? bill.studentName.includes(billStudentFilter) : true) &&
            (billClassFilter ? bill.className === classes.find(c => c.id === billClassFilter)?.name : true) &&
            (billStatusFilter !== 'all' ? bill.status === billStatusFilter : true)
        );
    }, [enrichedBills, billStudentFilter, billClassFilter, billStatusFilter, classes]);

    const { items: sortedBills, requestSort: requestSortBills, sortConfig: sortConfigBills } = useSortableData(filteredBills, [{ key: 'issueDate', direction: 'descending' }]);
    
    const enrichedPayments = useMemo(() => {
        return payments.map(p => {
            const student = students.find(s => s.id === p.studentId);
            const bill = financialBills.find(b => b.id === p.financialBillId);
            return { ...p, studentName: formatFullName(student) || 'حذف شده', billTitle: bill?.title || 'حذف شده' };
        });
    }, [payments, students, financialBills]);

    const filteredPayments = useMemo(() => {
        return enrichedPayments.filter(p => 
            (paymentStudentFilter ? p.studentName.includes(paymentStudentFilter) : true) &&
            (paymentBillFilter ? p.financialBillId === paymentBillFilter : true)
        );
    }, [enrichedPayments, paymentStudentFilter, paymentBillFilter]);

    const { items: sortedPayments, requestSort: requestSortPayments, sortConfig: sortConfigPayments } = useSortableData(filteredPayments, [{ key: 'date', direction: 'descending' }]);


    const statusStyles: Record<TuitionStatus, string> = { paid: 'bg-green-100 text-green-800', partially_paid: 'bg-yellow-100 text-yellow-800', unpaid: 'bg-red-100 text-red-800', overpaid: 'bg-blue-100 text-blue-800' };
    const statusText: Record<TuitionStatus, string> = { paid: 'پرداخت کامل', partially_paid: 'پرداخت ناقص', unpaid: 'پرداخت نشده', overpaid: 'بیشتر از شهریه' };

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold">مدیریت مالی</h2>
            <div className="bg-gray-100 p-1 rounded-lg grid grid-cols-2 max-w-sm">
                <button onClick={() => setActiveTab('bills')} className={`px-4 py-2 text-sm rounded-md ${activeTab === 'bills' ? 'bg-white shadow' : ''}`}>مدیریت صورت‌حساب‌ها</button>
                <button onClick={() => setActiveTab('payments')} className={`px-4 py-2 text-sm rounded-md ${activeTab === 'payments' ? 'bg-white shadow' : ''}`}>مدیریت پرداخت‌ها</button>
            </div>
            
            {activeTab === 'bills' && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center"><h3 className="text-lg font-semibold">لیست صورت‌حساب‌ها</h3><div className="flex gap-2">
                           <button onClick={() => setActiveModal('group_bill')} className="px-4 py-2 bg-green-500 text-white rounded-md text-sm">ایجاد گروهی</button>
                           <button onClick={() => { setItemToEdit(null); setActiveModal('bill'); }} className="px-4 py-2 bg-blue-500 text-white rounded-md text-sm">ایجاد جدید</button>
                        </div></div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg border">
                        <ThemedInput placeholder="جستجوی نام دانش آموز..." value={billStudentFilter} onChange={e => setBillStudentFilter(e.target.value)} />
                        <ThemedSelect value={billClassFilter} onChange={e => setBillClassFilter(e.target.value)}><option value="">همه کلاس‌ها</option>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</ThemedSelect>
                        <ThemedSelect value={billStatusFilter} onChange={e => setBillStatusFilter(e.target.value as any)}><option value="all">همه وضعیت‌ها</option>{Object.keys(statusText).map(s=><option key={s} value={s}>{statusText[s as TuitionStatus]}</option>)}</ThemedSelect>
                    </div>
                     <div className="overflow-x-auto"><table className="w-full text-sm">
                        <thead className="bg-gray-50"><tr>
                            <SortableHeader sortKey="studentName" requestSort={requestSortBills} sortConfig={sortConfigBills}>دانش آموز</SortableHeader>
                            <SortableHeader sortKey="title" requestSort={requestSortBills} sortConfig={sortConfigBills}>عنوان</SortableHeader>
                            <SortableHeader sortKey="totalAmount" requestSort={requestSortBills} sortConfig={sortConfigBills}>مبلغ کل</SortableHeader>
                            <SortableHeader sortKey="remainingAmount" requestSort={requestSortBills} sortConfig={sortConfigBills}>مانده</SortableHeader>
                            <SortableHeader sortKey="issueDate" requestSort={requestSortBills} sortConfig={sortConfigBills}>تاریخ ثبت</SortableHeader>
                            <SortableHeader sortKey="status" requestSort={requestSortBills} sortConfig={sortConfigBills}>وضعیت</SortableHeader>
                            <th className="px-4 py-3">اقدامات</th>
                        </tr></thead>
                        <tbody>{sortedBills.map(bill => <tr key={bill.id} className="border-b">
                            <td className="p-2 font-semibold">{bill.studentName} ({bill.className})</td>
                            <td className="p-2">{bill.title}</td>
                            <td className="p-2">{toPersianDigits(bill.totalAmount.toLocaleString())}</td>
                            <td className="p-2 font-bold">{toPersianDigits(bill.remainingAmount.toLocaleString())}</td>
                            <td className="p-2">{toPersianDigits(bill.issueDate)}</td>
                            <td className="p-2"><span className={`px-2 py-1 rounded-full text-xs ${statusStyles[bill.status]}`}>{statusText[bill.status]}</span></td>
                            <td className="p-2 text-xs space-x-2 space-x-reverse"><button onClick={() => { setItemToEdit(bill); setActiveModal('bill'); }} className="font-medium text-blue-600 hover:underline">ویرایش</button><button onClick={() => deleteFinancialBill(bill.id)} className="font-medium text-red-600 hover:underline">حذف</button></td>
                        </tr>)}</tbody>
                    </table></div>
                </div>
            )}

            {activeTab === 'payments' && (
                <div className="space-y-4">
                     <div className="flex justify-between items-center"><h3 className="text-lg font-semibold">لیست پرداخت‌ها</h3>
                         <div className="flex gap-2">
                           <button onClick={() => setActiveModal('group_payment')} className="px-4 py-2 bg-green-500 text-white rounded-md text-sm">ثبت پرداخت گروهی</button>
                           <button onClick={() => { setItemToEdit(null); setActiveModal('payment'); }} className="px-4 py-2 bg-blue-500 text-white rounded-md text-sm">ثبت پرداخت جدید</button>
                        </div></div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg border">
                        <ThemedInput placeholder="جستجوی نام دانش آموز..." value={paymentStudentFilter} onChange={e => setPaymentStudentFilter(e.target.value)} />
                        <ThemedSelect value={paymentBillFilter} onChange={e => setPaymentBillFilter(e.target.value)}>
                            <option value="">همه صورت‌حساب‌ها</option>
                            {financialBills.map(b => <option key={b.id} value={b.id}>{b.title} ({formatFullName(students.find(s=>s.id === b.studentId))})</option>)}
                        </ThemedSelect>
                    </div>
                     <div className="overflow-x-auto"><table className="w-full text-sm">
                        <thead className="bg-gray-50"><tr>
                            <SortableHeader sortKey="studentName" requestSort={requestSortPayments} sortConfig={sortConfigPayments}>دانش آموز</SortableHeader>
                            <SortableHeader sortKey="billTitle" requestSort={requestSortPayments} sortConfig={sortConfigPayments}>بابت</SortableHeader>
                            <SortableHeader sortKey="date" requestSort={requestSortPayments} sortConfig={sortConfigPayments}>تاریخ</SortableHeader>
                            <SortableHeader sortKey="amount" requestSort={requestSortPayments} sortConfig={sortConfigPayments}>مبلغ</SortableHeader>
                            <SortableHeader sortKey="paymentMethod" requestSort={requestSortPayments} sortConfig={sortConfigPayments}>روش</SortableHeader>
                            <th className="px-4 py-3">جزئیات چک</th>
                            <th className="px-4 py-3">اقدامات</th>
                        </tr></thead>
                        <tbody>{sortedPayments.map(p => {
                            return <tr key={p.id} className="border-b">
                                <td className="p-2">{p.studentName}</td>
                                <td className="p-2 text-xs">{p.billTitle}</td>
                                <td className="p-2">{toPersianDigits(p.date)}</td>
                                <td className="p-2">{toPersianDigits(p.amount.toLocaleString())}</td>
                                <td className="p-2">{p.paymentMethod === 'cash' ? 'نقدی' : 'چک'}</td>
                                <td className="p-2 text-xs">{p.chequeInfo ? `${p.chequeInfo.holderName} - سریال ${p.chequeInfo.chequeSerial} - ${p.chequeInfo.status}` : '-'}</td>
                                <td className="p-2 text-xs space-x-2 space-x-reverse"><button onClick={() => { setItemToEdit(p); setActiveModal('payment'); }} className="font-medium text-blue-600 hover:underline">ویرایش</button><button onClick={() => deletePayment(p.id)} className="font-medium text-red-600 hover:underline">حذف</button></td>
                            </tr>
                        })}</tbody>
                    </table></div>
                </div>
            )}
            
            {activeModal === 'bill' && <FinancialBillModal billToEdit={itemToEdit as FinancialBill | null} students={students} onClose={() => setActiveModal(null)} onSubmit={bill => { saveFinancialBill(bill); setActiveModal(null); }} years={years} />}
            {activeModal === 'payment' && <PaymentModal paymentToEdit={itemToEdit as Payment | null} financialBills={financialBills} students={students} admin={admin} onClose={() => setActiveModal(null)} onSubmit={payment => { savePayment(payment); setActiveModal(null); }} years={years} />}
            {activeModal === 'group_bill' && <GroupFinancialBillModal onClose={() => setActiveModal(null)} onSubmit={bills => { saveGroupFinancialBills(bills); setActiveModal(null); }} students={students} classes={classes} years={years} existingBills={financialBills} />}
            {activeModal === 'group_payment' && <GroupPaymentModal onClose={() => setActiveModal(null)} onSubmit={payments => { saveGroupPayments(payments); setActiveModal(null); }} students={students} classes={classes} financialBills={financialBills} admin={admin} years={years} />}
        </div>
    );
};

export default FinanceTab;
