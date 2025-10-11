const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

const DB_PATH = path.join(__dirname, 'data', 'mayasah.sqlite');

function openDb() {
  if (!fs.existsSync(path.dirname(DB_PATH))) fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const db = new sqlite3.Database(DB_PATH);
  return db;
}

function init() {
  const db = openDb();
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(`CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id TEXT,
        transaction_id TEXT,
        status TEXT,
        amount TEXT,
        payment_method TEXT,
        processed_at TEXT,
        raw JSON
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sessionId TEXT UNIQUE,
        order_id TEXT,
        amount TEXT,
        return_url TEXT,
        order_data JSON,
        created_at TEXT
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS consents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        payload JSON,
        received_at TEXT
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS email_errors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id TEXT,
        transaction_id TEXT,
        error TEXT,
        created_at TEXT
      )`);

      resolve(true);
    });
  }).finally(() => db.close());
}

function migrateFromFiles(filesDir) {
  const db = openDb();
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      try {
        const paymentsFile = path.join(filesDir, 'payments.json');
        if (fs.existsSync(paymentsFile)) {
          const payments = JSON.parse(fs.readFileSync(paymentsFile, 'utf8') || '[]');
          const stmt = db.prepare(`INSERT OR REPLACE INTO payments(order_id, transaction_id, status, amount, payment_method, processed_at, raw) VALUES(?,?,?,?,?,?,?)`);
          payments.forEach(p => stmt.run(p.order_id, p.transaction_id, p.status, p.amount, p.payment_method, p.processed_at || null, JSON.stringify(p)));
          stmt.finalize();
        }

        const sessionsFile = path.join(filesDir, 'sessions.json');
        if (fs.existsSync(sessionsFile)) {
          const sessions = JSON.parse(fs.readFileSync(sessionsFile, 'utf8') || '[]');
          const stmt2 = db.prepare(`INSERT OR REPLACE INTO sessions(sessionId, order_id, amount, return_url, order_data, created_at) VALUES(?,?,?,?,?,?)`);
          sessions.forEach(s => stmt2.run(s.sessionId, s.order_id, s.amount, s.return_url || null, JSON.stringify(s.order_data || null), s.created_at || null));
          stmt2.finalize();
        }

        const consentsFile = path.join(filesDir, 'consents.json');
        if (fs.existsSync(consentsFile)) {
          const consents = JSON.parse(fs.readFileSync(consentsFile, 'utf8') || '[]');
          const stmt3 = db.prepare(`INSERT INTO consents(payload, received_at) VALUES(?,?)`);
          consents.forEach(c => stmt3.run(JSON.stringify(c), c.received_at || new Date().toISOString()));
          stmt3.finalize();
        }

        resolve(true);
      } catch (err) { reject(err); }
    });
  }).finally(() => db.close());
}

function getFailedPayments(limit = 100) {
  const db = openDb();
  return new Promise((resolve, reject) => {
    db.all(`SELECT rowid as id, order_id, transaction_id, status, amount, payment_method, processed_at, raw FROM payments WHERE LOWER(status) = 'email_failed' ORDER BY processed_at DESC LIMIT ?`, [limit], (err, rows) => {
      db.close();
      if (err) return reject(err);
      resolve(rows || []);
    });
  });
}

function insertPayment(p) {
  const db = openDb();
  return new Promise((resolve, reject) => {
    db.run(`INSERT INTO payments(order_id, transaction_id, status, amount, payment_method, processed_at, raw) VALUES(?,?,?,?,?,?,?)`, [p.order_id, p.transaction_id, p.status, p.amount, p.payment_method, p.processed_at || new Date().toISOString(), JSON.stringify(p)], function(err) {
      db.close();
      if (err) return reject(err);
      resolve({ lastID: this.lastID });
    });
  });
}

function upsertSession(sess) {
  const db = openDb();
  return new Promise((resolve, reject) => {
    db.run(`INSERT INTO sessions(sessionId, order_id, amount, return_url, order_data, created_at) VALUES(?,?,?,?,?,?) ON CONFLICT(sessionId) DO UPDATE SET order_id=excluded.order_id, amount=excluded.amount, return_url=excluded.return_url, order_data=excluded.order_data`, [sess.sessionId, sess.order_id, sess.amount, sess.return_url || null, JSON.stringify(sess.order_data || null), sess.created_at || new Date().toISOString()], function(err) {
      db.close();
      if (err) return reject(err);
      resolve({ changes: this.changes });
    });
  });
}

function getSessionById(sessionId) {
  const db = openDb();
  return new Promise((resolve, reject) => {
    db.get(`SELECT sessionId, order_id, amount, return_url, order_data, created_at FROM sessions WHERE sessionId = ?`, [sessionId], (err, row) => {
      db.close();
      if (err) return reject(err);
      if (!row) return resolve(null);
      try { row.order_data = row.order_data ? JSON.parse(row.order_data) : null; } catch (e) { row.order_data = null; }
      resolve(row);
    });
  });
}

module.exports = { init, migrateFromFiles, getFailedPayments, insertPayment, upsertSession, getSessionById, DB_PATH };
