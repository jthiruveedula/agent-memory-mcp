# Agent Memory MCP — Copilot Instructions

## Project Overview

This is a TypeScript MCP server that provides persistent, cross-workspace agent memory with:

- Semantic + keyword memory recall (SQLite FTS5 + vector similarity)
- Personal knowledge graph (entity/relation extraction)
- Preference learning from explicit statements and corrections
- Tool outcome logging and recommendation
- Self-improvement via reflection (duplicate merge, insight surfacing)

## SDK References

- MCP TypeScript SDK: https://github.com/modelcontextprotocol/typescript-sdk
- MCP Specification: https://modelcontextprotocol.io/specification/latest
- MCP Docs: https://modelcontextprotocol.io/

## Architecture

- `src/index.ts` — entry point (starts stdio transport)
- `src/server.ts` — MCP server wiring (tools, resources, prompts)
- `src/config.ts` — configuration from environment variables
- `src/types.ts` — Zod schemas and TypeScript types
- `src/db/schema.ts` — SQLite schema with versioned migrations
- `src/db/memory-store.ts` — CRUD, FTS5 search, embeddings, graph persistence
- `src/db/embeddings.ts` — hash-based local or OpenAI embedding generation
- `src/graph/knowledge-graph.ts` — entity/relation extraction and graph queries
- `src/learning/preference-learner.ts` — preference extraction from text and corrections
- `src/learning/tool-recommender.ts` — tool outcome learning and ranking
- `src/learning/self-improver.ts` — reflection, duplicate detection, confidence adjustment
- `src/tools/memory-tools.ts` — MCP tool handlers (pure functions, context injected)

## Conventions

- Use Zod schemas in `src/types.ts` for all tool arguments.
- Keep tool handlers pure; context is passed via `ToolContext`.
- All storage goes through `MemoryStore`.
- Embeddings default to local hashing-based vectors; optionally use OpenAI when `OPENAI_API_KEY` is set.
- Data is stored in `~/.agent-memory-mcp/` by default (configurable via `AGENT_MEMORY_DIR`).
- Schema versioning: `src/db/schema.ts` manages versioned migrations via `_meta` table.

## MCP Server Configuration

The server is configured for each platform:

| Platform | Config File |
|----------|-------------|
| VS Code (this workspace) | `.vscode/mcp.json` |
| Claude Code CLI | `.claude/settings.json` |
| Cursor | `.cursor/mcp.json` |
| OpenCode | `opencode.json` |
| Claude Desktop | `~/Library/Application Support/Claude/settings.json` |

## Build & Run

```bash
npm install
npm run build
node dist/index.js
```

Debug with MCP Inspector:

```bash
npm run inspector
```

## Testing

```bash
# Quick smoke test
bash scripts/smoke-test.sh

# Full 12-tool test suite
bash scripts/full-test.sh

# Stress test with concurrent operations
bash scripts/stress-test.sh
```

## Available MCP Tools

| Tool | Description |
|------|-------------|
| `remember` | Store a memory, fact, preference, code pattern, or workflow. Extracts KG and preferences. |
| `recall` | Search memories by semantic similarity and FTS5 full-text search |
| `recall_recent` | List recently accessed or created memories |
| `remember_correction` | Record a correction, linked to an existing memory by id or content match |
| `remember_tool_outcome` | Log tool call result (success, tokens, duration) for recommendations |
| `get_preferences` | Retrieve learned preferences, filterable by key/prefix |
| `set_preference` | Manually set a preference with high confidence |
| `get_tool_recommendations` | Get ranked tool recommendations for a task description |
| `get_knowledge_graph` | Explore entities and relations around a query |
| `reflect` | Run self-improvement (merge duplicates, extract prefs, flag low confidence) |
| `update_memory_confidence` | Reinforce or penalize a memory's confidence score |

## Resources

- `memory://preferences` — all preferences as JSON
- `memory://recent` — recent memories as JSON
- `memory://stats` — database statistics

## Prompts

- `memory-context` — inject relevant memories and preferences given a task description
