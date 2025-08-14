/**
 * Real-time Update Manager for MCP Debug Host Dashboard
 * Story 19.7 - Comprehensive Real-time Updates Implementation
 * 
 * Features:
 * - Automatic status synchronization
 * - Real-time log streaming with batching
 * - Selective DOM updates for performance
 * - Health monitoring and metrics
 * - Automatic refresh for stale connections
 * - Priority-based update system
 * - Real-time notification system
 */

class RealTimeUpdateManager {
  constructor(dashboardApp, wsManager) {
    this.app = dashboardApp;
    this.wsManager = wsManager;
    
    // Update batching and performance
    this.updateBatchSize = 50;
    this.updateInterval = 100; // ms
    this.pendingUpdates = new Map();
    this.updateQueue = [];
    this.lastUpdateTime = Date.now();
    
    // Performance monitoring
    this.performanceMetrics = {
      updatesProcessed: 0,
      domUpdatesSkipped: 0,
      avgUpdateTime: 0,
      maxUpdateTime: 0,
      batchesProcessed: 0
    };
    
    // Update priorities
    this.updatePriorities = {
      'critical': 1,    // Immediate updates (errors, crashes)
      'high': 2,        // Status changes, important logs
      'medium': 3,      // Regular logs, metrics
      'low': 4,         // Background info, analytics
      'bulk': 5         // Batch operations
    };
    
    // Health monitoring
    this.healthMetrics = {
      connectionHealth: 100,
      updateLatency: 0,
      errorRate: 0,
      throughput: 0,
      lastHealthCheck: Date.now()
    };
    
    // Stale connection detection
    this.staleConnectionThreshold = 60000; // 1 minute
    this.lastActivity = Date.now();
    this.staleCheckInterval = 30000; // 30 seconds
    
    // Notification system
    this.notificationBuffer = [];
    this.maxNotificationBuffer = 10;
    this.notificationThrottleTime = 1000; // 1 second
    this.lastNotificationTime = 0;
    
    // Real-time analytics
    this.analytics = {
      logRate: 0,
      errorCount: 0,
      sessionUpdates: 0,
      startTime: Date.now()
    };
    
    // DOM observers for change detection
    this.observers = new Map();
    this.virtualDOM = new Map();
    
    this.initialize();
  }
  
  /**
   * Initialize real-time update system
   */
  initialize() {
    this.setupWebSocketEventHandlers();
    this.startUpdateProcessor();
    this.startHealthMonitoring();
    this.startStaleConnectionDetector();
    this.initializeVirtualDOM();
    this.setupPerformanceMonitoring();
    
    console.log('Real-time Update Manager initialized with comprehensive features');
  }
  
  /**
   * Setup WebSocket event handlers for real-time updates
   */
  setupWebSocketEventHandlers() {
    // Session status updates
    this.wsManager.on('session-status-changed', (data) => {
      this.queueUpdate({
        type: 'session-status',
        sessionId: data.sessionId,
        status: data.status,
        metadata: data.metadata,
        priority: 'high',
        timestamp: Date.now()
      });
    });
    
    // Real-time log streaming
    this.wsManager.on('log-stream', (data) => {
      this.queueUpdate({
        type: 'log-stream',
        sessionId: data.sessionId,
        logs: data.logs,
        priority: 'medium',
        timestamp: Date.now()
      });
    });
    
    // Health metrics updates
    this.wsManager.on('health-metrics', (data) => {
      this.queueUpdate({
        type: 'health-metrics',
        metrics: data.metrics,
        priority: 'low',
        timestamp: Date.now()
      });
    });
    
    // Server notifications
    this.wsManager.on('server-notification', (data) => {
      this.queueUpdate({
        type: 'notification',
        notification: data,
        priority: data.level === 'error' ? 'critical' : 'high',
        timestamp: Date.now()
      });
    });
    
    // Session lifecycle events
    this.wsManager.on('session-created', (data) => {
      this.queueUpdate({
        type: 'session-created',
        session: data.session,
        priority: 'high',
        timestamp: Date.now()
      });
    });
    
    this.wsManager.on('session-destroyed', (data) => {
      this.queueUpdate({
        type: 'session-destroyed',
        sessionId: data.sessionId,
        priority: 'high',
        timestamp: Date.now()
      });
    });
    
    // Batch log updates for performance
    this.wsManager.on('log-batch', (data) => {
      this.queueUpdate({
        type: 'log-batch',
        sessionId: data.sessionId,
        logs: data.logs,
        priority: 'bulk',
        timestamp: Date.now()
      });
    });
    
    // Performance metrics from server
    this.wsManager.on('performance-metrics', (data) => {
      this.updateServerPerformanceMetrics(data.metrics);
    });
  }
  
