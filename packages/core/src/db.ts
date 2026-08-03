import { mkdirSync } from "node:fs";
import { defaultDataDir } from "./config.js";
import type { ChatMessage, ReminderTask, Session, TimerTask } from "./types.js";

type SqliteModule = typeof import("node:sqlite");
let sqliteModule: SqliteModule | undefined;

function loadSqlite(): SqliteModule {
  if (sqliteModule) return sqliteModule;
  const builtin = (process as { getBuiltinModule?: (id: string) => unknown }).getBuiltinModule;
  const mod = builtin ? (builtin("node:sqlite") as SqliteModule | undefined) : undefined;
  if (!mod) throw new Error("node:sqlite is required (Node.js 22.5+ / 24+)");
  sqliteModule = mod;
  return mod;
}

export class JunoStore {
  private db: import("node:sqlite").DatabaseSync;

  constructor(dataDir: string = defaultDataDir()) {
    mkdirSync(dataDir, { recursive: true });
    this.db = new (loadSqlite().DatabaseSync)(`${dataDir}/juno.db`);
    this.migrate();
  }

  private migrate(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        intent TEXT,
        result TEXT,
        ts TEXT NOT NULL,
        FOREIGN KEY (session_id) REFERENCES sessions(id)
      );
      CREATE TABLE IF NOT EXISTS timers (
        id TEXT PRIMARY KEY,
        label TEXT,
        duration_ms INTEGER NOT NULL,
        started_at TEXT NOT NULL,
        ends_at TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'running'
      );
      CREATE TABLE IF NOT EXISTS reminders (
        id TEXT PRIMARY KEY,
        label TEXT NOT NULL,
        run_at TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending'
      );
    `);
  }

  createSession(): Session {
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    this.db.prepare("INSERT INTO sessions (id, created_at) VALUES (?, ?)").run(id, createdAt);
    return { id, createdAt };
  }

  addMessage(sessionId: string, message: ChatMessage): void {
    this.db
      .prepare(
        "INSERT INTO messages (id, session_id, role, content, ts) VALUES (?, ?, ?, ?, ?)"
      )
      .run(message.id, sessionId, message.role, message.content, message.ts);
  }

  messages(sessionId: string): ChatMessage[] {
    interface Row {
      id: string;
      role: string;
      content: string;
      ts: string;
    }
    const rows = this.db
      .prepare("SELECT * FROM messages WHERE session_id = ? ORDER BY ts ASC")
      .all(sessionId) as unknown as Row[];
    return rows.map((r) => ({ id: r.id, role: r.role as ChatMessage["role"], content: r.content, ts: r.ts }));
  }

  saveTimer(timer: TimerTask): void {
    this.db
      .prepare(
        "INSERT OR REPLACE INTO timers (id, label, duration_ms, started_at, ends_at, status) VALUES (?, ?, ?, ?, ?, ?)"
      )
      .run(timer.id, timer.label ?? "", timer.durationMs, timer.startedAt, timer.endsAt, timer.status);
  }

  listRunningTimers(): TimerTask[] {
    interface Row {
      id: string;
      label: string;
      duration_ms: number;
      started_at: string;
      ends_at: string;
      status: string;
    }
    const rows = this.db
      .prepare("SELECT * FROM timers WHERE status = 'running'")
      .all() as unknown as Row[];
    return rows.map((r) => ({
      id: r.id,
      label: r.label,
      durationMs: r.duration_ms,
      startedAt: r.started_at,
      endsAt: r.ends_at,
      status: r.status as TimerTask["status"],
    }));
  }

  fireTimer(id: string): void {
    this.db.prepare("UPDATE timers SET status = 'fired' WHERE id = ?").run(id);
  }

  saveReminder(reminder: ReminderTask): void {
    this.db
      .prepare(
        "INSERT OR REPLACE INTO reminders (id, label, run_at, status) VALUES (?, ?, ?, ?)"
      )
      .run(reminder.id, reminder.label, reminder.runAt, reminder.status);
  }

  pendingReminders(): ReminderTask[] {
    interface Row {
      id: string;
      label: string;
      run_at: string;
      status: string;
    }
    const rows = this.db
      .prepare("SELECT * FROM reminders WHERE status = 'pending'")
      .all() as unknown as Row[];
    return rows.map((r) => ({
      id: r.id,
      label: r.label,
      runAt: r.run_at,
      status: r.status as ReminderTask["status"],
    }));
  }

  fireReminder(id: string): void {
    this.db.prepare("UPDATE reminders SET status = 'fired' WHERE id = ?").run(id);
  }

  close(): void {
    this.db.close();
  }
}

export function dbPath(dir: string = defaultDataDir()): string {
  return `${dir}/juno.db`;
}

let store: JunoStore | undefined;
export function getStore(dir?: string): JunoStore {
  if (!store) store = new JunoStore(dir);
  return store;
}