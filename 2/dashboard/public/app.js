class DashboardApp {
  constructor() {
    this.ws = null;
    this.sessions = new Map();
    this.selectedSessionId = null;
    this.logBuffer = new Map();
    this.filteredLogs = new Map();
    this.autoScroll = true;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.currentFilter = '';
    this.logTypes = new Set(['stdout', 'stderr', 'info', 'warn', 'error', 'debug']);
    this.connectionState = 'disconnected'; // disconnected, connecting, connected
    this.performanceMetrics = {
      messagesReceived: 0,
      lastMessageTime: null,
      reconnections: 0
    };
    
    // New session management features
    this.selectedSessions = new Set();
    this.favorites = new Set(JSON.parse(localStorage.getItem('sessionFavorites') || '[]'));
    this.filters = {
      status: 'all',
      framework: 'all',
      search: '',
      favoritesOnly: false
    };
    this.sessionMetrics = new Map();
    
    // Enhanced log viewer properties
    this.regexMode = false;
    this.pauseStream = false;
    this.searchResults = [];
    this.currentSearchIndex = -1;
    this.bookmarks = new Map();
    this.logLevelFilter = 'all';
    this.virtualScrollEnabled = true;
    this.logAnalytics = {
      errorCount: 0,
      warningCount: 0,
      logRate: 0,
      patterns: new Map(),
      lastRateCalculation: Date.now(),
      recentLogs: []
    };
    this.chartContext = null;
    this.sidebarVisible = false;
    this.searchPanelVisible = false;
    
    this.initializeApp();
  }
  
  async initializeApp() {
    this.showLoadingState();
    
    try {
      // Initialize WebSocket connection
      await this.initializeWebSocket();
      
      // Bind all event listeners
      this.bindEvents();
      
      // Start periodic updates
      this.startPeriodicUpdates();
      
      // Load initial dashboard state
      await this.loadInitialState();
      
      this.hideLoadingState();
      
      // Analytics initialization
      this.trackEvent('dashboard_loaded', { timestamp: Date.now() });
      
    } catch (error) {
      console.error('Failed to initialize dashboard:', error);
      this.showErrorState('Failed to initialize dashboard');
    }
  }
  
  async initializeWebSocket() {
    return new Promise((resolve, reject) => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      this.connectionState = 'connecting';
      this.updateConnectionStatus('connecting');
      
      this.ws = new WebSocket(wsUrl);
      
      // Set connection timeout
      const connectionTimeout = setTimeout(() => {
        if (this.ws.readyState !== WebSocket.OPEN) {
          this.ws.close();
          reject(new Error('WebSocket connection timeout'));
        }
      }, 10000);
      
      this.ws.onopen = () => {
        clearTimeout(connectionTimeout);
        this.connectionState = 'connected';
        this.updateConnectionStatus('connected');
        this.reconnectAttempts = 0;
        this.performanceMetrics.lastMessageTime = Date.now();
        
        console.log('Connected to MCP Debug Host');
        this.trackEvent('websocket_connected', { attempt: this.reconnectAttempts });
        
        // Send initial handshake
        this.send({
          type: 'handshake',
          data: {
            userAgent: navigator.userAgent,
            timestamp: Date.now(),
            version: '1.0.0'
          }
        });
        
        resolve();
      };
      
      this.ws.onclose = (event) => {
        clearTimeout(connectionTimeout);
        this.connectionState = 'disconnected';
        this.updateConnectionStatus('disconnected');
        
        const reason = event.reason || 'Unknown reason';
        console.log(`Disconnected from MCP Debug Host: ${reason} (${event.code})`);
        
        // Only attempt reconnection if it wasn't a clean close
        if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.performanceMetrics.reconnections++;
          const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
          this.reconnectAttempts++;
          
          console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
          this.trackEvent('websocket_reconnect_attempt', { 
            attempt: this.reconnectAttempts, 
            delay 
          });
          
          setTimeout(() => {
            this.initializeWebSocket().catch(console.error);
          }, delay);
        } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          this.showErrorState('Unable to connect to server. Please refresh the page.');
        }
      };
      
      this.ws.onerror = (error) => {
        clearTimeout(connectionTimeout);
        console.error('WebSocket error:', error);
        this.trackEvent('websocket_error', { error: error.message });
        reject(error);
      };
      
      this.ws.onmessage = (event) => {
        try {
          this.performanceMetrics.messagesReceived++;
          this.performanceMetrics.lastMessageTime = Date.now();
          
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
          this.trackEvent('websocket_parse_error', { error: error.message });
        }
      };
    });
  }
  
  handleMessage(data) {
    switch (data.type) {
      case 'initial-state':
        this.loadSessions(data.sessions);
        break;
        
      case 'log':
        this.appendLog(data.sessionId, data.log);
        break;
        
      case 'server-ready':
        this.updateSession(data.session);
        break;
        
      case 'process-exit':
        this.handleProcessExit(data.sessionId, data.code, data.signal);
        break;
        
      case 'process-error':
        this.handleProcessError(data.sessionId, data.error);
        break;
        
      case 'hook-notification':
        this.handleHookNotification(data.data);
        break;
        
      case 'logs-response':
        this.handleLogsResponse(data.sessionId, data.logs);
        break;
        
      case 'logs-cleared':
        this.handleLogsCleared(data.sessionId);
        break;
    }
  }
  
  loadSessions(sessions) {
    this.sessions.clear();
    sessions.forEach(session => {
      this.sessions.set(session.id, session);
    });
    this.renderSessions();
    this.updateSessionCount();
  }
  
  updateSession(sessionData) {
    const session = this.sessions.get(sessionData.id);
    if (session) {
      Object.assign(session, sessionData);
    } else {
      this.sessions.set(sessionData.id, sessionData);
    }
    this.renderSessions();
    this.updateSessionCount();
  }
  
  appendLog(sessionId, log) {
    if (this.pauseStream && sessionId === this.selectedSessionId) {
      return; // Skip rendering when paused
    }
    
    if (!this.logBuffer.has(sessionId)) {
      this.logBuffer.set(sessionId, []);
    }
    
    const logs = this.logBuffer.get(sessionId);
    logs.push(log);
    
    // Keep only last 2000 logs per session
    if (logs.length > 2000) {
      logs.shift();
    }
    
    // Update analytics
    this.updateLogAnalytics(log);
    
    // Update UI if this session is selected
    if (sessionId === this.selectedSessionId) {
      this.renderLog(log);
      if (this.autoScroll) {
        this.scrollToBottom();
      }
      this.updateLogStats();
    }
  }
  
  handleProcessExit(sessionId, code, signal) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.status = 'stopped';
      session.exitCode = code;
      session.exitSignal = signal;
      this.renderSessions();
    }
  }
  
  handleProcessError(sessionId, error) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.status = 'error';
      session.error = error;
      this.renderSessions();
    }
  }
  
  handleHookNotification(data) {
    console.log('Hook notification:', data);
    // Could show a toast notification here
  }
  
  handleLogsResponse(sessionId, logs) {
    this.logBuffer.set(sessionId, logs);
    if (sessionId === this.selectedSessionId) {
      this.renderAllLogs();
    }
  }
  
  handleLogsCleared(sessionId) {
    this.logBuffer.delete(sessionId);
    if (sessionId === this.selectedSessionId) {
      this.clearLogDisplay();
    }
  }
  
  renderSessions() {
    const grid = document.getElementById('sessionsGrid');
    const noSessions = document.getElementById('noSessions');
    
    if (this.sessions.size === 0) {
      grid.innerHTML = '';
      grid.appendChild(noSessions);
      this.updateSessionCount(0);
      return;
    }
    
    // Remove no-sessions placeholder
    if (noSessions.parentNode) {
      noSessions.remove();
    }
    
    grid.innerHTML = '';
    
    this.sessions.forEach(session => {
      const card = this.createSessionCard(session);
      card.setAttribute('data-session-id', session.id);
      grid.appendChild(card);
    });
    
    // Apply current filters
    this.applyFilters();
  }
  
  createSessionCard(session) {
    const card = document.createElement('div');
    card.className = `session-card status-${session.status}`;
    if (session.id === this.selectedSessionId) {
      card.classList.add('selected');
    }
    if (this.selectedSessions.has(session.id)) {
      card.classList.add('selected-for-batch');
    }
    
    const uptime = this.formatUptime(session.uptime);
    const health = this.calculateSessionHealth(session);
    const metrics = this.getSessionMetrics(session);
    const frameworkClass = this.getFrameworkClass(session.framework);
    const isFavorite = this.favorites.has(session.id);
    
    card.innerHTML = `
      <input type="checkbox" class="session-checkbox" ${this.selectedSessions.has(session.id) ? 'checked' : ''} 
             onchange="app.toggleSessionSelection('${session.id}', this.checked)">
      
      <div class="session-quick-actions">
        <button class="quick-action-btn" onclick="app.duplicateSession('${session.id}')" title="Duplicate">
          📄
        </button>
        <button class="quick-action-btn" onclick="app.showSessionConfig('${session.id}')" title="Settings">
          ⚙️
        </button>
      </div>
      
      <button class="session-favorite ${isFavorite ? 'active' : ''}" 
              onclick="app.toggleFavorite('${session.id}')" title="${isFavorite ? 'Remove from' : 'Add to'} favorites">
        ${isFavorite ? '⭐' : '☆'}
      </button>
      
      <div class="session-header">
        <div>
          <div class="session-name">
            ${this.escapeHtml(session.name)}
            <span class="session-framework-badge ${frameworkClass}">
              ${this.getFrameworkIcon(session.framework)} ${session.framework || 'unknown'}
            </span>
          </div>
          <div class="session-command">${this.escapeHtml(session.command)}</div>
        </div>
        <div class="session-status ${session.status}">
          <span class="status-dot"></span>
          ${session.status}
        </div>
      </div>
      
      <div class="session-health">
        <div class="health-indicator ${health.level}">
          <span>${health.icon}</span>
          <span>${health.label}</span>
        </div>
        <div class="metric-item">
          <span class="metric-value">${metrics.cpu}%</span>
          <span class="metric-label">CPU</span>
        </div>
        <div class="metric-item">
          <span class="metric-value">${metrics.memory}</span>
          <span class="metric-label">RAM</span>
        </div>
      </div>
      
      <div class="session-metrics">
        <div class="metric-item">
          <div class="metric-value">${session.port}</div>
          <div class="metric-label">Port</div>
        </div>
        <div class="metric-item">
          <div class="metric-value">${session.pid || 'N/A'}</div>
          <div class="metric-label">PID</div>
        </div>
        <div class="metric-item">
          <div class="metric-value">${uptime}</div>
          <div class="metric-label">Uptime</div>
        </div>
        <div class="metric-item">
          <div class="metric-value">${metrics.requests}</div>
          <div class="metric-label">Requests</div>
        </div>
      </div>
      
      <div class="session-actions">
        <button class="btn btn-primary" onclick="app.selectSession('${session.id}')">
          📋 View Logs
        </button>
        ${session.status === 'running' ? `
          <a href="http://localhost:${session.port}" target="_blank" class="btn btn-success">
            🌐 Open App
          </a>
          <button class="btn btn-secondary" onclick="app.restartSession('${session.id}')">
            🔄 Restart
          </button>
          <button class="btn btn-danger" onclick="app.stopSession('${session.id}')">
            ⏹️ Stop
          </button>
        ` : session.status === 'stopped' || session.status === 'error' ? `
          <button class="btn btn-success" onclick="app.startSession('${session.id}')">
            ▶️ Start
          </button>
          <button class="btn btn-secondary" onclick="app.restartSession('${session.id}')">
            🔄 Restart
          </button>
        ` : session.status === 'starting' ? `
          <button class="btn btn-danger" onclick="app.stopSession('${session.id}')">
            ⏹️ Cancel
          </button>
        ` : ''}
      </div>
    `;
    
    // Add click handler for card selection
    card.addEventListener('click', (e) => {
      if (!e.target.closest('.session-actions') && 
          !e.target.closest('.session-checkbox') && 
          !e.target.closest('.session-favorite') &&
          !e.target.closest('.session-quick-actions')) {
        this.selectSession(session.id);
      }
    });
    
    return card;
  }
  
  getStatusIcon(status) {
    switch (status) {
      case 'running': return '🟢';
      case 'starting': return '🟡';
      case 'stopped': return '🔴';
      case 'error': return '❌';
      default: return '⚪';
    }
  }
  
  selectSession(sessionId) {
    if (this.selectedSessionId === sessionId) {
      return; // Already selected
    }
    
    const session = this.sessions.get(sessionId);
    if (!session) {
      console.warn('Attempted to select non-existent session:', sessionId);
      return;
    }
    
    this.selectedSessionId = sessionId;
    this.renderSessions();
    this.updateLogSessionInfo(session);
    this.renderAllLogs();
    
    // Request fresh logs from server
    this.requestSessionLogs(sessionId);
    
    // Track session selection
    this.trackEvent('session_selected', { 
      sessionId, 
      sessionName: session.name,
      framework: session.framework 
    });
  }
  
  renderAllLogs() {
    const content = document.getElementById('logContent');
    const logs = this.logBuffer.get(this.selectedSessionId) || [];
    
    if (logs.length === 0) {
      content.innerHTML = '<div class="log-placeholder">No logs yet for this session</div>';
      return;
    }
    
    content.innerHTML = '';
    logs.forEach(log => this.renderLog(log));
    
    if (this.autoScroll) {
      this.scrollToBottom();
    }
  }
  
  renderLog(log) {
    const content = document.getElementById('logContent');
    
    // Remove placeholder if present
    const placeholder = content.querySelector('.log-placeholder');
    if (placeholder) {
      placeholder.remove();
    }
    
    const entry = document.createElement('div');
    entry.className = `log-entry ${log.type}`;
    
    const timestamp = new Date(log.timestamp).toLocaleTimeString();
    entry.innerHTML = `
      <span class="log-timestamp">${timestamp}</span>
      <span class="log-data">${this.escapeHtml(log.data)}</span>
    `;
    
    content.appendChild(entry);
    
    // Keep max 1000 DOM elements
    const entries = content.querySelectorAll('.log-entry');
    if (entries.length > 1000) {
      entries[0].remove();
    }
  }
  
  clearLogDisplay() {
    const content = document.getElementById('logContent');
    content.innerHTML = '<div class="log-placeholder">Logs cleared</div>';
  }
  
  scrollToBottom() {
    const content = document.getElementById('logContent');
    content.scrollTop = content.scrollHeight;
  }
  
  async stopSession(sessionId, showConfirm = true) {
    if (showConfirm && !confirm('Are you sure you want to stop this server?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/sessions/${sessionId}/stop`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('Session stopped:', result);
    } catch (error) {
      console.error('Error stopping session:', error);
      if (showConfirm) {
        alert(`Failed to stop session: ${error.message}`);
      }
      throw error;
    }
  }
  
  async restartSession(sessionId, showConfirm = true) {
    if (showConfirm && !confirm('Are you sure you want to restart this server?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/sessions/${sessionId}/restart`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('Session restarted:', result);
    } catch (error) {
      console.error('Error restarting session:', error);
      if (showConfirm) {
        alert(`Failed to restart session: ${error.message}`);
      }
      throw error;
    }
  }
  
  updateConnectionStatus(state) {
    const statusElement = document.querySelector('.connection-status');
    const statusDot = document.querySelector('.status-dot');
    const statusText = document.querySelector('.status-text');
    
    if (!statusElement || !statusDot || !statusText) {
      console.warn('Connection status elements not found');
      return;
    }
    
    // Remove all status classes
    statusElement.classList.remove('connected', 'connecting', 'disconnected');
    statusDot.classList.remove('connected');
    
    switch (state) {
      case 'connected':
        statusElement.classList.add('connected');
        statusDot.classList.add('connected');
        statusText.textContent = 'Connected';
        break;
      case 'connecting':
        statusElement.classList.add('connecting');
        statusText.textContent = 'Connecting...';
        break;
      case 'disconnected':
        statusElement.classList.add('disconnected');
        statusText.textContent = `Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`;
        break;
      default:
        statusText.textContent = 'Unknown';
    }
    
    this.connectionState = state;
  }
  
  updateSessionCount() {
    const countElement = document.getElementById('sessionCount');
    const count = this.sessions.size;
    countElement.textContent = `${count} session${count !== 1 ? 's' : ''}`;
  }
  
  bindEvents() {
    // Header buttons
    this.bindElement('refreshBtn', 'click', () => this.refreshSessions());
    this.bindElement('settingsBtn', 'click', () => this.toggleSettings());
    
    // Session filters
    this.bindElement('statusFilter', 'change', (e) => {
      this.filters.status = e.target.value;
      this.applyFilters();
    });
    
    this.bindElement('frameworkFilter', 'change', (e) => {
      this.filters.framework = e.target.value;
      this.applyFilters();
    });
    
    let searchTimeout;
    this.bindElement('searchFilter', 'input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        this.filters.search = e.target.value;
        this.applyFilters();
      }, 300);
    });
    
    this.bindElement('favoritesFilter', 'click', (e) => {
      this.filters.favoritesOnly = !this.filters.favoritesOnly;
      e.target.classList.toggle('active', this.filters.favoritesOnly);
      this.applyFilters();
    });
    
    this.bindElement('clearFilters', 'click', () => {
      this.clearAllFilters();
    });
    
    // Batch operations
    this.bindElement('batchStart', 'click', () => this.batchStartSessions());
    this.bindElement('batchRestart', 'click', () => this.batchRestartSessions());
    this.bindElement('batchStop', 'click', () => this.batchStopSessions());
    this.bindElement('batchClearSelection', 'click', () => this.clearBatchSelection());
    
    // Enhanced log controls
    this.bindElement('clearLogs', 'click', () => this.clearSessionLogs());
    this.bindElement('clearFilter', 'click', () => this.clearLogFilter());
    
    // Regex toggle
    this.bindElement('regexToggle', 'click', (e) => {
      this.regexMode = !this.regexMode;
      e.target.classList.toggle('active', this.regexMode);
      this.filterLogs(document.getElementById('logFilter').value);
    });
    
    // Stream pause/resume
    this.bindElement('pauseStream', 'click', (e) => {
      this.pauseStream = !this.pauseStream;
      e.target.textContent = this.pauseStream ? '\u25b6\ufe0f Resume' : '\u23f8\ufe0f Pause';
      e.target.classList.toggle('active', this.pauseStream);
      this.updateStreamingIndicator();
    });
    
    // Export menu
    this.bindElement('exportLogs', 'click', (e) => {
      e.stopPropagation();
      this.toggleExportMenu();
    });
    
    // Export menu items
    document.querySelectorAll('#exportMenu a').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const format = e.target.dataset.format;
        this.exportSessionLogs(format);
        this.hideExportMenu();
      });
    });
    
    // Bookmarking
    this.bindElement('bookmarkLog', 'click', () => this.addBookmark());
    
    // Navigation buttons
    this.bindElement('jumpToTop', 'click', () => this.jumpToTop());
    this.bindElement('jumpToBottom', 'click', () => this.jumpToBottom());
    
    // Level filters
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        this.logLevelFilter = e.target.dataset.level;
        this.applyLogFilters();
      });
    });
    
    // Sidebar toggle
    this.bindElement('toggleSidebar', 'click', () => this.toggleSidebar());
    
    // Search navigation
    this.bindElement('prevResult', 'click', () => this.navigateSearchResults(-1));
    this.bindElement('nextResult', 'click', () => this.navigateSearchResults(1));
    this.bindElement('closeSearchResults', 'click', () => this.hideSearchResults());
    
    // Auto-scroll toggle
    this.bindElement('autoScroll', 'click', (e) => {
      this.autoScroll = !this.autoScroll;
      e.target.classList.toggle('active', this.autoScroll);
      
      if (this.autoScroll) {
        this.scrollToBottom();
      }
      
      this.trackEvent('auto_scroll_toggled', { enabled: this.autoScroll });
    });
    
    // Log filter with debouncing
    let filterTimeout;
    this.bindElement('logFilter', 'input', (e) => {
      clearTimeout(filterTimeout);
      filterTimeout = setTimeout(() => {
        this.filterLogs(e.target.value);
      }, 300);
    });
    
    // Log filter with enhanced key support
    this.bindElement('logFilter', 'keydown', (e) => {
      if (e.key === 'Enter') {
        clearTimeout(filterTimeout);
        this.filterLogs(e.target.value);
        this.performSearch(e.target.value);
      } else if (e.key === 'Escape') {
        this.clearLogFilter();
        this.hideSearchResults();
      } else if (e.key === 'ArrowDown' && this.searchResults.length > 0) {
        e.preventDefault();
        this.navigateSearchResults(1);
      } else if (e.key === 'ArrowUp' && this.searchResults.length > 0) {
        e.preventDefault();
        this.navigateSearchResults(-1);
      }
    });
    
    // Handle scroll events for enhanced features
    this.bindElement('logContent', 'scroll', (e) => {
      const content = e.target;
      const isAtBottom = content.scrollTop + content.clientHeight >= content.scrollHeight - 10;
      
      if (!isAtBottom && this.autoScroll) {
        this.autoScroll = false;
        const autoScrollBtn = document.getElementById('autoScroll');
        if (autoScrollBtn) {
          autoScrollBtn.classList.remove('active');
        }
      }
      
      this.updateScrollPosition();
    });
    
    // Click outside to close menus
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.log-export-menu')) {
        this.hideExportMenu();
      }
    });
    
    // Enhanced keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      this.handleEnhancedKeyboardShortcuts(e);
    });
    
    // Window visibility change (pause updates when tab is hidden)
    document.addEventListener('visibilitychange', () => {
      this.handleVisibilityChange();
    });
    
    // Window resize for responsive adjustments
    window.addEventListener('resize', () => {
      this.handleWindowResize();
    });
  }
  
  filterLogs(filter) {
    this.currentFilter = filter;
    const content = document.getElementById('logContent');
    const entries = content.querySelectorAll('.log-entry');
    const filterLower = filter.toLowerCase().trim();
    
    let visibleCount = 0;
    let totalCount = entries.length;
    
    entries.forEach(entry => {
      entry.classList.remove('filtered', 'highlight');
      
      if (!filterLower) {
        entry.style.display = 'flex';
        visibleCount++;
        return;
      }
      
      const text = entry.textContent.toLowerCase();
      const matches = text.includes(filterLower);
      
      if (matches) {
        entry.style.display = 'flex';
        entry.classList.add('highlight');
        visibleCount++;
      } else {
        entry.style.display = 'none';
        entry.classList.add('filtered');
      }
    });
    
    // Update filter count display
    this.updateLogFilterCount(visibleCount, totalCount, filterLower);
    
    // Track filtering usage
    if (filterLower) {
      this.trackEvent('logs_filtered', { 
        filter: filterLower, 
        visibleCount, 
        totalCount 
      });
    }
  }
  
  startPeriodicUpdates() {
    // Refresh session data every 30 seconds (only when page is visible)
    this.periodicUpdateInterval = setInterval(async () => {
      if (document.hidden) {
        return; // Skip updates when tab is hidden
      }
      
      try {
        await this.refreshSessions();
      } catch (error) {
        console.error('Error in periodic update:', error);
      }
    }, 30000);
    
    // Performance metrics update every 60 seconds
    this.metricsUpdateInterval = setInterval(() => {
      this.updatePerformanceMetrics();
    }, 60000);
  }
  
  formatUptime(ms) {
    if (!ms || ms < 0) return 'Unknown';
    
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days}d ${hours % 24}h ${minutes % 60}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }
  
  escapeHtml(text) {
    if (typeof text !== 'string') {
      return String(text);
    }
    
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Additional utility methods for enhanced functionality
  
  /**
   * Safely bind event listener to element
   */
  bindElement(elementId, event, handler) {
    const element = document.getElementById(elementId);
    if (element) {
      element.addEventListener(event, handler);
    } else {
      console.warn(`Element not found: ${elementId}`);
    }
  }

  /**
   * Send WebSocket message safely
   */
  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
      return true;
    }
    console.warn('WebSocket not connected, message not sent:', data);
    return false;
  }

  /**
   * Request logs for a specific session
   */
  requestSessionLogs(sessionId, options = {}) {
    this.send({
      type: 'get-logs',
      data: {
        sessionId,
        options: { tail: 500, ...options }
      }
    });
  }

  /**
   * Load initial dashboard state
   */
  async loadInitialState() {
    try {
      const response = await fetch('/api/sessions');
      if (response.ok) {
        const data = await response.json();
        this.loadSessions(data.sessions);
      }
    } catch (error) {
      console.error('Error loading initial state:', error);
      throw error;
    }
  }

  /**
   * Show loading state
   */
  showLoadingState() {
    const container = document.querySelector('.container');
    if (container) {
      container.classList.add('loading');
    }
  }

  /**
   * Hide loading state
   */
  hideLoadingState() {
    const container = document.querySelector('.container');
    if (container) {
      container.classList.remove('loading');
    }
  }

  /**
   * Show error state
   */
  showErrorState(message) {
    const container = document.querySelector('.container');
    if (container) {
      const errorDiv = document.createElement('div');
      errorDiv.className = 'error-state';
      errorDiv.innerHTML = `
        <div class="error-content">
          <h3>⚠️ ${message}</h3>
          <button onclick="window.location.reload()" class="btn btn-primary">
            🔄 Reload Page
          </button>
        </div>
      `;
      container.appendChild(errorDiv);
    }
  }

  /**
   * Update log session info display
   */
  updateLogSessionInfo(session) {
    const infoElement = document.getElementById('logSessionInfo');
    if (infoElement && session) {
      infoElement.innerHTML = `
        <span>Session: ${this.escapeHtml(session.name)}</span>
        <span>Port: ${session.port}</span>
        <span>Framework: ${session.framework || 'Unknown'}</span>
        <span>Status: ${session.status}</span>
      `;
    }
  }

  /**
   * Update log filter count display
   */
  updateLogFilterCount(visible, total, filter) {
    const countElement = document.getElementById('logFilterCount');
    if (countElement) {
      if (filter) {
        countElement.textContent = `Showing ${visible}/${total} logs`;
        countElement.style.display = 'inline';
      } else {
        countElement.style.display = 'none';
      }
    }
  }

  /**
   * Clear log filter
   */
  clearLogFilter() {
    const filterInput = document.getElementById('logFilter');
    if (filterInput) {
      filterInput.value = '';
      this.filterLogs('');
    }
  }

  /**
   * Clear session logs
   */
  clearSessionLogs() {
    if (!this.selectedSessionId) {
      alert('Please select a session first');
      return;
    }

    if (confirm('Clear all logs for this session?')) {
      this.send({
        type: 'clear-logs',
        data: { sessionId: this.selectedSessionId }
      });
    }
  }

  /**
   * Export session logs
   */
  async exportSessionLogs() {
    if (!this.selectedSessionId) {
      alert('Please select a session first');
      return;
    }

    try {
      const response = await fetch(`/api/sessions/${this.selectedSessionId}/export?format=txt`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `logs-${this.selectedSessionId}-${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error exporting logs:', error);
      alert('Failed to export logs');
    }
  }

  /**
   * Refresh sessions from server
   */
  async refreshSessions() {
    try {
      const response = await fetch('/api/sessions');
      if (response.ok) {
        const data = await response.json();
        this.loadSessions(data.sessions);
      }
    } catch (error) {
      console.error('Error refreshing sessions:', error);
    }
  }

  /**
   * Toggle settings panel (placeholder)
   */
  toggleSettings() {
    console.log('Settings panel - to be implemented in future version');
    // Future: Show settings modal/panel
  }

  /**
   * Handle keyboard shortcuts
   */
  handleKeyboardShortcuts(e) {
    // Only handle shortcuts when not typing in input fields
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      return;
    }

    switch (e.key) {
      case 'r':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          this.refreshSessions();
        }
        break;
      case '/':
        e.preventDefault();
        const filterInput = document.getElementById('logFilter');
        if (filterInput) {
          filterInput.focus();
        }
        break;
      case 'Escape':
        this.clearLogFilter();
        break;
    }
  }

  /**
   * Handle window visibility changes
   */
  handleVisibilityChange() {
    if (document.hidden) {
      console.log('Dashboard hidden, pausing updates');
    } else {
      console.log('Dashboard visible, resuming updates');
      this.refreshSessions();
    }
  }

  /**
   * Handle window resize
   */
  handleWindowResize() {
    // Responsive adjustments if needed
    if (this.autoScroll) {
      this.scrollToBottom();
    }
  }

  /**
   * Update performance metrics
   */
  updatePerformanceMetrics() {
    const metrics = {
      ...this.performanceMetrics,
      uptime: Date.now() - (this.performanceMetrics.startTime || Date.now()),
      sessionsCount: this.sessions.size,
      connectionState: this.connectionState
    };

    // Could send to analytics service or display in settings
    console.debug('Performance metrics:', metrics);
  }

  /**
   * Track events for analytics
   */
  trackEvent(eventName, data = {}) {
    const event = {
      name: eventName,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      ...data
    };

    // Future: Send to analytics service
    console.debug('Event tracked:', event);
  }

  // === NEW SESSION MANAGEMENT METHODS ===

  /**
   * Toggle session selection for batch operations
   */
  toggleSessionSelection(sessionId, selected) {
    if (selected) {
      this.selectedSessions.add(sessionId);
    } else {
      this.selectedSessions.delete(sessionId);
    }
    
    this.updateBatchOperationsUI();
    this.renderSessions();
  }

  /**
   * Update batch operations UI visibility and count
   */
  updateBatchOperationsUI() {
    const batchOps = document.getElementById('batchOperations');
    const batchCount = document.getElementById('batchCount');
    
    if (this.selectedSessions.size > 0) {
      batchOps.classList.add('show');
      batchCount.textContent = `${this.selectedSessions.size} selected`;
    } else {
      batchOps.classList.remove('show');
    }
  }

  /**
   * Clear batch selection
   */
  clearBatchSelection() {
    this.selectedSessions.clear();
    this.updateBatchOperationsUI();
    this.renderSessions();
  }

  /**
   * Batch start sessions
   */
  async batchStartSessions() {
    if (this.selectedSessions.size === 0) return;
    
    if (!confirm(`Start ${this.selectedSessions.size} selected sessions?`)) {
      return;
    }
    
    const promises = Array.from(this.selectedSessions).map(sessionId => 
      this.startSession(sessionId, false)
    );
    
    try {
      await Promise.all(promises);
      this.clearBatchSelection();
    } catch (error) {
      console.error('Batch start failed:', error);
    }
  }

  /**
   * Batch restart sessions
   */
  async batchRestartSessions() {
    if (this.selectedSessions.size === 0) return;
    
    if (!confirm(`Restart ${this.selectedSessions.size} selected sessions?`)) {
      return;
    }
    
    const promises = Array.from(this.selectedSessions).map(sessionId => 
      this.restartSession(sessionId, false)
    );
    
    try {
      await Promise.all(promises);
      this.clearBatchSelection();
    } catch (error) {
      console.error('Batch restart failed:', error);
    }
  }

  /**
   * Batch stop sessions
   */
  async batchStopSessions() {
    if (this.selectedSessions.size === 0) return;
    
    if (!confirm(`Stop ${this.selectedSessions.size} selected sessions?`)) {
      return;
    }
    
    const promises = Array.from(this.selectedSessions).map(sessionId => 
      this.stopSession(sessionId, false)
    );
    
    try {
      await Promise.all(promises);
      this.clearBatchSelection();
    } catch (error) {
      console.error('Batch stop failed:', error);
    }
  }

  /**
   * Start a session
   */
  async startSession(sessionId, showConfirm = true) {
    if (showConfirm && !confirm('Start this server?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/sessions/${sessionId}/start`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('Session started:', result);
    } catch (error) {
      console.error('Error starting session:', error);
      if (showConfirm) {
        alert(`Failed to start session: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Toggle favorite status for a session
   */
  toggleFavorite(sessionId) {
    if (this.favorites.has(sessionId)) {
      this.favorites.delete(sessionId);
    } else {
      this.favorites.add(sessionId);
    }
    
    // Save to localStorage
    localStorage.setItem('sessionFavorites', JSON.stringify([...this.favorites]));
    
    this.renderSessions();
    this.trackEvent('session_favorite_toggled', { sessionId, isFavorite: this.favorites.has(sessionId) });
  }

  /**
   * Apply all active filters to sessions
   */
  applyFilters() {
    const grid = document.getElementById('sessionsGrid');
    const cards = grid.querySelectorAll('.session-card');
    
    let visibleCount = 0;
    
    this.sessions.forEach((session, sessionId) => {
      const card = grid.querySelector(`.session-card[data-session-id="${sessionId}"]`);
      if (!card) return;
      
      let visible = true;
      
      // Status filter
      if (this.filters.status !== 'all' && session.status !== this.filters.status) {
        visible = false;
      }
      
      // Framework filter
      if (this.filters.framework !== 'all' && 
          (session.framework || 'unknown').toLowerCase() !== this.filters.framework.toLowerCase()) {
        visible = false;
      }
      
      // Search filter
      if (this.filters.search) {
        const searchText = this.filters.search.toLowerCase();
        const sessionText = `${session.name} ${session.command} ${session.framework || ''}`.toLowerCase();
        if (!sessionText.includes(searchText)) {
          visible = false;
        }
      }
      
      // Favorites filter
      if (this.filters.favoritesOnly && !this.favorites.has(sessionId)) {
        visible = false;
      }
      
      card.style.display = visible ? 'flex' : 'none';
      if (visible) visibleCount++;
    });
    
    // Update session count to show filtered results
    this.updateSessionCount(visibleCount);
  }

  /**
   * Clear all filters
   */
  clearAllFilters() {
    this.filters = {
      status: 'all',
      framework: 'all',
      search: '',
      favoritesOnly: false
    };
    
    // Reset UI elements
    const statusFilter = document.getElementById('statusFilter');
    const frameworkFilter = document.getElementById('frameworkFilter');
    const searchFilter = document.getElementById('searchFilter');
    const favoritesFilter = document.getElementById('favoritesFilter');
    
    if (statusFilter) statusFilter.value = 'all';
    if (frameworkFilter) frameworkFilter.value = 'all';
    if (searchFilter) searchFilter.value = '';
    if (favoritesFilter) favoritesFilter.classList.remove('active');
    
    this.applyFilters();
  }

  /**
   * Calculate session health based on various metrics
   */
  calculateSessionHealth(session) {
    const metrics = this.getSessionMetrics(session);
    
    if (session.status === 'error') {
      return { level: 'critical', label: 'Critical', icon: '🚨' };
    }
    
    if (session.status === 'stopped') {
      return { level: 'critical', label: 'Offline', icon: '⚫' };
    }
    
    if (session.status === 'starting') {
      return { level: 'warning', label: 'Starting', icon: '🟡' };
    }
    
    if (session.status === 'running') {
      const cpuUsage = parseFloat(metrics.cpu);
      const memoryUsage = this.parseMemoryUsage(metrics.memory);
      
      if (cpuUsage > 80 || memoryUsage > 80) {
        return { level: 'warning', label: 'High Load', icon: '⚠️' };
      } else if (cpuUsage > 50 || memoryUsage > 50) {
        return { level: 'good', label: 'Moderate', icon: '🔵' };
      } else {
        return { level: 'excellent', label: 'Excellent', icon: '🟢' };
      }
    }
    
    return { level: 'warning', label: 'Unknown', icon: '❓' };
  }

  /**
   * Get session metrics (CPU, memory, requests, etc.)
   */
  getSessionMetrics(session) {
    // In a real implementation, these would come from the server
    // For now, we'll simulate realistic metrics
    const baseMetrics = {
      cpu: (Math.random() * 60 + 5).toFixed(1),
      memory: this.formatMemoryUsage(Math.random() * 200 + 50),
      requests: Math.floor(Math.random() * 1000),
      errors: Math.floor(Math.random() * 10)
    };
    
    return this.sessionMetrics.get(session.id) || baseMetrics;
  }

  /**
   * Format memory usage
   */
  formatMemoryUsage(mb) {
    if (mb > 1024) {
      return `${(mb / 1024).toFixed(1)}GB`;
    }
    return `${Math.round(mb)}MB`;
  }

  /**
   * Parse memory usage to percentage (simplified)
   */
  parseMemoryUsage(memoryStr) {
    const value = parseFloat(memoryStr);
    const isGB = memoryStr.includes('GB');
    const maxMemory = 8 * 1024; // Assume 8GB max
    const memoryMB = isGB ? value * 1024 : value;
    return (memoryMB / maxMemory) * 100;
  }

  /**
   * Get framework CSS class
   */
  getFrameworkClass(framework) {
    if (!framework) return 'default';
    const fw = framework.toLowerCase();
    if (fw.includes('react') || fw.includes('vite')) return 'react';
    if (fw.includes('django')) return 'django';
    if (fw.includes('laravel')) return 'laravel';
    if (fw.includes('node')) return 'nodejs';
    return 'default';
  }

  /**
   * Get framework icon
   */
  getFrameworkIcon(framework) {
    if (!framework) return '❓';
    const fw = framework.toLowerCase();
    if (fw.includes('react') || fw.includes('vite')) return '⚛️';
    if (fw.includes('django')) return '🐍';
    if (fw.includes('laravel')) return '🎼';
    if (fw.includes('node')) return '🟢';
    return '📦';
  }

  /**
   * Duplicate session configuration
   */
  async duplicateSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    
    try {
      const response = await fetch(`/api/sessions/${sessionId}/duplicate`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('Session duplicated:', result);
      this.refreshSessions();
    } catch (error) {
      console.error('Error duplicating session:', error);
      alert(`Failed to duplicate session: ${error.message}`);
    }
  }

  /**
   * Show session configuration modal
   */
  showSessionConfig(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    
    // This would open a configuration modal in a real implementation
    console.log('Session config for:', session);
    alert('Session configuration panel - to be implemented in future version');
  }

  /**
   * Update session count display
   */
  updateSessionCount(filteredCount = null) {
    const countElement = document.getElementById('sessionCount');
    const totalCount = this.sessions.size;
    const displayCount = filteredCount !== null ? filteredCount : totalCount;
    
    if (filteredCount !== null && filteredCount < totalCount) {
      countElement.textContent = `${displayCount}/${totalCount} sessions`;
    } else {
      countElement.textContent = `${displayCount} session${displayCount !== 1 ? 's' : ''}`;
    }
  }

  // ===============================================
  // ENHANCED LOG VIEWER METHODS - STORY 19.5
  // ===============================================

  /**
   * Advanced log filtering with regex support and level filtering
   */
  filterLogs(filter) {
    this.currentFilter = filter;
    const content = document.getElementById('logContent');
    const entries = content.querySelectorAll('.log-entry');
    const filterValue = filter.trim();
    
    let visibleCount = 0;
    let totalCount = entries.length;
    
    entries.forEach(entry => {
      entry.classList.remove('filtered', 'highlight', 'search-match');
      
      // Apply level filter
      if (this.logLevelFilter !== 'all') {
        const entryLevel = entry.classList.contains('stderr') ? 'stderr' :
                           entry.classList.contains('warn') ? 'warn' :
                           entry.classList.contains('info') ? 'info' :
                           entry.classList.contains('debug') ? 'debug' : 'stdout';
        
        if (entryLevel !== this.logLevelFilter) {
          entry.style.display = 'none';
          entry.classList.add('filtered');
          return;
        }
      }
      
      if (!filterValue) {
        entry.style.display = 'flex';
        visibleCount++;
        return;
      }
      
      const text = entry.textContent;
      let matches = false;
      
      try {
        if (this.regexMode) {
          const regex = new RegExp(filterValue, 'gi');
          matches = regex.test(text);
          if (matches) {
            // Highlight matches
            const logData = entry.querySelector('.log-data');
            if (logData) {
              logData.innerHTML = logData.textContent.replace(regex, '<span class="search-highlight">$&</span>');
            }
          }
        } else {
          matches = text.toLowerCase().includes(filterValue.toLowerCase());
          if (matches) {
            // Highlight matches
            const logData = entry.querySelector('.log-data');
            if (logData) {
              const originalText = logData.textContent;
              const highlightedText = originalText.replace(
                new RegExp(this.escapeRegex(filterValue), 'gi'),
                '<span class="search-highlight">$&</span>'
              );
              logData.innerHTML = highlightedText;
            }
          }
        }
      } catch (error) {
        // Invalid regex, fall back to simple text search
        matches = text.toLowerCase().includes(filterValue.toLowerCase());
      }
      
      if (matches) {
        entry.style.display = 'flex';
        entry.classList.add('search-match');
        visibleCount++;
      } else {
        entry.style.display = 'none';
        entry.classList.add('filtered');
      }
    });
    
    // Update filter count display
    this.updateLogFilterCount(visibleCount, totalCount, filterValue);
    
    // Track filtering usage
    if (filterValue) {
      this.trackEvent('logs_filtered', { 
        filter: filterValue, 
        visibleCount, 
        totalCount,
        regexMode: this.regexMode 
      });
    }
  }

  /**
   * Perform advanced search with results navigation
   */
  performSearch(query) {
    if (!query.trim()) {
      this.hideSearchResults();
      return;
    }
    
    const content = document.getElementById('logContent');
    const entries = Array.from(content.querySelectorAll('.log-entry:not(.filtered)'));
    
    this.searchResults = [];
    
    entries.forEach((entry, index) => {
      const text = entry.textContent;
      let matches = false;
      
      try {
        if (this.regexMode) {
          const regex = new RegExp(query, 'gi');
          matches = regex.test(text);
        } else {
          matches = text.toLowerCase().includes(query.toLowerCase());
        }
      } catch (error) {
        matches = text.toLowerCase().includes(query.toLowerCase());
      }
      
      if (matches) {
        this.searchResults.push({
          element: entry,
          index: index,
          timestamp: entry.querySelector('.log-timestamp')?.textContent || '',
          preview: text.substring(0, 100) + (text.length > 100 ? '...' : '')
        });
      }
    });
    
    if (this.searchResults.length > 0) {
      this.showSearchResults();
      this.currentSearchIndex = 0;
      this.navigateToSearchResult(0);
    } else {
      this.hideSearchResults();
    }
  }

  /**
   * Navigate search results
   */
  navigateSearchResults(direction) {
    if (this.searchResults.length === 0) return;
    
    this.currentSearchIndex += direction;
    
    if (this.currentSearchIndex >= this.searchResults.length) {
      this.currentSearchIndex = 0;
    } else if (this.currentSearchIndex < 0) {
      this.currentSearchIndex = this.searchResults.length - 1;
    }
    
    this.navigateToSearchResult(this.currentSearchIndex);
  }

  /**
   * Navigate to specific search result
   */
  navigateToSearchResult(index) {
    if (!this.searchResults[index]) return;
    
    // Clear previous highlights
    document.querySelectorAll('.log-entry.search-current').forEach(entry => {
      entry.classList.remove('search-current');
    });
    
    // Highlight current result
    const result = this.searchResults[index];
    result.element.classList.add('search-current');
    result.element.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'center' 
    });
    
    // Update search navigation UI
    this.updateSearchNavigation();
  }

  /**
   * Show search results panel
   */
  showSearchResults() {
    const panel = document.getElementById('searchResultsPanel');
    if (panel) {
      panel.classList.add('show');
      this.searchPanelVisible = true;
      this.renderSearchResults();
    }
  }

  /**
   * Hide search results panel
   */
  hideSearchResults() {
    const panel = document.getElementById('searchResultsPanel');
    if (panel) {
      panel.classList.remove('show');
      this.searchPanelVisible = false;
    }
    
    // Clear search highlights
    document.querySelectorAll('.log-entry.search-current, .log-entry.search-match').forEach(entry => {
      entry.classList.remove('search-current', 'search-match');
    });
    
    this.searchResults = [];
    this.currentSearchIndex = -1;
  }

  /**
   * Render search results list
   */
  renderSearchResults() {
    const list = document.getElementById('searchResultsList');
    if (!list) return;
    
    list.innerHTML = '';
    
    this.searchResults.forEach((result, index) => {
      const item = document.createElement('div');
      item.className = 'search-result-item';
      if (index === this.currentSearchIndex) {
        item.classList.add('current');
      }
      
      item.innerHTML = `
        <div class="search-result-timestamp">${result.timestamp}</div>
        <div class="search-result-preview">${this.escapeHtml(result.preview)}</div>
      `;
      
      item.addEventListener('click', () => {
        this.currentSearchIndex = index;
        this.navigateToSearchResult(index);
        this.renderSearchResults(); // Re-render to update current item
      });
      
      list.appendChild(item);
    });
  }

  /**
   * Update search navigation display
   */
  updateSearchNavigation() {
    const info = document.getElementById('searchResultsInfo');
    if (info && this.searchResults.length > 0) {
      info.textContent = `${this.currentSearchIndex + 1} of ${this.searchResults.length}`;
    }
  }

  /**
   * Add bookmark at current scroll position
   */
  addBookmark() {
    if (!this.selectedSessionId) return;
    
    const content = document.getElementById('logContent');
    const scrollPosition = content.scrollTop;
    const timestamp = Date.now();
    
    this.bookmarks.set(timestamp, {
      sessionId: this.selectedSessionId,
      scrollPosition: scrollPosition,
      timestamp: new Date().toLocaleTimeString(),
      label: `Bookmark ${this.bookmarks.size + 1}`
    });
    
    this.renderBookmarks();
    this.trackEvent('bookmark_added', { sessionId: this.selectedSessionId });
  }

  /**
   * Render bookmarks in toolbar
   */
  renderBookmarks() {
    const container = document.getElementById('bookmarksContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    Array.from(this.bookmarks.entries())
      .filter(([_, bookmark]) => bookmark.sessionId === this.selectedSessionId)
      .forEach(([id, bookmark]) => {
        const item = document.createElement('div');
        item.className = 'bookmark-item';
        item.textContent = bookmark.timestamp;
        item.title = bookmark.label;
        
        item.addEventListener('click', () => {
          const content = document.getElementById('logContent');
          if (content) {
            content.scrollTop = bookmark.scrollPosition;
          }
        });
        
        container.appendChild(item);
      });
  }

  /**
   * Jump to top of logs
   */
  jumpToTop() {
    const content = document.getElementById('logContent');
    if (content) {
      content.scrollTop = 0;
    }
  }

  /**
   * Jump to bottom of logs
   */
  jumpToBottom() {
    const content = document.getElementById('logContent');
    if (content) {
      content.scrollTop = content.scrollHeight;
    }
  }

  /**
   * Toggle analytics sidebar
   */
  toggleSidebar() {
    const sidebar = document.getElementById('logSidebar');
    if (sidebar) {
      this.sidebarVisible = !this.sidebarVisible;
      sidebar.classList.toggle('show', this.sidebarVisible);
      
      if (this.sidebarVisible) {
        this.updateAnalyticsSidebar();
      }
    }
  }

  /**
   * Toggle export menu
   */
  toggleExportMenu() {
    const menu = document.getElementById('exportMenu');
    if (menu) {
      menu.classList.toggle('show');
    }
  }

  /**
   * Hide export menu
   */
  hideExportMenu() {
    const menu = document.getElementById('exportMenu');
    if (menu) {
      menu.classList.remove('show');
    }
  }

  /**
   * Enhanced export with multiple formats
   */
  async exportSessionLogs(format = 'txt') {
    if (!this.selectedSessionId) {
      alert('Please select a session first');
      return;
    }

    const logs = this.logBuffer.get(this.selectedSessionId) || [];
    const session = this.sessions.get(this.selectedSessionId);
    const sessionName = session ? session.name : this.selectedSessionId;
    const timestamp = new Date().toISOString().split('T')[0];
    
    let content, filename, mimeType;
    
    switch (format) {
      case 'json':
        content = JSON.stringify({
          session: sessionName,
          exportDate: new Date().toISOString(),
          totalLogs: logs.length,
          logs: logs
        }, null, 2);
        filename = `logs-${sessionName}-${timestamp}.json`;
        mimeType = 'application/json';
        break;
        
      case 'csv':
        const csvHeaders = 'Timestamp,Type,Data\\n';
        const csvRows = logs.map(log => 
          `"${new Date(log.timestamp).toISOString()}","${log.type}","${log.data.replace(/"/g, '""')}"`
        ).join('\\n');
        content = csvHeaders + csvRows;
        filename = `logs-${sessionName}-${timestamp}.csv`;
        mimeType = 'text/csv';
        break;
        
      case 'filtered':
        const visibleEntries = Array.from(document.querySelectorAll('.log-entry:not(.filtered)'));
        const filteredLogs = visibleEntries.map(entry => {
          const timestamp = entry.querySelector('.log-timestamp')?.textContent || '';
          const data = entry.querySelector('.log-data')?.textContent || '';
          return `[${timestamp}] ${data}`;
        }).join('\\n');
        content = filteredLogs;
        filename = `logs-${sessionName}-filtered-${timestamp}.txt`;
        mimeType = 'text/plain';
        break;
        
      default: // txt
        content = logs.map(log => 
          `[${new Date(log.timestamp).toLocaleTimeString()}] ${log.data}`
        ).join('\\n');
        filename = `logs-${sessionName}-${timestamp}.txt`;
        mimeType = 'text/plain';
    }

    try {
      const blob = new Blob([content], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      this.trackEvent('logs_exported', { 
        sessionId: this.selectedSessionId, 
        format: format,
        logCount: logs.length 
      });
    } catch (error) {
      console.error('Error exporting logs:', error);
      alert('Failed to export logs');
    }
  }

  /**
   * Update log analytics
   */
  updateLogAnalytics(log) {
    const now = Date.now();
    
    // Update counters
    if (log.type === 'stderr' || log.data.toLowerCase().includes('error')) {
      this.logAnalytics.errorCount++;
    }
    if (log.type === 'warn' || log.data.toLowerCase().includes('warning')) {
      this.logAnalytics.warningCount++;
    }
    
    // Track recent logs for rate calculation
    this.logAnalytics.recentLogs.push(now);
    this.logAnalytics.recentLogs = this.logAnalytics.recentLogs.filter(time => now - time < 60000); // Last minute
    
    // Calculate log rate every 5 seconds
    if (now - this.logAnalytics.lastRateCalculation > 5000) {
      this.logAnalytics.logRate = this.logAnalytics.recentLogs.length / 60; // per second
      this.logAnalytics.lastRateCalculation = now;
      this.updateAnalyticsDisplay();
    }
    
    // Pattern detection
    this.detectLogPatterns(log);
  }

  /**
   * Detect common log patterns
   */
  detectLogPatterns(log) {
    const patterns = [
      { name: 'HTTP Error', regex: /HTTP\\s+(4|5)\\d{2}/, type: 'error' },
      { name: 'Database Error', regex: /database|sql|connection.*error/i, type: 'error' },
      { name: 'Memory Warning', regex: /memory|heap|out of memory/i, type: 'warning' },
      { name: 'Performance Issue', regex: /slow|timeout|performance/i, type: 'warning' },
      { name: 'API Call', regex: /GET|POST|PUT|DELETE|PATCH/i, type: 'info' }
    ];
    
    patterns.forEach(pattern => {
      if (pattern.regex.test(log.data)) {
        const key = pattern.name;
        const current = this.logAnalytics.patterns.get(key) || { count: 0, type: pattern.type };
        current.count++;
        this.logAnalytics.patterns.set(key, current);
      }
    });
  }

  /**
   * Update analytics display
   */
  updateAnalyticsDisplay() {
    // Update toolbar analytics
    const errorRate = document.getElementById('errorRate');
    const logRate = document.getElementById('logRate');
    const totalLogs = document.getElementById('totalLogs');
    
    if (errorRate) errorRate.textContent = `Errors: ${this.logAnalytics.errorCount}`;
    if (logRate) logRate.textContent = `Rate: ${this.logAnalytics.logRate.toFixed(1)}/s`;
    if (totalLogs) {
      const logs = this.logBuffer.get(this.selectedSessionId) || [];
      totalLogs.textContent = `Total: ${logs.length}`;
    }
    
    // Update sidebar if visible
    if (this.sidebarVisible) {
      this.updateAnalyticsSidebar();
    }
  }

  /**
   * Update analytics sidebar
   */
  updateAnalyticsSidebar() {
    const messageRate = document.getElementById('messageRate');
    const errorRatePercent = document.getElementById('errorRatePercent');
    const bufferSize = document.getElementById('bufferSize');
    const patternList = document.getElementById('patternList');
    
    if (messageRate) {
      messageRate.textContent = this.logAnalytics.logRate.toFixed(1);
    }
    
    if (errorRatePercent) {
      const logs = this.logBuffer.get(this.selectedSessionId) || [];
      const errorPercent = logs.length > 0 ? ((this.logAnalytics.errorCount / logs.length) * 100).toFixed(1) : 0;
      errorRatePercent.textContent = `${errorPercent}%`;
    }
    
    if (bufferSize) {
      const logs = this.logBuffer.get(this.selectedSessionId) || [];
      const sizeKB = (JSON.stringify(logs).length / 1024).toFixed(1);
      bufferSize.textContent = `${sizeKB} KB`;
    }
    
    if (patternList) {
      patternList.innerHTML = '';
      if (this.logAnalytics.patterns.size === 0) {
        patternList.innerHTML = '<div class="pattern-item">No patterns detected</div>';
      } else {
        Array.from(this.logAnalytics.patterns.entries())
          .sort((a, b) => b[1].count - a[1].count)
          .slice(0, 5)
          .forEach(([name, data]) => {
            const item = document.createElement('div');
            item.className = `pattern-item ${data.type}`;
            item.textContent = `${name}: ${data.count}`;
            patternList.appendChild(item);
          });
      }
    }
    
    // Update chart if available
    this.updateLogChart();
  }

  /**
   * Update log visualization chart
   */
  updateLogChart() {
    const canvas = document.getElementById('logChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Simple bar chart showing log types distribution
    const logs = this.logBuffer.get(this.selectedSessionId) || [];
    const distribution = {
      stdout: 0,
      stderr: 0,
      info: 0,
      warn: 0,
      debug: 0
    };
    
    logs.forEach(log => {
      distribution[log.type] = (distribution[log.type] || 0) + 1;
    });
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw simple bars
    const barWidth = canvas.width / Object.keys(distribution).length;
    const maxCount = Math.max(...Object.values(distribution), 1);
    
    Object.entries(distribution).forEach(([type, count], index) => {
      const barHeight = (count / maxCount) * (canvas.height - 20);
      const x = index * barWidth;
      const y = canvas.height - barHeight - 10;
      
      // Set color based on type
      ctx.fillStyle = type === 'stderr' ? '#ef4444' :
                      type === 'warn' ? '#f59e0b' :
                      type === 'info' ? '#06b6d4' :
                      type === 'debug' ? '#64748b' : '#10b981';
      
      ctx.fillRect(x + 2, y, barWidth - 4, barHeight);
      
      // Draw label
      ctx.fillStyle = '#94a3b8';
      ctx.font = '8px monospace';
      ctx.fillText(type.substring(0, 3), x + 2, canvas.height - 2);
    });
  }

  /**
   * Apply log level filters
   */
  applyLogFilters() {
    this.filterLogs(this.currentFilter);
  }

  /**
   * Update streaming indicator
   */
  updateStreamingIndicator() {
    let indicator = document.querySelector('.streaming-indicator');
    
    if (!indicator && this.selectedSessionId) {
      indicator = document.createElement('div');
      indicator.className = 'streaming-indicator';
      document.getElementById('logContent').appendChild(indicator);
    }
    
    if (indicator) {
      if (this.pauseStream) {
        indicator.className = 'streaming-indicator paused';
        indicator.innerHTML = '<div class="streaming-dot"></div>Stream Paused';
      } else {
        indicator.className = 'streaming-indicator';
        indicator.innerHTML = '<div class="streaming-dot"></div>Live Stream';
      }
    }
  }

  /**
   * Update scroll position indicator
   */
  updateScrollPosition() {
    const content = document.getElementById('logContent');
    const position = document.getElementById('logPosition');
    
    if (content && position) {
      const scrollPercent = Math.round((content.scrollTop / (content.scrollHeight - content.clientHeight)) * 100) || 0;
      position.textContent = `${scrollPercent}%`;
    }
  }

  /**
   * Update log statistics
   */
  updateLogStats() {
    const logCount = document.querySelector('.log-count');
    const logs = this.logBuffer.get(this.selectedSessionId) || [];
    
    if (logCount) {
      logCount.textContent = `${logs.length} logs`;
    }
  }

  /**
   * Enhanced keyboard shortcuts
   */
  handleEnhancedKeyboardShortcuts(e) {
    // Only handle shortcuts when not typing in input fields
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      return;
    }

    switch (e.key) {
      case 'r':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          this.refreshSessions();
        }
        break;
      case '/':
        e.preventDefault();
        const filterInput = document.getElementById('logFilter');
        if (filterInput) {
          filterInput.focus();
        }
        break;
      case 'Escape':
        this.clearLogFilter();
        this.hideSearchResults();
        break;
      case 'b':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          this.addBookmark();
        }
        break;
      case 's':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          this.toggleSidebar();
        }
        break;
      case 'p':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          document.getElementById('pauseStream')?.click();
        }
        break;
      case 'Home':
        if (e.ctrlKey) {
          e.preventDefault();
          this.jumpToTop();
        }
        break;
      case 'End':
        if (e.ctrlKey) {
          e.preventDefault();
          this.jumpToBottom();
        }
        break;
    }
  }

  /**
   * Escape regex special characters
   */
  escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&');
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  try {
    window.app = new DashboardApp();
  } catch (error) {
    console.error('Failed to initialize DashboardApp:', error);
    
    // Show basic error message
    document.body.innerHTML = `
      <div style="
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #1e293b;
        color: #f1f5f9;
        padding: 40px;
        border-radius: 12px;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        text-align: center;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      ">
        <h2 style="color: #ef4444; margin-bottom: 16px;">⚠️ Dashboard Error</h2>
        <p style="margin-bottom: 20px; color: #94a3b8;">Failed to initialize the MCP Debug Host Dashboard.</p>
        <button 
          onclick="window.location.reload()" 
          style="
            background: #2563eb;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 500;
          "
        >🔄 Reload Page</button>
      </div>
    `;
  }
});