  /**
   * Queue update with priority handling
   */
  queueUpdate(update) {
    this.lastActivity = Date.now();
    
    // Add to pending updates map for deduplication
    const key = `${update.type}-${update.sessionId || 'global'}`;
    
    if (this.pendingUpdates.has(key)) {
      // Merge with existing update if same type and session
      const existing = this.pendingUpdates.get(key);
      if (this.shouldMergeUpdates(existing, update)) {
        this.mergeUpdates(existing, update);
        return;
      }
    }
    
    this.pendingUpdates.set(key, update);
    this.updateQueue.push(update);
    
    // Sort by priority for processing
    this.updateQueue.sort((a, b) => {
      const priorityA = this.updatePriorities[a.priority] || 5;
      const priorityB = this.updatePriorities[b.priority] || 5;
      return priorityA - priorityB;
    });
    
    // Process critical updates immediately
    if (update.priority === 'critical') {
      this.processUpdate(update);
      this.removeFromQueue(update);
    }
  }
  
  /**
   * Start update processor with batching
   */
  startUpdateProcessor() {
    this.updateProcessorInterval = setInterval(() => {
      this.processBatchedUpdates();
    }, this.updateInterval);
  }
  
  /**
   * Process batched updates with performance optimization
   */
  processBatchedUpdates() {
    if (this.updateQueue.length === 0) return;
    
    const startTime = performance.now();
    const batchSize = Math.min(this.updateBatchSize, this.updateQueue.length);
    const batch = this.updateQueue.splice(0, batchSize);
    
    // Group updates by type for efficient processing
    const groupedUpdates = this.groupUpdatesByType(batch);
    
    // Process each group
    Object.entries(groupedUpdates).forEach(([type, updates]) => {
      this.processUpdateGroup(type, updates);
    });
    
    // Clean up processed updates from pending map
    batch.forEach(update => {
      const key = `${update.type}-${update.sessionId || 'global'}`;
      this.pendingUpdates.delete(key);
    });
    
    // Update performance metrics
    const processTime = performance.now() - startTime;
    this.updatePerformanceMetrics(processTime, batch.length);
    this.performanceMetrics.batchesProcessed++;
    
    this.lastUpdateTime = Date.now();
  }
  
  /**
   * Group updates by type for efficient processing
   */
  groupUpdatesByType(updates) {
    return updates.reduce((groups, update) => {
      if (!groups[update.type]) {
        groups[update.type] = [];
      }
      groups[update.type].push(update);
      return groups;
    }, {});
  }
  
  /**
   * Process updates by group type
   */
  processUpdateGroup(type, updates) {
    switch (type) {
      case 'session-status':
        this.processSessionStatusUpdates(updates);
        break;
      case 'log-stream':
      case 'log-batch':
        this.processLogUpdates(updates);
        break;
      case 'health-metrics':
        this.processHealthMetricsUpdates(updates);
        break;
      case 'notification':
        this.processNotificationUpdates(updates);
        break;
      case 'session-created':
        this.processSessionCreatedUpdates(updates);
        break;
      case 'session-destroyed':
        this.processSessionDestroyedUpdates(updates);
        break;
      default:
        console.warn('Unknown update type:', type);
    }
  }
  
