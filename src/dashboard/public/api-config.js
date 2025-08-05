/**
 * API Configuration for Debug Host Dashboard
 * Automatically detects and uses the correct API endpoint
 */

class ApiConfig {
  constructor() {
    // Default to the current host
    this.dashboardPort = window.location.port || '2601';
    this.globalServicePort = '2601';
    
    // Determine which API to use based on available services
    this.apiBase = this.getApiBase();
  }

  getApiBase() {
    // Check if we're on the dashboard port (2601)
    if (this.dashboardPort === '2601') {
      // Use local dashboard API
      return '/api';
    } else {
      // Use global service API on port 2601
      return `http://localhost:${this.globalServicePort}/api/v1`;
    }
  }

  // Get the correct API URL for sessions
  getSessionsUrl() {
    const base = this.apiBase;
    if (base.includes('/api/v1')) {
      return `${base}/sessions`;
    } else {
      return `${base}/sessions`;
    }
  }

  // Get the correct API URL for servers
  getServersUrl() {
    const base = this.apiBase;
    if (base.includes('/api/v1')) {
      return `${base}/servers`;
    } else {
      return `${base}/sessions`; // Dashboard uses sessions endpoint
    }
  }

  // Get restart URL
  getRestartUrl(sessionId) {
    const base = this.apiBase;
    if (base.includes('/api/v1')) {
      return `${base}/servers/${sessionId}/restart`;
    } else {
      return `${base}/sessions/${sessionId}/restart`;
    }
  }

  // Get stop URL
  getStopUrl(sessionId) {
    const base = this.apiBase;
    if (base.includes('/api/v1')) {
      return `${base}/servers/${sessionId}`;
    } else {
      return `${base}/sessions/${sessionId}/stop`;
    }
  }

  // Get delete URL
  getDeleteUrl(sessionId) {
    const base = this.apiBase;
    if (base.includes('/api/v1')) {
      return `${base}/sessions/${sessionId}`;
    } else {
      return `${base}/sessions/${sessionId}`;
    }
  }

  // Get clear inactive URL
  getClearInactiveUrl() {
    const base = this.apiBase;
    return `${base}/sessions/clear-inactive`;
  }

  // Check if using global service
  isUsingGlobalService() {
    return this.apiBase.includes('/api/v1');
  }
}

// Create singleton instance
const apiConfig = new ApiConfig();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = apiConfig;
}

// Make available globally
window.apiConfig = apiConfig;