import type { MemoryStore } from "../db/memory-store.js";
import type { Correction, Memory, Preference } from "../types.js";

interface ExtractedPreference {
  key: string;
  value: string;
  confidence: number;
}

const PREFERENCE_PATTERNS: { pattern: RegExp; key: string; transform?: (m: RegExpExecArray) => string }[] = [
  {
    pattern: /\b(?:I |we )?(?:prefer|like|want) (?:to |that )?(.+?)(?:\.|,|;|$)/i,
    key: "user/preference",
    transform: (m) => m[1].trim(),
  },
  {
    pattern: /\b(?:always|usually) use\s+(.+?)(?:\.|,|;|$)/i,
    key: "tool/recommendation",
    transform: (m) => m[1].trim(),
  },
  {
    pattern: /\b(?:never|avoid|don't) (?:use |do )?(.+?)(?:\.|,|;|$)/i,
    key: "user/avoid",
    transform: (m) => m[1].trim(),
  },
  {
    pattern: /\bkeep (?:it |answers |responses )?(short|concise|brief)/i,
    key: "style/verbosity",
    transform: () => "concise",
  },
  {
    pattern: /\b(?:provide |give me )?detailed(?: explanations?)?/i,
    key: "style/verbosity",
    transform: () => "detailed",
  },
  {
    pattern: /\buse (?:bullet points|bullets|lists?)\b/i,
    key: "style/format",
    transform: () => "bullets",
  },
  {
    pattern: /\buse (?:prose|paragraphs?)\b/i,
    key: "style/format",
    transform: () => "prose",
  },
  {
    pattern: /\b(token[- ]?efficient|limit tokens|save tokens|reduce tokens)\b/i,
    key: "optimization/tokens",
    transform: () => "minimize",
  },
  {
    pattern: /\b(?:prefer|use) local tools\b/i,
    key: "tool/selection_policy",
    transform: () => "local_first",
  },
  {
    pattern: /\b(?:prefer|use) web search\b/i,
    key: "tool/selection_policy",
    transform: () => "web_search_when_needed",
  },
];

export class PreferenceLearner {
  constructor(private store: MemoryStore) {}

  learnFromMemory(memory: Memory): Preference[] {
    const extracted = this.extractPreferences(memory.content);
    const stored: Preference[] = [];
    for (const p of extracted) {
      const pref = this.store.upsertPreference({
        key: p.key,
        value: p.value,
        source_memory_ids: [memory.id],
        confidence: Math.min(0.95, memory.confidence * p.confidence),
      });
      stored.push(pref);
    }
    return stored;
  }

  learnFromCorrection(correction: Correction, originalMemory?: Memory): Preference[] {
    const stored: Preference[] = [];
    const extracted = this.extractPreferences(correction.correction_text);
    for (const p of extracted) {
      const key = p.key.startsWith("correction/") ? p.key : `correction/${p.key}`;
      const pref = this.store.upsertPreference({
        key,
        value: p.value,
        source_memory_ids: correction.memory_id ? [correction.memory_id] : [],
        confidence: 0.9,
      });
      stored.push(pref);
    }

    // Generic correction preference about the original content
    if (originalMemory) {
      const inverted = this.inferNegativePreference(originalMemory.content, correction.correction_text);
      if (inverted) {
        const pref = this.store.upsertPreference({
          key: `correction/avoid_pattern`,
          value: inverted,
          source_memory_ids: correction.memory_id ? [correction.memory_id] : [],
          confidence: 0.85,
        });
        stored.push(pref);
      }
    }

    return stored;
  }

  private extractPreferences(text: string): ExtractedPreference[] {
    const results: ExtractedPreference[] = [];
    for (const { pattern, key, transform } of PREFERENCE_PATTERNS) {
      const re = new RegExp(pattern.source, pattern.flags.includes("g") ? pattern.flags : pattern.flags + "g");
      let match: RegExpExecArray | null;
      while ((match = re.exec(text)) !== null) {
        const value = transform ? transform(match) : match[0].trim();
        if (value && value.length > 1) {
          results.push({ key, value, confidence: 0.7 });
        }
      }
    }
    return results;
  }

  private inferNegativePreference(original: string, correction: string): string | null {
    if (original.length > 200 || correction.length > 200) return null;
    // Simple heuristic: if correction directly contradicts original phrase
    if (correction.toLowerCase().startsWith("not ") || correction.toLowerCase().startsWith("do not ")) {
      return correction;
    }
    return null;
  }
}