  /**
   * Process session status updates with selective DOM updates
   */
  processSessionStatusUpdates(updates) {
    updates.forEach(update => {
      const session = this.app.sessions.get(update.sessionId);
      if (!session) return;
      
      // Update session data
      Object.assign(session, {
        status: update.status,
        ...update.metadata
      });
      
      // Selective DOM update - only update status elements
      this.updateSessionStatusDOM(update.sessionId, update.status);
      
      // Analytics
      this.analytics.sessionUpdates++;
    });
    
    // Update session count if needed
    this.app.updateSessionCount();
  }
  
  /**
   * Process log updates with efficient batching and streaming
   */
  processLogUpdates(updates) {
    // Group by session for efficient processing
    const logsBySession = updates.reduce((groups, update) => {
      const sessionId = update.sessionId;
      if (!groups[sessionId]) {
        groups[sessionId] = [];
      }
      
      // Handle both single logs and batches
      const logs = update.logs || [update.log];
      groups[sessionId].push(...logs);
      return groups;
    }, {});
    
    // Process each session's logs
    Object.entries(logsBySession).forEach(([sessionId, logs]) => {
      this.processSessionLogs(sessionId, logs);
    });
  }
  
  /**
   * Process logs for a specific session with streaming optimization
   */
  processSessionLogs(sessionId, logs) {
    if (!this.app.logBuffer.has(sessionId)) {
      this.app.logBuffer.set(sessionId, []);
    }
    
    const logBuffer = this.app.logBuffer.get(sessionId);
    
    // Add logs to buffer with circular buffer behavior
    logs.forEach(log => {
      logBuffer.push(log);
      this.analytics.logRate++;
      
      if (log.type === 'stderr' || log.level === 'error') {
        this.analytics.errorCount++;
      }
    });
    
    // Keep buffer size manageable
    const maxBufferSize = 2000;
    if (logBuffer.length > maxBufferSize) {
      const excess = logBuffer.length - maxBufferSize;
      logBuffer.splice(0, excess);
    }
    
    // Update UI only if this session is selected
    if (sessionId === this.app.selectedSessionId) {
      this.updateLogViewerStreamingly(logs);
    }
  }
  
  /**
   * Update log viewer with streaming optimization
   */
  updateLogViewerStreamingly(logs) {
    const logContent = document.getElementById('logContent');
    if (!logContent) return;
    
    // Use document fragment for efficient DOM updates
    const fragment = document.createDocumentFragment();
    
    logs.forEach(log => {
      const logElement = this.createLogElement(log);
      fragment.appendChild(logElement);
    });
    
    // Add all logs at once
    logContent.appendChild(fragment);
    
    // Maintain max DOM elements for performance
    const maxDOMElements = 1000;
    const logEntries = logContent.querySelectorAll('.log-entry');
    if (logEntries.length > maxDOMElements) {
      const excess = logEntries.length - maxDOMElements;
      for (let i = 0; i < excess; i++) {
        logEntries[i].remove();
      }
    }
    
    // Auto-scroll if enabled
    if (this.app.autoScroll) {
      this.scheduleScrollToBottom();
    }
    
    // Update log analytics
    this.updateLogAnalytics();
  }
  
  /**
   * Create optimized log element
   */
  createLogElement(log) {
    const entry = document.createElement('div');
    entry.className = `log-entry ${log.type || 'info'}`;
    
    const timestamp = new Date(log.timestamp).toLocaleTimeString();
    entry.innerHTML = `
      <span class="log-timestamp">${timestamp}</span>
      <span class="log-data">${this.app.escapeHtml(log.data)}</span>
    `;
    
    return entry;
  }
  
  /**
   * Process health metrics updates
   */
  processHealthMetricsUpdates(updates) {
    updates.forEach(update => {
      this.updateHealthMetrics(update.metrics);
    });
  }
  
