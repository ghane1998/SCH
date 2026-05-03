import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { db, initDb, isPostgres, query } from './database';
import * as mockData from './data';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // Initialize Database
  await initDb();

  // Migration logic (if empty)
  const getAdminCount = async () => {
    if (isPostgres) {
        const res = await (db as any).query('SELECT COUNT(*) as count FROM admins');
        return parseInt(res.rows[0].count);
    } else {
        return (db as any).prepare('SELECT COUNT(*) as count FROM admins').get().count;
    }
  };

  if ((await getAdminCount()) === 0) {
    console.log('Migrating initial data...');
    
    const bulkInsert = async (table: string, items: any[], mapper: (item: any) => any) => {
        if (!items || items.length === 0) return;
        const firstItem = mapper(items[0]);
        const keys = Object.keys(firstItem);
        const placeholders = keys.map((_, i) => isPostgres ? `$${i + 1}` : '?').join(', ');
        const updates = keys.map(k => `${k} = EXCLUDED.${k}`).join(', ');
        
        if (isPostgres) {
            const client = await (db as any).connect();
            try {
                await client.query('BEGIN');
                const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders}) ON CONFLICT(id) DO UPDATE SET ${updates}`;
                for (const item of items) {
                    await client.query(sql, Object.values(mapper(item)));
                }
                await client.query('COMMIT');
            } catch (e) {
                await client.query('ROLLBACK');
                throw e;
            } finally {
                client.release();
            }
        } else {
            const sql = `INSERT OR IGNORE INTO ${table} (${keys.join(', ')}) VALUES (${keys.map(() => '?').join(', ')})`;
            const stmt = db.prepare(sql);
            const transaction = db.transaction((data: any[]) => {
                for (const item of data) {
                    stmt.run(...Object.values(mapper(item)));
                }
            });
            transaction(items);
        }
    };

    // Run migrations
    await bulkInsert('admins', mockData.MOCK_ADMINS, (item) => ({ id: item.id, firstName: item.firstName, lastName: item.lastName }));
    await bulkInsert('teachers', mockData.MOCK_TEACHERS, (item) => ({ id: item.id, firstName: item.firstName, lastName: item.lastName, classIds: isPostgres ? item.classIds : JSON.stringify(item.classIds) }));
    await bulkInsert('classes', mockData.MOCK_CLASSES, (item) => ({ id: item.id, name: item.name, teacherId: item.teacherId, subjects: isPostgres ? item.subjects : JSON.stringify(item.subjects) }));
    await bulkInsert('students', mockData.MOCK_STUDENTS, (item) => ({
        id: item.id, firstName: item.firstName, lastName: item.lastName, classId: item.classId, className: item.className,
        nationalId: item.nationalId, dateOfBirth: item.dateOfBirth, birthCert: isPostgres ? item.birthCert : JSON.stringify(item.birthCert),
        placeOfBirth: item.placeOfBirth, nationality: item.nationality, dominantHand: item.dominantHand,
        health: isPostgres ? item.health : JSON.stringify(item.health), family: isPostgres ? item.family : JSON.stringify(item.family), contact: isPostgres ? item.contact : JSON.stringify(item.contact),
        naseebData: isPostgres ? item.naseebData : JSON.stringify(item.naseebData), profilePictureUrl: item.profilePictureUrl
    }));
    await bulkInsert('grades', mockData.MOCK_GRADES, (item) => ({ id: item.id, studentId: item.studentId, teacherId: item.teacherId, subject: item.subject, score: String(item.score), date: item.date }));
    await bulkInsert('discipline', mockData.MOCK_DISCIPLINARY_INCIDENTS, (item) => ({ id: item.id, studentId: item.studentId, date: item.date, category: item.category, description: item.description, actionTaken: item.actionTaken, reportedBy: item.reportedBy }));
    await bulkInsert('attendance', mockData.MOCK_ATTENDANCE, (item) => ({ id: item.id, studentId: item.studentId, date: item.date, status: item.status, minutesLate: item.minutesLate || 0, departureTime: item.departureTime || '', isNotified: isPostgres ? !!item.isNotified : (item.isNotified ? 1 : 0), hasDoctorsNote: isPostgres ? !!item.hasDoctorsNote : (item.hasDoctorsNote ? 1 : 0), recordedBy: item.recordedBy }));
    await bulkInsert('exams', mockData.MOCK_EXAMS, (item) => ({ id: item.id, subject: item.subject, examDate: item.examDate, syllabus: item.syllabus, targetClassIds: isPostgres ? item.targetClassIds : JSON.stringify(item.targetClassIds), announcementDate: item.announcementDate, description: item.description, createdBy: item.createdBy }));
    await bulkInsert('events', mockData.MOCK_EVENTS, (item) => ({ id: item.id, title: item.title, description: item.description || '', dateTime: item.dateTime, location: item.location, cost: item.cost || 0, link: item.link || '', linkText: item.linkText || '', prize: item.prize || '', host: item.host || '', audience: isPostgres ? item.audience : JSON.stringify(item.audience), createdBy: item.createdBy, imageUrl: item.imageUrl || '' }));
    
    // Initial Settings
    if (isPostgres) {
        await (db as any).query('UPDATE settings SET data = $1 WHERE id = 1', [mockData.DEFAULT_SETTINGS]);
    } else {
        db.prepare('UPDATE settings SET data = ? WHERE id = 1').run(JSON.stringify(mockData.DEFAULT_SETTINGS));
    }
    
    console.log('Migration complete.');
  }

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

  // API Endpoints
  const tables = ['admins', 'teachers', 'students', 'classes', 'grades', 'attendance', 'discipline', 'exams', 'pta_meetings', 'pta_attendance', 'bills', 'payments', 'events', 'responsibilities', 'responsibility_assignments', 'anecdotal_records', 'parent_meetings', 'badges', 'awarded_badges', 'assets', 'asset_assignments', 'notifications', 'scheduled_notifications'];

  tables.forEach(table => {
    app.get(`/api/${table}`, async (req, res) => {
      try {
        const items = await query(`SELECT * FROM ${table}`);
        res.json(items.map(parseJsonFields));
      } catch (err: any) { res.status(500).json({ error: err.message }); }
    });
  });

  app.get('/api/settings', async (req, res) => {
    try {
        const rows = await query('SELECT data FROM settings WHERE id = 1');
        res.json(JSON.parse(rows[0].data));
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.post('/api/settings', async (req, res) => {
    try {
        const sql = isPostgres ? 'UPDATE settings SET data = $1 WHERE id = 1' : 'UPDATE settings SET data = ? WHERE id = 1';
        await query(sql, [isPostgres ? req.body : JSON.stringify(req.body)]);
        res.json({ success: true });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.post('/api/:table/save', async (req, res) => {
    try {
        const { table } = req.params;
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
        const updates = keys.map(k => `${k} = EXCLUDED.${k}`).join(', ');

        const sql = isPostgres 
            ? `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders}) ON CONFLICT(id) DO UPDATE SET ${updates}`
            : `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders}) ON CONFLICT(id) DO UPDATE SET ${keys.map(k => `${k} = ?`).join(', ')}`;

        const params = isPostgres ? Object.values(mapped) : [...Object.values(mapped), ...Object.values(mapped)];
        await query(sql, params);
        res.json({ success: true });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.post('/api/:table/bulk-save', async (req, res) => {
    try {
        const { table } = req.params;
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
        const updates = keys.map(k => `${k} = EXCLUDED.${k}`).join(', ');

        if (isPostgres) {
            const client = await (db as any).connect();
            try {
                await client.query('BEGIN');
                const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders}) ON CONFLICT(id) DO UPDATE SET ${updates}`;
                for (const item of items) {
                    await client.query(sql, Object.values(mapper(item)));
                }
                await client.query('COMMIT');
            } catch (e) {
                await client.query('ROLLBACK');
                throw e;
            } finally { client.release(); }
        } else {
            const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders}) ON CONFLICT(id) DO UPDATE SET ${keys.map(k => `${k} = ?`).join(', ')}`;
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

  app.delete('/api/:table/:id', async (req, res) => {
    try {
        const { table, id } = req.params;
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
