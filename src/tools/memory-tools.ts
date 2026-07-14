import type { MemoryStore } from "../db/memory-store.js";
import { KnowledgeGraphEngine } from "../graph/knowledge-graph.js";
import { PreferenceLearner } from "../learning/preference-learner.js";
import { SelfImprover } from "../learning/self-improver.js";
import { ToolRecommender } from "../learning/tool-recommender.js";
import {
  type CorrectionArgs,
  type GetPreferencesArgs,
  type KnowledgeGraphArgs,
  type Memory,
  type PreferenceArgs,
  type RecallArgs,
  type ReflectArgs,
  type RememberArgs,
  type ToolOutcomeArgs,
  type ToolRecommendationArgs,
  type UpdateConfidenceArgs,
  MemoryScope,
  MemoryType,
} from "../types.js";

export interface ToolContext {
  store: MemoryStore;
  graph: KnowledgeGraphEngine;
  learner: PreferenceLearner;
  recommender: ToolRecommender;
  improver: SelfImprover;
  workspace?: string;
  repoPath?: string;
}

function ok(text: string) {
  return { content: [{ type: "text" as const, text }] };
}

function err(message: string) {
  return { content: [{ type: "text" as const, text: `Error: ${message}` }], isError: true };
}

export async function handleRemember(args: RememberArgs, ctx: ToolContext) {
  const memory = await ctx.store.createMemoryWithEmbedding({
    content: args.content,
    type: args.type,
    scope: args.scope,
    workspace: args.workspace ?? ctx.workspace,
    repo_path: args.repo_path ?? ctx.repoPath,
    session_id: args.session_id,
    confidence: args.confidence,
    metadata: args.metadata,
  });

  ctx.graph.ingestMemory(memory);
  const prefs = ctx.learner.learnFromMemory(memory);

  return ok(
    `Remembered [${memory.id}] type=${memory.type} scope=${memory.scope} confidence=${memory.confidence}\n` +
      `Learned ${prefs.length} preference(s).`
  );
}

export async function handleRecall(args: RecallArgs, ctx: ToolContext) {
  const results = await ctx.store.recall(args);
  if (results.length === 0) {
    return ok("No matching memories found.");
  }
  const lines = results.map((r, i) => {
    const meta = [
      `score=${r.score.toFixed(3)}`,
      `type=${r.memory.type}`,
      `scope=${r.memory.scope}`,
      `confidence=${r.memory.confidence}`,
      `access=${r.memory.access_count}`,
    ];
    return `${i + 1}. [${r.memory.id}] (${meta.join(", ")})\n${r.memory.content}`;
  });
  return ok(lines.join("\n\n"));
}

export function handleRecallRecent(args: { limit?: number; scope?: string; repo_path?: string }, ctx: ToolContext) {
  const scope = args.scope ? MemoryScope.parse(args.scope) : undefined;
  const memories = ctx.store.getRecentMemories(args.limit ?? 20, scope, args.repo_path);
  if (memories.length === 0) return ok("No recent memories.");
  const lines = memories.map((m, i) => `${i + 1}. [${m.id}] ${m.type} | ${m.content.slice(0, 120)}`);
  return ok(lines.join("\n"));
}

export async function handleRememberCorrection(args: CorrectionArgs, ctx: ToolContext) {
  let memoryId = args.memory_id;
  if (!memoryId && args.original_content) {
    const results = await ctx.store.recall({
      query: args.original_content,
      limit: 1,
      min_confidence: 0,
    });
    if (results.length > 0) memoryId = results[0].memory.id;
  }

  const correction = ctx.store.createCorrection({
    memory_id: memoryId,
    correction_text: args.correction_text,
    context: args.context ?? ctx.repoPath,
    applied: false,
  });

  const original = memoryId ? ctx.store.getMemoryById(memoryId) : undefined;
  const prefs = ctx.learner.learnFromCorrection(correction, original ?? undefined);

  // Also store the correction itself as a memory so it can be recalled
  await ctx.store.createMemoryWithEmbedding({
    content: `Correction: ${args.correction_text}`,
    type: "correction",
    scope: "user",
    workspace: ctx.workspace,
    repo_path: ctx.repoPath,
    confidence: 0.9,
    metadata: { linked_memory_id: memoryId },
  });

  return ok(
    `Correction recorded [${correction.id}]` +
      (memoryId ? ` linked to memory [${memoryId}]` : "") +
      `. Extracted ${prefs.length} preference(s).`
  );
}

