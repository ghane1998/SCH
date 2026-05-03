import type { Admin, SchoolSettings, SchoolClass, Teacher, Student, Grade, DisciplinaryIncident, Attendance, AttendanceStatus, Exam, PTAMeeting, PTAAttendance, FinancialBill, Payment, UpcomingEvent, Responsibility, ResponsibilityAssignment, AnecdotalRecord, ParentMeeting, Badge, AwardedBadge, Notification, SchoolAsset, AssetAssignment, ScheduledNotification } from './types';
import { DESCRIPTIVE_GRADES } from './types';

// #region Data Generation Logic
const firstNames = ['علی', 'رضا', 'محمد', 'حسین', 'مهدی', 'امیر', 'حسن', 'سعید', 'پرهام', 'آرش', 'کیان', 'ماهان', 'آرمان', 'بردیا', 'پویا', 'فاطمه', 'زهرا', 'مریم', 'سارا', 'نرگس', 'هستی', 'آرزو', 'نگار', 'نیلوفر', 'یلدا', 'رها', 'آوا', 'باران', 'ترانه', 'یکتا'];
const lastNames = ['محمدی', 'رضایی', 'احمدی', 'حسینی', 'کریمی', 'صادقی', 'هاشمی', 'مرادی', 'جعفری', 'نوری', 'قاسمی', 'صالحی', 'ابراهیمی', 'اسدی', 'شریفی', 'موسوی', 'عبداللهی', 'طهماسبی', 'حیدری', 'اکبری'];
const cities = ['تهران', 'اصفهان', 'شیراز', 'یزد', 'تبریز', 'مشهد'];
const occupations = ['کارمند', 'کارگر', 'فروشنده', 'مهندس', 'پزشک', 'معلم', 'راننده', 'آزاد'];
const eduLevels = ['سیکل', 'دیپلم', 'لیسانس', 'فوق لیسانس', 'دکتری'];
const insurance = ['تامین اجتماعی', 'خدمات درمانی', 'نیروهای مسلح', 'سلامت'];
const disciplineCategories = ['نقص درسی', 'بی‌نظمی', 'پرخاش', 'موارد خاص', 'سایر'];
const attendanceStatuses: AttendanceStatus[] = ['حاضر', 'غیرموجه', 'موجه', 'تاخیر'];
const commonSubjects = ['ریاضی', 'ادبیات', 'زبان انگلیسی', 'دین و زندگی', 'فیزیک', 'شیمی', 'ورزش'];
const naseebComponents = ['رشد تحصیلی', 'انضباط', 'مشارکت کلاسی', 'خلاقیت', 'ورزش'];


const getRandomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const generateFullName = () => ({ firstName: getRandomItem(firstNames), lastName: getRandomItem(lastNames) });
const getRandomDate = (startMonth: number, endMonth: number): string => {
    const month = Math.floor(Math.random() * (endMonth - startMonth + 1)) + startMonth;
    const day = Math.floor(Math.random() * 28) + 1;
    return `1403-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};
const getRandomPastDate = (startYear: number, endYear: number): string => {
    const year = Math.floor(Math.random() * (endYear - startYear + 1)) + startYear;
    const month = Math.floor(Math.random() * 12) + 1;
    const day = Math.floor(Math.random() * 28) + 1;
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}
const getRandomPhoneNumber = () => `09${Math.floor(1000000000 + Math.random() * 9000000000)}`;

const generatedClasses: SchoolClass[] = [];
const generatedTeachers: Teacher[] = [];
const generatedStudents: Student[] = [];
const generatedGrades: Grade[] = [];
const generatedDisciplinaryIncidents: DisciplinaryIncident[] = [];
const generatedAttendance: Attendance[] = [];
const generatedExams: Exam[] = [];
const generatedPtaMeetings: PTAMeeting[] = [];
const generatedPtaAttendance: PTAAttendance[] = [];
const generatedFinancialBills: FinancialBill[] = [];
const generatedPayments: Payment[] = [];


const NUM_CLASSES = 11;
const STUDENTS_PER_CLASS = 36;
const ACADEMIC_YEAR = '1403-1404';

// 1. Generate Teachers and Classes
for (let i = 1; i <= NUM_CLASSES; i++) {
    const teacherId = `t${i}`;
    const teacherName = generateFullName();
    const classId = `c${i}`;

    const newTeacher: Teacher = { 
        id: teacherId, 
        ...teacherName, 
        classIds: [classId] 
    };
    generatedTeachers.push(newTeacher);

    const newClass: SchoolClass = {
        id: classId,
        name: `کلاس ${100 + i}`,
        teacherId: teacherId,
        subjects: [...commonSubjects, `درس تخصصی ${i}`]
    };
    generatedClasses.push(newClass);
}

// 2. Generate Students and their related data
let studentCounter = 1;
for (const schoolClass of generatedClasses) {
    for (let i = 0; i < STUDENTS_PER_CLASS; i++) {
        const studentId = `s${studentCounter++}`;
        const studentName = generateFullName();
        const fatherName = { firstName: generateFullName().firstName, lastName: studentName.lastName };
        const motherName = generateFullName();
        const fatherPhone = getRandomPhoneNumber();
        const motherPhone = getRandomPhoneNumber();
        
        const newStudent: Student = {
            id: studentId,
            ...studentName,
            classId: schoolClass.id,
            className: schoolClass.name,
            nationalId: String(Math.floor(1000000000 + Math.random() * 9000000000)),
            dateOfBirth: getRandomPastDate(1393, 1394),
            nationality: 'ایرانی',
            birthCert: {
                serial: String(Math.floor(100000 + Math.random() * 900000)),
                series: `${Math.floor(10 + Math.random() * 90)}/الف`
            },
            placeOfBirth: getRandomItem(cities),
            dominantHand: Math.random() > 0.9 ? 'چپ دست' : 'راست دست',
            health: {
                basicInsurance: getRandomItem(insurance),
                illnessDescription: Math.random() > 0.95 ? 'آسم خفیف' : 'ندارد'
            },
            family: {
                status: 'با خانواده زندگی می‌کند',
                father: {
                    fullName: `${fatherName.firstName} ${fatherName.lastName}`,
                    nationalId: String(Math.floor(1000000000 + Math.random() * 9000000000)),
                    occupation: getRandomItem(occupations),
                    educationLevel: getRandomItem(eduLevels),
                },
                mother: {
                    fullName: `${motherName.firstName} ${motherName.lastName}`,
                    nationalId: String(Math.floor(1000000000 + Math.random() * 9000000000)),
                    occupation: getRandomItem([...occupations, 'خانه دار']),
                    educationLevel: getRandomItem(eduLevels),
                }
            },
            contact: {
                fatherPhone,
                motherPhone,
                homePhone: `0353${Math.floor(1000000 + Math.random() * 9000000)}`,
                address: `${getRandomItem(cities)}, خیابان ${getRandomItem(lastNames)}, کوچه ${i+1}`,
                emergency: {
                    phone: fatherPhone,
                    owner: 'پدر'
                }
            },
            naseebData: naseebComponents.reduce((acc, comp) => {
                acc[comp] = {
                    description: 'این یک توضیح نمونه برای عملکرد دانش آموز در این مولفه است.',
                    scores: [
                        { score: Math.floor(Math.random() * 60) + 40, date: '1403-02-15', recordedBy: schoolClass.teacherId, teacherDescription: 'پیشرفت خوبی در این بازه داشت.', eventTitle: 'آزمون ماهانه' },
                        { score: Math.floor(Math.random() * 60) + 40, date: '1403-03-20', recordedBy: schoolClass.teacherId, teacherDescription: 'نیاز به تلاش بیشتر در این زمینه.' }
                    ]
                };
                return acc;
            }, {} as Student['naseebData']),
            profilePictureUrl: Math.random() > 0.5 ? `https://i.pravatar.cc/150?u=${studentId}` : undefined,
        };
        generatedStudents.push(newStudent);
        
        // Generate 2 grades
        for (let j = 0; j < 2; j++) {
            generatedGrades.push({
                id: `g-${studentId}-${j}`,
                studentId: studentId,
                teacherId: schoolClass.teacherId,
                subject: getRandomItem(schoolClass.subjects),
                score: getRandomItem(DESCRIPTIVE_GRADES),
                date: getRandomDate(1, 4)
            });
        }
        
        // Generate 2 discipline incidents
        for (let j = 0; j < 2; j++) {
            generatedDisciplinaryIncidents.push({
                id: `d-${studentId}-${j}`,
                studentId: studentId,
                date: getRandomDate(1, 4),
                category: getRandomItem(disciplineCategories),
                description: 'توضیحات نمونه برای مورد انضباطی.',
                actionTaken: 'تذکر شفاهی داده شد.',
                reportedBy: schoolClass.teacherId
            });
        }

        // Generate 2 attendance records
        for (let j = 0; j < 2; j++) {
            generatedAttendance.push({
                id: `att-${studentId}-${j}`,
                studentId: studentId,
                date: getRandomDate(4, 4), // Recent attendance
                status: getRandomItem(attendanceStatuses),
                isNotified: Math.random() > 0.5,
                hasDoctorsNote: Math.random() > 0.2,
                recordedBy: schoolClass.teacherId
            });
        }

        // Generate Financial Bills & Payments
        const totalTuition = 10_000_000;
        const tuitionBillId = `fb-${studentId}-main`;
        const newTuitionBill: FinancialBill = {
            id: tuitionBillId,
            studentId,
            title: `شهریه سال تحصیلی ${ACADEMIC_YEAR}`,
            academicYear: ACADEMIC_YEAR,
            totalAmount: totalTuition,
            amountPaid: 0,
            status: 'unpaid',
            issueDate: `1403-06-15`,
            dueDate: `1403-10-30`,
        };

        const paymentType = Math.random();
        if (paymentType < 0.2) { // Unpaid
            newTuitionBill.status = 'unpaid';
        } else if (paymentType < 0.6) { // Partially paid
            const paidAmount = totalTuition * (Math.random() * 0.4 + 0.2); // 20-60% paid
            newTuitionBill.amountPaid = paidAmount;
            newTuitionBill.status = 'partially_paid';
            generatedPayments.push({
                id: `p1-${studentId}`, financialBillId: tuitionBillId, studentId, date: getRandomDate(7, 8), amount: paidAmount,
                paymentMethod: 'cash', recordedBy: 'admin1'
            });
        } else { // Fully paid
             newTuitionBill.amountPaid = totalTuition;
             newTuitionBill.status = 'paid';
             generatedPayments.push({
                id: `p1-${studentId}`, financialBillId: tuitionBillId, studentId, date: getRandomDate(7, 8), amount: totalTuition / 2,
                paymentMethod: 'cash', recordedBy: 'admin1'
            });
             generatedPayments.push({
                id: `p2-${studentId}`, financialBillId: tuitionBillId, studentId, date: getRandomDate(9, 10), amount: totalTuition / 2,
                paymentMethod: 'cheque', recordedBy: 'admin1', 
                chequeInfo: { 
                    holderName: `${fatherName.firstName} ${fatherName.lastName}`,
                    chequeSeries: 'الف/12',
                    chequeSerial: '123456',
                    checkDate: getRandomDate(11, 12),
                    status: 'cleared',
                    sayadiNumber: '10002000300040005000',
                }
            });
        }
        generatedFinancialBills.push(newTuitionBill);
        
        // Add a second bill for some students
        if (i % 5 === 0) { // for every 5th student
            const roboticsBillId = `fb-${studentId}-robotics`;
            const roboticsFee = 1_500_000;
            const roboticsBill: FinancialBill = {
                id: roboticsBillId,
                studentId,
                title: 'کلاس فوق برنامه رباتیک',
                academicYear: ACADEMIC_YEAR,
                totalAmount: roboticsFee,
                amountPaid: roboticsFee,
                status: 'paid',
                issueDate: `1403-07-01`,
                dueDate: `1403-07-15`,
            };
            generatedFinancialBills.push(roboticsBill);
            generatedPayments.push({
                id: `p-robotics-${studentId}`, financialBillId: roboticsBillId, studentId, date: getRandomDate(7, 7), amount: roboticsFee,
                paymentMethod: 'cash', recordedBy: 'admin1'
            });
        }

    }
}

