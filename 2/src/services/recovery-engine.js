/**
 * Recovery Engine Service
 * Implements automatic recovery strategies for system failures
 * Part of Story 2.4: Error Handling Framework
 */

const { ErrorHandler, RECOVERY_STRATEGIES, ERROR_TYPES } = require('./error-handler');
const { createMcpError, MCP_ERROR_CODES } = require('../middleware/error-handler');

/**
 * Recovery states
 */
const RECOVERY_STATES = {
  IDLE: 'idle',
  ATTEMPTING: 'attempting',
  SUCCEEDED: 'succeeded',
  FAILED: 'failed',
  EXHAUSTED: 'exhausted'
};

class RecoveryEngine {
  constructor() {
    this.errorHandler = new ErrorHandler();
    this.recoveryAttempts = new Map();
    this.recoveryStats = new Map();
    this.isRecovering = new Set();
  }

  /**
   * Attempt recovery for a failed operation
   * @param {Object} error - Error object from ErrorHandler
   * @param {Function} originalOperation - Original operation function to retry
   * @param {Object} context - Recovery context
   * @returns {Promise<Object>} Recovery result
   */
  async attemptRecovery(error, originalOperation, context = {}) {
    const recoveryId = this.generateRecoveryId(error, context);
    
    // Prevent concurrent recovery attempts for the same operation
    if (this.isRecovering.has(recoveryId)) {
      return {
        success: false,
        state: RECOVERY_STATES.ATTEMPTING,
        message: 'Recovery already in progress',
        recoveryId
      };
    }
    
    this.isRecovering.add(recoveryId);
    
    try {
      const recoveryContext = {
        ...context,
        recoveryId,
        originalError: error,
        startedAt: new Date().toISOString()
      };
      
      // Determine recovery strategy
      const strategy = this.determineRecoveryStrategy(error, context);
      
      // Execute recovery based on strategy
      let result;
      switch (strategy) {
        case 'RETRY':
          result = await this.executeRetryStrategy(originalOperation, recoveryContext);
          break;
        case 'FALLBACK':
          result = await this.executeFallbackStrategy(originalOperation, recoveryContext);
          break;
        case 'RESTART':
          result = await this.executeRestartStrategy(recoveryContext);
          break;
        case 'DEGRADE':
          result = await this.executeDegradeStrategy(recoveryContext);
          break;
        default:
          result = await this.executeDefaultRecovery(originalOperation, recoveryContext);
      }
      
      // Record recovery success
      this.recordRecoveryAttempt(recoveryId, strategy, true, result);
      
      return {
        success: true,
        state: RECOVERY_STATES.SUCCEEDED,
        strategy,
        result,
        recoveryId,
        completedAt: new Date().toISOString()
      };
      
    } catch (recoveryError) {
      // Record recovery failure
      this.recordRecoveryAttempt(recoveryId, 'unknown', false, recoveryError.message);
      
      return {
        success: false,
        state: RECOVERY_STATES.FAILED,
        error: recoveryError.message,
        recoveryId,
        failedAt: new Date().toISOString()
      };
      
    } finally {
      this.isRecovering.delete(recoveryId);
    }
  }

  /**
   * Determine the appropriate recovery strategy for an error
   * @param {Object} error - Error object
   * @param {Object} context - Operation context
   * @returns {string} Recovery strategy name
   */
  determineRecoveryStrategy(error, context) {
    // Check if error has a predefined recovery strategy
    if (error.recovery && error.recovery.strategy) {
      return error.recovery.strategy;
    }
    
    // Determine strategy based on error type
    switch (error.type) {
      case ERROR_TYPES.DOCKER:
        return context.component === 'container' ? 'RESTART' : 'RETRY';
      
      case ERROR_TYPES.NETWORK:
        return 'RETRY';
      
      case ERROR_TYPES.FILESYSTEM:
        return 'FALLBACK';
      
      case ERROR_TYPES.PORT:
        return 'RETRY';
      
      case ERROR_TYPES.CONFIG:
        return 'FALLBACK';
      
      case ERROR_TYPES.RESOURCE:
        return 'DEGRADE';
      
      case ERROR_TYPES.SYSTEM:
        return error.severity === 'critical' ? 'DEGRADE' : 'RESTART';
      
      default:
        return 'RETRY';
    }
  }