export function handleRememberToolOutcome(args: ToolOutcomeArgs, ctx: ToolContext) {
  const outcome = ctx.store.createToolOutcome({
    tool_name: args.tool_name,
    args_hash: args.args_hash ?? "",
    task_summary: args.task_summary,
    success: args.success,
    duration_ms: args.duration_ms,
    tokens_used: args.tokens_used,
    outcome_summary: args.outcome_summary,
    context: args.context,
    workspace: args.workspace ?? ctx.workspace,
    repo_path: args.repo_path ?? ctx.repoPath,
  });

  // Reward successful outcomes with small confidence boost if stored as memory
  if (args.success) {
    const recent = ctx.store.getRecentMemories(1);
    if (recent[0]) ctx.store.updateConfidence(recent[0].id, 0.02);
  }

  return ok(`Tool outcome recorded [${outcome.id}] for ${outcome.tool_name}.`);
}

export function handleGetPreferences(args: GetPreferencesArgs, ctx: ToolContext) {
  const prefs = ctx.store.getPreferences(args.prefix, args.key, args.min_confidence, args.limit);
  if (prefs.length === 0) return ok("No matching preferences found.");
  const lines = prefs.map(
    (p, i) =>
      `${i + 1}. ${p.key} = ${p.value} (confidence=${p.confidence.toFixed(2)}, sources=${p.source_memory_ids.length})`
  );
  return ok(lines.join("\n"));
}

export function handleSetPreference(args: PreferenceArgs, ctx: ToolContext) {
  const pref = ctx.store.upsertPreference({
    key: args.key,
    value: args.value,
    source_memory_ids: [],
    confidence: args.confidence,
  });
  return ok(`Preference set [${pref.id}]: ${pref.key} = ${pref.value}`);
}

export function handleGetToolRecommendations(args: ToolRecommendationArgs, ctx: ToolContext) {
  const recs = ctx.recommender.recommend(args.task, args.context, args.limit);
  if (recs.length === 0) return ok("No tool history available; recommend using search/web_search for new tasks.");
  const lines = recs.map(
    (r, i) =>
      `${i + 1}. ${r.tool_name} (score=${r.score.toFixed(2)})\n   ${r.reason}`
  );
  return ok(lines.join("\n"));
}

export function handleGetKnowledgeGraph(args: KnowledgeGraphArgs, ctx: ToolContext) {
  const result = ctx.store.getGraph(args);
  const entityLines = result.entities.map((e) => `- ${e.name} (${e.type})`);
  const relationLines = result.relations.map(
    (r) => `- ${r.source_id} --[${r.relation}]--> ${r.target_id}`
  );
  const memoryLines = result.memories.map((m) => `- [${m.id}] ${m.content.slice(0, 100)}`);
  return ok(
    `Entities (${result.entities.length}):\n${entityLines.join("\n")}\n\n` +
      `Relations (${result.relations.length}):\n${relationLines.join("\n")}\n\n` +
      `Memories (${result.memories.length}):\n${memoryLines.join("\n")}`
  );
}

export async function handleReflect(args: ReflectArgs, ctx: ToolContext) {
  const result = await ctx.improver.reflect(
    args.workspace ?? ctx.workspace,
    args.repo_path ?? ctx.repoPath,
    args.since
  );
  return ok(
    `${result.summary}\n\nInsights:\n${result.insights.map((s) => `- ${s}`).join("\n")}\n\n` +
      `Merged memories: ${result.merged_memory_ids.length}\n` +
      `New preferences: ${result.new_preferences.length}\n` +
      `Low confidence: ${result.low_confidence_memory_ids.length}\n\n` +
      `Recommended actions:\n${result.recommended_actions.map((a) => `- ${a}`).join("\n")}`
  );
}

export function handleUpdateConfidence(args: UpdateConfidenceArgs, ctx: ToolContext) {
  const memory = ctx.store.getMemoryById(args.memory_id);
  if (!memory) return err("Memory not found");
  ctx.store.updateConfidence(args.memory_id, args.delta);
  return ok(
    `Updated confidence for [${args.memory_id}] by ${args.delta}. New confidence: ${(
      memory.confidence + args.delta
    ).toFixed(2)}`
  );
}
