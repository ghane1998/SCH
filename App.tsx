

import React, { useState, createContext, useContext, useMemo, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import type { User, UserRole, Student, Teacher, Admin, SchoolSettings, SchoolClass, Grade, DisciplinaryIncident, Attendance, Exam, PTAMeeting, PTAAttendance, FinancialBill, Payment, TuitionStatus, UpcomingEvent, Responsibility, ResponsibilityAssignment, AnecdotalRecord, ParentMeeting, Badge, AwardedBadge, Notification, SchoolAsset, AssetAssignment, ScheduledNotification } from './types';
import { DEFAULT_SETTINGS } from './data';
import LoginScreen from './components/LoginScreen';
import AdminDashboard from './components/admin/AdminDashboard';
// FIX: TeacherDashboard is now correctly imported with a default export.
import TeacherDashboard from './components/teacher/TeacherDashboard';
import StudentDashboard from './components/student/StudentDashboard';
import { formatFullName } from './components/common/formatters';

// #region Auth Context
interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  login: (id: string, role: UserRole) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>((() => {
    const saved = localStorage.getItem('school_user');
    return saved ? JSON.parse(saved) : null;
  })());
  const [role, setRole] = useState<UserRole | null>(localStorage.getItem('school_role') as UserRole || null);
  
  const { students, teachers, admins } = useData();

  const login = (id: string, role: UserRole) => {
    let foundUser: User | undefined;
    if (role === 'student') {
      foundUser = students.find(s => s.id === id);
    } else if (role === 'teacher') {
      foundUser = teachers.find(t => t.id === id);
    } else if (role === 'admin') {
      foundUser = admins.find(a => a.id === id);
    }

    if (foundUser) {
      setUser(foundUser);
      setRole(role);
      localStorage.setItem('school_user', JSON.stringify(foundUser));
      localStorage.setItem('school_role', role);
    } else {
      alert('کاربر یافت نشد!');
    }
  };

  const logout = () => {
    setUser(null);
    setRole(null);
    localStorage.removeItem('school_user');
    localStorage.removeItem('school_role');
  };

  const value = useMemo(() => ({ user, role, login, logout }), [user, role, students, teachers, admins]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
// #endregion

// #region Settings Context & Theme
interface SettingsContextType {
  settings: SchoolSettings;
  setSettings: React.Dispatch<React.SetStateAction<SchoolSettings>>;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};

const THEME_COLORS: Record<string, Record<number, string>> = {
    indigo: { 50: '#eef2ff', 100: '#e0e7ff', 200: '#c7d2fe', 300: '#a5b4fc', 400: '#818cf8', 500: '#6366f1', 600: '#4f46e5', 700: '#4338ca', 800: '#3730a3', 900: '#312e81', 950: '#1e1b4b' },
    blue: { 50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd', 400: '#60a5fa', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8', 800: '#1e40af', 900: '#1e3a8a', 950: '#172554' },
    green: { 50: '#f0fdf4', 100: '#dcfce7', 200: '#bbf7d0', 300: '#86efac', 400: '#4ade80', 500: '#22c55e', 600: '#16a34a', 700: '#15803d', 800: '#166534', 900: '#14532d', 950: '#052e16' },
    red: { 50: '#fef2f2', 100: '#fee2e2', 200: '#fecaca', 300: '#fca5a5', 400: '#f87171', 500: '#ef4444', 600: '#dc2626', 700: '#b91c1c', 800: '#991b1b', 900: '#7f1d1d', 950: '#450a0a' },
    purple: { 50: '#f5f3ff', 100: '#ede9fe', 200: '#ddd6fe', 300: '#c4b5fd', 400: '#a78bfa', 500: '#8b5cf6', 600: '#7c3aed', 700: '#6d28d9', 800: '#5b21b6', 900: '#4c1d95', 950: '#2e1065' },
    teal: { 50: '#f0fdfa', 100: '#ccfbf1', 200: '#99f6e4', 300: '#5eead4', 400: '#2dd4bf', 500: '#14b8a6', 600: '#0d9488', 700: '#0f766e', 800: '#115e59', 900: '#134e4a', 950: '#042f2e' },
    orange: { 50: '#fff7ed', 100: '#ffedd5', 200: '#fed7aa', 300: '#fdba74', 400: '#fb923c', 500: '#f97316', 600: '#ea580c', 700: '#c2410c', 800: '#9a3412', 900: '#7c2d12', 950: '#431407' },
};

const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<SchoolSettings>(DEFAULT_SETTINGS);

    useEffect(() => {
        fetch('/api/settings')
            .then(res => res.json())
            .then(data => setSettings(data))
            .catch(err => console.error('Error fetching settings:', err));
    }, []);

    const updateSettings = async (newSettings: SchoolSettings) => {
        setSettings(newSettings);
        try {
            await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newSettings)
            });
        } catch (err) {
            console.error('Error saving settings:', err);
        }
    };

    useEffect(() => {
        const root = document.documentElement;
        
        const colors = settings.themeColor === 'custom' 
            ? { 500: settings.customThemeColor, 600: settings.customThemeColor, 700: settings.customThemeColor } // simple custom color
            : THEME_COLORS[settings.themeColor] || THEME_COLORS.indigo;

        Object.entries(colors).forEach(([key, value]) => {
            root.style.setProperty(`--primary-${key}`, value as string);
        });

        root.style.setProperty('--text-primary', settings.textColorPrimary);
        root.style.setProperty('--text-secondary', settings.textColorSecondary);
        root.style.setProperty('--bg-primary', settings.bgColorPrimary);
        root.style.setProperty('--card-bg', settings.cardBgColor);
        root.style.setProperty('--input-bg', settings.inputBgColor);
        root.style.setProperty('--input-border', settings.inputBorderColor);
        document.body.style.fontFamily = settings.font;
        document.body.style.backgroundColor = 'var(--bg-primary)';
        document.body.style.color = 'var(--text-primary)';
        
    }, [settings]);

    const value = useMemo(() => ({ settings, setSettings: updateSettings as any }), [settings]);

    return (
        <SettingsContext.Provider value={value}>
            {children}
        </SettingsContext.Provider>
    );
};
// #endregion

