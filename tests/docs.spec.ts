import { test, expect } from '@playwright/test';

const BASE_URL = 'https://jthiruveedula.github.io/agent-memory-mcp/';

test.describe('Hero Section', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
  });

  test('hero loads with all elements visible', async ({ page }) => {
    await expect(page.locator('.hero')).toBeVisible();
    await expect(page.locator('.hero h1')).toContainText('Agent Memory MCP');
    await expect(page.locator('.hero-subtitle')).toBeVisible();
    await expect(page.locator('.hero-actions .btn-primary')).toContainText('Get Started');
    await expect(page.locator('.hero-actions .btn-secondary')).toContainText('GitHub');
  });

  test('hero stats are displayed', async ({ page }) => {
    await expect(page.locator('.hero-stats')).toBeVisible();
    await expect(page.locator('.stat-item')).toHaveCount(4);
    await expect(page.locator('.stat-value').first()).toContainText('11');
  });

  test('hero badge is visible', async ({ page }) => {
    await expect(page.locator('.hero-badge')).toBeVisible();
    await expect(page.locator('.hero-badge')).toContainText('v0.1.0');
  });

  test('CTA buttons have correct hrefs', async ({ page }) => {
    const primaryBtn = page.locator('.hero-actions .btn-primary');
    const secondaryBtn = page.locator('.hero-actions .btn-secondary');
    
    await expect(primaryBtn).toHaveAttribute('href', '#install');
    await expect(secondaryBtn).toHaveAttribute('href', 'https://github.com/jthiruveedula/agent-memory-mcp');
  });
});

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
  });

  test('logo links to home', async ({ page }) => {
    await expect(page.locator('.logo')).toBeVisible();
    await expect(page.locator('.logo')).toHaveAttribute('href', '/agent-memory-mcp/');
  });

  test('nav links are present', async ({ page }) => {
    const contentLinks = page.locator('.nav-link:not(.nav-github)');
    await expect(contentLinks).toHaveCount(4);
    await expect(contentLinks.nth(0)).toContainText('Features');
    await expect(contentLinks.nth(1)).toContainText('Install');
    await expect(contentLinks.nth(2)).toContainText('Usage');
    await expect(contentLinks.nth(3)).toContainText('API');
  });

  test('GitHub link in nav', async ({ page }) => {
    const githubLink = page.locator('.nav-github');
    await expect(githubLink).toBeVisible();
    await expect(githubLink).toHaveAttribute('href', 'https://github.com/jthiruveedula/agent-memory-mcp');
    await expect(githubLink).toHaveAttribute('target', '_blank');
  });

  test('mobile nav toggle works', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(100);
    
    const toggle = page.locator('.nav-toggle');
    await expect(toggle).toBeVisible();
    
    const navLinks = page.locator('.nav-links');
    await expect(navLinks).not.toHaveClass('open');
    
    await toggle.click();
    await expect(navLinks).toHaveClass('open');
    
    await toggle.click();
    await expect(navLinks).not.toHaveClass('open');
  });
});

test.describe('Features Section', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
  });

  test('features section loads', async ({ page }) => {
    await expect(page.locator('#features')).toBeVisible();
    await expect(page.locator('#features h2')).toContainText('What It Does');
  });

  test('six feature cards are displayed', async ({ page }) => {
    await expect(page.locator('.feature-card')).toHaveCount(6);
  });

  test('feature cards have icons and content', async ({ page }) => {
    const cards = page.locator('.feature-card');
    for (let i = 0; i < 6; i++) {
      await expect(cards.nth(i).locator('.feature-icon')).toBeVisible();
      await expect(cards.nth(i).locator('.feature-title')).toBeVisible();
      await expect(cards.nth(i).locator('.feature-desc')).toBeVisible();
    }
  });

  test('feature card hover effect', async ({ page }) => {
    const card = page.locator('.feature-card').first();
    await card.hover();
    await page.waitForTimeout(200);
    
    // Check transform is applied (3D tilt)
    const transform = await card.evaluate(el => getComputedStyle(el).transform);
    expect(transform).not.toBe('none');
  });
});

