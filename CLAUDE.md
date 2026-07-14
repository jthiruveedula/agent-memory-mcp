# Agent Memory MCP — Claude Code Instructions

This project implements a self-improving agent memory server using the Model Context Protocol (MCP).

## MCP Server

The `agent-memory` MCP server is configured in `.claude/settings.json` and provides persistent, cross-workspace memory for Claude Code.

### Available Tools

| Tool | Purpose |
|------|---------|
| `remember` | Store a memory, fact, preference, code pattern, or workflow |
| `recall` | Search memories by semantic similarity and full-text search |
| `recall_recent` | List recently accessed/created memories |
| `remember_correction` | Record a correction, optionally linked to a memory |
| `remember_tool_outcome` | Log tool call outcomes for recommendation learning |
| `get_preferences` | Retrieve learned preferences |
| `set_preference` | Manually set a preference |
| `get_tool_recommendations` | Get ranked tool recommendations for a task |
| `get_knowledge_graph` | Explore the knowledge graph around a topic |
| `reflect` | Run self-improvement analysis (merge duplicates, surface insights) |
| `update_memory_confidence` | Reinforce or penalize a memory's confidence |

### Prompt

A `memory-context` prompt is available: call it with your current task to inject relevant memories and preferences.

### Resources

- `memory://preferences` — all learned preferences as JSON
- `memory://recent` — recent memories as JSON
- `memory://stats` — memory database statistics

### Build & Run

```bash
npm install
npm run build
node dist/index.js
```

### Configuration

Set `AGENT_MEMORY_DIR` to change the storage location (default: `~/.agent-memory-mcp`).
Set `OPENAI_API_KEY` to use OpenAI embeddings instead of local hash-based ones.

### Project Structure

```
src/
├── index.ts           # Entry point
├── server.ts          # MCP server wiring
├── config.ts          # Configuration
├── types.ts           # Zod schemas & types
├── db/                # SQLite schema, embeddings, MemoryStore
├── graph/             # Knowledge graph extraction
├── learning/          # Preference learning, tool recommender, self-improver
└── tools/             # MCP tool handlers
```
