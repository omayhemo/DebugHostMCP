/**
 * Log Management Integration Tests
 * Story 2.3: Comprehensive testing of log collection, storage, streaming, and search
 */

const { LogCollector } = require('../../src/services/log-collector');
const { LogStorage } = require('../../src/services/log-storage');
const { LogStreamer } = require('../../src/services/log-streamer');
const { LogSearch } = require('../../src/services/log-search');
const Docker = require('dockerode');
const fs = require('fs').promises;
const path = require('path');
const { EventEmitter } = require('events');

// Test configuration
const TEST_TIMEOUT = 30000;
const TEST_DATA_DIR = path.join(__dirname, '../test-data/logs');
const TEST_CONTAINER_NAME = 'test-log-container';

describe('Log Management Integration Tests', () => {
  let logCollector;
  let logStorage;
  let logStreamer;
  let logSearch;
  let docker;
  let testContainer;

  beforeAll(async () => {
    // Initialize Docker client
    docker = new Docker();
    
    // Clean test data directory
    await fs.rm(TEST_DATA_DIR, { recursive: true, force: true });
    await fs.mkdir(TEST_DATA_DIR, { recursive: true });
  }, TEST_TIMEOUT);

  beforeEach(async () => {
    // Initialize services with test configuration
    logStorage = new LogStorage({
      baseDir: TEST_DATA_DIR,
      maxFileSize: 1024 * 1024, // 1MB for testing
      maxFileAge: 60000, // 1 minute for testing
      compressionEnabled: true,
      rotationCheckInterval: 5000 // 5 seconds for testing
    });
    
    logCollector = new LogCollector();
    logStreamer = new LogStreamer();
    logSearch = new LogSearch();
    
    // Initialize services
    await logStorage.initialize();
    await logCollector.initialize();
    await logStreamer.initialize();
    await logSearch.initialize();
  });

  afterEach(async () => {
    // Cleanup services
    if (logCollector) {
      await logCollector.stopAll();
    }
    if (logStreamer) {
      await logStreamer.shutdown();
    }
    if (logSearch) {
      await logSearch.shutdown();
    }
    if (logStorage) {
      await logStorage.shutdown();
    }
    
    // Stop test container if exists
    if (testContainer) {
      try {
        await testContainer.stop();
        await testContainer.remove();
      } catch (error) {
        // Container might already be stopped
      }
      testContainer = null;
    }
  });

  afterAll(async () => {
    // Final cleanup
    await fs.rm(TEST_DATA_DIR, { recursive: true, force: true });
  });

  describe('LogCollector', () => {
    test('should collect logs from container stdout/stderr', async () => {
      // Create a test container that outputs logs
      testContainer = await docker.createContainer({
        Image: 'alpine',
        name: TEST_CONTAINER_NAME,
        Cmd: ['sh', '-c', 'echo "Starting test"; echo "Error message" >&2; sleep 2; echo "Ending test"'],
        HostConfig: {
          AutoRemove: false
        }
      });
      
      await testContainer.start();
      
      const collectedLogs = [];
      logCollector.on('log', (log) => {
        collectedLogs.push(log);
      });
      
      // Start collecting logs
      const started = await logCollector.startCollection(TEST_CONTAINER_NAME);
      expect(started).toBe(true);
      
      // Wait for logs to be collected
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Verify logs were collected
      expect(collectedLogs.length).toBeGreaterThan(0);
      
      // Check for stdout logs
      const stdoutLogs = collectedLogs.filter(log => log.stream === 'stdout');
      expect(stdoutLogs.some(log => log.message.includes('Starting test'))).toBe(true);
      
      // Check for stderr logs
      const stderrLogs = collectedLogs.filter(log => log.stream === 'stderr');
      expect(stderrLogs.some(log => log.message.includes('Error message'))).toBe(true);
    }, TEST_TIMEOUT);

    test('should detect log levels correctly', () => {
      const testCases = [
        { message: 'Error: Connection failed', expected: 'error' },
        { message: 'WARNING: High memory usage', expected: 'warn' },
        { message: 'INFO: Server started', expected: 'info' },
        { message: 'DEBUG: Processing request', expected: 'debug' },
        { message: 'Regular log message', expected: 'info' }
      ];
      
      for (const testCase of testCases) {
        const level = logCollector.detectLogLevel(testCase.message);
        expect(level).toBe(testCase.expected);
      }
    });

    test('should manage buffers correctly', () => {
      const containerName = 'test-container';
      
      // Add logs to buffer
      for (let i = 0; i < 100; i++) {
        logCollector.addToBuffer(containerName, {
          containerName,
          timestamp: Date.now(),
          level: 'info',
          stream: 'stdout',
          message: `Test log ${i}`
        });
      }
      
      // Get buffered logs
      const logs = logCollector.getBufferedLogs(containerName);
      expect(logs.length).toBe(100);
      
      // Test filtering
      const filtered = logCollector.getBufferedLogs(containerName, {
        limit: 10
      });
      expect(filtered.length).toBe(10);
      
      // Clear buffer
      logCollector.clearBuffer(containerName);
      const cleared = logCollector.getBufferedLogs(containerName);
      expect(cleared.length).toBe(0);
    });
  });

  describe('LogStorage', () => {
    test('should write and read logs persistently', async () => {
      const containerName = 'test-container';
      const testLogs = [
        {
          timestamp: Date.now(),
          level: 'info',
          stream: 'stdout',
          message: 'Test log 1'
        },
        {
          timestamp: Date.now() + 1000,
          level: 'error',
          stream: 'stderr',
          message: 'Test error log'
        }
      ];
      
      // Write logs
      await logStorage.write(containerName, testLogs);
      
      // Read logs back
      const readLogs = await logStorage.read(containerName);
      expect(readLogs.length).toBe(2);
      expect(readLogs[0].message).toBe('Test log 1');
      expect(readLogs[1].level).toBe('error');
    });

    test('should rotate logs when size limit exceeded', async () => {
      const containerName = 'test-container-rotation';
      const largeLog = {
        timestamp: Date.now(),
        level: 'info',
        stream: 'stdout',
        message: 'x'.repeat(1024) // 1KB message
      };
      
      // Write logs until rotation happens
      for (let i = 0; i < 1100; i++) { // Should exceed 1MB limit
        await logStorage.write(containerName, largeLog);
      }
      
      // Check that archive directory was created
      const archiveDir = path.join(TEST_DATA_DIR, containerName, 'archive');
      const archiveExists = await fs.access(archiveDir).then(() => true).catch(() => false);
      expect(archiveExists).toBe(true);
      
      // Check that archived files exist
      const archiveFiles = await fs.readdir(archiveDir);
      expect(archiveFiles.length).toBeGreaterThan(0);
      expect(archiveFiles.some(f => f.endsWith('.gz'))).toBe(true);
    });

    test('should handle log filtering correctly', async () => {
      const containerName = 'test-filter';
      const testLogs = [
        { timestamp: Date.now() - 10000, level: 'info', stream: 'stdout', message: 'Old log' },
        { timestamp: Date.now() - 5000, level: 'warn', stream: 'stdout', message: 'Warning message' },
        { timestamp: Date.now(), level: 'error', stream: 'stderr', message: 'Error occurred' }
      ];
      
      await logStorage.write(containerName, testLogs);
      
      // Filter by level
      const errorLogs = await logStorage.read(containerName, { level: 'error' });
      expect(errorLogs.length).toBe(1);
      expect(errorLogs[0].message).toBe('Error occurred');
      
      // Filter by time range
      const recentLogs = await logStorage.read(containerName, {
        since: new Date(Date.now() - 6000)
      });
      expect(recentLogs.length).toBe(2);
    });
  });

  describe('LogStreamer', () => {
    test('should stream logs in real-time', async () => {
      const containerName = 'test-stream';
      const projectId = 'test-project';
      const receivedLogs = [];
      
      // Mock SSE response
      const mockRes = new EventEmitter();
      mockRes.writeHead = jest.fn();
      mockRes.write = jest.fn((data) => {
        if (data.includes('event: log')) {
          const match = data.match(/data: (.+)\n/);
          if (match) {
            receivedLogs.push(JSON.parse(match[1]));
          }
        }
      });
      mockRes.end = jest.fn();
      mockRes.destroyed = false;
      mockRes.headersSent = true;
      
      // Start streaming
      await logStreamer.startStreaming(mockRes, projectId, containerName, {
        follow: true,
        includeHistory: false
      });
      
      // Emit test logs
      logCollector.emit('log', {
        containerName,
        timestamp: Date.now(),
        level: 'info',
        stream: 'stdout',
        message: 'Real-time log message'
      });
      
      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Verify log was streamed
      expect(mockRes.write).toHaveBeenCalled();
    });

    test('should handle multiple concurrent streams', async () => {
      const containerName = 'test-multi-stream';
      const projectId = 'test-project';
      
      // Create multiple mock clients
      const clients = [];
      for (let i = 0; i < 3; i++) {
        const mockRes = new EventEmitter();
        mockRes.writeHead = jest.fn();
        mockRes.write = jest.fn();
        mockRes.end = jest.fn();
        mockRes.destroyed = false;
        mockRes.headersSent = true;
        clients.push(mockRes);
      }
      
      // Start multiple streams
      for (const client of clients) {
        await logStreamer.startStreaming(client, projectId, containerName, {
          follow: true
        });
      }
      
      // Check stats
      const stats = logStreamer.getStats();
      expect(stats.totalClients).toBe(3);
      
      // Stop one stream
      const firstClient = logStreamer.streamConfigs.keys().next().value;
      logStreamer.stopStreaming(firstClient);
      
      const updatedStats = logStreamer.getStats();
      expect(updatedStats.totalClients).toBe(2);
    });

    test('should export logs in different formats', async () => {
      const containerName = 'test-export';
      const testLogs = [
        { timestamp: Date.now(), level: 'info', stream: 'stdout', message: 'Log 1' },
        { timestamp: Date.now(), level: 'error', stream: 'stderr', message: 'Error log' }
      ];
      
      await logStorage.write(containerName, testLogs);
      
      // Export as JSON
      const jsonExport = await logStreamer.exportLogs(containerName, 'json');
      expect(jsonExport.contentType).toBe('application/json');
      const jsonData = JSON.parse(jsonExport.content);
      expect(jsonData.length).toBe(2);
      
      // Export as CSV
      const csvExport = await logStreamer.exportLogs(containerName, 'csv');
      expect(csvExport.contentType).toBe('text/csv');
      expect(csvExport.content).toContain('Timestamp,Level,Stream,Message');
      
      // Export as text
      const textExport = await logStreamer.exportLogs(containerName, 'text');
      expect(textExport.contentType).toBe('text/plain');
      expect(textExport.content).toContain('Log 1');
    });
  });

  describe('LogSearch', () => {
    beforeEach(async () => {
      // Add test data for search
      const containerName = 'test-search';
      const testLogs = [
        { timestamp: Date.now() - 10000, level: 'info', stream: 'stdout', message: 'Starting application server' },
        { timestamp: Date.now() - 9000, level: 'info', stream: 'stdout', message: 'Connected to database' },
        { timestamp: Date.now() - 8000, level: 'warn', stream: 'stdout', message: 'High memory usage detected' },
        { timestamp: Date.now() - 7000, level: 'error', stream: 'stderr', message: 'Database connection failed' },
        { timestamp: Date.now() - 6000, level: 'error', stream: 'stderr', message: 'Failed to connect to Redis' },
        { timestamp: Date.now() - 5000, level: 'info', stream: 'stdout', message: 'Request received from 192.168.1.1' },
        { timestamp: Date.now() - 4000, level: 'info', stream: 'stdout', message: 'Response time: 250ms' },
        { timestamp: Date.now() - 3000, level: 'debug', stream: 'stdout', message: 'Processing user request' }
      ];
      
      await logStorage.write(containerName, testLogs);
      await logSearch.indexContainer(containerName);
    });

    test('should search logs with basic text query', async () => {
      const results = await logSearch.search('database', {
        containers: ['test-search']
      });
      
      expect(results.totalMatches).toBe(2);
      expect(results.matches[0].logs.some(log => 
        log.message.includes('Connected to database')
      )).toBe(true);
    });

    test('should search with advanced query syntax', async () => {
      // Search with level filter
      const errorResults = await logSearch.search('level:error failed', {
        containers: ['test-search']
      });
      
      expect(errorResults.totalMatches).toBe(2);
      
      // Search with exclusion
      const excludeResults = await logSearch.search('connection -Redis', {
        containers: ['test-search']
      });
      
      expect(excludeResults.matches[0].logs.some(log => 
        log.message.includes('Redis')
      )).toBe(false);
    });

    test('should generate search facets', async () => {
      const results = await logSearch.search('', {
        containers: ['test-search'],
        includeFacets: true
      });
      
      expect(results.facets).toBeDefined();
      expect(results.facets.levels).toBeDefined();
      expect(results.facets.levels.info).toBeGreaterThan(0);
      expect(results.facets.levels.error).toBeGreaterThan(0);
    });

    test('should extract performance metrics', async () => {
      const containerName = 'test-metrics';
      const metricsLogs = [
        { timestamp: Date.now(), level: 'info', stream: 'stdout', message: 'Response time: 150ms' },
        { timestamp: Date.now(), level: 'info', stream: 'stdout', message: 'Memory: 512MB' },
        { timestamp: Date.now(), level: 'info', stream: 'stdout', message: 'CPU: 45%' }
      ];
      
      await logStorage.write(containerName, metricsLogs);
      await logSearch.indexContainer(containerName);
      
      const stats = await logSearch.getAggregatedStats(containerName);
      
      expect(stats.performanceMetrics).toBeDefined();
      expect(stats.performanceMetrics.response_time).toBeDefined();
      expect(stats.performanceMetrics.memory_usage).toBeDefined();
      expect(stats.performanceMetrics.cpu_usage).toBeDefined();
    });

    test('should handle regex search', async () => {
      const results = await logSearch.search('/\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}/', {
        containers: ['test-search']
      });
      
      // Should find log with IP address
      expect(results.totalMatches).toBeGreaterThan(0);
      expect(results.matches[0].logs.some(log => 
        log.message.includes('192.168.1.1')
      )).toBe(true);
    });
  });

  describe('End-to-End Integration', () => {
    test('should handle complete log lifecycle', async () => {
      const containerName = 'test-e2e';
      const projectId = 'test-project';
      
      // 1. Write initial logs
      const initialLogs = [
        { timestamp: Date.now() - 5000, level: 'info', stream: 'stdout', message: 'Application started' },
        { timestamp: Date.now() - 4000, level: 'info', stream: 'stdout', message: 'Server listening on port 3000' }
      ];
      await logStorage.write(containerName, initialLogs);
      
      // 2. Index for search
      await logSearch.indexContainer(containerName);
      
      // 3. Search logs
      const searchResults = await logSearch.search('server', {
        containers: [containerName]
      });
      expect(searchResults.totalMatches).toBe(1);
      
      // 4. Mock streaming client
      const mockRes = new EventEmitter();
      mockRes.writeHead = jest.fn();
      mockRes.write = jest.fn();
      mockRes.end = jest.fn();
      mockRes.destroyed = false;
      mockRes.headersSent = true;
      
      // 5. Start streaming with history
      await logStreamer.startStreaming(mockRes, projectId, containerName, {
        includeHistory: true,
        follow: true
      });
      
      // 6. Emit new log
      logCollector.emit('log', {
        containerName,
        timestamp: Date.now(),
        level: 'info',
        stream: 'stdout',
        message: 'New real-time log'
      });
      
      // 7. Export logs
      const exported = await logStreamer.exportLogs(containerName, 'json');
      const exportedData = JSON.parse(exported.content);
      expect(exportedData.length).toBeGreaterThanOrEqual(2);
      
      // 8. Get statistics
      const stats = await logSearch.getAggregatedStats(containerName);
      expect(stats.totalLogs).toBeGreaterThanOrEqual(2);
      expect(stats.levels.info).toBeGreaterThanOrEqual(2);
      
      // 9. Clear logs
      await logStreamer.clearLogs(containerName);
      const clearedLogs = await logStorage.read(containerName);
      expect(clearedLogs.length).toBe(0);
    }, TEST_TIMEOUT);
  });
});