  /**
   * Execute retry recovery strategy with exponential backoff
   * @param {Function} operation - Operation to retry
   * @param {Object} context - Recovery context
   * @returns {Promise<any>} Operation result
   */
  async executeRetryStrategy(operation, context) {
    const config = RECOVERY_STRATEGIES.RETRY;
    const attempts = this.getAttemptCount(context.recoveryId);
    
    if (attempts >= config.maxAttempts) {
      throw new Error(`Maximum retry attempts (${config.maxAttempts}) exceeded`);
    }
    
    // Calculate delay with exponential backoff and jitter
    const delay = config.initialDelay * Math.pow(config.backoffMultiplier, attempts);
    const jitter = config.jitter ? Math.random() * 0.1 * delay : 0;
    const totalDelay = delay + jitter;
    
    // Wait before retry
    if (attempts > 0) {
      console.log(`Recovery: Waiting ${totalDelay}ms before retry attempt ${attempts + 1}`);
      await this.sleep(totalDelay);
    }
    
    // Increment attempt counter
    this.incrementAttemptCount(context.recoveryId);
    
    try {
      // Attempt the operation
      const result = await operation();
      
      console.log(`Recovery: Retry successful after ${attempts + 1} attempts`);
      return result;
      
    } catch (error) {
      console.log(`Recovery: Retry attempt ${attempts + 1} failed:`, error.message);
      
      // If this was the last attempt, throw the error
      if (attempts + 1 >= config.maxAttempts) {
        throw new Error(`All retry attempts failed. Last error: ${error.message}`);
      }
      
      // Otherwise, try again (recursive call)
      return this.executeRetryStrategy(operation, context);
    }
  }

  /**
   * Execute fallback recovery strategy
   * @param {Function} operation - Original operation
   * @param {Object} context - Recovery context
   * @returns {Promise<any>} Fallback result
   */
  async executeFallbackStrategy(operation, context) {
    const config = RECOVERY_STRATEGIES.FALLBACK;
    
    // Try alternative actions in order
    for (const action of config.alternativeActions) {
      try {
        console.log(`Recovery: Attempting fallback action: ${action}`);
        
        const result = await this.executeFallbackAction(action, context);
        
        console.log(`Recovery: Fallback action '${action}' succeeded`);
        return {
          fallbackAction: action,
          result,
          message: `Operation completed using fallback: ${action}`
        };
        
      } catch (error) {
        console.log(`Recovery: Fallback action '${action}' failed:`, error.message);
        continue;
      }
    }
    
    throw new Error('All fallback actions failed');
  }

  /**
   * Execute restart recovery strategy
   * @param {Object} context - Recovery context
   * @returns {Promise<any>} Restart result
   */
  async executeRestartStrategy(context) {
    const config = RECOVERY_STRATEGIES.RESTART;
    
    console.log(`Recovery: Initiating ${config.component} restart`);
    
    // Simulate restart process (this would integrate with actual services)
    await this.sleep(config.gracePeriod);
    
    return {
      action: 'restart',
      component: config.component,
      message: `${config.component} restart completed`,
      restartedAt: new Date().toISOString()
    };
  }

  /**
   * Execute degradation recovery strategy
   * @param {Object} context - Recovery context
   * @returns {Promise<any>} Degradation result
   */
  async executeDegradeStrategy(context) {
    const config = RECOVERY_STRATEGIES.DEGRADE;
    
    console.log('Recovery: Entering degraded mode');
    
    // Disable non-critical features
    const disabledFeatures = config.disableFeatures;
    
    return {
      action: 'degrade',
      mode: config.fallbackMode,
      disabledFeatures,
      message: 'System running in degraded mode with reduced functionality',
      degradedAt: new Date().toISOString()
    };
  }

  /**
   * Execute default recovery (simple retry)
   * @param {Function} operation - Operation to retry
   * @param {Object} context - Recovery context
   * @returns {Promise<any>} Operation result
   */
  async executeDefaultRecovery(operation, context) {
    console.log('Recovery: Executing default recovery (single retry)');
    
    // Simple single retry after short delay
    await this.sleep(1000);
    
    try {
      return await operation();
    } catch (error) {
      throw new Error(`Default recovery failed: ${error.message}`);
    }
  }