// 3. Generate Exams to cover all classes
const today = new Date();
const getJalaliDate = (offsetDays: number): string => {
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + offsetDays);
    return targetDate.toLocaleDateString('fa-IR-u-nu-latn', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-');
};

let examCounter = 1;
for(let i = 0; i < generatedClasses.length; i++) {
    const classGroup = [generatedClasses[i].id];

    generatedExams.push({
        id: `exam${examCounter++}`,
        subject: getRandomItem(commonSubjects),
        examDate: `${getJalaliDate(5 + i)}T09:00`,
        syllabus: `فصل ${i+1}`,
        targetClassIds: classGroup,
        announcementDate: getJalaliDate(-5),
        description: `آزمون میان ترم کلاس ${generatedClasses[i].name}.`,
        createdBy: 'admin1',
    });

    generatedExams.push({
        id: `exam${examCounter++}`,
        subject: getRandomItem(commonSubjects),
        examDate: `${getJalaliDate(15 + i)}T11:00`,
        syllabus: `درس ${i+1} تا ${i+4}`,
        targetClassIds: classGroup,
        announcementDate: getJalaliDate(0),
        description: 'آزمون تستی آمادگی.',
        createdBy: 'admin1',
    });
}

// 4. Generate PTA Meetings
const schoolPtaMeeting: PTAMeeting = {
    id: 'pta-school-1',
    title: 'جلسه انجمن اولیا و مربیان مدرسه',
    date: '1403-08-15',
    scope: 'school',
    scopeId: 'main-school',
    description: 'بررسی عملکرد کلی مدرسه و برنامه‌های آینده.',
    createdBy: 'admin1',
};
generatedPtaMeetings.push(schoolPtaMeeting);