// #region Data Context
interface DataContextType {
  students: Student[];
  teachers: Teacher[];
  admins: Admin[];
  classes: SchoolClass[];
  grades: Grade[];
  disciplineIncidents: DisciplinaryIncident[];
  attendance: Attendance[];
  exams: Exam[];
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
  notifications: Notification[];
  scheduledNotifications: ScheduledNotification[];
  schoolAssets: SchoolAsset[];
  assetAssignments: AssetAssignment[];
  
  saveStudent: (student: Student) => void;
  deleteStudent: (studentId: string) => void;
  importStudents: (newStudents: Student[]) => void;
  
  saveTeacher: (teacher: Teacher, classIds: string[]) => void;
  deleteTeacher: (teacherId: string) => void;
  importTeachers: (newTeachers: Teacher[]) => void;
  
  saveClass: (schoolClass: SchoolClass) => void;
  deleteClass: (classId: string) => void;
  importClasses: (newClasses: SchoolClass[]) => void;
  
  saveGrade: (grade: Grade) => void;
  deleteGrade: (gradeId: string) => void;
  saveGroupGrades: (newGrades: Grade[]) => void;

  saveDisciplinaryIncident: (incident: DisciplinaryIncident) => void;
  deleteDisciplinaryIncident: (incidentId: string) => void;
  saveGroupDisciplinaryIncidents: (incidents: DisciplinaryIncident[]) => void;
  
  saveAttendance: (record: Attendance) => void;
  deleteAttendance: (recordId: string) => void;
  saveGroupAttendance: (records: Attendance[]) => void;
  
  saveExam: (exam: Exam) => void;
  deleteExam: (examId: string) => void;
  
  savePtaMeeting: (meeting: PTAMeeting) => void;
  deletePtaMeeting: (meetingId: string) => void;
  saveGroupPtaAttendance: (records: PTAAttendance[]) => void;
  
