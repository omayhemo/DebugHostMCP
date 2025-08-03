/**
 * Test Utilities and Helper Functions
 * Comprehensive utilities for testing setup, mocking, and assertions
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { EventEmitter } = require('events');

/**
 * Test Data Generators
 */
class TestDataGenerator {
    static generateRandomString(length = 10) {
        return crypto.randomBytes(length).toString('hex').slice(0, length);
    }
    
    static generateRandomEmail() {
        const username = this.generateRandomString(8);
        const domain = this.generateRandomString(6);
        return `${username}@${domain}.test`;
    }
    
    static generateApiKey() {
        return crypto.randomBytes(32).toString('hex');
    }
    
    static generateProcessConfig(overrides = {}) {
        return {
            type: 'node',
            command: 'node',
            args: ['-e', 'console.log("Test process")'],
            port: Math.floor(Math.random() * 10000) + 3000,
            directory: process.cwd(),
            env: { NODE_ENV: 'test' },
            ...overrides
        };
    }
    
    static generateLogEntry(overrides = {}) {
        return {
            timestamp: new Date().toISOString(),
            level: 'info',
            message: `Test log message ${this.generateRandomString(6)}`,
            processId: this.generateRandomString(8),
            source: 'stdout',
            ...overrides
        };
    }
    
    static generateMockServer(port = 3000) {
        return {
            processId: this.generateRandomString(8),
            type: 'node',
            command: 'node',
            args: ['server.js'],
            port: port,
            status: 'running',
            pid: Math.floor(Math.random() * 10000) + 1000,
            startTime: new Date(Date.now() - Math.random() * 3600000).toISOString(),
            directory: '/test/project'
        };
    }
}

/**
 * Mock Factories
 */
class MockFactory {
    static createMockFileSystem() {
        const mockFs = {
            files: new Map(),
            directories: new Set()
        };
        
        return {
            async readFile(filepath, encoding = 'utf8') {
                if (!mockFs.files.has(filepath)) {
                    throw new Error(`ENOENT: no such file or directory, open '${filepath}'`);
                }
                return mockFs.files.get(filepath);
            },
            
            async writeFile(filepath, content) {
                const dir = path.dirname(filepath);
                mockFs.directories.add(dir);
                mockFs.files.set(filepath, content);
            },
            
            async mkdir(dirpath, options = {}) {
                mockFs.directories.add(dirpath);
            },
            
            async access(filepath, mode) {
                if (!mockFs.files.has(filepath) && !mockFs.directories.has(filepath)) {
                    throw new Error(`ENOENT: no such file or directory, access '${filepath}'`);
                }
            },
            
            async stat(filepath) {
                if (mockFs.files.has(filepath)) {
                    return {
                        isFile: () => true,
                        isDirectory: () => false,
                        size: mockFs.files.get(filepath).length,
                        mtime: new Date()
                    };
                }
                
                if (mockFs.directories.has(filepath)) {
                    return {
                        isFile: () => false,
                        isDirectory: () => true,
                        size: 0,
                        mtime: new Date()
                    };
                }
                
                throw new Error(`ENOENT: no such file or directory, stat '${filepath}'`);
            },
            
            async readdir(dirpath) {
                const items = [];
                
                for (const file of mockFs.files.keys()) {
                    if (path.dirname(file) === dirpath) {
                        items.push(path.basename(file));
                    }
                }
                
                for (const dir of mockFs.directories) {
                    if (path.dirname(dir) === dirpath) {
                        items.push(path.basename(dir));
                    }
                }
                
                return items;
            },
            
            // Test utilities
            _addFile(filepath, content) {
                mockFs.files.set(filepath, content);
            },
            
            _addDirectory(dirpath) {
                mockFs.directories.add(dirpath);
            },
            
            _clear() {
                mockFs.files.clear();
                mockFs.directories.clear();
            },
            
            _getState() {
                return {
                    files: Array.from(mockFs.files.entries()),
                    directories: Array.from(mockFs.directories)
                };
            }
        };
    }
    
    static createMockProcess(config = {}) {
        class MockProcess extends EventEmitter {
            constructor() {
                super();
                this.pid = config.pid || Math.floor(Math.random() * 10000) + 1000;
                this.exitCode = null;
                this.killed = false;
                this.stdout = new EventEmitter();
                this.stderr = new EventEmitter();
                this.stdin = new EventEmitter();
                this.spawnargs = config.args || [];
                this.spawnfile = config.command || 'node';
                
                // Simulate process behavior
                if (config.autoExit !== false) {
                    setTimeout(() => {
                        this.exitCode = config.exitCode || 0;
                        this.emit('exit', this.exitCode, null);
                    }, config.exitDelay || 100);
                }
                
                if (config.stdout) {
                    setTimeout(() => {
                        this.stdout.emit('data', Buffer.from(config.stdout));
                    }, 50);
                }
                
                if (config.stderr) {
                    setTimeout(() => {
                        this.stderr.emit('data', Buffer.from(config.stderr));
                    }, 50);
                }
            }
            
            kill(signal = 'SIGTERM') {
                this.killed = true;
                this.exitCode = signal === 'SIGKILL' ? 137 : 0;
                setTimeout(() => {
                    this.emit('exit', this.exitCode, signal);
                }, 10);
            }
            
            send(message) {
                setTimeout(() => {
                    this.emit('message', message);
                }, 10);
            }
        }
        
        return new MockProcess();
    }
    