  /**
   * Process notification updates with throttling
   */
  processNotificationUpdates(updates) {
    const now = Date.now();
    
    // Throttle notifications to prevent spam
    if (now - this.lastNotificationTime < this.notificationThrottleTime) {
      this.notificationBuffer.push(...updates);
      return;
    }
    
    // Process buffered notifications
    const allNotifications = [...this.notificationBuffer, ...updates];
    this.notificationBuffer = [];
    
    // Limit number of notifications
    const notificationsToShow = allNotifications.slice(-this.maxNotificationBuffer);
    
    notificationsToShow.forEach(update => {
      const notification = update.notification;
      this.app.showNotification(
        notification.message,
        notification.level || 'info',
        notification.duration || 5000
      );
    });
    
    this.lastNotificationTime = now;
  }
  
  /**
   * Process session created updates
   */
  processSessionCreatedUpdates(updates) {
    updates.forEach(update => {
      this.app.sessions.set(update.session.id, update.session);
      this.app.renderSessions();
      this.app.showNotification(`New session: ${update.session.name}`, 'success');
    });
  }
  
  /**
   * Process session destroyed updates
   */
  processSessionDestroyedUpdates(updates) {
    updates.forEach(update => {
      this.app.sessions.delete(update.sessionId);
      
      // Clear selected session if it was destroyed
      if (this.app.selectedSessionId === update.sessionId) {
        this.app.selectedSessionId = null;
        this.app.clearLogDisplay();
      }
      
      this.app.renderSessions();
      this.app.showNotification('Session removed', 'info');
    });
  }
  
  /**
   * Update session status DOM selectively
   */
  updateSessionStatusDOM(sessionId, status) {
    const sessionCard = document.querySelector(`[data-session-id="${sessionId}"]`);
    if (!sessionCard) return;
    
    const statusElement = sessionCard.querySelector('.session-status');
    if (statusElement) {
      // Remove old status classes
      statusElement.classList.remove('running', 'stopped', 'starting', 'error');
      
      // Add new status class
      statusElement.classList.add(status);
      
      // Update status text
      const statusText = statusElement.querySelector('.status-text');
      if (statusText) {
        statusText.textContent = status;
      }
      
      // Add visual indicator for status change
      statusElement.classList.add('status-updated');
      setTimeout(() => {
        statusElement.classList.remove('status-updated');
      }, 1000);
    }
  }
  
  /**
   * Start health monitoring with real-time metrics
   */
  startHealthMonitoring() {
    this.healthMonitorInterval = setInterval(() => {
      this.updateHealthMetrics();
      this.checkConnectionHealth();
      this.updateAnalyticsDashboard();
    }, 5000); // Every 5 seconds
  }
  
  /**
   * Update health metrics
   */
  updateHealthMetrics(serverMetrics = {}) {
    const now = Date.now();
    const timeSinceLastUpdate = now - this.lastUpdateTime;
    
    // Calculate update latency
    this.healthMetrics.updateLatency = timeSinceLastUpdate;
    
    // Calculate error rate
    const totalOperations = this.performanceMetrics.updatesProcessed;
    const errorRate = totalOperations > 0 ? 
      (this.analytics.errorCount / totalOperations) * 100 : 0;
    this.healthMetrics.errorRate = errorRate;
    
    // Calculate throughput (updates per second)
    const timeRunning = (now - this.analytics.startTime) / 1000;
    this.healthMetrics.throughput = timeRunning > 0 ? 
      totalOperations / timeRunning : 0;
    
    // Merge server metrics
    Object.assign(this.healthMetrics, serverMetrics);
    
    this.healthMetrics.lastHealthCheck = now;
    
    // Update UI health indicators
    this.updateHealthIndicators();
  }
  
  /**
   * Check connection health and trigger refresh if stale
   */
  checkConnectionHealth() {
    const now = Date.now();
    const timeSinceActivity = now - this.lastActivity;
    
    if (timeSinceActivity > this.staleConnectionThreshold) {
      console.warn('Connection appears stale, triggering refresh');
      this.refreshStaleConnection();
    }
    
    // Update connection health percentage
    const healthPercent = Math.max(0, 100 - (timeSinceActivity / 1000));
    this.healthMetrics.connectionHealth = Math.min(100, healthPercent);
  }
  
