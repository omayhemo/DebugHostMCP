/**
 * MCP Error Handler Middleware
 * Handles errors and formats them according to MCP protocol specification
 */

const MCP_ERROR_CODES = {
  INVALID_PARAMS: 'INVALID_PARAMS',
  METHOD_NOT_FOUND: 'METHOD_NOT_FOUND',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  TOOL_NOT_FOUND: 'TOOL_NOT_FOUND',
  TIMEOUT: 'TIMEOUT'
};

/**
 * Format error response according to MCP protocol
 */
function formatMcpError(code, message, details = null) {
  return {
    result: null,
    error: {
      code,
      message,
      ...(details && { details })
    }
  };
}

/**
 * Express error handling middleware
 */
function errorHandler(err, req, res, next) {
  console.error('MCP Server Error:', err);

  // Default error response
  let statusCode = 500;
  let mcpError = formatMcpError(
    MCP_ERROR_CODES.INTERNAL_ERROR,
    'Internal server error'
  );

  // Handle different types of errors
  if (err.type === 'entity.parse.failed') {
    // JSON parsing error
    statusCode = 400;
    mcpError = formatMcpError(
      MCP_ERROR_CODES.INVALID_PARAMS,
      'Invalid JSON in request body'
    );
  } else if (err.name === 'ValidationError') {
    // Request validation error
    statusCode = 400;
    mcpError = formatMcpError(
      MCP_ERROR_CODES.INVALID_PARAMS,
      err.message || 'Invalid request parameters'
    );
  } else if (err.code === 'TOOL_NOT_FOUND') {
    // Tool not found error - return 400 for MCP protocol compliance
    statusCode = 400;
    mcpError = formatMcpError(
      MCP_ERROR_CODES.TOOL_NOT_FOUND,
      err.message || 'Tool not found'
    );
  } else if (err.code === 'TIMEOUT') {
    // Timeout error
    statusCode = 408;
    mcpError = formatMcpError(
      MCP_ERROR_CODES.TIMEOUT,
      err.message || 'Request timeout'
    );
  }

  // Send MCP-compliant error response
  res.status(statusCode).json(mcpError);
}

/**
 * 404 handler for unknown routes
 */
function notFoundHandler(req, res) {
  const mcpError = formatMcpError(
    MCP_ERROR_CODES.METHOD_NOT_FOUND,
    `Method not found: ${req.method} ${req.path}`
  );
  
  res.status(404).json(mcpError);
}

/**
 * Create a custom error with MCP code
 */
function createMcpError(code, message, details = null) {
  const error = new Error(message);
  error.code = code;
  if (details) {
    error.details = details;
  }
  return error;
}

module.exports = {
  errorHandler,
  notFoundHandler,
  formatMcpError,
  createMcpError,
  MCP_ERROR_CODES
};