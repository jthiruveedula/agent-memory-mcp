import { homedir } from "os";
import { join } from "path";
import { config as loadEnv } from "dotenv";

loadEnv();

export interface AppConfig {
  memoryDir: string;
  dbPath: string;
  logLevel: "debug" | "info" | "warn" | "error";
  embedding: {
    provider: "local" | "openai";
    openaiModel: string;
    openaiApiKey?: string;
    vectorSize: number;
  };
  reflection: {
    minMemoriesForReflection: number;
    correctionConfidencePenalty: number;
    successConfidenceBoost: number;
    duplicateSimilarityThreshold: number;
  };
}

function getLogLevel(): AppConfig["logLevel"] {
  const level = process.env.AGENT_MEMORY_LOG_LEVEL;
  if (level === "debug" || level === "info" || level === "warn" || level === "error") {
    return level;
  }
  return "info";
}

export function createConfig(): AppConfig {
  const memoryDir = process.env.AGENT_MEMORY_DIR || join(homedir(), ".agent-memory-mcp");
  return {
    memoryDir,
    dbPath: join(memoryDir, "memories.db"),
    logLevel: getLogLevel(),
    embedding: {
      provider: process.env.OPENAI_API_KEY ? "openai" : "local",
      openaiModel: process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small",
      openaiApiKey: process.env.OPENAI_API_KEY,
      vectorSize: 384,
    },
    reflection: {
      minMemoriesForReflection: 5,
      correctionConfidencePenalty: 0.15,
      successConfidenceBoost: 0.05,
      duplicateSimilarityThreshold: 0.85,
    },
  };
}

export const config = createConfig();
