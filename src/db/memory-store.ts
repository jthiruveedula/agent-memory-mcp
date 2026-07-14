import Database from "better-sqlite3";
import { mkdirSync } from "fs";
import { dirname } from "path";
import { randomUUID } from "crypto";
import { config } from "../config.js";
import { initSchema, migrateSchema } from "./schema.js";
import { cosineSimilarity, generateEmbedding } from "./embeddings.js";
import type {
  Correction,
  Entity,
  KnowledgeGraphArgs,
  Memory,
  MemoryScope,
  MemoryType,
  Preference,
  RecallArgs,
  RecallResult,
  Relation,
  ToolOutcome,
} from "../types.js";

export class MemoryStore {
  private db: Database.Database;

  constructor() {
    mkdirSync(dirname(config.dbPath), { recursive: true });
    this.db = new Database(config.dbPath);
    this.db.pragma("journal_mode = WAL");
    this.db.pragma("foreign_keys = ON");
    initSchema(this.db);
    migrateSchema(this.db);
  }

  close(): void {
    this.db.close();
  }

  private now(): number {
    return Date.now();
  }

  createMemory(memory: Omit<Memory, "id" | "created_at" | "updated_at" | "access_count" | "last_accessed">): Memory {
    const id = randomUUID();
    const now = this.now();
    const row: Memory = {
      ...memory,
      id,
      created_at: now,
      updated_at: now,
      access_count: 0,
      last_accessed: now,
    };

    const params = {
      id: row.id,
      content: row.content,
      type: row.type,
      scope: row.scope,
      workspace: row.workspace ?? null,
      repo_path: row.repo_path ?? null,
      session_id: row.session_id ?? null,
      created_at: row.created_at,
      updated_at: row.updated_at,
      access_count: row.access_count,
      last_accessed: row.last_accessed,
      confidence: row.confidence,
      metadata: row.metadata ? JSON.stringify(row.metadata) : null,
    };
    this.db
      .prepare(
        `INSERT INTO memories (id, content, type, scope, workspace, repo_path, session_id, created_at, updated_at, access_count, last_accessed, confidence, metadata)
         VALUES (@id, @content, @type, @scope, @workspace, @repo_path, @session_id, @created_at, @updated_at, @access_count, @last_accessed, @confidence, @metadata)`
      )
      .run(params);

    this.db
      .prepare(`INSERT INTO memory_fts (memory_id, content) VALUES (?, ?)`)
      .run(row.id, row.content);

    return row;
  }

  async createMemoryWithEmbedding(
    memory: Omit<Memory, "id" | "created_at" | "updated_at" | "access_count" | "last_accessed">
  ): Promise<Memory> {
    const row = this.createMemory(memory);
    const vector = await generateEmbedding(memory.content);
    this.storeEmbedding(row.id, vector);
    return row;
  }

  storeEmbedding(memoryId: string, vector: number[]): void {
    this.db
      .prepare(
        `INSERT OR REPLACE INTO embeddings (memory_id, vector) VALUES (?, ?)`
      )
      .run(memoryId, JSON.stringify(vector));
  }

  getEmbedding(memoryId: string): number[] | null {
    const row = this.db
      .prepare(`SELECT vector FROM embeddings WHERE memory_id = ?`)
      .get(memoryId) as { vector: string } | undefined;
    return row ? (JSON.parse(row.vector) as number[]) : null;
  }

  getMemoryById(id: string): Memory | null {
    const row = this.db.prepare(`SELECT * FROM memories WHERE id = ?`).get(id) as
      | Record<string, unknown>
      | undefined;
    return row ? this.rowToMemory(row) : null;
  }

  updateMemoryAccess(id: string): void {
    this.db
      .prepare(
        `UPDATE memories SET access_count = access_count + 1, last_accessed = ? WHERE id = ?`
      )
      .run(this.now(), id);
  }

  updateConfidence(id: string, delta: number): void {
    this.db
      .prepare(
        `UPDATE memories SET confidence = MAX(0, MIN(1, confidence + ?)), updated_at = ? WHERE id = ?`
      )
      .run(delta, this.now(), id);
  }

  updateMemoryContent(id: string, newContent: string, newConfidence?: number): void {
    this.db
      .prepare(
        `UPDATE memories SET content = ?, updated_at = ?, confidence = COALESCE(?, confidence) WHERE id = ?`
      )
      .run(newContent, this.now(), newConfidence ?? null, id);
    this.db.prepare(`UPDATE memory_fts SET content = ? WHERE memory_id = ?`).run(newContent, id);
  }