  saveFinancialBill: (bill: FinancialBill) => void;
  deleteFinancialBill: (billId: string) => void;
  saveGroupFinancialBills: (bills: FinancialBill[]) => void;
  
  savePayment: (payment: Payment) => void;
  deletePayment: (paymentId: string) => void;
  saveGroupPayments: (payments: Payment[]) => void;
  
  saveEvent: (event: UpcomingEvent) => void;
  deleteEvent: (eventId: string) => void;

  saveResponsibility: (responsibility: Responsibility) => void;
  deleteResponsibility: (responsibilityId: string) => void;
  saveResponsibilityAssignment: (assignment: ResponsibilityAssignment) => void;
  deleteResponsibilityAssignment: (assignmentId: string) => void;
  
  saveAnecdotalRecord: (record: AnecdotalRecord) => void;
  deleteAnecdotalRecord: (recordId: string) => void;
  
  saveParentMeeting: (meeting: ParentMeeting) => void;
  deleteParentMeeting: (meetingId: string) => void;

  saveBadge: (badge: Badge) => void;
  deleteBadge: (badgeId: string) => void;
  saveAwardedBadge: (awardedBadge: AwardedBadge) => void;
  deleteAwardedBadge: (awardedBadgeId: string) => void;

  saveNotification: (notification: Notification) => void;
  deleteNotification: (notificationId: string) => void;

  saveScheduledNotification: (notification: ScheduledNotification) => void;
  deleteScheduledNotification: (notificationId: string) => void;

  saveSchoolAsset: (asset: SchoolAsset) => void;
  deleteSchoolAsset: (assetId: string) => void;
  assignAsset: (data: { barcode: string; studentId: string }) => void;
  returnAsset: (assignmentId: string) => void;
  importSchoolAssets: (newAssets: SchoolAsset[]) => void;
  assignGroupAssets: (assignments: { barcode: string; studentId: string; notes?: string }[]) => { successCount: number; errors: string[] };
}

const DataContext = createContext<DataContextType | null>(null);

export const useData = () => {
    const context = useContext(DataContext);
    if (!context) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};