for (const student of generatedStudents) {
    generatedPtaAttendance.push({
        id: `pta-att-${schoolPtaMeeting.id}-${student.id}`,
        meetingId: schoolPtaMeeting.id,
        studentId: student.id,
        attended: Math.random() > 0.4, // 60% attendance
        notes: Math.random() > 0.8 ? 'ارائه پیشنهاد سازنده' : undefined,
    });
}

generatedClasses.slice(0, 5).forEach(c => {
    const classPtaMeeting: PTAMeeting = {
        id: `pta-class-${c.id}`,
        title: `جلسه اولیا کلاس ${c.name}`,
        date: '1403-07-20',
        scope: 'class',
        scopeId: c.id,
        description: 'بررسی وضعیت تحصیلی دانش‌آموزان کلاس.',
        createdBy: c.teacherId,
    };
    generatedPtaMeetings.push(classPtaMeeting);

    generatedStudents.filter(s => s.classId === c.id).forEach(student => {
         generatedPtaAttendance.push({
            id: `pta-att-${classPtaMeeting.id}-${student.id}`,
            meetingId: classPtaMeeting.id,
            studentId: student.id,
            attended: Math.random() > 0.2, // 80% attendance
        });
    });
});
// #endregion

export const MOCK_ADMINS: Admin[] = [
  { id: 'admin1', firstName: 'رضا', lastName: 'مدیری' },
];

