import type { MemoryStore } from "../db/memory-store.js";
import type { ToolOutcome, ToolRecommendation } from "../types.js";

export class ToolRecommender {
  constructor(private store: MemoryStore) {}

  logOutcome(outcome: ToolOutcome): void {
    this.store.createToolOutcome(outcome);
  }

  recommend(task: string, context?: string, limit = 5): ToolRecommendation[] {
    const taskLower = task.toLowerCase();
    const contextLower = context?.toLowerCase() ?? "";
    const allOutcomes = this.store.getToolOutcomes();

    const toolScores = new Map<
      string,
      {
        successes: number;
        failures: number;
        durations: number[];
        tokens: number[];
        taskMatches: number;
      }
    >();

    for (const o of allOutcomes) {
      const entry = toolScores.get(o.tool_name) ?? {
        successes: 0,
        failures: 0,
        durations: [],
        tokens: [],
        taskMatches: 0,
      };

      if (o.success) entry.successes++;
      else entry.failures++;
      entry.durations.push(o.duration_ms);
      if (o.tokens_used) entry.tokens.push(o.tokens_used);

      const combined = `${o.task_summary} ${o.context ?? ""}`.toLowerCase();
      const overlap = this.wordOverlap(taskLower + " " + contextLower, combined);
      if (overlap > 0.3) {
        entry.taskMatches += overlap;
      }

      toolScores.set(o.tool_name, entry);
    }

    const scored: ToolRecommendation[] = [];
    for (const [tool_name, stats] of toolScores) {
      const total = stats.successes + stats.failures;
      const successRate = total > 0 ? stats.successes / total : 0;
      const avgDuration = stats.durations.reduce((a, b) => a + b, 0) / total;
      const avgTokens = stats.tokens.length
        ? stats.tokens.reduce((a, b) => a + b, 0) / stats.tokens.length
        : undefined;

      // Score: success weighted heavily, task relevance, token efficiency, speed
      let score = successRate * 0.5 + Math.min(stats.taskMatches, 1) * 0.3;
      if (avgTokens) {
        score += Math.max(0, 1 - avgTokens / 10000) * 0.1;
      }
      score += Math.max(0, 1 - avgDuration / 5000) * 0.1;

      // Boost tools whose names appear in task
      if (taskLower.includes(tool_name.toLowerCase())) {
        score += 0.15;
      }

      scored.push({
        tool_name,
        score: Math.min(1, score),
        reason: this.buildReason(successRate, avgTokens, avgDuration, stats.taskMatches),
        avg_tokens: avgTokens,
        avg_duration_ms: avgDuration,
        success_rate: successRate,
      });
    }

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit);
  }

  getStats(toolName: string): ToolRecommendation | null {
    const stats = this.store.getToolStats(toolName);
    if (stats.count === 0) return null;
    return {
      tool_name: toolName,
      score: stats.success_rate,
      reason: `${Math.round(stats.success_rate * 100)}% success over ${stats.count} uses`,
      avg_tokens: stats.avg_tokens,
      avg_duration_ms: stats.avg_duration_ms,
      success_rate: stats.success_rate,
    };
  }

  private wordOverlap(a: string, b: string): number {
    const tokensA = this.tokenize(a);
    const tokensB = this.tokenize(b);
    if (tokensA.size === 0 || tokensB.size === 0) return 0;
    let intersection = 0;
    for (const t of tokensA) {
      if (tokensB.has(t)) intersection++;
    }
    return intersection / Math.max(tokensA.size, tokensB.size);
  }

  private tokenize(text: string): Set<string> {
    return new Set(
      text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((t) => t.length > 2)
    );
  }

  private buildReason(
    successRate: number,
    avgTokens: number | undefined,
    avgDuration: number,
    taskMatches: number
  ): string {
    const parts: string[] = [];
    parts.push(`${Math.round(successRate * 100)}% historical success`);
    if (avgTokens !== undefined) parts.push(`avg ${Math.round(avgTokens)} tokens`);
    parts.push(`avg ${Math.round(avgDuration)}ms`);
    if (taskMatches > 0.3) parts.push("task pattern match");
    return parts.join(", ");
  }
}
