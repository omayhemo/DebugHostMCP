/**
 * Error Handler Service
 * Comprehensive error handling framework with recovery mechanisms
 * Part of Story 2.4: Error Handling Framework
 */

const { MCP_ERROR_CODES, createMcpError } = require('../middleware/error-handler');

/**
 * Extended error types for system operations
 */
const ERROR_TYPES = {
  DOCKER: 'docker',
  NETWORK: 'network', 
  FILESYSTEM: 'filesystem',
  VALIDATION: 'validation',
  CONFIG: 'configuration',
  RESOURCE: 'resource',
  SYSTEM: 'system',
  REGISTRY: 'registry',
  PORT: 'port',
  WORKSPACE: 'workspace'
};

/**
 * Severity levels for error classification
 */
const SEVERITY_LEVELS = {
  CRITICAL: 'critical',    // System unusable
  ERROR: 'error',         // Feature broken
  WARNING: 'warning',     // Degraded performance
  INFO: 'info'           // Informational
};

/**
 * Recovery strategies for different error types
 */
const RECOVERY_STRATEGIES = {
  RETRY: {
    maxAttempts: 3,
    backoffMultiplier: 2,
    initialDelay: 1000,
    jitter: true
  },
  FALLBACK: {
    timeoutMs: 5000,
    alternativeActions: ['cache', 'default', 'manual']
  },
  RESTART: {
    component: 'container|service|connection',
    gracePeriod: 10000,
    maxRestarts: 3
  },
  DEGRADE: {
    disableFeatures: ['realtime', 'monitoring', 'analytics'],
    notifyUser: true,
    fallbackMode: 'safe'
  }
};

/**
 * Error patterns and their corresponding recovery strategies
 */
const ERROR_PATTERNS = {
  'ECONNREFUSED': {
    type: ERROR_TYPES.DOCKER,
    severity: SEVERITY_LEVELS.ERROR,
    strategy: 'RETRY',
    message: 'Connection refused - service may be starting or unavailable',
    suggestions: ['Wait for service to start', 'Check if Docker is running', 'Verify port configuration']
  },
  'ENOENT': {
    type: ERROR_TYPES.FILESYSTEM,
    severity: SEVERITY_LEVELS.ERROR,
    strategy: 'FALLBACK',
    message: 'File or directory not found',
    suggestions: ['Check file path', 'Verify permissions', 'Ensure file exists']
  },
  'EACCES': {
    type: ERROR_TYPES.FILESYSTEM,
    severity: SEVERITY_LEVELS.ERROR,
    strategy: 'FALLBACK',
    message: 'Permission denied',
    suggestions: ['Check file permissions', 'Run with appropriate privileges', 'Verify ownership']
  },
  'EADDRINUSE': {
    type: ERROR_TYPES.PORT,
    severity: SEVERITY_LEVELS.WARNING,
    strategy: 'RETRY',
    message: 'Port already in use',
    suggestions: ['Try different port', 'Stop conflicting service', 'Check port registry']
  },
  'DOCKER_NOT_FOUND': {
    type: ERROR_TYPES.DOCKER,
    severity: SEVERITY_LEVELS.CRITICAL,
    strategy: 'DEGRADE',
    message: 'Docker not installed or not accessible',
    suggestions: ['Install Docker', 'Start Docker service', 'Check Docker configuration']
  }
};

class ErrorHandler {
  constructor() {
    this.errorStats = new Map();
    this.recoveryAttempts = new Map();
  }

  /**
   * Handle and classify an error
   * @param {Error|string} error - Error object or error code
   * @param {Object} context - Additional context information
   * @returns {Object} Processed error with classification and suggestions
   */
  handleError(error, context = {}) {
    try {
      // Extract error information
      const errorInfo = this.extractErrorInfo(error);
      
      // Classify the error
      const classification = this.classifyError(errorInfo, context);
      
      // Generate error response
      const errorResponse = this.formatErrorResponse(errorInfo, classification, context);
      
      // Record error statistics
      this.recordErrorStats(errorResponse);
      
      return errorResponse;
      
    } catch (processingError) {
      // Fallback error handling if error processing itself fails
      return this.createFallbackError(error, processingError, context);
    }
  }

  /**
   * Extract error information from various error types
   * @param {*} error - Error to extract info from
   * @returns {Object} Standardized error information
   */
  extractErrorInfo(error) {
    if (typeof error === 'string') {
      return {
        message: error,
        code: 'UNKNOWN',
        stack: null,
        originalError: error
      };
    }
    
    if (error instanceof Error) {
      return {
        message: error.message,
        code: error.code || 'UNKNOWN',
        stack: error.stack,
        name: error.name,
        originalError: error
      };
    }
    
    if (typeof error === 'object' && error.code) {
      return {
        message: error.message || 'Unknown error',
        code: error.code,
        stack: error.stack || null,
        details: error.details || null,
        originalError: error
      };
    }
    
    return {
      message: 'Unknown error occurred',
      code: 'UNKNOWN',
      stack: null,
      originalError: error
    };
  }

