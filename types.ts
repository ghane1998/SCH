export type UserRole = 'admin' | 'teacher' | 'student';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
}

// New detailed Student type based on Excel data
export interface ParentInfo {
    fullName: string;
    nationalId?: string;
    nationality?: string;
    occupation?: string;
    educationLevel?: string;
    fieldOfStudy?: string;
}

export interface ContactInfo {
    fatherPhone: string;
    motherPhone: string;
    virtualPhone?: string;
    homePhone?: string;
    emergency: {
        phone: string;
        owner: string;
    };
    address: string;
    postalCode?: string;
}

export interface Student extends User {
  classId: string;
  className: string;
  nationalId: string;
  
  // Personal Info
  dateOfBirth: string;
  birthCert: {
      serial?: string;
      series?: string;
      row?: string;
  };
  placeOfBirth?: string;
  placeOfIssue?: string;
  nationality: string;
  religion?: string;
  dominantHand?: 'راست دست' | 'چپ دست' | 'هر دو';
  
  // Health Info
  health: {
      basicInsurance?: string;
      suppInsurance?: string;
      illnessDescription?: string;
  };

  // Family Info
  family: {
      status?: string; // e.g., 'با خانواده زندگی می‌کند'
      totalChildren?: number;
      birthOrder?: number;
      father?: Partial<ParentInfo>;
      mother?: Partial<ParentInfo>;
  };
  
  // Contact Info
  contact: ContactInfo;

  // Naseeb Chart Data
  naseebData: Record<string, {
    description: string;
    scores: Array<{
        score: number;
        date: string;
        recordedBy: string; // teacherId or adminId
        teacherDescription?: string;
        eventTitle?: string;
    }>;
  }>;
  profilePictureUrl?: string;
}


export interface Teacher extends User {
  classIds: string[];
}

export interface Admin extends User {}

export type DescriptiveGrade = 'خیلی خوب' | 'خوب' | 'قابل قبول' | 'نیاز به تلاش بیشتر';
export const DESCRIPTIVE_GRADES: DescriptiveGrade[] = ['خیلی خوب', 'خوب', 'قابل قبول', 'نیاز به تلاش بیشتر'];


export interface Grade {
  id:string;
  studentId: string;
  teacherId: string;
  subject: string;
  score: number | DescriptiveGrade;
  date: string;
}

export type AttendanceStatus = 'حاضر' | 'غیرموجه' | 'موجه' | 'تاخیر' | 'خروج' | string;

export interface Attendance {
  id: string;
  studentId: string;
  date: string;
  status: AttendanceStatus;
  minutesLate?: number;
  departureTime?: string;
  isNotified: boolean;
  hasDoctorsNote: boolean;
  recordedBy: string; // teacherId or adminId
}

export interface DisciplinaryIncident {
  id: string;
  studentId: string;
  date: string;
  category: string; // Changed from union type to string
  description: string;
  actionTaken: string;
  reportedBy: string; // Teacher ID
}

export interface SchoolClass {
  id: string;
  name: string;
  teacherId: string;
  subjects: string[];
}

export interface Exam {
  id: string;
  subject: string;
  examDate: string; // "YYYY-MM-DDTHH:mm" format
  syllabus: string;
  targetClassIds: string[];
  announcementDate: string; // "YYYY-MM-DD" format
  description: string;
  createdBy: string; // Admin ID
}


export type ModuleId = 'grades' | 'attendance' | 'discipline' | 'exams' | 'naseeb' | 'pta' | 'finance' | 'events' | 'responsibilities' | 'anecdotal' | 'parentMeetings' | 'notifications' | 'assets';

export interface ModuleSettings {
    label: string;
    studentVisible: boolean;
    teacherVisible: boolean;
}

export interface AttendanceStatusSetting {
    name: string;
    countsAsAbsence: boolean;
}

export interface IconSetting {
    key: string;
    icon: string;
}

export interface DescriptiveGradeSetting {
  grade: DescriptiveGrade;
  color: string;
}

export interface SubjectWeightSetting {
  subject: string;
  weight: number;
}

export interface DescriptiveGradeValueSetting {
  grade: DescriptiveGrade;
  value: number;
}