export const MOCK_TEACHERS: Teacher[] = generatedTeachers;
export const MOCK_CLASSES: SchoolClass[] = generatedClasses;
export const MOCK_STUDENTS: Student[] = generatedStudents;
export const MOCK_GRADES: Grade[] = generatedGrades;
export const MOCK_DISCIPLINARY_INCIDENTS: DisciplinaryIncident[] = generatedDisciplinaryIncidents;
export const MOCK_ATTENDANCE: Attendance[] = generatedAttendance;
export const MOCK_EXAMS: Exam[] = generatedExams;
export const MOCK_PTA_MEETINGS: PTAMeeting[] = generatedPtaMeetings;
export const MOCK_PTA_ATTENDANCE: PTAAttendance[] = generatedPtaAttendance;
export const MOCK_FINANCIAL_BILLS: FinancialBill[] = generatedFinancialBills;
export const MOCK_PAYMENTS: Payment[] = generatedPayments;
export const MOCK_NOTIFICATIONS: Notification[] = [];
export const MOCK_SCHEDULED_NOTIFICATIONS: ScheduledNotification[] = [
    {
        id: 'sn-birthday',
        titleTemplate: 'تولدت مبارک {firstName} جان! 🎉',
        messageTemplate: 'امروز یک روز خاص است! تولد شما را تبریک می‌گوییم و برایتان سالی پر از موفقیت و شادی آرزو داریم.\n{fullName} عزیز، همیشه شاد باشی.',
        type: 'birthday',
        audience: { type: 'all_students', ids: [] },
        scheduledDate: '',
        color: '#f472b6', // pink-400
        imageUrl: 'https://placehold.co/600x400/f472b6/white?text=تولدت+مبارک',
        isActive: true,
        createdBy: 'admin1'
    },
    {
        id: 'sn-annual-1',
        titleTemplate: 'آغاز سال تحصیلی جدید مبارک',
        messageTemplate: 'فصل تلاش و دانش‌افزایی دوباره فرا رسید. امیدواریم امسال برای همه ما سالی سرشار از یادگیری و دوستی‌های جدید باشد.',
        type: 'annual_event',
        audience: { type: 'all_students', ids: [] },
        scheduledDate: '07-01', // 1 Mehr
        color: '#6366f1', // indigo-500
        isActive: true,
        createdBy: 'admin1'
    }
];
export const MOCK_EVENTS: UpcomingEvent[] = [
    {
        id: 'event1',
        title: 'کارگاه برنامه‌نویسی پایتون',
        description: 'در این کارگاه با مبانی برنامه‌نویسی پایتون و کاربردهای آن در دنیای واقعی آشنا خواهید شد. این دوره برای مبتدیان مناسب است.',
        dateTime: '1403-09-15T14:00',
        location: 'آزمایشگاه کامپیوتر',
        cost: 50000,
        link: 'https://example.com/python-workshop',
        linkText: 'ثبت نام',
        prize: 'گواهی شرکت در دوره',
        host: 'مهندس اکبری',
        audience: { type: 'class', ids: ['c1', 'c2'] }, // For first two classes
        createdBy: 'admin1',
        imageUrl: 'https://placehold.co/600x400/6366f1/white?text=Python'
    },
    {
        id: 'event2',
        title: 'مسابقه کتابخوانی',
        description: 'مسابقه بزرگ کتابخوانی با محوریت کتاب "شازده کوچولو". برای شرکت در مسابقه و دریافت کتاب به کتابخانه مراجعه کنید.',
        dateTime: '1403-10-05T10:00',
        location: 'کتابخانه مدرسه',
        prize: 'کارت هدیه ۲۰۰ هزار تومانی',
        audience: { type: 'all_students', ids: [] },
        createdBy: 'admin1',
        imageUrl: 'https://placehold.co/600x400/10b981/white?text=کتابخوانی'
    },
    {
        id: 'event3',
        title: 'جلسه هماهنگی معلمان',
        description: 'جلسه ماهانه برای بررسی پیشرفت تحصیلی دانش‌آموزان و هماهنگی برنامه‌های آموزشی آتی.',
        dateTime: '1403-08-25T16:30',
        location: 'دفتر مدیریت',
        host: 'آقای مدیری',
        audience: { type: 'all_teachers', ids: [] },
        createdBy: 'admin1',
        imageUrl: 'https://placehold.co/600x400/8b5cf6/white?text=جلسه'
    },
    {
        id: 'event4',
        title: 'جلسه مشاوره فردی',
        description: 'جلسه مشاوره تحصیلی و برنامه‌ریزی درسی ویژه شما.',
        dateTime: '1403-09-20T11:00',
        location: 'دفتر مشاوره',
        host: 'آقای مشاور',
        audience: { type: 'student', ids: ['s1'] }, // For student s1
        createdBy: 'admin1',
        imageUrl: 'https://placehold.co/600x400/f97316/white?text=مشاوره'
    },
    {
        id: 'event5',
        title: 'کارگاه آموزشی روش‌های نوین تدریس',
        description: 'این کارگاه تخصصی برای شما برنامه‌ریزی شده است.',
        dateTime: '1403-09-22T09:00',
        location: 'سالن همایش',
        host: 'دکتر رضایی',
        audience: { type: 'teacher', ids: ['t1'] }, // For teacher t1
        createdBy: 'admin1',
        imageUrl: 'https://placehold.co/600x400/22c55e/white?text=تدریس'
    }
];

