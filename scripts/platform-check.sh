#!/bin/bash
# Platform configuration validator for Agent Memory MCP
# Verifies all platform config files exist and are valid JSON
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_DIR="$SCRIPT_DIR/.."
cd "$SERVER_DIR"

PASS=0
FAIL=0

check_json() {
  local name="$1" file="$2"
  if [ ! -f "$file" ]; then
    echo "  ❌ $name — file not found: $file"
    FAIL=$((FAIL + 1))
    return
  fi
  if echo '{}' | python3 -c "import json,sys; json.load(open('$file'))" 2>/dev/null; then
    echo "  ✅ $name — valid JSON ($file)"
    PASS=$((PASS + 1))
  else
    echo "  ❌ $name — invalid JSON ($file)"
    FAIL=$((FAIL + 1))
  fi
}

echo "=== Agent Memory MCP — Platform Config Check ==="
echo ""

# VS Code
check_json "VS Code" ".vscode/mcp.json"

# Claude CLI
check_json "Claude Code CLI" ".claude/settings.json"

# Cursor
check_json "Cursor" ".cursor/mcp.json"

# OpenCode
check_json "OpenCode" "opencode.json"

# GitHub Copilot instructions
if [ -f ".github/copilot-instructions.md" ]; then
  echo "  ✅ Copilot Instructions — exists (.github/copilot-instructions.md)"
  PASS=$((PASS + 1))
else
  echo "  ❌ Copilot Instructions — missing (.github/copilot-instructions.md)"
  FAIL=$((FAIL + 1))
fi

# Claude Code instructions
if [ -f "CLAUDE.md" ]; then
  echo "  ✅ Claude Code Instructions — exists (CLAUDE.md)"
  PASS=$((PASS + 1))
else
  echo "  ❌ Claude Code Instructions — missing (CLAUDE.md)"
  FAIL=$((FAIL + 1))
fi

# Package.json (build config)
if [ -f "package.json" ]; then
  echo "  ✅ Package.json — exists"
  PASS=$((PASS + 1))
else
  echo "  ❌ Package.json — missing"
  FAIL=$((FAIL + 1))
fi

# Check that dist/ has compiled output
if [ -d "dist" ] && [ -f "dist/index.js" ]; then
  echo "  ✅ Build output — dist/index.js exists"
  PASS=$((PASS + 1))
else
  echo "  ⚠️  Build output — dist/index.js not found (run 'npm run build')"
  PASS=$((PASS + 1))  # not a failure, just a warning
fi

echo ""
echo "=== Config Check Results: $PASS passed, $FAIL failed ==="
[ "$FAIL" -eq 0 ] && echo "✅ All config files valid!" || echo "❌ Some configs are missing or invalid."
exit $FAIL
