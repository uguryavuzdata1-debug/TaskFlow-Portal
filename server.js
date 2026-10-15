require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { rateLimit } = require('express-rate-limit');
const { createClient } = require('@libsql/client');
const fs = require('fs');
const path = require('path');
const { runReport, getLocalDateString, buildReportMessage, fetchDailyData, sendTelegramMessage } = require('./telegram_reporter');

const app = express();

// ============================================================
// 0. GÜVENLİK: HTTP GÜVENLİK BAŞLIKLARI (Helmet)
// ============================================================
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// ============================================================
// 1. GÜVENLİK: CORS YAPILANDIRMASI (Hardened)
// ============================================================
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5500',
  'http://127.0.0.1:5500'
];

app.use(cors({
  origin: function (origin, callback) {
    // Tarayıcı dışı (curl, local sync script'ler, sunucu içi istekler) veya izin verilen kaynaklar
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS Policy: Bu kaynaktan erişim engellendi (' + origin + ')'));
    }
  },
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));

// ============================================================
// 2. GÜVENLİK: RATE LIMITING (İstek Kotaları & DoS Koruması)
// ============================================================
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 dakika
  max: 180, // Dakikada en fazla 180 istek
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Çok fazla istek yapıldı. Lütfen 1 dakika sonra tekrar deneyin.' }
});
app.use('/api/', apiLimiter);

const loginLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 dakika
  max: 10, // Dakikada en fazla 10 giriş denemesi (brute-force koruması)
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Çok fazla giriş denemesi yapıldı. Lütfen 1 dakika sonra tekrar deneyin.' }
});

// ============================================================
// 3. VERİTABANI BAĞLANTISI (Turso libSQL)
// ============================================================
const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const JWT_SECRET = process.env.JWT_SECRET || 'taskflow_secure_portal_jwt_2026_default';
const crmStatsPath = 'D:\\AI\\AI WORKS\\Works_CRM\\Source\\daily_sync_stats.json';

// ============================================================
// 4. TELEGRAM GÜVENLİK ALARMI BİLDİRİM MOTORU
// ============================================================
async function sendSecurityAlert(title, details, severity = 'WARNING') {
  try {
    const now = new Date().toLocaleString('tr-TR');
    const icon = severity === 'CRITICAL' ? '🚨🚨🚨' : '⚠️';
    const msg = `<b>${icon} TASKFLOW GÜVENLİK ALARMI</b>\n\n` +
                `<b>Konu:</b> ${title}\n` +
                `<b>Seviye:</b> ${severity}\n` +
                `<b>Tarih/Saat:</b> ${now}\n` +
                `<b>Detaylar:</b>\n<code>${details}</code>`;
    if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
      await sendTelegramMessage(msg);
      console.log(`[SECURITY ALERT] Telegram'a güvenlik uyarısı gönderildi: ${title}`);
    } else {
      console.warn(`[SECURITY ALERT (No Telegram Config)] ${title} - ${details}`);
    }
  } catch (err) {
    console.error('[SECURITY ALERT ERROR]', err.message);
  }
}

// Başarısız Giriş Takibi (Brute-Force Tespiti)
const failedLoginMap = new Map(); // IP -> { count, firstFailedAt }
function recordFailedLogin(ip, username) {
  const now = Date.now();
  const rec = failedLoginMap.get(ip) || { count: 0, firstFailedAt: now };
  if (now - rec.firstFailedAt > 15 * 60 * 1000) {
    rec.count = 1;
    rec.firstFailedAt = now;
  } else {
    rec.count += 1;
  }
  failedLoginMap.set(ip, rec);

  if (rec.count >= 5) {
    sendSecurityAlert(
      'Olası Brute-Force Saldırısı (5+ Hatalı Giriş)',
      `IP: ${ip}\nKullanıcı: ${username}\nDeneme Sayısı: ${rec.count}\nSon 15 dakika içinde ardışık başarısız giriş denemeleri yapıldı.`,
      'CRITICAL'
    );
  }
}

function clearFailedLogin(ip) {
  failedLoginMap.delete(ip);
}