  deleteMemory(id: string): void {
    this.db.prepare(`DELETE FROM memory_fts WHERE memory_id = ?`).run(id);
    this.db.prepare(`DELETE FROM memories WHERE id = ?`).run(id);
  }

  private ftsSafeQuery(query: string): string {
    // Escape FTS5 special characters and wrap each term in double quotes
    return query
      .replace(/[^a-zA-Z0-9\s-]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length > 1)
      .map((t) => `"${t}"`)
      .join(" ");
  }

  async recall(args: RecallArgs): Promise<RecallResult[]> {
    const { query, type, scope, repo_path, limit, min_confidence } = args;
    const queryEmbedding = await generateEmbedding(query);
    const safeQuery = this.ftsSafeQuery(query);

    const ftsRows = safeQuery
      ? (this.db
          .prepare(
            `SELECT m.id, m.content, m.type, m.scope, m.workspace, m.repo_path, m.session_id,
                    m.created_at, m.updated_at, m.access_count, m.last_accessed, m.confidence, m.metadata
             FROM memories m
             JOIN memory_fts fts ON m.id = fts.memory_id
             WHERE fts.content MATCH ?
               AND m.confidence >= ?
               ${type ? "AND m.type = ?" : ""}
               ${scope ? "AND m.scope = ?" : ""}
               ${repo_path ? "AND m.repo_path = ?" : ""}
             ORDER BY rank
             LIMIT ?`
          )
          .all(
            safeQuery,
            min_confidence,
            ...(type ? [type] : []),
            ...(scope ? [scope] : []),
            ...(repo_path ? [repo_path] : []),
            limit * 3
          ) as Record<string, unknown>[])
      : [];

    const allRows = this.db
      .prepare(
        `SELECT id, content, type, scope, workspace, repo_path, session_id,
                created_at, updated_at, access_count, last_accessed, confidence, metadata
         FROM memories
         WHERE confidence >= ?
           ${type ? "AND type = ?" : ""}
           ${scope ? "AND scope = ?" : ""}
           ${repo_path ? "AND repo_path = ?" : ""}
         ORDER BY created_at DESC
         LIMIT 1000`
      )
      .all(
        min_confidence,
        ...(type ? [type] : []),
        ...(scope ? [scope] : []),
        ...(repo_path ? [repo_path] : [])
      ) as Record<string, unknown>[];

    const ftsIds = new Set(ftsRows.map((r) => r.id as string));
    const candidateRows = [
      ...ftsRows,
      ...allRows.filter((r) => !ftsIds.has(r.id as string)),
    ].slice(0, 200);

    const results: RecallResult[] = [];
    for (const row of candidateRows) {
      const memory = this.rowToMemory(row);
      const emb = this.getEmbedding(memory.id);
      let score = 0;
      if (emb) {
        score = cosineSimilarity(queryEmbedding, emb);
      }
      if (ftsIds.has(memory.id)) {
        score = Math.max(score, 0.3);
      }
      score *= memory.confidence;
      if (score > 0.05) {
        results.push({ memory, score });
      }
    }

    results.sort((a, b) => b.score - a.score);
    const top = results.slice(0, limit);
    for (const r of top) {
      this.updateMemoryAccess(r.memory.id);
    }
    return top;
  }

  getRecentMemories(limit = 20, scope?: MemoryScope, repo_path?: string): Memory[] {
    const rows = this.db
      .prepare(
        `SELECT * FROM memories
         WHERE 1=1
           ${scope ? "AND scope = ?" : ""}
           ${repo_path ? "AND repo_path = ?" : ""}
         ORDER BY last_accessed DESC
         LIMIT ?`
      )
      .all(...(scope ? [scope] : []), ...(repo_path ? [repo_path] : []), limit) as Record<string, unknown>[];
    return rows.map((r) => this.rowToMemory(r));
  }

  getMemoriesByType(type: MemoryType, limit = 100, scope?: MemoryScope): Memory[] {
    const rows = this.db
      .prepare(
        `SELECT * FROM memories
         WHERE type = ?
           ${scope ? "AND scope = ?" : ""}
         ORDER BY created_at DESC
         LIMIT ?`
      )
      .all(type, ...(scope ? [scope] : []), limit) as Record<string, unknown>[];
    return rows.map((r) => this.rowToMemory(r));
  }

