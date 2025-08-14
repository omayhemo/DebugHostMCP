/**
 * Enhanced Error Handler for MCP Debug Host
 * Provides production-ready error handling with user-friendly messages
 */

class ErrorHandler {
  constructor(logger) {
    this.logger = logger;
    this.errorCodes = {
      // Server errors
      SERVER_START_FAILED: 'Failed to start server',
      SERVER_STOP_FAILED: 'Failed to stop server',
      PORT_IN_USE: 'Port is already in use',
      INVALID_PORT: 'Invalid port number specified',
      
      // Process errors
      PROCESS_START_FAILED: 'Failed to start process',
      PROCESS_STOP_FAILED: 'Failed to stop process',
      PROCESS_NOT_FOUND: 'Process not found',
      COMMAND_NOT_FOUND: 'Command not found',
      
      // Configuration errors
      CONFIG_INVALID: 'Invalid configuration',
      CONFIG_MISSING: 'Configuration file missing',
      CONFIG_PARSE_ERROR: 'Failed to parse configuration',
      
      // File system errors
      FILE_NOT_FOUND: 'File not found',
      PERMISSION_DENIED: 'Permission denied',
      DISK_SPACE_LOW: 'Insufficient disk space',
      
      // Network errors
      CONNECTION_FAILED: 'Connection failed',
      TIMEOUT: 'Operation timed out',
      NETWORK_UNREACHABLE: 'Network unreachable',
      
      // Authentication errors
      AUTH_FAILED: 'Authentication failed',
      TOKEN_EXPIRED: 'Token expired',
      INSUFFICIENT_PERMISSIONS: 'Insufficient permissions',
      
      // Validation errors
      INVALID_INPUT: 'Invalid input provided',
      VALIDATION_FAILED: 'Validation failed',
      SCHEMA_MISMATCH: 'Data does not match expected schema'
    };
    
    this.userGuidance = {
      SERVER_START_FAILED: [
        'Check if another service is using the same port',
        'Verify your configuration settings',
        'Try restarting with a different port: --port 3001'
      ],
      PORT_IN_USE: [
        'Choose a different port number',
        'Stop the service using the current port',
        'Use: lsof -i :PORT to find what\'s using the port'
      ],
      PROCESS_START_FAILED: [
        'Verify the command exists and is executable',
        'Check file permissions',
        'Ensure all dependencies are installed'
      ],
      CONFIG_INVALID: [
        'Check your config.json syntax',
        'Refer to config.json.template for examples',
        'Validate JSON format online or with a JSON validator'
      ],
      FILE_NOT_FOUND: [
        'Verify the file path is correct',
        'Check if the file was moved or deleted',
        'Ensure you have the correct working directory'
      ],
      PERMISSION_DENIED: [
        'Check file/directory permissions',
        'Try running with appropriate user privileges',
        'Use chmod to adjust permissions if needed'
      ],
      CONNECTION_FAILED: [
        'Check your network connection',
        'Verify firewall settings',
        'Ensure the target service is running'
      ],
      AUTH_FAILED: [
        'Check your credentials',
        'Verify tokens haven\'t expired',
        'Ensure you have the necessary permissions'
      ]
    };
  }

  /**
   * Create a standardized error object
   */
  createError(code, message, details = {}, originalError = null) {
    const error = new Error(message);
    error.code = code;
    error.details = details;
    error.timestamp = new Date().toISOString();
    error.originalError = originalError;
    error.userGuidance = this.getUserGuidance(code);
    
    return error;
  }

  /**
   * Get user-friendly guidance for an error code
   */
  getUserGuidance(code) {
    return this.userGuidance[code] || [
      'Check the logs for more details',
      'Try restarting the service',
      'Contact support if the problem persists'
    ];
  }

