import { z } from "zod";

export const MemoryScope = z.enum(["user", "repo", "session"]);
export type MemoryScope = z.infer<typeof MemoryScope>;

export const MemoryType = z.enum([
  "fact",
  "preference",
  "correction",
  "tool_outcome",
  "reflection",
  "code_pattern",
  "workflow",
]);
export type MemoryType = z.infer<typeof MemoryType>;

export interface Memory {
  id: string;
  content: string;
  type: MemoryType;
  scope: MemoryScope;
  workspace?: string;
  repo_path?: string;
  session_id?: string;
  created_at: number;
  updated_at: number;
  access_count: number;
  last_accessed: number;
  confidence: number;
  metadata?: Record<string, unknown>;
}

export interface Entity {
  id: string;
  name: string;
  type: string;
  memory_ids: string[];
  first_seen: number;
  last_seen: number;
}

export interface Relation {
  id: string;
  source_id: string;
  target_id: string;
  relation: string;
  memory_id: string;
  created_at: number;
}

export interface Correction {
  id: string;
  memory_id?: string;
  correction_text: string;
  context?: string;
  applied: boolean;
  created_at: number;
}

export interface ToolOutcome {
  id: string;
  tool_name: string;
  args_hash: string;
  task_summary: string;
  success: boolean;
  duration_ms: number;
  tokens_used?: number;
  outcome_summary?: string;
  context?: string;
  workspace?: string;
  repo_path?: string;
  created_at: number;
}

export interface Preference {
  id: string;
  key: string;
  value: string;
  source_memory_ids: string[];
  confidence: number;
  created_at: number;
  updated_at: number;
}

export interface RecallResult {
  memory: Memory;
  score: number;
  matched_entities?: string[];
}

export interface KnowledgeGraphResult {
  query: string;
  entities: Entity[];
  relations: Relation[];
  related_memories: Memory[];
}

export interface ReflectionResult {
  summary: string;
  insights: string[];
  merged_memory_ids: string[];
  new_preferences: Preference[];
  low_confidence_memory_ids: string[];
  recommended_actions: string[];
}

export interface ToolRecommendation {
  tool_name: string;
  score: number;
  reason: string;
  avg_tokens?: number;
  avg_duration_ms?: number;
  success_rate?: number;
}

// Zod schemas for tool arguments
export const RememberArgs = z.object({
  content: z.string().min(1),
  type: MemoryType.default("fact"),
  scope: MemoryScope.default("user"),
  workspace: z.string().optional(),
  repo_path: z.string().optional(),
  session_id: z.string().optional(),
  confidence: z.number().min(0).max(1).default(0.8),
  metadata: z.record(z.unknown()).optional(),
});
export type RememberArgs = z.infer<typeof RememberArgs>;

export const RecallArgs = z.object({
  query: z.string().min(1),
  type: MemoryType.optional(),
  scope: MemoryScope.optional(),
  repo_path: z.string().optional(),
  limit: z.number().int().min(1).max(50).default(10),
  min_confidence: z.number().min(0).max(1).default(0.0),
});
export type RecallArgs = z.infer<typeof RecallArgs>;

export const CorrectionArgs = z.object({
  memory_id: z.string().optional(),
  original_content: z.string().optional(),
  correction_text: z.string().min(1),
  context: z.string().optional(),
  workspace: z.string().optional(),
  repo_path: z.string().optional(),
});
export type CorrectionArgs = z.infer<typeof CorrectionArgs>;

export const ToolOutcomeArgs = z.object({
  tool_name: z.string().min(1),
  task_summary: z.string().min(1),
  args_hash: z.string().optional(),
  success: z.boolean(),
  duration_ms: z.number().int().min(0),
  tokens_used: z.number().int().min(0).optional(),
  outcome_summary: z.string().optional(),
  context: z.string().optional(),
  workspace: z.string().optional(),
  repo_path: z.string().optional(),
});
export type ToolOutcomeArgs = z.infer<typeof ToolOutcomeArgs>;

export const ToolRecommendationArgs = z.object({
  task: z.string().min(1),
  context: z.string().optional(),
  limit: z.number().int().min(1).max(20).default(5),
});
export type ToolRecommendationArgs = z.infer<typeof ToolRecommendationArgs>;

export const KnowledgeGraphArgs = z.object({
  query: z.string().min(1),
  depth: z.number().int().min(1).max(3).default(2),
  limit: z.number().int().min(1).max(50).default(20),
});
export type KnowledgeGraphArgs = z.infer<typeof KnowledgeGraphArgs>;

export const ReflectArgs = z.object({
  workspace: z.string().optional(),
  repo_path: z.string().optional(),
  since: z.number().int().optional(),
});
export type ReflectArgs = z.infer<typeof ReflectArgs>;

export const UpdateConfidenceArgs = z.object({
  memory_id: z.string(),
  delta: z.number().min(-1).max(1),
  reason: z.string().optional(),
});
export type UpdateConfidenceArgs = z.infer<typeof UpdateConfidenceArgs>;

export const PreferenceArgs = z.object({
  key: z.string().min(1),
  value: z.string().min(1),
  confidence: z.number().min(0).max(1).default(0.9),
});
export type PreferenceArgs = z.infer<typeof PreferenceArgs>;

export const GetPreferencesArgs = z.object({
  prefix: z.string().optional(),
  key: z.string().optional(),
  min_confidence: z.number().min(0).max(1).default(0.0),
  limit: z.number().int().min(1).max(100).default(50),
});
export type GetPreferencesArgs = z.infer<typeof GetPreferencesArgs>;
