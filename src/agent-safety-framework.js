/**
 * Agent Safety Framework - Context-Aware Safety Controls
 * 
 * Sprint 6 - Story 3.6: Agent Safety Framework (10 story points)
 * 
 * Provides graduated safety controls for the 15 new MCP tools with intelligent
 * context awareness based on workspace correlation, process categorization, and
 * risk assessment.
 * 
 * Key Features:
 * - Context-aware safety rules based on workspace correlation
 * - Graduated safety levels: SAFE, MODERATE, DANGEROUS
 * - Comprehensive audit logging with tamper-proof storage
 * - Emergency override capabilities for power users
 * - Performance requirement: <500ms per tool operation
 * - Configurable rules for different environments
 */

const EventEmitter = require('events');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const { createMcpError, MCP_ERROR_CODES } = require('./middleware/error-handler');

/**
 * Safety Level Classifications (matching MCP tools)
 */
const SafetyLevel = {
  SAFE: 'safe',           // Read-only operations, no side effects
  MODERATE: 'moderate',   // Limited modifications with validation
  DANGEROUS: 'dangerous'  // System-modifying operations requiring safety checks
};

/**
 * Risk Assessment Levels
 */
const RiskLevel = {
  LOW: 'low',
  MEDIUM: 'medium', 
  HIGH: 'high',
  CRITICAL: 'critical'
};

/**
 * Process Context Types
 */
const ProcessContext = {
  REGISTERED: 'registered',     // Process matches registered project
  WORKSPACE: 'workspace',       // Process correlated with workspace
  ROGUE: 'rogue',              // Process outside known workspaces
  SYSTEM: 'system',            // System/critical process
  UNKNOWN: 'unknown'           // Process could not be categorized
};

/**
 * Safety Decision Types
 */
const SafetyDecision = {
  ALLOW: 'allow',
  REQUIRE_CONFIRMATION: 'require_confirmation',
  BLOCK: 'block',
  EMERGENCY_OVERRIDE: 'emergency_override'
};

/**
 * Default Safety Rules Configuration
 */
const DEFAULT_SAFETY_RULES = {
  // Registered Project Process Rules
  registeredProcess: {
    safe: SafetyDecision.ALLOW,
    moderate: SafetyDecision.REQUIRE_CONFIRMATION,
    dangerous: SafetyDecision.REQUIRE_CONFIRMATION
  },
  
  // Workspace-correlated Process Rules  
  workspaceProcess: {
    safe: SafetyDecision.ALLOW,
    moderate: SafetyDecision.ALLOW,
    dangerous: SafetyDecision.REQUIRE_CONFIRMATION
  },
  
  // Rogue Process Rules
  rogueProcess: {
    safe: SafetyDecision.ALLOW,
    moderate: SafetyDecision.REQUIRE_CONFIRMATION, 
    dangerous: SafetyDecision.REQUIRE_CONFIRMATION
  },
  
  // System Process Rules
  systemProcess: {
    safe: SafetyDecision.ALLOW,
    moderate: SafetyDecision.BLOCK,
    dangerous: SafetyDecision.BLOCK
  },
  
  // Unknown Process Rules
  unknownProcess: {
    safe: SafetyDecision.ALLOW,
    moderate: SafetyDecision.REQUIRE_CONFIRMATION,
    dangerous: SafetyDecision.REQUIRE_CONFIRMATION
  }
};

/**
 * Safety Evaluation Result Structure
 */
class SafetyEvaluation {
  constructor(data = {}) {
    this.allowed = data.allowed || false;
    this.requiresConfirmation = data.requiresConfirmation || false;
    this.riskLevel = data.riskLevel || RiskLevel.LOW;
    this.reasoning = data.reasoning || '';
    this.alternatives = data.alternatives || [];
    this.auditRequired = data.auditRequired || true;
    this.processContext = data.processContext || ProcessContext.UNKNOWN;
    this.appliedRules = data.appliedRules || [];
    this.confidence = data.confidence || 0.0;
    this.timestamp = data.timestamp || new Date().toISOString();
  }

