# Agent Memory MCP

A self-improving agent memory server implementing the [Model Context Protocol (MCP)](https://modelcontextprotocol.io). It captures, organizes, and shares memories across all your workspaces and repositories, builds a personal knowledge graph, learns your preferences, and recommends the right tools to limit token usage.

## Features

- **Cross-workspace memory sharing** — memories stored in `~/.agent-memory-mcp/` are available to every workspace/repo.
- **Semantic + keyword recall** — SQLite FTS5 full-text search plus lightweight vector similarity.
- **Knowledge graph** — auto-extracts entities and relations from memories, like a personal CodeGraph.
- **Continuous correction** — corrections are linked to memories and used to update confidence and generate preferences.
- **Preference learning** — learns style, formatting, workflow, and tool-selection preferences from interactions.
- **Tool recommender** — logs tool outcomes and recommends the best tool given a task description.
- **Self-improvement** — `reflect` analyzes patterns, merges duplicates, surfaces insights, and updates preferences.

## Quick start

```bash
npm install
npm run build
node dist/index.js
```

## Platform Setup

### VS Code (GitHub Copilot)

The `.vscode/mcp.json` is pre-configured for this workspace. Copilot will automatically discover it.

### Claude Code CLI

Add the following to `.claude/settings.json` (already included in this repo):

```json
{
  "mcpServers": {
    "agent-memory": {
      "command": "node",
      "args": ["${workspaceFolder}/dist/index.js"]
    }
  }
}
```

### Claude Desktop

Open `~/Library/Application Support/Claude/settings.json` and add:

```json
{
  "mcpServers": {
    "agent-memory": {
      "command": "node",
      "args": ["/ABSOLUTE/PATH/TO/agent-memory-mcp/dist/index.js"]
    }
  }
}
```

Replace the path with the actual absolute path to this project.

### Cursor

The `.cursor/mcp.json` is pre-configured for this workspace. Cursor will discover it automatically.

### OpenCode

The `opencode.json` is pre-configured for this workspace. OpenCode will discover it automatically.

## Environment variables

| Variable | Description |
|----------|-------------|
| `AGENT_MEMORY_DIR` | Storage directory (default: `~/.agent-memory-mcp`) |
| `AGENT_MEMORY_LOG_LEVEL` | `debug`, `info`, `warn`, `error` (default: `info`) |
| `OPENAI_API_KEY` | Optional: enables OpenAI `text-embedding-3-small` embeddings |
| `ANTHROPIC_API_KEY` | Optional: enables Anthropic API-based reflections |

## Available tools

- `remember` — store a memory, correction, preference, or tool outcome.
- `recall` — search memories semantically and by keyword.
- `recall_recent` — list the most recently accessed or created memories.
- `remember_correction` — store a correction tied to an existing memory.
- `remember_tool_outcome` — log success/failure, tokens, duration for a tool call.
- `get_preferences` — retrieve learned preferences, optionally filtered by key prefix.
- `set_preference` — manually set a preference.
- `get_tool_recommendations` — get ranked tool recommendations for a task.
- `get_knowledge_graph` — explore entities and relations around a topic.
- `reflect` — run self-improvement analysis.
- `update_memory_confidence` — reinforce or penalize a memory.

## Architecture

```
src/
├── index.ts              # Entry point: starts MCP stdio server
├── server.ts             # MCP Server wiring (tools, resources, prompts)
├── config.ts             # Configuration and paths
├── types.ts              # Shared types and Zod schemas
├── db/
│   ├── schema.ts         # SQLite schema
│   └── memory-store.ts   # CRUD, search, embeddings, graph persistence
├── graph/
│   └── knowledge-graph.ts # Entity/relation extraction and graph queries
├── learning/
│   ├── preference-learner.ts  # Preference extraction and updates
│   ├── tool-recommender.ts    # Tool outcome learning
│   └── self-improver.ts       # Reflection and consolidation
└── tools/
    └── memory-tools.ts   # MCP tool handlers
```

## Development

```bash
npm run dev        # run with tsx
npm run build      # compile TypeScript
npm run inspector  # test with MCP inspector
```

## License

MIT
