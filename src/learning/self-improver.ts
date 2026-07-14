import { config } from "../config.js";
import type { MemoryStore } from "../db/memory-store.js";
import { cosineSimilarity } from "../db/embeddings.js";
import { KnowledgeGraphEngine } from "../graph/knowledge-graph.js";
import type { Memory, Preference, ReflectionResult } from "../types.js";
import { PreferenceLearner } from "./preference-learner.js";

export class SelfImprover {
  private graph: KnowledgeGraphEngine;
  private learner: PreferenceLearner;

  constructor(private store: MemoryStore) {
    this.graph = new KnowledgeGraphEngine(store);
    this.learner = new PreferenceLearner(store);
  }

  async reflect(workspace?: string, repo_path?: string, since?: number): Promise<ReflectionResult> {
    const memories = this.store.getMemoriesForReflection(since, workspace, repo_path);
    if (memories.length < config.reflection.minMemoriesForReflection) {
      return {
        summary: "Not enough memories for reflection yet.",
        insights: [],
        merged_memory_ids: [],
        new_preferences: [],
        low_confidence_memory_ids: [],
        recommended_actions: ["Continue using remember/recall to build memory corpus."],
      };
    }

    const merged = this.findAndMergeDuplicates(memories);
    const newPrefs = this.extractPreferencesFromRecent(memories);
    const lowConfidence = this.identifyLowConfidenceMemories(memories);
    const insights = this.generateInsights(memories);
    const actions = this.generateActions(memories, lowConfidence, merged);

    return {
      summary: `Analyzed ${memories.length} memories; merged ${merged.length} duplicates, extracted ${newPrefs.length} preferences, flagged ${lowConfidence.length} low-confidence items.`,
      insights,
      merged_memory_ids: merged,
      new_preferences: newPrefs,
      low_confidence_memory_ids: lowConfidence,
      recommended_actions: actions,
    };
  }

  async backfillGraph(): Promise<{ processed: number; entities: number; relations: number }> {
    const memories = this.store.getRecentMemories(1000);
    let entities = 0;
    let relations = 0;
    for (const m of memories) {
      const beforeEntities = this.countEntities();
      const beforeRelations = this.countRelations();
      this.graph.ingestMemory(m);
      entities += this.countEntities() - beforeEntities;
      relations += this.countRelations() - beforeRelations;
    }
    return { processed: memories.length, entities, relations };
  }

  private findAndMergeDuplicates(memories: Memory[]): string[] {
    const merged: string[] = [];
    const threshold = config.reflection.duplicateSimilarityThreshold;

    for (let i = 0; i < memories.length; i++) {
      const a = memories[i];
      if (merged.includes(a.id)) continue;
      const embA = this.store.getEmbedding(a.id);
      if (!embA) continue;

      for (let j = i + 1; j < memories.length; j++) {
        const b = memories[j];
        if (merged.includes(b.id)) continue;
        const embB = this.store.getEmbedding(b.id);
        if (!embB) continue;

        const sim = cosineSimilarity(embA, embB);
        if (sim >= threshold && a.type === b.type) {
          this.store.mergeMemories(a.id, b.id);
          merged.push(b.id);
        }
      }
    }
    return merged;
  }

  private extractPreferencesFromRecent(memories: Memory[]): Preference[] {
    const prefs: Preference[] = [];
    for (const m of memories) {
      const learned = this.learner.learnFromMemory(m);
      prefs.push(...learned);
    }
    return prefs;
  }

  private identifyLowConfidenceMemories(memories: Memory[]): string[] {
    return memories.filter((m) => m.confidence < 0.3).map((m) => m.id);
  }

  private generateInsights(memories: Memory[]): string[] {
    const insights: string[] = [];
    const typeCounts = new Map<string, number>();
    for (const m of memories) {
      typeCounts.set(m.type, (typeCounts.get(m.type) ?? 0) + 1);
    }

    for (const [type, count] of typeCounts) {
      if (count > memories.length * 0.3) {
        insights.push(`Memory corpus is dominated by ${type} memories (${count}).`);
      }
    }

    const corrections = this.store.getRecentCorrections();
    if (corrections.length > 0) {
      insights.push(`${corrections.length} corrections logged recently; confidence penalized for corrected memories.`);
    }

    const toolOutcomes = this.store.getToolOutcomes(undefined, Date.now() - 7 * 24 * 60 * 60 * 1000);
    if (toolOutcomes.length > 0) {
      const successRate = toolOutcomes.filter((o) => o.success).length / toolOutcomes.length;
      insights.push(`Recent tool success rate is ${Math.round(successRate * 100)}% over ${toolOutcomes.length} calls.`);
    }

    return insights;
  }

  private generateActions(memories: Memory[], lowConfidence: string[], merged: string[]): string[] {
    const actions: string[] = [];
    if (lowConfidence.length > 0) {
      actions.push("Review low-confidence memories and either correct or delete them.");
    }
    if (merged.length > 0) {
      actions.push("Merged duplicate memories to reduce noise.");
    }
    const preferences = this.store.getPreferences(undefined, undefined, 0.5, 100);
    if (preferences.length === 0) {
      actions.push("No strong preferences learned yet; explicitly use set_preference for critical ones.");
    } else {
      actions.push(`${preferences.length} preferences learned; review with get_preferences.`);
    }
    return actions;
  }

  private countEntities(): number {
    return this.store.countEntities();
  }

  private countRelations(): number {
    return this.store.countRelations();
  }
}
