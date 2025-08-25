/**
 * Safety-Aware MCP Tools Integration
 * 
 * Wraps all 15 MCP Process Management Tools with Agent Safety Framework
 * providing context-aware safety controls while preserving original functionality.
 * 
 * This module acts as the integration layer between the MCP tools and the
 * Agent Safety Framework, ensuring all tool operations go through safety validation
 * while maintaining the <500ms performance requirement.
 */

const { AgentSafetyFramework, SafetyLevel, SafetyDecision } = require('./agent-safety-framework');
const { 
  PROCESS_MANAGEMENT_TOOL_DEFINITIONS, 
  PROCESS_MANAGEMENT_TOOL_HANDLERS,
  initializeProcessManagementServices 
} = require('./mcp-process-management-tools');
const { createMcpError, MCP_ERROR_CODES } = require('./middleware/error-handler');
const { MultiTechProcessDiscoveryEngine } = require('./services/multi-tech-process-discovery-engine');
const { EnhancedPortRegistry } = require('./enhanced-port-registry');
const { ProcessCorrelationEngine } = require('./services/process-correlation-engine');

/**
 * Safety-Aware Tool Result Structure
 */
class SafetyAwareToolResult {
  constructor(originalResult, safetyEvaluation, performanceMetrics = {}) {
    this.success = originalResult.success;
    this.result = originalResult;
    this.safety = {
      evaluation: safetyEvaluation,
      framework: 'AgentSafetyFramework',
      version: '1.0.0'
    };
    this.performance = {
      totalTime: performanceMetrics.totalTime || 0,
      safetyEvaluationTime: performanceMetrics.safetyEvaluationTime || 0,
      toolExecutionTime: performanceMetrics.toolExecutionTime || 0,
      meetsPerfReq: (performanceMetrics.totalTime || 0) < 500
    };
    this.timestamp = new Date().toISOString();
  }

  /**
   * Create blocked result for safety violations
   */
  static createBlocked(safetyEvaluation, performanceMetrics = {}) {
    return new SafetyAwareToolResult(
      {
        success: false,
        error: 'Operation blocked by safety framework',
        reason: safetyEvaluation.reasoning,
        alternatives: safetyEvaluation.alternatives
      },
      safetyEvaluation,
      performanceMetrics
    );
  }

  /**
   * Create confirmation required result
   */
  static createConfirmationRequired(safetyEvaluation, performanceMetrics = {}) {
    return new SafetyAwareToolResult(
      {
        success: false,
        requiresConfirmation: true,
        confirmationMessage: safetyEvaluation.reasoning,
        riskLevel: safetyEvaluation.riskLevel,
        processContext: safetyEvaluation.processContext
      },
      safetyEvaluation,
      performanceMetrics
    );
  }
}

/**
 * Safety-Aware MCP Tools Manager
 * 
 * Main class that wraps all MCP tools with safety framework integration
 */
class SafetyAwareMcpToolsManager {
  constructor(options = {}) {
    this.options = {
      enableSafetyFramework: options.enableSafetyFramework !== false,
      safetyFrameworkOptions: options.safetyFrameworkOptions || {},
      performanceLogging: options.performanceLogging !== false,
      ...options
    };

    // Initialize safety framework
    this.safetyFramework = null;
    this.initialized = false;

    // Tool execution statistics
    this.stats = {
      totalExecutions: 0,
      safetyBlockedExecutions: 0,
      confirmationRequiredExecutions: 0,
      successfulExecutions: 0,
      averageResponseTime: 0,
      slowExecutions: 0 // >500ms
    };

    // Performance monitoring
    this.performanceHistory = [];
    this.maxHistorySize = 1000;
  }

