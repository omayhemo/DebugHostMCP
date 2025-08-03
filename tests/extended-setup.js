/**
 * Extended Jest Setup - Advanced Testing Configuration
 * Comprehensive testing utilities, mocks, and environment setup
 */

const path = require('path');
const fs = require('fs').promises;
const tmp = require('tmp');
const { performance } = require('perf_hooks');

// Add jest-extended matchers
expect.extend({
  toHaveSize(received, expected) {
    const pass = received.size === expected;
    if (pass) {
      return {
        message: () => `expected ${received.constructor.name} not to have size ${expected}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received.constructor.name} to have size ${expected}, but got ${received.size}`,
        pass: false,
      };
    }
  }
});

// Global test configuration
global.__TESTING__ = true;
global.__TEST_START_TIME__ = Date.now();

// Performance monitoring
global.performanceMarks = new Map();

/**
 * Performance testing utilities
 */
global.markPerformance = (name) => {
    global.performanceMarks.set(name, performance.now());
};

global.measurePerformance = (name, startMark) => {
    const start = global.performanceMarks.get(startMark);
    const end = performance.now();
    const duration = end - start;
    
    console.log(`⚡ Performance: ${name} took ${duration.toFixed(2)}ms`);
    return duration;
};

/**
 * Advanced mock utilities
 */
global.createMockWebSocket = () => {
    const EventEmitter = require('events');
    
    class MockWebSocket extends EventEmitter {
        constructor() {
            super();
            this.readyState = 1; // OPEN
            this.CONNECTING = 0;
            this.OPEN = 1;
            this.CLOSING = 2;
            this.CLOSED = 3;
        }
        
        send(data) {
            setImmediate(() => this.emit('message', { data }));
        }
        
        close() {
            this.readyState = this.CLOSED;
            setImmediate(() => this.emit('close'));
        }
        
        ping() {
            setImmediate(() => this.emit('pong'));
        }
    }
    
    return new MockWebSocket();
};

/**
 * Security testing utilities
 */
global.generateSecurityTestCases = () => {
    return [
        // SQL Injection attempts
        "'; DROP TABLE users; --",
        "' OR '1'='1",
        "'; EXEC xp_cmdshell('dir'); --",
        
        // XSS attempts
        "<script>alert('xss')</script>",
        "javascript:alert('xss')",
        "<img src=x onerror=alert('xss')>",
        
        // Command injection
        "; cat /etc/passwd",
        "| whoami",
        "&& rm -rf /",
        
        // Path traversal
        "../../../etc/passwd",
        "..\\..\\..\\windows\\system32\\config\\sam",
        
        // NoSQL injection
        "{ $gt: '' }",
        "{ $where: 'this.password.length > 0' }",
        
        // LDAP injection
        "*)(uid=*))(|(uid=*",
        "admin)(&(password=*))",
        
        // Buffer overflow attempts
        "A".repeat(10000),
        "\x00".repeat(1000),
        
        // Special characters
        "' \" \\ / < > & | $ ` \n \r \t \0"
    ];
};

/**
 * Load testing utilities
 */
global.createLoadTestScenario = (concurrentUsers = 10, duration = 30000) => {
    return {
        config: {
            target: 'http://localhost',
            phases: [
                { duration: duration / 1000, arrivalRate: concurrentUsers }
            ]
        },
        scenarios: [
            {
                name: 'Default Load Test',
                weight: 100,
                flow: [
                    { get: { url: '/' } },
                    { think: 1 },
                    { get: { url: '/api/status' } }
                ]
            }
        ]
    };
};

/**
 * Cross-platform testing utilities
 */
global.getPlatformSpecificPaths = () => {
    const isWindows = process.platform === 'win32';
    const isMacOS = process.platform === 'darwin';
    const isLinux = process.platform === 'linux';
    
    return {
        isWindows,
        isMacOS,
        isLinux,
        pathSeparator: path.sep,
        tempDir: require('os').tmpdir(),
        homeDir: require('os').homedir(),
        executableExtension: isWindows ? '.exe' : '',
        scriptExtension: isWindows ? '.bat' : '.sh'
    };
};

/**
 * Advanced cleanup utilities
 */
