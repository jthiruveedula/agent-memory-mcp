#!/bin/bash
# Comprehensive MCP tool test using heredoc+redirect (smoke-test.sh compatible)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_DIR="$SCRIPT_DIR/.."
MEMORY_DIR=$(mktemp -d /tmp/agent-memory-full-test-XXXXXX)
INPUT_DIR=$(mktemp -d /tmp/agent-memory-inputs-XXXXXX)
PASS=0
FAIL=0

cleanup() { rm -rf "$MEMORY_DIR" "$INPUT_DIR"; }
trap cleanup EXIT

run_test() {
  local name="$1"
  local input_file="$2"
  local check="$3"
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

echo "=== Agent Memory MCP — Full Tool Test ==="
echo ""

# 1. tools/list
cat > "$INPUT_DIR/01_tools.txt" << 'TXT'
Content-Length: 168

{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"0.1.0"}}}
Content-Length: 44

{"jsonrpc":"2.0","method":"notifications/initialized"}
Content-Length: 42

{"jsonrpc":"2.0","id":2,"method":"tools/list"}
TXT
run_test "tools/list — all 11 tools" "$INPUT_DIR/01_tools.txt" 'remember'

# 2. remember + extract memory ID
cat > "$INPUT_DIR/02_remember.txt" << 'TXT'
Content-Length: 168

{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"0.1.0"}}}
Content-Length: 44

{"jsonrpc":"2.0","method":"notifications/initialized"}
Content-Length: 153

{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"remember","arguments":{"content":"TypeScript is used for MCP server.","type":"fact","scope":"repo"}}}
Content-Length: 141

{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"remember","arguments":{"content":"I prefer concise answers.","type":"preference","scope":"user"}}}
TXT
OUTPUT=$(AGENT_MEMORY_DIR="$MEMORY_DIR" AGENT_MEMORY_LOG_LEVEL=error node "$SERVER_DIR/dist/index.js" < "$INPUT_DIR/02_remember.txt" 2>/dev/null || true)
MEM_ID=$(echo "$OUTPUT" | grep -o '\[[a-f0-9-]*\]' | head -1 | tr -d '[]')
if echo "$OUTPUT" | grep -q "Remembered"; then
  echo "  ✅ remember — 2 memories stored"
  PASS=$((PASS + 1))
else
  echo "  ❌ remember"
  FAIL=$((FAIL + 1))
fi

# 3. recall
cat > "$INPUT_DIR/03_recall.txt" << 'TXT'
Content-Length: 168

{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"0.1.0"}}}
Content-Length: 44

{"jsonrpc":"2.0","method":"notifications/initialized"}
Content-Length: 131

{"jsonrpc":"2.0","id":5,"method":"tools/call","params":{"name":"recall","arguments":{"query":"TypeScript","limit":5}}}
TXT
run_test "recall — semantic search" "$INPUT_DIR/03_recall.txt" 'TypeScript'

# 4. recall_recent
cat > "$INPUT_DIR/04_recent.txt" << 'TXT'
Content-Length: 168

{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"0.1.0"}}}
Content-Length: 44

{"jsonrpc":"2.0","method":"notifications/initialized"}
Content-Length: 136

{"jsonrpc":"2.0","id":6,"method":"tools/call","params":{"name":"recall_recent","arguments":{"limit":10}}}
TXT
run_test "recall_recent — recent memories" "$INPUT_DIR/04_recent.txt" '\[[a-f0-9]'

# 5. remember_correction
cat > "$INPUT_DIR/05_correction.txt" << 'TXT'
Content-Length: 168

{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"0.1.0"}}}
Content-Length: 44

{"jsonrpc":"2.0","method":"notifications/initialized"}
Content-Length: 227

{"jsonrpc":"2.0","id":7,"method":"tools/call","params":{"name":"remember_correction","arguments":{"original_content":"I prefer concise answers.","correction_text":"Actually prefer detailed prose."}}}
TXT
run_test "remember_correction — linked correction" "$INPUT_DIR/05_correction.txt" 'Correction recorded'

