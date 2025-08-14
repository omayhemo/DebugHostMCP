/**
 * Theme Enhancement Module for Dashboard
 * Adds advanced theme management and UI enhancements
 */

class ThemeManager {
  constructor() {
    this.theme = localStorage.getItem('dashboard-theme') || 
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    this.transitionInProgress = false;
    
    this.init();
  }
  
  init() {
    // Apply current theme
    document.documentElement.setAttribute('data-theme', this.theme);
    
    // Setup theme toggle button
    this.setupThemeToggle();
    
    // Listen for system theme changes
    this.setupSystemThemeListener();
    
    // Update theme icon
    this.updateThemeIcon();
    
    // Setup keyboard shortcuts
    this.setupKeyboardShortcuts();
  }
  
  setupThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => this.toggleTheme());
      
      // Add tooltip
      themeToggle.setAttribute('data-tooltip', 'Toggle theme (Ctrl+D)');
    }
  }
  
  setupSystemThemeListener() {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      // Only auto-switch if user hasn't manually set a preference
      if (!localStorage.getItem('dashboard-theme')) {
        this.setTheme(e.matches ? 'dark' : 'light', false);
      }
    });
  }
  
  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        this.toggleTheme();
      }
    });
  }
  
  toggleTheme() {
    if (this.transitionInProgress) return;
    
    const newTheme = this.theme === 'dark' ? 'light' : 'dark';
    this.setTheme(newTheme, true);
  }
  
  setTheme(theme, withTransition = false) {
    if (withTransition) {
      this.transitionInProgress = true;
      document.body.classList.add('theme-transition');
    }
    
    this.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('dashboard-theme', theme);
    this.updateThemeIcon();
    
    // Announce theme change to screen readers
    this.announceThemeChange(theme);
    
    if (withTransition) {
      setTimeout(() => {
        document.body.classList.remove('theme-transition');
        this.transitionInProgress = false;
      }, 500);
    }
    
    // Emit custom event for other components
    window.dispatchEvent(new CustomEvent('themeChanged', { 
      detail: { theme, previousTheme: theme === 'dark' ? 'light' : 'dark' } 
    }));
  }
  
  updateThemeIcon() {
    const themeIcon = document.querySelector('.theme-icon');
    if (themeIcon) {
      themeIcon.textContent = this.theme === 'dark' ? '🌙' : '☀️';
      
      // Update tooltip
      const toggle = document.getElementById('themeToggle');
      if (toggle) {
        toggle.setAttribute('data-tooltip', 
          `Switch to ${this.theme === 'dark' ? 'light' : 'dark'} theme (Ctrl+D)`);
      }
    }
  }
  
  announceThemeChange(theme) {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = `Switched to ${theme} theme`;
    
    document.body.appendChild(announcement);
    setTimeout(() => document.body.removeChild(announcement), 1000);
  }
  
  getCurrentTheme() {
    return this.theme;
  }
}

/**
 * Enhanced UI Manager for animations and interactions
 */
class UIEnhancementManager {
  constructor() {
    this.animationObserver = null;
    this.init();
  }
  
  init() {
    this.setupScrollAnimations();
    this.setupInteractiveElements();
    this.setupTooltips();
    this.setupAccessibilityFeatures();
    this.setupPerformanceOptimizations();
  }
  
