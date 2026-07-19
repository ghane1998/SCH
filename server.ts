import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db, initDb, isPostgres, query } from './database';
import * as mockData from './data';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || 'school_management_system_secure_key_14';
const DEFAULT_PASSWORD_HASH = '$2a$10$7R9rR0tS3V24036102602OuxUv/2xGfeqI8pI4iSg0mKofw2vHjA.'; // "123456"

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // Initialize Database
  await initDb();

  // Helper for JSON parsing
  const parseJsonFields = (item: any) => {
    if (!item) return item;
    const jsonFields = ['classIds', 'subjects', 'birthCert', 'health', 'family', 'contact', 'naseebData', 'targetClassIds', 'chequeInfo', 'audience', 'studentIds', 'tags', 'data'];
    Object.keys(item).forEach(key => {
      if (jsonFields.includes(key) && typeof item[key] === 'string') {
        try { item[key] = JSON.parse(item[key]); } catch (e) {}
      }
      if (['isNotified', 'hasDoctorsNote', 'attended', 'isActive'].includes(key)) {
        item[key] = Boolean(item[key]);
      }
    });
    return item;
  };

  async function getTeacherById(id: string) {
    const rows = await query('SELECT * FROM teachers WHERE id = $1', [id]);
    if (!rows || rows.length === 0) return null;
    return parseJsonFields(rows[0]);
  }

  async function getStudentById(id: string) {
    const rows = await query('SELECT * FROM students WHERE id = $1', [id]);
    if (!rows || rows.length === 0) return null;
    return parseJsonFields(rows[0]);
  }

  // Migration logic (if empty)
  const getAdminCount = async () => {
    if (isPostgres) {
        const res = await query('SELECT COUNT(*) as count FROM admins');
        return parseInt((res[0] as any).count || '0');
    } else {
        return (db as any).prepare('SELECT COUNT(*) as count FROM admins').get().count;
    }
  };

  if ((await getAdminCount()) === 0) {
    console.log('Migrating initial data with secure password hashes...');
    
    const bulkInsert = async (table: string, items: any[], mapper: (item: any) => any) => {
        if (!items || items.length === 0) return;
        const firstItem = mapper(items[0]);
        const keys = Object.keys(firstItem);
        const placeholders = keys.map((_, i) => isPostgres ? `$${i + 1}` : '?').join(', ');
        const updates = keys.map(k => `"${k}" = EXCLUDED."${k}"`).join(', ');
        
        if (isPostgres) {
            const sql = `INSERT INTO ${table} (${keys.map(k => `"${k}"`).join(', ')}) VALUES (${placeholders}) ON CONFLICT(id) DO UPDATE SET ${updates}`;
            for (const item of items) {
                await query(sql, Object.values(mapper(item)));
            }
        } else {
            const sql = `INSERT OR IGNORE INTO ${table} (${keys.map(k => `"${k}"`).join(', ')}) VALUES (${keys.map(() => '?').join(', ')})`;
            const stmt = db.prepare(sql);
            const transaction = db.transaction((data: any[]) => {
                for (const item of data) {
                    stmt.run(...Object.values(mapper(item)));
                }
            });
            transaction(items);
        }
    };

    // Run migrations with encrypted passwords (default: "123456")
    await bulkInsert('admins', mockData.MOCK_ADMINS, (item) => ({ 
      id: item.id, 
      firstName: item.firstName, 
      lastName: item.lastName,
      passwordHash: DEFAULT_PASSWORD_HASH
    }));
    await bulkInsert('teachers', mockData.MOCK_TEACHERS, (item) => ({ 
      id: item.id, 
      firstName: item.firstName, 
      lastName: item.lastName, 
      classIds: isPostgres ? item.classIds : JSON.stringify(item.classIds),
      passwordHash: DEFAULT_PASSWORD_HASH
    }));
    await bulkInsert('classes', mockData.MOCK_CLASSES, (item) => ({ 
      id: item.id, 
      name: item.name, 
      teacherId: item.teacherId, 
      subjects: isPostgres ? item.subjects : JSON.stringify(item.subjects) 
    }));
    await bulkInsert('students', mockData.MOCK_STUDENTS, (item) => ({
        id: item.id, 
        firstName: item.firstName, 
        lastName: item.lastName, 
        classId: item.classId, 
        className: item.className,
        nationalId: item.nationalId, 
        dateOfBirth: item.dateOfBirth, 
        birthCert: isPostgres ? item.birthCert : JSON.stringify(item.birthCert),
        placeOfBirth: item.placeOfBirth, 
        nationality: item.nationality, 
        dominantHand: item.dominantHand,
        health: isPostgres ? item.health : JSON.stringify(item.health), 
        family: isPostgres ? item.family : JSON.stringify(item.family), 
        contact: isPostgres ? item.contact : JSON.stringify(item.contact),
        naseebData: isPostgres ? item.naseebData : JSON.stringify(item.naseebData), 
        profilePictureUrl: item.profilePictureUrl,
        passwordHash: DEFAULT_PASSWORD_HASH
    }));
    await bulkInsert('grades', mockData.MOCK_GRADES, (item) => ({ id: item.id, studentId: item.studentId, teacherId: item.teacherId, subject: item.subject, score: String(item.score), date: item.date }));
    await bulkInsert('discipline', mockData.MOCK_DISCIPLINARY_INCIDENTS, (item) => ({ id: item.id, studentId: item.studentId, date: item.date, category: item.category, description: item.description, actionTaken: item.actionTaken, reportedBy: item.reportedBy }));
    await bulkInsert('attendance', mockData.MOCK_ATTENDANCE, (item) => ({ id: item.id, studentId: item.studentId, date: item.date, status: item.status, minutesLate: item.minutesLate || 0, departureTime: item.departureTime || '', isNotified: isPostgres ? !!item.isNotified : (item.isNotified ? 1 : 0), hasDoctorsNote: isPostgres ? !!item.hasDoctorsNote : (item.hasDoctorsNote ? 1 : 0), recordedBy: item.recordedBy }));
    await bulkInsert('exams', mockData.MOCK_EXAMS, (item) => ({ id: item.id, subject: item.subject, examDate: item.examDate, syllabus: item.syllabus, targetClassIds: isPostgres ? item.targetClassIds : JSON.stringify(item.targetClassIds), announcementDate: item.announcementDate, description: item.description, createdBy: item.createdBy }));
    await bulkInsert('events', mockData.MOCK_EVENTS, (item) => ({ id: item.id, title: item.title, description: item.description || '', dateTime: item.dateTime, location: item.location, cost: item.cost || 0, link: item.link || '', linkText: item.linkText || '', prize: item.prize || '', host: item.host || '', audience: isPostgres ? item.audience : JSON.stringify(item.audience), createdBy: item.createdBy, imageUrl: item.imageUrl || '' }));
    
    // Initial Settings
    if (isPostgres) {
        await query('UPDATE settings SET data = $1 WHERE id = 1', [mockData.DEFAULT_SETTINGS]);
    } else {
        db.prepare('UPDATE settings SET data = ? WHERE id = 1').run(JSON.stringify(mockData.DEFAULT_SETTINGS));
    }
    
    console.log('Migration complete.');
  }

  // --- AUTHENTICATION ENDPOINTS & MIDDLEWARE ---

  // Secure Login API
  app.post('/api/auth/login', async (req, res) => {
    const { id, password, role } = req.body;
    if (!id || !password || !role) {
      return res.status(400).json({ error: 'لطفا شناسه کاربری، رمز عبور و نقش را وارد کنید.' });
    }

    try {
      let table = '';
      if (role === 'admin') table = 'admins';
      else if (role === 'teacher') table = 'teachers';
      else if (role === 'student') table = 'students';
      else return res.status(400).json({ error: 'نقش نامعتبر است' });

      const rows = await query(`SELECT * FROM ${table} WHERE id = $1`, [id]);
      if (!rows || rows.length === 0) {
        return res.status(401).json({ error: 'کاربر یافت نشد.' });
      }

      const dbUser = rows[0];
      const passwordHash = dbUser.passwordHash || dbUser.password_hash || DEFAULT_PASSWORD_HASH;

      const isPasswordValid = await bcrypt.compare(password, passwordHash);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'رمز عبور نادرست است.' });
      }

      // Generate secure signed JWT
      const token = jwt.sign(
        { id: dbUser.id, role, firstName: dbUser.firstName, lastName: dbUser.lastName },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        token,
        user: {
          id: dbUser.id,
          firstName: dbUser.firstName,
          lastName: dbUser.lastName
        },
        role
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // JWT Token Verification Middleware
  const requireAuth = (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: Access token missing' });
    }

    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
    } catch (err) {
      return res.status(401).json({ error: 'Unauthorized: Invalid access token' });
    }
  };

  // --- TIERED/LAYERED DATA ENDPOINTS ---
  const tables = ['admins', 'teachers', 'students', 'classes', 'grades', 'attendance', 'discipline', 'exams', 'pta_meetings', 'pta_attendance', 'bills', 'payments', 'events', 'responsibilities', 'responsibility_assignments', 'anecdotal_records', 'parent_meetings', 'badges', 'awarded_badges', 'assets', 'asset_assignments', 'notifications', 'scheduled_notifications'];

  tables.forEach(table => {
    app.get(`/api/${table}`, requireAuth, async (req: any, res) => {
      try {
        const { id: userId, role } = req.user;
        let items = await query(`SELECT * FROM ${table}`);
        items = items.map(parseJsonFields);

        // Tier 1: Admins get full, unrestricted data access
        if (role === 'admin') {
          return res.json(items);
        }

        // Tier 2: Teachers get filtered classroom-specific access
        if (role === 'teacher') {
          // No access to financial bills or payments
          if (['bills', 'payments'].includes(table)) {
            return res.json([]);
          }

          const teacher = await getTeacherById(userId);
          const teacherClassIds = teacher?.classIds || [];

          if (table === 'classes') {
            return res.json(items.filter((c: any) => c.teacherId === userId || teacherClassIds.includes(c.id)));
          }

          if (table === 'students') {
            return res.json(items.filter((s: any) => s.classId && teacherClassIds.includes(s.classId)));
          }

          // Filter student records for modules managed by teachers
          if (['grades', 'attendance', 'discipline', 'anecdotal_records', 'parent_meetings', 'pta_attendance'].includes(table)) {
            const allStudents = await query('SELECT id, "classId" FROM students');
            const classMatches = allStudents.filter((s: any) => s.classId && teacherClassIds.includes(s.classId)).map((s: any) => s.id);

            return res.json(items.filter((item: any) => {
              if (item.studentId) return classMatches.includes(item.studentId);
              if (item.studentIds) {
                const sids = Array.isArray(item.studentIds) ? item.studentIds : JSON.parse(item.studentIds || '[]');
                return sids.some((sid: any) => classMatches.includes(sid));
              }
              return item.recordedBy === userId || item.reportedBy === userId || item.createdBy === userId;
            }));
          }

          return res.json(items);
        }

        // Tier 3: Students get strictly restricted self-only access
        if (role === 'student') {
          if (table === 'students') {
            return res.json(items.filter((s: any) => s.id === userId));
          }

          if (['grades', 'attendance', 'discipline', 'bills', 'payments', 'pta_attendance', 'responsibility_assignments', 'awarded_badges', 'asset_assignments'].includes(table)) {
            return res.json(items.filter((item: any) => item.studentId === userId));
          }

          if (table === 'classes') {
            const student = await getStudentById(userId);
            return res.json(items.filter((c: any) => c.id === student?.classId));
          }

          if (table === 'teachers') {
            const student = await getStudentById(userId);
            const cid = student?.classId;
            if (!cid) return res.json([]);
            return res.json(items.filter((t: any) => {
              const tClassIds = Array.isArray(t.classIds) ? t.classIds : JSON.parse(t.classIds || '[]');
              return tClassIds.includes(cid);
            }));
          }

          if (table === 'anecdotal_records') {
            return res.json(items.filter((item: any) => {
              const sids = Array.isArray(item.studentIds) ? item.studentIds : JSON.parse(item.studentIds || '[]');
              return sids.includes(userId);
            }));
          }

          if (table === 'notifications' || table === 'events') {
            return res.json(items.filter((item: any) => {
              if (!item.audience) return true;
              const aud = typeof item.audience === 'string' ? JSON.parse(item.audience) : item.audience;
              if (aud.type === 'all_students') return true;
              if (aud.type === 'student' && aud.ids?.includes(userId)) return true;
              return false;
            }));
          }

          // Secure isolation: prevent students from requesting admin, logs, scheduling, or assets
          if (['admins', 'pta_meetings', 'scheduled_notifications', 'assets'].includes(table)) {
            return res.json([]);
          }

          return res.json(items);
        }

        res.json(items);
      } catch (err: any) { res.status(500).json({ error: err.message }); }
    });
  });

  app.get('/api/settings', requireAuth, async (req, res) => {
    try {
        const rows = await query('SELECT data FROM settings WHERE id = 1');
        res.json(JSON.parse(rows[0].data));
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.post('/api/settings', requireAuth, async (req: any, res) => {
    try {
        const { role } = req.user;
        if (role !== 'admin') {
          return res.status(403).json({ error: 'Forbidden: Admin access only' });
        }
        const sql = isPostgres ? 'UPDATE settings SET data = $1 WHERE id = 1' : 'UPDATE settings SET data = ? WHERE id = 1';
        await query(sql, [isPostgres ? req.body : JSON.stringify(req.body)]);
        res.json({ success: true });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.post('/api/:table/save', requireAuth, async (req: any, res) => {
    try {
        const { table } = req.params;
        const { role } = req.user;
        
        // Strict protection: students can NEVER write data
        if (role === 'student') {
          return res.status(403).json({ error: 'Forbidden: Students cannot write data' });
        }

        // Teachers can only write specific operational items
        if (role === 'teacher') {
          const allowedTeacherTables = ['grades', 'attendance', 'discipline', 'pta_attendance', 'anecdotal_records', 'parent_meetings', 'awarded_badges'];
          if (!allowedTeacherTables.includes(table)) {
            return res.status(403).json({ error: 'Forbidden: Teachers cannot write to this table' });
          }
        }

        const item = req.body;
        const mapped = { ...item };
        const jsonFields = ['classIds', 'subjects', 'birthCert', 'health', 'family', 'contact', 'naseebData', 'targetClassIds', 'chequeInfo', 'audience', 'studentIds', 'tags'];
        jsonFields.forEach(f => { 
            if (mapped[f] !== undefined && mapped[f] !== null) {
                mapped[f] = isPostgres ? mapped[f] : JSON.stringify(mapped[f]); 
            }
        });
        
        ['isNotified', 'hasDoctorsNote', 'attended', 'isActive'].forEach(f => {
            if (mapped[f] !== undefined) {
                mapped[f] = isPostgres ? Boolean(mapped[f]) : (mapped[f] ? 1 : 0);
            }
        });

        const keys = Object.keys(mapped);
        const placeholders = keys.map((_, i) => isPostgres ? `$${i + 1}` : '?').join(', ');
        const updates = keys.map(k => `"${k}" = EXCLUDED."${k}"`).join(', ');

        const sql = isPostgres 
            ? `INSERT INTO ${table} (${keys.map(k => `"${k}"`).join(', ')}) VALUES (${placeholders}) ON CONFLICT(id) DO UPDATE SET ${updates}`
            : `INSERT INTO ${table} (${keys.map(k => `"${k}"`).join(', ')}) VALUES (${placeholders}) ON CONFLICT(id) DO UPDATE SET ${keys.map(k => `"${k}" = ?`).join(', ')}`;

        const params = isPostgres ? Object.values(mapped) : [...Object.values(mapped), ...Object.values(mapped)];
        await query(sql, params);
        res.json({ success: true });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.post('/api/:table/bulk-save', requireAuth, async (req: any, res) => {
    try {
        const { table } = req.params;
        const { role } = req.user;
        
        if (role === 'student') {
          return res.status(403).json({ error: 'Forbidden' });
        }
        if (role === 'teacher') {
          const allowedTeacherTables = ['grades', 'attendance', 'discipline', 'pta_attendance', 'anecdotal_records', 'parent_meetings', 'awarded_badges'];
          if (!allowedTeacherTables.includes(table)) {
            return res.status(403).json({ error: 'Forbidden' });
          }
        }

        const items = req.body;
        if (!items || items.length === 0) return res.json({ success: true });

        const mapper = (item: any) => {
            const mapped = { ...item };
            const jsonFields = ['classIds', 'subjects', 'birthCert', 'health', 'family', 'contact', 'naseebData', 'targetClassIds', 'chequeInfo', 'audience', 'studentIds', 'tags'];
            jsonFields.forEach(f => {
                if (mapped[f] !== undefined && mapped[f] !== null) {
                    mapped[f] = isPostgres ? mapped[f] : JSON.stringify(mapped[f]);
                }
            });
            ['isNotified', 'hasDoctorsNote', 'attended', 'isActive'].forEach(f => {
                if (mapped[f] !== undefined) mapped[f] = isPostgres ? Boolean(mapped[f]) : (mapped[f] ? 1 : 0);
            });
            return mapped;
        };

        const keys = Object.keys(mapper(items[0]));
        const placeholders = keys.map((_, i) => isPostgres ? `$${i + 1}` : '?').join(', ');
        const updates = keys.map(k => `"${k}" = EXCLUDED."${k}"`).join(', ');

        if (isPostgres) {
            const sql = `INSERT INTO ${table} (${keys.map(k => `"${k}"`).join(', ')}) VALUES (${placeholders}) ON CONFLICT(id) DO UPDATE SET ${updates}`;
            for (const item of items) {
                await query(sql, Object.values(mapper(item)));
            }
        } else {
            const sql = `INSERT INTO ${table} (${keys.map(k => `"${k}"`).join(', ')}) VALUES (${placeholders}) ON CONFLICT(id) DO UPDATE SET ${keys.map(k => `"${k}" = ?`).join(', ')}`;
            const stmt = db.prepare(sql);
            const transaction = db.transaction((data: any[]) => {
                for (const item of data) {
                    const m = mapper(item);
                    stmt.run(...Object.values(m), ...Object.values(m));
                }
            });
            transaction(items);
        }
        res.json({ success: true });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.delete('/api/:table/:id', requireAuth, async (req: any, res) => {
    try {
        const { table, id } = req.params;
        const { role } = req.user;

        if (role === 'student') {
          return res.status(403).json({ error: 'Forbidden' });
        }
        if (role === 'teacher') {
          const allowedTeacherTables = ['grades', 'attendance', 'discipline', 'pta_attendance', 'anecdotal_records', 'parent_meetings', 'awarded_badges'];
          if (!allowedTeacherTables.includes(table)) {
            return res.status(403).json({ error: 'Forbidden' });
          }
        }

        const sql = isPostgres ? `DELETE FROM ${table} WHERE id = $1` : `DELETE FROM ${table} WHERE id = ?`;
        await query(sql, [id]);
        res.json({ success: true });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