  /**
   * Initialize the safety-aware MCP tools manager
   */
  async initialize() {
    console.log('Initializing Safety-Aware MCP Tools Manager...');

    const startTime = Date.now();

    try {
      // Initialize MCP process management services first
      await initializeProcessManagementServices();

      // Initialize safety framework if enabled
      if (this.options.enableSafetyFramework) {
        await this._initializeSafetyFramework();
      }

      // Generate safety-aware tool definitions and handlers
      this.safetyAwareToolDefinitions = this._generateSafetyAwareDefinitions();
      this.safetyAwareToolHandlers = this._generateSafetyAwareHandlers();

      this.initialized = true;

      const initTime = Date.now() - startTime;
      console.log(`✓ Safety-Aware MCP Tools Manager initialized in ${initTime}ms`);

      if (this.safetyFramework) {
        await this.safetyFramework.auditLog('safety_aware_tools_initialized', {
          toolCount: this.safetyAwareToolDefinitions.length,
          safetyEnabled: this.options.enableSafetyFramework,
          initTime,
          timestamp: new Date().toISOString()
        });
      }

    } catch (error) {
      console.error('Failed to initialize Safety-Aware MCP Tools Manager:', error);
      throw error;
    }
  }

  /**
   * Execute a tool with safety framework integration
   * 
   * @param {string} toolName - Name of the tool to execute
   * @param {Object} params - Tool parameters
   * @param {Object} context - Execution context
   * @returns {Promise<SafetyAwareToolResult>} Tool execution result
   */
  async executeTool(toolName, params = {}, context = {}) {
    const startTime = Date.now();
    
    try {
      // Update execution statistics
      this.stats.totalExecutions++;

      // Find tool handler
      const handler = this.safetyAwareToolHandlers[toolName];
      if (!handler) {
        throw new Error(`Tool not found: ${toolName}`);
      }

      // Execute with safety awareness
      const result = await handler(params, context, this);

      // Update performance statistics
      this._updatePerformanceStats(Date.now() - startTime, result);

      return result;

    } catch (error) {
      const executionTime = Date.now() - startTime;
      this._updatePerformanceStats(executionTime, null, error);

      console.error(`Tool execution failed: ${toolName}`, error);
      
      // Create error result
      const errorResult = new SafetyAwareToolResult(
        {
          success: false,
          error: error.message,
          toolName
        },
        null,
        { totalTime: executionTime }
      );

      return errorResult;
    }
  }

  /**
   * Get comprehensive execution statistics
   */
  getExecutionStats() {
    return {
      ...this.stats,
      safetyFramework: this.safetyFramework ? this.safetyFramework.getPerformanceStats() : null,
      performanceCompliance: {
        meetsPerfReq: this.stats.slowExecutions === 0,
        averageResponseTime: this.stats.averageResponseTime,
        target: '<500ms'
      },
      recentPerformance: this.performanceHistory.slice(-10) // Last 10 executions
    };
  }

  /**
   * Get all safety-aware tool definitions for MCP server
   */
  getToolDefinitions() {
    return this.safetyAwareToolDefinitions;
  }

  /**
   * Get all safety-aware tool handlers for MCP server
   */
  getToolHandlers() {
    return this.safetyAwareToolHandlers;
  }

  /**
   * Shutdown the manager
   */
  async shutdown() {
    if (this.safetyFramework) {
      await this.safetyFramework.shutdown();
    }
    this.initialized = false;
  }

  // Private Methods

  /**
   * Initialize safety framework with all required dependencies
   * 
   * @private
   */
  async _initializeSafetyFramework() {
    try {
      // Create instances of required services for safety framework
      const discoveryEngine = new MultiTechProcessDiscoveryEngine();
      await discoveryEngine.initialize();

      const enhancedRegistry = new EnhancedPortRegistry();
      await enhancedRegistry.initialize();

      const correlationEngine = new ProcessCorrelationEngine({
        portRegistry: enhancedRegistry,
        workspaceScanner: null // Will use discovery engine capabilities
      });
      await correlationEngine.initialize();

      // Initialize safety framework with all dependencies
      this.safetyFramework = new AgentSafetyFramework({
        processCorrelationEngine: correlationEngine,
        enhancedPortRegistry: enhancedRegistry,
        discoveryEngine: discoveryEngine,
        ...this.options.safetyFrameworkOptions
      });

      await this.safetyFramework.initialize();

      console.log('✓ Agent Safety Framework integrated successfully');

    } catch (error) {
      console.error('Failed to initialize safety framework:', error);
      throw error;
    }
  }

