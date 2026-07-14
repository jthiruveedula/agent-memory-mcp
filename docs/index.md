---
layout: default
title: Agent Memory MCP — Usage Guide
---

# Agent Memory MCP — Usage Guide

This guide shows you how to install, configure, and use the Agent Memory MCP server across Claude, OpenCode, Copilot, and Cursor.

---

## Table of contents

1. [What it does](#what-it-does)
2. [Install](#install)
3. [Configure your editor / assistant](#configure-your-editor--assistant)
4. [Environment variables](#environment-variables)
5. [Core workflow](#core-workflow)
6. [Tool reference](#tool-reference)
7. [Resources and prompts](#resources-and-prompts)
8. [Best practices](#best-practices)
9. [Troubleshooting](#troubleshooting)

---

## What it does

Agent Memory MCP is a local, self-improving memory server that runs as an [MCP (Model Context Protocol)](https://modelcontextprotocol.io) stdio server. It stores memories in SQLite under `~/.agent-memory-mcp/` and makes them available to every workspace, project, or assistant you connect it to.

Key capabilities:

- **Remember** facts, preferences, code patterns, and workflows.
- **Recall** memories with semantic similarity and full-text search.
- **Knowledge graph** automatically extracts entities and relations.
- **Preference learning** turns statements and corrections into preferences.
- **Tool recommendations** rank tools by historical success, speed, and token usage.
- **Reflection** merges duplicates, flags low-confidence memories, and surfaces insights.

---

## Install

```bash
git clone https://github.com/jthiruveedula/agent-memory-mcp.git
cd agent-memory-mcp
npm install
npm run build
```

Verify the build:

```bash
node dist/index.js
# Should output: [info] Agent Memory MCP server starting on stdio
```

Stop it with `Ctrl+C`.

---

## Configure your editor / assistant

The repository includes ready-to-use config files for each platform.

### VS Code (GitHub Copilot)

`.vscode/mcp.json` is already in the repo. Copilot will discover it automatically.

### Claude Code CLI

`.claude/settings.json` is already in the repo. Restart Claude Code if needed.

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

### Cursor

`.cursor/mcp.json` is already in the repo. Cursor will discover it on restart.

### OpenCode

`opencode.json` is already in the repo. OpenCode will discover it on restart.

---

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `AGENT_MEMORY_DIR` | `~/.agent-memory-mcp` | Where the SQLite database lives |
| `AGENT_MEMORY_LOG_LEVEL` | `info` | `debug`, `info`, `warn`, `error` |
| `OPENAI_API_KEY` | — | Optional; enables OpenAI `text-embedding-3-small` |
| `OPENAI_EMBEDDING_MODEL` | `text-embedding-3-small` | Which OpenAI embedding model to use |
| `ANTHROPIC_API_KEY` | — | Optional; enables Anthropic-based reflections |

Set them before launching the server, for example:

```bash
export AGENT_MEMORY_DIR="$HOME/.agent-memory-mcp"
export AGENT_MEMORY_LOG_LEVEL=debug
```

---

## Core workflow

### 1. Store a preference

Ask your assistant to remember a preference:

> "Remember that I prefer concise answers with bullets."

Or call the tool directly:

```json
{
  "tool": "remember",
  "arguments": {
    "content": "I prefer concise answers with bullets.",
    "type": "preference",
    "scope": "user"
  }
}
```

### 2. Log a tool outcome

After a tool call, log whether it succeeded and how expensive it was:

```json
{
  "tool": "remember_tool_outcome",
  "arguments": {
    "tool_name": "web_search",
    "task_summary": "Search MCP specification",
    "success": true,
    "duration_ms": 850,
    "tokens_used": 1200
  }
}
```

### 3. Recall relevant context

When starting a new task, recall what you have already learned:

```json
{
  "tool": "recall",
  "arguments": {
    "query": "concise answers",
    "limit": 5,
    "min_confidence": 0.5
  }
}
```

### 4. Correct outdated memories

If a memory is wrong, correct it:

```json
{
  "tool": "remember_correction",
  "arguments": {
    "original_content": "I prefer concise answers with bullets.",
    "correction_text": "Actually, I prefer short paragraphs over bullets.",
    "context": "README editing"
  }
}
```

### 5. Reflect periodically

Run reflection to merge duplicates and surface insights:

```json
{
  "tool": "reflect"
}
```

---

## Tool reference

| Tool | When to use |
|------|-------------|
| `remember` | Store any memory, fact, preference, or code pattern. |
| `recall` | Search memories by text or meaning. |
| `recall_recent` | List recently accessed memories. |
| `remember_correction` | Record a correction and lower the confidence of the old memory. |
| `remember_tool_outcome` | Log success/failure and token usage for tool calls. |
| `get_tool_recommendations` | Get ranked tool suggestions for a task. |
| `get_preferences` | Retrieve learned preferences. |
| `set_preference` | Manually set a preference with high confidence. |
| `get_knowledge_graph` | Explore the entity/relation graph around a topic. |
| `reflect` | Run self-improvement analysis. |
| `update_memory_confidence` | Reinforce or penalize a memory by ID. |

---

## Resources and prompts

The server exposes three resources and one prompt that MCP clients can pull:

- `memory://preferences` — all learned preferences as JSON.
- `memory://recent` — recent memories as JSON.
- `memory://stats` — database statistics as JSON.
- `memory-context` prompt — injects relevant memories and preferences for a task.

---

## Best practices

1. **Scope intentionally**
   - `user` — global across all workspaces.
   - `repo` — tied to a specific repository.
   - `session` — short-lived, tied to a conversation.

2. **Be specific in recall queries** — short, topic-focused queries return better results than vague ones.

3. **Log tool outcomes after every meaningful tool call** — the recommender improves as it accumulates success/duration/token data.

4. **Apply corrections promptly** — corrections update confidence and extract preferences automatically.

5. **Run `reflect` daily or after large batches of memories** — it keeps the database clean and surfaces useful insights.

6. **Back up the database** — copy `~/.agent-memory-mcp/memories.db` and its `-wal`/`-shm` files to another location.

---

## Troubleshooting

### Server fails to start

```bash
npm run build
node dist/index.js
```

Check the log level with `AGENT_MEMORY_LOG_LEVEL=debug`.

### `SQLITE_MISMATCH` or schema errors

The server now uses schema versioning. If you have a very old database, stop the server and delete the database files:

```bash
rm -f ~/.agent-memory-mcp/memories.db ~/.agent-memory-mcp/memories.db-*
```

Then restart.

### Assistant cannot find tools

- Ensure the MCP config points to the absolute path of `dist/index.js`.
- Restart the assistant / editor after editing the config.
- Check that `npm run build` produced `dist/index.js`.

### Recall returns unrelated results

- Use `repo_path` or `scope` filters.
- Raise `min_confidence` to filter out weak memories.
- Apply corrections to bad memories so their confidence drops.

### Large database

Run `reflect` to merge duplicates and consider deleting old `session` scoped memories.

---

## Next steps

- Read the [README](https://github.com/jthiruveedula/agent-memory-mcp#readme)
- Run the test suites: `npm test`
- Explore the code in `src/`

_Last updated: July 14, 2026_
