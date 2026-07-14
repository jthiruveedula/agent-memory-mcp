---
layout: default
title: Agent Memory MCP — Usage Guide
description: Self-improving agent memory server with knowledge graphs, preference learning, and tool recommendations.
---

<!-- ==========================================================================
     HERO SECTION
     ========================================================================== -->
<section class="hero" aria-labelledby="hero-title">
  <div class="container">
    <div class="hero-content">
      <span class="hero-badge">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M12 6v6l4 2"></path>
        </svg>
        v0.1.0 • Self-improving agent memory
      </span>
      <h1 id="hero-title">Agent Memory MCP</h1>
      <p class="hero-subtitle">
        A local, self-improving memory server for AI assistants. Captures, organizes, and shares memories across all your workspaces — builds a personal knowledge graph, learns your preferences, and recommends the right tools to limit token usage.
      </p>
      <div class="hero-actions">
        <a href="#install" class="btn btn-primary">
          <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          Get Started
        </a>
        <a href="https://github.com/jthiruveedula/agent-memory-mcp" class="btn btn-secondary" target="_blank" rel="noopener">
          <svg class="btn-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.536-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
          </svg>
          GitHub
        </a>
      </div>
      <div class="hero-stats">
        <div class="stat-item">
          <div class="stat-value">11</div>
          <div class="stat-label">MCP Tools</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">∞</div>
          <div class="stat-label">Cross-workspace</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">32</div>
          <div class="stat-label">Tests Passing</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">MIT</div>
          <div class="stat-label">Open Source</div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ==========================================================================
     FEATURES SECTION
     ========================================================================== -->
<section id="features" class="section reveal" aria-labelledby="features-title">
  <div class="container">
    <header class="section-header">
      <span class="section-tag">Capabilities</span>
      <h2 id="features-title" class="section-title">What It Does</h2>
      <p class="section-desc">Six core capabilities that make your assistant smarter every session.</p>
    </header>

    <div class="features-grid stagger-children">
      <article class="feature-card reveal">
        <div class="feature-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
        </div>
        <h3 class="feature-title">Semantic + Keyword Recall</h3>
        <p class="feature-desc">SQLite FTS5 full-text search plus lightweight vector similarity. Find memories by exact terms or conceptual meaning.</p>
      </article>

      <article class="feature-card reveal">
        <div class="feature-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="2" y1="12" x2="22" y2="12"></line>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
          </svg>
        </div>
        <h3 class="feature-title">Personal Knowledge Graph</h3>
        <p class="feature-desc">Auto-extracts entities and relations from memories. Explore connections like a personal CodeGraph — see how concepts link across your work.</p>
      </article>

      <article class="feature-card reveal">
        <div class="feature-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
        </div>
        <h3 class="feature-title">Preference Learning</h3>
        <p class="feature-desc">Learns style, formatting, workflow, and tool-selection preferences from explicit statements and corrections. Adapts to how you work.</p>
      </article>

      <article class="feature-card reveal">
        <div class="feature-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <line x1="18" y1="20" x2="18" y2="10"></line>
            <line x1="12" y1="20" x2="12" y2="4"></line>
            <line x1="6" y1="20" x2="6" y2="14"></line>
          </svg>
        </div>
        <h3 class="feature-title">Tool Recommender</h3>
        <p class="feature-desc">Logs tool outcomes (success, tokens, duration) and ranks recommendations by historical performance. Optimizes token usage automatically.</p>
      </article>

      <article class="feature-card reveal">
        <div class="feature-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
          </svg>
        </div>
        <h3 class="feature-title">Continuous Correction</h3>
        <p class="feature-desc">Corrections link to memories, penalize confidence, and extract new preferences. Wrong memories fade; right ones strengthen.</p>
      </article>

      <article class="feature-card reveal">
        <div class="feature-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M23 4v6"></path>
            <path d="M1 20v-6"></path>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10"></path>
            <path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14"></path>
          </svg>
        </div>
        <h3 class="feature-title">Self-Improvement</h3>
        <p class="feature-desc">Run <code>reflect</code> to merge duplicates, surface insights, flag low-confidence memories, and update preferences automatically.</p>
      </article>
    </div>
  </div>