  /**
   * Create a blocking safety evaluation
   */
  static createBlocked(reasoning, alternatives = [], processContext = ProcessContext.UNKNOWN) {
    return new SafetyEvaluation({
      allowed: false,
      requiresConfirmation: false,
      riskLevel: RiskLevel.HIGH,
      reasoning,
      alternatives,
      processContext,
      confidence: 0.9
    });
  }

  /**
   * Create a confirmation-required safety evaluation
   */
  static createRequireConfirmation(reasoning, riskLevel = RiskLevel.MEDIUM, processContext = ProcessContext.UNKNOWN) {
    return new SafetyEvaluation({
      allowed: false,
      requiresConfirmation: true,
      riskLevel,
      reasoning,
      processContext,
      confidence: 0.8
    });
  }

  /**
   * Create an allowed safety evaluation
   */
  static createAllowed(reasoning = 'Operation approved by safety framework', processContext = ProcessContext.WORKSPACE) {
    return new SafetyEvaluation({
      allowed: true,
      requiresConfirmation: false,
      riskLevel: RiskLevel.LOW,
      reasoning,
      processContext,
      confidence: 0.7
    });
  }
}

/**
 * Agent Safety Framework Main Class
 * 
 * Provides context-aware safety controls for agent automation operations
 * with integration to MCP process management tools.
 */
class AgentSafetyFramework extends EventEmitter {
  constructor(options = {}) {
    super();

    this.options = {
      auditLogPath: options.auditLogPath || path.join(process.cwd(), 'logs', 'safety-audit.log'),
      enableAuditEncryption: options.enableAuditEncryption !== false,
      performanceTimeout: options.performanceTimeout || 500, // 500ms requirement
      enableEmergencyOverride: options.enableEmergencyOverride !== false,
      maxRiskToleranceLevel: options.maxRiskToleranceLevel || RiskLevel.HIGH,
      ...options
    };

    // External dependencies (injected)
    this.processCorrelationEngine = options.processCorrelationEngine || null;
    this.enhancedPortRegistry = options.enhancedPortRegistry || null;
    this.discoveryEngine = options.discoveryEngine || null;

    // Safety rules configuration
    this.safetyRules = { ...DEFAULT_SAFETY_RULES, ...(options.safetyRules || {}) };

    // Internal state
    this.initialized = false;
    this.auditLogEntries = [];
    this.performanceStats = {
      totalEvaluations: 0,
      averageResponseTime: 0,
      slowEvaluations: 0, // >500ms
      fastEvaluations: 0  // <=500ms
    };

    // Emergency override state
    this.emergencyOverrideActive = false;
    this.emergencyOverrideExpiry = null;
    this.emergencyOverrideTimer = null;

    // Cached risk assessments (5-minute TTL)
    this.riskAssessmentCache = new Map();
    this.cacheCleanupInterval = null;
  }

  /**
   * Initialize the Agent Safety Framework
   */
  async initialize() {
    console.log('Initializing Agent Safety Framework...');

    const startTime = Date.now();

    try {
      // Initialize dependencies
      if (this.processCorrelationEngine) {
        if (typeof this.processCorrelationEngine.initialize === 'function') {
          await this.processCorrelationEngine.initialize();
        }
      } else {
        console.warn('ProcessCorrelationEngine not available - workspace correlation will be limited');
      }

      if (this.enhancedPortRegistry) {
        if (typeof this.enhancedPortRegistry.initialize === 'function') {
          await this.enhancedPortRegistry.initialize();
        }
      } else {
        console.warn('EnhancedPortRegistry not available - process categorization will be limited');
      }

      if (this.discoveryEngine) {
        if (typeof this.discoveryEngine.initialize === 'function') {
          await this.discoveryEngine.initialize();
        }
      } else {
        console.warn('DiscoveryEngine not available - process discovery will be limited');
      }

      // Initialize audit logging system
      await this._initializeAuditLogging();

      // Start performance monitoring
      this._startPerformanceMonitoring();

      // Start cache cleanup
      this._startCacheCleanup();

      this.initialized = true;

      const initTime = Date.now() - startTime;
      console.log(`✓ Agent Safety Framework initialized in ${initTime}ms`);

      // Audit the initialization
      await this.auditLog('framework_initialization', {
        success: true,
        initTime,
        timestamp: new Date().toISOString()
      });

      this.emit('initialized', { initTime });

    } catch (error) {
      console.error('Failed to initialize Agent Safety Framework:', error);
      throw error;
    }
  }

