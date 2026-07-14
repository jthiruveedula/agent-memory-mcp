#!/bin/bash
# Stress test for Agent Memory MCP
# Tests rapid inserts, large payloads, and mixed operations
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_DIR="$SCRIPT_DIR/.."
MEMORY_DIR=$(mktemp -d /tmp/agent-memory-stress-XXXXXX)
INPUT_DIR=$(mktemp -d /tmp/agent-memory-stress-inputs-XXXXXX)
PASS=0
FAIL=0

cleanup() { rm -rf "$MEMORY_DIR" "$INPUT_DIR"; }
trap cleanup EXIT

run_test() {
  local name="$1" input_file="$2" check="$3"
  local output
  output=$(AGENT_MEMORY_DIR="$MEMORY_DIR" AGENT_MEMORY_LOG_LEVEL=error node "$SERVER_DIR/dist/index.js" < "$input_file" 2>/dev/null || true)
  if echo "$output" | grep -qE "$check"; then
    echo "  ✅ $name"
    PASS=$((PASS + 1))
  else
    echo "  ❌ $name"
    echo "     Expected: $check"
    echo "     Got: $(echo "$output" | head -3 | tr '\n' ' ' | head -c 300)"
    FAIL=$((FAIL + 1))
  fi
}

echo "=== Agent Memory MCP — Stress Test ==="
echo ""

# ==============================
# 1. Bulky: initialize + 20 remembers in one stream
# ==============================
{
  # Init
  echo 'Content-Length: 168'
  echo ''
  echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"stress-test","version":"0.1.0"}}}'
  echo 'Content-Length: 44'
  echo ''
  echo '{"jsonrpc":"2.0","method":"notifications/initialized"}'

  # 20 remembers
  for i in $(seq 1 20); do
    ID=$((i + 1))
    BODY='{"jsonrpc":"2.0","id":'$ID',"method":"tools/call","params":{"name":"remember","arguments":{"content":"Stress test memory number '$i'. This is a test payload for stress testing.","type":"fact","scope":"user"}}}'
    echo "Content-Length: ${#BODY}"
    echo ''
    echo "$BODY"
  done
} > "$INPUT_DIR/01_bulk.txt"

run_test "bulk remember — 20 rapid inserts" "$INPUT_DIR/01_bulk.txt" 'Remembered'

# ==============================
# 2. Burst: 5 recall queries in one stream
# ==============================
{
  echo 'Content-Length: 168'
  echo ''
  echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"stress-test","version":"0.1.0"}}}'
  echo 'Content-Length: 44'
  echo ''
  echo '{"jsonrpc":"2.0","method":"notifications/initialized"}'

  for term in "memory" "stress" "test" "payload" "number"; do
    BODY='{"jsonrpc":"2.0","id":'$RANDOM',"method":"tools/call","params":{"name":"recall","arguments":{"query":"'"$term"'","limit":5}}}'
    echo "Content-Length: ${#BODY}"
    echo ''
    echo "$BODY"
  done
} > "$INPUT_DIR/02_recall_burst.txt"

run_test "recall burst — 5 concurrent queries" "$INPUT_DIR/02_recall_burst.txt" 'memory|stress|test'

# ==============================
# 3. Large 4KB content payload
# ==============================
LARGE=$(python3 -c "print('Large test payload. ' * 200, end='')" 2>/dev/null || yes "Large test payload. " | head -n 200 | tr -d '\n')
{
  echo 'Content-Length: 168'
  echo ''
  echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"stress-test","version":"0.1.0"}}}'
  echo 'Content-Length: 44'
  echo ''
  echo '{"jsonrpc":"2.0","method":"notifications/initialized"}'

  BODY='{"jsonrpc":"2.0","id":101,"method":"tools/call","params":{"name":"remember","arguments":{"content":"'"$LARGE"'","type":"fact","scope":"user"}}}'
  echo "Content-Length: ${#BODY}"
  echo ''
  echo "$BODY"
} > "$INPUT_DIR/03_large.txt"

run_test "large payload — 4KB content" "$INPUT_DIR/03_large.txt" 'Remembered'

# ==============================
# 4. Mixed tool operations
# ==============================
{
  echo 'Content-Length: 168'
  echo ''
  echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"stress-test","version":"0.1.0"}}}'
  echo 'Content-Length: 44'
  echo ''
  echo '{"jsonrpc":"2.0","method":"notifications/initialized"}'

  for op in \
    '{"jsonrpc":"2.0","id":201,"method":"tools/call","params":{"name":"remember","arguments":{"content":"Mixed op memory.","type":"fact","scope":"user"}}}' \
    '{"jsonrpc":"2.0","id":202,"method":"tools/call","params":{"name":"recall","arguments":{"query":"mixed","limit":3}}}' \
    '{"jsonrpc":"2.0","id":203,"method":"tools/call","params":{"name":"set_preference","arguments":{"key":"test/stress","value":"completed","confidence":0.9}}}' \
    '{"jsonrpc":"2.0","id":204,"method":"tools/call","params":{"name":"get_preferences","arguments":{"prefix":"test/"}}}'; do
    echo "Content-Length: ${#op}"
    echo ''
    echo "$op"
  done
} > "$INPUT_DIR/04_mixed.txt"

run_test "mixed ops — 4 different tools" "$INPUT_DIR/04_mixed.txt" 'Remembered|completed'

# ==============================
# 5. Recall consistency after bulk inserts
# ==============================
{
  echo 'Content-Length: 168'
  echo ''
  echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"stress-test","version":"0.1.0"}}}'
  echo 'Content-Length: 44'
  echo ''
  echo '{"jsonrpc":"2.0","method":"notifications/initialized"}'

  BODY='{"jsonrpc":"2.0","id":301,"method":"tools/call","params":{"name":"recall","arguments":{"query":"stress test","limit":10}}}'
  echo "Content-Length: ${#BODY}"
  echo ''
  echo "$BODY"
} > "$INPUT_DIR/05_consistency.txt"

run_test "recall consistency — same query after inserts" "$INPUT_DIR/05_consistency.txt" 'Stress test memory'

# ==============================
# 6. Knowledge graph with existing data
# ==============================
{
  echo 'Content-Length: 168'
  echo ''
  echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"stress-test","version":"0.1.0"}}}'
  echo 'Content-Length: 44'
  echo ''
  echo '{"jsonrpc":"2.0","method":"notifications/initialized"}'

  BODY='{"jsonrpc":"2.0","id":401,"method":"tools/call","params":{"name":"get_knowledge_graph","arguments":{"query":"stress","depth":2,"limit":10}}}'
  echo "Content-Length: ${#BODY}"
  echo ''
  echo "$BODY"
} > "$INPUT_DIR/06_kg.txt"

run_test "knowledge graph — query with data" "$INPUT_DIR/06_kg.txt" 'Entities'

echo ""
echo "=== Stress Test Results: $PASS passed, $FAIL failed ==="
[ "$FAIL" -eq 0 ] && echo "✅ All stress tests passed!" || echo "❌ Some stress tests failed."
exit $FAIL