</section>

<!-- ==========================================================================
     INSTALL SECTION
     ========================================================================== -->
<section id="install" class="section install-section reveal" aria-labelledby="install-title">
  <div class="container">
    <header class="section-header">
      <span class="section-tag">Installation</span>
      <h2 id="install-title" class="section-title">Quick Start</h2>
      <p class="section-desc">Clone, build, and connect to your favorite MCP client in under a minute.</p>
    </header>

    <div class="install-tabs" role="tablist" aria-label="Installation methods">
      <button class="install-tab tab-btn active" role="tab" aria-selected="true" data-tab="panel-cli" id="tab-cli">CLI</button>
      <button class="install-tab tab-btn" role="tab" aria-selected="false" data-tab="panel-vscode" id="tab-vscode">VS Code</button>
      <button class="install-tab tab-btn" role="tab" aria-selected="false" data-tab="panel-claude" id="tab-claude">Claude Desktop</button>
      <button class="install-tab tab-btn" role="tab" aria-selected="false" data-tab="panel-cursor" id="tab-cursor">Cursor</button>
      <button class="install-tab tab-btn" role="tab" aria-selected="false" data-tab="panel-opencode" id="tab-opencode">OpenCode</button>
    </div>

    <div id="panel-cli" class="install-panel tab-panel active" role="tabpanel" aria-labelledby="tab-cli">
      <div class="code-block">
        <div class="code-header">
          <span class="code-lang">bash</span>
          <button class="code-copy" aria-label="Copy to clipboard"></button>
        </div>
        <pre class="code-content"><code>git clone https://github.com/jthiruveedula/agent-memory-mcp.git
cd agent-memory-mcp
npm install
npm run build
node dist/index.js</code></pre>
      </div>
      <p style="margin-top: var(--space-md); color: var(--color-fg-muted);">
        Server starts on stdio. Press <kbd style="background: var(--color-bg); padding: 2px 6px; border-radius: var(--radius-sm); border: 1px solid var(--color-border);">Ctrl+C</kbd> to stop.
      </p>
    </div>

    <div id="panel-vscode" class="install-panel tab-panel" role="tabpanel" aria-labelledby="tab-vscode">
      <p style="margin-bottom: var(--space-md); color: var(--color-fg-muted);">The <code>.vscode/mcp.json</code> is pre-configured. GitHub Copilot discovers it automatically.</p>
      <div class="code-block">
        <div class="code-header">
          <span class="code-lang">json</span>
          <button class="code-copy" aria-label="Copy to clipboard"></button>
        </div>
        <pre class="code-content"><code>{
  "servers": {
    "agent-memory": {
      "type": "stdio",
      "command": "node",
      "args": ["${workspaceFolder}/dist/index.js"]
    }
  }
}</code></pre>
      </div>
    </div>

    <div id="panel-claude" class="install-panel tab-panel" role="tabpanel" aria-labelledby="tab-claude">
      <p style="margin-bottom: var(--space-md); color: var(--color-fg-muted);">Add to <code>~/Library/Application Support/Claude/settings.json</code> (macOS) or <code>%APPDATA%\Claude\settings.json</code> (Windows).</p>
      <div class="code-block">
        <div class="code-header">
          <span class="code-lang">json</span>
          <button class="code-copy" aria-label="Copy to clipboard"></button>
        </div>
        <pre class="code-content"><code>{
  "mcpServers": {
    "agent-memory": {
      "command": "node",
      "args": ["/ABSOLUTE/PATH/TO/agent-memory-mcp/dist/index.js"]
    }
  }
}</code></pre>
      </div>
    </div>

    <div id="panel-cursor" class="install-panel tab-panel" role="tabpanel" aria-labelledby="tab-cursor">
      <p style="margin-bottom: var(--space-md); color: var(--color-fg-muted);">The <code>.cursor/mcp.json</code> is pre-configured. Restart Cursor to discover.</p>
      <div class="code-block">
        <div class="code-header">
          <span class="code-lang">json</span>
          <button class="code-copy" aria-label="Copy to clipboard"></button>
        </div>
        <pre class="code-content"><code>{
  "mcpServers": {
    "agent-memory": {
      "command": "node",
      "args": ["${workspaceFolder}/dist/index.js"]
    }
  }
}</code></pre>
      </div>
    </div>

    <div id="panel-opencode" class="install-panel tab-panel" role="tabpanel" aria-labelledby="tab-opencode">
      <p style="margin-bottom: var(--space-md); color: var(--color-fg-muted);">The <code>opencode.json</code> is pre-configured. OpenCode discovers it on restart.</p>
      <div class="code-block">
        <div class="code-header">
          <span class="code-lang">json</span>
          <button class="code-copy" aria-label="Copy to clipboard"></button>
        </div>
        <pre class="code-content"><code>{
  "mcpServers": {
    "agent-memory": {
      "command": "node",
      "args": ["${workspaceFolder}/dist/index.js"]
    }
  }
}</code></pre>
      </div>
    </div>
  </div>