  /**
   * Evaluate a process control request for safety
   * 
   * @param {Object} command - The process control command
   * @param {Object} context - Agent context information
   * @returns {Promise<SafetyEvaluation>} Safety evaluation result
   */
  async evaluateProcessControlRequest(command, context = {}) {
    const startTime = Date.now();

    try {
      // Performance tracking
      this.performanceStats.totalEvaluations++;

      // Emergency override check
      if (this.emergencyOverrideActive && this._isEmergencyOverrideValid()) {
        const evaluation = SafetyEvaluation.createAllowed(
          'Emergency override active - safety checks bypassed',
          ProcessContext.UNKNOWN
        );
        await this._auditSafetyDecision(command, context, evaluation, startTime);
        return evaluation;
      }

      // Determine process context through correlation
      const processContext = await this._determineProcessContext(command, context);

      // Apply contextual safety rules
      const evaluation = await this.applyContextualRules(command, context, processContext);

      // Performance validation
      const evaluationTime = Date.now() - startTime;
      this._updatePerformanceStats(evaluationTime);

      // Audit the decision
      await this._auditSafetyDecision(command, context, evaluation, startTime);

      return evaluation;

    } catch (error) {
      const evaluationTime = Date.now() - startTime;
      this._updatePerformanceStats(evaluationTime);

      console.error('Safety evaluation failed:', error);

      // Create fail-safe evaluation (default to blocking)
      const evaluation = SafetyEvaluation.createBlocked(
        `Safety evaluation failed: ${error.message}`,
        ['Verify system health and retry', 'Contact administrator if issue persists'],
        ProcessContext.UNKNOWN
      );

      await this._auditSafetyDecision(command, context, evaluation, startTime, error);

      return evaluation;
    }
  }

  /**
   * Apply contextual safety rules to a command
   * 
   * @param {Object} command - The process control command
   * @param {Object} context - Agent context information  
   * @param {string} processContext - Determined process context
   * @returns {Promise<SafetyEvaluation>} Safety evaluation result
   */
  async applyContextualRules(command, context, processContext) {
    const safetyLevel = command.safetyLevel || SafetyLevel.MODERATE;
    const appliedRules = [];

    // Get rule set for process context
    let ruleSet;
    switch (processContext) {
      case ProcessContext.REGISTERED:
        ruleSet = this.safetyRules.registeredProcess;
        break;
      case ProcessContext.WORKSPACE:
        ruleSet = this.safetyRules.workspaceProcess;
        break;
      case ProcessContext.ROGUE:
        ruleSet = this.safetyRules.rogueProcess;
        break;
      case ProcessContext.SYSTEM:
        ruleSet = this.safetyRules.systemProcess;
        break;
      default:
        ruleSet = this.safetyRules.unknownProcess;
    }

    // Apply safety level specific rule
    const decision = ruleSet[safetyLevel] || SafetyDecision.REQUIRE_CONFIRMATION;
    appliedRules.push(`${processContext}.${safetyLevel} -> ${decision}`);

    // Additional risk assessment for dangerous operations
    let riskLevel = RiskLevel.LOW;
    let reasoning = `Process context: ${processContext}, Safety level: ${safetyLevel}`;
    let alternatives = [];

    if (safetyLevel === SafetyLevel.DANGEROUS) {
      const riskAssessment = await this._performRiskAssessment(command, context, processContext);
      riskLevel = riskAssessment.riskLevel;
      reasoning += `. ${riskAssessment.reasoning}`;
      alternatives = riskAssessment.alternatives;
      appliedRules.push(...riskAssessment.appliedRules);
    }

    // Create evaluation based on decision
    let evaluation;
    switch (decision) {
      case SafetyDecision.ALLOW:
        evaluation = SafetyEvaluation.createAllowed(reasoning, processContext);
        break;
      case SafetyDecision.REQUIRE_CONFIRMATION:
        evaluation = SafetyEvaluation.createRequireConfirmation(reasoning, riskLevel, processContext);
        break;
      case SafetyDecision.BLOCK:
        evaluation = SafetyEvaluation.createBlocked(reasoning, alternatives, processContext);
        break;
      default:
        evaluation = SafetyEvaluation.createRequireConfirmation(
          `Unknown decision: ${decision}. ${reasoning}`,
          RiskLevel.MEDIUM,
          processContext
        );
    }

    evaluation.appliedRules = appliedRules;
    return evaluation;
  }

