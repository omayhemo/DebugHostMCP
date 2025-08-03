/**
 * Comprehensive Load Testing Suite
 * High-load WebSocket connections, server stress testing, and memory leak detection
 * Story Points: 5 (Epic 24 Implementation)
 */

const WebSocket = require('ws');
const { EventEmitter } = require('events');
const cluster = require('cluster');
const os = require('os');

// Import components for testing
const ProcessManager = require('../../src/process-manager');
const MCPTools = require('../../src/mcp-tools');

describe('🚀 Comprehensive Load Testing Suite', () => {
    let testServers = [];
    let wsConnections = [];
    let processManager;
    let mcpTools;
    let testPort;
    
    beforeAll(async () => {
        testPort = global.__TEST_PORTS__?.load || 9877;
        processManager = new ProcessManager();
        mcpTools = new MCPTools();
        
        console.log('🔥 Comprehensive load testing suite initialized');
        console.log(`💻 System resources: ${os.cpus().length} CPUs, ${(os.totalmem() / 1024 / 1024 / 1024).toFixed(2)}GB RAM`);
    });
    
    afterAll(async () => {
        // Cleanup all test servers
        await Promise.all(testServers.map(server => 
            new Promise(resolve => server.close(resolve))
        ));
        
        // Close all WebSocket connections
        wsConnections.forEach(ws => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
        });
        
        console.log('🧹 Load testing cleanup completed');
    });
    
    describe('High-Load WebSocket Connections (1000+ concurrent)', () => {
        test('should handle 1000+ concurrent WebSocket connections', async () => {
            const { createDashboardServer } = require('../../src/dashboard/server');
            const connectionCount = 1000;
            const messageCount = 10; // Messages per connection
            
            // Start test server
            const testServer = createDashboardServer(testPort);
            const server = await new Promise((resolve) => {
                const srv = testServer.listen(testPort, () => {
                    console.log(`🌐 Load test server started on port ${testPort}`);
                    resolve(srv);
                });
            });
            testServers.push(server);
            
            console.log(`🚀 Starting ${connectionCount} concurrent WebSocket connections...`);
            
            const startTime = Date.now();
            const connectionPromises = [];
            const connectionResults = [];
            
            // Create concurrent connections
            for (let i = 0; i < connectionCount; i++) {
                const connectionPromise = new Promise((resolve, reject) => {
                    const ws = new WebSocket(`ws://localhost:${testPort}`);
                    const connectionData = {
                        id: i,
                        connected: false,
                        messagesSent: 0,
                        messagesReceived: 0,
                        errors: 0,
                        latencySum: 0,
                        connectionTime: null
                    };
                    
                    const connectionTimeout = setTimeout(() => {
                        connectionData.errors++;
                        reject(new Error(`Connection ${i} timeout`));
                    }, 10000);
                    
                    ws.on('open', () => {
                        connectionData.connected = true;
                        connectionData.connectionTime = Date.now() - startTime;
                        clearTimeout(connectionTimeout);
                        
                        // Send test messages
                        for (let j = 0; j < messageCount; j++) {
                            const messageStart = Date.now();
                            const message = {
                                type: 'load-test',
                                connectionId: i,
                                messageId: j,
                                timestamp: messageStart
                            };
                            
                            ws.send(JSON.stringify(message));
                            connectionData.messagesSent++;
                        }
                    });
                    
                    ws.on('message', (data) => {
                        try {
                            const message = JSON.parse(data.toString());
                            if (message.type === 'load-test') {
                                const latency = Date.now() - message.timestamp;
                                connectionData.latencySum += latency;
                                connectionData.messagesReceived++;
                                
                                // Close connection after receiving all messages
                                if (connectionData.messagesReceived >= messageCount) {
                                    ws.close();
                                    resolve(connectionData);
                                }
                            }
                        } catch (error) {
                            connectionData.errors++;
                        }
                    });
                    
                    ws.on('error', (error) => {
                        connectionData.errors++;
                        console.log(`❌ Connection ${i} error: ${error.message}`);
                        clearTimeout(connectionTimeout);
                        resolve(connectionData); // Resolve even on error to continue test
                    });
                    
                    ws.on('close', () => {
                        if (connectionData.messagesReceived < messageCount && connectionData.errors === 0) {
                            connectionData.errors++;
                        }
                        clearTimeout(connectionTimeout);
                        if (!connectionData.connected) {
                            resolve(connectionData);
                        }
                    });
                    
                    wsConnections.push(ws);
                });
                
                connectionPromises.push(connectionPromise);
                
                // Add small delay to prevent overwhelming the system
                if (i % 100 === 0 && i > 0) {
                    await new Promise(resolve => setTimeout(resolve, 10));
                }
            }
            
            // Wait for all connections to complete
            const results = await Promise.allSettled(connectionPromises);
            const endTime = Date.now();
            const totalDuration = endTime - startTime;
            
            // Analyze results
            const successful = results.filter(r => r.status === 'fulfilled' && r.value.connected);
            const failed = results.filter(r => r.status === 'rejected' || !r.value?.connected);
            
            const successfulConnections = successful.map(r => r.value);
            const totalMessagesReceived = successfulConnections.reduce((sum, conn) => sum + conn.messagesReceived, 0);
            const totalMessagesSent = successfulConnections.reduce((sum, conn) => sum + conn.messagesSent, 0);
            const averageLatency = successfulConnections.reduce((sum, conn) => {
                return sum + (conn.latencySum / Math.max(conn.messagesReceived, 1));
            }, 0) / Math.max(successfulConnections.length, 1);
            
            console.log(`📊 High-Load WebSocket Test Results:`);
            console.log(`   Target connections: ${connectionCount}`);
            console.log(`   Successful connections: ${successful.length}`);
            console.log(`   Failed connections: ${failed.length}`);
            console.log(`   Success rate: ${((successful.length / connectionCount) * 100).toFixed(2)}%`);
            console.log(`   Total duration: ${totalDuration}ms`);
            console.log(`   Total messages sent: ${totalMessagesSent}`);
            console.log(`   Total messages received: ${totalMessagesReceived}`);
            console.log(`   Average latency: ${averageLatency.toFixed(2)}ms`);
            console.log(`   Messages/second: ${((totalMessagesReceived / totalDuration) * 1000).toFixed(2)}`);
            
            // Performance assertions
            expect(successful.length).toBeGreaterThan(connectionCount * 0.8); // At least 80% success rate
            expect(averageLatency).toBeLessThan(1000); // Less than 1 second average latency
            expect(totalMessagesReceived).toBeGreaterThan(connectionCount * messageCount * 0.7); // At least 70% message success
            
        }, 60000); // 60 second timeout for this intensive test
        
        test('should handle WebSocket connection bursts and recovery', async () => {
            const { createDashboardServer } = require('../../src/dashboard/server');
            const burstPort = testPort + 1;
            const burstSize = 200;
            const burstCount = 5;
            
            // Start test server
            const testServer = createDashboardServer(burstPort);
            const server = await new Promise((resolve) => {
                const srv = testServer.listen(burstPort, () => resolve(srv));
            });
            testServers.push(server);
            
            console.log(`💥 Testing ${burstCount} bursts of ${burstSize} connections each...`);
            
            const burstResults = [];
            
            for (let burst = 0; burst < burstCount; burst++) {
                console.log(`🚀 Starting burst ${burst + 1}/${burstCount}...`);
                
                const burstStart = Date.now();
                const burstConnections = [];
                
                // Create burst of connections
                for (let i = 0; i < burstSize; i++) {
                    const ws = new WebSocket(`ws://localhost:${burstPort}`);
                    burstConnections.push(ws);
                    wsConnections.push(ws);
                }
                
                // Wait for connections to establish
                const connectionPromises = burstConnections.map((ws, index) => {
                    return new Promise((resolve) => {
                        const timeout = setTimeout(() => {
                            resolve({ success: false, error: 'timeout' });
                        }, 5000);
                        
                        ws.on('open', () => {
                            clearTimeout(timeout);
                            resolve({ success: true, connectionTime: Date.now() - burstStart });
                        });
                        
                        ws.on('error', (error) => {
                            clearTimeout(timeout);
                            resolve({ success: false, error: error.message });
                        });
                    });
                });
                
                const connectionResults = await Promise.all(connectionPromises);
                const burstEnd = Date.now();
                
                const successful = connectionResults.filter(r => r.success);
                const failed = connectionResults.filter(r => !r.success);
                
                burstResults.push({
                    burst: burst + 1,
                    duration: burstEnd - burstStart,
                    successful: successful.length,
                    failed: failed.length,
                    successRate: (successful.length / burstSize) * 100
                });
                
                console.log(`   Burst ${burst + 1}: ${successful.length}/${burstSize} successful (${((successful.length / burstSize) * 100).toFixed(1)}%)`);
                
                // Close burst connections
                burstConnections.forEach(ws => {
                    if (ws.readyState === WebSocket.OPEN) {
                        ws.close();
                    }
                });
                
                // Recovery period between bursts
                if (burst < burstCount - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
            
            // Analyze burst results
            const overallSuccessRate = burstResults.reduce((sum, b) => sum + b.successRate, 0) / burstResults.length;
            const consistentPerformance = burstResults.every(b => b.successRate > 70);
            
            console.log(`📊 Burst Test Results:`);
            burstResults.forEach(result => {
                console.log(`   Burst ${result.burst}: ${result.successful}/${burstSize} (${result.successRate.toFixed(1)}%) in ${result.duration}ms`);
            });
            console.log(`   Overall success rate: ${overallSuccessRate.toFixed(2)}%`);
            console.log(`   Consistent performance: ${consistentPerformance ? 'Yes' : 'No'}`);
            
            expect(overallSuccessRate).toBeGreaterThan(70);
            expect(burstResults.length).toBe(burstCount);
            
        }, 45000);
    });
    
    describe('Server Process Management Stress Testing', () => {
        test('should handle rapid server creation and termination', async () => {
            const serverCount = 50;
            const serverConfigs = Array.from({ length: serverCount }, (_, i) => ({
                name: `stress-test-server-${i}`,
                command: 'node',
                args: ['-e', `
                    console.log('Server ${i} started');
                    setTimeout(() => {
                        console.log('Server ${i} finished');
                        process.exit(0);
                    }, ${1000 + (i * 50)}); // Staggered exit times
                `],
                cwd: process.cwd(),
                env: { NODE_ENV: 'test', SERVER_ID: i.toString() }
            }));
            
            console.log(`🏭 Starting ${serverCount} servers for stress testing...`);
            
            const startTime = Date.now();
            
            // Start all servers concurrently
            const startPromises = serverConfigs.map(async (config, index) => {
                try {
                    const result = await mcpTools.startServer(config);
                    return { index, success: true, result };
                } catch (error) {
                    return { index, success: false, error: error.message };
                }
            });
            
            const startResults = await Promise.all(startPromises);
            const startEndTime = Date.now();
            
            const successfulStarts = startResults.filter(r => r.success);
            const failedStarts = startResults.filter(r => !r.success);
            
            console.log(`📈 Server Creation Results:`);
            console.log(`   Successful starts: ${successfulStarts.length}/${serverCount}`);
            console.log(`   Failed starts: ${failedStarts.length}`);
            console.log(`   Start duration: ${startEndTime - startTime}ms`);
            console.log(`   Servers/second: ${((successfulStarts.length / (startEndTime - startTime)) * 1000).toFixed(2)}`);
            
            // Monitor server status
            const serverIds = successfulStarts.map(r => r.result.serverId);
            const monitoringPromises = serverIds.map(async (serverId) => {
                try {
                    const status = await mcpTools.getServerStatus(serverId);
                    return { serverId, status: status.status, success: true };
                } catch (error) {
                    return { serverId, error: error.message, success: false };
                }
            });
            
            const monitoringResults = await Promise.all(monitoringPromises);
            const runningServers = monitoringResults.filter(r => r.success && r.status === 'running');
            
            console.log(`🔍 Server Monitoring Results:`);
            console.log(`   Servers monitored: ${monitoringResults.length}`);
            console.log(`   Running servers: ${runningServers.length}`);
            
            // Wait for natural server termination
            console.log(`⏳ Waiting for servers to terminate naturally...`);
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            // Check final status
            const finalStatusPromises = serverIds.map(async (serverId) => {
                try {
                    const status = await mcpTools.getServerStatus(serverId);
                    return { serverId, status: status.status, success: true };
                } catch (error) {
                    return { serverId, error: error.message, success: false };
                }
            });
            
            const finalStatusResults = await Promise.all(finalStatusPromises);
            const stoppedServers = finalStatusResults.filter(r => r.success && r.status === 'stopped');
            const stillRunning = finalStatusResults.filter(r => r.success && r.status === 'running');
            
            console.log(`🏁 Final Server Status:`);
            console.log(`   Stopped servers: ${stoppedServers.length}`);
            console.log(`   Still running: ${stillRunning.length}`);
            
            // Force stop any remaining servers
            if (stillRunning.length > 0) {
                console.log(`🛑 Force stopping ${stillRunning.length} remaining servers...`);
                const forceStopPromises = stillRunning.map(s => mcpTools.stopServer(s.serverId));
                await Promise.all(forceStopPromises);
            }
            
            // Performance assertions
            expect(successfulStarts.length).toBeGreaterThan(serverCount * 0.8); // At least 80% success
            expect(runningServers.length).toBeGreaterThan(successfulStarts.length * 0.8); // Most should be running
            expect(startEndTime - startTime).toBeLessThan(30000); // Should complete within 30 seconds
            
        }, 60000);
        
        test('should detect and prevent memory leaks under load', async () => {
            const initialMemory = process.memoryUsage();
            console.log(`🧠 Initial memory usage: ${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`);
            
            const iterationCount = 20;
            const serversPerIteration = 10;
            const memorySnapshots = [initialMemory];
            
            for (let iteration = 0; iteration < iterationCount; iteration++) {
                console.log(`🔄 Memory leak test iteration ${iteration + 1}/${iterationCount}...`);
                
                // Create servers
                const serverConfigs = Array.from({ length: serversPerIteration }, (_, i) => ({
                    name: `memory-test-server-${iteration}-${i}`,
                    command: 'node',
                    args: ['-e', `
                        console.log('Memory test server started');
                        setTimeout(() => process.exit(0), 500);
                    `],
                    cwd: process.cwd()
                }));
                
                const startPromises = serverConfigs.map(config => mcpTools.startServer(config));
                const startResults = await Promise.all(startPromises);
                const serverIds = startResults.map(r => r.serverId);
                
                // Wait for servers to complete
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Stop any remaining servers
                const stopPromises = serverIds.map(id => mcpTools.stopServer(id));
                await Promise.all(stopPromises);
                
                // Force garbage collection if available
                if (global.gc) {
                    global.gc();
                }
                
                // Take memory snapshot
                const currentMemory = process.memoryUsage();
                memorySnapshots.push(currentMemory);
                
                console.log(`   Heap usage: ${(currentMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`);
                
                // Small delay to allow cleanup
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            // Analyze memory usage patterns
            const finalMemory = memorySnapshots[memorySnapshots.length - 1];
            const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
            const memoryIncreasePercent = (memoryIncrease / initialMemory.heapUsed) * 100;
            
            // Calculate trend
            const memoryTrend = [];
            for (let i = 1; i < memorySnapshots.length; i++) {
                const diff = memorySnapshots[i].heapUsed - memorySnapshots[i - 1].heapUsed;
                memoryTrend.push(diff);
            }
            
            const avgMemoryChange = memoryTrend.reduce((sum, change) => sum + change, 0) / memoryTrend.length;
            const maxMemoryUsage = Math.max(...memorySnapshots.map(m => m.heapUsed));
            
            console.log(`🧠 Memory Leak Detection Results:`);
            console.log(`   Initial memory: ${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`);
            console.log(`   Final memory: ${(finalMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`);
            console.log(`   Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB (${memoryIncreasePercent.toFixed(2)}%)`);
            console.log(`   Average change per iteration: ${(avgMemoryChange / 1024 / 1024).toFixed(2)}MB`);
            console.log(`   Peak memory usage: ${(maxMemoryUsage / 1024 / 1024).toFixed(2)}MB`);
            
            // Memory leak detection assertions
            expect(memoryIncreasePercent).toBeLessThan(100); // Memory shouldn't double
            expect(avgMemoryChange).toBeLessThan(1024 * 1024 * 5); // Average increase < 5MB per iteration
            expect(maxMemoryUsage - initialMemory.heapUsed).toBeLessThan(1024 * 1024 * 200); // Peak increase < 200MB
            
        }, 90000);
    });
    
    describe('Dashboard Performance Under Load', () => {
        test('should maintain dashboard responsiveness under high load', async () => {
            const { createDashboardServer } = require('../../src/dashboard/server');
            const dashboardPort = testPort + 2;
            const concurrentRequests = 200;
            const requestsPerSecond = 50;
            
            // Start dashboard server
            const testServer = createDashboardServer(dashboardPort);
            const server = await new Promise((resolve) => {
                const srv = testServer.listen(dashboardPort, () => resolve(srv));
            });
            testServers.push(server);
            
            console.log(`🎛️  Testing dashboard performance with ${concurrentRequests} concurrent requests...`);
            
            const request = require('supertest');
            const startTime = Date.now();
            const requestResults = [];
            
            // Create concurrent HTTP requests
            const requestPromises = [];
            for (let i = 0; i < concurrentRequests; i++) {
                const requestPromise = (async () => {
                    const requestStart = Date.now();
                    
                    try {
                        const response = await request(server)
                            .get('/api/status')
                            .timeout(10000);
                        
                        const requestEnd = Date.now();
                        
                        return {
                            id: i,
                            success: true,
                            statusCode: response.status,
                            duration: requestEnd - requestStart,
                            responseSize: JSON.stringify(response.body).length
                        };
                    } catch (error) {
                        return {
                            id: i,
                            success: false,
                            error: error.message,
                            duration: Date.now() - requestStart
                        };
                    }
                })();
                
                requestPromises.push(requestPromise);
                
                // Rate limiting to prevent overwhelming
                if (i % requestsPerSecond === 0 && i > 0) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
            
            const results = await Promise.all(requestPromises);
            const endTime = Date.now();
            const totalDuration = endTime - startTime;
            
            // Analyze results
            const successful = results.filter(r => r.success);
            const failed = results.filter(r => !r.success);
            const avgResponseTime = successful.reduce((sum, r) => sum + r.duration, 0) / Math.max(successful.length, 1);
            const maxResponseTime = Math.max(...successful.map(r => r.duration));
            const minResponseTime = Math.min(...successful.map(r => r.duration));
            const throughput = (successful.length / totalDuration) * 1000;
            
            console.log(`📊 Dashboard Load Test Results:`);
            console.log(`   Total requests: ${concurrentRequests}`);
            console.log(`   Successful: ${successful.length}`);
            console.log(`   Failed: ${failed.length}`);
            console.log(`   Success rate: ${((successful.length / concurrentRequests) * 100).toFixed(2)}%`);
            console.log(`   Total duration: ${totalDuration}ms`);
            console.log(`   Average response time: ${avgResponseTime.toFixed(2)}ms`);
            console.log(`   Min response time: ${minResponseTime}ms`);
            console.log(`   Max response time: ${maxResponseTime}ms`);
            console.log(`   Throughput: ${throughput.toFixed(2)} requests/second`);
            
            // Performance assertions
            expect(successful.length).toBeGreaterThan(concurrentRequests * 0.9); // 90% success rate
            expect(avgResponseTime).toBeLessThan(1000); // Average response < 1 second
            expect(maxResponseTime).toBeLessThan(5000); // Max response < 5 seconds
            expect(throughput).toBeGreaterThan(10); // At least 10 requests/second
            
        }, 60000);
    });
});