/**
 * SQLite 데이터베이스 레이어
 * - better-sqlite3 사용
 * - JSON 마이그레이션 지원
 * - 토큰 사용량 추적 테이블 포함
 */
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import type { Project, Agent, Activity } from "./types";

const DB_PATH = path.join(process.cwd(), "data", "mission-control.db");

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;

  _db = new Database(DB_PATH);
  _db.pragma("journal_mode = WAL");
  _db.pragma("foreign_keys = ON");

  initTables(_db);
  return _db;
}

function initTables(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      slug TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'planned',
      url TEXT,
      github TEXT,
      stack TEXT NOT NULL DEFAULT '[]',
      category TEXT NOT NULL DEFAULT '',
      phases TEXT NOT NULL DEFAULT '[]',
      todos TEXT NOT NULL DEFAULT '[]',
      notes TEXT,
      work_instruction TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS agents (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      emoji TEXT NOT NULL DEFAULT '',
      role TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      skills TEXT NOT NULL DEFAULT '[]',
      status TEXT NOT NULL DEFAULT 'active'
    );

    CREATE TABLE IF NOT EXISTS activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_slug TEXT NOT NULL,
      date TEXT NOT NULL,
      text TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (project_slug) REFERENCES projects(slug)
    );

    CREATE TABLE IF NOT EXISTS token_usage (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agent_id TEXT,
      project_slug TEXT,
      model TEXT NOT NULL DEFAULT 'unknown',
      input_tokens INTEGER NOT NULL DEFAULT 0,
      output_tokens INTEGER NOT NULL DEFAULT 0,
      cost_usd REAL NOT NULL DEFAULT 0,
      recorded_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      level TEXT NOT NULL DEFAULT 'info',
      source TEXT,
      message TEXT NOT NULL,
      sent_telegram INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS office_assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_slug TEXT NOT NULL,
      project_name TEXT NOT NULL,
      agent_id TEXT NOT NULL,
      status_group TEXT NOT NULL DEFAULT 'idle'
    );

    CREATE INDEX IF NOT EXISTS idx_activities_slug ON activities(project_slug);
    CREATE INDEX IF NOT EXISTS idx_activities_date ON activities(date DESC);
    CREATE INDEX IF NOT EXISTS idx_token_usage_date ON token_usage(recorded_at DESC);
    CREATE INDEX IF NOT EXISTS idx_alerts_created ON alerts(created_at DESC);
  `);
}

// ─── 마이그레이션: JSON → SQLite ───

export function migrateFromJson() {
  const db = getDb();
  const dataDir = path.join(process.cwd(), "data");

  // projects.json 마이그레이션
  const projectsPath = path.join(dataDir, "projects.json");
  if (fs.existsSync(projectsPath)) {
    const projects: Project[] = JSON.parse(fs.readFileSync(projectsPath, "utf-8"));

    const insertProject = db.prepare(`
      INSERT OR REPLACE INTO projects (slug, name, description, status, url, github, stack, category, phases, todos, notes, work_instruction)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertActivity = db.prepare(`
      INSERT INTO activities (project_slug, date, text, status)
      VALUES (?, ?, ?, ?)
    `);

    const migrateAll = db.transaction(() => {
      for (const p of projects) {
        insertProject.run(
          p.slug, p.name, p.description, p.status,
          p.url, p.github,
          JSON.stringify(p.stack), p.category,
          JSON.stringify(p.phases || []),
          JSON.stringify(p.todos || []),
          p.notes || null,
          p.workInstruction || null
        );

        if (p.activities) {
          for (const a of p.activities) {
            insertActivity.run(p.slug, a.date, a.text, a.status);
          }
        }
      }
    });
    migrateAll();
    console.log(`✅ ${projects.length}개 프로젝트 마이그레이션 완료`);
  }

  // agents.json 마이그레이션
  const agentsPath = path.join(dataDir, "agents.json");
  if (fs.existsSync(agentsPath)) {
    const agents: Agent[] = JSON.parse(fs.readFileSync(agentsPath, "utf-8"));

    const insertAgent = db.prepare(`
      INSERT OR REPLACE INTO agents (id, name, emoji, role, description, skills, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const migrateAgents = db.transaction(() => {
      for (const a of agents) {
        insertAgent.run(a.id, a.name, a.emoji, a.role, a.description, JSON.stringify(a.skills), a.status);
      }
    });
    migrateAgents();
    console.log(`✅ ${agents.length}개 에이전트 마이그레이션 완료`);
  }

  // office-assignments.json 마이그레이션
  const assignPath = path.join(dataDir, "office-assignments.json");
  if (fs.existsSync(assignPath)) {
    const data = JSON.parse(fs.readFileSync(assignPath, "utf-8"));

    const insertAssign = db.prepare(`
      INSERT INTO office_assignments (project_slug, project_name, agent_id, status_group)
      VALUES (?, ?, ?, ?)
    `);

    const migrateAssign = db.transaction(() => {
      db.exec("DELETE FROM office_assignments");
      for (const [statusGroup, projects] of Object.entries(data)) {
        for (const proj of projects as { slug: string; name: string; team: string[] }[]) {
          for (const agentId of proj.team) {
            insertAssign.run(proj.slug, proj.name, agentId, statusGroup);
          }
        }
      }
    });
    migrateAssign();
    console.log(`✅ 사무실 배치 마이그레이션 완료`);
  }
}

// ─── 프로젝트 CRUD ───

export function dbGetProjects(): Project[] {
  const db = getDb();
  const rows = db.prepare("SELECT * FROM projects ORDER BY updated_at DESC").all() as Record<string, unknown>[];

  return rows.map((row) => {
    const activities = db.prepare(
      "SELECT date, text, status FROM activities WHERE project_slug = ? ORDER BY date DESC"
    ).all(row.slug as string) as Activity[];

    return {
      name: row.name as string,
      slug: row.slug as string,
      description: row.description as string,
      status: row.status as Project["status"],
      url: row.url as string | null,
      github: row.github as string | null,
      stack: JSON.parse(row.stack as string),
      category: row.category as string,
      phases: JSON.parse(row.phases as string),
      todos: JSON.parse(row.todos as string),
      notes: row.notes as string | undefined,
      workInstruction: row.work_instruction as string | undefined,
      activities,
    };
  });
}

export function dbGetProjectBySlug(slug: string): Project | undefined {
  const db = getDb();
  const row = db.prepare("SELECT * FROM projects WHERE slug = ?").get(slug) as Record<string, unknown> | undefined;
  if (!row) return undefined;

  const activities = db.prepare(
    "SELECT date, text, status FROM activities WHERE project_slug = ? ORDER BY date DESC"
  ).all(slug) as Activity[];

  return {
    name: row.name as string,
    slug: row.slug as string,
    description: row.description as string,
    status: row.status as Project["status"],
    url: row.url as string | null,
    github: row.github as string | null,
    stack: JSON.parse(row.stack as string),
    category: row.category as string,
    phases: JSON.parse(row.phases as string),
    todos: JSON.parse(row.todos as string),
    notes: row.notes as string | undefined,
    workInstruction: row.work_instruction as string | undefined,
    activities,
  };
}

// ─── 에이전트 ───

export function dbGetAgents(): Agent[] {
  const db = getDb();
  const rows = db.prepare("SELECT * FROM agents").all() as Record<string, unknown>[];
  return rows.map((row) => ({
    id: row.id as string,
    name: row.name as string,
    emoji: row.emoji as string,
    role: row.role as string,
    description: row.description as string,
    skills: JSON.parse(row.skills as string),
    status: row.status as "active" | "inactive",
  }));
}

// ─── 토큰 사용량 ───

export interface TokenUsageRecord {
  id: number;
  agent_id: string | null;
  project_slug: string | null;
  model: string;
  input_tokens: number;
  output_tokens: number;
  cost_usd: number;
  recorded_at: string;
}

export function dbRecordTokenUsage(data: {
  agentId?: string;
  projectSlug?: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}) {
  const db = getDb();
  db.prepare(`
    INSERT INTO token_usage (agent_id, project_slug, model, input_tokens, output_tokens, cost_usd)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(data.agentId || null, data.projectSlug || null, data.model, data.inputTokens, data.outputTokens, data.costUsd);
}

export function dbGetTokenUsageSummary(days: number = 7) {
  const db = getDb();

  const daily = db.prepare(`
    SELECT
      date(recorded_at) as day,
      SUM(input_tokens) as total_input,
      SUM(output_tokens) as total_output,
      SUM(cost_usd) as total_cost,
      COUNT(*) as call_count
    FROM token_usage
    WHERE recorded_at >= datetime('now', ?)
    GROUP BY date(recorded_at)
    ORDER BY day DESC
  `).all(`-${days} days`) as {
    day: string; total_input: number; total_output: number; total_cost: number; call_count: number;
  }[];

  const byModel = db.prepare(`
    SELECT
      model,
      SUM(input_tokens) as total_input,
      SUM(output_tokens) as total_output,
      SUM(cost_usd) as total_cost,
      COUNT(*) as call_count
    FROM token_usage
    WHERE recorded_at >= datetime('now', ?)
    GROUP BY model
    ORDER BY total_cost DESC
  `).all(`-${days} days`) as {
    model: string; total_input: number; total_output: number; total_cost: number; call_count: number;
  }[];

  const byAgent = db.prepare(`
    SELECT
      agent_id,
      SUM(input_tokens) as total_input,
      SUM(output_tokens) as total_output,
      SUM(cost_usd) as total_cost,
      COUNT(*) as call_count
    FROM token_usage
    WHERE recorded_at >= datetime('now', ?) AND agent_id IS NOT NULL
    GROUP BY agent_id
    ORDER BY total_cost DESC
  `).all(`-${days} days`) as {
    agent_id: string; total_input: number; total_output: number; total_cost: number; call_count: number;
  }[];

  const totals = db.prepare(`
    SELECT
      SUM(input_tokens) as total_input,
      SUM(output_tokens) as total_output,
      SUM(cost_usd) as total_cost,
      COUNT(*) as call_count
    FROM token_usage
    WHERE recorded_at >= datetime('now', ?)
  `).get(`-${days} days`) as {
    total_input: number; total_output: number; total_cost: number; call_count: number;
  };

  return { daily, byModel, byAgent, totals };
}

// ─── 알림 로그 ───

export function dbRecordAlert(level: string, source: string, message: string, sentTelegram: boolean = false) {
  const db = getDb();
  db.prepare(`
    INSERT INTO alerts (level, source, message, sent_telegram)
    VALUES (?, ?, ?, ?)
  `).run(level, source, message, sentTelegram ? 1 : 0);
}

export function dbGetRecentAlerts(limit: number = 20) {
  const db = getDb();
  return db.prepare(`
    SELECT * FROM alerts ORDER BY created_at DESC LIMIT ?
  `).all(limit);
}