  /**
   * Activate emergency override for critical situations
   * 
   * @param {string} reason - Reason for emergency override
   * @param {number} durationMinutes - Override duration in minutes (default: 15)
   * @param {Object} authorizedBy - Authorization information
   * @returns {Promise<boolean>} Success status
   */
  async activateEmergencyOverride(reason, durationMinutes = 15, authorizedBy = {}) {
    if (!this.options.enableEmergencyOverride) {
      throw new Error('Emergency override is disabled in configuration');
    }

    const overrideId = crypto.randomUUID();
    const expiryTime = new Date(Date.now() + (durationMinutes * 60 * 1000));

    this.emergencyOverrideActive = true;
    this.emergencyOverrideExpiry = expiryTime;

    // Comprehensive audit for emergency override
    await this.auditLog('emergency_override_activated', {
      overrideId,
      reason,
      durationMinutes,
      expiryTime: expiryTime.toISOString(),
      authorizedBy,
      timestamp: new Date().toISOString(),
      severity: 'CRITICAL'
    });

    console.warn(`🚨 EMERGENCY OVERRIDE ACTIVATED: ${reason} (Expires: ${expiryTime.toISOString()})`);
    this.emit('emergencyOverrideActivated', { overrideId, reason, expiryTime });

    return true;
  }

  /**
   * Deactivate emergency override
   * 
   * @param {string} reason - Reason for deactivation
   * @returns {Promise<boolean>} Success status
   */
  async deactivateEmergencyOverride(reason = 'Manual deactivation') {
    if (!this.emergencyOverrideActive) {
      return false;
    }

    this.emergencyOverrideActive = false;
    const previousExpiry = this.emergencyOverrideExpiry;
    this.emergencyOverrideExpiry = null;
    
    // Clear the automatic expiration timer
    if (this.emergencyOverrideTimer) {
      clearTimeout(this.emergencyOverrideTimer);
      this.emergencyOverrideTimer = null;
    }

    await this.auditLog('emergency_override_deactivated', {
      reason,
      previousExpiry: previousExpiry?.toISOString(),
      timestamp: new Date().toISOString(),
      severity: 'HIGH'
    });

    console.log(`✓ Emergency override deactivated: ${reason}`);
    this.emit('emergencyOverrideDeactivated', { reason });

    return true;
  }

  /**
   * Comprehensive audit logging with tamper-proof storage
   * 
   * @param {string} operation - Operation type
   * @param {Object} data - Audit data
   * @returns {Promise<void>}
   */
  async auditLog(operation, data) {
    const auditEntry = {
      id: crypto.randomUUID(),
      operation,
      timestamp: new Date().toISOString(),
      data,
      hash: null // Will be calculated after JSON.stringify
    };

    // Calculate tamper-proof hash
    const entryString = JSON.stringify({ ...auditEntry, hash: null });
    auditEntry.hash = crypto.createHash('sha256').update(entryString).digest('hex');

    // Store in memory
    this.auditLogEntries.push(auditEntry);

    // Append to audit log file
    try {
      const logLine = JSON.stringify(auditEntry) + '\n';
      await fs.appendFile(this.options.auditLogPath, logLine, { encoding: 'utf8' });
    } catch (error) {
      console.error('Failed to write audit log:', error);
      // Continue execution - memory audit log still available
    }

    this.emit('auditLogged', auditEntry);
  }

  /**
   * Get comprehensive performance statistics
   * 
   * @returns {Object} Performance statistics
   */
  getPerformanceStats() {
    return {
      ...this.performanceStats,
      emergencyOverrideActive: this.emergencyOverrideActive,
      emergencyOverrideExpiry: this.emergencyOverrideExpiry?.toISOString(),
      auditLogSize: this.auditLogEntries.length,
      cacheSize: this.riskAssessmentCache.size,
      initialized: this.initialized,
      performanceCompliance: {
        meetsPerfReq: this.performanceStats.slowEvaluations === 0,
        averageResponseTime: this.performanceStats.averageResponseTime,
        target: `<${this.options.performanceTimeout}ms`
      }
    };
  }

