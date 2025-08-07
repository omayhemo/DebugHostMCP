# Story 1.2: Implement MCP HTTP Server Foundation

**Status**: Draft  
**Priority**: High  
**Story Points**: 5  
**Sprint**: 1  

## User Story

**As a** Claude Code agent  
**I want** an MCP (Model Context Protocol) server accessible via HTTP/SSE  
**So that** I can manage debug host services from any project  

## Acceptance Criteria

1. **Given** the MCP server **When** started **Then** it should listen on port 2601
2. **Given** an MCP initialization request **When** received **Then** the server should respond with available tools list
3. **Given** a tool call request **When** received **Then** the server should route to the appropriate handler
4. **Given** a log streaming request **When** received via SSE **Then** the server should establish a persistent connection
5. **Given** the server **When** running **Then** it should only bind to localhost (127.0.0.1) for security
6. **Given** an invalid request **When** received **Then** the server should return proper MCP error format
7. **Given** the server **When** started **Then** it should log startup confirmation with port number

## Technical Requirements

### Dependencies
- Node.js 20+
- Express framework
- express-sse or similar for Server-Sent Events
- Story 1.1 completion (for testing with containers)

### Technical Notes
- Implement according to MCP HTTP transport specification
- Use Express middleware for request parsing and routing
- Implement proper CORS headers for local development
- Structure code for easy addition of tool handlers

### File Structure
```
src/
├── mcp/
│   ├── server.js         # Main MCP HTTP server
│   ├── routes.js         # Route definitions
│   ├── handlers/         # Tool handlers
│   │   └── index.js      # Handler registry
│   └── sse/
│       └── streams.js    # SSE stream management
└── index.js              # Main entry point
```

### API Endpoints
```
POST /mcp/initialize      # MCP initialization
POST /mcp/tools/list      # List available tools
POST /mcp/tools/call      # Execute tool
GET  /mcp/logs/:id/stream # SSE log streaming
```

## Definition of Done

- [ ] MCP server starts and listens on port 2601
- [ ] All required endpoints implemented
- [ ] SSE streaming functional
- [ ] Error handling implemented
- [ ] Request/response logging configured
- [ ] Server gracefully shuts down on SIGTERM
- [ ] Basic health check endpoint working
- [ ] Unit tests for core functionality

## Tasks

1. **Set up Express server**
   - Initialize Express application
   - Configure middleware (body-parser, cors)
   - Set up port binding to localhost:2601
   - Add graceful shutdown handling

2. **Implement MCP protocol endpoints**
   - Create /mcp/initialize handler
   - Create /mcp/tools/list handler
   - Create /mcp/tools/call handler
   - Implement proper MCP response format

3. **Set up SSE streaming**
   - Configure SSE middleware
   - Create /mcp/logs/:id/stream endpoint
   - Implement stream multiplexing
   - Handle client disconnections

4. **Create tool handler framework**
   - Design handler interface
   - Create handler registry
   - Implement routing to handlers
   - Add placeholder handlers for Phase 1 tools

5. **Add error handling**
   - Global error handler
   - MCP-compliant error responses
   - Request validation
   - Timeout handling

6. **Implement logging**
   - Request/response logging
   - Error logging
   - Performance metrics
   - Debug mode support

## Test Scenarios

### Happy Path
- Server starts successfully
- MCP initialization returns tool list
- Tool calls route correctly
- SSE streams establish and maintain connection

### Edge Cases
- Multiple simultaneous SSE connections
- Large request payloads
- Rapid repeated requests
- Long-running tool executions

### Error Scenarios
- Port 2601 already in use
- Invalid JSON in requests
- Unknown tool calls
- SSE client disconnection during stream

## Notes & Discussion

### Implementation Notes
- Keep the initial implementation simple - we'll add actual tool implementations in later stories
- Focus on getting the MCP protocol correct first
- SSE implementation should support multiple concurrent streams

### Available Tools (Phase 1)
Initial tools to register (handlers in later stories):
- `host.register` - Register a new project
- `host.start` - Start a project
- `host.stop` - Stop a project
- `host.list` - List all projects
- `host.checkPort` - Check port availability

### Questions for Review
1. Should we implement rate limiting in Phase 1?
2. Do we need authentication tokens even for localhost?
3. Should we support WebSocket as fallback to SSE?

## Story Progress

| Date | Developer | Status | Notes |
|------|-----------|--------|-------|
| TBD | - | Draft | Story created from architecture |

## Change Log

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-01-05 | SM Agent | Initial story creation |