import Database from 'better-sqlite3';
import pg from 'pg';
import path from 'path';

const isPostgres = !!process.env.DATABASE_URL;

let sqliteDb: any = null;
let pgPool: pg.Pool | null = null;

if (isPostgres) {
  pgPool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false } // Common for cloud DBs like Neon/Render
  });
} else {
  sqliteDb = new Database(path.join(process.cwd(), 'school.db'));
  sqliteDb.pragma('journal_mode = WAL');
}

export async function query(text: string, params?: any[]) {
  if (isPostgres && pgPool) {
    const res = await pgPool.query(text, params);
    return res.rows;
  } else {
    // For SQLite, we map $1, $2 to ? placeholders if needed, 
    // but better-sqlite3 uses ? or named params.
    // We'll assume the caller passes compatible SQL or we handle it here.
    const stmt = sqliteDb.prepare(text.replace(/\$\d+/g, '?')); 
    if (text.trim().toLowerCase().startsWith('select')) {
      return stmt.all(...(params || []));
    } else {
      return stmt.run(...(params || []));
    }
  }
}

export async function initDb() {
  const sqliteSchema = `
    CREATE TABLE IF NOT EXISTS admins (id TEXT PRIMARY KEY, firstName TEXT, lastName TEXT);
    CREATE TABLE IF NOT EXISTS teachers (id TEXT PRIMARY KEY, firstName TEXT, lastName TEXT, classIds TEXT);
    CREATE TABLE IF NOT EXISTS students (id TEXT PRIMARY KEY, firstName TEXT, lastName TEXT, classId TEXT, className TEXT, nationalId TEXT, dateOfBirth TEXT, birthCert TEXT, placeOfBirth TEXT, nationality TEXT, dominantHand TEXT, health TEXT, family TEXT, contact TEXT, naseebData TEXT, profilePictureUrl TEXT);
    CREATE TABLE IF NOT EXISTS classes (id TEXT PRIMARY KEY, name TEXT, teacherId TEXT, subjects TEXT);
    CREATE TABLE IF NOT EXISTS grades (id TEXT PRIMARY KEY, studentId TEXT, teacherId TEXT, subject TEXT, score TEXT, date TEXT);
    CREATE TABLE IF NOT EXISTS attendance (id TEXT PRIMARY KEY, studentId TEXT, date TEXT, status TEXT, minutesLate INTEGER, departureTime TEXT, isNotified INTEGER, hasDoctorsNote INTEGER, recordedBy TEXT);
    CREATE TABLE IF NOT EXISTS discipline (id TEXT PRIMARY KEY, studentId TEXT, date TEXT, category TEXT, description TEXT, actionTaken TEXT, reportedBy TEXT);
    CREATE TABLE IF NOT EXISTS exams (id TEXT PRIMARY KEY, subject TEXT, examDate TEXT, syllabus TEXT, targetClassIds TEXT, announcementDate TEXT, description TEXT, createdBy TEXT);
    CREATE TABLE IF NOT EXISTS pta_meetings (id TEXT PRIMARY KEY, title TEXT, date TEXT, scope TEXT, scopeId TEXT, description TEXT, createdBy TEXT);
    CREATE TABLE IF NOT EXISTS pta_attendance (id TEXT PRIMARY KEY, meetingId TEXT, studentId TEXT, attended INTEGER, notes TEXT);
    CREATE TABLE IF NOT EXISTS bills (id TEXT PRIMARY KEY, studentId TEXT, title TEXT, description TEXT, academicYear TEXT, totalAmount INTEGER, amountPaid INTEGER, status TEXT, issueDate TEXT, dueDate TEXT);
    CREATE TABLE IF NOT EXISTS payments (id TEXT PRIMARY KEY, financialBillId TEXT, studentId TEXT, date TEXT, amount INTEGER, paymentMethod TEXT, description TEXT, chequeInfo TEXT, recordedBy TEXT);
    CREATE TABLE IF NOT EXISTS events (id TEXT PRIMARY KEY, title TEXT, description TEXT, dateTime TEXT, location TEXT, cost INTEGER, link TEXT, linkText TEXT, prize TEXT, host TEXT, audience TEXT, createdBy TEXT, imageUrl TEXT);
    CREATE TABLE IF NOT EXISTS responsibilities (id TEXT PRIMARY KEY, name TEXT, type TEXT, createdBy TEXT, color TEXT);
    CREATE TABLE IF NOT EXISTS responsibility_assignments (id TEXT PRIMARY KEY, responsibilityId TEXT, studentId TEXT, startDate TEXT, endDate TEXT, assignedBy TEXT);
    CREATE TABLE IF NOT EXISTS anecdotal_records (id TEXT PRIMARY KEY, studentIds TEXT, date TEXT, subject TEXT, location TEXT, description TEXT, recordedBy TEXT);
    CREATE TABLE IF NOT EXISTS parent_meetings (id TEXT PRIMARY KEY, studentId TEXT, date TEXT, attendees TEXT, reason TEXT, summary TEXT, actionItems TEXT, recordedBy TEXT);
    CREATE TABLE IF NOT EXISTS badges (id TEXT PRIMARY KEY, name TEXT, imageUrl TEXT, criteria TEXT, description TEXT, createdBy TEXT, scope TEXT);
    CREATE TABLE IF NOT EXISTS awarded_badges (id TEXT PRIMARY KEY, badgeId TEXT, studentId TEXT, dateAwarded TEXT, awardedBy TEXT, reason TEXT);
    CREATE TABLE IF NOT EXISTS assets (id TEXT PRIMARY KEY, barcode TEXT, type TEXT, status TEXT, description TEXT);
    CREATE TABLE IF NOT EXISTS asset_assignments (id TEXT PRIMARY KEY, assetId TEXT, studentId TEXT, assignedDate TEXT, returnedDate TEXT, notes TEXT);
    CREATE TABLE IF NOT EXISTS notifications (id TEXT PRIMARY KEY, title TEXT, message TEXT, audience TEXT, createdAt TEXT, createdBy TEXT, color TEXT, tags TEXT, link TEXT, linkText TEXT, imageUrl TEXT, isActive INTEGER, deactivateAt TEXT);
    CREATE TABLE IF NOT EXISTS scheduled_notifications (id TEXT PRIMARY KEY, titleTemplate TEXT, messageTemplate TEXT, type TEXT, audience TEXT, color TEXT, imageUrl TEXT, scheduledDate TEXT, isActive INTEGER, tags TEXT, link TEXT, linkText TEXT, createdBy TEXT);
    CREATE TABLE IF NOT EXISTS settings (id INTEGER PRIMARY KEY, data TEXT);
  `;

  const pgSchema = `
    CREATE TABLE IF NOT EXISTS admins (id VARCHAR(255) PRIMARY KEY, firstName VARCHAR(255), lastName VARCHAR(255));
    CREATE TABLE IF NOT EXISTS teachers (id VARCHAR(255) PRIMARY KEY, firstName VARCHAR(255), lastName VARCHAR(255), classIds JSONB);
    CREATE TABLE IF NOT EXISTS students (id VARCHAR(255) PRIMARY KEY, firstName VARCHAR(255), lastName VARCHAR(255), classId VARCHAR(255), className VARCHAR(255), nationalId VARCHAR(50), dateOfBirth VARCHAR(50), birthCert JSONB, placeOfBirth VARCHAR(255), nationality VARCHAR(100), dominantHand VARCHAR(50), health JSONB, family JSONB, contact JSONB, naseebData JSONB, profilePictureUrl TEXT);
    
    CREATE INDEX IF NOT EXISTS idx_students_classId ON students(classId);

    CREATE TABLE IF NOT EXISTS classes (id VARCHAR(255) PRIMARY KEY, name VARCHAR(255), teacherId VARCHAR(255), subjects JSONB);
    CREATE INDEX IF NOT EXISTS idx_classes_teacherId ON classes(teacherId);

    CREATE TABLE IF NOT EXISTS grades (id VARCHAR(255) PRIMARY KEY, studentId VARCHAR(255), teacherId VARCHAR(255), subject VARCHAR(255), score VARCHAR(255), date VARCHAR(50));
    CREATE INDEX IF NOT EXISTS idx_grades_studentId ON grades(studentId);

    CREATE TABLE IF NOT EXISTS attendance (id VARCHAR(255) PRIMARY KEY, studentId VARCHAR(255), date VARCHAR(50), status VARCHAR(50), minutesLate INTEGER, departureTime VARCHAR(50), isNotified BOOLEAN, hasDoctorsNote BOOLEAN, recordedBy VARCHAR(255));
    CREATE INDEX IF NOT EXISTS idx_attendance_studentId ON attendance(studentId);
    CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);

    CREATE TABLE IF NOT EXISTS discipline (id VARCHAR(255) PRIMARY KEY, studentId VARCHAR(255), date VARCHAR(50), category VARCHAR(255), description TEXT, actionTaken TEXT, reportedBy VARCHAR(255));
    CREATE INDEX IF NOT EXISTS idx_discipline_studentId ON discipline(studentId);

    CREATE TABLE IF NOT EXISTS exams (id VARCHAR(255) PRIMARY KEY, subject VARCHAR(255), examDate VARCHAR(50), syllabus TEXT, targetClassIds JSONB, announcementDate VARCHAR(50), description TEXT, createdBy VARCHAR(255));
    
    CREATE TABLE IF NOT EXISTS pta_meetings (id VARCHAR(255) PRIMARY KEY, title VARCHAR(255), date VARCHAR(50), scope VARCHAR(100), scopeId VARCHAR(255), description TEXT, createdBy VARCHAR(255));
    
    CREATE TABLE IF NOT EXISTS pta_attendance (id VARCHAR(255) PRIMARY KEY, meetingId VARCHAR(255), studentId VARCHAR(255), attended BOOLEAN, notes TEXT);
    CREATE INDEX IF NOT EXISTS idx_pta_attendance_meeting ON pta_attendance(meetingId, studentId);

    CREATE TABLE IF NOT EXISTS bills (id VARCHAR(255) PRIMARY KEY, studentId VARCHAR(255), title VARCHAR(255), description TEXT, academicYear VARCHAR(50), totalAmount INTEGER, amountPaid INTEGER, status VARCHAR(50), issueDate VARCHAR(50), dueDate VARCHAR(50));
    CREATE INDEX IF NOT EXISTS idx_bills_studentId ON bills(studentId);

    CREATE TABLE IF NOT EXISTS payments (id VARCHAR(255) PRIMARY KEY, financialBillId VARCHAR(255), studentId VARCHAR(255), date VARCHAR(50), amount INTEGER, paymentMethod VARCHAR(100), description TEXT, chequeInfo JSONB, recordedBy VARCHAR(255));
    CREATE INDEX IF NOT EXISTS idx_payments_studentId ON payments(studentId);
    CREATE INDEX IF NOT EXISTS idx_payments_bill ON payments(financialBillId);

    CREATE TABLE IF NOT EXISTS events (id VARCHAR(255) PRIMARY KEY, title VARCHAR(255), description TEXT, dateTime VARCHAR(100), location VARCHAR(255), cost INTEGER, link VARCHAR(255), linkText VARCHAR(255), prize VARCHAR(255), host VARCHAR(255), audience JSONB, createdBy VARCHAR(255), imageUrl TEXT);
    
    CREATE TABLE IF NOT EXISTS responsibilities (id VARCHAR(255) PRIMARY KEY, name VARCHAR(255), type VARCHAR(100), createdBy VARCHAR(255), color VARCHAR(50));
    
    CREATE TABLE IF NOT EXISTS responsibility_assignments (id VARCHAR(255) PRIMARY KEY, responsibilityId VARCHAR(255), studentId VARCHAR(255), startDate VARCHAR(50), endDate VARCHAR(50), assignedBy VARCHAR(255));
    CREATE INDEX IF NOT EXISTS idx_responsibility_assignments_stu ON responsibility_assignments(studentId);

    CREATE TABLE IF NOT EXISTS anecdotal_records (id VARCHAR(255) PRIMARY KEY, studentIds JSONB, date VARCHAR(50), subject VARCHAR(255), location VARCHAR(255), description TEXT, recordedBy VARCHAR(255));
    
    CREATE TABLE IF NOT EXISTS parent_meetings (id VARCHAR(255) PRIMARY KEY, studentId VARCHAR(255), date VARCHAR(50), attendees VARCHAR(255), reason TEXT, summary TEXT, actionItems TEXT, recordedBy VARCHAR(255));
    CREATE INDEX IF NOT EXISTS idx_parent_meetings_stu ON parent_meetings(studentId);

    CREATE TABLE IF NOT EXISTS badges (id VARCHAR(255) PRIMARY KEY, name VARCHAR(255), imageUrl TEXT, criteria TEXT, description TEXT, createdBy VARCHAR(255), scope VARCHAR(100));
    
    CREATE TABLE IF NOT EXISTS awarded_badges (id VARCHAR(255) PRIMARY KEY, badgeId VARCHAR(255), studentId VARCHAR(255), dateAwarded VARCHAR(50), awardedBy VARCHAR(255), reason TEXT);
    CREATE INDEX IF NOT EXISTS idx_awarded_badges_stu ON awarded_badges(studentId);

    CREATE TABLE IF NOT EXISTS assets (id VARCHAR(255) PRIMARY KEY, barcode VARCHAR(100), type VARCHAR(100), status VARCHAR(100), description TEXT);
    CREATE INDEX IF NOT EXISTS idx_assets_barcode ON assets(barcode);

    CREATE TABLE IF NOT EXISTS asset_assignments (id VARCHAR(255) PRIMARY KEY, assetId VARCHAR(255), studentId VARCHAR(255), assignedDate VARCHAR(50), returnedDate VARCHAR(50), notes TEXT);
    CREATE INDEX IF NOT EXISTS idx_asset_assignments_stu ON asset_assignments(studentId);
    CREATE INDEX IF NOT EXISTS idx_asset_assignments_asset ON asset_assignments(assetId);

    CREATE TABLE IF NOT EXISTS notifications (id VARCHAR(255) PRIMARY KEY, title VARCHAR(255), message TEXT, audience JSONB, createdAt VARCHAR(50), createdBy VARCHAR(255), color VARCHAR(50), tags JSONB, link VARCHAR(255), linkText VARCHAR(255), imageUrl TEXT, isActive BOOLEAN, deactivateAt VARCHAR(50));
    
    CREATE TABLE IF NOT EXISTS scheduled_notifications (id VARCHAR(255) PRIMARY KEY, titleTemplate VARCHAR(255), messageTemplate TEXT, type VARCHAR(50), audience JSONB, color VARCHAR(50), imageUrl TEXT, scheduledDate VARCHAR(50), isActive BOOLEAN, tags JSONB, link VARCHAR(255), linkText VARCHAR(255), createdBy VARCHAR(255));
    
    CREATE TABLE IF NOT EXISTS settings (id INTEGER PRIMARY KEY, data JSONB);
  `;

  if (isPostgres && pgPool) {
    await pgPool.query(pgSchema);
    // Ensure one settings row exists
    const checkSettings = await pgPool.query('SELECT count(*) FROM settings WHERE id = 1');
    if (parseInt(checkSettings.rows[0].count) === 0) {
        await pgPool.query('INSERT INTO settings (id, data) VALUES (1, $1)', [JSON.stringify({})]);
    }
  } else {
    sqliteDb.exec(sqliteSchema);
    const count = sqliteDb.prepare('SELECT COUNT(*) as count FROM settings WHERE id = 1').get().count;
    if (count === 0) {
      sqliteDb.prepare('INSERT INTO settings (id, data) VALUES (1, ?)').run(JSON.stringify({}));
    }
  }
}

// Export the native object if needed for specialized tasks (like transactions)
export const db = isPostgres ? pgPool : sqliteDb;
export { isPostgres };
