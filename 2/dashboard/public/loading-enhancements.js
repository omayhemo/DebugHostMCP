/**
 * Loading States and Feedback Enhancement JavaScript
 * Provides comprehensive loading states, feedback, and user guidance
 */

class LoadingManager {
  constructor() {
    this.loadingStates = new Map();
    this.toasts = [];
    this.maxToasts = 5;
    this.defaultToastDuration = 5000;
    
    this.init();
  }

  init() {
    this.createToastContainer();
    this.setupKeyboardNavigation();
    this.setupTouchSupport();
  }

  createToastContainer() {
    if (document.querySelector('.toast-container')) return;
    
    const container = document.createElement('div');
    container.className = 'toast-container';
    container.setAttribute('aria-live', 'polite');
    container.setAttribute('aria-label', 'Notifications');
    document.body.appendChild(container);
  }

  /**
   * Show loading state for an element
   */
  showLoading(elementOrSelector, options = {}) {
    const element = typeof elementOrSelector === 'string' 
      ? document.querySelector(elementOrSelector)
      : elementOrSelector;
      
    if (!element) return;

    const loadingId = options.id || `loading-${Date.now()}`;
    
    // Store original content
    this.loadingStates.set(loadingId, {
      element,
      originalContent: element.innerHTML,
      originalDisabled: element.disabled,
      originalClasses: Array.from(element.classList)
    });

    // Apply loading state
    element.classList.add('loading');
    if (element.tagName === 'BUTTON' || element.tagName === 'INPUT') {
      element.disabled = true;
    }

    // Add skeleton content if specified
    if (options.skeleton) {
      this.addSkeletonContent(element, options.skeleton);
    }

    // Add progress bar if specified
    if (options.progress) {
      this.addProgressBar(element, options.progress);
    }

    // Auto-hide after timeout
    if (options.timeout) {
      setTimeout(() => {
        this.hideLoading(loadingId);
      }, options.timeout);
    }

    return loadingId;
  }

  /**
   * Hide loading state
   */
  hideLoading(loadingId) {
    const loadingState = this.loadingStates.get(loadingId);
    if (!loadingState) return;

    const { element, originalContent, originalDisabled, originalClasses } = loadingState;

    // Restore original state
    element.innerHTML = originalContent;
    element.disabled = originalDisabled;
    element.className = originalClasses.join(' ');

    // Remove progress bar if exists
    const progressBar = element.querySelector('.progress-bar');
    if (progressBar) {
      progressBar.remove();
    }

    this.loadingStates.delete(loadingId);
  }

  /**
   * Add skeleton loading content
   */
  addSkeletonContent(element, skeletonType) {
    const skeletonContent = this.createSkeletonContent(skeletonType);
    element.innerHTML = skeletonContent;
  }

  createSkeletonContent(type) {
    switch (type) {
      case 'text':
        return `
          <div class="skeleton skeleton-text"></div>
          <div class="skeleton skeleton-text" style="width: 80%"></div>
          <div class="skeleton skeleton-text" style="width: 60%"></div>
        `;
      case 'card':
        return `
          <div class="skeleton skeleton-card">
            <div class="skeleton skeleton-text large"></div>
            <div class="skeleton skeleton-text"></div>
            <div class="skeleton skeleton-text" style="width: 70%"></div>
          </div>
        `;
      case 'list':
        return Array.from({ length: 3 }, () => `
          <div class="skeleton skeleton-text" style="margin: 0.75rem 0;"></div>
        `).join('');
      default:
        return '<div class="skeleton skeleton-text"></div>';
    }
  }

  /**
   * Add progress bar to element
   */
  addProgressBar(element, options = {}) {
    const progressBar = document.createElement('div');
    progressBar.className = 'progress-bar';
    
    if (options.indeterminate) {
      progressBar.classList.add('indeterminate');
    }

    const fill = document.createElement('div');
    fill.className = 'progress-bar-fill';
    fill.style.width = options.progress ? `${options.progress}%` : '0%';
    
    progressBar.appendChild(fill);
    element.appendChild(progressBar);

    return {
      setProgress: (percent) => {
        fill.style.width = `${Math.max(0, Math.min(100, percent))}%`;
      },
      setIndeterminate: (indeterminate) => {
        progressBar.classList.toggle('indeterminate', indeterminate);
      }
    };
  }

  /**
   * Show toast notification
   */
  showToast(message, options = {}) {
    const toast = this.createToast(message, options);
    const container = document.querySelector('.toast-container');
    
    // Remove oldest toast if at max capacity
    if (this.toasts.length >= this.maxToasts) {
      this.hideToast(this.toasts[0].id, false);
    }

    container.appendChild(toast.element);
    this.toasts.push(toast);

    // Auto-hide toast
    const duration = options.duration !== undefined ? options.duration : this.defaultToastDuration;
    if (duration > 0) {
      toast.timeoutId = setTimeout(() => {
        this.hideToast(toast.id);
      }, duration);
    }

    // Announce to screen readers
    this.announceToScreenReader(message, options.type);

    return toast.id;
  }

  createToast(message, options = {}) {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const type = options.type || 'info';
    
    const toastElement = document.createElement('div');
    toastElement.className = `toast ${type}`;
    toastElement.setAttribute('role', 'alert');
    toastElement.setAttribute('aria-atomic', 'true');
    
    const icon = this.getToastIcon(type);
    const title = options.title || this.getToastTitle(type);
    
    toastElement.innerHTML = `
      <div class="toast-icon">${icon}</div>
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        <div class="toast-message">${message}</div>
      </div>
      <button class="toast-close" aria-label="Close notification">
        <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
        </svg>
      </button>
    `;

    // Add close functionality
    const closeButton = toastElement.querySelector('.toast-close');
    closeButton.addEventListener('click', () => {
      this.hideToast(id);
    });

    return {
      id,
      element: toastElement,
      type,
      timeoutId: null
    };
  }

