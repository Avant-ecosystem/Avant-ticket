import * as SQLite from 'expo-sqlite';

const DB_NAME = 'scanner.db';

export const db = SQLite.openDatabaseSync(DB_NAME);

export function initDb() {
  db.execSync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS tickets (
      ticketId TEXT PRIMARY KEY,
      eventId TEXT NOT NULL,
      signature TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('unused','used'))
    );
    CREATE INDEX IF NOT EXISTS idx_tickets_event ON tickets(eventId);

    CREATE TABLE IF NOT EXISTS used_queue (
      ticketId TEXT PRIMARY KEY,
      eventId TEXT NOT NULL,
      usedAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS meta (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);
}

export function resetDb() {
  console.log('[DB] RESET DATABASE');

  db.execSync(`
    DROP TABLE IF EXISTS tickets;
    DROP TABLE IF EXISTS used_queue;
    DROP TABLE IF EXISTS meta;
  `);

  // Volver a crear las tablas
  initDb();
}

export function run<T = void>(sql: string, params: any[] = []): T[] {
  const stmt = db.prepareSync(sql);
  try {
    const res = stmt.executeSync(params);
    return res.getAllSync() as T[]; // ✅ forma correcta
  } finally {
    stmt.finalizeSync(); // ✅
  }
}

export function debugDb() {
  console.log('📦 DB DEBUG START');

  const tickets = run(`SELECT * FROM tickets`);
  console.log('🎟️ tickets:', tickets);

  const queue = run(`SELECT * FROM used_queue`);
  console.log('⏳ used_queue:', queue);

  const meta = run(`SELECT * FROM meta`);
  console.log('🧠 meta:', meta);

  console.log('📦 DB DEBUG END');
}

export function runExec(sql: string, params: any[] = []) {
  const stmt = db.prepareSync(sql);
  try {
    stmt.executeSync(params); // ✅ sin free
  } finally {
    stmt.finalizeSync(); // ✅
  }
}