  createEntity(entity: Omit<Entity, "id" | "first_seen" | "last_seen">): Entity {
    const now = this.now();
    const existing = this.db
      .prepare(`SELECT * FROM entities WHERE name = ? AND type = ?`)
      .get(entity.name, entity.type) as Record<string, unknown> | undefined;

    if (existing) {
      const mergedMemoryIds = Array.from(
        new Set([...(JSON.parse(existing.memory_ids as string) as string[]), ...entity.memory_ids])
      );
      this.db
        .prepare(`UPDATE entities SET memory_ids = ?, last_seen = ? WHERE id = ?`)
        .run(JSON.stringify(mergedMemoryIds), now, existing.id as string);
      return this.rowToEntity({ ...existing, memory_ids: JSON.stringify(mergedMemoryIds), last_seen: now });
    }

    const id = randomUUID();
    const row: Entity = {
      ...entity,
      id,
      first_seen: now,
      last_seen: now,
    };
    this.db
      .prepare(`INSERT INTO entities (id, name, type, memory_ids, first_seen, last_seen) VALUES (?, ?, ?, ?, ?, ?)`)
      .run(row.id, row.name, row.type, JSON.stringify(row.memory_ids), row.first_seen, row.last_seen);
    return row;
  }

  getEntityByName(name: string, type?: string): Entity | null {
    const row = type
      ? (this.db.prepare(`SELECT * FROM entities WHERE name = ? AND type = ?`).get(name, type) as
          | Record<string, unknown>
          | undefined)
      : (this.db.prepare(`SELECT * FROM entities WHERE name = ?`).get(name) as Record<string, unknown> | undefined);
    return row ? this.rowToEntity(row) : null;
  }

  createRelation(relation: Omit<Relation, "id" | "created_at">): Relation {
    const id = randomUUID();
    const now = this.now();
    const row: Relation = { ...relation, id, created_at: now };
    this.db
      .prepare(`INSERT INTO relations (id, source_id, target_id, relation, memory_id, created_at) VALUES (?, ?, ?, ?, ?, ?)`)
      .run(row.id, row.source_id, row.target_id, row.relation, row.memory_id, row.created_at);
    return row;
  }

  getRelationsForEntity(entityId: string): Relation[] {
    const rows = this.db
      .prepare(`SELECT * FROM relations WHERE source_id = ? OR target_id = ?`)
      .all(entityId, entityId) as Record<string, unknown>[];
    return rows.map((r) => this.rowToRelation(r));
  }

  getGraph(args: KnowledgeGraphArgs): { entities: Entity[]; relations: Relation[]; memories: Memory[] } {
    const { query, depth, limit } = args;
    const queryLower = query.toLowerCase();
    const matchedEntities = this.db
      .prepare(`SELECT * FROM entities WHERE LOWER(name) LIKE ? LIMIT ?`)
      .all(`%${queryLower}%`, limit) as Record<string, unknown>[];

    const entityIds = new Set<string>();
    const relations: Relation[] = [];
    const frontier: string[] = [];

    for (const row of matchedEntities) {
      const e = this.rowToEntity(row);
      entityIds.add(e.id);
      frontier.push(e.id);
    }

    for (let d = 0; d < depth && frontier.length > 0; d++) {
      const nextFrontier: string[] = [];
      for (const id of frontier) {
        const rels = this.getRelationsForEntity(id);
        for (const r of rels) {
          relations.push(r);
          if (!entityIds.has(r.source_id)) {
            entityIds.add(r.source_id);
            nextFrontier.push(r.source_id);
          }
          if (!entityIds.has(r.target_id)) {
            entityIds.add(r.target_id);
            nextFrontier.push(r.target_id);
          }
        }
      }
      frontier.length = 0;
      frontier.push(...nextFrontier.slice(0, limit));
    }

    const entities: Entity[] = [];
    for (const id of entityIds) {
      const row = this.db.prepare(`SELECT * FROM entities WHERE id = ?`).get(id) as Record<string, unknown> | undefined;
      if (row) entities.push(this.rowToEntity(row));
    }

    const memoryIds = new Set<string>();
    for (const r of relations) memoryIds.add(r.memory_id);
    for (const e of entities) {
      for (const mid of e.memory_ids) memoryIds.add(mid);
    }

    const memories: Memory[] = [];
    for (const mid of memoryIds) {
      const m = this.getMemoryById(mid);
      if (m) memories.push(m);
    }

    return { entities, relations, memories };
  }

  createCorrection(correction: Omit<Correction, "id" | "created_at">): Correction {
    const id = randomUUID();
    const now = this.now();
    const row: Correction = { ...correction, id, created_at: now };
    this.db
      .prepare(`INSERT INTO corrections (id, memory_id, correction_text, context, applied, created_at) VALUES (?, ?, ?, ?, ?, ?)`)
      .run(row.id, row.memory_id ?? null, row.correction_text, row.context ?? null, row.applied ? 1 : 0, row.created_at);
    if (row.memory_id) {
      this.updateConfidence(row.memory_id, -config.reflection.correctionConfidencePenalty);
    }
    return row;
  }