test.describe('Install Section - Tab Switching', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
  });

  test('install tabs are visible', async ({ page }) => {
    await expect(page.locator('.install-tabs')).toBeVisible();
    await expect(page.locator('.tab-btn')).toHaveCount(5);
  });

  test('CLI tab is active by default', async ({ page }) => {
    await expect(page.locator('#tab-cli')).toHaveClass(/active/);
    await expect(page.locator('#panel-cli')).toHaveClass(/active/);
  });

  test('switching tabs shows correct panel', async ({ page }) => {
    const tabs = [
      { id: 'tab-vscode', panel: 'panel-vscode' },
      { id: 'tab-claude', panel: 'panel-claude' },
      { id: 'tab-cursor', panel: 'panel-cursor' },
      { id: 'tab-opencode', panel: 'panel-opencode' },
    ];

    for (const tab of tabs) {
      await page.locator(`#${tab.id}`).click();
      await expect(page.locator(`#${tab.id}`)).toHaveClass(/active/);
      await expect(page.locator(`#${tab.panel}`)).toHaveClass(/active/);
      await expect(page.locator('#panel-cli')).not.toHaveClass(/active/);
    }
  });

  test('code blocks have copy buttons', async ({ page }) => {
    await page.waitForTimeout(500);
    await page.locator('#tab-cli').click();
    await expect(page.locator('.install-panel.active .code-copy')).toBeVisible();
  });

  test('copy button works', async ({ page }) => {
    await page.locator('#tab-cli').click();
    const copyBtn = page.locator('#panel-cli .code-copy').first();
    
    await copyBtn.click();
    await expect(copyBtn).toHaveClass(/copied/);
    
    // Check clipboard content
    const clipboardText = await page.evaluate(async () => {
      return await navigator.clipboard.readText();
    });
    expect(clipboardText).toContain('git clone');
  });
});

test.describe('Usage Workflow Section', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
  });

  test('five step cards are displayed', async ({ page }) => {
    await expect(page.locator('.step-card')).toHaveCount(5);
  });

  test('step cards have correct numbers', async ({ page }) => {
    for (let i = 0; i < 5; i++) {
      await expect(page.locator('.step-card').nth(i)).toHaveAttribute('data-step', String(i + 1));
    }
  });

  test('step cards have code examples', async ({ page }) => {
    const cards = page.locator('.step-card');
    for (let i = 0; i < 5; i++) {
      await expect(cards.nth(i).locator('.step-code code')).toBeVisible();
    }
  });
});

test.describe('API Reference Table', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
  });

  test('API table has 11 rows', async ({ page }) => {
    await expect(page.locator('.api-table tbody tr')).toHaveCount(11);
  });

  test('table headers are correct', async ({ page }) => {
    await expect(page.locator('.api-table th').nth(0)).toContainText('Tool');
    await expect(page.locator('.api-table th').nth(1)).toContainText('Description');
    await expect(page.locator('.api-table th').nth(2)).toContainText('Key Arguments');
  });

  test('all tool names are present', async ({ page }) => {
    const tools = [
      'remember', 'recall', 'recall_recent', 'remember_correction',
      'remember_tool_outcome', 'get_preferences', 'set_preference',
      'get_tool_recommendations', 'get_knowledge_graph', 'reflect',
      'update_memory_confidence'
    ];
    
    for (const tool of tools) {
      await expect(page.locator('.api-table tbody')).toContainText(tool);
    }
  });

  test('table is horizontally scrollable on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    const wrapper = page.locator('.api-table-wrapper');
    await expect(wrapper).toBeVisible();
  });
});

test.describe('Resources & Prompts Section', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
  });

  test('four resource cards displayed', async ({ page }) => {
    await expect(page.locator('.resource-card')).toHaveCount(4);
  });

  test('resource cards have correct types', async ({ page }) => {
    const types = ['Resource', 'Resource', 'Resource', 'Prompt'];
    const cards = page.locator('.resource-card');
    
    for (let i = 0; i < 4; i++) {
      await expect(cards.nth(i).locator('.resource-type')).toContainText(types[i]);
    }
  });

  test('resource URIs are displayed', async ({ page }) => {
    await expect(page.locator('.resource-uri')).toHaveCount(4);
    await expect(page.locator('.resource-uri').first()).toContainText('memory://preferences');
  });
});

test.describe('Best Practices Section', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
  });

  test('six practice items displayed', async ({ page }) => {
    await expect(page.locator('.practice-item')).toHaveCount(6);
  });

  test('practice items have icons and content', async ({ page }) => {
    const items = page.locator('.practice-item');
    for (let i = 0; i < 6; i++) {
      await expect(items.nth(i).locator('.practice-icon')).toBeVisible();
      await expect(items.nth(i).locator('h4')).toBeVisible();
      await expect(items.nth(i).locator('p')).toBeVisible();
    }
  });
});

