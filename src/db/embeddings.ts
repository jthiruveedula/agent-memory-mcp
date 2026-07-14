import { createHash } from "crypto";
import { config } from "../config.js";

export type EmbeddingVector = number[];

export async function generateEmbedding(text: string): Promise<EmbeddingVector> {
  if (config.embedding.provider === "openai" && config.embedding.openaiApiKey) {
    return generateOpenAIEmbedding(text);
  }
  return generateLocalEmbedding(text, config.embedding.vectorSize);
}

async function generateOpenAIEmbedding(text: string): Promise<EmbeddingVector> {
  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.embedding.openaiApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input: text,
      model: config.embedding.openaiModel,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI embedding failed: ${error}`);
  }

  const data = (await response.json()) as {
    data: { embedding: number[] }[];
  };
  return data.data[0].embedding;
}

export function generateLocalEmbedding(text: string, size: number): EmbeddingVector {
  const vector = new Array(size).fill(0);
  const tokens = tokenize(text);
  const tf = computeTf(tokens);
  const docFreq: Map<string, number> = new Map();

  for (const [term] of tf) {
    // Simulate IDF via hashing; in practice we maintain no global corpus state,
    // so we use a smoothed constant.
    docFreq.set(term, 1);
  }

  const nDocs = 1000;
  for (const [term, count] of tf) {
    const idf = Math.log(1 + nDocs / (1 + (docFreq.get(term) ?? 1)));
    const weight = count * idf;
    const idx1 = hashTerm(term, 0) % size;
    const idx2 = hashTerm(term, 1) % size;
    vector[idx1] += weight;
    vector[idx2] -= weight * 0.5;
  }

  return normalize(vector);
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !isStopWord(t));
}

function computeTf(tokens: string[]): Map<string, number> {
  const tf = new Map<string, number>();
  for (const t of tokens) {
    tf.set(t, (tf.get(t) ?? 0) + 1);
  }
  const max = Math.max(...tf.values(), 1);
  for (const [k, v] of tf) {
    tf.set(k, v / max);
  }
  return tf;
}

function hashTerm(term: string, salt: number): number {
  const hash = createHash("sha256")
    .update(term + salt)
    .digest("hex");
  return parseInt(hash.slice(0, 8), 16);
}

function normalize(vector: number[]): number[] {
  const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
  if (norm === 0) return vector;
  return vector.map((v) => v / norm);
}

function isStopWord(term: string): boolean {
  const stop = new Set([
    "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
    "to", "of", "and", "or", "for", "in", "on", "at", "by", "with", "from",
    "as", "it", "its", "this", "that", "these", "those", "i", "you", "he",
    "she", "we", "they", "them", "their", "there", "then", "than", "so",
    "if", "will", "would", "could", "should", "may", "might", "can", "do",
    "does", "did", "have", "has", "had", "but", "not", "no", "yes", "just",
    "only", "also", "when", "where", "why", "how", "what", "who", "which",
  ]);
  return stop.has(term);
}

export function cosineSimilarity(a: EmbeddingVector, b: EmbeddingVector): number {
  if (a.length !== b.length) {
    throw new Error("Embedding dimensions do not match");
  }
  let dot = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
  }
  return dot;
}