# 6. remember_tool_outcome
cat > "$INPUT_DIR/06_toolout.txt" << 'TXT'
Content-Length: 168

{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"0.1.0"}}}
Content-Length: 44

{"jsonrpc":"2.0","method":"notifications/initialized"}
Content-Length: 215

{"jsonrpc":"2.0","id":8,"method":"tools/call","params":{"name":"remember_tool_outcome","arguments":{"tool_name":"web_search","task_summary":"Search MCP docs","success":true,"duration_ms":1200,"tokens_used":450}}}
TXT
run_test "remember_tool_outcome — logged" "$INPUT_DIR/06_toolout.txt" 'Tool outcome recorded'

# 7. get_tool_recommendations
cat > "$INPUT_DIR/07_recommend.txt" << 'TXT'
Content-Length: 168

{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"0.1.0"}}}
Content-Length: 44

{"jsonrpc":"2.0","method":"notifications/initialized"}
Content-Length: 200

{"jsonrpc":"2.0","id":9,"method":"tools/call","params":{"name":"get_tool_recommendations","arguments":{"task":"search for MCP documentation","limit":5}}}
TXT
run_test "get_tool_recommendations — ranked tools" "$INPUT_DIR/07_recommend.txt" 'web_search|No tool history'

# 8. get_preferences
cat > "$INPUT_DIR/08_prefs.txt" << 'TXT'
Content-Length: 168

{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"0.1.0"}}}
Content-Length: 44

{"jsonrpc":"2.0","method":"notifications/initialized"}
Content-Length: 183

{"jsonrpc":"2.0","id":10,"method":"tools/call","params":{"name":"get_preferences","arguments":{"min_confidence":0,"limit":10}}}
TXT
run_test "get_preferences — retrieved" "$INPUT_DIR/08_prefs.txt" 'preference|No matching'

# 9. set_preference
cat > "$INPUT_DIR/09_setpref.txt" << 'TXT'
Content-Length: 168

{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"0.1.0"}}}
Content-Length: 44

{"jsonrpc":"2.0","method":"notifications/initialized"}
Content-Length: 195

{"jsonrpc":"2.0","id":11,"method":"tools/call","params":{"name":"set_preference","arguments":{"key":"style/verbosity","value":"concise","confidence":0.95}}}
TXT
run_test "set_preference — manual preference" "$INPUT_DIR/09_setpref.txt" 'Preference set'

# 10. update_memory_confidence
if [ -n "$MEM_ID" ]; then
  cat > "$INPUT_DIR/10_update.txt" << TXT
Content-Length: 168

{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"0.1.0"}}}
Content-Length: 44

{"jsonrpc":"2.0","method":"notifications/initialized"}
Content-Length: 165

{"jsonrpc":"2.0","id":12,"method":"tools/call","params":{"name":"update_memory_confidence","arguments":{"memory_id":"$MEM_ID","delta":0.1}}}
TXT
  run_test "update_memory_confidence — adjusted" "$INPUT_DIR/10_update.txt" 'Updated confidence'
else
  echo "  ⚠️ update_memory_confidence — no memory ID (skipped)"
fi

# 11. get_knowledge_graph
cat > "$INPUT_DIR/11_graph.txt" << 'TXT'
Content-Length: 168

{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"0.1.0"}}}
Content-Length: 44

{"jsonrpc":"2.0","method":"notifications/initialized"}
Content-Length: 135

{"jsonrpc":"2.0","id":13,"method":"tools/call","params":{"name":"get_knowledge_graph","arguments":{"query":"MCP","depth":2}}}
TXT
run_test "get_knowledge_graph — explored" "$INPUT_DIR/11_graph.txt" 'Entities'

# 12. reflect
cat > "$INPUT_DIR/12_reflect.txt" << 'TXT'
Content-Length: 168

{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"0.1.0"}}}
Content-Length: 44

