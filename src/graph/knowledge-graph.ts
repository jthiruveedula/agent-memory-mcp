import type { MemoryStore } from "../db/memory-store.js";
import type { Entity, Memory } from "../types.js";

interface ExtractedTriple {
  source: { name: string; type: string };
  relation: string;
  target: { name: string; type: string };
}

const TECH_TERMS = new Set([
  "typescript", "javascript", "python", "node", "nodejs", "react", "vue", "svelte",
  "angular", "nextjs", "express", "fastapi", "django", "flask", "rails", "spring",
  "sql", "sqlite", "postgres", "postgresql", "mysql", "mongodb", "redis", "kafka",
  "docker", "kubernetes", "aws", "gcp", "azure", "terraform", "ansible",
  "git", "github", "gitlab", "vscode", "mcp", "llm", "openai", "anthropic",
  "claude", "copilot", "npm", "yarn", "pnpm", "bun", "webpack", "vite", "esbuild",
  "tailwind", "bootstrap", "material-ui", "shadcn",
]);

const RELATION_PATTERNS: { pattern: RegExp; relation: string }[] = [
  { pattern: /\b(\w+)\s+(?:uses?|using|relies on|depends on)\s+(\w+)\b/gi, relation: "uses" },
  { pattern: /\b(\w+)\s+(?:is a|is an)\s+(\w+)\b/gi, relation: "is_a" },
  { pattern: /\b(\w+)\s+(?:in|inside|within)\s+(\w+)\b/gi, relation: "in" },
  { pattern: /\b(\w+)\s+(?:calls?|invokes?)\s+(\w+)\b/gi, relation: "calls" },
  { pattern: /\b(\w+)\s+(?:imports?|requires?)\s+(\w+)\b/gi, relation: "imports" },
  { pattern: /\b(\w+)\s+(?:exports?|exposes?)\s+(\w+)\b/gi, relation: "exports" },
  { pattern: /\b(\w+)\s+(?:implements?|realizes?)\s+(\w+)\b/gi, relation: "implements" },
  { pattern: /\b(\w+)\s+(?:extends?)\s+(\w+)\b/gi, relation: "extends" },
  { pattern: /\b(\w+)\s+(?:configures?|sets up)\s+(\w+)\b/gi, relation: "configures" },
  { pattern: /\b(\w+)\s+(?:builds?|compiles?)\s+(\w+)\b/gi, relation: "builds" },
];

export class KnowledgeGraphEngine {
  constructor(private store: MemoryStore) {}

  ingestMemory(memory: Memory): void {
    const entities = this.extractEntities(memory.content);
    const entityMap = new Map<string, Entity>();

    for (const e of entities) {
      const stored = this.store.createEntity({ name: e.name, type: e.type, memory_ids: [memory.id] });
      entityMap.set(`${stored.name}|${stored.type}`, stored);
    }

    const triples = this.extractRelations(memory.content, entities);
    for (const triple of triples) {
      const srcKey = `${triple.source.name}|${triple.source.type}`;
      const tgtKey = `${triple.target.name}|${triple.target.type}`;
      const src = entityMap.get(srcKey);
      const tgt = entityMap.get(tgtKey);
      if (src && tgt && src.id !== tgt.id) {
        this.store.createRelation({
          source_id: src.id,
          target_id: tgt.id,
          relation: triple.relation,
          memory_id: memory.id,
        });
      }
    }
  }

  private extractEntities(text: string): { name: string; type: string }[] {
    const found = new Map<string, string>();

    // Code symbols in backticks
    for (const match of text.matchAll(/`([^`]+)`/g)) {
      const name = match[1].trim();
      const type = this.guessEntityType(name);
      found.set(name, type);
    }

    // File paths
    for (const match of text.matchAll(/(?:\/[\w\-.]+)+\/?[\w\-.]*\.[a-zA-Z0-9]+/g)) {
      const path = match[0];
      const name = path.split("/").pop() ?? path;
      found.set(name, "file");
    }

    // Capitalized names (people, orgs, products)
    for (const match of text.matchAll(/\b[A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*\b/g)) {
      const name = match[0];
      if (name.length > 2 && !/^[A-Z]+$/.test(name)) {
        const lower = name.toLowerCase().replace(/\s+/g, "_");
        if (TECH_TERMS.has(lower)) {
          found.set(name, "technology");
        } else {
          found.set(name, "entity");
        }
      }
    }

    // Standalone tech terms
    for (const term of TECH_TERMS) {
      const re = new RegExp(`\\b${term}\\b`, "i");
      if (re.test(text)) {
        found.set(term, "technology");
      }
    }

    return Array.from(found.entries()).map(([name, type]) => ({ name, type }));
  }

  private guessEntityType(name: string): string {
    if (name.includes(".") && /^[\w\-.]+$/.test(name)) return "symbol";
    if (name.includes("/")) return "file";
    if (TECH_TERMS.has(name.toLowerCase())) return "technology";
    if (/^[A-Z]/.test(name)) return "entity";
    return "concept";
  }

  private extractRelations(
    text: string,
    entities: { name: string; type: string }[]
  ): ExtractedTriple[] {
    const triples: ExtractedTriple[] = [];
    const entityNames = new Set(entities.map((e) => e.name.toLowerCase()));

    for (const { pattern, relation } of RELATION_PATTERNS) {
      for (const match of text.matchAll(pattern)) {
        const a = match[1].trim();
        const b = match[2].trim();
        if (entityNames.has(a.toLowerCase()) && entityNames.has(b.toLowerCase())) {
          triples.push({
            source: { name: a, type: this.guessEntityType(a) },
            relation,
            target: { name: b, type: this.guessEntityType(b) },
          });
        }
      }
    }

    // Co-occurrence edges for nearby entities
    const sentences = text.split(/[.!?\n]+/);
    for (const sentence of sentences) {
      const present = entities.filter((e) =>
        new RegExp(`\\b${this.escapeRegex(e.name)}\\b`, "i").test(sentence)
      );
      for (let i = 0; i < present.length; i++) {
        for (let j = i + 1; j < present.length; j++) {
          triples.push({
            source: present[i],
            relation: "related_to",
            target: present[j],
          });
        }
      }
    }

    return triples;
  }

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
}
