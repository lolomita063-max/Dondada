import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../data/chatbot.db');

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema();
  }
  return db;
}

function initSchema(): void {
  const database = db;

  database.exec(`
    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      visitor_name TEXT,
      visitor_email TEXT,
      visitor_company TEXT,
      pain_points TEXT,
      qualified INTEGER DEFAULT 0,
      intent TEXT,
      source TEXT DEFAULT 'widget',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'system')),
      content TEXT NOT NULL,
      metadata TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (conversation_id) REFERENCES conversations(id)
    );

    CREATE TABLE IF NOT EXISTS leads (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL,
      name TEXT,
      email TEXT,
      company TEXT,
      phone TEXT,
      pain_points TEXT,
      budget_range TEXT,
      timeline TEXT,
      qualified INTEGER DEFAULT 0,
      score INTEGER DEFAULT 0,
      status TEXT DEFAULT 'new' CHECK(status IN ('new', 'contacted', 'qualified', 'disqualified', 'booked')),
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (conversation_id) REFERENCES conversations(id)
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id TEXT PRIMARY KEY,
      lead_id TEXT NOT NULL,
      scheduled_at TEXT,
      duration_minutes INTEGER DEFAULT 30,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed', 'cancelled', 'completed')),
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (lead_id) REFERENCES leads(id)
    );

    CREATE TABLE IF NOT EXISTS analytics (
      id TEXT PRIMARY KEY,
      event_type TEXT NOT NULL,
      session_id TEXT,
      metadata TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_conversations_session ON conversations(session_id);
    CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
    CREATE INDEX IF NOT EXISTS idx_leads_conversation ON leads(conversation_id);
    CREATE INDEX IF NOT EXISTS idx_analytics_type ON analytics(event_type);
    CREATE INDEX IF NOT EXISTS idx_analytics_created ON analytics(created_at);
  `);
}

export function closeDb(): void {
  if (db) {
    db.close();
  }
}