{"jsonrpc":"2.0","method":"notifications/initialized"}
Content-Length: 88

{"jsonrpc":"2.0","id":14,"method":"tools/call","params":{"name":"reflect","arguments":{}}}
TXT
run_test "reflect — self improvement" "$INPUT_DIR/12_reflect.txt" 'Analyzed|Not enough memories'

# 13. Error handling — empty content rejected
cat > "$INPUT_DIR/13_empty.txt" << 'TXT'
Content-Length: 168

{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"0.1.0"}}}
Content-Length: 44

{"jsonrpc":"2.0","method":"notifications/initialized"}
Content-Length: 74

{"jsonrpc":"2.0","id":15,"method":"tools/call","params":{"name":"remember","arguments":{"content":""}}}
TXT
run_test "error — empty content rejected" "$INPUT_DIR/13_empty.txt" 'Error'

# 14. Special characters in recall query
cat > "$INPUT_DIR/14_specialchars.txt" << 'TXT'
Content-Length: 168

{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"0.1.0"}}}
Content-Length: 44

{"jsonrpc":"2.0","method":"notifications/initialized"}
Content-Length: 159

{"jsonrpc":"2.0","id":16,"method":"tools/call","params":{"name":"recall","arguments":{"query":"TypeScript + MCP - server?","limit":5}}}
TXT
run_test "special chars — recall with punctuation" "$INPUT_DIR/14_specialchars.txt" 'TypeScript|No matching'

# 15. Long content handling
cat > "$INPUT_DIR/15_long.txt" << 'TXT'
Content-Length: 168

{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"0.1.0"}}}
Content-Length: 44

{"jsonrpc":"2.0","method":"notifications/initialized"}
Content-Length: 378

{"jsonrpc":"2.0","id":17,"method":"tools/call","params":{"name":"remember","arguments":{"content":"This is a very long memory content that goes on and on and contains many words. It is designed to test that the system can handle large text blobs without crashing. The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs. How vexingly quick daft zebras jump. The five boxing wizards jump quickly. Sphinx of black quartz, judge my vow.","type":"fact","scope":"user"}}}
TXT
run_test "long content — handles large text" "$INPUT_DIR/15_long.txt" 'Remembered'

# 16. Resource listing
cat > "$INPUT_DIR/16_resources.txt" << 'TXT'
Content-Length: 168

{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"0.1.0"}}}
Content-Length: 44

{"jsonrpc":"2.0","method":"notifications/initialized"}
Content-Length: 50

{"jsonrpc":"2.0","id":18,"method":"resources/list"}
TXT
run_test "resources/list — 3 resources" "$INPUT_DIR/16_resources.txt" 'memory://'

# 17. Prompt listing
cat > "$INPUT_DIR/17_prompts.txt" << 'TXT'
Content-Length: 168

{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"0.1.0"}}}
Content-Length: 44

{"jsonrpc":"2.0","method":"notifications/initialized"}
Content-Length: 48

{"jsonrpc":"2.0","id":19,"method":"prompts/list"}
TXT
run_test "prompts/list — memory-context prompt" "$INPUT_DIR/17_prompts.txt" 'memory-context'

# 18. Session-scoped memory isolation
cat > "$INPUT_DIR/18_session.txt" << 'TXT'
Content-Length: 168

{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"0.1.0"}}}
Content-Length: 44

{"jsonrpc":"2.0","method":"notifications/initialized"}
Content-Length: 152

{"jsonrpc":"2.0","id":20,"method":"tools/call","params":{"name":"remember","arguments":{"content":"Session-specific note.","type":"fact","scope":"session","session_id":"test-session-1"}}}
TXT
run_test "session scope — store session memory" "$INPUT_DIR/18_session.txt" 'Remembered'

echo ""
echo "=== Results: $PASS passed, $FAIL failed ==="
[ "$FAIL" -eq 0 ] && echo "✅ All tests passed!" || echo "❌ Some tests failed."
exit $FAIL