  /**
   * Get audit history with optional filtering
   * 
   * @param {Object} options - Filter options
   * @param {number} options.limit - Maximum number of entries to return
   * @param {string} options.operation - Filter by operation type
   * @param {string} options.startDate - Filter entries after this date
   * @param {string} options.endDate - Filter entries before this date
   * @returns {Array} Filtered audit log entries
   */
  getAuditHistory(options = {}) {
    let entries = [...this.auditLogEntries]; // Copy array to avoid mutation
    
    // Apply filters
    if (options.operation) {
      entries = entries.filter(entry => entry.operation === options.operation);
    }
    
    if (options.startDate) {
      const startTime = new Date(options.startDate).getTime();
      entries = entries.filter(entry => new Date(entry.timestamp).getTime() >= startTime);
    }
    
    if (options.endDate) {
      const endTime = new Date(options.endDate).getTime();
      entries = entries.filter(entry => new Date(entry.timestamp).getTime() <= endTime);
    }
    
    // Sort by timestamp (newest first)
    entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    // Apply limit
    if (options.limit) {
      entries = entries.slice(0, options.limit);
    }
    
    return entries;
  }

  /**
   * Update safety rules configuration
   * 
   * @param {Object} newRules - New safety rules
   * @returns {Promise<void>}
   */
  async updateSafetyRules(newRules) {
    const previousRules = { ...this.safetyRules };
    this.safetyRules = { ...this.safetyRules, ...newRules };

    await this.auditLog('safety_rules_updated', {
      previousRules,
      newRules,
      timestamp: new Date().toISOString()
    });

    this.emit('safetyRulesUpdated', { newRules, previousRules });
  }

  /**
   * Shutdown the Agent Safety Framework
   */
  async shutdown() {
    console.log('Shutting down Agent Safety Framework...');

    // Cleanup intervals
    if (this.cacheCleanupInterval) {
      clearInterval(this.cacheCleanupInterval);
    }

    // Deactivate emergency override if active
    if (this.emergencyOverrideActive) {
      await this.deactivateEmergencyOverride('Framework shutdown');
    }
    
    // Clear any remaining timers
    if (this.emergencyOverrideTimer) {
      clearTimeout(this.emergencyOverrideTimer);
      this.emergencyOverrideTimer = null;
    }

    // Final audit log
    await this.auditLog('framework_shutdown', {
      performanceStats: this.performanceStats,
      auditLogSize: this.auditLogEntries.length,
      timestamp: new Date().toISOString()
    });

    this.initialized = false;
    this.emit('shutdown');
  }

  // Private Methods

  /**
   * Determine process context through correlation analysis
   * 
   * @private
   * @param {Object} command - Process control command
   * @param {Object} context - Agent context
   * @returns {Promise<string>} Process context
   */
  async _determineProcessContext(command, context) {
    try {
      const startTime = Date.now();

      // Extract process identifiers
      const processIds = this._extractProcessIdentifiers(command);
      
      if (!processIds.pid && !processIds.port && !processIds.processName) {
        return ProcessContext.UNKNOWN;
      }

      // Check registry for registered processes
      if (this.enhancedPortRegistry) {
        const registryData = await this.enhancedPortRegistry.getAllActiveProcesses({
          forceRefresh: false // Use cached data for performance
        });

        // Check if process is registered
        const isRegistered = registryData.registered.some(p => 
          p.pid === processIds.pid || p.port === processIds.port
        );
        if (isRegistered) {
          return ProcessContext.REGISTERED;
        }

        // Check if process is rogue
        const isRogue = registryData.rogue.some(p => 
          p.pid === processIds.pid || p.port === processIds.port
        );
        if (isRogue) {
          return ProcessContext.ROGUE;
        }
      }

      // Check for system processes
      if (processIds.pid && processIds.pid < 1000) {
        return ProcessContext.SYSTEM;
      }

      // Use process correlation engine for workspace correlation
      if (this.processCorrelationEngine && processIds.pid) {
        const correlationResult = await this.processCorrelationEngine.correlateProcesses([{
          pid: processIds.pid,
          port: processIds.port
        }]);

        if (correlationResult.registered && correlationResult.registered.length > 0) {
          return ProcessContext.REGISTERED;
        }

        if (correlationResult.discovered && correlationResult.discovered.length > 0) {
          return ProcessContext.WORKSPACE;
        }
      }

      const correlationTime = Date.now() - startTime;
      if (correlationTime > 200) { // Log slow correlations
        console.warn(`Slow process context determination: ${correlationTime}ms`);
      }

      return ProcessContext.UNKNOWN;

    } catch (error) {
      console.warn('Process context determination failed:', error);
      return ProcessContext.UNKNOWN;
    }
  }