export const MOCK_RESPONSIBILITIES: Responsibility[] = [
    { id: 'resp1', name: 'شهردار مدرسه', createdBy: 'admin1', type: 'school_government', color: '#3b82f6' },
    { id: 'resp2', name: 'نماینده شورای دانش‌آموزی', createdBy: 'admin1', type: 'school_government', color: '#16a34a' },
    { id: 'resp3', name: 'مسئول کتابخانه', createdBy: 'admin1', type: 'school_government', color: '#f97316' },
    { id: 'resp-c1', name: 'مسئول نظم', createdBy: 'admin1', type: 'class_assistantship', color: '#ef4444' },
    { id: 'resp-c2', name: 'مسئول بهداشت', createdBy: 'admin1', type: 'class_assistantship', color: '#8b5cf6' },
];

export const MOCK_RESPONSIBILITY_ASSIGNMENTS: ResponsibilityAssignment[] = [
    { id: 'assign1', responsibilityId: 'resp1', studentId: 's1', startDate: '1403-07-01', endDate: '1403-07-30', assignedBy: 'admin1' },
    { id: 'assign2', responsibilityId: 'resp2', studentId: 's50', startDate: '1403-07-01', endDate: '1404-03-31', assignedBy: 'admin1' },
    { id: 'assign3', responsibilityId: 'resp-c1', studentId: 's1', startDate: '1403-07-01', endDate: '1403-08-01', assignedBy: 't1'},
    { id: 'assign4', responsibilityId: 'resp-c2', studentId: 's2', startDate: '1403-07-01', endDate: '1403-08-01', assignedBy: 't1'},
];

export const MOCK_ANECDOTAL_RECORDS: AnecdotalRecord[] = [
    {
        id: 'anec1',
        studentIds: ['s1', 's2'],
        date: '1403-08-10',
        subject: 'ریاضی',
        location: 'کلاس درس',
        description: 'دانش آموزان در حل تمرینات گروهی مشارکت خوبی داشتند و به یکدیگر کمک میکردند.',
        recordedBy: 't1', // Teacher 1
    },
    {
        id: 'anec2',
        studentIds: ['s5'],
        date: '1403-08-12',
        subject: 'ورزش',
        location: 'حیاط مدرسه',
        description: 'در فعالیت ورزشی از خود روحیه تیمی بالایی نشان داد و به قوانین بازی پایبند بود.',
        recordedBy: 'admin1',
    }
];

export const MOCK_PARENT_MEETINGS: ParentMeeting[] = [
    {
        id: 'pm1',
        studentId: 's1',
        date: '1403-08-20',
        attendees: 'پدر دانش آموز',
        reason: 'افت تحصیلی',
        summary: 'در مورد افت نمرات اخیر دانش آموز در درس ریاضی صحبت شد. پدر ایشان از مشکلات تمرکز دانش آموز در خانه گفتند.',
        actionItems: 'مقرر شد دانش آموز به مشاور مدرسه ارجاع داده شود. همچنین معلم تمرینات اضافی برای او در نظر بگیرد.',
        recordedBy: 't1',
    },
    {
        id: 'pm2',
        studentId: 's10',
        date: '1403-09-05',
        attendees: 'مادر دانش آموز',
        reason: 'مورد انضباطی',
        summary: 'در خصوص درگیری دانش آموز با همکلاسی بحث و گفتگو شد. مادر ایشان قول همکاری و پیگیری در منزل را دادند.',
        actionItems: 'صحبت با هر دو دانش آموز درگیر و توضیح اهمیت روابط دوستانه.',
        recordedBy: 'admin1',
    }
];