test.describe('Troubleshooting Accordions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
  });

  test('six troubleshooting items', async ({ page }) => {
    await expect(page.locator('.trouble-item')).toHaveCount(6);
  });

  test('first item is open by default', async ({ page }) => {
    await expect(page.locator('.trouble-item').first()).toHaveAttribute('open', '');
  });

  test('clicking summary toggles accordion', async ({ page }) => {
    const item = page.locator('.trouble-item').nth(1);
    await expect(item).not.toHaveAttribute('open');
    
    await item.locator('.trouble-summary').click();
    await expect(item).toHaveAttribute('open', '');
    
    await item.locator('.trouble-summary').click();
    await expect(item).not.toHaveAttribute('open');
  });

  test('accordion content has code blocks', async ({ page }) => {
    const items = page.locator('.trouble-item');
    for (let i = 0; i < 7; i++) {
      await expect(items.nth(i).locator('.trouble-content code')).toBeVisible();
    }
  });
});

test.describe('Footer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
  });

  test('footer has brand and links', async ({ page }) => {
    await expect(page.locator('.footer-brand')).toBeVisible();
    await expect(page.locator('.footer-links a')).toHaveCount(3);
  });

  test('footer links have correct hrefs', async ({ page }) => {
    const links = page.locator('.footer-links a');
    await expect(links.nth(0)).toHaveAttribute('href', 'https://github.com/jthiruveedula/agent-memory-mcp');
    await expect(links.nth(1)).toHaveAttribute('href', 'https://github.com/jthiruveedula/agent-memory-mcp/issues');
    await expect(links.nth(2)).toHaveAttribute('href', 'https://modelcontextprotocol.io');
  });

  test('copyright notice present', async ({ page }) => {
    await expect(page.locator('.footer-copyright')).toContainText('MIT Licensed');
    await expect(page.locator('.footer-copyright')).toContainText('2026');
  });
});

test.describe('Responsive Design', () => {
  test('mobile layout works', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('.nav-toggle')).toBeVisible();
    await expect(page.locator('.hero h1')).toBeVisible();
    await expect(page.locator('.feature-card')).toHaveCount(6);
  });

  test('tablet layout works', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('.features-grid')).toBeVisible();
  });

  test('desktop layout works', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('.nav-links')).toBeVisible();
    await expect(page.locator('.nav-toggle')).toBeHidden();
  });
});

test.describe('Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
  });

  test('skip link works', async ({ page }) => {
    await page.keyboard.press('Tab');
    const skipLink = page.locator('.skip-link:focus');
    await expect(skipLink).toBeVisible();
  });

  test('focus visible on interactive elements', async ({ page }) => {
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    const focused = page.locator(':focus');
    await expect(focused).toBeVisible();
  });

  test('images have alt text or are decorative', async ({ page }) => {
    const images = page.locator('img');
    const count = await images.count();
    
    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      const role = await img.getAttribute('role');
      const ariaHidden = await img.getAttribute('aria-hidden');
      
      // Either has alt, or is decorative (aria-hidden or role=presentation)
      expect(alt !== null || role === 'presentation' || ariaHidden === 'true').toBeTruthy();
    }
  });

  test('headings hierarchy is valid', async ({ page }) => {
    const headings = await page.locator('h1, h2, h3, h4').all();
    expect(headings.length).toBeGreaterThan(0);
    
    // First heading should be h1
    const firstTag = await headings[0].evaluate(el => el.tagName.toLowerCase());
    expect(firstTag).toBe('h1');
    
    // No gap >1 between heading levels (no skipping from h1 to h3)
    let prevLevel = 0;
    for (const heading of headings) {
      const tag = await heading.evaluate(el => el.tagName.toLowerCase());
      const level = parseInt(tag[1]);
      if (prevLevel > 0) {
        expect(level - prevLevel).toBeLessThanOrEqual(1);
      }
      prevLevel = level;
    }
  });
});

test.describe('Performance', () => {
  test('page loads within acceptable time', async ({ page }) => {
    const start = Date.now();
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - start;
    
    expect(loadTime).toBeLessThan(5000);
  });

  test('no console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    // Filter out expected errors (like favicon)
    const relevantErrors = errors.filter(e => 
      !e.includes('favicon') && 
      !e.includes('manifest') &&
      !e.includes('404')
    );
    
    expect(relevantErrors).toHaveLength(0);
  });
});