</section>

<!-- ==========================================================================
     USAGE WORKFLOW
     ========================================================================== -->
<section id="usage" class="section reveal" aria-labelledby="usage-title">
  <div class="container">
    <header class="section-header">
      <span class="section-tag">Core Workflow</span>
      <h2 id="usage-title" class="section-title">How It Works</h2>
      <p class="section-desc">Five simple steps to make your assistant smarter every session.</p>
    </header>

    <div class="usage-steps stagger-children">
      <article class="step-card reveal" data-step="1">
        <h3 class="step-title">Remember</h3>
        <p class="step-desc">Store facts, preferences, code patterns, or workflow insights. The server extracts entities and learns preferences automatically.</p>
        <pre class="step-code"><code>{
  "tool": "remember",
  "arguments": {
    "content": "I prefer flat error handling over throwing.",
    "type": "preference",
    "scope": "user"
  }
}</code></pre>
      </article>

      <article class="step-card reveal" data-step="2">
        <h3 class="step-title">Log Outcomes</h3>
        <p class="step-desc">After tool calls, log success/failure, duration, and tokens. The recommender uses this to optimize future suggestions.</p>
        <pre class="step-code"><code>{
  "tool": "remember_tool_outcome",
  "arguments": {
    "tool_name": "grep_search",
    "task_summary": "Find helper usages",
    "success": true,
    "duration_ms": 120,
    "tokens_used": 200
  }
}</code></pre>
      </article>

      <article class="step-card reveal" data-step="3">
        <h3 class="step-title">Recall</h3>
        <p class="step-desc">Search memories by semantic similarity or keywords. Filter by scope, type, repo, or confidence threshold.</p>
        <pre class="step-code"><code>{
  "tool": "recall",
  "arguments": {
    "query": "error handling preference",
    "limit": 5,
    "min_confidence": 0.5
  }
}</code></pre>
      </article>

      <article class="step-card reveal" data-step="4">
        <h3 class="step-title">Correct</h3>
        <p class="step-desc">Fix outdated memories. Corrections lower old confidence and extract new preferences automatically.</p>
        <pre class="step-code"><code>{
  "tool": "remember_correction",
  "arguments": {
    "original_content": "I prefer flat error handling.",
    "correction_text": "Actually, I prefer Result<T, E> types.",
    "context": "Rust project"
  }
}</code></pre>
      </article>

      <article class="step-card reveal" data-step="5">
        <h3 class="step-title">Reflect</h3>
        <p class="step-desc">Run periodically to merge duplicates, surface insights, and update preferences. Keeps memory clean and useful.</p>
        <pre class="step-code"><code>{
  "tool": "reflect",
  "arguments": {}
}</code></pre>
      </article>
    </div>
  </div>
</section>

