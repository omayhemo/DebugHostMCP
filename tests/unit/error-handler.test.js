/**
 * Unit Tests: Error Handler Service
 * Story 2.4: Error Handling Framework
 */

const { 
  ErrorHandler, 
  ERROR_TYPES, 
  SEVERITY_LEVELS, 
  RECOVERY_STRATEGIES, 
  ERROR_PATTERNS 
} = require('../../src/services/error-handler');

describe('ErrorHandler', () => {
  let errorHandler;
  
  beforeEach(() => {
    errorHandler = new ErrorHandler();
  });

  describe('extractErrorInfo', () => {
    it('should extract info from string error', () => {
      const result = errorHandler.extractErrorInfo('Test error message');
      
      expect(result).toEqual({
        message: 'Test error message',
        code: 'UNKNOWN',
        stack: null,
        originalError: 'Test error message'
      });
    });
    
    it('should extract info from Error object', () => {
      const error = new Error('Test error');
      error.code = 'TEST_CODE';
      
      const result = errorHandler.extractErrorInfo(error);
      
      expect(result).toEqual({
        message: 'Test error',
        code: 'TEST_CODE',
        stack: expect.any(String),
        name: 'Error',
        originalError: error
      });
    });
    
    it('should extract info from error-like object', () => {
      const errorObj = {
        code: 'CUSTOM_ERROR',
        message: 'Custom error message',
        details: { extra: 'info' }
      };
      
      const result = errorHandler.extractErrorInfo(errorObj);
      
      expect(result).toEqual({
        message: 'Custom error message',
        code: 'CUSTOM_ERROR',
        stack: null,
        details: { extra: 'info' },
        originalError: errorObj
      });
    });
    
    it('should handle unknown error types', () => {
      const result = errorHandler.extractErrorInfo({ unknown: 'data' });
      
      expect(result).toEqual({
        message: 'Unknown error occurred',
        code: 'UNKNOWN',
        stack: null,
        originalError: { unknown: 'data' }
      });
    });
  });

  describe('classifyError', () => {
    it('should classify known error patterns', () => {
      const errorInfo = {
        code: 'ECONNREFUSED',
        message: 'Connection refused'
      };
      
      const result = errorHandler.classifyError(errorInfo, {});
      
      expect(result).toEqual({
        type: ERROR_TYPES.DOCKER,
        severity: SEVERITY_LEVELS.ERROR,
        strategy: 'RETRY',
        knownPattern: true,
        pattern: ERROR_PATTERNS.ECONNREFUSED
      });
    });
    
    it('should classify by message content', () => {
      const errorInfo = {
        code: 'UNKNOWN',
        message: 'Docker daemon not available'
      };
      
      const result = errorHandler.classifyError(errorInfo, {});
      
      expect(result).toMatchObject({
        type: ERROR_TYPES.DOCKER,
        severity: SEVERITY_LEVELS.ERROR,
        strategy: 'RETRY'
      });
      expect(result.knownPattern).toBe(false);
    });
    
    it('should classify by context', () => {
      const errorInfo = {
        code: 'UNKNOWN',
        message: 'Generic error'
      };
      
      const context = {
        operation: 'docker-container-start'
      };
      
      const result = errorHandler.classifyError(errorInfo, context);
      
      expect(result).toMatchObject({
        type: ERROR_TYPES.DOCKER,
        severity: SEVERITY_LEVELS.ERROR,
        strategy: 'RETRY'
      });
      expect(result.knownPattern).toBe(false);
    });
    
    it('should use default classification for unrecognized errors', () => {
      const errorInfo = {
        code: 'UNKNOWN',
        message: 'Completely unknown error'
      };
      
      const result = errorHandler.classifyError(errorInfo, {});
      
      expect(result).toEqual({
        type: ERROR_TYPES.SYSTEM,
        severity: SEVERITY_LEVELS.ERROR,
        strategy: 'FALLBACK',
        knownPattern: false
      });
    });
  });

  describe('classifyByMessage', () => {
    it('should classify Docker errors', () => {
      const result = errorHandler.classifyByMessage('Docker container failed to start');
      
      expect(result).toEqual({
        type: ERROR_TYPES.DOCKER,
        severity: SEVERITY_LEVELS.ERROR,
        strategy: 'RETRY'
      });
    });
    
    it('should classify permission errors', () => {
      const result = errorHandler.classifyByMessage('Permission denied accessing file');
      
      expect(result).toEqual({
        type: ERROR_TYPES.FILESYSTEM,
        severity: SEVERITY_LEVELS.ERROR,
        strategy: 'FALLBACK'
      });
    });
    
    it('should classify port errors', () => {
      const result = errorHandler.classifyByMessage('Port 3000 is already in use');
      
      expect(result).toEqual({
        type: ERROR_TYPES.PORT,
        severity: SEVERITY_LEVELS.WARNING,
        strategy: 'RETRY'
      });
    });
    
    it('should classify network errors', () => {
      const result = errorHandler.classifyByMessage('Network connection timeout');
      
      expect(result).toEqual({
        type: ERROR_TYPES.NETWORK,
        severity: SEVERITY_LEVELS.WARNING,
        strategy: 'RETRY'
      });
    });
    
    it('should return null for unrecognized messages', () => {
      const result = errorHandler.classifyByMessage('Completely unrelated error');
      
      expect(result).toBeNull();
    });
    
    it('should return null for empty message', () => {
      const result = errorHandler.classifyByMessage('');
      
      expect(result).toBeNull();
    });
  });

  describe('classifyByContext', () => {
    it('should classify Docker operations', () => {
      const context = { operation: 'docker-start' };
      
      const result = errorHandler.classifyByContext(context);
      
      expect(result).toEqual({
        type: ERROR_TYPES.DOCKER,
        severity: SEVERITY_LEVELS.ERROR,
        strategy: 'RETRY'
      });
    });
    
    it('should classify workspace operations', () => {
      const context = { operation: 'workspace-scan' };
      
      const result = errorHandler.classifyByContext(context);
      
      expect(result).toEqual({
        type: ERROR_TYPES.WORKSPACE,
        severity: SEVERITY_LEVELS.ERROR,
        strategy: 'FALLBACK'
      });
    });
    
    it('should classify registry operations', () => {
      const context = { operation: 'project-register' };
      
      const result = errorHandler.classifyByContext(context);
      
      expect(result).toEqual({
        type: ERROR_TYPES.REGISTRY,
        severity: SEVERITY_LEVELS.ERROR,
        strategy: 'RETRY'
      });
    });
    
    it('should return null for unrecognized operations', () => {
      const context = { operation: 'unknown-operation' };
      
      const result = errorHandler.classifyByContext(context);
      
      expect(result).toBeNull();
    });
    
    it('should return null for missing operation', () => {
      const context = {};
      
      const result = errorHandler.classifyByContext(context);
      
      expect(result).toBeNull();
    });
  });

  describe('formatErrorResponse', () => {
    it('should format complete error response', () => {
      const errorInfo = {
        message: 'Test error',
        code: 'TEST_ERROR',
        stack: 'Error stack trace'
      };
      
      const classification = {
        type: ERROR_TYPES.DOCKER,
        severity: SEVERITY_LEVELS.ERROR,
        strategy: 'RETRY',
        pattern: {
          message: 'Docker error occurred',
          suggestions: ['Check Docker', 'Restart service']
        }
      };
      
      const context = {
        operation: 'container-start',
        projectId: 'proj_123',
        requestId: 'req_456'
      };
      
      const result = errorHandler.formatErrorResponse(errorInfo, classification, context);
      
      expect(result.success).toBe(false);
      expect(result.error).toMatchObject({
        id: expect.stringMatching(/^err_\d+_[a-z0-9]+$/),
        code: 'DOCKER_TEST_ERROR',
        type: ERROR_TYPES.DOCKER,
        severity: SEVERITY_LEVELS.ERROR,
        message: 'Docker error occurred',
        suggestions: ['Check Docker', 'Restart service'],
        timestamp: expect.any(String),
        requestId: 'req_456',
        context: {
          projectId: 'proj_123',
          operation: 'container-start',
          workspace: null,
          component: null
        },
        recovery: {
          strategy: 'RETRY',
          attempted: false,
          canRetry: true
        }
      });
    });
    
    it('should generate suggestions for unpatternized errors', () => {
      const errorInfo = {
        message: 'Unknown error',
        code: 'UNKNOWN'
      };
      
      const classification = {
        type: ERROR_TYPES.FILESYSTEM,
        severity: SEVERITY_LEVELS.ERROR,
        strategy: 'FALLBACK',
        knownPattern: false
      };
      
      const result = errorHandler.formatErrorResponse(errorInfo, classification, {});
      
      expect(result.error.suggestions).toContain('Check file and directory permissions');
      expect(result.error.suggestions).toContain('Verify the path exists');
    });
  });

  describe('generateErrorCode', () => {
    it('should generate standardized error codes', () => {
      const result = errorHandler.generateErrorCode(ERROR_TYPES.DOCKER, 'CONNECTION_FAILED');
      
      expect(result).toBe('DOCKER_CONNECTION_FAILED');
    });
    
    it('should handle unknown original codes', () => {
      const result = errorHandler.generateErrorCode(ERROR_TYPES.SYSTEM, 'UNKNOWN');
      
      expect(result).toBe('SYSTEM_ERROR');
    });
    
    it('should handle missing original codes', () => {
      const result = errorHandler.generateErrorCode(ERROR_TYPES.NETWORK, null);
      
      expect(result).toBe('NETWORK_ERROR');
    });
  });

  describe('generateSuggestions', () => {
    it('should generate Docker-specific suggestions', () => {
      const classification = { type: ERROR_TYPES.DOCKER };
      
      const result = errorHandler.generateSuggestions(classification, {});
      
      expect(result).toContain('Check if Docker is running');
      expect(result).toContain('Verify Docker configuration');
    });
    
    it('should generate filesystem-specific suggestions', () => {
      const classification = { type: ERROR_TYPES.FILESYSTEM };
      
      const result = errorHandler.generateSuggestions(classification, {});
      
      expect(result).toContain('Check file and directory permissions');
      expect(result).toContain('Verify the path exists');
    });
    
    it('should generate port-specific suggestions', () => {
      const classification = { type: ERROR_TYPES.PORT };
      
      const result = errorHandler.generateSuggestions(classification, {});
      
      expect(result).toContain('Try a different port');
      expect(result).toContain('Check for port conflicts');
    });
    
    it('should generate default suggestions for unknown types', () => {
      const classification = { type: 'unknown' };
      
      const result = errorHandler.generateSuggestions(classification, {});
      
      expect(result).toContain('Review error details for specific guidance');
      expect(result).toContain('Contact support if the issue persists');
    });
  });

  describe('canRetry', () => {
    it('should allow retry for RETRY strategy within limits', () => {
      const errorId = 'test_error';
      
      // First attempt
      const result1 = errorHandler.canRetry(errorId, 'RETRY');
      expect(result1).toBe(true);
    });
    
    it('should not allow retry for non-RETRY strategies', () => {
      const errorId = 'test_error';
      
      const result = errorHandler.canRetry(errorId, 'FALLBACK');
      expect(result).toBe(false);
    });
  });

  describe('recordErrorStats', () => {
    it('should record error statistics', () => {
      const errorResponse = {
        error: {
          type: ERROR_TYPES.DOCKER,
          severity: SEVERITY_LEVELS.ERROR
        }
      };
      
      errorHandler.recordErrorStats(errorResponse);
      
      const stats = errorHandler.getErrorStats();
      expect(stats.totalTypes).toBe(1);
      expect(stats.statistics['docker_error']).toEqual({
        count: 1,
        lastSeen: expect.any(String)
      });
    });
    
    it('should accumulate error counts', () => {
      const errorResponse = {
        error: {
          type: ERROR_TYPES.DOCKER,
          severity: SEVERITY_LEVELS.ERROR
        }
      };
      
      // Record same error multiple times
      errorHandler.recordErrorStats(errorResponse);
      errorHandler.recordErrorStats(errorResponse);
      errorHandler.recordErrorStats(errorResponse);
      
      const stats = errorHandler.getErrorStats();
      expect(stats.statistics['docker_error'].count).toBe(3);
    });
  });

  describe('handleError - Full Integration', () => {
    it('should handle Error object completely', () => {
      const error = new Error('Docker connection failed');
      error.code = 'ECONNREFUSED';
      
      const context = {
        operation: 'container-start',
        projectId: 'proj_123'
      };
      
      const result = errorHandler.handleError(error, context);
      
      expect(result.success).toBe(false);
      expect(result.error.type).toBe(ERROR_TYPES.DOCKER);
      expect(result.error.severity).toBe(SEVERITY_LEVELS.ERROR);
      expect(result.error.message).toBe('Connection refused - service may be starting or unavailable');
      expect(result.error.suggestions).toContain('Wait for service to start');
      expect(result.error.recovery.strategy).toBe('RETRY');
    });
    
    it('should handle string errors', () => {
      const result = errorHandler.handleError('Simple error message');
      
      expect(result.success).toBe(false);
      expect(result.error.message).toBe('Simple error message');
      expect(result.error.type).toBe(ERROR_TYPES.SYSTEM);
    });
    
    it('should handle error processing failures', () => {
      // Create an error that will cause processing to fail
      const circularObj = {};
      circularObj.self = circularObj;
      
      const result = errorHandler.handleError(circularObj, {});
      
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('SYSTEM_ERROR');
      expect(result.error.type).toBe(ERROR_TYPES.SYSTEM);
    });
  });

  describe('createFallbackError', () => {
    it('should create fallback error response', () => {
      const originalError = 'Original error';
      const processingError = new Error('Processing failed');
      const context = { operation: 'test' };
      
      const result = errorHandler.createFallbackError(originalError, processingError, context);
      
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('SYSTEM_ERROR_PROCESSING_FAILED');
      expect(result.error.type).toBe(ERROR_TYPES.SYSTEM);
      expect(result.error.severity).toBe(SEVERITY_LEVELS.CRITICAL);
      expect(result.error.recovery.canRetry).toBe(false);
    });
  });

  describe('getErrorStats', () => {
    it('should return error statistics', () => {
      // Generate some errors to create statistics
      errorHandler.handleError('Docker error', { operation: 'docker' });
      errorHandler.handleError('Network error', { operation: 'network' });
      
      const stats = errorHandler.getErrorStats();
      
      expect(stats).toMatchObject({
        totalTypes: expect.any(Number),
        statistics: expect.any(Object),
        generatedAt: expect.any(String)
      });
    });
  });

  describe('resetErrorStats', () => {
    it('should reset all statistics', () => {
      // Generate some errors
      errorHandler.handleError('Test error');
      
      let stats = errorHandler.getErrorStats();
      expect(stats.totalTypes).toBeGreaterThan(0);
      
      // Reset
      errorHandler.resetErrorStats();
      
      stats = errorHandler.getErrorStats();
      expect(stats.totalTypes).toBe(0);
    });
  });

  describe('generateErrorId', () => {
    it('should generate unique error IDs', () => {
      const id1 = errorHandler.generateErrorId();
      const id2 = errorHandler.generateErrorId();
      
      expect(id1).toMatch(/^err_\d+_[a-z0-9]+$/);
      expect(id2).toMatch(/^err_\d+_[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });
  });

  describe('Constants and Configuration', () => {
    it('should have valid error types', () => {
      expect(ERROR_TYPES).toBeDefined();
      expect(ERROR_TYPES.DOCKER).toBe('docker');
      expect(ERROR_TYPES.NETWORK).toBe('network');
      expect(ERROR_TYPES.FILESYSTEM).toBe('filesystem');
    });
    
    it('should have valid severity levels', () => {
      expect(SEVERITY_LEVELS).toBeDefined();
      expect(SEVERITY_LEVELS.CRITICAL).toBe('critical');
      expect(SEVERITY_LEVELS.ERROR).toBe('error');
      expect(SEVERITY_LEVELS.WARNING).toBe('warning');
    });
    
    it('should have valid recovery strategies', () => {
      expect(RECOVERY_STRATEGIES).toBeDefined();
      expect(RECOVERY_STRATEGIES.RETRY).toMatchObject({
        maxAttempts: expect.any(Number),
        backoffMultiplier: expect.any(Number)
      });
    });
    
    it('should have valid error patterns', () => {
      expect(ERROR_PATTERNS).toBeDefined();
      expect(ERROR_PATTERNS.ECONNREFUSED).toMatchObject({
        type: ERROR_TYPES.DOCKER,
        severity: SEVERITY_LEVELS.ERROR,
        strategy: 'RETRY'
      });
    });
  });
});