export interface SchoolSettings {
    // School Type
    schoolLevel: 'elementary' | 'high_school';

    // School Info
    schoolName: string;
    schoolAddress: string;
    schoolPhone: string;
    academicYear: string;
    schoolLogoUrl: string;

    // UI Customization
    themeColor: 'indigo' | 'blue' | 'green' | 'red' | 'purple' | 'teal' | 'orange' | 'custom';
    customThemeColor: string;
    font: 'Vazirmatn' | 'Lalezar' | 'Sahel' | 'BNazanin';
    textColorPrimary: string;
    textColorSecondary: string;
    bgColorPrimary: string;
    cardBgColor: string;
    inputBgColor: string;
    inputBorderColor: string;
    
    // Module Management
    moduleSettings: Record<ModuleId, ModuleSettings>;

    // Functional Parameters
    gradingSystem: 'numeric' | 'descriptive';
    passingGrade: number;
    descriptiveGradeColors: DescriptiveGradeSetting[];
    descriptiveGradeValues: DescriptiveGradeValueSetting[];
    subjectWeights: SubjectWeightSetting[];
    lateThresholdMinutes: number;
    attendanceStatuses: AttendanceStatusSetting[];

    // Category Management
    disciplineCategories: string[];
    excusedAbsenceReasons: string[];
    naseebChartComponents: string[];
    iconSettings: IconSetting[];
    
    // Student Panel Visibility (Legacy, will be replaced by module settings)
    studentVisibleAttendanceFields: {
        minutesLate: boolean;
        departureTime: boolean;
        isNotified: boolean;
        hasDoctorsNote: boolean;
        recordedBy: boolean;
    };
    studentGradesViewSettings: {
        gradesModuleEnabled: boolean;
        defaultView: 'list' | 'chart';
        chartSettings: {
            pointRadius: number;
            lineColor: string;
            pointColor: string;
            showLine: boolean;
            showArea: boolean;
            areaColor: string;
        };
    };
    studentStatCardsSettings: {
        style: 'classic' | 'modern';
        themes: {
            average: { from: string; to: string };
            absence: { from: string; to: string };
            tardy: { from: string; to: string };
            discipline: { from: string; to: string };
        }
    };
    studentDisciplineViewSettings: {
        disciplineModuleEnabled: boolean;
        defaultView: 'list' | 'chart';
        chartSettings: {
            showLegend: boolean;
            showPercentages: boolean;
            colorPalette: Record<string, string>; // Maps category name to color
        }
    };
}
export interface PTAMeeting {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  scope: 'class' | 'school';
  scopeId: string; // classId for 'class' scope, or a general ID like 'main-school' for 'school'
  description?: string;
  createdBy: string; // adminId or teacherId
}

export interface PTAAttendance {
  id: string;
  meetingId: string;
  studentId: string;
  attended: boolean;
  notes?: string;
}

// #region Financial Types
export type TuitionStatus = 'paid' | 'partially_paid' | 'unpaid' | 'overpaid';
export type PaymentMethod = 'cash' | 'cheque';
export type ChequeStatus = 'pending' | 'cleared' | 'bounced';

export interface FinancialBill {
    id: string;
    studentId: string;
    title: string; // e.g., "شهریه سال تحصیلی", "کلاس رباتیک"
    description?: string;
    academicYear: string;
    totalAmount: number;
    amountPaid: number;
    status: TuitionStatus;
    issueDate: string; // YYYY-MM-DD
    dueDate?: string; // YYYY-MM-DD
}

export interface ChequeInfo {
    holderName: string;         // نام صاحب چک
    chequeSeries: string;       // سری چک
    chequeSerial: string;       // سریال چک
    checkDate: string;          // تاریخ چک (YYYY-MM-DD)
    sayadiNumber?: string;      // شماره چک صیادی
    holderNationalId?: string;  // کد ملی صاحب چک
    iban?: string;              // شماره شبا
    branchCode?: string;        // کد شعبه
    status: ChequeStatus;
}

