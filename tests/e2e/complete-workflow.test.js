/**
 * End-to-End Testing Suite
 * Complete workflow validation from server start to log monitoring to shutdown
 */

const request = require('supertest');
const WebSocket = require('ws');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;

describe('🔄 End-to-End Workflow Testing', () => {
    let mcpServerProcess;
    let dashboardProcess;
    let testApiKey;
    let baseUrl;
    let wsUrl;
    
    beforeAll(async () => {
        // Set up test environment
        testApiKey = 'test-api-key-' + Math.random().toString(36).substr(2, 16);
        const testPort = global.__TEST_PORTS__?.dashboard || 3000;
        const wsPort = global.__TEST_PORTS__?.websocket || 8080;
        
        baseUrl = `http://localhost:${testPort}`;
        wsUrl = `ws://localhost:${wsPort}`;
        
        console.log(`🚀 Starting E2E test environment:`);
        console.log(`   Dashboard: ${baseUrl}`);
        console.log(`   WebSocket: ${wsUrl}`);
        console.log(`   API Key: ${testApiKey}`);
    }, 30000);
    
    afterAll(async () => {
        // Clean up processes
        const processes = [mcpServerProcess, dashboardProcess].filter(Boolean);
        
        for (const process of processes) {
            if (process && !process.killed) {
                process.kill('SIGTERM');
                
                // Wait for graceful shutdown
                await new Promise(resolve => {
                    process.on('exit', resolve);
                    setTimeout(() => {
                        if (!process.killed) {
                            process.kill('SIGKILL');
                        }
                        resolve();
                    }, 5000);
                });
            }
        }
        
        console.log('🧹 E2E test cleanup completed');
    }, 15000);
    
    describe('Complete Server Lifecycle', () => {
        test('should start MCP server and dashboard', async () => {
            // Start MCP Debug Host Server
            mcpServerProcess = spawn('node', [
                path.join(__dirname, '../../src/index.js'),
                '--test-mode'
            ], {
                env: {
                    ...process.env,
                    NODE_ENV: 'test',
                    TEST_API_KEY: testApiKey,
                    LOG_LEVEL: 'error'
                },
                stdio: ['pipe', 'pipe', 'pipe']
            });
            
            let serverOutput = '';
            mcpServerProcess.stdout.on('data', (data) => {
                serverOutput += data.toString();
            });
            
            mcpServerProcess.stderr.on('data', (data) => {
                console.error('🔴 MCP Server Error:', data.toString());
            });
            
            // Wait for server to start
            const serverStarted = await new Promise((resolve) => {
                const checkStarted = () => {
                    if (serverOutput.includes('Server started') || 
                        serverOutput.includes('listening') ||
                        serverOutput.includes('ready')) {
                        resolve(true);
                    } else if (mcpServerProcess.killed) {
                        resolve(false);
                    } else {
                        setTimeout(checkStarted, 500);
                    }
                };
                
                checkStarted();
                
                // Timeout after 15 seconds
                setTimeout(() => resolve(false), 15000);
            });
            
            expect(serverStarted).toBe(true);
            expect(mcpServerProcess.killed).toBe(false);
            
            console.log('✅ MCP Debug Host Server started successfully');
        }, 20000);
        
        test('should connect to dashboard via HTTP', async () => {
            // Test dashboard HTTP endpoint
            const response = await request(baseUrl)
                .get('/')
                .timeout(10000);
            
            expect(response.status).toBe(200);
            expect(response.text).toContain('html');
            
            console.log('✅ Dashboard HTTP connection established');
        });
        
        test('should establish WebSocket connection', async () => {
            const ws = new WebSocket(wsUrl);
            
            const connected = await new Promise((resolve) => {
                ws.on('open', () => resolve(true));
                ws.on('error', () => resolve(false));
                
                setTimeout(() => resolve(false), 10000);
            });
            
            expect(connected).toBe(true);
            
            // Clean up
            if (ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
            
            console.log('✅ WebSocket connection established');
        });
    });
    
    describe('Server Process Management Workflow', () => {
        let testProcess;
        let processId;
        
        test('should start a new server process', async () => {
            const startRequest = {
                type: 'node',
                command: 'node',
                args: ['-e', `
                    console.log('Test server started');
                    let counter = 0;
                    const interval = setInterval(() => {
                        console.log('Test server running:', ++counter);
                        if (counter >= 5) {
                            clearInterval(interval);
                            console.log('Test server finished');
                            process.exit(0);
                        }
                    }, 1000);
                `],
                port: 8888,
                directory: process.cwd()
            };
            
            const response = await request(baseUrl)
                .post('/api/servers/start')
                .set('Authorization', `Bearer ${testApiKey}`)
                .send(startRequest)
                .timeout(10000);
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('processId');
            
            processId = response.body.processId;
            testProcess = response.body;
            
            console.log(`✅ Started test process: ${processId}`);
        });
        
        test('should retrieve server status', async () => {
            const response = await request(baseUrl)
                .get(`/api/servers/${processId}/status`)
                .set('Authorization', `Bearer ${testApiKey}`)
                .timeout(5000);
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('processId', processId);
            expect(response.body).toHaveProperty('status');
            expect(response.body.status).toMatch(/running|stopped|finished/);
            
            console.log(`✅ Retrieved status: ${response.body.status}`);
        });
        
        test('should retrieve server logs', async () => {
            // Wait a bit for logs to generate
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const response = await request(baseUrl)
                .get(`/api/servers/${processId}/logs`)
                .set('Authorization', `Bearer ${testApiKey}`)
                .timeout(10000);
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('logs');
            expect(Array.isArray(response.body.logs)).toBe(true);
            
            if (response.body.logs.length > 0) {
                const logEntry = response.body.logs[0];
                expect(logEntry).toHaveProperty('timestamp');
                expect(logEntry).toHaveProperty('level');
                expect(logEntry).toHaveProperty('message');
            }
            
            console.log(`✅ Retrieved ${response.body.logs.length} log entries`);
        });
        
        test('should list all servers', async () => {
            const response = await request(baseUrl)
                .get('/api/servers')
                .set('Authorization', `Bearer ${testApiKey}`)
                .timeout(5000);
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('servers');
            expect(Array.isArray(response.body.servers)).toBe(true);
            
            // Should include our test process
            const ourProcess = response.body.servers.find(s => s.processId === processId);
            expect(ourProcess).toBeDefined();
            
            console.log(`✅ Listed ${response.body.servers.length} servers`);
        });
        
        test('should stop server process', async () => {
            // Wait for process to finish naturally or stop it
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            const response = await request(baseUrl)
                .post(`/api/servers/${processId}/stop`)
                .set('Authorization', `Bearer ${testApiKey}`)
                .timeout(10000);
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);
            
            // Verify process is stopped
            const statusResponse = await request(baseUrl)
                .get(`/api/servers/${processId}/status`)
                .set('Authorization', `Bearer ${testApiKey}`)
                .timeout(5000);
            
            expect(statusResponse.body.status).toMatch(/stopped|finished|exited/);
            
            console.log(`✅ Stopped test process: ${processId}`);
        });
    });
    
    describe('Real-time Log Streaming Workflow', () => {
        test('should stream logs via WebSocket', async () => {
            const ws = new WebSocket(wsUrl);
            const receivedMessages = [];
            
            // Connect to WebSocket
            await new Promise((resolve, reject) => {
                ws.on('open', resolve);
                ws.on('error', reject);
                setTimeout(() => reject(new Error('WebSocket connection timeout')), 10000);
            });
            
            // Set up message handler
            ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data.toString());
                    receivedMessages.push(message);
                } catch (error) {
                    receivedMessages.push({ raw: data.toString() });
                }
            });
            
            // Start a process that generates logs
            const startRequest = {
                type: 'node',
                command: 'node',
                args: ['-e', `
                    console.log('WebSocket test started');
                    for (let i = 1; i <= 5; i++) {
                        console.log('Log message', i);
                        console.error('Error message', i);
                    }
                    setTimeout(() => {
                        console.log('WebSocket test completed');
                        process.exit(0);
                    }, 1000);
                `],
                directory: process.cwd()
            };
            
            const startResponse = await request(baseUrl)
                .post('/api/servers/start')
                .set('Authorization', `Bearer ${testApiKey}`)
                .send(startRequest);
            
            expect(startResponse.status).toBe(200);
            
            const processId = startResponse.body.processId;
            
            // Wait for logs to be generated and streamed
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            // Clean up process
            await request(baseUrl)
                .post(`/api/servers/${processId}/stop`)
                .set('Authorization', `Bearer ${testApiKey}`);
            
            // Clean up WebSocket
            ws.close();
            
            // Verify we received log messages
            expect(receivedMessages.length).toBeGreaterThan(0);
            
            const logMessages = receivedMessages.filter(msg => 
                msg.type === 'log' || 
                msg.message || 
                (typeof msg === 'string' && msg.includes('Log message'))
            );
            
            console.log(`✅ Received ${receivedMessages.length} WebSocket messages, ${logMessages.length} log messages`);
        }, 20000);
    });
    
    describe('Technology Stack Detection Workflow', () => {
        test('should detect Node.js project structure', async () => {
            // Create temporary project structure
            const tempDir = global.createTempDir();
            
            // Create package.json
            const packageJson = {
                name: 'test-project',
                version: '1.0.0',
                scripts: {
                    start: 'node server.js',
                    dev: 'nodemon server.js'
                },
                dependencies: {
                    express: '^4.18.0'
                }
            };
            
            await fs.writeFile(
                path.join(tempDir, 'package.json'),
                JSON.stringify(packageJson, null, 2)
            );
            
            // Create server.js
            await fs.writeFile(
                path.join(tempDir, 'server.js'),
                `
                const express = require('express');
                const app = express();
                const port = process.env.PORT || 3000;
                
                app.get('/', (req, res) => {
                    res.send('Hello World!');
                });
                
                app.listen(port, () => {
                    console.log('Server running on port', port);
                });
                `
            );
            
            // Test detection API
            const response = await request(baseUrl)
                .post('/api/detect-stack')
                .set('Authorization', `Bearer ${testApiKey}`)
                .send({ directory: tempDir })
                .timeout(10000);
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('detected', true);
            expect(response.body).toHaveProperty('type', 'node');
            expect(response.body).toHaveProperty('framework');
            expect(response.body).toHaveProperty('startCommand');
            expect(response.body).toHaveProperty('port');
            
            console.log(`✅ Detected stack:`, response.body);
        });
        
        test('should detect Python project structure', async () => {
            const tempDir = global.createTempDir();
            
            // Create requirements.txt
            await fs.writeFile(
                path.join(tempDir, 'requirements.txt'),
                'flask==2.3.0\\ngunicorn==20.1.0'
            );
            
            // Create app.py
            await fs.writeFile(
                path.join(tempDir, 'app.py'),
                `
                from flask import Flask
                
                app = Flask(__name__)
                
                @app.route('/')
                def hello():
                    return 'Hello World!'
                
                if __name__ == '__main__':
                    app.run(host='0.0.0.0', port=5000)
                `
            );
            
            const response = await request(baseUrl)
                .post('/api/detect-stack')
                .set('Authorization', `Bearer ${testApiKey}`)
                .send({ directory: tempDir })
                .timeout(10000);
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('detected', true);
            expect(response.body).toHaveProperty('type', 'python');
            
            console.log(`✅ Detected Python stack:`, response.body);
        });
    });
    
    describe('Error Handling and Recovery Workflow', () => {
        test('should handle invalid process start gracefully', async () => {
            const invalidRequest = {
                type: 'invalid',
                command: 'nonexistent-command-12345',
                args: ['--invalid-flag'],
                directory: '/nonexistent/directory'
            };
            
            const response = await request(baseUrl)
                .post('/api/servers/start')
                .set('Authorization', `Bearer ${testApiKey}`)
                .send(invalidRequest)
                .timeout(10000);
            
            // Should handle error gracefully
            expect(response.status).toBeGreaterThanOrEqual(400);
            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toMatch(/invalid|not found|failed/i);
            
            console.log(`✅ Handled invalid process start: ${response.body.error}`);
        });
        
        test('should handle WebSocket disconnection gracefully', async () => {
            const ws = new WebSocket(wsUrl);
            
            // Connect
            await new Promise((resolve, reject) => {
                ws.on('open', resolve);
                ws.on('error', reject);
                setTimeout(() => reject(new Error('Connection timeout')), 5000);
            });
            
            let disconnected = false;
            ws.on('close', () => {
                disconnected = true;
            });
            
            // Force disconnect
            ws.terminate();
            
            // Wait for disconnection
            await new Promise(resolve => {
                const checkDisconnected = () => {
                    if (disconnected) {
                        resolve();
                    } else {
                        setTimeout(checkDisconnected, 100);
                    }
                };
                checkDisconnected();
            });
            
            expect(disconnected).toBe(true);
            
            console.log('✅ WebSocket disconnection handled gracefully');
        });
        
        test('should recover from process crashes', async () => {
            // Start a process that will crash
            const crashRequest = {
                type: 'node',
                command: 'node',
                args: ['-e', `
                    console.log('Process started');
                    setTimeout(() => {
                        console.log('Process about to crash');
                        process.exit(1);
                    }, 1000);
                `],
                directory: process.cwd()
            };
            
            const startResponse = await request(baseUrl)
                .post('/api/servers/start')
                .set('Authorization', `Bearer ${testApiKey}`)
                .send(crashRequest);
            
            expect(startResponse.status).toBe(200);
            const processId = startResponse.body.processId;
            
            // Wait for process to crash
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Check status - should show crashed/failed
            const statusResponse = await request(baseUrl)
                .get(`/api/servers/${processId}/status`)
                .set('Authorization', `Bearer ${testApiKey}`);
            
            expect(statusResponse.status).toBe(200);
            expect(statusResponse.body.status).toMatch(/stopped|failed|exited|crashed/);
            expect(statusResponse.body).toHaveProperty('exitCode');
            expect(statusResponse.body.exitCode).not.toBe(0);
            
            console.log(`✅ Process crash detected and handled: ${statusResponse.body.status}`);
        });
    });
    
    describe('Configuration and Environment Workflow', () => {
        test('should load and apply configuration', async () => {
            const configResponse = await request(baseUrl)
                .get('/api/config')
                .set('Authorization', `Bearer ${testApiKey}`)
                .timeout(5000);
            
            expect(configResponse.status).toBe(200);
            expect(configResponse.body).toHaveProperty('config');
            
            const config = configResponse.body.config;
            expect(config).toHaveProperty('server');
            expect(config).toHaveProperty('logging');
            
            console.log('✅ Configuration loaded successfully');
        });
        
        test('should handle environment-specific settings', async () => {
            // Test different environment configurations
            const envResponse = await request(baseUrl)
                .get('/api/environment')
                .set('Authorization', `Bearer ${testApiKey}`)
                .timeout(5000);
            
            expect(envResponse.status).toBe(200);
            expect(envResponse.body).toHaveProperty('environment');
            expect(envResponse.body.environment).toMatch(/development|test|production/);
            
            console.log(`✅ Environment: ${envResponse.body.environment}`);
        });
    });
    
    describe('Cleanup and Shutdown Workflow', () => {
        test('should perform graceful shutdown', async () => {
            // Test shutdown endpoint
            const shutdownResponse = await request(baseUrl)
                .post('/api/shutdown')
                .set('Authorization', `Bearer ${testApiKey}`)
                .timeout(10000);
            
            expect(shutdownResponse.status).toBe(200);
            expect(shutdownResponse.body).toHaveProperty('message');
            expect(shutdownResponse.body.message).toMatch(/shutdown|stopping/i);
            
            console.log('✅ Graceful shutdown initiated');
        });
    });
});