  setupScrollAnimations() {
    if ('IntersectionObserver' in window) {
      this.animationObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            this.animationObserver.unobserve(entry.target);
          }
        });
      }, { 
        threshold: 0.1,
        rootMargin: '50px 0px'
      });
      
      // Observe all elements with animation classes
      document.querySelectorAll('.animate-on-scroll').forEach(el => {
        this.animationObserver.observe(el);
      });
    }
  }
  
  setupInteractiveElements() {
    // Add hover effects to interactive elements
    document.addEventListener('mouseover', (e) => {
      if (e.target.classList.contains('interactive')) {
        e.target.style.transform = 'translateY(-2px)';
      }
    });
    
    document.addEventListener('mouseout', (e) => {
      if (e.target.classList.contains('interactive')) {
        e.target.style.transform = '';
      }
    });
    
    // Add click ripple effect
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('btn') || e.target.classList.contains('session-card')) {
        this.createRippleEffect(e);
      }
    });
  }
  
  createRippleEffect(e) {
    const ripple = document.createElement('span');
    const rect = e.target.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    
    ripple.style.cssText = `
      position: absolute;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.3);
      width: ${size}px;
      height: ${size}px;
      left: ${x}px;
      top: ${y}px;
      animation: ripple 0.6s ease-out;
      pointer-events: none;
    `;
    
    if (e.target.style.position !== 'absolute' && e.target.style.position !== 'relative') {
      e.target.style.position = 'relative';
    }
    
    e.target.appendChild(ripple);
    
    setTimeout(() => {
      if (ripple.parentNode) {
        ripple.parentNode.removeChild(ripple);
      }
    }, 600);
  }
  
  setupTooltips() {
    let tooltipElement = null;
    
    document.addEventListener('mouseover', (e) => {
      const tooltip = e.target.getAttribute('data-tooltip');
      if (tooltip) {
        this.showTooltip(e.target, tooltip);
      }
    });
    
    document.addEventListener('mouseout', (e) => {
      if (e.target.hasAttribute('data-tooltip')) {
        this.hideTooltip();
      }
    });
  }
  
  showTooltip(element, text) {
    this.hideTooltip(); // Remove any existing tooltip
    
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip-popup';
    tooltip.textContent = text;
    tooltip.setAttribute('role', 'tooltip');
    
    document.body.appendChild(tooltip);
    
    const rect = element.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    
    let left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
    let top = rect.top - tooltipRect.height - 8;
    
    // Adjust position to stay within viewport
    if (left < 8) left = 8;
    if (left + tooltipRect.width > window.innerWidth - 8) {
      left = window.innerWidth - tooltipRect.width - 8;
    }
    if (top < 8) {
      top = rect.bottom + 8;
      tooltip.classList.add('tooltip-bottom');
    }
    
    tooltip.style.left = left + 'px';
    tooltip.style.top = top + 'px';
    tooltip.classList.add('tooltip-show');
    
    this.tooltipElement = tooltip;
  }
  
  hideTooltip() {
    if (this.tooltipElement) {
      this.tooltipElement.classList.remove('tooltip-show');
      setTimeout(() => {
        if (this.tooltipElement && this.tooltipElement.parentNode) {
          this.tooltipElement.parentNode.removeChild(this.tooltipElement);
        }
        this.tooltipElement = null;
      }, 150);
    }
  }
  
  setupAccessibilityFeatures() {
    // Add skip links
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.className = 'skip-link';
    skipLink.textContent = 'Skip to main content';
    skipLink.setAttribute('aria-label', 'Skip to main content');
    document.body.insertBefore(skipLink, document.body.firstChild);
    
    // Enhanced keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeModals();
        this.hideTooltip();
      }
      
      // Focus management for session cards
      if (e.key === 'Tab') {
        this.manageFocus(e);
      }
    });
    
    // ARIA live region for announcements
    if (!document.getElementById('announcements')) {
      const liveRegion = document.createElement('div');
      liveRegion.id = 'announcements';
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.className = 'sr-only';
      document.body.appendChild(liveRegion);
    }
  }
  
  closeModals() {
    // Close any open dropdowns or modals
    document.querySelectorAll('.dropdown-menu.show, .modal.show').forEach(element => {
      element.classList.remove('show');
    });
  }
  
  manageFocus(e) {
    const focusableElements = document.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
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
  
  setupPerformanceOptimizations() {
    // Lazy load images
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.removeAttribute('data-src');
              imageObserver.unobserve(img);
            }
          }
        });
      });
      
      document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
      });
    }
    
    // Debounced resize handler
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        this.handleResize();
      }, 250);
    });
  }
  
  handleResize() {
    // Update layout based on screen size
    const isMobile = window.innerWidth < 768;
    document.body.classList.toggle('mobile', isMobile);
    
    // Emit resize event for components
    window.dispatchEvent(new CustomEvent('layoutResize', { 
      detail: { width: window.innerWidth, height: window.innerHeight, isMobile } 
    }));
  }
  
  announce(message) {
    const announcements = document.getElementById('announcements');
    if (announcements) {
      announcements.textContent = message;
      setTimeout(() => announcements.textContent = '', 1000);
    }
  }
}

/**
 * Enhanced Log Viewer with advanced features
 */
class LogViewerEnhancer {
  constructor() {
    this.virtualScrollEnabled = false;
    this.searchHighlights = [];
    this.init();
  }
  
  init() {
    this.setupLogFiltering();
    this.setupLogFormatting();
    this.setupLogSearch();
  }
  