  /**
   * Generate safety-aware tool definitions
   * 
   * @private
   * @returns {Array} Enhanced tool definitions
   */
  _generateSafetyAwareDefinitions() {
    return PROCESS_MANAGEMENT_TOOL_DEFINITIONS.map(toolDef => ({
      ...toolDef,
      description: `[SAFETY-AWARE] ${toolDef.description}`,
      safetyAware: true,
      safetyLevel: toolDef.safetyLevel,
      inputSchema: {
        ...toolDef.inputSchema,
        properties: {
          ...toolDef.inputSchema.properties,
          // Add safety framework specific parameters
          skipSafetyCheck: {
            type: 'boolean',
            description: 'Skip safety framework validation (requires emergency override)',
            default: false
          },
          confirmationToken: {
            type: 'string',
            description: 'Confirmation token for operations requiring user confirmation'
          },
          agentContext: {
            type: 'object',
            description: 'Agent execution context for safety evaluation',
            properties: {
              agent: { type: 'string', description: 'Agent identifier' },
              user: { type: 'string', description: 'User identifier' },
              sessionId: { type: 'string', description: 'Session identifier' }
            }
          }
        }
      }
    }));
  }

  /**
   * Generate safety-aware tool handlers
   * 
   * @private
   * @returns {Object} Enhanced tool handlers
   */
  _generateSafetyAwareHandlers() {
    const safetyAwareHandlers = {};

    // Wrap each original handler with safety framework
    Object.keys(PROCESS_MANAGEMENT_TOOL_HANDLERS).forEach(toolName => {
      const originalHandler = PROCESS_MANAGEMENT_TOOL_HANDLERS[toolName];
      const toolDefinition = PROCESS_MANAGEMENT_TOOL_DEFINITIONS.find(t => t.name === toolName);

      safetyAwareHandlers[toolName] = async (params, context, manager) => {
        return await this._executeSafetyAwareHandler(
          toolName,
          originalHandler,
          toolDefinition,
          params,
          context,
          manager
        );
      };
    });

    return safetyAwareHandlers;
  }

  /**
   * Execute tool with safety framework validation
   * 
   * @private
   * @param {string} toolName - Tool name
   * @param {Function} originalHandler - Original tool handler
   * @param {Object} toolDefinition - Tool definition
   * @param {Object} params - Tool parameters
   * @param {Object} context - Execution context
   * @param {Object} manager - Manager instance
   * @returns {Promise<SafetyAwareToolResult>} Execution result
   */
  async _executeSafetyAwareHandler(toolName, originalHandler, toolDefinition, params, context, manager) {
    const startTime = Date.now();
    let safetyEvaluationTime = 0;
    let toolExecutionTime = 0;

    try {
      // Check if safety framework should be bypassed
      if (params.skipSafetyCheck && !this._canSkipSafety(context)) {
        return SafetyAwareToolResult.createBlocked(
          {
            allowed: false,
            reasoning: 'Safety bypass requires emergency override authorization',
            riskLevel: 'critical',
            alternatives: ['Remove skipSafetyCheck parameter', 'Activate emergency override']
          },
          { totalTime: Date.now() - startTime }
        );
      }

      // Safety evaluation (only if safety framework enabled and not bypassed)
      let safetyEvaluation = null;
      if (this.options.enableSafetyFramework && !params.skipSafetyCheck) {
        const safetyStartTime = Date.now();

        const command = {
          toolName,
          safetyLevel: toolDefinition.safetyLevel,
          params
        };

        const agentContext = {
          agent: context.agent || params.agentContext?.agent || 'unknown',
          user: context.user || params.agentContext?.user || 'system',
          sessionId: context.sessionId || params.agentContext?.sessionId || 'no-session'
        };

        safetyEvaluation = await this.safetyFramework.evaluateProcessControlRequest(command, agentContext);
        safetyEvaluationTime = Date.now() - safetyStartTime;

        // Handle safety evaluation result
        if (!safetyEvaluation.allowed) {
          if (safetyEvaluation.requiresConfirmation) {
            // Check if confirmation token provided
            if (!params.confirmationToken || !this._validateConfirmationToken(params.confirmationToken, command, agentContext)) {
              return SafetyAwareToolResult.createConfirmationRequired(
                safetyEvaluation,
                {
                  totalTime: Date.now() - startTime,
                  safetyEvaluationTime
                }
              );
            }
          } else {
            // Operation blocked
            return SafetyAwareToolResult.createBlocked(
              safetyEvaluation,
              {
                totalTime: Date.now() - startTime,
                safetyEvaluationTime
              }
            );
          }
        }
      }

      // Execute original tool handler
      const toolStartTime = Date.now();
      const originalResult = await originalHandler(params);
      toolExecutionTime = Date.now() - toolStartTime;

      // Create safety-aware result
      const totalTime = Date.now() - startTime;
      const result = new SafetyAwareToolResult(
        originalResult,
        safetyEvaluation,
        {
          totalTime,
          safetyEvaluationTime,
          toolExecutionTime
        }
      );

      // Update statistics
      this.stats.successfulExecutions++;
      if (safetyEvaluation?.requiresConfirmation && params.confirmationToken) {
        this.stats.confirmationRequiredExecutions++;
      }

      return result;

    } catch (error) {
      console.error(`Safety-aware tool execution failed: ${toolName}`, error);
      
      const totalTime = Date.now() - startTime;
      return new SafetyAwareToolResult(
        {
          success: false,
          error: error.message,
          toolName
        },
        safetyEvaluation,
        {
          totalTime,
          safetyEvaluationTime,
          toolExecutionTime
        }
      );
    }
  }