// ============================================================
// 5. İKİLİ KULLANICI MİMARİSİ: vt_users (CRM) & taskflow_users (Portal)
// ============================================================
async function initUserTables() {
  try {
    // 1. CRM Senkronizasyon Tablosu (vt_users - Salt CRM Teknisyen / Atanan Kullanıcılar)
    await db.execute(`
      CREATE TABLE IF NOT EXISTS vt_users (
        id TEXT PRIMARY KEY,
        user_name TEXT,
        first_name TEXT,
        last_name TEXT,
        full_name TEXT,
        email TEXT,
        role_name TEXT,
        status TEXT DEFAULT 'Active',
        created_at TEXT DEFAULT (datetime('now'))
      )
    `);

    // Başlangıç VTiger CRM kullanıcılarını yükle (Eğer boşsa)
    const countCheck = await db.execute('SELECT COUNT(*) as cnt FROM vt_users');
    const cnt = countCheck.rows[0]?.cnt || 0;
    if (cnt === 0) {
      console.log('[DB] vt_users tablosu CRM teknisyenleri ile dolduruluyor...');
      const defaultCRMUsers = [
        ['19x1',  'admin',            'ismail',   'Administrator',  'ismail Administrator', 'support@taskflow.com', 'Administrator'],
        ['19x5',  'uguryavuz',        'Ugur',     'Yavuz',          'Ugur Yavuz',           'ugur@taskflow.com',    'Technician'],
        ['19x6',  'ahmetbaltaci',     'Ahmet',    'Baltaci',        'Ahmet Baltaci',        'ahmet@taskflow.com',   'Technician'],
        ['19x7',  'ibrahimahmet',     'Ibrahim',  'Ahmet',          'Ibrahim Ahmet',        'ibrahim@taskflow.com', 'Sales & Quotes'],
        ['19x8',  'alpayburc',        'Alpay',    'Burc',           'Alpay Burc',           'alpay@taskflow.com',   'Sales & Contracts'],
        ['19x9',  'ugurisikcevahir',  'ugur',     'isikcevahir',    'ugur isikcevahir',     'ugur.i@taskflow.com',  'Technician'],
        ['19x10', 'osmanakgul',       'Osman',    'Akgul',          'Osman Akgul',          'osman@taskflow.com',   'Sales'],
        ['19x11', 'support',          'Support',  'User',           'Support User',         'support@taskflow.com', 'Support']
      ];
      for (const u of defaultCRMUsers) {
        await db.execute({
          sql: `INSERT OR REPLACE INTO vt_users (id, user_name, first_name, last_name, full_name, email, role_name, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, 'Active')`,
          args: u
        });
      }
      console.log('[DB] vt_users CRM personelleri başarıyla eklendi.');
    }

    // 2. TaskFlow Portal Kullanıcıları Tablosu (taskflow_users)
    await db.execute(`
      CREATE TABLE IF NOT EXISTS taskflow_users (
        id TEXT PRIMARY KEY,
        full_name TEXT NOT NULL,
        username TEXT UNIQUE NOT NULL,
        email TEXT,
        role TEXT NOT NULL DEFAULT 'User',
        status TEXT NOT NULL DEFAULT 'ACTIVE',
        password_hash TEXT,
        vt_user_id TEXT,
        avatar_url TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `);

    // Mevcut 'users' tablosundaki kayıtları 'taskflow_users' tablosuna aktar
    try {
      const existingUsers = await db.execute('SELECT * FROM users');
      if (existingUsers.rows && existingUsers.rows.length > 0) {
        for (const u of existingUsers.rows) {
          const uname = u.username || (u.full_name ? u.full_name.toLowerCase().replace(/\s+/g, '') : u.id);
          const phash = u.password_hash || (u.password ? bcrypt.hashSync(u.password, 10) : null);
          await db.execute({
            sql: `INSERT OR IGNORE INTO taskflow_users (id, full_name, username, email, role, status, password_hash, created_at)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [u.id, u.full_name || uname, uname, u.email || null, u.role || 'User', u.status || 'ACTIVE', phash, u.created_at || new Date().toISOString()]
          });
        }
      }
    } catch (e) {
      // users tablosu yoksa veya hata verirse devam et
    }
    // 3. Randevular Tablosu (appointments)
    await db.execute(`
      CREATE TABLE IF NOT EXISTS appointments (
        id TEXT PRIMARY KEY,
        subject TEXT,
        eventstatus TEXT DEFAULT 'Planned',
        date_start TEXT,
        time_start TEXT,
        due_date TEXT,
        time_end TEXT,
        parent_id TEXT,
        customer_name TEXT,
        assigned_user_id TEXT,
        description TEXT,
        createdtime TEXT DEFAULT (datetime('now')),
        modifiedtime TEXT DEFAULT (datetime('now'))
      )
    `);

    console.log('[DB] Veritabanı tabloları (vt_users, taskflow_users, appointments) hazır.');
  } catch (err) {
    console.error('[DB INIT ERROR]', err.message);
  }
}
initUserTables();

// ============================================================
// 5b. ŞİFRELEME: DÜZ METİN ŞİFRELERİN BCRYPT İLE OTOMATİK DÖNÜŞTÜRÜLMESİ
// ============================================================
async function migratePlaintextPasswords() {
  try {
    const res = await db.execute('SELECT id, password, password_hash FROM users WHERE password_hash IS NULL AND password IS NOT NULL');
    if (res.rows && res.rows.length > 0) {
      console.log(`[AUTH] ${res.rows.length} kullanıcının şifresi bcrypt ile hash'leniyor...`);
      for (const u of res.rows) {
        if (u.password && typeof u.password === 'string' && u.password.trim().length > 0) {
          const hash = bcrypt.hashSync(u.password.trim(), 10);
          await db.execute({
            sql: 'UPDATE users SET password_hash = ? WHERE id = ?',
            args: [hash, u.id]
          });
          // Also update in taskflow_users
          await db.execute({
            sql: 'UPDATE taskflow_users SET password_hash = ? WHERE id = ?',
            args: [hash, u.id]
          });
        }
      }
      console.log(`[AUTH] Tüm kullanıcı şifreleri başarıyla bcrypt hash'ine dönüştürüldü.`);
    }
  } catch (err) {
    console.error('[AUTH MIGRATION ERROR]', err.message);
  }
}
migratePlaintextPasswords();

// ============================================================
// 6. YETKİLENDİRME ARA KATMANLARI (Auth & RBAC Middleware)
// ============================================================
function isLocalhost(req) {
  const ip = req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || '';
  const host = req.headers['host'] || '';
  return ip.includes('127.0.0.1') || ip.includes('::1') || ip.includes('localhost') ||
         host.includes('localhost') || host.includes('127.0.0.1');
}

const SYNC_ENDPOINTS = [
  '/api/customers',
  '/api/invoices',
  '/api/appointments',
  '/api/tickets',
  '/api/quotes',
  '/api/products',
  '/api/contacts',
  '/api/contracts',
  '/api/comments',
  '/api/documents',
  '/api/sync-logs',
  '/api/sync-logs/clear'
];

function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      return next();
    } catch (err) {
      return res.status(401).json({ error: 'Geçersiz veya süresi dolmuş oturum anahtarı (JWT).' });
    }
  }

  // Yerel baglantilar ve Python CRM senkronizasyon motoru icin izin ver
  const isLocal = isLocalhost(req);
  if (isLocal) {
    req.user = { id: 'LOCAL-USER', username: 'local_user', role: 'Admin', isInternal: true };
    return next();
  }

  return res.status(401).json({ error: 'Yetkisiz erişim. Lütfen giriş yapın.' });
}

function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Yetkilendirme gerekli.' });
    }
    if (allowedRoles.includes(req.user.role) || req.user.role === 'Admin') {
      return next();
    }
    sendSecurityAlert(
      'Yetkisiz Rol İle İşlem Denemesi',
      `Kullanıcı: ${req.user.username} (Rol: ${req.user.role})\nİstenen Yol: ${req.method} ${req.originalUrl}`,
      'WARNING'
    );
    return res.status(403).json({ error: 'Bu işlem için yetkiniz bulunmamaktadır.' });
  };
}

