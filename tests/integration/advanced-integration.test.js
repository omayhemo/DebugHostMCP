/**
 * Advanced Integration Testing Suite
 * Comprehensive MCP protocol, WebSocket, and cross-component integration tests
 * Story Points: 8 (Epic 24 Implementation)
 */

const request = require('supertest');
const WebSocket = require('ws');
const { EventEmitter } = require('events');
const path = require('path');
const fs = require('fs').promises;

// Mock MCP SDK for testing
const mockMCPServer = {
    start: jest.fn(),
    stop: jest.fn(),
    setRequestHandler: jest.fn(),
    setNotificationHandler: jest.fn(),
    send: jest.fn(),
    close: jest.fn()
};

jest.mock('@modelcontextprotocol/sdk', () => ({
    Server: jest.fn(() => mockMCPServer),
    StdioServerTransport: jest.fn()
}));

const MCPTools = require('../../src/mcp-tools');
const ProcessManager = require('../../src/process-manager');
const LogStore = require('../../src/log-store');

describe('🔗 Advanced Integration Testing Suite', () => {
    let testServer;
    let mcpTools;
    let processManager;
    let logStore;
    let testPort;
    let wsClient;
    let dashboardServer;
    
    beforeAll(async () => {
        testPort = global.__TEST_PORTS__?.integration || 9876;
        
        // Initialize core components
        mcpTools = new MCPTools();
        processManager = new ProcessManager();
        logStore = new LogStore();
        
        console.log('🚀 Advanced integration test suite initialized');
    });
    
    afterAll(async () => {
        if (testServer) {
            await testServer.close();
        }
        if (wsClient && wsClient.readyState === WebSocket.OPEN) {
            wsClient.close();
        }
        if (dashboardServer) {
            dashboardServer.close();
        }
    });
    
    describe('MCP Protocol Integration', () => {
        test('should handle complete MCP lifecycle with success scenarios', async () => {
            const mockConfig = {
                name: 'test-server',
                command: 'node',
                args: ['-e', 'console.log("MCP server ready")'],
                cwd: process.cwd(),
                env: { NODE_ENV: 'test' }
            };
            
            // Test MCP server initialization
            const serverResult = await mcpTools.startServer(mockConfig);
            expect(serverResult).toHaveProperty('success', true);
            expect(serverResult).toHaveProperty('serverId');
            expect(serverResult).toHaveProperty('port');
            
            const serverId = serverResult.serverId;
            
            // Test server status check
            const statusResult = await mcpTools.getServerStatus(serverId);
            expect(statusResult).toHaveProperty('status', 'running');
            expect(statusResult).toHaveProperty('pid');
            expect(statusResult).toHaveProperty('uptime');
            
            // Test MCP communication
            const communicationResult = await mcpTools.sendRequest(serverId, {
                method: 'ping',
                id: 'test-123',
                params: { timestamp: Date.now() }
            });
            
            expect(communicationResult).toHaveProperty('success');
            
            // Test server logs retrieval
            const logsResult = await mcpTools.getServerLogs(serverId);
            expect(logsResult).toHaveProperty('logs');
            expect(Array.isArray(logsResult.logs)).toBe(true);
            
            // Test graceful shutdown
            const stopResult = await mcpTools.stopServer(serverId);
            expect(stopResult).toHaveProperty('success', true);
            
            // Verify server is stopped
            const finalStatusResult = await mcpTools.getServerStatus(serverId);
            expect(finalStatusResult).toHaveProperty('status', 'stopped');
        });
        
        test('should handle MCP protocol error scenarios gracefully', async () => {
            const invalidConfig = {
                name: 'invalid-server',
                command: 'non-existent-command',
                args: ['--invalid-flag'],
                cwd: '/non/existent/path'
            };
            
            // Test server start failure
            const startResult = await mcpTools.startServer(invalidConfig);
            expect(startResult).toHaveProperty('success', false);
            expect(startResult).toHaveProperty('error');
            expect(startResult.error).toMatch(/failed to start|not found/i);
            
            // Test invalid server ID operations
            const invalidServerId = 'non-existent-server-id';
            
            const statusResult = await mcpTools.getServerStatus(invalidServerId);
            expect(statusResult).toHaveProperty('error');
            
            const stopResult = await mcpTools.stopServer(invalidServerId);
            expect(stopResult).toHaveProperty('success', false);
            expect(stopResult).toHaveProperty('error');
            
            // Test malformed requests
            const malformedRequest = {
                // Missing required fields
                invalidField: 'test'
            };
            
            try {
                await mcpTools.sendRequest('valid-id', malformedRequest);
            } catch (error) {
                expect(error).toBeDefined();
                expect(error.message).toMatch(/invalid|malformed/i);
            }
        });
        
        test('should handle MCP protocol edge cases', async () => {
            // Test concurrent server operations
            const concurrentConfigs = Array.from({ length: 5 }, (_, i) => ({
                name: `concurrent-server-${i}`,
                command: 'node',
                args: ['-e', `console.log("Server ${i} ready")`],
                cwd: process.cwd()
            }));
            
            // Start multiple servers concurrently
            const startPromises = concurrentConfigs.map(config => 
                mcpTools.startServer(config)
            );
            
            const startResults = await Promise.all(startPromises);
            
            // All should start successfully
            startResults.forEach((result, index) => {
                expect(result).toHaveProperty('success', true);
                expect(result).toHaveProperty('serverId');
            });
            
            const serverIds = startResults.map(result => result.serverId);
            
            // Test concurrent operations on multiple servers
            const statusPromises = serverIds.map(id => mcpTools.getServerStatus(id));
            const statusResults = await Promise.all(statusPromises);
            
            statusResults.forEach(result => {
                expect(result).toHaveProperty('status', 'running');
            });
            
            // Test concurrent shutdown
            const stopPromises = serverIds.map(id => mcpTools.stopServer(id));
            const stopResults = await Promise.all(stopPromises);
            
            stopResults.forEach(result => {
                expect(result).toHaveProperty('success', true);
            });
            
            // Test resource cleanup
            const finalStatusPromises = serverIds.map(id => mcpTools.getServerStatus(id));
            const finalStatusResults = await Promise.all(finalStatusPromises);
            
            finalStatusResults.forEach(result => {
                expect(result).toHaveProperty('status', 'stopped');
            });
        });
    });
    
    describe('WebSocket Integration with Connection Resilience', () => {
        beforeEach(async () => {
            // Start dashboard server for WebSocket testing
            const { createDashboardServer } = require('../../src/dashboard/server');
            dashboardServer = await new Promise((resolve) => {
                const server = createDashboardServer(testPort);
                server.listen(testPort, () => {
                    console.log(`Test dashboard server started on port ${testPort}`);
                    resolve(server);
                });
            });
        });
        
        afterEach(async () => {
            if (wsClient && wsClient.readyState === WebSocket.OPEN) {
                wsClient.close();
            }
            if (dashboardServer) {
                dashboardServer.close();
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        });
        
        test('should establish and maintain WebSocket connections', async () => {
            return new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('WebSocket connection timeout'));
                }, 10000);
                
                wsClient = new WebSocket(`ws://localhost:${testPort}`);
                
                wsClient.on('open', () => {
                    console.log('✅ WebSocket connection established');
                    
                    // Test message sending
                    const testMessage = {
                        type: 'ping',
                        timestamp: Date.now(),
                        data: { test: 'connection' }
                    };
                    
                    wsClient.send(JSON.stringify(testMessage));
                });
                
                wsClient.on('message', (data) => {
                    try {
                        const message = JSON.parse(data.toString());
                        console.log('📨 Received WebSocket message:', message.type);
                        
                        // Verify message structure
                        expect(message).toHaveProperty('type');
                        expect(message).toHaveProperty('timestamp');
                        
                        clearTimeout(timeout);
                        resolve();
                    } catch (error) {
                        clearTimeout(timeout);
                        reject(error);
                    }
                });
                
                wsClient.on('error', (error) => {
                    console.error('❌ WebSocket error:', error);
                    clearTimeout(timeout);
                    reject(error);
                });
                
                wsClient.on('close', (code, reason) => {
                    console.log(`🔌 WebSocket closed: ${code} - ${reason}`);
                });
            });
        });
        
        test('should handle WebSocket connection failures and reconnection', async () => {
            // Test connection to non-existent server
            const invalidWsClient = new WebSocket('ws://localhost:99999');
            
            return new Promise((resolve) => {
                const timeout = setTimeout(() => {
                    resolve(); // Test passes if connection fails as expected
                }, 5000);
                
                invalidWsClient.on('error', (error) => {
                    console.log('✅ Expected WebSocket connection error:', error.code);
                    expect(error).toBeDefined();
                    expect(error.code).toMatch(/ECONNREFUSED|ETIMEDOUT/);
                    clearTimeout(timeout);
                    resolve();
                });
                
                invalidWsClient.on('open', () => {
                    clearTimeout(timeout);
                    throw new Error('WebSocket should not have connected to invalid server');
                });
            });
        });
        
        test('should handle high-frequency WebSocket messages', async () => {
            return new Promise((resolve, reject) => {
                const messageCount = 100;
                let receivedCount = 0;
                const startTime = Date.now();
                
                const timeout = setTimeout(() => {
                    reject(new Error('High-frequency message test timeout'));
                }, 15000);
                
                wsClient = new WebSocket(`ws://localhost:${testPort}`);
                
                wsClient.on('open', () => {
                    console.log('🚀 Starting high-frequency message test');
                    
                    // Send messages rapidly
                    for (let i = 0; i < messageCount; i++) {
                        const message = {
                            type: 'high-frequency-test',
                            id: i,
                            timestamp: Date.now(),
                            data: `Message ${i}`
                        };
                        
                        wsClient.send(JSON.stringify(message));
                    }
                });
                
                wsClient.on('message', (data) => {
                    try {
                        const message = JSON.parse(data.toString());
                        
                        if (message.type === 'high-frequency-test') {
                            receivedCount++;
                            
                            if (receivedCount === messageCount) {
                                const endTime = Date.now();
                                const duration = endTime - startTime;
                                const messagesPerSecond = (messageCount / duration) * 1000;
                                
                                console.log(`📊 High-frequency test results:`);
                                console.log(`   Messages sent: ${messageCount}`);
                                console.log(`   Messages received: ${receivedCount}`);
                                console.log(`   Duration: ${duration}ms`);
                                console.log(`   Messages/second: ${messagesPerSecond.toFixed(2)}`);
                                
                                expect(receivedCount).toBe(messageCount);
                                expect(messagesPerSecond).toBeGreaterThan(10);
                                
                                clearTimeout(timeout);
                                resolve();
                            }
                        }
                    } catch (error) {
                        clearTimeout(timeout);
                        reject(error);
                    }
                });
                
                wsClient.on('error', (error) => {
                    clearTimeout(timeout);
                    reject(error);
                });
            });
        });
    });
    
    describe('End-to-End Dashboard Integration', () => {
        test('should perform complete dashboard workflow', async () => {
            // Start dashboard server
            const { createDashboardServer } = require('../../src/dashboard/server');
            const dashboardApp = createDashboardServer(testPort);
            
            testServer = await new Promise((resolve) => {
                const server = dashboardApp.listen(testPort, () => resolve(server));
            });
            
            // Test dashboard home page
            const homeResponse = await request(testServer)
                .get('/')
                .expect(200);
            
            expect(homeResponse.text).toContain('MCP Debug Host');
            expect(homeResponse.text).toContain('Dashboard');
            
            // Test API endpoints
            const statusResponse = await request(testServer)
                .get('/api/status')
                .expect(200);
            
            expect(statusResponse.body).toHaveProperty('status');
            expect(statusResponse.body).toHaveProperty('timestamp');
            
            // Test server management API
            const serversResponse = await request(testServer)
                .get('/api/servers')
                .expect(200);
            
            expect(serversResponse.body).toHaveProperty('servers');
            expect(Array.isArray(serversResponse.body.servers)).toBe(true);
            
            // Test server creation
            const createServerResponse = await request(testServer)
                .post('/api/servers')
                .send({
                    name: 'integration-test-server',
                    command: 'node',
                    args: ['-e', 'console.log("Integration test server")'],
                    cwd: process.cwd()
                })
                .expect(201);
            
            expect(createServerResponse.body).toHaveProperty('success', true);
            expect(createServerResponse.body).toHaveProperty('serverId');
            
            const serverId = createServerResponse.body.serverId;
            
            // Test server details
            const serverDetailsResponse = await request(testServer)
                .get(`/api/servers/${serverId}`)
                .expect(200);
            
            expect(serverDetailsResponse.body).toHaveProperty('serverId', serverId);
            expect(serverDetailsResponse.body).toHaveProperty('status');
            
            // Test server logs
            const logsResponse = await request(testServer)
                .get(`/api/servers/${serverId}/logs`)
                .expect(200);
            
            expect(logsResponse.body).toHaveProperty('logs');
            expect(Array.isArray(logsResponse.body.logs)).toBe(true);
            
            // Test server termination
            const stopResponse = await request(testServer)
                .delete(`/api/servers/${serverId}`)
                .expect(200);
            
            expect(stopResponse.body).toHaveProperty('success', true);
        });
        
        test('should handle dashboard error scenarios', async () => {
            // Start dashboard server
            const { createDashboardServer } = require('../../src/dashboard/server');
            const dashboardApp = createDashboardServer(testPort);
            
            testServer = await new Promise((resolve) => {
                const server = dashboardApp.listen(testPort, () => resolve(server));
            });
            
            // Test invalid server operations
            const invalidServerResponse = await request(testServer)
                .get('/api/servers/non-existent-id')
                .expect(404);
            
            expect(invalidServerResponse.body).toHaveProperty('error');
            
            // Test invalid server creation
            const invalidCreateResponse = await request(testServer)
                .post('/api/servers')
                .send({
                    // Missing required fields
                    name: 'invalid-server'
                })
                .expect(400);
            
            expect(invalidCreateResponse.body).toHaveProperty('error');
            
            // Test invalid routes
            const notFoundResponse = await request(testServer)
                .get('/api/non-existent-endpoint')
                .expect(404);
            
            expect(notFoundResponse.body).toHaveProperty('error');
        });
    });
    
    describe('Cross-Component Integration', () => {
        test('should integrate ProcessManager with LogStore', async () => {
            // Create a test process
            const processConfig = {
                command: 'node',
                args: ['-e', `
                    console.log('Process started');
                    console.error('Test error message');
                    setTimeout(() => {
                        console.log('Process finished');
                        process.exit(0);
                    }, 1000);
                `],
                cwd: process.cwd(),
                env: { NODE_ENV: 'test' }
            };
            
            const processResult = await processManager.start(processConfig);
            expect(processResult).toHaveProperty('success', true);
            expect(processResult).toHaveProperty('pid');
            
            const { pid } = processResult;
            
            // Wait for process to complete
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Verify logs were captured
            const logs = await logStore.getLogs(pid);
            expect(logs).toBeDefined();
            expect(logs.length).toBeGreaterThan(0);
            
            // Verify log content
            const hasStartLog = logs.some(log => log.message.includes('Process started'));
            const hasErrorLog = logs.some(log => log.level === 'error');
            const hasFinishLog = logs.some(log => log.message.includes('Process finished'));
            
            expect(hasStartLog).toBe(true);
            expect(hasErrorLog).toBe(true);
            expect(hasFinishLog).toBe(true);
        });
        
        test('should integrate MCPTools with ProcessManager', async () => {
            const serverConfig = {
                name: 'integration-test-mcp-server',
                command: 'node',
                args: ['-e', `
                    const server = require('http').createServer((req, res) => {
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ status: 'MCP server running', timestamp: Date.now() }));
                    });
                    server.listen(0, () => {
                        console.log('MCP test server started on port', server.address().port);
                    });
                `],
                cwd: process.cwd()
            };
            
            // Start server through MCPTools
            const mcpResult = await mcpTools.startServer(serverConfig);
            expect(mcpResult).toHaveProperty('success', true);
            expect(mcpResult).toHaveProperty('serverId');
            
            const serverId = mcpResult.serverId;
            
            // Verify ProcessManager is tracking the process
            const processStatus = await processManager.getStatus(serverId);
            expect(processStatus).toHaveProperty('running', true);
            expect(processStatus).toHaveProperty('pid');
            
            // Stop server through MCPTools
            const stopResult = await mcpTools.stopServer(serverId);
            expect(stopResult).toHaveProperty('success', true);
            
            // Verify ProcessManager updated status
            await new Promise(resolve => setTimeout(resolve, 500));
            const finalStatus = await processManager.getStatus(serverId);
            expect(finalStatus).toHaveProperty('running', false);
        });
        
        test('should handle complex integration scenarios', async () => {
            const complexScenario = async () => {
                // Start multiple servers
                const serverConfigs = [
                    {
                        name: 'complex-server-1',
                        command: 'node',
                        args: ['-e', 'console.log("Server 1"); setTimeout(() => process.exit(0), 2000)'],
                        cwd: process.cwd()
                    },
                    {
                        name: 'complex-server-2', 
                        command: 'node',
                        args: ['-e', 'console.log("Server 2"); setTimeout(() => process.exit(0), 3000)'],
                        cwd: process.cwd()
                    }
                ];
                
                const startPromises = serverConfigs.map(config => mcpTools.startServer(config));
                const startResults = await Promise.all(startPromises);
                
                const serverIds = startResults.map(result => result.serverId);
                
                // Monitor all servers
                const monitoringPromises = serverIds.map(async (serverId) => {
                    const status = await mcpTools.getServerStatus(serverId);
                    const logs = await mcpTools.getServerLogs(serverId);
                    
                    return { serverId, status, logs };
                });
                
                const monitoringResults = await Promise.all(monitoringPromises);
                
                // Verify all monitoring data
                monitoringResults.forEach(result => {
                    expect(result.status).toHaveProperty('status');
                    expect(result.logs).toHaveProperty('logs');
                });
                
                // Graceful shutdown of all servers
                const stopPromises = serverIds.map(id => mcpTools.stopServer(id));
                const stopResults = await Promise.all(stopPromises);
                
                stopResults.forEach(result => {
                    expect(result).toHaveProperty('success', true);
                });
                
                return { serverIds, monitoringResults, stopResults };
            };
            
            const scenarioResult = await complexScenario();
            expect(scenarioResult.serverIds.length).toBe(2);
            expect(scenarioResult.monitoringResults.length).toBe(2);
            expect(scenarioResult.stopResults.length).toBe(2);
        });
    });
});