<!-- ==========================================================================
     API REFERENCE
     ========================================================================== -->
<section id="api" class="section reveal" aria-labelledby="api-title">
  <div class="container">
    <header class="section-header">
      <span class="section-tag">Tool Reference</span>
      <h2 id="api-title" class="section-title">All 11 MCP Tools</h2>
      <p class="section-desc">Complete reference for every tool the server exposes.</p>
    </header>

    <div class="api-table-wrapper">
      <table class="api-table">
        <thead>
          <tr>
            <th>Tool</th>
            <th>Description</th>
            <th>Key Arguments</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>remember</code></td>
            <td>Store a memory, fact, preference, code pattern, or workflow insight. Extracts KG and learns preferences.</td>
            <td><code>content</code>, <code>type</code>, <code>scope</code>, <code>confidence</code></td>
          </tr>
          <tr>
            <td><code>recall</code></td>
            <td>Search memories by semantic similarity and FTS5 full-text search.</td>
            <td><code>query</code>, <code>type</code>, <code>scope</code>, <code>limit</code>, <code>min_confidence</code></td>
          </tr>
          <tr>
            <td><code>recall_recent</code></td>
            <td>List recently accessed or created memories.</td>
            <td><code>limit</code>, <code>scope</code>, <code>repo_path</code></td>
          </tr>
          <tr>
            <td><code>remember_correction</code></td>
            <td>Record a correction linked to a memory by ID or content match. Penalizes confidence and extracts preferences.</td>
            <td><code>correction_text</code>, <code>memory_id</code>, <code>original_content</code></td>
          </tr>
          <tr>
            <td><code>remember_tool_outcome</code></td>
            <td>Log tool call result (success, tokens, duration) for future recommendations.</td>
            <td><code>tool_name</code>, <code>task_summary</code>, <code>success</code>, <code>duration_ms</code>, <code>tokens_used</code></td>
          </tr>
          <tr>
            <td><code>get_preferences</code></td>
            <td>Retrieve learned preferences, filterable by key prefix or exact key.</td>
            <td><code>prefix</code>, <code>key</code>, <code>min_confidence</code>, <code>limit</code></td>
          </tr>
          <tr>
            <td><code>set_preference</code></td>
            <td>Manually set a preference with high confidence.</td>
            <td><code>key</code>, <code>value</code>, <code>confidence</code></td>
          </tr>
          <tr>
            <td><code>get_tool_recommendations</code></td>
            <td>Get ranked tool recommendations for a task based on historical success, token usage, speed, and similarity.</td>
            <td><code>task</code>, <code>context</code>, <code>limit</code></td>
          </tr>
          <tr>
            <td><code>get_knowledge_graph</code></td>
            <td>Explore entities and relations around a query.</td>
            <td><code>query</code>, <code>depth</code>, <code>limit</code></td>
          </tr>
          <tr>
            <td><code>reflect</code></td>
            <td>Run self-improvement: merge duplicates, extract prefs, flag low confidence, surface insights.</td>
            <td><code>workspace</code>, <code>repo_path</code>, <code>since</code></td>
          </tr>
          <tr>
            <td><code>update_memory_confidence</code></td>
            <td>Reinforce or penalize a memory's confidence score by ID.</td>
            <td><code>memory_id</code>, <code>delta</code>, <code>reason</code></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</section>

<!-- ==========================================================================
     RESOURCES & PROMPTS
     ========================================================================== -->
