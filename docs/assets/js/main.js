/**
 * Agent Memory MCP — Documentation JavaScript
 * Handles animations, interactions, and dynamic behavior
 */

(function() {
  'use strict';

  // ==========================================================================
  // Configuration
  // ==========================================================================
  const CONFIG = {
    headerHeight: 72,
    scrollThreshold: 100,
    revealThreshold: 0.1,
    staggerDelay: 100,
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches
  };

  // ==========================================================================
  // Utility Functions
  // ==========================================================================
  const $ = (selector, context = document) => context.querySelector(selector);
  const $$ = (selector, context = document) => [...context.querySelectorAll(selector)];

  const debounce = (fn, wait) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn(...args), wait);
    };
  };

  const throttle = (fn, limit) => {
    let inThrottle;
    return (...args) => {
      if (!inThrottle) {
        fn(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  };

  // ==========================================================================
  // Mobile Navigation Toggle
  // ==========================================================================
  function initMobileNav() {
    const toggle = $('.nav-toggle');
    const navLinks = $('.nav-links');
    
    if (!toggle || !navLinks) return;

    toggle.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('open');
      toggle.setAttribute('aria-expanded', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    // Close on link click
    $$('.nav-link', navLinks).forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });

    // Close on escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navLinks.classList.contains('open')) {
        navLinks.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    });
  }

  // ==========================================================================
  // Header Scroll Effect
  // ==========================================================================
  function initHeaderScroll() {
    const header = $('.site-header');
    if (!header) return;

    const handleScroll = throttle(() => {
      if (window.scrollY > CONFIG.scrollThreshold) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    }, 16);

    window.addEventListener('scroll', handleScroll, { passive: true });
  }

  // ==========================================================================
  // Scroll Reveal Animations
  // ==========================================================================
  function initScrollReveal() {
    if (CONFIG.reducedMotion) {
      $$('.reveal').forEach(el => el.classList.add('visible'));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          // Stagger children if parent has stagger-children
          if (entry.target.classList.contains('stagger-children')) {
            const children = [...entry.target.children];
            children.forEach((child, i) => {
              child.style.animationDelay = `${i * CONFIG.staggerDelay}ms`;
            });
          }
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: CONFIG.revealThreshold,
      rootMargin: '0px 0px -50px 0px'
    });

    $$('.reveal').forEach(el => observer.observe(el));
  }

  // ==========================================================================
  // Code Block Copy Buttons
  // ==========================================================================
  function initCodeCopy() {
    $$('pre code').forEach(codeBlock => {
      const pre = codeBlock.parentElement;
      if (pre.querySelector('.code-copy')) return;

      const btn = document.createElement('button');
      btn.className = 'code-copy';
      btn.setAttribute('aria-label', 'Copy code');
      btn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
      `;
      
      btn.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(codeBlock.textContent);
          btn.classList.add('copied');
          btn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          `;
          setTimeout(() => {
            btn.classList.remove('copied');
            btn.innerHTML = `
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
            `;
          }, 2000);
        } catch (err) {
          console.error('Copy failed:', err);
        }
      });

      pre.style.position = 'relative';
      pre.appendChild(btn);
    });
  }

  // ==========================================================================
  // Smooth Scroll for Anchor Links
  // ==========================================================================
  function initSmoothScroll() {
    $$('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        const targetId = anchor.getAttribute('href');
        if (targetId === '#') return;
        
        const target = $(targetId);
        if (!target) return;

        e.preventDefault();
        const headerOffset = CONFIG.headerHeight;
        const elementPosition = target.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: CONFIG.reducedMotion ? 'auto' : 'smooth'
        });

        // Update URL without scroll
        history.pushState(null, '', targetId);
      });
    });
  }

  // ==========================================================================
  // Tab Switching (for install section)
  // ==========================================================================
  function initTabs() {
    $$('.install-tabs').forEach(tabContainer => {
      const tabs = $$('.tab-btn', tabContainer);
      const panels = $$('.tab-panel', tabContainer);

      tabs.forEach(tab => {
        tab.addEventListener('click', () => {
          const target = tab.dataset.tab;
          
          tabs.forEach(t => t.classList.remove('active'));
          panels.forEach(p => p.classList.remove('active'));
          
          tab.classList.add('active');
          const panel = $(`#${target}`, tabContainer);
          if (panel) panel.classList.add('active');
        });
      });
    });
  }

  // ==========================================================================
  // Troubleshooting Accordion Enhancement
  // ==========================================================================
  function initAccordions() {
    $$('details.trouble-item').forEach(detail => {
      const summary = $('summary', detail);
      if (!summary) return;

      summary.addEventListener('click', (e) => {
        // Allow default behavior but add animation
        if (detail.open) {
          // Closing - animate out
          const content = detail.querySelector('.trouble-content');
          if (content) {
            content.style.animation = 'fadeIn 0.2s ease-out reverse';
          }
        } else {
          // Opening - animate in
          const content = detail.querySelector('.trouble-content');
          if (content) {
            content.style.animation = 'fadeIn 0.3s ease-out';
          }
        }
      });
    });
  }

  // ==========================================================================
  // Parallax Hero Elements
  // ==========================================================================
  function initParallax() {
    if (CONFIG.reducedMotion) return;

    const hero = $('.hero');
    const heroVisual = $('.hero-visual');
    if (!hero || !heroVisual) return;

    const handleScroll = throttle(() => {
      const scrollY = window.scrollY;
      const heroHeight = hero.offsetHeight;
      const progress = Math.min(scrollY / heroHeight, 1);
      
      // Parallax on visual element
      heroVisual.style.transform = `translateY(${progress * 50}px) scale(${1 - progress * 0.1})`;
      
      // Fade hero content
      const heroContent = $('.hero-content');
      if (heroContent) {
        heroContent.style.opacity = 1 - progress * 0.8;
      }
    }, 16);

    window.addEventListener('scroll', handleScroll, { passive: true });
  }

  // ==========================================================================
  // Feature Card Hover Effects
  // ==========================================================================
  function initFeatureCards() {
    $$('.feature-card').forEach(card => {
      card.addEventListener('mousemove', (e) => {
        if (CONFIG.reducedMotion) return;
        
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const rotateX = (y - centerY) / centerY * 3;
        const rotateY = (centerX - x) / centerX * 3;
        
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
      });
    });
  }

  // ==========================================================================
  // Active Nav Link Highlighting
  // ==========================================================================
  function initActiveNav() {
    const sections = $$('section[id]');
    const navLinks = $$('.nav-link:not(.nav-github)');
    
    if (!sections.length || !navLinks.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          navLinks.forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
          });
        }
      });
    }, {
      rootMargin: `-${CONFIG.headerHeight}px 0px -66% 0px`,
      threshold: 0
    });

    sections.forEach(section => observer.observe(section));
  }

  // ==========================================================================
  // Keyboard Navigation Enhancement
  // ==========================================================================
  function initKeyboardNav() {
    // Trap focus in mobile menu
    const navLinks = $('.nav-links');
    const toggle = $('.nav-toggle');
    
    if (navLinks && toggle) {
      navLinks.addEventListener('keydown', (e) => {
        if (e.key === 'Tab' && navLinks.classList.contains('open')) {
          const focusableElements = navLinks.querySelectorAll(
            'a[href], button, [tabindex]:not([tabindex="-1"])'
          );
          const firstElement = focusableElements[0];
          const lastElement = focusableElements[focusableElements.length - 1];

          if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          } else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      });
    }
  }

  // ==========================================================================
  // Initialize All
  // ==========================================================================
  function init() {
    // Wait for DOM
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
      return;
    }

    initMobileNav();
    initHeaderScroll();
    initScrollReveal();
    initCodeCopy();
    initSmoothScroll();
    initTabs();
    initAccordions();
    initParallax();
    initFeatureCards();
    initActiveNav();
    initKeyboardNav();

    // Add loaded class for CSS transitions
    document.body.classList.add('loaded');
  }

  init();

  // Expose for debugging
  window.AgentMemoryDocs = {
    CONFIG,
    init
  };
})();