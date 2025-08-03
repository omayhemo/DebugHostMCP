/**
 * WebSocket Load Testing Suite
 * Tests WebSocket performance under high load, stress scenarios, and concurrent connections
 */

const WebSocket = require('ws');
const { performance } = require('perf_hooks');
const EventEmitter = require('events');

describe('🚀 WebSocket Load Testing', () => {
    let testPort;
    let wsServer;
    let connections = [];
    
    beforeAll(async () => {
        testPort = global.__TEST_PORTS__?.websocket || 8080;
        console.log(`🔌 Starting WebSocket load tests on port ${testPort}`);
    });
    
    afterEach(async () => {
        // Clean up all connections
        await Promise.all(connections.map(async (ws) => {
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
        }));
        connections = [];
    });
    
    afterAll(async () => {
        if (wsServer) {
            wsServer.close();
        }
    });
    
    describe('Connection Load Testing', () => {
        test('should handle 100 concurrent WebSocket connections', async () => {
            const concurrentConnections = 100;
            const connectionPromises = [];
            const startTime = performance.now();
            
            // Create concurrent connections
            for (let i = 0; i < concurrentConnections; i++) {
                const connectionPromise = new Promise((resolve, reject) => {
                    const ws = new WebSocket(`ws://localhost:${testPort}`);
                    connections.push(ws);
                    
                    ws.on('open', () => {
                        resolve({ id: i, connected: true, ws });
                    });
                    
                    ws.on('error', (error) => {
                        reject({ id: i, error });
                    });
                    
                    // Timeout after 10 seconds
                    setTimeout(() => {
                        if (ws.readyState === WebSocket.CONNECTING) {
                            reject({ id: i, error: 'Connection timeout' });
                        }
                    }, 10000);
                });
                
                connectionPromises.push(connectionPromise);
            }
            
            // Wait for all connections
            const results = await Promise.allSettled(connectionPromises);
            const successfulConnections = results.filter(r => r.status === 'fulfilled').length;
            const connectionTime = performance.now() - startTime;
            
            console.log(`📊 Load Test Results:`);
            console.log(`  ✅ Successful connections: ${successfulConnections}/${concurrentConnections}`);
            console.log(`  ⏱️  Connection time: ${connectionTime.toFixed(2)}ms`);
            console.log(`  📈 Avg connection time: ${(connectionTime / concurrentConnections).toFixed(2)}ms`);
            
            // Should connect at least 80% successfully
            expect(successfulConnections).toBeGreaterThanOrEqual(concurrentConnections * 0.8);
            
            // Should connect reasonably fast (less than 5 seconds total)
            expect(connectionTime).toBeLessThan(5000);
        }, 30000);
        
        test('should handle rapid connection/disconnection cycles', async () => {
            const cycles = 50;
            const cycleTimes = [];
            
            for (let i = 0; i < cycles; i++) {
                const startTime = performance.now();
                
                // Create connection
                const ws = new WebSocket(`ws://localhost:${testPort}`);
                
                await new Promise((resolve, reject) => {
                    ws.on('open', () => {
                        // Immediately close
                        ws.close();
                        const cycleTime = performance.now() - startTime;
                        cycleTimes.push(cycleTime);
                        resolve();
                    });
                    
                    ws.on('error', reject);
                    
                    setTimeout(() => reject(new Error('Cycle timeout')), 5000);
                });
            }
            
            const avgCycleTime = cycleTimes.reduce((a, b) => a + b, 0) / cycleTimes.length;
            const maxCycleTime = Math.max(...cycleTimes);
            
            console.log(`🔄 Rapid Cycle Results:`);
            console.log(`  📊 Cycles completed: ${cycles}`);
            console.log(`  ⏱️  Average cycle time: ${avgCycleTime.toFixed(2)}ms`);
            console.log(`  📈 Max cycle time: ${maxCycleTime.toFixed(2)}ms`);
            
            // Should complete cycles reasonably fast
            expect(avgCycleTime).toBeLessThan(100);
            expect(maxCycleTime).toBeLessThan(500);
        });
    });
    
    describe('Message Load Testing', () => {
        test('should handle high-frequency message sending', async () => {
            const messageCount = 1000;
            const ws = new WebSocket(`ws://localhost:${testPort}`);
            connections.push(ws);
            
            await new Promise((resolve) => {
                ws.on('open', resolve);
            });
            
            const messagesReceived = [];
            const startTime = performance.now();
            
            ws.on('message', (data) => {
                messagesReceived.push({
                    data: data.toString(),
                    timestamp: performance.now()
                });
            });
            
            // Send messages rapidly
            for (let i = 0; i < messageCount; i++) {
                const message = JSON.stringify({
                    id: i,
                    type: 'load-test',
                    timestamp: Date.now(),
                    data: `Test message ${i}`
                });
                
                ws.send(message);
            }
            
            // Wait for all messages to be processed
            await new Promise((resolve) => {
                const checkComplete = () => {
                    if (messagesReceived.length >= messageCount) {
                        resolve();
                    } else {
                        setTimeout(checkComplete, 10);
                    }
                };
                checkComplete();
            });
            
            const totalTime = performance.now() - startTime;
            const messagesPerSecond = (messageCount / totalTime) * 1000;
            
            console.log(`📨 Message Load Results:`);
            console.log(`  📊 Messages sent: ${messageCount}`);
            console.log(`  📨 Messages received: ${messagesReceived.length}`);
            console.log(`  ⏱️  Total time: ${totalTime.toFixed(2)}ms`);
            console.log(`  📈 Messages/second: ${messagesPerSecond.toFixed(2)}`);
            
            // Should receive all messages
            expect(messagesReceived.length).toBe(messageCount);
            
            // Should handle at least 100 messages per second
            expect(messagesPerSecond).toBeGreaterThan(100);
        }, 30000);
        
        test('should handle large message payloads', async () => {
            const ws = new WebSocket(`ws://localhost:${testPort}`);
            connections.push(ws);
            
            await new Promise((resolve) => {
                ws.on('open', resolve);
            });
            
            const messageSizes = [1024, 10240, 102400, 1048576]; // 1KB, 10KB, 100KB, 1MB
            const results = [];
            
            for (const size of messageSizes) {
                const largePayload = 'A'.repeat(size);
                const message = JSON.stringify({
                    type: 'large-payload-test',
                    size: size,
                    data: largePayload
                });
                
                const startTime = performance.now();
                
                ws.send(message);
                
                // Wait for echo response
                const response = await new Promise((resolve) => {
                    ws.once('message', (data) => {
                        const endTime = performance.now();
                        resolve({
                            size: size,
                            roundTripTime: endTime - startTime,
                            responseSize: data.length
                        });
                    });
                });
                
                results.push(response);
            }
            
            console.log(`📦 Large Payload Results:`);
            results.forEach(result => {
                console.log(`  📊 ${(result.size / 1024).toFixed(0)}KB: ${result.roundTripTime.toFixed(2)}ms`);
            });
            
            // Should handle all payload sizes
            expect(results.length).toBe(messageSizes.length);
            
            // Should complete reasonably fast (less than 1 second for 1MB)
            const largestResult = results[results.length - 1];
            expect(largestResult.roundTripTime).toBeLessThan(1000);
        }, 30000);
    });
    
    describe('Stress Testing', () => {
        test('should handle memory pressure from many connections', async () => {
            const connectionCount = 200;
            const memoryBefore = process.memoryUsage();
            
            // Create many connections
            const connectionPromises = [];
            for (let i = 0; i < connectionCount; i++) {
                const promise = new Promise((resolve) => {
                    const ws = new WebSocket(`ws://localhost:${testPort}`);
                    connections.push(ws);
                    
                    ws.on('open', () => {
                        resolve(ws);
                    });
                    
                    ws.on('error', () => {
                        resolve(null);
                    });
                });
                
                connectionPromises.push(promise);
            }
            
            const establishedConnections = await Promise.all(connectionPromises);
            const successfulConnections = establishedConnections.filter(ws => ws !== null);
            
            // Let connections exist for a while
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const memoryAfter = process.memoryUsage();
            const memoryIncrease = memoryAfter.heapUsed - memoryBefore.heapUsed;
            const memoryPerConnection = memoryIncrease / successfulConnections.length;
            
            console.log(`🧠 Memory Stress Results:`);
            console.log(`  📊 Connections: ${successfulConnections.length}/${connectionCount}`);
            console.log(`  📈 Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
            console.log(`  📊 Memory per connection: ${(memoryPerConnection / 1024).toFixed(2)}KB`);
            
            // Should handle most connections
            expect(successfulConnections.length).toBeGreaterThanOrEqual(connectionCount * 0.7);
            
            // Should not use excessive memory (less than 10KB per connection)
            expect(memoryPerConnection).toBeLessThan(10240);
        }, 60000);
        
        test('should recover from connection errors gracefully', async () => {
            const ws = new WebSocket(`ws://localhost:${testPort}`);
            connections.push(ws);
            
            await new Promise((resolve) => {
                ws.on('open', resolve);
            });
            
            let errorCount = 0;
            let recoveryCount = 0;
            
            ws.on('error', () => {
                errorCount++;
            });
            
            // Simulate network issues by force-closing and reconnecting
            const simulateNetworkIssues = async () => {
                for (let i = 0; i < 10; i++) {
                    // Force close connection
                    if (ws.readyState === WebSocket.OPEN) {
                        ws.terminate();
                    }
                    
                    await new Promise(resolve => setTimeout(resolve, 100));
                    
                    // Try to reconnect
                    const newWs = new WebSocket(`ws://localhost:${testPort}`);
                    connections.push(newWs);
                    
                    try {
                        await new Promise((resolve, reject) => {
                            newWs.on('open', () => {
                                recoveryCount++;
                                resolve();
                            });
                            newWs.on('error', reject);
                            
                            setTimeout(() => reject(new Error('Recovery timeout')), 2000);
                        });
                    } catch (error) {
                        // Recovery failed, continue
                    }
                    
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            };
            
            await simulateNetworkIssues();
            
            console.log(`🔄 Recovery Test Results:`);
            console.log(`  ❌ Errors: ${errorCount}`);
            console.log(`  ✅ Recoveries: ${recoveryCount}`);
            console.log(`  📊 Recovery rate: ${((recoveryCount / 10) * 100).toFixed(1)}%`);
            
            // Should recover from most issues
            expect(recoveryCount).toBeGreaterThanOrEqual(7);
        }, 30000);
    });
    
    describe('Performance Monitoring', () => {
        test('should maintain stable performance under sustained load', async () => {
            const ws = new WebSocket(`ws://localhost:${testPort}`);
            connections.push(ws);
            
            await new Promise((resolve) => {
                ws.on('open', resolve);
            });
            
            const performanceMetrics = [];
            const testDuration = 10000; // 10 seconds
            const messageInterval = 50; // Send message every 50ms
            
            const startTest = performance.now();
            
            const sendMessages = () => {
                const sendTime = performance.now();
                
                ws.send(JSON.stringify({
                    type: 'performance-test',
                    timestamp: sendTime
                }));
                
                if (performance.now() - startTest < testDuration) {
                    setTimeout(sendMessages, messageInterval);
                }
            };
            
            ws.on('message', (data) => {
                const receiveTime = performance.now();
                const message = JSON.parse(data.toString());
                
                if (message.type === 'performance-test') {
                    const latency = receiveTime - message.timestamp;
                    performanceMetrics.push({
                        timestamp: receiveTime,
                        latency: latency
                    });
                }
            });
            
            // Start sending messages
            sendMessages();
            
            // Wait for test to complete
            await new Promise(resolve => setTimeout(resolve, testDuration + 1000));
            
            if (performanceMetrics.length > 0) {
                const avgLatency = performanceMetrics.reduce((sum, m) => sum + m.latency, 0) / performanceMetrics.length;
                const maxLatency = Math.max(...performanceMetrics.map(m => m.latency));
                const minLatency = Math.min(...performanceMetrics.map(m => m.latency));
                
                // Calculate latency stability (standard deviation)
                const variance = performanceMetrics.reduce((sum, m) => sum + Math.pow(m.latency - avgLatency, 2), 0) / performanceMetrics.length;
                const stdDev = Math.sqrt(variance);
                
                console.log(`📊 Performance Monitoring Results:`);
                console.log(`  📨 Messages processed: ${performanceMetrics.length}`);
                console.log(`  ⏱️  Average latency: ${avgLatency.toFixed(2)}ms`);
                console.log(`  📈 Max latency: ${maxLatency.toFixed(2)}ms`);
                console.log(`  📉 Min latency: ${minLatency.toFixed(2)}ms`);
                console.log(`  📊 Std deviation: ${stdDev.toFixed(2)}ms`);
                
                // Performance requirements
                expect(avgLatency).toBeLessThan(100); // Average latency under 100ms
                expect(maxLatency).toBeLessThan(500); // Max latency under 500ms
                expect(stdDev).toBeLessThan(50); // Stable performance (low deviation)
            }
        }, 15000);
    });
});

/**
 * WebSocket Mock Server for Testing
 */
class MockWebSocketServer extends EventEmitter {
    constructor(port) {
        super();
        this.port = port;
        this.clients = new Set();
        this.server = null;
    }
    
    start() {
        return new Promise((resolve) => {
            this.server = new WebSocket.Server({ port: this.port });
            
            this.server.on('connection', (ws) => {
                this.clients.add(ws);
                
                ws.on('message', (data) => {
                    // Echo messages back
                    try {
                        const message = JSON.parse(data.toString());
                        ws.send(JSON.stringify({
                            ...message,
                            echo: true,
                            serverTimestamp: Date.now()
                        }));
                    } catch (error) {
                        ws.send(data); // Echo raw data if not JSON
                    }
                });
                
                ws.on('close', () => {
                    this.clients.delete(ws);
                });
                
                ws.on('error', (error) => {
                    console.error('WebSocket error:', error);
                    this.clients.delete(ws);
                });
            });
            
            this.server.on('listening', () => {
                console.log(`🔌 Mock WebSocket server listening on port ${this.port}`);
                resolve();
            });
        });
    }
    
    stop() {
        return new Promise((resolve) => {
            if (this.server) {
                this.server.close(() => {
                    console.log(`🔌 Mock WebSocket server stopped`);
                    resolve();
                });
            } else {
                resolve();
            }
        });
    }
    
    broadcast(message) {
        this.clients.forEach(ws => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(typeof message === 'string' ? message : JSON.stringify(message));
            }
        });
    }
}

module.exports = { MockWebSocketServer };