  /**
   * Classify error based on patterns and context
   * @param {Object} errorInfo - Extracted error information
   * @param {Object} context - Error context
   * @returns {Object} Error classification
   */
  classifyError(errorInfo, context) {
    // Look for known error patterns
    const pattern = ERROR_PATTERNS[errorInfo.code] || ERROR_PATTERNS[errorInfo.name];
    
    if (pattern) {
      return {
        type: pattern.type,
        severity: pattern.severity,
        strategy: pattern.strategy,
        knownPattern: true,
        pattern
      };
    }
    
    // Classify based on error message content
    const messageClassification = this.classifyByMessage(errorInfo.message);
    if (messageClassification) {
      return { ...messageClassification, knownPattern: false };
    }
    
    // Classify based on context
    const contextClassification = this.classifyByContext(context);
    if (contextClassification) {
      return { ...contextClassification, knownPattern: false };
    }
    
    // Default classification
    return {
      type: ERROR_TYPES.SYSTEM,
      severity: SEVERITY_LEVELS.ERROR,
      strategy: 'FALLBACK',
      knownPattern: false
    };
  }

  /**
   * Classify error based on message content
   * @param {string} message - Error message
   * @returns {Object|null} Classification or null if no match
   */
  classifyByMessage(message) {
    if (!message) return null;
    
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('docker') || lowerMessage.includes('container')) {
      return {
        type: ERROR_TYPES.DOCKER,
        severity: SEVERITY_LEVELS.ERROR,
        strategy: 'RETRY'
      };
    }
    
    if (lowerMessage.includes('permission') || lowerMessage.includes('access')) {
      return {
        type: ERROR_TYPES.FILESYSTEM,
        severity: SEVERITY_LEVELS.ERROR,
        strategy: 'FALLBACK'
      };
    }
    
    if (lowerMessage.includes('port') || lowerMessage.includes('address in use')) {
      return {
        type: ERROR_TYPES.PORT,
        severity: SEVERITY_LEVELS.WARNING,
        strategy: 'RETRY'
      };
    }
    
    if (lowerMessage.includes('network') || lowerMessage.includes('connection')) {
      return {
        type: ERROR_TYPES.NETWORK,
        severity: SEVERITY_LEVELS.WARNING,
        strategy: 'RETRY'
      };
    }
    