export interface Payment {
    id: string;
    financialBillId: string;
    studentId: string;
    date: string; // YYYY-MM-DD
    amount: number;
    paymentMethod: PaymentMethod;
    description?: string;
    chequeInfo?: ChequeInfo;
    recordedBy: string; // adminId
}
// #endregion

// #region Events
export type EventAudienceType = 'all_students' | 'all_teachers' | 'class' | 'student' | 'teacher';
export interface EventAudience {
    type: EventAudienceType;
    ids: string[]; // classIds or studentIds
}

export interface UpcomingEvent {
    id: string;
    title: string;
    description?: string;
    dateTime: string; // "YYYY-MM-DDTHH:mm"
    location: string;
    cost?: number;
    link?: string;
    linkText?: string;
    prize?: string;
    host?: string;
    audience: EventAudience;
    createdBy: string; // adminId
    imageUrl?: string;
}
// #endregion

// #region Responsibilities
export interface Responsibility {
    id: string;
    name: string;
    type: 'school_government' | 'class_assistantship';
    createdBy: string; // adminId or teacherId
    color?: string;
}

export interface ResponsibilityAssignment {
    id: string;
    responsibilityId: string;
    studentId: string;
    startDate: string; // YYYY-MM-DD
    endDate: string; // YYYY-MM-DD
    assignedBy: string; // adminId or teacherId
}
// #endregion

// #region Anecdotal Records
export interface AnecdotalRecord {
    id: string;
    studentIds: string[];
    date: string; // YYYY-MM-DD
    subject: string;
    location: string;
    description: string;
    recordedBy: string; // adminId or teacherId
}
// #endregion

// #region Parent Meetings
export interface ParentMeeting {
    id: string;
    studentId: string;
    date: string; // YYYY-MM-DD
    attendees: string; // e.g., "پدر و مادر", "پدر"
    reason: string;
    summary: string;
    actionItems: string;
    recordedBy: string; // adminId or teacherId
}
// #endregion

// #region Naseeb Badges
export interface Badge {
  id: string;
  name: string;
  imageUrl?: string;
  criteria?: string;
  description?: string;
  createdBy: string; // adminId or teacherId
  scope: 'school' | 'teacher';
}

export interface AwardedBadge {
  id: string;
  badgeId: string;
  studentId: string;
  dateAwarded: string; // YYYY-MM-DD
  awardedBy: string; // adminId or teacherId
  reason?: string;
}
// #endregion

// #region Notifications
export type NotificationAudienceType = 'all_students' | 'all_teachers' | 'class' | 'student' | 'teacher';
export interface NotificationAudience {
    type: NotificationAudienceType;
    ids: string[]; // classIds, studentIds, or teacherIds
}

export interface NotificationTag {
    text: string;
    color: string;
}

export interface Notification {
    id: string;
    title: string;
    message: string;
    audience: NotificationAudience;
    createdAt: string; // "YYYY-MM-DDTHH:mm"
    createdBy: string; // adminId
    color?: string;
    tags?: NotificationTag[];
    link?: string;
    linkText?: string;
    imageUrl?: string;
    isActive: boolean;
    deactivateAt?: string; // "YYYY-MM-DDTHH:mm"
}

export type ScheduledNotificationType = 'birthday' | 'annual_event' | 'specific_date';

export interface ScheduledNotification {
    id: string;
    titleTemplate: string;
    messageTemplate: string;
    type: ScheduledNotificationType;
    audience: NotificationAudience;
    color?: string;
    imageUrl?: string;
    scheduledDate?: string; // MM-DD for annual_event, YYYY-MM-DD for specific_date
    isActive: boolean;
    tags?: NotificationTag[];
    link?: string;
    linkText?: string;
    createdBy: string; // adminId
}
// #endregion

// #region School Assets
export type AssetStatus = 'available' | 'assigned' | 'damaged' | 'lost';

export interface SchoolAsset {
    id: string;
    barcode: string;
    type: string; // e.g., 'صندلی', 'کتاب', 'تبلت'
    description?: string;
    status: AssetStatus;
}

export interface AssetAssignment {
    id: string;
    assetId: string;
    studentId: string;
    assignedDate: string; // YYYY-MM-DD
    returnedDate?: string; // YYYY-MM-DD
    notes?: string;
}
// #endregion