<section class="section reveal" aria-labelledby="resources-title">
  <div class="container">
    <header class="section-header">
      <span class="section-tag">MCP Resources & Prompts</span>
      <h2 id="resources-title" class="section-title">Context Injection</h2>
      <p class="section-desc">The server exposes resources and a prompt that MCP clients can pull into context automatically.</p>
    </header>

    <div class="resources-grid stagger-children">
      <article class="resource-card reveal">
        <span class="resource-type">Resource</span>
        <h3 class="resource-title">memory://preferences</h3>
        <p class="resource-desc">All learned preferences as JSON. Includes key, value, confidence, and source memory IDs.</p>
        <code class="resource-uri">memory://preferences</code>
      </article>

      <article class="resource-card reveal">
        <span class="resource-type">Resource</span>
        <h3 class="resource-title">memory://recent</h3>
        <p class="resource-desc">Recent memories as JSON. Useful for quick context injection without a full recall query.</p>
        <code class="resource-uri">memory://recent</code>
      </article>

      <article class="resource-card reveal">
        <span class="resource-type">Resource</span>
        <h3 class="resource-title">memory://stats</h3>
        <p class="resource-desc">Database statistics: memory count, entity count, relation count, correction count.</p>
        <code class="resource-uri">memory://stats</code>
      </article>

      <article class="resource-card reveal">
        <span class="resource-type">Prompt</span>
        <h3 class="resource-title">memory-context</h3>
        <p class="resource-desc">Injects relevant memories and preferences for a task. Call with <code>task</code> and optional <code>repo_path</code>.</p>
        <code class="resource-uri">prompt: memory-context</code>
      </article>
    </div>
  </div>
</section>

<!-- ==========================================================================
     BEST PRACTICES
     ========================================================================== -->
<section class="section reveal" aria-labelledby="practices-title">
  <div class="container">
    <header class="section-header">
      <span class="section-tag">Guidelines</span>
      <h2 id="practices-title" class="section-title">Best Practices</h2>
      <p class="section-desc">Patterns that keep your memory useful and your assistant sharp.</p>
    </header>

    <div class="practices-list stagger-children">
      <article class="practice-item reveal">
        <div class="practice-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M12 6v6l4 2"></path>
          </svg>
        </div>
        <div class="practice-content">
          <h4>Scope Intentionally</h4>
          <p>Use <code>user</code> for global preferences, <code>repo</code> for project-specific patterns, <code>session</code> for ephemeral context.</p>
        </div>
      </article>

      <article class="practice-item reveal">
        <div class="practice-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
        </div>
        <div class="practice-content">
          <h4>Be Specific in Queries</h4>
          <p>Short, topic-focused recall queries return better results than vague ones. Use <code>repo_path</code> and <code>scope</code> filters.</p>
        </div>
      </article>

      <article class="practice-item reveal">
        <div class="practice-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
        </div>
        <div class="practice-content">
          <h4>Log Tool Outcomes</h4>
          <p>After every meaningful tool call, log success, duration, and tokens. The recommender improves with more data.</p>
        </div>
      </article>

      <article class="practice-item reveal">
        <div class="practice-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M17 18a5 5 0 0 0-10 0"></path>
            <path d="M12 2v20"></path>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
            <path d="M12 17h.01"></path>
          </svg>
        </div>
        <div class="practice-content">
          <h4>Apply Corrections Promptly</h4>
          <p>Corrections update confidence and extract preferences automatically. Wrong memories fade; right ones strengthen.</p>
        </div>
      </article>

      <article class="practice-item reveal">
        <div class="practice-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M23 4v6"></path>
            <path d="M1 20v-6"></path>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10"></path>
            <path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14"></path>
          </svg>
        </div>
        <div class="practice-content">
          <h4>Reflect Regularly</h4>
          <p>Run <code>reflect</code> daily or after large batches. Merges duplicates, surfaces insights, flags low-confidence memories.</p>
        </div>
      </article>

      <article class="practice-item reveal">
        <div class="practice-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <rect x="2" y="3" width="20" height="14" rx="2"></rect>
            <path d="M8 21h8"></path>
            <path d="M12 17v4"></path>
          </svg>
        </div>
        <div class="practice-content">
          <h4>Back Up the Database</h4>
          <p>Copy <code>~/.agent-memory-mcp/memories.db</code> and its <code>-wal</code>/<code>-shm</code> files to another location periodically.</p>
        </div>
      </article>
    </div>
  </div>
</section>

<!-- ==========================================================================
     TROUBLESHOOTING
     ========================================================================== -->
