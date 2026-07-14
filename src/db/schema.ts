import type { Database } from "better-sqlite3";

const SCHEMA_VERSION = 2;

export function initSchema(db: Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS _meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS memories (
      id TEXT PRIMARY KEY,
      content TEXT NOT NULL,
      type TEXT NOT NULL,
      scope TEXT NOT NULL DEFAULT 'user',
      workspace TEXT,
      repo_path TEXT,
      session_id TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      access_count INTEGER NOT NULL DEFAULT 0,
      last_accessed INTEGER NOT NULL DEFAULT 0,
      confidence REAL NOT NULL DEFAULT 0.8,
      metadata TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_memories_type ON memories(type);
    CREATE INDEX IF NOT EXISTS idx_memories_scope ON memories(scope);
    CREATE INDEX IF NOT EXISTS idx_memories_repo ON memories(repo_path);
    CREATE INDEX IF NOT EXISTS idx_memories_workspace ON memories(workspace);
    CREATE INDEX IF NOT EXISTS idx_memories_created ON memories(created_at);
    CREATE INDEX IF NOT EXISTS idx_memories_confidence ON memories(confidence);

    CREATE VIRTUAL TABLE IF NOT EXISTS memory_fts USING fts5(
      memory_id UNINDEXED,
      content
    );

    CREATE TABLE IF NOT EXISTS embeddings (
      memory_id TEXT PRIMARY KEY,
      vector TEXT NOT NULL,
      FOREIGN KEY (memory_id) REFERENCES memories(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS entities (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      memory_ids TEXT NOT NULL,
      first_seen INTEGER NOT NULL,
      last_seen INTEGER NOT NULL
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_entities_name_type ON entities(name, type);
    CREATE INDEX IF NOT EXISTS idx_entities_type ON entities(type);

    CREATE TABLE IF NOT EXISTS relations (
      id TEXT PRIMARY KEY,
      source_id TEXT NOT NULL,
      target_id TEXT NOT NULL,
      relation TEXT NOT NULL,
      memory_id TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (memory_id) REFERENCES memories(id) ON DELETE CASCADE,
      FOREIGN KEY (source_id) REFERENCES entities(id) ON DELETE CASCADE,
      FOREIGN KEY (target_id) REFERENCES entities(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_relations_source ON relations(source_id);
    CREATE INDEX IF NOT EXISTS idx_relations_target ON relations(target_id);

    CREATE TABLE IF NOT EXISTS corrections (
      id TEXT PRIMARY KEY,
      memory_id TEXT,
      correction_text TEXT NOT NULL,
      context TEXT,
      applied INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (memory_id) REFERENCES memories(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_corrections_memory ON corrections(memory_id);

    CREATE TABLE IF NOT EXISTS tool_outcomes (
      id TEXT PRIMARY KEY,
      tool_name TEXT NOT NULL,
      args_hash TEXT,
      task_summary TEXT NOT NULL,
      success INTEGER NOT NULL,
      duration_ms INTEGER NOT NULL,
      tokens_used INTEGER,
      outcome_summary TEXT,
      context TEXT,
      workspace TEXT,
      repo_path TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_tool_outcomes_tool ON tool_outcomes(tool_name);
    CREATE INDEX IF NOT EXISTS idx_tool_outcomes_task ON tool_outcomes(task_summary);
    CREATE INDEX IF NOT EXISTS idx_tool_outcomes_created ON tool_outcomes(created_at);

    CREATE TABLE IF NOT EXISTS preferences (
      id TEXT PRIMARY KEY,
      key TEXT NOT NULL UNIQUE,
      value TEXT NOT NULL,
      source_memory_ids TEXT NOT NULL,
      confidence REAL NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_preferences_key ON preferences(key);
  `);
}

function setVersion(db: Database, version: number): void {
  db.prepare(`INSERT OR REPLACE INTO _meta (key, value) VALUES ('schema_version', ?)`).run(String(version));
}

function getVersion(db: Database): number {
  try {
    const row = db.prepare(`SELECT value FROM _meta WHERE key = 'schema_version'`).get() as { value: string } | undefined;
    return row ? parseInt(row.value, 10) || 0 : 0;
  } catch {
    return 0;
  }
}

export function migrateSchema(db: Database): void {
  // Ensure _meta exists before checking version
  db.exec(`CREATE TABLE IF NOT EXISTS _meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)`);

  const currentVersion = getVersion(db);

  if (currentVersion >= SCHEMA_VERSION) return;

  if (currentVersion === 0) {
    // v0 → v1: Initial schema (handled by initSchema)
    initSchema(db);
    setVersion(db, 1);
  }

  if (currentVersion < 2) {
    // v1 → v2: Ensure FTS5 table uses memory_id UNINDEXED, content format
    // Older schemas may have used content_rowid='id' or other formats
    try {
      // Check if memory_fts already exists with correct structure by attempting to insert
      const testRow = db.prepare(`SELECT COUNT(*) as cnt FROM memory_fts`).get() as { cnt: number } | undefined;
      if (testRow !== undefined) {
        // Verify the FTS5 schema has memory_id column
        const ftsInfo = db.prepare(`SELECT * FROM memory_fts LIMIT 0`).columns();
        const hasMemoryId = ftsInfo.some((c: { name?: string; columnName?: string }) =>
          (c.name || c.columnName) === 'memory_id'
        );
        if (!hasMemoryId) {
          db.exec(`DROP TABLE IF EXISTS memory_fts`);
          db.exec(`CREATE VIRTUAL TABLE memory_fts USING fts5(memory_id UNINDEXED, content)`);
        }
      }
    } catch {
      // If memory_fts doesn't exist, initSchema will create it
    }
    setVersion(db, 2);
  }
}
