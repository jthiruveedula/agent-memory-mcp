import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListPromptsRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
  GetPromptRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { config } from "./config.js";
import { MemoryStore } from "./db/memory-store.js";
import { KnowledgeGraphEngine } from "./graph/knowledge-graph.js";
import { PreferenceLearner } from "./learning/preference-learner.js";
import { SelfImprover } from "./learning/self-improver.js";
import { ToolRecommender } from "./learning/tool-recommender.js";
import {
  handleGetKnowledgeGraph,
  handleGetPreferences,
  handleGetToolRecommendations,
  handleRecall,
  handleRecallRecent,
  handleReflect,
  handleRemember,
  handleRememberCorrection,
  handleRememberToolOutcome,
  handleSetPreference,
  handleUpdateConfidence,
  type ToolContext,
} from "./tools/memory-tools.js";
import {
  CorrectionArgs,
  GetPreferencesArgs,
  KnowledgeGraphArgs,
  RecallArgs,
  ReflectArgs,
  RememberArgs,
  ToolOutcomeArgs,
  ToolRecommendationArgs,
  UpdateConfidenceArgs,
  PreferenceArgs,
} from "./types.js";

function createLogger(level: typeof config.logLevel) {
  const levels = { debug: 0, info: 1, warn: 2, error: 3 };
  const shouldLog = (l: keyof typeof levels) => levels[l] >= levels[level];
  return {
    debug: (msg: string) => shouldLog("debug") && console.error(`[debug] ${msg}`),
    info: (msg: string) => shouldLog("info") && console.error(`[info] ${msg}`),
    warn: (msg: string) => shouldLog("warn") && console.error(`[warn] ${msg}`),
    error: (msg: string) => shouldLog("error") && console.error(`[error] ${msg}`),
  };
}