    static createMockHttpServer(port = 3000) {
        const server = new EventEmitter();
        
        server.listen = (portArg, callback) => {
            server.port = portArg || port;
            server.listening = true;
            if (callback) callback();
            setTimeout(() => server.emit('listening'), 10);
            return server;
        };
        
        server.close = (callback) => {
            server.listening = false;
            if (callback) callback();
            setTimeout(() => server.emit('close'), 10);
        };
        
        server.address = () => ({
            port: server.port,
            address: '127.0.0.1',
            family: 'IPv4'
        });
        
        return server;
    }
    
    static createMockWebSocket() {
        class MockWebSocket extends EventEmitter {
            constructor() {
                super();
                this.readyState = 1; // OPEN
                this.CONNECTING = 0;
                this.OPEN = 1;
                this.CLOSING = 2;
                this.CLOSED = 3;
                this._messages = [];
                
                // Auto-connect after a short delay
                setTimeout(() => {
                    if (this.readyState === this.CONNECTING) {
                        this.readyState = this.OPEN;
                        this.emit('open');
                    }
                }, 10);
            }
            
            send(data) {
                if (this.readyState !== this.OPEN) {
                    throw new Error('WebSocket is not open');
                }
                
                this._messages.push(data);
                
                // Echo back for testing
                setTimeout(() => {
                    if (this.readyState === this.OPEN) {
                        this.emit('message', { data });
                    }
                }, 10);
            }
            
            close(code, reason) {
                this.readyState = this.CLOSED;
                setTimeout(() => {
                    this.emit('close', code || 1000, reason || '');
                }, 10);
            }
            
            terminate() {
                this.readyState = this.CLOSED;
                setTimeout(() => {
                    this.emit('close', 1006, 'Connection terminated');
                }, 5);
            }
            
            ping() {
                setTimeout(() => {
                    if (this.readyState === this.OPEN) {
                        this.emit('pong');
                    }
                }, 10);
            }
            
            // Test utilities
            _getMessages() {
                return [...this._messages];
            }
            
            _simulateMessage(data) {
                if (this.readyState === this.OPEN) {
                    this.emit('message', { data });
                }
            }
            
            _simulateError(error) {
                this.emit('error', error);
            }
        }
        
        return new MockWebSocket();
    }
}

/**
 * Test Assertions and Validators
 */
class TestValidators {
    static validateProcessConfig(config) {
        const required = ['type', 'command'];
        const optional = ['args', 'port', 'directory', 'env'];
        
        const errors = [];
        
        // Check required fields
        for (const field of required) {
            if (!config.hasOwnProperty(field)) {
                errors.push(`Missing required field: ${field}`);
            }
        }
        
        // Validate types
        if (config.type && typeof config.type !== 'string') {
            errors.push('Type must be a string');
        }
        
        if (config.command && typeof config.command !== 'string') {
            errors.push('Command must be a string');
        }
        
        if (config.args && !Array.isArray(config.args)) {
            errors.push('Args must be an array');
        }
        
        if (config.port && (typeof config.port !== 'number' || config.port < 1 || config.port > 65535)) {
            errors.push('Port must be a number between 1 and 65535');
        }
        
        if (config.directory && typeof config.directory !== 'string') {
            errors.push('Directory must be a string');
        }
        
        if (config.env && typeof config.env !== 'object') {
            errors.push('Environment must be an object');
        }
        
        return {
            valid: errors.length === 0,
            errors
        };
    }
    
    static validateLogEntry(logEntry) {
        const required = ['timestamp', 'level', 'message'];
        const validLevels = ['error', 'warn', 'info', 'debug'];
        
        const errors = [];
        
        // Check required fields
        for (const field of required) {
            if (!logEntry.hasOwnProperty(field)) {
                errors.push(`Missing required field: ${field}`);
            }
        }
        
        // Validate timestamp
        if (logEntry.timestamp && isNaN(new Date(logEntry.timestamp).getTime())) {
            errors.push('Invalid timestamp format');
        }
        
        // Validate level
        if (logEntry.level && !validLevels.includes(logEntry.level)) {
            errors.push(`Invalid log level: ${logEntry.level}`);
        }
        
        // Validate message
        if (logEntry.message && typeof logEntry.message !== 'string') {
            errors.push('Message must be a string');
        }
        
        return {
            valid: errors.length === 0,
            errors
        };
    }
    
    static validateApiResponse(response, expectedFields = []) {
        const errors = [];
        
        // Check status code
        if (!response.status || response.status < 200 || response.status >= 600) {
            errors.push(`Invalid status code: ${response.status}`);
        }
        
        // Check expected fields
        for (const field of expectedFields) {
            if (!response.body || !response.body.hasOwnProperty(field)) {
                errors.push(`Missing expected field: ${field}`);
            }
        }
        
        // Check for error responses
        if (response.status >= 400 && (!response.body || !response.body.error)) {
            errors.push('Error response missing error field');
        }
        
        return {
            valid: errors.length === 0,
            errors
        };
    }
    