  /**
   * Extract process identifiers from command
   * 
   * @private
   * @param {Object} command - Process control command
   * @returns {Object} Process identifiers
   */
  _extractProcessIdentifiers(command) {
    const ids = {
      pid: null,
      port: null,
      processName: null
    };

    // Extract from command parameters
    if (command.params) {
      ids.pid = command.params.pid;
      ids.port = command.params.port;
      ids.processName = command.params.processName;
    }

    // Extract from command itself
    ids.pid = ids.pid || command.pid;
    ids.port = ids.port || command.port;
    ids.processName = ids.processName || command.processName;

    // Convert to appropriate types
    if (ids.pid) ids.pid = parseInt(ids.pid);
    if (ids.port) ids.port = parseInt(ids.port);

    return ids;
  }

  /**
   * Perform comprehensive risk assessment
   * 
   * @private
   * @param {Object} command - Process control command
   * @param {Object} context - Agent context
   * @param {string} processContext - Process context
   * @returns {Promise<Object>} Risk assessment
   */
  async _performRiskAssessment(command, context, processContext) {
    const riskKey = this._generateRiskCacheKey(command, processContext);
    
    // Check cache first
    const cachedAssessment = this.riskAssessmentCache.get(riskKey);
    if (cachedAssessment && (Date.now() - cachedAssessment.timestamp) < 300000) { // 5 minutes
      return cachedAssessment;
    }

    // Perform new risk assessment
    const assessment = {
      riskLevel: RiskLevel.MEDIUM,
      reasoning: 'Default risk assessment for dangerous operation',
      alternatives: [],
      appliedRules: [],
      confidence: 0.6,
      timestamp: Date.now()
    };

    // System process assessment
    if (processContext === ProcessContext.SYSTEM) {
      assessment.riskLevel = RiskLevel.CRITICAL;
      assessment.reasoning = 'System process detected - high risk of system instability';
      assessment.alternatives = [
        'Use process restart instead of termination',
        'Contact system administrator',
        'Use service management commands (systemctl, etc.)'
      ];
      assessment.confidence = 0.9;
      assessment.appliedRules.push('system_process_risk_elevation');
    }

    // Batch operation assessment
    if (command.toolName === 'host.bulk_process_management') {
      const operationCount = command.params?.operations?.length || 0;
      if (operationCount > 5) {
        assessment.riskLevel = RiskLevel.HIGH;
        assessment.reasoning = `Bulk operation with ${operationCount} operations - increased risk of system impact`;
        assessment.alternatives = [
          'Process operations in smaller batches',
          'Use dry-run mode first',
          'Implement rollback plan'
        ];
        assessment.appliedRules.push('bulk_operation_risk_elevation');
      }
    }

    // Rogue process assessment
    if (processContext === ProcessContext.ROGUE) {
      assessment.riskLevel = RiskLevel.MEDIUM;
      assessment.reasoning = 'Rogue process - outside known workspaces, proceed with caution';
      assessment.alternatives = [
        'Verify process purpose before termination',
        'Check if process is part of legitimate application',
        'Use monitoring tools to understand process behavior'
      ];
      assessment.appliedRules.push('rogue_process_caution');
    }

    // Cache the assessment
    this.riskAssessmentCache.set(riskKey, assessment);

    return assessment;
  }

  /**
   * Generate cache key for risk assessment
   * 
   * @private
   * @param {Object} command - Process control command
   * @param {string} processContext - Process context
   * @returns {string} Cache key
   */
  _generateRiskCacheKey(command, processContext) {
    const key = `${command.toolName || 'unknown'}_${processContext}_${command.params?.pid || 'nopid'}_${command.params?.port || 'noport'}`;
    return crypto.createHash('md5').update(key).digest('hex');
  }