  /**
   * Start stale connection detector
   */
  startStaleConnectionDetector() {
    this.staleDetectorInterval = setInterval(() => {
      this.checkConnectionHealth();
    }, this.staleCheckInterval);
  }
  
  /**
   * Refresh stale connection
   */
  refreshStaleConnection() {
    console.log('Refreshing stale connection...');
    
    // Try to reconnect WebSocket
    if (this.wsManager.connectionState !== 'connected') {
      this.wsManager.connect().catch(error => {
        console.error('Failed to refresh connection:', error);
      });
    }
    
    // Request fresh session data
    this.app.refreshSessions();
    
    // Show notification
    this.app.showNotification('Connection refreshed', 'info');
  }
  
  /**
   * Initialize virtual DOM for change detection
   */
  initializeVirtualDOM() {
    // Create virtual representations of key UI elements
    this.virtualDOM.set('sessions', new Map());
    this.virtualDOM.set('logs', []);
    this.virtualDOM.set('status', {});
  }
  
  /**
   * Setup performance monitoring
   */
  setupPerformanceMonitoring() {
    // Monitor DOM mutation performance
    if (window.PerformanceObserver) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.entryType === 'measure' && entry.name.startsWith('dashboard-update')) {
            this.performanceMetrics.avgUpdateTime = 
              (this.performanceMetrics.avgUpdateTime + entry.duration) / 2;
            this.performanceMetrics.maxUpdateTime = 
              Math.max(this.performanceMetrics.maxUpdateTime, entry.duration);
          }
        });
      });
      
      observer.observe({ entryTypes: ['measure'] });
    }
  }
  
  /**
   * Update performance metrics
   */
  updatePerformanceMetrics(processTime, updatesCount) {
    this.performanceMetrics.updatesProcessed += updatesCount;
    this.performanceMetrics.avgUpdateTime = 
      (this.performanceMetrics.avgUpdateTime + processTime) / 2;
    this.performanceMetrics.maxUpdateTime = 
      Math.max(this.performanceMetrics.maxUpdateTime, processTime);
  }
  
  /**
   * Schedule scroll to bottom with throttling
   */
  scheduleScrollToBottom() {
    if (this.scrollTimeout) return;
    
    this.scrollTimeout = setTimeout(() => {
      this.app.scrollToBottom();
      this.scrollTimeout = null;
    }, 50); // Throttle scrolling
  }
  
  /**
   * Update log analytics in real-time
   */
  updateLogAnalytics() {
    const analyticsElement = document.getElementById('logAnalytics');
    if (!analyticsElement) return;
    
    const errorRate = document.getElementById('errorRate');
    const logRate = document.getElementById('logRate');
    const totalLogs = document.getElementById('totalLogs');
    
    if (errorRate) errorRate.textContent = `Errors: ${this.analytics.errorCount}`;
    if (logRate) logRate.textContent = `Rate: ${Math.round(this.analytics.logRate / 60)}/s`;
    if (totalLogs) totalLogs.textContent = `Total: ${this.analytics.logRate}`;
  }
  
  /**
   * Update health indicators in UI
   */
  updateHealthIndicators() {
    // Update connection health indicator
    const healthElement = document.querySelector('.connection-health');
    if (healthElement) {
      const healthPercent = this.healthMetrics.connectionHealth;
      healthElement.style.setProperty('--health', `${healthPercent}%`);
      healthElement.setAttribute('data-health', Math.round(healthPercent));
    }
    
    // Update performance metrics in sidebar
    const metricsElements = {
      messageRate: document.getElementById('messageRate'),
      errorRatePercent: document.getElementById('errorRatePercent'),
      bufferSize: document.getElementById('bufferSize')
    };
    
    if (metricsElements.messageRate) {
      metricsElements.messageRate.textContent = Math.round(this.healthMetrics.throughput);
    }
    
    if (metricsElements.errorRatePercent) {
      metricsElements.errorRatePercent.textContent = `${Math.round(this.healthMetrics.errorRate)}%`;
    }
    
    if (metricsElements.bufferSize) {
      const bufferSize = this.calculateTotalBufferSize();
      metricsElements.bufferSize.textContent = this.formatBytes(bufferSize);
    }
  }
  
  /**
   * Update analytics dashboard
   */
  updateAnalyticsDashboard() {
    // Update pattern detection
    this.updatePatternDetection();
    
    // Update performance chart
    this.updatePerformanceChart();
  }
  
  /**
   * Update pattern detection
   */
  updatePatternDetection() {
    const patternList = document.getElementById('patternList');
    if (!patternList) return;
    
    // Simple pattern detection (can be enhanced)
    const patterns = [];
    
    if (this.analytics.errorCount > 0) {
      patterns.push(`Error spike detected (${this.analytics.errorCount} errors)`);
    }
    
    if (this.healthMetrics.throughput > 100) {
      patterns.push('High activity detected');
    }
    
    if (patterns.length === 0) {
      patterns.push('No patterns detected');
    }
    
    patternList.innerHTML = patterns.map(pattern => 
      `<div class="pattern-item">${pattern}</div>`
    ).join('');
  }
  
  /**
   * Update performance chart
   */
  updatePerformanceChart() {
    const canvas = document.getElementById('logChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Simple performance visualization
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#3b82f6';
    
    const barHeight = (this.healthMetrics.throughput / 100) * canvas.height;
    ctx.fillRect(10, canvas.height - barHeight, 30, barHeight);
    
    ctx.fillStyle = '#ef4444';
    const errorHeight = (this.healthMetrics.errorRate / 100) * canvas.height;
    ctx.fillRect(50, canvas.height - errorHeight, 30, errorHeight);
  }
  
  /**
   * Calculate total buffer size
   */
  calculateTotalBufferSize() {
    let totalSize = 0;
    this.app.logBuffer.forEach(logs => {
      totalSize += logs.reduce((size, log) => {
        return size + (log.data ? log.data.length : 0);
      }, 0);
    });
    return totalSize;
  }
  
  /**
   * Format bytes for display
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  
  /**
   * Utility methods
   */
  shouldMergeUpdates(existing, update) {
    return existing.type === update.type && 
           existing.sessionId === update.sessionId &&
           update.priority !== 'critical';
  }
  
  mergeUpdates(existing, update) {
    // Merge logs arrays
    if (existing.logs && update.logs) {
      existing.logs.push(...update.logs);
    } else if (update.logs) {
      existing.logs = update.logs;
    }
    
    // Update metadata
    if (update.metadata) {
      existing.metadata = { ...existing.metadata, ...update.metadata };
    }
    
    // Keep latest timestamp
    existing.timestamp = Math.max(existing.timestamp, update.timestamp);
  }
  
  removeFromQueue(update) {
    const index = this.updateQueue.indexOf(update);
    if (index > -1) {
      this.updateQueue.splice(index, 1);
    }
  }
  
  processUpdate(update) {
    this.processUpdateGroup(update.type, [update]);
  }
  
  /**
   * Get real-time statistics
   */
  getStatistics() {
    return {
      performance: { ...this.performanceMetrics },
      health: { ...this.healthMetrics },
      analytics: { ...this.analytics },
      queue: {
        pending: this.pendingUpdates.size,
        queued: this.updateQueue.length
      }
    };
  }
  
  /**
   * Cleanup and destroy
   */
  destroy() {
    if (this.updateProcessorInterval) {
      clearInterval(this.updateProcessorInterval);
    }
    
    if (this.healthMonitorInterval) {
      clearInterval(this.healthMonitorInterval);
    }
    
    if (this.staleDetectorInterval) {
      clearInterval(this.staleDetectorInterval);
    }
    
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }
    
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    
    console.log('Real-time Update Manager destroyed');
  }
}

// Export for use in dashboard
if (typeof window !== 'undefined') {
  window.RealTimeUpdateManager = RealTimeUpdateManager;
}