    static validateWebSocketMessage(message) {
        const errors = [];
        
        try {
            const parsed = typeof message === 'string' ? JSON.parse(message) : message;
            
            if (!parsed.type) {
                errors.push('Message missing type field');
            }
            
            if (!parsed.timestamp) {
                errors.push('Message missing timestamp field');
            } else if (isNaN(new Date(parsed.timestamp).getTime())) {
                errors.push('Invalid timestamp format');
            }
            
            return {
                valid: errors.length === 0,
                errors,
                parsed
            };
            
        } catch (error) {
            return {
                valid: false,
                errors: ['Invalid JSON format'],
                parsed: null
            };
        }
    }
}

/**
 * Test Environment Utilities
 */
class TestEnvironment {
    static async setupTestDatabase() {
        const db = new Map();
        
        return {
            async get(key) {
                return db.get(key);
            },
            
            async set(key, value) {
                db.set(key, value);
                return true;
            },
            
            async delete(key) {
                return db.delete(key);
            },
            
            async clear() {
                db.clear();
                return true;
            },
            
            async keys() {
                return Array.from(db.keys());
            },
            
            async size() {
                return db.size;
            }
        };
    }
    
    static createTestServer(port = 0) {
        const http = require('http');
        
        const server = http.createServer((req, res) => {
            let body = '';
            
            req.on('data', chunk => {
                body += chunk.toString();
            });
            
            req.on('end', () => {
                const response = {
                    method: req.method,
                    url: req.url,
                    headers: req.headers,
                    body: body || null,
                    timestamp: new Date().toISOString()
                };
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(response));
            });
        });
        
        return new Promise((resolve) => {
            server.listen(port, () => {
                const actualPort = server.address().port;
                resolve({
                    server,
                    port: actualPort,
                    url: `http://localhost:${actualPort}`,
                    close: () => new Promise(resolveClose => server.close(resolveClose))
                });
            });
        });
    }
    
    static async waitForCondition(condition, timeout = 5000, interval = 100) {
        const startTime = Date.now();
        
        while (Date.now() - startTime < timeout) {
            if (await condition()) {
                return true;
            }
            
            await new Promise(resolve => setTimeout(resolve, interval));
        }
        
        return false;
    }
    
    static async waitForPort(port, timeout = 10000) {
        const net = require('net');
        
        return this.waitForCondition(async () => {
            return new Promise(resolve => {
                const socket = new net.Socket();
                
                socket.setTimeout(1000);
                
                socket.on('connect', () => {
                    socket.destroy();
                    resolve(true);
                });
                
                socket.on('timeout', () => {
                    socket.destroy();
                    resolve(false);
                });
                
                socket.on('error', () => {
                    resolve(false);
                });
                
                socket.connect(port, 'localhost');
            });
        }, timeout);
    }
    
    static measureExecutionTime(fn) {
        const start = process.hrtime.bigint();
        const result = fn();
        
        if (result && typeof result.then === 'function') {
            return result.then(value => {
                const end = process.hrtime.bigint();
                const duration = Number(end - start) / 1000000; // Convert to milliseconds
                
                return {
                    value,
                    duration
                };
            });
        } else {
            const end = process.hrtime.bigint();
            const duration = Number(end - start) / 1000000;
            
            return {
                value: result,
                duration
            };
        }
    }
}

/**
 * Test Cleanup Utilities
 */
class TestCleanup {
    static processes = new Set();
    static servers = new Set();
    static tempFiles = new Set();
    static timers = new Set();
    
    static trackProcess(process) {
        this.processes.add(process);
        
        process.on('exit', () => {
            this.processes.delete(process);
        });
        
        return process;
    }
    
    static trackServer(server) {
        this.servers.add(server);
        return server;
    }
    
    static trackTempFile(filepath) {
        this.tempFiles.add(filepath);
        return filepath;
    }
    
    static trackTimer(timer) {
        this.timers.add(timer);
        return timer;
    }
    
    static async cleanupAll() {
        // Kill processes
        for (const process of this.processes) {
            if (!process.killed) {
                process.kill('SIGKILL');
            }
        }
        this.processes.clear();
        
        // Close servers
        for (const server of this.servers) {
            if (server.listening) {
                server.close();
            }
        }
        this.servers.clear();
        
        // Delete temp files
        for (const filepath of this.tempFiles) {
            try {
                await fs.unlink(filepath);
            } catch (error) {
                // Ignore errors
            }
        }
        this.tempFiles.clear();
        
        // Clear timers
        for (const timer of this.timers) {
            clearTimeout(timer);
            clearInterval(timer);
        }
        this.timers.clear();
    }
}

module.exports = {
    TestDataGenerator,
    MockFactory,
    TestValidators,
    TestEnvironment,
    TestCleanup
};