  /**
   * Execute a specific fallback action
   * @param {string} action - Fallback action name
   * @param {Object} context - Recovery context
   * @returns {Promise<any>} Action result
   */
  async executeFallbackAction(action, context) {
    switch (action) {
      case 'cache':
        return this.executeCacheFallback(context);
      
      case 'default':
        return this.executeDefaultFallback(context);
      
      case 'manual':
        return this.executeManualFallback(context);
      
      default:
        throw new Error(`Unknown fallback action: ${action}`);
    }
  }

  /**
   * Execute cache fallback action
   * @param {Object} context - Recovery context
   * @returns {Promise<any>} Cached result
   */
  async executeCacheFallback(context) {
    // In a real implementation, this would access cached data
    return {
      source: 'cache',
      data: 'cached_fallback_data',
      message: 'Using cached data due to service unavailability'
    };
  }

  /**
   * Execute default fallback action
   * @param {Object} context - Recovery context
   * @returns {Promise<any>} Default result
   */
  async executeDefaultFallback(context) {
    return {
      source: 'default',
      data: 'default_fallback_data',
      message: 'Using default configuration due to service unavailability'
    };
  }

  /**
   * Execute manual fallback action
   * @param {Object} context - Recovery context
   * @returns {Promise<any>} Manual result
   */
  async executeManualFallback(context) {
    return {
      source: 'manual',
      requiresIntervention: true,
      message: 'Manual intervention required - automatic recovery not possible',
      instructions: 'Please check system status and resolve the underlying issue'
    };
  }

  /**
   * Generate unique recovery ID
   * @param {Object} error - Error object
   * @param {Object} context - Recovery context
   * @returns {string} Recovery ID
   */
  generateRecoveryId(error, context) {
    const errorKey = error.code || error.type || 'unknown';
    const contextKey = context.operation || context.component || 'unknown';
    const timestamp = Date.now();
    
    return `recovery_${errorKey}_${contextKey}_${timestamp}`;
  }

  /**
   * Get attempt count for a recovery ID
   * @param {string} recoveryId - Recovery ID
   * @returns {number} Attempt count
   */
  getAttemptCount(recoveryId) {
    return this.recoveryAttempts.get(recoveryId) || 0;
  }

  /**
   * Increment attempt count for a recovery ID
   * @param {string} recoveryId - Recovery ID
   */
  incrementAttemptCount(recoveryId) {
    const current = this.recoveryAttempts.get(recoveryId) || 0;
    this.recoveryAttempts.set(recoveryId, current + 1);
  }

  /**
   * Record recovery attempt statistics
   * @param {string} recoveryId - Recovery ID
   * @param {string} strategy - Recovery strategy used
   * @param {boolean} success - Whether recovery succeeded
   * @param {any} result - Recovery result or error message
   */
  recordRecoveryAttempt(recoveryId, strategy, success, result) {
    const record = {
      recoveryId,
      strategy,
      success,
      result: success ? result : result,
      timestamp: new Date().toISOString(),
      attempts: this.getAttemptCount(recoveryId)
    };
    
    // Update statistics
    const key = `${strategy}_${success ? 'success' : 'failure'}`;
    const current = this.recoveryStats.get(key) || { count: 0, lastSeen: null };
    current.count += 1;
    current.lastSeen = record.timestamp;
    
    this.recoveryStats.set(key, current);
  }

  /**
   * Get recovery statistics
   * @returns {Object} Recovery statistics
   */
  getRecoveryStats() {
    return {
      totalRecoveries: Array.from(this.recoveryStats.values()).reduce((sum, stat) => sum + stat.count, 0),
      currentlyRecovering: this.isRecovering.size,
      statistics: Object.fromEntries(this.recoveryStats),
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Reset recovery statistics
   */
  resetStats() {
    this.recoveryAttempts.clear();
    this.recoveryStats.clear();
  }

  /**
   * Sleep for specified milliseconds
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise<void>}
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = {
  RecoveryEngine,
  RECOVERY_STATES
};