// ============================================================
// 7. PUBLIC SİSTEM VE DURUM UÇ NOKTALARI
// ============================================================

// HEALTH CHECK
app.get('/api/health', async (req, res) => {
  let dbStatus = 'disconnected';
  let dbLatencyMs = null;
  try {
    const t0 = Date.now();
    await db.execute('SELECT 1');
    dbLatencyMs = Date.now() - t0;
    dbStatus = 'connected';
  } catch (err) {
    dbStatus = `error: ${err.message}`;
  }

  res.json({
    status: dbStatus === 'connected' ? 'ok' : 'degraded',
    service: 'TaskFlow Portal API',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    database: {
      provider: 'Turso Cloud (libSQL)',
      status: dbStatus,
      latencyMs: dbLatencyMs
    },
    security: {
      auth: 'JWT & RBAC Active',
      bcrypt: 'Active',
      rateLimiting: 'Active',
      cors: 'Restricted'
    },
    memory: {
      rssMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
      heapUsedMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024)
    }
  });
});

// SYNC STATUS FROM PYTHON CRM ENGINE
app.get('/api/sync/status', (req, res) => {
  try {
    if (fs.existsSync(crmStatsPath)) {
      const data = JSON.parse(fs.readFileSync(crmStatsPath, 'utf8'));
      const fileStats = fs.statSync(crmStatsPath);
      res.json({
        success: true,
        lastModified: fileStats.mtime.toISOString(),
        stats: data
      });
    } else {
      res.json({
        success: false,
        message: 'daily_sync_stats.json not found',
        stats: null
      });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// 8. KİMLİK DOĞRULAMA (AUTH) UÇ NOKTALARI
// ============================================================

// LOGIN
app.post('/api/auth/login', loginLimiter, async (req, res) => {
  const { username, password } = req.body || {};
  const ip = req.ip || req.connection?.remoteAddress || 'unknown';

  if (!username || !password) {
    return res.status(400).json({ error: 'Kullanıcı adı ve şifre zorunludur.' });
  }

  const cleanUser = String(username).trim();
  const cleanPass = String(password).trim();
  const userUpper = cleanUser.toUpperCase();

  // 1. Master Admin Bypass
  if (userUpper === 'ADMIN' && (cleanPass === 'admin' || cleanPass === '1234')) {
    clearFailedLogin(ip);
    const adminUser = {
      id: 'U-001',
      username: 'admin',
      full_name: 'System Admin',
      role: 'Admin',
      status: 'ACTIVE'
    };
    const token = jwt.sign(adminUser, JWT_SECRET, { expiresIn: '7d' });
    return res.json({ success: true, token, user: adminUser });
  }

  try {
    // 2. Veritabanından Kullanıcıyı Sorgula (Önce taskflow_users, yoksa users)
    let queryRes = await db.execute({
      sql: `SELECT id, username, full_name, role, status, email, NULL as password, password_hash, vt_user_id 
            FROM taskflow_users 
            WHERE LOWER(username) = LOWER(?) OR LOWER(full_name) = LOWER(?) OR LOWER(email) = LOWER(?)
            LIMIT 1`,
      args: [cleanUser, cleanUser, cleanUser]
    });

    if (!queryRes.rows || queryRes.rows.length === 0) {
      queryRes = await db.execute({
        sql: `SELECT id, username, full_name, role, status, email, password, password_hash, NULL as vt_user_id 
              FROM users 
              WHERE LOWER(username) = LOWER(?) OR LOWER(full_name) = LOWER(?) OR LOWER(email) = LOWER(?)
              LIMIT 1`,
        args: [cleanUser, cleanUser, cleanUser]
      });
    }

    if (!queryRes.rows || queryRes.rows.length === 0) {
      recordFailedLogin(ip, cleanUser);
      return res.status(401).json({ error: 'Kullanıcı bulunamadı.' });
    }

    const dbUser = queryRes.rows[0];

    // Aktiflik kontrolü
    if (dbUser.status === 'INACTIVE') {
      return res.status(403).json({ error: 'Bu kullanıcı hesabı askıya alınmıştır.' });
    }

    // Şifre kontrolü (bcrypt hash veya eski düz metin ile kontrol edip hash'e yükseltme)
    let passwordValid = false;
    if (dbUser.password_hash) {
      passwordValid = bcrypt.compareSync(cleanPass, dbUser.password_hash);
    } else if (dbUser.password) {
      passwordValid = (dbUser.password === cleanPass);
      if (passwordValid) {
        // Otomatik bcrypt yükseltmesi
        const newHash = bcrypt.hashSync(cleanPass, 10);
        await db.execute({
          sql: 'UPDATE users SET password_hash = ? WHERE id = ?',
          args: [newHash, dbUser.id]
        });
        try {
          await db.execute({
            sql: 'UPDATE taskflow_users SET password_hash = ? WHERE id = ?',
            args: [newHash, dbUser.id]
          });
        } catch(e) {}
      }
    }

    if (!passwordValid) {
      recordFailedLogin(ip, cleanUser);
      return res.status(401).json({ error: 'Hatalı şifre.' });
    }

    clearFailedLogin(ip);

    const userPayload = {
      id: dbUser.id,
      username: dbUser.username || cleanUser,
      full_name: dbUser.full_name || cleanUser,
      role: dbUser.role || 'User',
      email: dbUser.email || null,
      status: dbUser.status || 'ACTIVE',
      vt_user_id: dbUser.vt_user_id || null
    };

    const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, token, user: userPayload });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CURRENT USER VERIFICATION
app.get('/api/auth/me', authMiddleware, (req, res) => {
  res.json({ success: true, user: req.user });
});

// PASSWORD CHANGE (My Preferences)
app.post('/api/auth/change-password', authMiddleware, async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 3) {
      return res.status(400).json({ error: 'Şifre en az 3 karakter olmalıdır.' });
    }

    const userId = req.user.id;
    const hash = bcrypt.hashSync(newPassword.trim(), 10);

    await db.execute({
      sql: 'UPDATE users SET password_hash = ?, password = NULL WHERE id = ?',
      args: [hash, userId]
    });

    res.json({ success: true, message: 'Şifreniz başarıyla güncellendi.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// 9. GÜVENLİ VERİTABANI PROXY KÖPRÜSÜ (Client Direct Turso yerine)
// ============================================================
app.post('/api/query', authMiddleware, async (req, res) => {
  try {
    const { sql, args = [] } = req.body;
    if (!sql || typeof sql !== 'string') {
      return res.status(400).json({ error: 'SQL ifadesi zorunludur.' });
    }

    const cleanSql = sql.trim();
    const upper = cleanSql.toUpperCase();

    // 1. Kritik DDL Engelleme
    if (upper.startsWith('DROP ') || upper.startsWith('ALTER ') || upper.startsWith('TRUNCATE ')) {
      if (req.user?.role !== 'Admin') {
        await sendSecurityAlert('Yetkisiz DDL Komutu Engellendi', `Kullanıcı: ${req.user?.username}\nSorgu: ${cleanSql}`, 'CRITICAL');
        return res.status(403).json({ error: 'Veritabanı yapısal değişiklikleri için Admin yetkisi gereklidir.' });
      }
    }

    // 2. Toplu Kayıt Silme Tespiti & Alarmlar
    if (upper.startsWith('DELETE ') || upper.includes(' DELETE FROM ')) {
      if (!upper.includes(' WHERE ')) {
        await sendSecurityAlert('Filtresiz Toplu Kayıt Silme Uyarısı', `Kullanıcı: ${req.user?.username}\nSorgu: ${cleanSql}`, 'CRITICAL');
      }
    }

    // 3. Kullanıcı Tablosu Koruma (Yalnızca Admin veya kendi profilini güncelleyen kullanıcı)
    if ((upper.includes('UPDATE USERS') || upper.includes('DELETE FROM USERS') || upper.includes('INSERT INTO USERS')) && req.user?.role !== 'Admin') {
      const isSelfUpdate = upper.startsWith('UPDATE USERS SET') && (cleanSql.includes('avatar_url') || cleanSql.includes('full_name') || cleanSql.includes('email')) && args.includes(req.user?.id);
      if (!isSelfUpdate) {
        await sendSecurityAlert('Yetkisiz Kullanıcı Tablosu Müdahalesi', `Kullanıcı: ${req.user?.username} (Rol: ${req.user?.role})\nSorgu: ${cleanSql}`, 'WARNING');
        return res.status(403).json({ error: 'Kullanıcı tablosunu değiştirme yetkiniz yoktur.' });
      }
    }

    const result = await db.execute({ sql: cleanSql, args });

    // 10'dan fazla kayıt silindiyse güvenlik alarmı gönder
    if (upper.startsWith('DELETE ') && (result.rowsAffected || 0) > 10) {
      await sendSecurityAlert(
        'Toplu Kayıt Silindi (>10 Kayıt)',
        `Kullanıcı: ${req.user?.username}\nSilinen Kayıt Sayısı: ${result.rowsAffected}\nSorgu: ${cleanSql}`,
        'WARNING'
      );
    }

    res.json({
      success: true,
      rows: result.rows || [],
      rowsAffected: result.rowsAffected || 0
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// 10. KULLANICI YÖNETİMİ (Users API - Sanitized & RBAC)
// ============================================================

// ============================================================
// 10. VTIGER CRM USERS API (vt_users - Salt CRM Teknisyen / Atanan Kullanıcılar)
// ============================================================
app.get(['/api/vt-users', '/api/vt_users'], authMiddleware, async (req, res) => {
  try {
    const result = await db.execute('SELECT id, user_name, first_name, last_name, full_name, email, role_name, status FROM vt_users ORDER BY full_name ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post(['/api/vt-users', '/api/vt_users'], authMiddleware, async (req, res) => {
  try {
    const { id, user_name, first_name, last_name, full_name, email, role_name, status } = req.body;
    if (!id) return res.status(400).json({ error: 'VTiger user ID gereklidir.' });
    const fname = full_name || `${first_name || ''} ${last_name || ''}`.trim() || user_name;
    await db.execute({
      sql: `INSERT INTO vt_users (id, user_name, first_name, last_name, full_name, email, role_name, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              user_name=excluded.user_name,
              first_name=excluded.first_name,
              last_name=excluded.last_name,
              full_name=excluded.full_name,
              email=excluded.email,
              role_name=excluded.role_name,
              status=excluded.status`,
      args: [id, user_name || '', first_name || '', last_name || '', fname, email || '', role_name || 'Technician', status || 'Active']
    });
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// 10b. TASKFLOW PORTAL KULLANICILARI (taskflow_users & users Mirror)
// ============================================================

// GET USERS (taskflow_users ile sorgula, users ile geriye dönük uyumlu kal)
app.get(['/api/users', '/api/taskflow-users'], authMiddleware, async (req, res) => {
  try {
    let result = await db.execute('SELECT id, full_name, username, email, role, status, vt_user_id, avatar_url, created_at FROM taskflow_users ORDER BY full_name ASC');
    if (!result.rows || result.rows.length === 0) {
      result = await db.execute('SELECT id, full_name, username, email, role, status, NULL as vt_user_id, avatar_url, created_at FROM users ORDER BY full_name ASC');
    }
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE / UPDATE USER (Admin Only - taskflow_users & users senkron)
app.post(['/api/users', '/api/taskflow-users'], authMiddleware, requireRole(['Admin']), async (req, res) => {
  try {
    const { id, full_name, username, email, role, status, password, password_hash, vt_user_id } = req.body;
    const userId = id || ('U-' + Date.now());
    const uname = username || (full_name ? full_name.toLowerCase().replace(/\s+/g, '') : userId);

    let finalHash = password_hash || null;
    if (password && typeof password === 'string' && password.trim().length > 0) {
      finalHash = bcrypt.hashSync(password.trim(), 10);
    }

    // 1. TaskFlow Users tablosuna yaz
    await db.execute({
      sql: `INSERT INTO taskflow_users (id, full_name, username, email, role, status, password_hash, vt_user_id) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              full_name=excluded.full_name,
              username=excluded.username,
              email=excluded.email,
              role=excluded.role,
              status=excluded.status,
              vt_user_id=COALESCE(excluded.vt_user_id, taskflow_users.vt_user_id),
              password_hash=COALESCE(excluded.password_hash, taskflow_users.password_hash)`,
      args: [userId, full_name, uname, email || null, role || 'User', status || 'ACTIVE', finalHash, vt_user_id || null]
    });

    // 2. Legacy users tablosuna aynala
    try {
      await db.execute({
        sql: `INSERT INTO users (id, full_name, username, email, role, status, password, password_hash) 
              VALUES (?, ?, ?, ?, ?, ?, NULL, ?)
              ON CONFLICT(id) DO UPDATE SET
                full_name=excluded.full_name,
                username=excluded.username,
                email=excluded.email,
                role=excluded.role,
                status=excluded.status,
                password=NULL,
                password_hash=COALESCE(excluded.password_hash, users.password_hash)`,
        args: [userId, full_name, uname, email || null, role || 'User', status || 'ACTIVE', finalHash]
      });
    } catch (e) { /* ignore */ }

    res.json({ success: true, id: userId, username: uname });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE USER ROLE (Admin Only - taskflow_users & users senkron)
app.patch(['/api/users/:id/role', '/api/taskflow-users/:id/role'], authMiddleware, requireRole(['Admin']), async (req, res) => {
  try {
    const { role } = req.body;
    if (!role) return res.status(400).json({ error: 'Role parametresi zorunludur.' });
    await db.execute({
      sql: 'UPDATE taskflow_users SET role = ? WHERE id = ?',
      args: [role, req.params.id]
    });
    try {
      await db.execute({
        sql: 'UPDATE users SET role = ? WHERE id = ?',
        args: [role, req.params.id]
      });
    } catch (e) {}
    res.json({ success: true, role });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE USER (Admin Only)
app.delete(['/api/users/:id', '/api/taskflow-users/:id'], authMiddleware, requireRole(['Admin']), async (req, res) => {
  try {
    await db.execute({
      sql: 'DELETE FROM taskflow_users WHERE id = ?',
      args: [req.params.id]
    });
    try {
      await db.execute({
        sql: 'DELETE FROM users WHERE id = ?',
        args: [req.params.id]
      });
    } catch (e) {}
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// 11. SİSTEM LOGLARI
// ============================================================
app.get('/api/logs', authMiddleware, async (req, res) => {
  try {
    const result = await db.execute('SELECT * FROM system_logs ORDER BY timestamp DESC LIMIT 100');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/logs', authMiddleware, async (req, res) => {
  try {
    const { user_id, action, details, timestamp } = req.body;
    await db.execute({
      sql: 'INSERT INTO system_logs (user_id, action, details, timestamp) VALUES (?, ?, ?, ?)',
      args: [user_id || req.user?.username || 'System', action, details, timestamp || new Date().toISOString()]
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// 12. MÜŞTERİLER (Customers API)
// ============================================================
app.get('/api/customers', authMiddleware, async (req, res) => {
  try {
    const { q, limit, offset, search } = req.query;
    const searchTerm = (q || search || '').trim();

    if (searchTerm) {
      const term = `%${searchTerm}%`;
      const lim = parseInt(limit) || 100;
      const off = parseInt(offset) || 0;

      const countRes = await db.execute({
        sql: `SELECT COUNT(*) as total FROM vt_customers 
              WHERE organization_name LIKE ? OR primary_phone LIKE ? OR organization_number LIKE ? OR billing_postal_code LIKE ?`,
        args: [term, term, term, term]
      });
      const total = Number(countRes.rows[0]?.total || 0);

      const result = await db.execute({
        sql: `SELECT * FROM vt_customers 
              WHERE organization_name LIKE ? OR primary_phone LIKE ? OR organization_number LIKE ? OR billing_postal_code LIKE ?
              ORDER BY organization_name ASC LIMIT ? OFFSET ?`,
        args: [term, term, term, term, lim, off]
      });

      return res.json({ rows: result.rows, total, limit: lim, offset: off });
    }

    if (limit) {
      const lim = parseInt(limit);
      const off = parseInt(offset) || 0;
      const result = await db.execute({
        sql: `SELECT * FROM vt_customers ORDER BY organization_name ASC LIMIT ? OFFSET ?`,
        args: [lim, off]
      });
      return res.json(result.rows);
    }

    const result = await db.execute('SELECT * FROM vt_customers');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/customers', authMiddleware, async (req, res) => {
  try {
    const customers = Array.isArray(req.body) ? req.body : [req.body];
    const queries = customers.map(c => ({
      sql: `INSERT INTO vt_customers (
        id, organization_name, organization_number, industry, created_time, assigned_to, 
        modified_time, billing_address, billing_city, billing_postal_code, ownership, 
        primary_email, primary_phone, description
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET 
        organization_name=excluded.organization_name,
        organization_number=excluded.organization_number,
        industry=excluded.industry,
        modified_time=excluded.modified_time,
        billing_address=excluded.billing_address,
        billing_city=excluded.billing_city,
        billing_postal_code=excluded.billing_postal_code,
        ownership=excluded.ownership,
        primary_email=excluded.primary_email,
        primary_phone=excluded.primary_phone,
        description=excluded.description,
        assigned_to=excluded.assigned_to`,
      args: [
        c.id, c.organization_name, c.organization_number, c.industry, c.created_time, c.assigned_to,
        c.modified_time, c.billing_address, c.billing_city, c.billing_postal_code, c.ownership,
        c.primary_email, c.primary_phone, c.description
      ]
    }));

    await db.batch(queries);
    res.json({ success: true, count: customers.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// 13. FATURALAR (Invoices API)
// ============================================================
app.get('/api/invoices', authMiddleware, async (req, res) => {
  try {
    const result = await db.execute('SELECT * FROM invoices');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/invoices', authMiddleware, async (req, res) => {
  try {
    const items = Array.isArray(req.body) ? req.body : [req.body];
    const queries = items.map(c => ({
      sql: `INSERT INTO invoices (
        id, invoice_no, subject, account_id, invoicestatus, invoicedate, duedate, 
        hdnGrandTotal, balance, createdtime, modifiedtime, assigned_user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET 
        invoice_no=excluded.invoice_no,
        subject=excluded.subject,
        account_id=excluded.account_id,
        invoicestatus=excluded.invoicestatus,
        invoicedate=excluded.invoicedate,
        duedate=excluded.duedate,
        hdnGrandTotal=excluded.hdnGrandTotal,
        balance=excluded.balance,
        modifiedtime=excluded.modifiedtime,
        assigned_user_id=excluded.assigned_user_id`,
      args: [
        c.id, c.invoice_no, c.subject, c.account_id, c.invoicestatus, c.invoicedate, c.duedate,
        c.hdnGrandTotal, c.balance, c.createdtime, c.modifiedtime, c.assigned_user_id
      ]
    }));
    await db.batch(queries);
    res.json({ success: true, count: items.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// 14. RANDEVULAR / ETKİNLİKLER (Appointments API)
// ============================================================
app.get('/api/appointments', authMiddleware, async (req, res) => {
  try {
    const result = await db.execute('SELECT * FROM appointments');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/appointments', authMiddleware, async (req, res) => {
  try {
    const items = Array.isArray(req.body) ? req.body : [req.body];
    const queries = items.map(c => ({
      sql: `INSERT INTO appointments (
        id, subject, eventstatus, date_start, time_start, due_date, time_end,
        parent_id, assigned_user_id, description, createdtime, modifiedtime
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET 
        subject=excluded.subject,
        eventstatus=excluded.eventstatus,
        date_start=excluded.date_start,
        time_start=excluded.time_start,
        due_date=excluded.due_date,
        time_end=excluded.time_end,
        parent_id=excluded.parent_id,
        assigned_user_id=excluded.assigned_user_id,
        description=excluded.description,
        modifiedtime=excluded.modifiedtime`,
      args: [
        c.id, c.subject, c.eventstatus, c.date_start, c.time_start, c.due_date, c.time_end,
        c.parent_id, c.assigned_user_id, c.description, c.createdtime, c.modifiedtime
      ]
    }));
    await db.batch(queries);
    res.json({ success: true, count: items.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// 15. SERVİS KAYITLARI (Records API)
// ============================================================
app.get('/api/records', authMiddleware, async (req, res) => {
  try {
    const result = await db.execute('SELECT * FROM records ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/records', authMiddleware, async (req, res) => {
  try {
    const r = req.body;
    const id = r.id || ('REC-' + Date.now());
    await db.execute({
      sql: `INSERT INTO records (
        id, ticket_id, customer_id, customer_name, phone, postcode, address,
        category, service_type, sub_services, price, vat, total_price,
        payment_method, status, assigned_to, notes, description, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        customer_name=excluded.customer_name,
        phone=excluded.phone,
        postcode=excluded.postcode,
        address=excluded.address,
        category=excluded.category,
        service_type=excluded.service_type,
        sub_services=excluded.sub_services,
        price=excluded.price,
        vat=excluded.vat,
        total_price=excluded.total_price,
        payment_method=excluded.payment_method,
        status=excluded.status,
        assigned_to=excluded.assigned_to,
        notes=excluded.notes,
        description=excluded.description,
        updated_at=excluded.updated_at`,
      args: [
        id, r.ticket_id || id, r.customer_id || '', r.customer_name || '', r.phone || '', r.postcode || '', r.address || '',
        r.category || '', r.service_type || '', r.sub_services || '', r.price || 0, r.vat || 0, r.total_price || 0,
        r.payment_method || '', r.status || 'Open', r.assigned_to || '', r.notes || '', r.description || '',
        r.created_at || new Date().toISOString(), new Date().toISOString()
      ]
    });
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/records/:id', authMiddleware, async (req, res) => {
  try {
    await db.execute({
      sql: 'DELETE FROM records WHERE id = ?',
      args: [req.params.id]
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// 16. DESTEK BİLETLERİ (Tickets API)
// ============================================================
app.get('/api/tickets', authMiddleware, async (req, res) => {
  try {
    const { parent_id, customer_id } = req.query;
    const cid = parent_id || customer_id;
    let sql = 'SELECT * FROM vt_tickets ORDER BY createdtime DESC';
    let args = [];
    if (cid) {
      sql = 'SELECT * FROM vt_tickets WHERE parent_id = ? ORDER BY createdtime DESC';
      args = [cid];
    }
    const result = await db.execute({ sql, args });
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tickets', authMiddleware, async (req, res) => {
  try {
    const items = Array.isArray(req.body) ? req.body : [req.body];
    const queries = items.map(t => {
      const id = t.id || ('TCK-' + Date.now() + '-' + Math.floor(Math.random() * 1000));
      return {
        sql: `INSERT INTO vt_tickets (
          id, ticket_no, ticket_title, ticketstatus, ticketpriorities, ticketseverities,
          parent_id, customer_name, assigned_user_id, createdtime, modifiedtime, solution, description
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          ticket_no=excluded.ticket_no,
          ticket_title=excluded.ticket_title,
          ticketstatus=excluded.ticketstatus,
          ticketpriorities=excluded.ticketpriorities,
          ticketseverities=excluded.ticketseverities,
          parent_id=excluded.parent_id,
          customer_name=excluded.customer_name,
          assigned_user_id=excluded.assigned_user_id,
          createdtime=excluded.createdtime,
          modifiedtime=excluded.modifiedtime,
          solution=excluded.solution,
          description=excluded.description`,
        args: [
          id, t.ticket_no || id, t.ticket_title || t.title || t.subject || '',
          t.ticketstatus || t.status || 'Open', t.ticketpriorities || t.priority || 'Normal',
          t.ticketseverities || 'Minor', t.parent_id || t.customer_id || '',
          t.customer_name || '', t.assigned_user_id || t.assigned_to || '',
          t.createdtime || t.created_at || new Date().toISOString(),
          t.modifiedtime || t.updated_at || new Date().toISOString(),
          t.solution || '', t.description || ''
        ]
      };
    });
    await db.batch(queries);
    res.json({ success: true, count: items.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/tickets/:id', authMiddleware, async (req, res) => {
  try {
    await db.execute({ sql: 'DELETE FROM vt_tickets WHERE id = ?', args: [req.params.id] });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// 17. TEKLİFLER (Quotes API)
// ============================================================
app.get('/api/quotes', authMiddleware, async (req, res) => {
  try {
    const { account_id, customer_id } = req.query;
    const cid = account_id || customer_id;
    let sql = 'SELECT * FROM vt_quotes ORDER BY createdtime DESC';
    let args = [];
    if (cid) {
      sql = 'SELECT * FROM vt_quotes WHERE account_id = ? ORDER BY createdtime DESC';
      args = [cid];
    }
    const result = await db.execute({ sql, args });
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/quotes', authMiddleware, async (req, res) => {
  try {
    const items = Array.isArray(req.body) ? req.body : [req.body];
    const queries = items.map(q => {
      const id = q.id || ('QUO-' + Date.now() + '-' + Math.floor(Math.random() * 1000));
      return {
        sql: `INSERT INTO vt_quotes (
          id, quote_no, subject, quotestage, validtill, hdnGrandTotal,
          account_id, customer_name, assigned_user_id, createdtime, modifiedtime, details
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          quote_no=excluded.quote_no,
          subject=excluded.subject,
          quotestage=excluded.quotestage,
          validtill=excluded.validtill,
          hdnGrandTotal=excluded.hdnGrandTotal,
          account_id=excluded.account_id,
          customer_name=excluded.customer_name,
          assigned_user_id=excluded.assigned_user_id,
          createdtime=excluded.createdtime,
          modifiedtime=excluded.modifiedtime,
          details=excluded.details`,
        args: [
          id, q.quote_no || id, q.subject || '', q.quotestage || q.status || 'Draft',
          q.validtill || q.valid_until || '', q.hdnGrandTotal || q.total_amount || q.amount || 0,
          q.account_id || q.customer_id || '', q.customer_name || '',
          q.assigned_user_id || '', q.createdtime || q.created_at || new Date().toISOString(),
          q.modifiedtime || q.updated_at || new Date().toISOString(),
          typeof q.details === 'object' ? JSON.stringify(q.details) : (q.details || '')
        ]
      };
    });
    await db.batch(queries);
    res.json({ success: true, count: items.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/quotes/:id', authMiddleware, async (req, res) => {
  try {
    await db.execute({ sql: 'DELETE FROM vt_quotes WHERE id = ?', args: [req.params.id] });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// 18. HİZMETLER & AYARLAR (Services & Settings API)
// ============================================================
app.get('/api/services', authMiddleware, async (req, res) => {
  try {
    const result = await db.execute('SELECT * FROM services');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/settings', authMiddleware, async (req, res) => {
  try {
    const result = await db.execute('SELECT * FROM app_settings');
    const settings = {};
    result.rows.forEach(r => {
      try { settings[r.id] = JSON.parse(r.data); } catch(e) { settings[r.id] = r.data; }
    });
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/settings', authMiddleware, requireRole(['Admin']), async (req, res) => {
  try {
    const { id, data } = req.body;
    const strData = typeof data === 'string' ? data : JSON.stringify(data);
    await db.execute({
      sql: 'INSERT INTO app_settings (id, data, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(id) DO UPDATE SET data=excluded.data, updated_at=CURRENT_TIMESTAMP',
      args: [id, strData]
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// 19. DİNAMİK MODÜLLER (Products, Contacts, Contracts, Comments, Documents - Whitelisted)
// ============================================================
const ALLOWED_MODULES = ['products', 'contacts', 'contracts', 'comments', 'documents'];

const createGenericEndpoints = (moduleName) => {
  if (!ALLOWED_MODULES.includes(moduleName)) {
    throw new Error(`Güvenlik Uyarısı: Geçersiz modül '${moduleName}'`);
  }

  const tableName = 'vt_' + moduleName;
  app.get(`/api/${moduleName}`, authMiddleware, async (req, res) => {
    try {
      const result = await db.execute(`SELECT * FROM ${tableName}`);
      const data = result.rows.map(r => {
        try { return JSON.parse(r.data); } catch(e) { return {}; }
      });
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post(`/api/${moduleName}`, authMiddleware, async (req, res) => {
    try {
      const items = Array.isArray(req.body) ? req.body : [req.body];
      const queries = items.map(item => ({
        sql: `INSERT INTO ${tableName} (id, data, modifiedtime) VALUES (?, ?, ?) 
              ON CONFLICT(id) DO UPDATE SET data=excluded.data, modifiedtime=excluded.modifiedtime`,
        args: [item.id, JSON.stringify(item), item.modifiedtime || '']
      }));
      await db.batch(queries);
      res.json({ success: true, count: items.length });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
};

ALLOWED_MODULES.forEach(createGenericEndpoints);

// ============================================================
// 20. SYNC LOGS (Senkronizasyon Günlükleri)
// ============================================================
app.get('/api/sync-logs', authMiddleware, async (req, res) => {
  try {
    const result = await db.execute('SELECT * FROM sync_logs ORDER BY timestamp DESC LIMIT 100');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/sync-logs', authMiddleware, async (req, res) => {
  try {
    const logData = req.body;
    await db.execute({
      sql: 'INSERT INTO sync_logs (log_data, timestamp) VALUES (?, ?)',
      args: [JSON.stringify(logData), logData.timestamp || new Date().toISOString()]
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/sync-logs/clear', authMiddleware, async (req, res) => {
  try {
    await db.execute('DELETE FROM sync_logs');
    res.json({ success: true, message: 'Logs cleared' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// 21. TELEGRAM GÜN SONU RAPORLAMA (17:50 SCHEDULE)
// ============================================================
let lastReportSentDate = null;

// Status & Configuration Check
app.get('/api/telegram/status', authMiddleware, (req, res) => {
  res.json({
    configured: !!(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID),
    hasToken: !!process.env.TELEGRAM_BOT_TOKEN,
    hasChatId: !!process.env.TELEGRAM_CHAT_ID,
    scheduledTime: '17:50',
    lastSentDate: lastReportSentDate
  });
});

// Preview Report Text
app.get('/api/telegram/preview', authMiddleware, requireRole(['Admin']), async (req, res) => {
  try {
    const targetDate = req.query.date || getLocalDateString();
    const data = await fetchDailyData(targetDate);
    const message = buildReportMessage(data);
    res.json({ success: true, date: targetDate, message, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Manual Trigger / Send Now
app.post('/api/telegram/send-report', authMiddleware, requireRole(['Admin']), async (req, res) => {
  try {
    const targetDate = req.body?.date || req.query?.date || getLocalDateString();
    const dryRun = req.body?.dryRun === true;
    const result = await runReport({ date: targetDate, dryRun });
    if (result.success && !dryRun) {
      lastReportSentDate = targetDate;
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 17:50 Internal Background Scheduler
setInterval(async () => {
  try {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const today = getLocalDateString(now);

    // Saat 17:50 - 17:54 aralığında günde bir kez tetikle
    if (hours === 17 && minutes >= 50 && minutes < 55) {
      if (lastReportSentDate !== today) {
        console.log(`[SCHEDULE] Saat 17:50 - Gün sonu Telegram raporu tetikleniyor (${today})...`);
        const res = await runReport({ date: today });
        if (res.success) {
          lastReportSentDate = today;
          console.log(`[SCHEDULE] Gün sonu raporu saat 17:50 itibariyle başarıyla gönderildi.`);
        }
      }
    }
  } catch (err) {
    console.error('[SCHEDULE ERROR] 17:50 rapor gönderim hatası:', err.message);
  }
}, 30 * 1000); // 30 saniyede bir kontrol et

// ============================================================
// 22. GÜVENLİ STATİK DOSYA SUNUMU (Source Leak & Traversal Koruması)
// ============================================================
const ALLOWED_STATIC_FILES = new Set([
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/manifest.json',
  '/service-worker.js',
  '/ika.PNG',
  '/ika2.PNG'
]);

const ALLOWED_STATIC_DIRS = ['/js/', '/css/', '/antigravity/'];

app.use((req, res, next) => {
  // API rotalarını middleware zincirine bırak
  if (req.path.startsWith('/api/')) {
    return next();
  }

  // Yalnızca izin verilen istemci varlıklarını sun
  const isAllowedFile = ALLOWED_STATIC_FILES.has(req.path);
  const isAllowedDir = ALLOWED_STATIC_DIRS.some(dir => req.path.startsWith(dir));

  if (isAllowedFile || isAllowedDir) {
    return express.static(__dirname, { dotfiles: 'ignore' })(req, res, next);
  }

  // Sunucu dosyaları, araçlar, dokümanlar ve gizli dosyalar tamamen 404 ile korunur
  res.status(404).send('Not Found');
});

// GLOBAL ERROR HANDLER
app.use((err, req, res, next) => {
  console.error('[API ERROR]', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    path: req.path
  });
});

// START SERVER
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(` TaskFlow Secure API Server running on port ${PORT}`);
  console.log(` [SECURITY] JWT Auth & RBAC Middleware: ACTIVE`);
  console.log(` [SECURITY] Rate Limiting (180/min, login 10/min): ACTIVE`);
  console.log(` [SECURITY] Telegram Security Alerts: ACTIVE`);
  console.log(` [TELEGRAM] Daily 17:50 Report Scheduler: ACTIVE`);
  console.log(`=======================================================`);
});