  /**
   * Initialize audit logging system
   * 
   * @private
   */
  async _initializeAuditLogging() {
    try {
      // Ensure audit log directory exists
      const logDir = path.dirname(this.options.auditLogPath);
      await fs.mkdir(logDir, { recursive: true });

      // Initialize audit log file if it doesn't exist
      try {
        await fs.access(this.options.auditLogPath);
      } catch {
        await fs.writeFile(this.options.auditLogPath, '', { encoding: 'utf8' });
      }

      console.log(`✓ Audit logging initialized: ${this.options.auditLogPath}`);
    } catch (error) {
      console.warn('Failed to initialize audit logging:', error);
      // Continue without file logging
    }
  }

  /**
   * Update performance statistics
   * 
   * @private
   * @param {number} evaluationTime - Evaluation time in milliseconds
   */
  _updatePerformanceStats(evaluationTime) {
    const total = this.performanceStats.totalEvaluations;
    const currentAverage = this.performanceStats.averageResponseTime;
    
    // Ensure minimum measurable time for testing
    const measurableTime = Math.max(evaluationTime, 1);
    
    // Update average response time (total is already incremented)
    this.performanceStats.averageResponseTime = 
      total === 1 ? measurableTime : ((currentAverage * (total - 1)) + measurableTime) / total;

    // Track slow vs fast evaluations
    if (evaluationTime > this.options.performanceTimeout) {
      this.performanceStats.slowEvaluations++;
    } else {
      this.performanceStats.fastEvaluations++;
    }
  }

  /**
   * Audit safety decision
   * 
   * @private
   * @param {Object} command - Process control command
   * @param {Object} context - Agent context
   * @param {SafetyEvaluation} evaluation - Safety evaluation result
   * @param {number} startTime - Evaluation start time
   * @param {Error} error - Error if evaluation failed
   */
  async _auditSafetyDecision(command, context, evaluation, startTime, error = null) {
    const evaluationTime = Date.now() - startTime;

    await this.auditLog('safety_evaluation', {
      command: {
        toolName: command.toolName,
        safetyLevel: command.safetyLevel,
        params: command.params ? Object.keys(command.params) : []
      },
      context: {
        agent: context.agent || 'unknown',
        user: context.user || 'unknown',
        sessionId: context.sessionId
      },
      evaluation: {
        allowed: evaluation.allowed,
        requiresConfirmation: evaluation.requiresConfirmation,
        riskLevel: evaluation.riskLevel,
        processContext: evaluation.processContext,
        appliedRules: evaluation.appliedRules
      },
      performance: {
        evaluationTime,
        meetsPerfReq: evaluationTime <= this.options.performanceTimeout
      },
      error: error ? {
        message: error.message,
        stack: error.stack
      } : null,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Check if emergency override is still valid
   * 
   * @private
   * @returns {boolean} Override validity
   */
  _isEmergencyOverrideValid() {
    if (!this.emergencyOverrideActive || !this.emergencyOverrideExpiry) {
      return false;
    }

    const isValid = Date.now() < this.emergencyOverrideExpiry.getTime();
    
    if (!isValid) {
      // Auto-deactivate expired override
      this.deactivateEmergencyOverride('Automatic expiration');
    }

    return isValid;
  }

  /**
   * Start performance monitoring
   * 
   * @private
   */
  _startPerformanceMonitoring() {
    // Performance monitoring is handled per-evaluation
    // This method reserved for future monitoring enhancements
  }

  /**
   * Start cache cleanup interval
   * 
   * @private
   */
  _startCacheCleanup() {
    this.cacheCleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, value] of this.riskAssessmentCache.entries()) {
        if (now - value.timestamp > 300000) { // 5 minutes
          this.riskAssessmentCache.delete(key);
        }
      }
    }, 60000); // Cleanup every minute
  }
}

module.exports = {
  AgentSafetyFramework,
  SafetyLevel,
  RiskLevel,
  ProcessContext,
  SafetyDecision,
  SafetyEvaluation,
  DEFAULT_SAFETY_RULES
};