/**
 * Real-time Deployment Monitoring System
 * 
 * Provides continuous monitoring during production deployment with automated
 * rollback triggers based on performance metrics, error rates, and system health.
 * 
 * Key Features:
 * - Real-time performance tracking
 * - Automated rollback triggers
 * - Health check orchestration
 * - Performance threshold monitoring
 * - Error rate analysis
 * - System resource monitoring
 * - Alert generation and notifications
 */

const EventEmitter = require('events');
const { performance } = require('perf_hooks');
const http = require('http');
const fs = require('fs');
const path = require('path');

/**
 * Monitoring thresholds and configuration
 */
const MONITORING_CONFIG = {
  // Performance thresholds
  thresholds: {
    responseTime: 500,          // 500ms max response time
    discoveryTime: 2000,        // 2s max discovery time
    memoryOverhead: 50,         // 50MB max memory overhead
    cpuUsage: 5.0,              // 5% max CPU usage
    errorRate: 2.0,             // 2% max error rate
    consecutiveFailures: 3,     // Max consecutive failures before rollback
    performanceViolations: 5    // Max performance violations before warning
  },
  
  // Monitoring intervals
  intervals: {
    healthCheck: 5000,          // 5s health checks
    performanceCheck: 10000,    // 10s performance checks
    systemMetrics: 15000,       // 15s system metrics
    alertCooldown: 60000        // 1 minute alert cooldown
  },
  
  // Service endpoints
  endpoints: {
    backend: { port: 2601, path: '/health' },
    dashboard: { port: 2602, path: '/' },
    api: { port: 2601, path: '/api/servers' }
  },
  
  // Rollback triggers
  rollbackTriggers: {
    criticalServiceDown: true,
    performanceThresholdViolated: true,
    highErrorRate: true,
    memoryLeak: true,
    consecutiveFailures: true
  }
};

/**
 * Deployment Monitor
 * Orchestrates comprehensive real-time monitoring
 */