export const MOCK_BADGES: Badge[] = [
    { id: 'b1', name: 'نشان کوشش', imageUrl: 'https://placehold.co/100x100/10b981/ffffff?text=🏆', criteria: 'کسب معدل بالای ۱۹ در سه ماه متوالی.', description: 'برای تلاش و پشتکار مثال‌زدنی', createdBy: 'admin1', scope: 'school' },
    { id: 'b2', name: 'مدال خلاقیت', imageUrl: 'https://placehold.co/100x100/8b5cf6/ffffff?text=💡', criteria: 'ارائه یک پروژه خلاقانه که مورد تایید شورای مدرسه قرار گیرد.', description: 'برای ارائه ایده‌های نو و خلاقانه', createdBy: 'admin1', scope: 'school' },
    { id: 'b3', name: 'همیار کلاس', imageUrl: 'https://placehold.co/100x100/3b82f6/ffffff?text=🤝', criteria: 'کمک داوطلبانه به ۱۰ نفر از همکلاسی‌ها در امور درسی.', description: 'برای کمک به دوستان و معلم در امور کلاس', createdBy: 'admin1', scope: 'school' },
    { id: 'b4', name: 'کتاب‌خوان برتر', imageUrl: 'https://placehold.co/100x100/f97316/ffffff?text=📚', criteria: 'مطالعه و خلاصه نویسی ۵ کتاب غیر درسی در طول یک ماه.', description: 'برای مطالعه فعال و شرکت در بحث‌های کتابخوانی', createdBy: 'admin1', scope: 'school' },
    { id: 'b-t1-1', name: 'ستاره ریاضی', imageUrl: 'https://placehold.co/100x100/ef4444/ffffff?text=⭐', criteria: 'کسب نمره کامل در آزمون جامع ریاضی.', description: 'برای کسب بالاترین نمره در آزمون ریاضی', createdBy: 't1', scope: 'teacher' },
];

export const MOCK_AWARDED_BADGES: AwardedBadge[] = [
    { id: 'ab1', badgeId: 'b1', studentId: 's1', dateAwarded: '1403-08-15', awardedBy: 'admin1', reason: 'تلاش مستمر در درس ریاضی' },
    { id: 'ab2', badgeId: 'b2', studentId: 's5', dateAwarded: '1403-09-01', awardedBy: 'admin1', reason: 'پروژه خلاقانه علوم' },
    { id: 'ab3', badgeId: 'b3', studentId: 's10', dateAwarded: '1403-07-20', awardedBy: 'admin1' },
    { id: 'ab4', badgeId: 'b-t1-1', studentId: 's2', dateAwarded: '1403-09-10', awardedBy: 't1', reason: 'عملکرد عالی در آزمون ریاضی میان ترم' },
];

export const MOCK_SCHOOL_ASSETS: SchoolAsset[] = [
    { id: 'asset-1', barcode: 'SCH-CHR-001', type: 'صندلی', status: 'assigned', description: 'صندلی چوبی ردیف اول' },
    { id: 'asset-2', barcode: 'SCH-CHR-002', type: 'صندلی', status: 'available', description: 'صندلی پلاستیکی ردیف دوم' },
    { id: 'asset-3', barcode: 'SCH-BOOK-105', type: 'کتاب', status: 'available', description: 'کتاب ریاضی پایه چهارم' },
    { id: 'asset-4', barcode: 'SCH-CHR-003', type: 'صندلی', status: 'available' },
];

export const MOCK_ASSET_ASSIGNMENTS: AssetAssignment[] = [
    { id: 'assign-asset-1', assetId: 'asset-1', studentId: 's1', assignedDate: '1403-07-05' },
];