<section class="section reveal" aria-labelledby="troubleshooting-title">
  <div class="container">
    <header class="section-header">
      <span class="section-tag">Help</span>
      <h2 id="troubleshooting-title" class="section-title">Troubleshooting</h2>
      <p class="section-desc">Common issues and solutions.</p>
    </header>

    <div class="troubleshooting-list stagger-children">
      <details class="trouble-item reveal" open>
        <summary class="trouble-summary">Server fails to start</summary>
        <div class="trouble-content">
          <p>Run <code>npm run build</code> then <code>node dist/index.js</code>. Check logs with <code>AGENT_MEMORY_LOG_LEVEL=debug</code>.</p>
          <pre><code>AGENT_MEMORY_LOG_LEVEL=debug node dist/index.js</code></pre>
        </div>
      </details>

      <details class="trouble-item reveal">
        <summary class="trouble-summary">SQLITE_MISMATCH or schema errors</summary>
        <div class="trouble-content">
          <p>The server uses schema versioning. For very old databases, stop the server and delete the database files:</p>
          <pre><code>rm -f ~/.agent-memory-mcp/memories.db ~/.agent-memory-mcp/memories.db-*</code></pre>
          <p>Then restart — it will create a fresh v2 schema.</p>
        </div>
      </details>

      <details class="trouble-item reveal">
        <summary class="trouble-summary">Assistant cannot find tools</summary>
        <div class="trouble-content">
          <ul>
            <li>Ensure MCP config points to the absolute path of <code>dist/index.js</code></li>
            <li>Restart the assistant/editor after editing config</li>
            <li>Verify <code>npm run build</code> produced <code>dist/index.js</code></li>
          </ul>
        </div>
      </details>

      <details class="trouble-item reveal">
        <summary class="trouble-summary">Recall returns unrelated results</summary>
        <div class="trouble-content">
          <ul>
            <li>Use <code>repo_path</code> or <code>scope</code> filters</li>
            <li>Raise <code>min_confidence</code> to filter weak memories</li>
            <li>Apply corrections to bad memories so their confidence drops</li>
          </ul>
        </div>
      </details>

      <details class="trouble-item reveal">
        <summary class="trouble-summary">Large database / slow queries</summary>
        <div class="trouble-content">
          <ul>
            <li>Run <code>reflect</code> to merge duplicates</li>
            <li>Consider deleting old <code>session</code> scoped memories</li>
            <li>Increase <code>min_confidence</code> threshold</li>
          </ul>
        </div>
      </details>

      <details class="trouble-item reveal">
        <summary class="trouble-summary">OpenAI embeddings not working</summary>
        <div class="trouble-content">
          <p>Set <code>OPENAI_API_KEY</code> environment variable. The server auto-detects and uses <code>text-embedding-3-small</code>.</p>
          <pre><code>export OPENAI_API_KEY=sk-...
npm run build && node dist/index.js</code></pre>
        </div>
      </details>
    </div>
  </div>
</section>

<!-- ==========================================================================
     CTA SECTION
     ========================================================================== -->
<section class="section reveal" style="background: var(--color-bg-elevated); border-top: 1px solid var(--color-border);" aria-labelledby="cta-title">
  <div class="container" style="text-align: center;">
    <h2 id="cta-title" class="section-title" style="max-width: 600px; margin: 0 auto var(--space-md);">Ready to give your assistant a memory?</h2>
    <p class="section-desc" style="max-width: 600px; margin: 0 auto var(--space-xl);">Install in under a minute. Works with Claude, VS Code, Cursor, and OpenCode.</p>
    <div class="hero-actions">
      <a href="#install" class="btn btn-primary">
        <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="7 10 12 15 17 10"></polyline>
          <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
        Get Started
      </a>
      <a href="https://github.com/jthiruveedula/agent-memory-mcp" class="btn btn-secondary" target="_blank" rel="noopener">
        <svg class="btn-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.536-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
        </svg>
        View on GitHub
      </a>
    </div>
  </div>
</section>
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