  getCorrectionsForMemory(memoryId: string): Correction[] {
    const rows = this.db
      .prepare(`SELECT * FROM corrections WHERE memory_id = ? ORDER BY created_at DESC`)
      .all(memoryId) as Record<string, unknown>[];
    return rows.map((r) => this.rowToCorrection(r));
  }

  getRecentCorrections(since?: number): Correction[] {
    const rows = since
      ? (this.db.prepare(`SELECT * FROM corrections WHERE created_at >= ?`).all(since) as Record<string, unknown>[])
      : (this.db.prepare(`SELECT * FROM corrections`).all() as Record<string, unknown>[]);
    return rows.map((r) => this.rowToCorrection(r));
  }

  createToolOutcome(outcome: Omit<ToolOutcome, "id" | "created_at">): ToolOutcome {
    const id = randomUUID();
    const now = this.now();
    const row: ToolOutcome = { ...outcome, id, created_at: now };
    this.db
      .prepare(
        `INSERT INTO tool_outcomes (id, tool_name, args_hash, task_summary, success, duration_ms, tokens_used, outcome_summary, context, workspace, repo_path, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        row.id,
        row.tool_name,
        row.args_hash ?? null,
        row.task_summary,
        row.success ? 1 : 0,
        row.duration_ms,
        row.tokens_used ?? null,
        row.outcome_summary ?? null,
        row.context ?? null,
        row.workspace ?? null,
        row.repo_path ?? null,
        row.created_at
      );
    return row;
  }

  getToolOutcomes(toolName?: string, since?: number): ToolOutcome[] {
    const rows = toolName
      ? (this.db
          .prepare(`SELECT * FROM tool_outcomes WHERE tool_name = ? ${since ? "AND created_at >= ?" : ""} ORDER BY created_at DESC`)
          .all(toolName, ...(since ? [since] : [])) as Record<string, unknown>[])
      : (this.db
          .prepare(`SELECT * FROM tool_outcomes ${since ? "WHERE created_at >= ?" : ""} ORDER BY created_at DESC`)
          .all(...(since ? [since] : [])) as Record<string, unknown>[]);
    return rows.map((r) => this.rowToToolOutcome(r));
  }

  getToolStats(toolName: string): { success_rate: number; avg_duration_ms: number; avg_tokens?: number; count: number } {
    const row = this.db
      .prepare(
        `SELECT
           COUNT(*) as count,
           SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successes,
           AVG(duration_ms) as avg_duration_ms,
           AVG(tokens_used) as avg_tokens
         FROM tool_outcomes
         WHERE tool_name = ?`
      )
      .get(toolName) as Record<string, unknown> | undefined;
    if (!row || row.count === 0) {
      return { success_rate: 0, avg_duration_ms: 0, count: 0 };
    }
    return {
      count: row.count as number,
      success_rate: (row.successes as number) / (row.count as number),
      avg_duration_ms: (row.avg_duration_ms as number) ?? 0,
      avg_tokens: row.avg_tokens ? (row.avg_tokens as number) : undefined,
    };
  }

  upsertPreference(pref: Omit<Preference, "id" | "created_at" | "updated_at">): Preference {
    const now = this.now();
    const existing = this.db.prepare(`SELECT * FROM preferences WHERE key = ?`).get(pref.key) as
      | Record<string, unknown>
      | undefined;

    if (existing) {
      this.db
        .prepare(
          `UPDATE preferences SET value = ?, source_memory_ids = ?, confidence = ?, updated_at = ? WHERE key = ?`
        )
        .run(
          pref.value,
          JSON.stringify(pref.source_memory_ids),
          pref.confidence,
          now,
          pref.key
        );
      return {
        id: existing.id as string,
        key: pref.key,
        value: pref.value,
        source_memory_ids: pref.source_memory_ids,
        confidence: pref.confidence,
        created_at: existing.created_at as number,
        updated_at: now,
      };
    }

    const id = randomUUID();
    this.db
      .prepare(
        `INSERT INTO preferences (id, key, value, source_memory_ids, confidence, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(id, pref.key, pref.value, JSON.stringify(pref.source_memory_ids), pref.confidence, now, now);
    return { id, ...pref, created_at: now, updated_at: now };
  }

  getPreferences(prefix?: string, key?: string, minConfidence = 0, limit = 50): Preference[] {
    let sql = `SELECT * FROM preferences WHERE confidence >= ?`;
    const params: (string | number)[] = [minConfidence];
    if (key) {
      sql += ` AND key = ?`;
      params.push(key);
    } else if (prefix) {
      sql += ` AND key LIKE ?`;
      params.push(`${prefix}%`);
    }
    sql += ` ORDER BY confidence DESC, updated_at DESC LIMIT ?`;
    params.push(limit);
    const rows = this.db.prepare(sql).all(...params) as Record<string, unknown>[];
    return rows.map((r) => this.rowToPreference(r));
  }

  getMemoriesForReflection(since?: number, workspace?: string, repo_path?: string): Memory[] {
    let sql = `SELECT * FROM memories WHERE 1=1`;
    const params: (string | number)[] = [];
    if (since) {
      sql += ` AND created_at >= ?`;
      params.push(since);
    }
    if (workspace) {
      sql += ` AND workspace = ?`;
      params.push(workspace);
    }
    if (repo_path) {
      sql += ` AND repo_path = ?`;
      params.push(repo_path);
    }
    sql += ` ORDER BY created_at DESC`;
    const rows = this.db.prepare(sql).all(...params) as Record<string, unknown>[];
    return rows.map((r) => this.rowToMemory(r));
  }

  countEntities(): number {
    const row = this.db.prepare(`SELECT COUNT(*) as c FROM entities`).get() as { c: number } | undefined;
    return row?.c ?? 0;
  }

  countRelations(): number {
    const row = this.db.prepare(`SELECT COUNT(*) as c FROM relations`).get() as { c: number } | undefined;
    return row?.c ?? 0;
  }

  mergeMemories(targetId: string, sourceId: string): void {
    const target = this.getMemoryById(targetId);
    const source = this.getMemoryById(sourceId);
    if (!target || !source) return;

    const newContent = `${target.content}\n\n[merged] ${source.content}`;
    this.updateMemoryContent(targetId, newContent, Math.max(target.confidence, source.confidence));
    this.deleteMemory(sourceId);
  }

  private rowToMemory(row: Record<string, unknown>): Memory {
    return {
      id: row.id as string,
      content: row.content as string,
      type: row.type as MemoryType,
      scope: row.scope as MemoryScope,
      workspace: (row.workspace as string) ?? undefined,
      repo_path: (row.repo_path as string) ?? undefined,
      session_id: (row.session_id as string) ?? undefined,
      created_at: row.created_at as number,
      updated_at: row.updated_at as number,
      access_count: row.access_count as number,
      last_accessed: row.last_accessed as number,
      confidence: row.confidence as number,
      metadata: row.metadata ? (JSON.parse(row.metadata as string) as Record<string, unknown>) : undefined,
    };
  }

  private rowToEntity(row: Record<string, unknown>): Entity {
    return {
      id: row.id as string,
      name: row.name as string,
      type: row.type as string,
      memory_ids: JSON.parse(row.memory_ids as string) as string[],
      first_seen: row.first_seen as number,
      last_seen: row.last_seen as number,
    };
  }

  private rowToRelation(row: Record<string, unknown>): Relation {
    return {
      id: row.id as string,
      source_id: row.source_id as string,
      target_id: row.target_id as string,
      relation: row.relation as string,
      memory_id: row.memory_id as string,
      created_at: row.created_at as number,
    };
  }

  private rowToCorrection(row: Record<string, unknown>): Correction {
    return {
      id: row.id as string,
      memory_id: (row.memory_id as string) ?? undefined,
      correction_text: row.correction_text as string,
      context: (row.context as string) ?? undefined,
      applied: Boolean(row.applied),
      created_at: row.created_at as number,
    };
  }

  private rowToToolOutcome(row: Record<string, unknown>): ToolOutcome {
    return {
      id: row.id as string,
      tool_name: row.tool_name as string,
      args_hash: (row.args_hash as string) ?? undefined,
      task_summary: row.task_summary as string,
      success: Boolean(row.success),
      duration_ms: row.duration_ms as number,
      tokens_used: (row.tokens_used as number) ?? undefined,
      outcome_summary: (row.outcome_summary as string) ?? undefined,
      context: (row.context as string) ?? undefined,
      workspace: (row.workspace as string) ?? undefined,
      repo_path: (row.repo_path as string) ?? undefined,
      created_at: row.created_at as number,
    };
  }

  private rowToPreference(row: Record<string, unknown>): Preference {
    return {
      id: row.id as string,
      key: row.key as string,
      value: row.value as string,
      source_memory_ids: JSON.parse(row.source_memory_ids as string) as string[],
      confidence: row.confidence as number,
      created_at: row.created_at as number,
      updated_at: row.updated_at as number,
    };
  }
}