global.advancedCleanup = async () => {
    // Clear all timers
    const timers = global.setTimeout.__timers__ || [];
    timers.forEach(timer => clearTimeout(timer));
    
    // Clear all intervals
    const intervals = global.setInterval.__intervals__ || [];
    intervals.forEach(interval => clearInterval(interval));
    
    // Force garbage collection if available
    if (global.gc) {
        global.gc();
    }
    
    // Clean up temporary files
    const tempFiles = global.__tempFiles__ || [];
    await Promise.all(tempFiles.map(async (file) => {
        try {
            await fs.unlink(file);
        } catch (error) {
            // Ignore cleanup errors
        }
    }));
    
    global.__tempFiles__ = [];
};

/**
 * Database testing utilities (for future database integration)
 */
global.createTestDatabase = async () => {
    // Mock database for testing
    const testDb = new Map();
    
    return {
        async insert(collection, data) {
            if (!testDb.has(collection)) {
                testDb.set(collection, []);
            }
            const items = testDb.get(collection);
            const item = { ...data, _id: Date.now() + Math.random() };
            items.push(item);
            return item;
        },
        
        async find(collection, query = {}) {
            if (!testDb.has(collection)) {
                return [];
            }
            
            const items = testDb.get(collection);
            if (Object.keys(query).length === 0) {
                return items;
            }
            
            return items.filter(item => {
                return Object.keys(query).every(key => item[key] === query[key]);
            });
        },
        
        async delete(collection, query) {
            if (!testDb.has(collection)) {
                return 0;
            }
            
            const items = testDb.get(collection);
            const initialLength = items.length;
            
            const filteredItems = items.filter(item => {
                return !Object.keys(query).every(key => item[key] === query[key]);
            });
            
            testDb.set(collection, filteredItems);
            return initialLength - filteredItems.length;
        },
        
        async clear() {
            testDb.clear();
        }
    };
};

/**
 * Network testing utilities
 */
global.createNetworkMock = () => {
    const responses = new Map();
    
    return {
        mockResponse(url, response) {
            responses.set(url, response);
        },
        
        async fetch(url, options = {}) {
            if (responses.has(url)) {
                const response = responses.get(url);
                return {
                    ok: response.status < 400,
                    status: response.status || 200,
                    json: async () => response.data || response,
                    text: async () => JSON.stringify(response.data || response)
                };
            }
            
            throw new Error(`Network mock: No response configured for ${url}`);
        },
        
        clearMocks() {
            responses.clear();
        }
    };
};

/**
 * File system testing utilities
 */
global.createTempFile = async (content = '', extension = '.tmp') => {
    const tempFile = tmp.tmpNameSync({ postfix: extension });
    await fs.writeFile(tempFile, content);
    
    // Track for cleanup
    if (!global.__tempFiles__) {
        global.__tempFiles__ = [];
    }
    global.__tempFiles__.push(tempFile);
    
    return tempFile;
};

global.createTempDir = () => {
    const tempDir = tmp.dirSync({ unsafeCleanup: true });
    
    // Track for cleanup
    if (!global.__tempDirs__) {
        global.__tempDirs__ = [];
    }
    global.__tempDirs__.push(tempDir);
    
    return tempDir.name;
};

/**
 * Process testing utilities
 */
global.createMockProcess = (command, args = []) => {
    const EventEmitter = require('events');
    
    class MockProcess extends EventEmitter {
        constructor() {
            super();
            this.pid = Math.floor(Math.random() * 10000) + 1000;
            this.exitCode = null;
            this.killed = false;
            this.connected = true;
            this.stdout = new EventEmitter();
            this.stderr = new EventEmitter();
            this.stdin = new EventEmitter();
        }
        
        kill(signal = 'SIGTERM') {
            this.killed = true;
            this.exitCode = signal === 'SIGKILL' ? 137 : 0;
            setImmediate(() => this.emit('exit', this.exitCode, signal));
        }
        
        disconnect() {
            this.connected = false;
            setImmediate(() => this.emit('disconnect'));
        }
        
        send(message) {
            setImmediate(() => this.emit('message', message));
        }
    }
    
    return new MockProcess();
};

// Global error handler for tests
process.on('unhandledRejection', (reason, promise) => {
    console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
    // Don't exit in tests, just log
});

process.on('uncaughtException', (error) => {
    console.error('🚨 Uncaught Exception:', error);
    // Don't exit in tests, just log
});

console.log('🧪 Extended test setup loaded with advanced utilities');