  setupLogFiltering() {
    const logFilter = document.getElementById('logFilter');
    const logLevelFilter = document.getElementById('logLevelFilter');
    
    if (logFilter) {
      let filterTimeout;
      logFilter.addEventListener('input', (e) => {
        clearTimeout(filterTimeout);
        filterTimeout = setTimeout(() => {
          this.filterLogs(e.target.value);
        }, 300);
      });
      
      // Enhanced search shortcuts
      logFilter.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.findNextMatch();
        } else if (e.key === 'Escape') {
          this.clearFilter();
        }
      });
    }
    
    if (logLevelFilter) {
      logLevelFilter.addEventListener('change', (e) => {
        this.filterLogsByLevel(e.target.value);
      });
    }
  }
  
  setupLogFormatting() {
    // Add syntax highlighting for common patterns
    this.formatters = [
      {
        pattern: /(https?:\/\/[^\s]+)/g,
        replacement: '<span class="log-url">$1</span>'
      },
      {
        pattern: /([\/\w.-]+\.(js|ts|jsx|tsx|py|php|rb|java|cpp|h))/g,
        replacement: '<span class="log-file">$1</span>'
      },
      {
        pattern: /\b(\d+(?:\.\d+)?)\b/g,
        replacement: '<span class="log-number">$1</span>'
      },
      {
        pattern: /(ERROR|Error|error)/g,
        replacement: '<span class="log-error">$1</span>'
      },
      {
        pattern: /(WARNING|Warning|warning|WARN)/g,
        replacement: '<span class="log-warning">$1</span>'
      },
      {
        pattern: /(INFO|Info|info)/g,
        replacement: '<span class="log-info">$1</span>'
      }
    ];
  }
  
  setupLogSearch() {
    const searchContainer = document.querySelector('.search-container');
    if (searchContainer) {
      // Add search navigation
      const searchNav = document.createElement('div');
      searchNav.className = 'search-navigation';
      searchNav.id = 'searchNavigation';
      searchNav.style.display = 'none';
      searchContainer.appendChild(searchNav);
    }
  }
  
  formatLogData(data) {
    let formatted = this.escapeHtml(data);
    
    this.formatters.forEach(formatter => {
      formatted = formatted.replace(formatter.pattern, formatter.replacement);
    });
    
    return formatted;
  }
  
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  filterLogs(searchTerm) {
    const logEntries = document.querySelectorAll('.log-entry');
    let visibleCount = 0;
    let matchCount = 0;
    
    this.clearHighlights();
    
    logEntries.forEach(entry => {
      const logData = entry.querySelector('.log-data');
      if (!logData) return;
      
      const text = logData.textContent.toLowerCase();
      const matches = !searchTerm || text.includes(searchTerm.toLowerCase());
      
      entry.style.display = matches ? 'flex' : 'none';
      
      if (matches) {
        visibleCount++;
        if (searchTerm && text.includes(searchTerm.toLowerCase())) {
          this.highlightText(logData, searchTerm);
          matchCount++;
        }
      }
    });
    
    this.updateFilterStats(visibleCount, matchCount, searchTerm);
  }
  
  highlightText(element, searchTerm) {
    if (!searchTerm) return;
    
    const text = element.textContent;
    const regex = new RegExp(`(${this.escapeRegex(searchTerm)})`, 'gi');
    const highlighted = text.replace(regex, '<mark class="search-highlight">$1</mark>');
    
    if (highlighted !== text) {
      element.innerHTML = highlighted;
      this.searchHighlights.push(element);
    }
  }
  
  clearHighlights() {
    this.searchHighlights.forEach(element => {
      const text = element.textContent;
      element.innerHTML = this.formatLogData(text);
    });
    this.searchHighlights = [];
  }
  
  escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
  
  updateFilterStats(visible, matches, searchTerm) {
    const filterCount = document.getElementById('logFilterCount');
    if (filterCount) {
      if (searchTerm && matches > 0) {
        filterCount.textContent = `${matches} matches in ${visible} entries`;
        filterCount.className = 'log-filter-count matches';
      } else if (searchTerm) {
        filterCount.textContent = `No matches found`;
        filterCount.className = 'log-filter-count no-matches';
      } else {
        filterCount.textContent = `${visible} entries`;
        filterCount.className = 'log-filter-count';
      }
    }
  }
  
  findNextMatch() {
    const highlights = document.querySelectorAll('.search-highlight');
    if (highlights.length === 0) return;
    
    // Implementation for search navigation would go here
    console.log('Find next match - to be implemented');
  }
  
  clearFilter() {
    const filterInput = document.getElementById('logFilter');
    if (filterInput) {
      filterInput.value = '';
      this.filterLogs('');
    }
  }
}