const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [students, setStudents] = useState<Student[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [admins, setAdmins] = useState<Admin[]>([]);
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [grades, setGrades] = useState<Grade[]>([]);
    const [disciplineIncidents, setDisciplineIncidents] = useState<DisciplinaryIncident[]>([]);
    const [attendance, setAttendance] = useState<Attendance[]>([]);
    const [exams, setExams] = useState<Exam[]>([]);
    const [ptaMeetings, setPtaMeetings] = useState<PTAMeeting[]>([]);
    const [ptaAttendance, setPtaAttendance] = useState<PTAAttendance[]>([]);
    const [financialBills, setFinancialBills] = useState<FinancialBill[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [events, setEvents] = useState<UpcomingEvent[]>([]);
    const [responsibilities, setResponsibilities] = useState<Responsibility[]>([]);
    const [responsibilityAssignments, setResponsibilityAssignments] = useState<ResponsibilityAssignment[]>([]);
    const [anecdotalRecords, setAnecdotalRecords] = useState<AnecdotalRecord[]>([]);
    const [parentMeetings, setParentMeetings] = useState<ParentMeeting[]>([]);
    const [badges, setBadges] = useState<Badge[]>([]);
    const [awardedBadges, setAwardedBadges] = useState<AwardedBadge[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [scheduledNotifications, setScheduledNotifications] = useState<ScheduledNotification[]>([]);
    const [schoolAssets, setSchoolAssets] = useState<SchoolAsset[]>([]);
    const [assetAssignments, setAssetAssignments] = useState<AssetAssignment[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const [
                studentsRes, teachersRes, adminsRes, classesRes, gradesRes, 
                disciplineRes, attendanceRes, examsRes, ptaMeetingsRes, 
                ptaAttendanceRes, billsRes, paymentsRes, eventsRes, 
                respRes, respAssignRes, anecdotalRes, parentMeetingsRes, 
                badgesRes, awardedBadgesRes, notificationsRes, scheduledNotificationsRes, assetsRes, assetAssignRes
            ] = await Promise.all([
                fetch('/api/students').then(r => r.json()),
                fetch('/api/teachers').then(r => r.json()),
                fetch('/api/admins').then(r => r.json()),
                fetch('/api/classes').then(r => r.json()),
                fetch('/api/grades').then(r => r.json()),
                fetch('/api/discipline').then(r => r.json()),
                fetch('/api/attendance').then(r => r.json()),
                fetch('/api/exams').then(r => r.json()),
                fetch('/api/pta_meetings').then(r => r.json()),
                fetch('/api/pta_attendance').then(r => r.json()),
                fetch('/api/bills').then(r => r.json()),
                fetch('/api/payments').then(r => r.json()),
                fetch('/api/events').then(r => r.json()),
                fetch('/api/responsibilities').then(r => r.json()),
                fetch('/api/responsibility_assignments').then(r => r.json()),
                fetch('/api/anecdotal_records').then(r => r.json()),
                fetch('/api/parent_meetings').then(r => r.json()),
                fetch('/api/badges').then(r => r.json()),
                fetch('/api/awarded_badges').then(r => r.json()),
                fetch('/api/notifications').then(r => r.json()),
                fetch('/api/scheduled_notifications').then(r => r.json()),
                fetch('/api/assets').then(r => r.json()),
                fetch('/api/asset_assignments').then(r => r.json()),
            ]);

            setStudents(studentsRes);
            setTeachers(teachersRes);
            setAdmins(adminsRes);
            setClasses(classesRes);
            setGrades(gradesRes);
            setDisciplineIncidents(disciplineRes);
            setAttendance(attendanceRes);
            setExams(examsRes);
            setPtaMeetings(ptaMeetingsRes);
            setPtaAttendance(ptaAttendanceRes);
            setFinancialBills(billsRes);
            setPayments(paymentsRes);
            setEvents(eventsRes);
            setResponsibilities(respRes);
            setResponsibilityAssignments(respAssignRes);
            setAnecdotalRecords(anecdotalRes);
            setParentMeetings(parentMeetingsRes);
            setBadges(badgesRes);
            setAwardedBadges(awardedBadgesRes);
            setNotifications(notificationsRes);
            setScheduledNotifications(scheduledNotificationsRes);
            setSchoolAssets(assetsRes);
            setAssetAssignments(assetAssignRes);
        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const apiSave = async (table: string, item: any) => {
        await fetch(`/api/${table}/save`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item)
        });
        fetchData(); // Refresh all data
    };

    const apiBulkSave = async (table: string, items: any[]) => {
        await fetch(`/api/${table}/bulk-save`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(items)
        });
        fetchData();
    };

    const apiDelete = async (table: string, id: string) => {
        await fetch(`/api/${table}/${id}`, { method: 'DELETE' });
        fetchData();
    };

    const saveStudent = (student: Student) => apiSave('students', student);
    const deleteStudent = (studentId: string) => {
        if (window.confirm('آیا از حذف این دانش آموز و تمام اطلاعات مرتبط با او اطمینان دارید؟')) {
            apiDelete('students', studentId);
        }
    };
    const importStudents = (newStudents: Student[]) => apiBulkSave('students', newStudents);
    
    const saveTeacher = async (teacher: Teacher, assignedClassIds: string[]) => {
        await apiSave('teachers', teacher);
        
        // Update classes manually based on the assignedClassIds
        const { schoolLevel } = settings;
        for (const cls of classes) {
            let updated = false;
            let updatedClass = { ...cls };

            if (schoolLevel === 'elementary') {
                if (assignedClassIds.includes(cls.id) && cls.teacherId !== teacher.id) {
                    updatedClass.teacherId = teacher.id;
                    updated = true;
                } else if (!assignedClassIds.includes(cls.id) && cls.teacherId === teacher.id) {
                    updatedClass.teacherId = '';
                    updated = true;
                }
            }
            if (updated) {
                await apiSave('classes', updatedClass);
            }
        }
        fetchData();
    };
    const deleteTeacher = (teacherId: string) => {
        if(window.confirm('آیا از حذف این معلم اطمینان دارید؟')) {
            apiDelete('teachers', teacherId);
        }
    };
    const importTeachers = (newTeachers: Teacher[]) => apiBulkSave('teachers', newTeachers);

    const saveClass = (schoolClass: SchoolClass) => apiSave('classes', schoolClass);
    const deleteClass = (classId: string) => {
        if (students.some(s => s.classId === classId)) {
            alert('ابتدا باید تمام دانش آموزان این کلاس را حذف یا به کلاس دیگری منتقل کنید.');
            return;
        }
        if(window.confirm('آیا از حذف این کلاس اطمینان دارید؟')) {
            apiDelete('classes', classId);
        }
    };
    const importClasses = (newClasses: SchoolClass[]) => apiBulkSave('classes', newClasses);
    
    const saveGrade = (grade: Grade) => apiSave('grades', grade);
    const deleteGrade = (gradeId: string) => apiDelete('grades', gradeId);
    const saveGroupGrades = (newGrades: Grade[]) => apiBulkSave('grades', newGrades);
    
    const saveDisciplinaryIncident = (incident: DisciplinaryIncident) => apiSave('discipline', incident);
    const deleteDisciplinaryIncident = (incidentId: string) => apiDelete('discipline', incidentId);
    const saveGroupDisciplinaryIncidents = (incidents: DisciplinaryIncident[]) => apiBulkSave('discipline', incidents);
    
    const saveAttendance = (record: Attendance) => apiSave('attendance', record);
    const deleteAttendance = (recordId: string) => apiDelete('attendance', recordId);
    const saveGroupAttendance = (records: Attendance[]) => apiBulkSave('attendance', records);
    
    const saveExam = (exam: Exam) => apiSave('exams', exam);
    const deleteExam = (examId: string) => {
        if(window.confirm('آیا از حذف این آزمون اطمینان دارید؟')) {
            apiDelete('exams', examId);
        }
    };
    
    const savePtaMeeting = (meeting: PTAMeeting) => apiSave('pta_meetings', meeting);
    const deletePtaMeeting = (meetingId: string) => {
        if(window.confirm('آیا از حذف این جلسه اطمینان دارید؟ حضور و غیاب مربوطه نیز حذف خواهد شد.')) {
            apiDelete('pta_meetings', meetingId);
        }
    };
    const saveGroupPtaAttendance = (records: PTAAttendance[]) => apiBulkSave('pta_attendance', records);
    
    const saveFinancialBill = (bill: FinancialBill) => apiSave('bills', bill);
    const deleteFinancialBill = (billId: string) => {
        if(window.confirm('آیا از حذف این صورت‌حساب اطمینان دارید؟ تمام پرداخت های مربوطه نیز حذف خواهند شد.')) {
            apiDelete('bills', billId);
        }
    };
    const saveGroupFinancialBills = (bills: FinancialBill[]) => apiBulkSave('bills', bills);
    
    const savePayment = (payment: Payment) => apiSave('payments', payment);
    const deletePayment = (paymentId: string) => {
        if (window.confirm('آیا از حذف این پرداخت اطمینان دارید؟')) {
            apiDelete('payments', paymentId);
        }
    };
    const saveGroupPayments = (newPayments: Payment[]) => apiBulkSave('payments', newPayments);

    useEffect(() => {
        // Automatic billing status update logic can be moved to server or kept here
        // If kept here, it should only update the local state for UI responsiveness
    }, [payments]);
    
    const saveEvent = (event: UpcomingEvent) => apiSave('events', event);
    const deleteEvent = (eventId: string) => {
        if(window.confirm('آیا از حذف این رویداد اطمینان دارید؟')) {
            apiDelete('events', eventId);
        }
    };

    const saveResponsibility = (responsibility: Responsibility) => apiSave('responsibilities', responsibility);
    const deleteResponsibility = (responsibilityId: string) => {
        if(window.confirm('آیا از حذف این مسئولیت اطمینان دارید؟ واگذاری های مربوطه نیز حذف خواهند شد.')) {
            apiDelete('responsibilities', responsibilityId);
        }
    };
    const saveResponsibilityAssignment = (assignment: ResponsibilityAssignment) => apiSave('responsibility_assignments', assignment);
    const deleteResponsibilityAssignment = (assignmentId: string) => {
        if(window.confirm('آیا از حذف این واگذاری اطمینان دارید؟')) {
            apiDelete('responsibility_assignments', assignmentId);
        }
    };

    const saveAnecdotalRecord = (record: AnecdotalRecord) => apiSave('anecdotal_records', record);
    const deleteAnecdotalRecord = (recordId: string) => {
        if(window.confirm('آیا از حذف این واقعه اطمینان دارید؟')) {
            apiDelete('anecdotal_records', recordId);
        }
    };

    const saveParentMeeting = (meeting: ParentMeeting) => apiSave('parent_meetings', meeting);
    const deleteParentMeeting = (meetingId: string) => {
        if(window.confirm('آیا از حذف این گزارش جلسه اطمینان دارید؟')) {
            apiDelete('parent_meetings', meetingId);
        }
    };

    const saveBadge = (badge: Badge) => apiSave('badges', badge);
    const deleteBadge = (badgeId: string) => {
        if (window.confirm('آیا از حذف این مدال اطمینان دارید؟ تمام موارد اعطا شده از این مدال نیز حذف خواهند شد.')) {
            apiDelete('badges', badgeId);
        }
    };

    const saveAwardedBadge = (awardedBadge: AwardedBadge) => apiSave('awarded_badges', awardedBadge);
    const deleteAwardedBadge = (awardedBadgeId: string) => {
        if (window.confirm('آیا از حذف این مورد اطمینان دارید؟')) {
            apiDelete('awarded_badges', awardedBadgeId);
        }
    };
    
    const saveNotification = (notification: Notification) => apiSave('notifications', notification);
    const deleteNotification = (notificationId: string) => {
        if (window.confirm('آیا از حذف این اطلاعیه اطمینان دارید؟')) {
            apiDelete('notifications', notificationId);
        }
    };

    const saveScheduledNotification = (notification: ScheduledNotification) => apiSave('scheduled_notifications', notification);
    const deleteScheduledNotification = (notificationId: string) => {
        if (window.confirm('آیا از حذف این اعلان زمانبندی شده اطمینان دارید؟')) {
            apiDelete('scheduled_notifications', notificationId);
        }
    };

    const saveSchoolAsset = (asset: SchoolAsset) => apiSave('assets', asset);
    const deleteSchoolAsset = (assetId: string) => {
        if (window.confirm('آیا از حذف این آیتم اموال اطمینان دارید؟ تمام سوابق واگذاری آن نیز حذف خواهد شد.')) {
            apiDelete('assets', assetId);
        }
    };
    
    const assignAsset = (data: { barcode: string; studentId: string }) => {
        const asset = schoolAssets.find(a => a.barcode === data.barcode);
        if (!asset) { alert('اموالی با این بارکد یافت نشد.'); return; }
        if (asset.status !== 'available') { alert('این آیتم در حال حاضر در دسترس نیست.'); return; }

        const newAssignment: AssetAssignment = {
            id: `assign-asset-${Date.now()}`,
            assetId: asset.id,
            studentId: data.studentId,
            assignedDate: new Date().toLocaleDateString('fa-IR-u-nu-latn').replace(/\//g, '-'),
        };

        apiSave('asset_assignments', newAssignment);
        apiSave('assets', { ...asset, status: 'assigned' });
    };

    const returnAsset = (assignmentId: string) => {
        const assignment = assetAssignments.find(a => a.id === assignmentId);
        if (!assignment || assignment.returnedDate) return;
        const asset = schoolAssets.find(a => a.id === assignment.assetId);
        
        apiSave('asset_assignments', { ...assignment, returnedDate: new Date().toLocaleDateString('fa-IR-u-nu-latn').replace(/\//g, '-') });
        if (asset) apiSave('assets', { ...asset, status: 'available' });
    };

    const importSchoolAssets = (newAssets: SchoolAsset[]) => apiBulkSave('assets', newAssets);

    const assignGroupAssets = (assignmentsList: { barcode: string; studentId: string; notes?: string }[]) => {
        const errors: string[] = [];
        let successCount = 0;

        const newAssignments: AssetAssignment[] = [];
        const updatedAssets: SchoolAsset[] = [];

        assignmentsList.forEach(item => {
            const asset = schoolAssets.find(a => a.barcode === item.barcode);
            if (!asset) {
                errors.push(`اموالی با بارکد ${item.barcode} یافت نشد.`);
                return;
            }
            if (asset.status !== 'available') {
                errors.push(`آیتم با بارکد ${item.barcode} در دسترس نیست.`);
                return;
            }

            const newAssignment: AssetAssignment = {
                id: `assign-asset-${Date.now()}-${item.barcode}`,
                assetId: asset.id,
                studentId: item.studentId,
                assignedDate: new Date().toLocaleDateString('fa-IR-u-nu-latn').replace(/\//g, '-'),
                notes: item.notes
            };

            newAssignments.push(newAssignment);
            updatedAssets.push({ ...asset, status: 'assigned' });
            successCount++;
        });

        if (newAssignments.length > 0) {
            apiBulkSave('asset_assignments', newAssignments);
        }
        if (updatedAssets.length > 0) {
            apiBulkSave('assets', updatedAssets);
        }

        return { successCount, errors };
    };

    const value = useMemo(() => ({
        students, teachers, admins, classes, grades, disciplineIncidents, attendance, exams, ptaMeetings, ptaAttendance, financialBills, payments, events, responsibilities, responsibilityAssignments, anecdotalRecords, parentMeetings, badges, awardedBadges, notifications, scheduledNotifications, schoolAssets, assetAssignments,
        saveStudent, deleteStudent, importStudents,
        saveTeacher, deleteTeacher, importTeachers,
        saveClass, deleteClass, importClasses,
        saveGrade, deleteGrade, saveGroupGrades,
        saveDisciplinaryIncident, deleteDisciplinaryIncident, saveGroupDisciplinaryIncidents,
        saveAttendance, deleteAttendance, saveGroupAttendance,
        saveExam, deleteExam,
        savePtaMeeting, deletePtaMeeting, saveGroupPtaAttendance,
        saveFinancialBill, deleteFinancialBill, saveGroupFinancialBills,
        savePayment, deletePayment, saveGroupPayments,
        saveEvent, deleteEvent,
        saveResponsibility, deleteResponsibility, saveResponsibilityAssignment, deleteResponsibilityAssignment,
        saveAnecdotalRecord, deleteAnecdotalRecord,
        saveParentMeeting, deleteParentMeeting,
        saveBadge, deleteBadge, saveAwardedBadge, deleteAwardedBadge,
        saveNotification, deleteNotification,
        saveScheduledNotification, deleteScheduledNotification,
        saveSchoolAsset, deleteSchoolAsset, assignAsset, returnAsset, importSchoolAssets, assignGroupAssets,
    }), [students, teachers, admins, classes, grades, disciplineIncidents, attendance, exams, ptaMeetings, ptaAttendance, financialBills, payments, events, responsibilities, responsibilityAssignments, anecdotalRecords, parentMeetings, badges, awardedBadges, notifications, scheduledNotifications, schoolAssets, assetAssignments]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600 font-medium font-sans">در حال بارگذاری داده‌های مدرسه...</p>
                </div>
            </div>
        );
    }

    return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};
// #endregion

const App: React.FC = () => {
    const { user, role } = useAuth();
  
    if (!user || !role) {
      return <LoginScreen />;
    }
  
    switch (role) {
      case 'admin':
        return <AdminDashboard admin={user as Admin} />;
      case 'teacher':
        return <TeacherDashboard teacher={user as Teacher} />;
      case 'student':
        return <StudentDashboard student={user as Student} />;
      default:
        return <Navigate to="/" />;
    }
  };

const Root: React.FC = () => (
    <DataProvider>
        <SettingsProvider>
            <HashRouter>
                <AuthProvider>
                    <App />
                </AuthProvider>
            </HashRouter>
        </SettingsProvider>
    </DataProvider>
);

export default Root;
