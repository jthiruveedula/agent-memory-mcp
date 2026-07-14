#!/bin/bash
# Smoke test for Agent Memory MCP
# This script sends test MCP messages and verifies responses.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_DIR="$SCRIPT_DIR/.."
MEMORY_DIR=$(mktemp -d /tmp/agent-memory-smoke-XXXXXX)
INPUT_FILE=$(mktemp /tmp/mcp-smoke-input-XXXXXX.json)

cleanup() {
  rm -f "$INPUT_FILE"
  rm -rf "$MEMORY_DIR"
}
trap cleanup EXIT

# Build messages
cat > "$INPUT_FILE" << 'EOF'
Content-Length: 168

{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"smoke-test","version":"0.1.0"}}}
Content-Length: 44

{"jsonrpc":"2.0","method":"notifications/initialized"}
Content-Length: 175

{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"remember","arguments":{"content":"I prefer concise answers with bullets.","type":"preference","scope":"user"}}}
Content-Length: 135

{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"recall","arguments":{"query":"concise answers","limit":5}}}
EOF

OUTPUT=$(AGENT_MEMORY_DIR="$MEMORY_DIR" AGENT_MEMORY_LOG_LEVEL=error node "$SERVER_DIR/dist/index.js" < "$INPUT_FILE")

if echo "$OUTPUT" | grep -q "Remembered" && echo "$OUTPUT" | grep -q "concise answers with bullets"; then
  echo "✅ Smoke test passed: MCP server remembers and recalls."
  exit 0
else
  echo "❌ Smoke test failed"
  echo "$OUTPUT"
  exit 1
fi