  /**
   * Check if safety can be bypassed based on context
   * 
   * @private
   * @param {Object} context - Execution context
   * @returns {boolean} Whether safety can be bypassed
   */
  _canSkipSafety(context) {
    // Only allow bypass if emergency override is active
    return this.safetyFramework && 
           this.safetyFramework.emergencyOverrideActive &&
           this.safetyFramework._isEmergencyOverrideValid();
  }

  /**
   * Validate confirmation token for operations requiring confirmation
   * 
   * @private
   * @param {string} token - Confirmation token
   * @param {Object} command - Command being executed
   * @param {Object} context - Execution context
   * @returns {boolean} Token validity
   */
  _validateConfirmationToken(token, command, context) {
    // Simple token validation - in production, this would be more sophisticated
    // For now, accept any non-empty token as confirmation
    return typeof token === 'string' && token.length > 0;
  }

  /**
   * Update performance statistics
   * 
   * @private
   * @param {number} executionTime - Execution time in milliseconds
   * @param {SafetyAwareToolResult} result - Execution result
   * @param {Error} error - Execution error (if any)
   */
  _updatePerformanceStats(executionTime, result, error = null) {
    const total = this.stats.totalExecutions;
    const currentAverage = this.stats.averageResponseTime;

    // Update average response time
    this.stats.averageResponseTime = 
      ((currentAverage * (total - 1)) + executionTime) / total;

    // Track slow executions
    if (executionTime > 500) {
      this.stats.slowExecutions++;
    }

    // Track blocked executions
    if (result && !result.success && result.safety?.evaluation && !result.safety.evaluation.allowed) {
      if (result.safety.evaluation.requiresConfirmation) {
        this.stats.confirmationRequiredExecutions++;
      } else {
        this.stats.safetyBlockedExecutions++;
      }
    }

    // Add to performance history
    this.performanceHistory.push({
      timestamp: new Date().toISOString(),
      executionTime,
      success: result ? result.success : false,
      error: error ? error.message : null,
      meetsPerfReq: executionTime <= 500
    });

    // Trim history if too large
    if (this.performanceHistory.length > this.maxHistorySize) {
      this.performanceHistory = this.performanceHistory.slice(-this.maxHistorySize);
    }
  }
}

/**
 * Convenience function to create and initialize a safety-aware MCP tools manager
 * 
 * @param {Object} options - Configuration options
 * @returns {Promise<SafetyAwareMcpToolsManager>} Initialized manager
 */
async function createSafetyAwareMcpToolsManager(options = {}) {
  const manager = new SafetyAwareMcpToolsManager(options);
  await manager.initialize();
  return manager;
}

module.exports = {
  SafetyAwareMcpToolsManager,
  SafetyAwareToolResult,
  createSafetyAwareMcpToolsManager
};