    return null;
  }

  /**
   * Classify error based on context information
   * @param {Object} context - Error context
   * @returns {Object|null} Classification or null if no match
   */
  classifyByContext(context) {
    if (context.operation) {
      const operation = context.operation.toLowerCase();
      
      if (operation.includes('docker') || operation.includes('container')) {
        return {
          type: ERROR_TYPES.DOCKER,
          severity: SEVERITY_LEVELS.ERROR,
          strategy: 'RETRY'
        };
      }
      
      if (operation.includes('workspace') || operation.includes('scan')) {
        return {
          type: ERROR_TYPES.WORKSPACE,
          severity: SEVERITY_LEVELS.ERROR,
          strategy: 'FALLBACK'
        };
      }
      
      if (operation.includes('registry') || operation.includes('register')) {
        return {
          type: ERROR_TYPES.REGISTRY,
          severity: SEVERITY_LEVELS.ERROR,
          strategy: 'RETRY'
        };
      }
    }
    
    return null;
  }

  /**
   * Format error response according to system standards
   * @param {Object} errorInfo - Extracted error info
   * @param {Object} classification - Error classification
   * @param {Object} context - Error context
   * @returns {Object} Formatted error response
   */
  formatErrorResponse(errorInfo, classification, context) {
    const errorId = this.generateErrorId();
    
    // Get suggestions based on pattern or generate generic ones
    let suggestions = [];
    if (classification.pattern && classification.pattern.suggestions) {
      suggestions = classification.pattern.suggestions;
    } else {
      suggestions = this.generateSuggestions(classification, context);
    }
    
    return {
      success: false,
      error: {
        id: errorId,
        code: this.generateErrorCode(classification.type, errorInfo.code),
        type: classification.type,
        severity: classification.severity,
        message: classification.pattern ? classification.pattern.message : errorInfo.message,
        details: this.generateErrorDetails(errorInfo, classification, context),
        suggestions,
        timestamp: new Date().toISOString(),
        requestId: context.requestId || null,
        context: {
          projectId: context.projectId || null,
          operation: context.operation || null,
          workspace: context.workspace || null,
          component: context.component || null
        },
        recovery: {
          strategy: classification.strategy,
          attempted: false,
          canRetry: this.canRetry(errorId, classification.strategy)
        }
      }
    };
  }

  /**
   * Generate unique error ID
   * @returns {string} Unique error identifier
   */
  generateErrorId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 6);
    return `err_${timestamp}_${random}`;
  }

  /**
   * Generate standardized error code
   * @param {string} type - Error type
   * @param {string} originalCode - Original error code
   * @returns {string} Standardized error code
   */
  generateErrorCode(type, originalCode) {
    const typePrefix = type.toUpperCase();
    const codePostfix = originalCode && originalCode !== 'UNKNOWN' ? originalCode.toUpperCase() : 'ERROR';
    return `${typePrefix}_${codePostfix}`;
  }

  /**
   * Generate error details for debugging
   * @param {Object} errorInfo - Error information
   * @param {Object} classification - Error classification
   * @param {Object} context - Error context
   * @returns {string} Error details
   */
  generateErrorDetails(errorInfo, classification, context) {
    const details = [];
    
    if (classification.knownPattern) {
      details.push('This is a known error pattern with specific recovery procedures.');
    }
    
    if (errorInfo.stack && context.includeStack !== false) {
      details.push(`Stack trace available for debugging.`);
    }
    
    if (context.systemInfo) {
      details.push('System information available for diagnosis.');
    }
    
    return details.join(' ');
  }

  /**
   * Generate suggestions based on error classification
   * @param {Object} classification - Error classification
   * @param {Object} context - Error context
   * @returns {Array} Array of suggestions
   */
  generateSuggestions(classification, context) {
    const suggestions = [];
    
    switch (classification.type) {
      case ERROR_TYPES.DOCKER:
        suggestions.push('Check if Docker is running');
        suggestions.push('Verify Docker configuration');
        suggestions.push('Try restarting Docker service');
        break;
        
      case ERROR_TYPES.FILESYSTEM:
        suggestions.push('Check file and directory permissions');
        suggestions.push('Verify the path exists');
        suggestions.push('Ensure sufficient disk space');
        break;
        
      case ERROR_TYPES.PORT:
        suggestions.push('Try a different port');
        suggestions.push('Check for port conflicts');
        suggestions.push('Verify port range allocation');
        break;
        
      case ERROR_TYPES.NETWORK:
        suggestions.push('Check network connectivity');
        suggestions.push('Verify firewall settings');
        suggestions.push('Try again in a few moments');
        break;
        
      default:
        suggestions.push('Review error details for specific guidance');
        suggestions.push('Check system logs for additional information');
        suggestions.push('Contact support if the issue persists');
    }
    
    return suggestions;
  }

  /**
   * Check if error can be retried
   * @param {string} errorId - Error identifier
   * @param {string} strategy - Recovery strategy
   * @returns {boolean} Whether retry is possible
   */
  canRetry(errorId, strategy) {
    if (strategy !== 'RETRY') return false;
    
    const attempts = this.recoveryAttempts.get(errorId) || 0;
    return attempts < RECOVERY_STRATEGIES.RETRY.maxAttempts;
  }

  /**
   * Record error statistics for monitoring
   * @param {Object} errorResponse - Formatted error response
   */
  recordErrorStats(errorResponse) {
    const { type, severity } = errorResponse.error;
    const key = `${type}_${severity}`;
    
    const current = this.errorStats.get(key) || { count: 0, lastSeen: null };
    current.count += 1;
    current.lastSeen = new Date().toISOString();
    
    this.errorStats.set(key, current);
  }

  /**
   * Create fallback error when error processing fails
   * @param {*} originalError - The original error
   * @param {Error} processingError - Error that occurred during processing
   * @param {Object} context - Error context
   * @returns {Object} Fallback error response
   */
  createFallbackError(originalError, processingError, context) {
    return {
      success: false,
      error: {
        id: `fallback_${Date.now()}`,
        code: 'SYSTEM_ERROR_PROCESSING_FAILED',
        type: ERROR_TYPES.SYSTEM,
        severity: SEVERITY_LEVELS.CRITICAL,
        message: 'An error occurred while processing another error',
        details: `Original error: ${originalError}. Processing error: ${processingError.message}`,
        suggestions: [
          'This indicates a system-level issue',
          'Check system logs for detailed information',
          'Contact system administrator'
        ],
        timestamp: new Date().toISOString(),
        context: context || {},
        recovery: {
          strategy: 'DEGRADE',
          attempted: false,
          canRetry: false
        }
      }
    };
  }

  /**
   * Get error statistics for monitoring
   * @returns {Object} Current error statistics
   */
  getErrorStats() {
    return {
      totalTypes: this.errorStats.size,
      statistics: Object.fromEntries(this.errorStats),
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Reset error statistics
   */
  resetErrorStats() {
    this.errorStats.clear();
    this.recoveryAttempts.clear();
  }
}

module.exports = {
  ErrorHandler,
  ERROR_TYPES,
  SEVERITY_LEVELS,
  RECOVERY_STRATEGIES,
  ERROR_PATTERNS
};