class DeploymentMonitor extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      dataDir: options.dataDir || path.join(__dirname, '..', '..', 'data'),
      logPath: options.logPath || path.join(__dirname, '..', '..', 'data', 'monitoring.log'),
      rollbackScript: options.rollbackScript || path.join(__dirname, '..', '..', 'scripts', 'zero-downtime-deploy.sh'),
      deploymentId: options.deploymentId || `monitor_${Date.now()}`,
      autoRollback: options.autoRollback !== false,
      strictMode: options.strictMode !== false,
      ...MONITORING_CONFIG,
      ...options
    };
    
    // Monitoring state
    this.isMonitoring = false;
    this.startTime = null;
    this.monitoringDuration = 0;
    this.checkCount = 0;
    this.failureCount = 0;
    this.lastSuccessfulCheck = null;
    
    // Performance tracking
    this.performanceBaseline = null;
    this.performanceHistory = [];
    this.performanceViolations = [];
    this.errorHistory = [];
    
    // Alert management
    this.alerts = [];
    this.lastAlertTime = {};
    
    // Health check results
    this.healthCheckResults = {
      backend: { status: 'unknown', lastCheck: null, responseTime: 0 },
      dashboard: { status: 'unknown', lastCheck: null, responseTime: 0 },
      api: { status: 'unknown', lastCheck: null, responseTime: 0 }
    };
    
    // System metrics
    this.systemMetrics = {
      memory: { current: 0, baseline: 0, overhead: 0 },
      cpu: { current: 0, average: 0 },
      disk: { usage: 0, available: 0 }
    };
    
    // Timers for periodic checks
    this.timers = {};
    
    this.initializeMonitoring();
  }
  
  /**
   * Initialize monitoring system
   */
  initializeMonitoring() {
    // Establish performance baseline
    this.establishPerformanceBaseline();
    
    // Setup event handlers
    this.setupEventHandlers();
    
    // Ensure log directory exists
    const logDir = path.dirname(this.options.logPath);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    this.log('Deployment monitor initialized', 'info');
  }
  
  /**
   * Start continuous monitoring for specified duration
   */
  async startMonitoring(duration = 300000) { // 5 minutes default
    if (this.isMonitoring) {
      throw new Error('Monitoring is already active');
    }
    
    this.isMonitoring = true;
    this.startTime = Date.now();
    this.monitoringDuration = duration;
    this.checkCount = 0;
    this.failureCount = 0;
    
    this.log(`Starting continuous monitoring for ${duration / 1000}s`, 'info');
    this.log(`Deployment ID: ${this.options.deploymentId}`, 'info');
    
    // Start periodic checks
    this.startPeriodicChecks();
    
    // Monitor for specified duration
    return new Promise((resolve, reject) => {
      const monitoringTimeout = setTimeout(() => {
        this.stopMonitoring()
          .then(() => {
            const result = this.generateMonitoringReport();
            this.log('Monitoring completed successfully', 'info');
            resolve(result);
          })
          .catch(reject);
      }, duration);
      
      // Handle rollback events
      this.once('rollback_triggered', (reason) => {
        clearTimeout(monitoringTimeout);
        this.log(`Monitoring terminated due to rollback: ${reason}`, 'error');
        reject(new Error(`Automatic rollback triggered: ${reason}`));
      });
      
      // Handle critical failures
      this.once('critical_failure', (error) => {
        clearTimeout(monitoringTimeout);
        this.log(`Monitoring terminated due to critical failure: ${error}`, 'error');
        reject(new Error(`Critical monitoring failure: ${error}`));
      });
    });
  }
  
  /**
   * Stop monitoring and cleanup
   */
  async stopMonitoring() {
    if (!this.isMonitoring) {
      return;
    }
    
    this.isMonitoring = false;
    
    // Clear all timers
    Object.values(this.timers).forEach(timer => clearInterval(timer));
    this.timers = {};
    
    this.log('Monitoring stopped', 'info');
  }
  
  /**
   * Start periodic monitoring checks
   */
  startPeriodicChecks() {
    // Health checks
    this.timers.healthCheck = setInterval(async () => {
      await this.performHealthChecks();
    }, this.options.intervals.healthCheck);
    
    // Performance checks
    this.timers.performanceCheck = setInterval(async () => {
      await this.performPerformanceChecks();
    }, this.options.intervals.performanceCheck);
    
    // System metrics
    this.timers.systemMetrics = setInterval(async () => {
      await this.collectSystemMetrics();
    }, this.options.intervals.systemMetrics);
    
    // Initial checks
    this.performHealthChecks();
    this.performPerformanceChecks();
    this.collectSystemMetrics();
  }
  
  /**
   * Perform comprehensive health checks
   */
  async performHealthChecks() {
    this.checkCount++;
    const checkStartTime = performance.now();
    
    try {
      const healthPromises = Object.entries(this.options.endpoints).map(
        async ([serviceName, config]) => {
          const result = await this.checkServiceHealth(serviceName, config);
          this.healthCheckResults[serviceName] = result;
          return result;
        }
      );
      
      const healthResults = await Promise.all(healthPromises);
      const failedServices = healthResults.filter(r => !r.healthy).map(r => r.service);
      
      if (failedServices.length > 0) {
        this.handleHealthCheckFailure(failedServices);
      } else {
        this.lastSuccessfulCheck = Date.now();
        this.resetFailureCount();
      }
      
      // Emit health check event
      this.emit('health_check', {
        timestamp: new Date().toISOString(),
        checkId: this.checkCount,
        results: this.healthCheckResults,
        failedServices,
        duration: performance.now() - checkStartTime
      });
      
    } catch (error) {
      this.log(`Health check error: ${error.message}`, 'error');
      this.handleHealthCheckError(error);
    }
  }
  
  /**
   * Check individual service health
   */
  async checkServiceHealth(serviceName, config) {
    const checkStartTime = performance.now();
    
    try {
      const response = await this.makeHealthRequest(config.port, config.path);
      const responseTime = performance.now() - checkStartTime;
      
      const result = {
        service: serviceName,
        healthy: response.statusCode >= 200 && response.statusCode < 400,
        statusCode: response.statusCode,
        responseTime,
        lastCheck: new Date().toISOString(),
        error: null
      };
      
      // Check response time threshold
      if (responseTime > this.options.thresholds.responseTime) {
        this.recordPerformanceViolation('response_time', {
          service: serviceName,
          value: responseTime,
          threshold: this.options.thresholds.responseTime
        });
      }
      
      return result;
      
    } catch (error) {
      return {
        service: serviceName,
        healthy: false,
        statusCode: 0,
        responseTime: performance.now() - checkStartTime,
        lastCheck: new Date().toISOString(),
        error: error.message
      };
    }
  }
  
  /**
   * Make HTTP health request
   */
  async makeHealthRequest(port, path) {
    return new Promise((resolve, reject) => {
      const req = http.request({
        hostname: '127.0.0.1',
        port,
        path,
        method: 'GET',
        timeout: 10000
      }, (res) => {
        resolve({ statusCode: res.statusCode });
      });
      
      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
      
      req.end();
    });
  }
  
  /**
   * Perform performance monitoring checks
   */
  async performPerformanceChecks() {
    try {
      // Memory usage check
      await this.checkMemoryUsage();
      
      // CPU usage check (if available)
      await this.checkCpuUsage();
      
      // Error rate check
      await this.checkErrorRate();
      
      // Discovery performance check (if applicable)
      await this.checkDiscoveryPerformance();
      
    } catch (error) {
      this.log(`Performance check error: ${error.message}`, 'error');
    }
  }
  
  /**
   * Check memory usage against baseline and thresholds
   */
  async checkMemoryUsage() {
    const memoryUsage = process.memoryUsage();
    const currentMemoryMB = memoryUsage.heapUsed / 1024 / 1024;
    
    if (!this.performanceBaseline) {
      this.performanceBaseline = { memory: currentMemoryMB };
    }
    
    const memoryOverhead = currentMemoryMB - this.performanceBaseline.memory;
    
    this.systemMetrics.memory = {
      current: currentMemoryMB,
      baseline: this.performanceBaseline.memory,
      overhead: memoryOverhead
    };
    
    // Check threshold
    if (memoryOverhead > this.options.thresholds.memoryOverhead) {
      this.recordPerformanceViolation('memory_usage', {
        value: memoryOverhead,
        threshold: this.options.thresholds.memoryOverhead,
        current: currentMemoryMB,
        baseline: this.performanceBaseline.memory
      });
    }
    
    // Memory leak detection
    if (memoryOverhead > this.options.thresholds.memoryOverhead * 2) {
      this.handlePotentialMemoryLeak(memoryOverhead);
    }
  }
  
  /**
   * Check CPU usage if monitoring tools are available
   */
  async checkCpuUsage() {
    // Simplified CPU monitoring - would be enhanced in production
    try {
      const { execSync } = require('child_process');
      
      // Try to get CPU usage from top command
      const topOutput = execSync('top -bn1 | head -3', { 
        encoding: 'utf8', 
        timeout: 5000 
      });
      
      const cpuMatch = topOutput.match(/(\d+\.?\d*)%.*?cpu/i);
      if (cpuMatch) {
        const cpuUsage = parseFloat(cpuMatch[1]);
        this.systemMetrics.cpu.current = cpuUsage;
        
        if (cpuUsage > this.options.thresholds.cpuUsage) {
          this.recordPerformanceViolation('cpu_usage', {
            value: cpuUsage,
            threshold: this.options.thresholds.cpuUsage
          });
        }
      }
    } catch (error) {
      // CPU monitoring not critical, continue without it
    }
  }
  
  /**
   * Check error rate from recent health checks
   */
  async checkErrorRate() {
    const recentChecks = this.errorHistory.slice(-20); // Last 20 checks
    
    if (recentChecks.length === 0) {
      return;
    }
    
    const errorCount = recentChecks.filter(check => !check.success).length;
    const errorRate = (errorCount / recentChecks.length) * 100;
    
    if (errorRate > this.options.thresholds.errorRate) {
      this.recordPerformanceViolation('error_rate', {
        value: errorRate,
        threshold: this.options.thresholds.errorRate,
        errorCount,
        totalChecks: recentChecks.length
      });
    }
  }
  
  /**
   * Check discovery performance if discovery engine is active
   */
  async checkDiscoveryPerformance() {
    // This would integrate with the actual discovery engine
    // For now, we simulate a discovery performance check
    try {
      // Placeholder for actual discovery performance test
      const discoveryStartTime = performance.now();
      
      // Simulate discovery operation check via API
      const response = await this.makeHealthRequest(2601, '/api/servers');
      const discoveryTime = performance.now() - discoveryStartTime;
      
      if (discoveryTime > this.options.thresholds.discoveryTime) {
        this.recordPerformanceViolation('discovery_time', {
          value: discoveryTime,
          threshold: this.options.thresholds.discoveryTime
        });
      }
      
    } catch (error) {
      // Discovery performance check is optional
    }
  }
  
  /**
   * Collect comprehensive system metrics
   */
  async collectSystemMetrics() {
    const metrics = {
      timestamp: new Date().toISOString(),
      memory: this.systemMetrics.memory,
      cpu: this.systemMetrics.cpu,
      healthChecks: this.healthCheckResults,
      performanceViolations: this.performanceViolations.length,
      uptime: process.uptime(),
      nodeVersion: process.version
    };
    
    this.performanceHistory.push(metrics);
    
    // Keep only recent history
    if (this.performanceHistory.length > 1000) {
      this.performanceHistory = this.performanceHistory.slice(-1000);
    }
    
    // Emit metrics event
    this.emit('system_metrics', metrics);
  }
  
  /**
   * Handle health check failures
   */
  handleHealthCheckFailure(failedServices) {
    this.failureCount++;
    
    // Record error
    this.errorHistory.push({
      timestamp: new Date().toISOString(),
      type: 'health_check_failure',
      services: failedServices,
      success: false
    });
    
    // Keep error history manageable
    if (this.errorHistory.length > 100) {
      this.errorHistory = this.errorHistory.slice(-100);
    }
    
    this.log(`Health check failure #${this.failureCount}: ${failedServices.join(', ')}`, 'warn');
    
    // Check for consecutive failure threshold
    if (this.failureCount >= this.options.thresholds.consecutiveFailures) {
      this.triggerRollback('consecutive_health_check_failures', {
        failureCount: this.failureCount,
        failedServices
      });
    }
    
    // Generate alert
    this.generateAlert('health_check_failure', {
      failedServices,
      failureCount: this.failureCount,
      consecutive: this.failureCount
    });
  }
  
  /**
   * Handle health check errors
   */
  handleHealthCheckError(error) {
    this.log(`Health check system error: ${error.message}`, 'error');
    
    // If health checking system itself is failing, this is critical
    this.emit('critical_failure', `Health check system failure: ${error.message}`);
  }
  
  /**
   * Reset failure count on successful check
   */
  resetFailureCount() {
    if (this.failureCount > 0) {
      this.log(`Consecutive failures reset (was ${this.failureCount})`, 'info');
      this.failureCount = 0;
    }
  }
  
  /**
   * Record performance violation
   */
  recordPerformanceViolation(type, details) {
    const violation = {
      timestamp: new Date().toISOString(),
      type,
      ...details
    };
    
    this.performanceViolations.push(violation);
    
    // Keep violations list manageable
    if (this.performanceViolations.length > 500) {
      this.performanceViolations = this.performanceViolations.slice(-500);
    }
    
    this.log(`Performance violation: ${type} - ${JSON.stringify(details)}`, 'warn');
    
    // Check if violations exceed threshold
    const recentViolations = this.performanceViolations.filter(
      v => Date.now() - new Date(v.timestamp).getTime() < 60000 // Last minute
    );
    
    if (recentViolations.length > this.options.thresholds.performanceViolations) {
      this.generateAlert('excessive_performance_violations', {
        recentViolations: recentViolations.length,
        threshold: this.options.thresholds.performanceViolations,
        violationType: type
      });
    }
    
    // Emit violation event
    this.emit('performance_violation', violation);
  }
  
  /**
   * Handle potential memory leak
   */
  handlePotentialMemoryLeak(memoryOverhead) {
    this.log(`Potential memory leak detected: ${memoryOverhead.toFixed(1)}MB overhead`, 'error');
    
    if (this.options.rollbackTriggers.memoryLeak) {
      this.triggerRollback('memory_leak', {
        memoryOverhead,
        threshold: this.options.thresholds.memoryOverhead
      });
    } else {
      this.generateAlert('memory_leak', {
        memoryOverhead,
        threshold: this.options.thresholds.memoryOverhead
      });
    }
  }
  
  /**
   * Trigger automatic rollback
   */
  triggerRollback(reason, details = {}) {
    if (!this.options.autoRollback) {
      this.log(`Rollback trigger ignored (auto-rollback disabled): ${reason}`, 'warn');
      this.generateAlert('rollback_trigger_ignored', { reason, details });
      return;
    }
    
    this.log(`TRIGGERING AUTOMATIC ROLLBACK: ${reason}`, 'error');
    this.log(`Rollback details: ${JSON.stringify(details)}`, 'error');
    
    // Create rollback record
    const rollbackRecord = {
      triggeredAt: new Date().toISOString(),
      deploymentId: this.options.deploymentId,
      reason,
      details,
      monitoringDuration: Date.now() - this.startTime,
      checkCount: this.checkCount,
      failureCount: this.failureCount
    };
    
    // Save rollback record
    try {
      const rollbackPath = path.join(this.options.dataDir, 'rollback-records.json');
      let records = [];
      
      if (fs.existsSync(rollbackPath)) {
        records = JSON.parse(fs.readFileSync(rollbackPath, 'utf8'));
      }
      
      records.push(rollbackRecord);
      fs.writeFileSync(rollbackPath, JSON.stringify(records, null, 2));
    } catch (error) {
      this.log(`Failed to save rollback record: ${error.message}`, 'error');
    }
    
    // Execute rollback
    this.executeAutomaticRollback(rollbackRecord);
    
    // Emit rollback event
    this.emit('rollback_triggered', reason);
  }
  
  /**
   * Execute automatic rollback
   */
  async executeAutomaticRollback(rollbackRecord) {
    try {
      this.log('Executing automatic rollback...', 'error');
      
      const { execSync } = require('child_process');
      
      // Execute rollback script
      const rollbackCommand = `bash ${this.options.rollbackScript} --rollback-only`;
      
      this.log(`Running rollback command: ${rollbackCommand}`, 'info');
      
      const rollbackOutput = execSync(rollbackCommand, {
        encoding: 'utf8',
        timeout: 300000, // 5 minutes timeout
        cwd: path.dirname(this.options.rollbackScript)
      });
      
      this.log('Automatic rollback completed successfully', 'info');
      this.log(`Rollback output: ${rollbackOutput}`, 'info');
      
    } catch (error) {
      this.log(`Automatic rollback failed: ${error.message}`, 'error');
      this.emit('critical_failure', `Rollback execution failed: ${error.message}`);
    }
  }
  
  /**
   * Generate alert
   */
  generateAlert(alertType, details = {}) {
    // Check cooldown
    const lastAlert = this.lastAlertTime[alertType];
    if (lastAlert && Date.now() - lastAlert < this.options.intervals.alertCooldown) {
      return; // Skip alert due to cooldown
    }
    
    const alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      type: alertType,
      timestamp: new Date().toISOString(),
      deploymentId: this.options.deploymentId,
      severity: this.getAlertSeverity(alertType),
      details,
      resolved: false
    };
    
    this.alerts.push(alert);
    this.lastAlertTime[alertType] = Date.now();
    
    this.log(`ALERT [${alert.severity}]: ${alertType} - ${JSON.stringify(details)}`, 'warn');
    
    // Emit alert event
    this.emit('alert', alert);
    
    return alert;
  }
  
  /**
   * Get alert severity level
   */
  getAlertSeverity(alertType) {
    const severityMap = {
      health_check_failure: 'high',
      memory_leak: 'critical',
      excessive_performance_violations: 'medium',
      rollback_trigger_ignored: 'high',
      system_error: 'high'
    };
    
    return severityMap[alertType] || 'low';
  }
  
  /**
   * Establish performance baseline
   */
  establishPerformanceBaseline() {
    const memoryUsage = process.memoryUsage();
    const memoryMB = memoryUsage.heapUsed / 1024 / 1024;
    
    this.performanceBaseline = {
      memory: memoryMB,
      timestamp: new Date().toISOString()
    };
    
    this.log(`Performance baseline established: ${memoryMB.toFixed(1)}MB memory`, 'info');
  }
  
  /**
   * Setup event handlers
   */
  setupEventHandlers() {
    // Handle process signals
    process.on('SIGINT', () => {
      this.log('Received SIGINT, stopping monitoring...', 'info');
      this.stopMonitoring();
    });
    
    process.on('SIGTERM', () => {
      this.log('Received SIGTERM, stopping monitoring...', 'info');
      this.stopMonitoring();
    });
    
    // Handle uncaught errors
    process.on('uncaughtException', (error) => {
      this.log(`Uncaught exception in monitor: ${error.message}`, 'error');
      this.emit('critical_failure', `Uncaught exception: ${error.message}`);
    });
    
    process.on('unhandledRejection', (reason, promise) => {
      this.log(`Unhandled rejection in monitor: ${reason}`, 'error');
      this.emit('critical_failure', `Unhandled rejection: ${reason}`);
    });
  }
  
  /**
   * Generate comprehensive monitoring report
   */
  generateMonitoringReport() {
    const endTime = Date.now();
    const totalDuration = endTime - this.startTime;
    
    const report = {
      deploymentId: this.options.deploymentId,
      monitoring: {
        startTime: new Date(this.startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        duration: totalDuration,
        totalChecks: this.checkCount,
        totalFailures: this.failureCount,
        successRate: this.checkCount > 0 ? ((this.checkCount - this.failureCount) / this.checkCount) * 100 : 0
      },
      
      performance: {
        baseline: this.performanceBaseline,
        currentMetrics: this.systemMetrics,
        violations: this.performanceViolations.length,
        averageResponseTime: this.calculateAverageResponseTime(),
        memoryTrend: this.calculateMemoryTrend()
      },
      
      health: {
        services: this.healthCheckResults,
        lastSuccessfulCheck: this.lastSuccessfulCheck ? new Date(this.lastSuccessfulCheck).toISOString() : null,
        overallHealth: this.calculateOverallHealth()
      },
      
      alerts: {
        total: this.alerts.length,
        byType: this.groupAlertsByType(),
        critical: this.alerts.filter(a => a.severity === 'critical').length,
        high: this.alerts.filter(a => a.severity === 'high').length
      },
      
      recommendations: this.generateRecommendations(),
      
      rollbackTriggered: this.performanceViolations.some(v => v.type === 'rollback_triggered')
    };
    
    // Save report
    try {
      const reportPath = path.join(this.options.dataDir, `monitoring-report-${this.options.deploymentId}.json`);
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      this.log(`Monitoring report saved: ${reportPath}`, 'info');
    } catch (error) {
      this.log(`Failed to save monitoring report: ${error.message}`, 'error');
    }
    
    return report;
  }
  
  /**
   * Calculate average response time
   */
  calculateAverageResponseTime() {
    const responseTimes = Object.values(this.healthCheckResults)
      .map(r => r.responseTime)
      .filter(rt => rt > 0);
    
    return responseTimes.length > 0 ?
      responseTimes.reduce((sum, rt) => sum + rt, 0) / responseTimes.length : 0;
  }
  
  /**
   * Calculate memory trend
   */
  calculateMemoryTrend() {
    if (this.performanceHistory.length < 2) {
      return 'insufficient_data';
    }
    
    const recent = this.performanceHistory.slice(-10);
    const memoryValues = recent.map(h => h.memory.overhead);
    
    const trend = memoryValues[memoryValues.length - 1] - memoryValues[0];
    
    if (trend > 5) return 'increasing';
    if (trend < -5) return 'decreasing';
    return 'stable';
  }
  
  /**
   * Calculate overall system health
   */
  calculateOverallHealth() {
    const healthyServices = Object.values(this.healthCheckResults).filter(r => r.healthy).length;
    const totalServices = Object.values(this.healthCheckResults).length;
    
    if (totalServices === 0) return 'unknown';
    
    const healthPercent = (healthyServices / totalServices) * 100;
    
    if (healthPercent === 100) return 'healthy';
    if (healthPercent >= 80) return 'mostly_healthy';
    if (healthPercent >= 50) return 'degraded';
    return 'unhealthy';
  }
  
  /**
   * Group alerts by type
   */
  groupAlertsByType() {
    const groups = {};
    
    this.alerts.forEach(alert => {
      groups[alert.type] = (groups[alert.type] || 0) + 1;
    });
    
    return groups;
  }
  
  /**
   * Generate recommendations based on monitoring results
   */
  generateRecommendations() {
    const recommendations = [];
    
    // Performance recommendations
    if (this.performanceViolations.length > 10) {
      recommendations.push({
        category: 'performance',
        priority: 'high',
        issue: 'High number of performance violations detected',
        recommendation: 'Review system resources and consider performance optimization'
      });
    }
    
    // Memory recommendations
    if (this.systemMetrics.memory.overhead > this.options.thresholds.memoryOverhead * 0.8) {
      recommendations.push({
        category: 'memory',
        priority: 'medium',
        issue: 'Memory usage approaching threshold',
        recommendation: 'Monitor memory usage closely and consider garbage collection tuning'
      });
    }
    
    // Health recommendations
    const unhealthyServices = Object.entries(this.healthCheckResults)
      .filter(([_, result]) => !result.healthy)
      .map(([service, _]) => service);
    
    if (unhealthyServices.length > 0) {
      recommendations.push({
        category: 'health',
        priority: 'critical',
        issue: `Services not responding: ${unhealthyServices.join(', ')}`,
        recommendation: 'Investigate service health and consider rollback if issues persist'
      });
    }
    
    return recommendations;
  }
  
  /**
   * Get current monitoring status
   */
  getMonitoringStatus() {
    return {
      isMonitoring: this.isMonitoring,
      deploymentId: this.options.deploymentId,
      startTime: this.startTime ? new Date(this.startTime).toISOString() : null,
      elapsed: this.startTime ? Date.now() - this.startTime : 0,
      checkCount: this.checkCount,
      failureCount: this.failureCount,
      performanceViolations: this.performanceViolations.length,
      alerts: this.alerts.length,
      overallHealth: this.calculateOverallHealth(),
      systemMetrics: this.systemMetrics
    };
  }
  
  /**
   * Logging utility
   */
  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [MONITOR] [${level.toUpperCase()}] ${message}`;
    
    console.log(logMessage);
    
    // Write to log file
    try {
      fs.appendFileSync(this.options.logPath, logMessage + '\n');
    } catch (error) {
      // Ignore file write errors to prevent cascading failures
    }
  }
}

module.exports = {
  DeploymentMonitor,
  MONITORING_CONFIG
};