export async function startServer() {
  const log = createLogger(config.logLevel);
  const store = new MemoryStore();
  const ctx: ToolContext = {
    store,
    graph: new KnowledgeGraphEngine(store),
    learner: new PreferenceLearner(store),
    recommender: new ToolRecommender(store),
    improver: new SelfImprover(store),
  };

  const server = new Server(
    { name: "agent-memory-mcp", version: "0.1.0" },
    {
      capabilities: {
        tools: {},
        resources: {},
        prompts: {},
      },
    }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: "remember",
        description: "Store a memory, fact, preference, code pattern, or workflow insight. Extracts a knowledge graph and learns preferences automatically.",
        inputSchema: {
          type: "object",
          properties: {
            content: { type: "string", description: "The memory content" },
            type: { type: "string", enum: ["fact", "preference", "correction", "tool_outcome", "reflection", "code_pattern", "workflow"], default: "fact" },
            scope: { type: "string", enum: ["user", "repo", "session"], default: "user" },
            workspace: { type: "string", description: "Optional workspace path" },
            repo_path: { type: "string", description: "Optional repo path" },
            session_id: { type: "string" },
            confidence: { type: "number", minimum: 0, maximum: 1, default: 0.8 },
            metadata: { type: "object" },
          },
          required: ["content"],
        },
      },
      {
        name: "recall",
        description: "Search memories by semantic similarity and full-text search.",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string" },
            type: { type: "string", enum: ["fact", "preference", "correction", "tool_outcome", "reflection", "code_pattern", "workflow"] },
            scope: { type: "string", enum: ["user", "repo", "session"] },
            repo_path: { type: "string" },
            limit: { type: "number", default: 10 },
            min_confidence: { type: "number", default: 0 },
          },
          required: ["query"],
        },
      },
      {
        name: "recall_recent",
        description: "List recently accessed or created memories.",
        inputSchema: {
          type: "object",
          properties: {
            limit: { type: "number", default: 20 },
            scope: { type: "string", enum: ["user", "repo", "session"] },
            repo_path: { type: "string" },
          },
        },
      },
      {
        name: "remember_correction",
        description: "Store a correction. Optionally links to a memory by id or by matching original content. Penalizes corrected memory confidence and extracts preferences.",
        inputSchema: {
          type: "object",
          properties: {
            memory_id: { type: "string" },
            original_content: { type: "string" },
            correction_text: { type: "string" },
            context: { type: "string" },
            workspace: { type: "string" },
            repo_path: { type: "string" },
          },
          required: ["correction_text"],
        },
      },
      {
        name: "remember_tool_outcome",
        description: "Log the result of a tool call for future recommendations and token optimization.",
        inputSchema: {
          type: "object",
          properties: {
            tool_name: { type: "string" },
            task_summary: { type: "string" },
            args_hash: { type: "string" },
            success: { type: "boolean" },
            duration_ms: { type: "number" },
            tokens_used: { type: "number" },
            outcome_summary: { type: "string" },
            context: { type: "string" },
            workspace: { type: "string" },
            repo_path: { type: "string" },
          },
          required: ["tool_name", "task_summary", "success", "duration_ms"],
        },
      },
      {
        name: "get_preferences",
        description: "Retrieve learned preferences. Filter by key prefix or exact key.",
        inputSchema: {
          type: "object",
          properties: {
            prefix: { type: "string" },
            key: { type: "string" },
            min_confidence: { type: "number", default: 0 },
            limit: { type: "number", default: 50 },
          },
        },
      },
      {
        name: "set_preference",
        description: "Manually set a preference with high confidence.",
        inputSchema: {
          type: "object",
          properties: {
            key: { type: "string" },
            value: { type: "string" },
            confidence: { type: "number", default: 0.9 },
          },
          required: ["key", "value"],
        },
      },
      {
        name: "get_tool_recommendations",
        description: "Get ranked tool recommendations for a task based on historical success, token usage, speed, and task similarity.",
        inputSchema: {
          type: "object",
          properties: {
            task: { type: "string" },
            context: { type: "string" },
            limit: { type: "number", default: 5 },
          },
          required: ["task"],
        },
      },
      {
        name: "get_knowledge_graph",
        description: "Explore the personal knowledge graph around a query.",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string" },
            depth: { type: "number", default: 2 },
            limit: { type: "number", default: 20 },
          },
          required: ["query"],
        },
      },
      {
        name: "reflect",
        description: "Run self-improvement analysis: merge duplicates, extract preferences, flag low-confidence memories, surface insights.",
        inputSchema: {
          type: "object",
          properties: {
            workspace: { type: "string" },
            repo_path: { type: "string" },
            since: { type: "number", description: "Unix timestamp ms" },
          },
        },
      },
      {
        name: "update_memory_confidence",
        description: "Reinforce or penalize a memory by id.",
        inputSchema: {
          type: "object",
          properties: {
            memory_id: { type: "string" },
            delta: { type: "number", minimum: -1, maximum: 1 },
            reason: { type: "string" },
          },
          required: ["memory_id", "delta"],
        },
      },
    ],
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: rawArgs } = request.params;
    log.debug(`tool call: ${name}`);

    try {
      switch (name) {
        case "remember":
          return await handleRemember(RememberArgs.parse(rawArgs), ctx);
        case "recall":
          return await handleRecall(RecallArgs.parse(rawArgs), ctx);
        case "recall_recent":
          return handleRecallRecent(rawArgs as { limit?: number; scope?: string; repo_path?: string }, ctx);
        case "remember_correction":
          return await handleRememberCorrection(CorrectionArgs.parse(rawArgs), ctx);
        case "remember_tool_outcome":
          return handleRememberToolOutcome(ToolOutcomeArgs.parse(rawArgs), ctx);
        case "get_preferences":
          return handleGetPreferences(GetPreferencesArgs.parse(rawArgs), ctx);
        case "set_preference":
          return handleSetPreference(PreferenceArgs.parse(rawArgs), ctx);
        case "get_tool_recommendations":
          return handleGetToolRecommendations(ToolRecommendationArgs.parse(rawArgs), ctx);
        case "get_knowledge_graph":
          return handleGetKnowledgeGraph(KnowledgeGraphArgs.parse(rawArgs), ctx);
        case "reflect":
          return await handleReflect(ReflectArgs.parse(rawArgs), ctx);
        case "update_memory_confidence":
          return handleUpdateConfidence(UpdateConfidenceArgs.parse(rawArgs), ctx);
        default:
          return { content: [{ type: "text", text: `Unknown tool: ${name}` }], isError: true };
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      log.error(`tool ${name} failed: ${message}`);
      return { content: [{ type: "text", text: `Error: ${message}` }], isError: true };
    }
  });

  server.setRequestHandler(ListResourcesRequestSchema, async () => ({
    resources: [
      { uri: "memory://preferences", name: "Learned Preferences", mimeType: "application/json" },
      { uri: "memory://recent", name: "Recent Memories", mimeType: "application/json" },
      { uri: "memory://stats", name: "Memory Stats", mimeType: "application/json" },
    ],
  }));

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const uri = request.params.uri;
    if (uri === "memory://preferences") {
      const prefs = store.getPreferences(undefined, undefined, 0, 100);
      return {
        contents: [{ uri, mimeType: "application/json", text: JSON.stringify(prefs, null, 2) }],
      };
    }
    if (uri === "memory://recent") {
      const memories = store.getRecentMemories(50);
      return {
        contents: [{ uri, mimeType: "application/json", text: JSON.stringify(memories, null, 2) }],
      };
    }
    if (uri === "memory://stats") {
      const stats = {
        memories: store.getRecentMemories(999999).length,
        entities: store.countEntities(),
        relations: store.countRelations(),
        corrections: store.getRecentCorrections().length,
      };
      return {
        contents: [{ uri, mimeType: "application/json", text: JSON.stringify(stats, null, 2) }],
      };
    }
    throw new Error(`Unknown resource: ${uri}`);
  });

  server.setRequestHandler(ListPromptsRequestSchema, async () => ({
    prompts: [
      {
        name: "memory-context",
        description: "Inject relevant learned memories and preferences into the current context.",
        arguments: [
          { name: "task", description: "Current task description", required: true },
          { name: "repo_path", description: "Current repository path", required: false },
        ],
      },
    ],
  }));

  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    if (name === "memory-context") {
      const task = (args?.task as string) ?? "";
      const repoPath = args?.repo_path as string | undefined;
      const results = await store.recall({ query: task, limit: 10, repo_path: repoPath, min_confidence: 0 });
      const prefs = store.getPreferences(undefined, undefined, 0.6, 20);
      const text =
        `Relevant memories:\n` +
        results.map((r) => `- ${r.memory.content}`).join("\n") +
        `\n\nLearned preferences:\n` +
        prefs.map((p) => `- ${p.key}: ${p.value}`).join("\n");
      return {
        messages: [
          {
            role: "user",
            content: { type: "text", text },
          },
        ],
      };
    }
    throw new Error(`Unknown prompt: ${name}`);
  });

  const transport = new StdioServerTransport();
  log.info("Agent Memory MCP server starting on stdio");
  await server.connect(transport);
}
