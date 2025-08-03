/**
 * Real-time Enhancements for Dashboard App
 * Story 19.7 - Integration and Enhancement Module
 */

// Extend the DashboardApp with real-time capabilities
if (typeof window !== 'undefined' && window.DashboardApp) {
  const originalConstructor = window.DashboardApp.prototype.constructor;
  const originalInitializeApp = window.DashboardApp.prototype.initializeApp;
  const originalCreateSessionCard = window.DashboardApp.prototype.createSessionCard;
  const originalRenderLog = window.DashboardApp.prototype.renderLog;
  
  // Extend constructor
  window.DashboardApp.prototype.constructor = function() {
    originalConstructor.call(this);
    
    // Add real-time manager property
    this.realTimeManager = null;
    
    // Enhanced real-time properties
    this.realTimeConfig = {
      updateThrottleTime: 100, // ms
      maxDOMUpdates: 50,
      enableAnimations: true,
      enableNotifications: true,
      enableAnalytics: true
    };
    
    // Real-time state tracking
    this.realTimeState = {
      lastUpdateTime: Date.now(),
      updateCount: 0,
      streamingActive: false,
      selectedSessionLastUpdate: null
    };
  };
  
  // Extend initializeApp
  window.DashboardApp.prototype.initializeApp = async function() {
    try {
      // Call original initialization
      await originalInitializeApp.call(this);
      
      // Initialize real-time features
      this.initializeRealTimeManager();
      
      console.log('Dashboard enhanced with real-time capabilities');
    } catch (error) {
      console.error('Failed to initialize enhanced dashboard:', error);
      throw error;
    }
  };
  
  // Add real-time manager initialization
  window.DashboardApp.prototype.initializeRealTimeManager = function() {
    if (!this.wsManager) {
      console.warn('WebSocket manager not available, real-time features disabled');
      return;
    }
    
    if (typeof window.RealTimeUpdateManager === 'undefined') {
      console.warn('RealTimeUpdateManager not available, real-time features disabled');
      return;
    }
    
    try {
      // Initialize real-time update manager
      this.realTimeManager = new window.RealTimeUpdateManager(this, this.wsManager);
      
      // Setup real-time specific event handlers
      this.setupRealTimeEventHandlers();
      
      // Start real-time UI enhancements
      this.startRealTimeUIEnhancements();
      
      console.log('Real-time update manager initialized successfully');
      
      // Show initialization notification
      this.showNotification('Real-time features activated', 'success', 3000);
      
    } catch (error) {
      console.error('Failed to initialize real-time manager:', error);
      this.showNotification('Real-time features unavailable', 'warning');
    }
  };
  
  // Setup real-time specific event handlers
  window.DashboardApp.prototype.setupRealTimeEventHandlers = function() {
    if (!this.realTimeManager) return;
    
    // Add real-time specific WebSocket handlers
    this.wsManager.on('session-status-update', (data) => {
      this.handleRealTimeSessionUpdate(data);
    });
    
    this.wsManager.on('log-stream', (data) => {
      this.handleRealTimeLogStream(data);
    });
    
    this.wsManager.on('health-metrics', (data) => {
      this.updateRealTimeHealthMetrics(data);
    });
    
    this.wsManager.on('bulk-log-update', (data) => {
      this.handleBulkLogUpdate(data);
    });
  };
  
  // Handle real-time session updates
  window.DashboardApp.prototype.handleRealTimeSessionUpdate = function(data) {
    const session = this.sessions.get(data.sessionId);
    if (!session) return;
    
    // Update session data
    Object.assign(session, data.updates);
    
    // Add visual indicator for update
    const sessionCard = document.querySelector(`[data-session-id="${data.sessionId}"]`);
    if (sessionCard) {
      sessionCard.classList.add('updating');
      setTimeout(() => {
        sessionCard.classList.remove('updating');
      }, 1000);
    }
    
    // Update session count
    this.updateSessionCount();
    
    // Update selected session info if needed
    if (data.sessionId === this.selectedSessionId) {
      this.updateLogSessionInfo(session);
    }
  };
  
  // Handle real-time log streaming
  window.DashboardApp.prototype.handleRealTimeLogStream = function(data) {
    this.realTimeState.streamingActive = true;
    
    // Add streaming visual indicator
    const logContent = document.getElementById('logContent');
    if (logContent) {
      logContent.classList.add('streaming');
    }
    
    // Process logs through real-time manager
    if (this.realTimeManager) {
      this.realTimeManager.queueUpdate({
        type: 'log-stream',
        sessionId: data.sessionId,
        logs: data.logs,
        priority: 'medium',
        timestamp: Date.now()
      });
    }
    
    // Remove streaming indicator after delay
    setTimeout(() => {
      if (logContent) {
        logContent.classList.remove('streaming');
      }
      this.realTimeState.streamingActive = false;
    }, 2000);
  };
  
  // Handle bulk log updates
  window.DashboardApp.prototype.handleBulkLogUpdate = function(data) {
    if (this.realTimeManager) {
      this.realTimeManager.queueUpdate({
        type: 'log-batch',
        sessionId: data.sessionId,
        logs: data.logs,
        priority: 'bulk',
        timestamp: Date.now()
      });
    }
  };
  
  // Update real-time health metrics
  window.DashboardApp.prototype.updateRealTimeHealthMetrics = function(data) {
    // Update connection health indicator
    const connectionStatus = document.querySelector('.connection-status');
    if (connectionStatus && data.connectionHealth) {
      connectionStatus.classList.add('connection-health');
      connectionStatus.style.setProperty('--health', `${data.connectionHealth}%`);
    }
    
    // Update performance metrics in sidebar analytics
    this.updateSidebarMetrics(data);
  };
  
  // Update sidebar metrics
  window.DashboardApp.prototype.updateSidebarMetrics = function(data) {
    const metricsElements = {
      messageRate: document.getElementById('messageRate'),
      errorRatePercent: document.getElementById('errorRatePercent'),
      bufferSize: document.getElementById('bufferSize')
    };
    
    if (metricsElements.messageRate && data.throughput) {
      metricsElements.messageRate.textContent = Math.round(data.throughput);
    }
    
    if (metricsElements.errorRatePercent && data.errorRate) {
      metricsElements.errorRatePercent.textContent = `${Math.round(data.errorRate)}%`;
    }
    
    if (metricsElements.bufferSize && data.bufferSize) {
      metricsElements.bufferSize.textContent = this.formatBytes(data.bufferSize);
    }
  };
  
  // Start real-time UI enhancements
  window.DashboardApp.prototype.startRealTimeUIEnhancements = function() {
    // Add live indicator to header
    this.addLiveIndicator();
    
    // Setup performance monitoring UI
    this.setupPerformanceMonitoringUI();
    
    // Add real-time status to session cards
    this.enhanceSessionCards();
    
    // Setup keyboard shortcuts for real-time features
    this.setupRealTimeKeyboardShortcuts();
  };
  
  // Add live indicator to header
  window.DashboardApp.prototype.addLiveIndicator = function() {
    const headerRight = document.querySelector('.header-right');
    if (headerRight) {
      const liveIndicator = document.createElement('div');
      liveIndicator.className = 'live-indicator';
      liveIndicator.innerHTML = '<span>LIVE</span>';
      liveIndicator.title = 'Real-time updates active';
      
      headerRight.insertBefore(liveIndicator, headerRight.firstChild);
    }
  };
  
  // Setup performance monitoring UI
  window.DashboardApp.prototype.setupPerformanceMonitoringUI = function() {
    // Add performance metrics panel to sidebar
    const sidebar = document.getElementById('logSidebar');
    if (sidebar) {
      const performanceSection = document.createElement('div');
      performanceSection.className = 'analytics-section';
      performanceSection.innerHTML = `
        <h5>📊 Real-time Performance</h5>
        <div class="performance-metrics">
          <div class="metric-card">
            <div class="metric-value" id="realTimeUpdatesPerSec">0</div>
            <div class="metric-label">Updates/sec</div>
          </div>
          <div class="metric-card">
            <div class="metric-value" id="realTimeDOMUpdates">0</div>
            <div class="metric-label">DOM Updates</div>
          </div>
          <div class="metric-card">
            <div class="metric-value" id="realTimeLatency">0ms</div>
            <div class="metric-label">Latency</div>
          </div>
        </div>
      `;
      
      sidebar.querySelector('.sidebar-content').appendChild(performanceSection);
    }
  };
  
  // Enhance session cards with real-time features
  window.DashboardApp.prototype.enhanceSessionCards = function() {
    // Override createSessionCard to add real-time features
    const originalCreateSessionCard = this.createSessionCard;
    
    this.createSessionCard = function(session) {
      const card = originalCreateSessionCard.call(this, session);
      
      // Add data attribute for real-time updates
      card.setAttribute('data-session-id', session.id);
      
      // Add real-time status indicator
      const statusElement = card.querySelector('.session-status');
      if (statusElement) {
        const statusIndicator = document.createElement('div');
        statusIndicator.className = 'real-time-status-indicator';
        statusIndicator.title = 'Real-time monitoring active';
        statusElement.appendChild(statusIndicator);
      }
      
      return card;
    };
  };
  
  // Setup keyboard shortcuts for real-time features
  window.DashboardApp.prototype.setupRealTimeKeyboardShortcuts = function() {
    document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + R: Toggle real-time updates
      if ((e.ctrlKey || e.metaKey) && e.key === 'r' && e.shiftKey) {
        e.preventDefault();
        this.toggleRealTimeUpdates();
      }
      
      // Ctrl/Cmd + L: Toggle live streaming
      if ((e.ctrlKey || e.metaKey) && e.key === 'l' && e.shiftKey) {
        e.preventDefault();
        this.toggleLiveStreaming();
      }
    });
  };
  
  // Toggle real-time updates
  window.DashboardApp.prototype.toggleRealTimeUpdates = function() {
    if (!this.realTimeManager) return;
    
    this.realTimeConfig.enableNotifications = !this.realTimeConfig.enableNotifications;
    
    const status = this.realTimeConfig.enableNotifications ? 'enabled' : 'disabled';
    this.showNotification(`Real-time updates ${status}`, 'info');
  };
  
  // Toggle live streaming
  window.DashboardApp.prototype.toggleLiveStreaming = function() {
    this.realTimeState.streamingActive = !this.realTimeState.streamingActive;
    
    const logContent = document.getElementById('logContent');
    if (logContent) {
      logContent.classList.toggle('streaming', this.realTimeState.streamingActive);
    }
    
    const status = this.realTimeState.streamingActive ? 'enabled' : 'disabled';
    this.showNotification(`Live streaming ${status}`, 'info');
  };
  
  // Enhanced renderLog with real-time features
  const originalRenderLogEnhanced = window.DashboardApp.prototype.renderLog;
  window.DashboardApp.prototype.renderLog = function(log) {
    // Call original renderLog
    originalRenderLogEnhanced.call(this, log);
    
    // Add real-time enhancements
    const logEntries = document.querySelectorAll('.log-entry');
    const lastEntry = logEntries[logEntries.length - 1];
    
    if (lastEntry && this.realTimeConfig.enableAnimations) {
      // Add streaming animation
      lastEntry.classList.add('streaming');
      
      // Remove animation after completion
      setTimeout(() => {
        lastEntry.classList.remove('streaming');
      }, 300);
    }
    
    // Update real-time analytics
    this.updateRealTimeAnalytics();
  };
  
  // Update real-time analytics
  window.DashboardApp.prototype.updateRealTimeAnalytics = function() {
    if (!this.realTimeManager) return;
    
    const stats = this.realTimeManager.getStatistics();
    
    // Update performance UI
    const updatesPerSec = document.getElementById('realTimeUpdatesPerSec');
    const domUpdates = document.getElementById('realTimeDOMUpdates');
    const latency = document.getElementById('realTimeLatency');
    
    if (updatesPerSec) {
      updatesPerSec.textContent = Math.round(stats.health.throughput || 0);
    }
    
    if (domUpdates) {
      domUpdates.textContent = stats.performance.updatesProcessed || 0;
    }
    
    if (latency) {
      latency.textContent = `${Math.round(stats.health.updateLatency || 0)}ms`;
    }
  };
  
  // Get real-time statistics
  window.DashboardApp.prototype.getRealTimeStatistics = function() {
    if (!this.realTimeManager) {
      return {
        enabled: false,
        message: 'Real-time features not available'
      };
    }
    
    return {
      enabled: true,
      state: this.realTimeState,
      config: this.realTimeConfig,
      statistics: this.realTimeManager.getStatistics()
    };
  };
  
  // Cleanup real-time features
  const originalDestroy = window.DashboardApp.prototype.destroy;
  window.DashboardApp.prototype.destroy = function() {
    if (originalDestroy) {
      originalDestroy.call(this);
    }
    
    if (this.realTimeManager) {
      this.realTimeManager.destroy();
      this.realTimeManager = null;
    }
    
    console.log('Real-time features cleaned up');
  };
  
  console.log('Dashboard App enhanced with comprehensive real-time capabilities');
} else {
  console.warn('DashboardApp not found, real-time enhancements not applied');
}