// Enhanced CSS for all new features
const enhancedCSS = `
/* Theme transition */
.theme-transition,
.theme-transition *,
.theme-transition *:before,
.theme-transition *:after {
  transition: all 500ms cubic-bezier(0.23, 1, 0.32, 1) !important;
  transition-delay: 0 !important;
}

/* Tooltip system */
.tooltip-popup {
  position: absolute;
  background: var(--bg-quaternary);
  color: var(--text-primary);
  padding: 8px 12px;
  border-radius: var(--border-radius);
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  z-index: var(--z-tooltip);
  opacity: 0;
  transform: translateY(-5px);
  transition: all 150ms ease-out;
  pointer-events: none;
  border: 1px solid var(--glass-border);
  backdrop-filter: blur(10px);
  box-shadow: var(--shadow-lg);
}

.tooltip-popup.tooltip-show {
  opacity: 1;
  transform: translateY(0);
}

.tooltip-popup.tooltip-bottom {
  transform: translateY(5px);
}

.tooltip-popup.tooltip-bottom.tooltip-show {
  transform: translateY(0);
}

/* Skip link for accessibility */
.skip-link {
  position: absolute;
  top: -40px;
  left: 8px;
  background: var(--primary-color);
  color: white;
  padding: 8px 12px;
  border-radius: var(--border-radius);
  text-decoration: none;
  font-weight: 500;
  z-index: var(--z-tooltip);
  transition: all 300ms ease-out;
}

.skip-link:focus {
  top: 8px;
}

/* Screen reader only content */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Ripple effect */
@keyframes ripple {
  0% {
    transform: scale(0);
    opacity: 1;
  }
  100% {
    transform: scale(2);
    opacity: 0;
  }
}

/* Log syntax highlighting */
.log-url {
  color: var(--info-color);
  text-decoration: underline;
  cursor: pointer;
}

.log-file {
  color: var(--warning-color);
  font-weight: 500;
}

.log-number {
  color: var(--primary-color);
  font-weight: 500;
}

.log-error {
  color: var(--error-color);
  font-weight: 600;
}

.log-warning {
  color: var(--warning-color);
  font-weight: 500;
}

.log-info {
  color: var(--info-color);
  font-weight: 500;
}

/* Search highlighting */
.search-highlight {
  background: rgba(37, 99, 235, 0.3);
  color: var(--text-primary);
  border-radius: 2px;
  padding: 1px 2px;
}

.search-navigation {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 12px;
  padding: 4px 8px;
  background: var(--glass-bg);
  border-radius: var(--border-radius);
  border: 1px solid var(--glass-border);
  font-size: 12px;
}

/* Enhanced mobile support */
.mobile .session-card {
  margin-bottom: 16px;
}

.mobile .header-controls {
  flex-wrap: wrap;
  justify-content: center;
}

.mobile .log-controls {
  flex-direction: column;
  gap: 12px;
}

/* Performance optimizations */
.log-entry {
  contain: layout;
}

.session-card {
  contain: layout style;
}

/* Dark mode image adjustments */
[data-theme="dark"] img {
  filter: brightness(0.9) contrast(1.1);
}

/* High contrast mode improvements */
@media (prefers-contrast: high) {
  .tooltip-popup,
  .notification,
  .session-card,
  .log-viewer {
    border: 2px solid currentColor;
  }
  
  .search-highlight {
    background: var(--primary-color);
    color: var(--text-inverse);
  }
}

/* Focus improvements */
.btn:focus-visible,
.session-card:focus-visible,
input:focus-visible,
select:focus-visible {
  outline: 3px solid var(--primary-color);
  outline-offset: 2px;
}

/* Animation performance */
.animate-on-scroll {
  opacity: 0;
  transform: translateY(30px);
  transition: opacity 0.8s ease, transform 0.8s ease;
}

.animate-on-scroll.in-view {
  opacity: 1;
  transform: translateY(0);
}
`;

// Initialize all enhancement modules when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Inject enhanced CSS
  const styleSheet = document.createElement('style');
  styleSheet.textContent = enhancedCSS;
  document.head.appendChild(styleSheet);
  
  // Initialize enhancement modules
  window.themeManager = new ThemeManager();
  window.uiEnhancer = new UIEnhancementManager();
  window.logViewerEnhancer = new LogViewerEnhancer();
  
  console.log('Dashboard enhancements loaded successfully');
});

// Export for use by other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ThemeManager, UIEnhancementManager, LogViewerEnhancer };
}