  getToastIcon(type) {
    const icons = {
      success: `<svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
        <path d="M10.97 4.97a.235.235 0 0 0-.02.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05z"/>
      </svg>`,
      error: `<svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
        <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
      </svg>`,
      warning: `<svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
        <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
      </svg>`,
      info: `<svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
        <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
      </svg>`
    };
    return icons[type] || icons.info;
  }

  getToastTitle(type) {
    const titles = {
      success: 'Success',
      error: 'Error',
      warning: 'Warning',
      info: 'Information'
    };
    return titles[type] || 'Notification';
  }

  hideToast(toastId, animate = true) {
    const toastIndex = this.toasts.findIndex(t => t.id === toastId);
    if (toastIndex === -1) return;

    const toast = this.toasts[toastIndex];
    
    // Clear timeout
    if (toast.timeoutId) {
      clearTimeout(toast.timeoutId);
    }

    if (animate) {
      toast.element.classList.add('removing');
      setTimeout(() => {
        toast.element.remove();
      }, 300);
    } else {
      toast.element.remove();
    }

    this.toasts.splice(toastIndex, 1);
  }

  /**
   * Show feedback message with user guidance
   */
  showFeedback(message, type = 'info', guidance = []) {
    const feedbackElement = document.createElement('div');
    feedbackElement.className = `feedback-message ${type}`;
    feedbackElement.setAttribute('role', 'alert');
    feedbackElement.setAttribute('aria-atomic', 'true');

    const icon = this.getToastIcon(type);
    
    let guidanceHtml = '';
    if (guidance.length > 0) {
      guidanceHtml = `
        <div class="feedback-guidance">
          <strong>Suggestions:</strong>
          <ul>
            ${guidance.map(g => `<li>${g}</li>`).join('')}
          </ul>
        </div>
      `;
    }

    feedbackElement.innerHTML = `
      <div class="feedback-icon">${icon}</div>
      <div class="feedback-content">
        <div class="feedback-message-text">${message}</div>
        ${guidanceHtml}
      </div>
    `;

    return feedbackElement;
  }

  /**
   * Show status indicator
   */
  showStatus(text, status = 'disconnected') {
    const statusElement = document.createElement('div');
    statusElement.className = 'status-indicator';
    
    statusElement.innerHTML = `
      <div class="status-dot ${status}"></div>
      <span class="status-text">${text}</span>
    `;

    return statusElement;
  }

  /**
   * Announce message to screen readers
   */
  announceToScreenReader(message, priority = 'polite') {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }

  /**
   * Setup keyboard navigation for toasts
   */
  setupKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        // Close newest toast on Escape
        if (this.toasts.length > 0) {
          const newestToast = this.toasts[this.toasts.length - 1];
          this.hideToast(newestToast.id);
        }
      }
    });
  }

  /**
   * Setup touch support for mobile
   */
  setupTouchSupport() {
    let touchStartX = 0;
    let touchStartY = 0;

    document.addEventListener('touchstart', (e) => {
      if (!e.target.closest('.toast')) return;
      
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    });

    document.addEventListener('touchend', (e) => {
      const toast = e.target.closest('.toast');
      if (!toast) return;

      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;

      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;

      // Swipe right to dismiss
      if (Math.abs(deltaX) > Math.abs(deltaY) && deltaX > 50) {
        const toastId = this.toasts.find(t => t.element === toast)?.id;
        if (toastId) {
          this.hideToast(toastId);
        }
      }
    });
  }

  /**
   * Show success animation
   */
  showSuccessAnimation(element) {
    element.classList.add('success-animation');
    setTimeout(() => {
      element.classList.remove('success-animation');
    }, 600);
  }

  /**
   * Show error animation
   */
  showErrorAnimation(element) {
    element.classList.add('error-animation');
    setTimeout(() => {
      element.classList.remove('error-animation');
    }, 500);
  }

  /**
   * Create loading overlay
   */
  showLoadingOverlay(message = 'Loading...') {
    const existingOverlay = document.querySelector('.loading-overlay');
    if (existingOverlay) return;

    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-label', 'Loading');
    overlay.setAttribute('aria-describedby', 'loading-message');

    overlay.innerHTML = `
      <div class="content">
        <div class="loading-spinner large"></div>
        <div id="loading-message" class="message">${message}</div>
      </div>
    `;

    document.body.appendChild(overlay);
    return overlay;
  }

  /**
   * Hide loading overlay
   */
  hideLoadingOverlay() {
    const overlay = document.querySelector('.loading-overlay');
    if (overlay) {
      overlay.remove();
    }
  }

  /**
   * Update loading overlay message
   */
  updateLoadingMessage(message) {
    const messageElement = document.querySelector('.loading-overlay .message');
    if (messageElement) {
      messageElement.textContent = message;
    }
  }
}

// Global instance
window.loadingManager = new LoadingManager();

// Add some utility functions to the global scope
window.showLoading = (element, options) => window.loadingManager.showLoading(element, options);
window.hideLoading = (id) => window.loadingManager.hideLoading(id);
window.showToast = (message, options) => window.loadingManager.showToast(message, options);
window.showFeedback = (message, type, guidance) => window.loadingManager.showFeedback(message, type, guidance);
window.showStatus = (text, status) => window.loadingManager.showStatus(text, status);

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LoadingManager;
}