export const DEFAULT_SETTINGS: SchoolSettings = {
  // School Type
  schoolLevel: 'high_school',

  // School Info
  schoolName: 'دبیرستان البرز',
  schoolAddress: 'تهران، خیابان ولیعصر، پلاک ۱۲۳',
  schoolPhone: '021-88888888',
  academicYear: '1403-1404',
  schoolLogoUrl: '',

  // UI Customization
  themeColor: 'indigo',
  customThemeColor: '#6366f1',
  font: 'Vazirmatn',
  textColorPrimary: '#1f2937',
  textColorSecondary: '#6b7280',
  bgColorPrimary: '#f3f4f6', // gray-100
  cardBgColor: '#ffffff', // white
  inputBgColor: '#ffffff',
  inputBorderColor: '#d1d5db',
  
  // Module Management
  moduleSettings: {
    grades: { label: 'نمرات', studentVisible: true, teacherVisible: true },
    attendance: { label: 'حضور و غیاب', studentVisible: true, teacherVisible: true },
    discipline: { label: 'انضباطی', studentVisible: true, teacherVisible: true },
    exams: { label: 'آزمون‌ها', studentVisible: true, teacherVisible: true },
    naseeb: { label: 'نصیب', studentVisible: true, teacherVisible: true },
    pta: { label: 'انجمن اولیا', studentVisible: false, teacherVisible: true },
    finance: { label: 'مالی', studentVisible: false, teacherVisible: false },
    events: { label: 'رویدادها', studentVisible: true, teacherVisible: true },
    responsibilities: { label: 'مسئولیت‌ها', studentVisible: true, teacherVisible: true },
    anecdotal: { label: 'واقعه نگاری', studentVisible: false, teacherVisible: true },
    parentMeetings: { label: 'جلسات با اولیا', studentVisible: false, teacherVisible: true },
    notifications: { label: 'اطلاع رسانی', studentVisible: true, teacherVisible: true },
    assets: { label: 'امانات', studentVisible: false, teacherVisible: false },
  },

  // Functional Parameters
  gradingSystem: 'descriptive',
  passingGrade: 10,
  descriptiveGradeColors: [
    { grade: 'خیلی خوب', color: '#22c55e' },
    { grade: 'خوب', color: '#3b82f6' },
    { grade: 'قابل قبول', color: '#f97316' },
    { grade: 'نیاز به تلاش بیشتر', color: '#ef4444' },
  ],
  descriptiveGradeValues: [
    { grade: 'خیلی خوب', value: 20 },
    { grade: 'خوب', value: 17 },
    { grade: 'قابل قبول', value: 14 },
    { grade: 'نیاز به تلاش بیشتر', value: 10 },
  ],
  subjectWeights: [],
  lateThresholdMinutes: 10,
  attendanceStatuses: [
      { name: 'حاضر', countsAsAbsence: false },
      { name: 'غیرموجه', countsAsAbsence: true },
      { name: 'موجه', countsAsAbsence: false },
      { name: 'تاخیر', countsAsAbsence: false },
  ],

  // Category Management
  disciplineCategories: ['نقص درسی', 'بی‌نظمی', 'پرخاش', 'موارد خاص', 'سایر'],
  excusedAbsenceReasons: ['بیماری', 'سفر ضروری', 'مشکلات خانوادگی'],
  naseebChartComponents: ['رشد تحصیلی', 'انضباط', 'مشارکت کلاسی', 'خلاقیت', 'ورزش'],
  iconSettings: [],
  
  // Student Panel Visibility (Legacy)
  studentVisibleAttendanceFields: {
    minutesLate: true,
    departureTime: true,
    isNotified: true,
    hasDoctorsNote: true,
    recordedBy: true,
  },
  studentGradesViewSettings: {
    gradesModuleEnabled: true,
    defaultView: 'list',
    chartSettings: {
        pointRadius: 6,
        lineColor: '#6366f1',
        pointColor: '#6366f1',
        showLine: true,
        showArea: false,
        areaColor: 'rgba(99, 102, 241, 0.1)',
    },
  },
  studentStatCardsSettings: {
    style: 'modern',
    themes: {
        average: { from: '#6366f1', to: '#818cf8' },
        absence: { from: '#ef4444', to: '#f87171' },
        tardy:   { from: '#f97316', to: '#fb923c' },
        discipline: { from: '#8b5cf6', to: '#a78bfa' }
    }
  },
  studentDisciplineViewSettings: {
    disciplineModuleEnabled: true,
    defaultView: 'list',
    chartSettings: {
        showLegend: true,
        showPercentages: true,
        colorPalette: {
            'نقص درسی': '#ef4444',
            'بی‌نظمی': '#f97316',
            'پرخاش': '#eab308',
            'موارد خاص': '#8b5cf6',
            'سایر': '#6b7280',
        }
    }
  },
};

export const MOCK_SETTINGS: SchoolSettings = { ...DEFAULT_SETTINGS };