  /**
   * Handle and log errors with appropriate detail level
   */
  handleError(error, context = {}) {
    const errorInfo = {
      message: error.message,
      code: error.code || 'UNKNOWN_ERROR',
      details: error.details || {},
      context,
      timestamp: error.timestamp || new Date().toISOString(),
      stack: error.stack
    };

    // Log based on severity
    if (this.isCriticalError(error)) {
      this.logger.error('Critical error occurred', errorInfo);
    } else if (this.isWarningError(error)) {
      this.logger.warn('Warning condition detected', errorInfo);
    } else {
      this.logger.info('Error handled', errorInfo);
    }

    return {
      success: false,
      error: {
        message: error.message,
        code: error.code || 'UNKNOWN_ERROR',
        guidance: error.userGuidance || this.getUserGuidance(error.code),
        timestamp: errorInfo.timestamp
      }
    };
  }

  /**
   * Determine if error is critical
   */
  isCriticalError(error) {
    const criticalCodes = [
      'SERVER_START_FAILED',
      'CONFIG_PARSE_ERROR',
      'PERMISSION_DENIED',
      'DISK_SPACE_LOW'
    ];
    
    return criticalCodes.includes(error.code) || 
           error.message?.toLowerCase().includes('critical') ||
           error.message?.toLowerCase().includes('fatal');
  }

  /**
   * Determine if error is a warning
   */
  isWarningError(error) {
    const warningCodes = [
      'TIMEOUT',
      'CONNECTION_FAILED',
      'FILE_NOT_FOUND'
    ];
    
    return warningCodes.includes(error.code) ||
           error.message?.toLowerCase().includes('warning') ||
           error.message?.toLowerCase().includes('deprecated');
  }

  /**
   * Format error for API response
   */
  formatForAPI(error) {
    return {
      success: false,
      error: {
        code: error.code || 'UNKNOWN_ERROR',
        message: error.message,
        guidance: error.userGuidance || this.getUserGuidance(error.code),
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Format error for CLI output
   */
  formatForCLI(error) {
    const lines = [
      `❌ Error: ${error.message}`,
      `📋 Code: ${error.code || 'UNKNOWN_ERROR'}`,
      ''
    ];

    const guidance = error.userGuidance || this.getUserGuidance(error.code);
    if (guidance.length > 0) {
      lines.push('💡 Suggestions:');
      guidance.forEach((suggestion, index) => {
        lines.push(`   ${index + 1}. ${suggestion}`);
      });
      lines.push('');
    }

    lines.push(`🕐 Time: ${error.timestamp || new Date().toISOString()}`);
    
    return lines.join('\n');
  }

  /**
   * Wrap async function with error handling
   */
  wrapAsync(fn, context = {}) {
    return async (...args) => {
      try {
        return await fn(...args);
      } catch (error) {
        return this.handleError(error, { ...context, function: fn.name });
      }
    };
  }

  /**
   * Create middleware for Express error handling
   */
  createExpressMiddleware() {
    return (error, req, res, next) => {
      const handled = this.handleError(error, {
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      // Determine status code
      let statusCode = 500;
      if (error.code === 'VALIDATION_FAILED' || error.code === 'INVALID_INPUT') {
        statusCode = 400;
      } else if (error.code === 'AUTH_FAILED' || error.code === 'TOKEN_EXPIRED') {
        statusCode = 401;
      } else if (error.code === 'INSUFFICIENT_PERMISSIONS') {
        statusCode = 403;
      } else if (error.code === 'FILE_NOT_FOUND' || error.code === 'PROCESS_NOT_FOUND') {
        statusCode = 404;
      }

      res.status(statusCode).json(this.formatForAPI(error));
    };
  }

  /**
   * Create process error handlers
   */
  setupProcessHandlers() {
    process.on('uncaughtException', (error) => {
      this.logger.error('Uncaught Exception - shutting down', {
        error: error.message,
        stack: error.stack
      });
      
      // Attempt graceful shutdown
      setTimeout(() => {
        process.exit(1);
      }, 1000);
    });

    process.on('unhandledRejection', (reason, promise) => {
      this.logger.error('Unhandled Promise Rejection', {
        reason: reason?.message || reason,
        stack: reason?.stack
      });
    });

    process.on('SIGTERM', () => {
      this.logger.info('SIGTERM received - shutting down gracefully');
      // Graceful shutdown logic would go here
    });

    process.on('SIGINT', () => {
      this.logger.info('SIGINT received - shutting down gracefully');
      // Graceful shutdown logic would go here
    });
  }
}

module.exports = ErrorHandler;