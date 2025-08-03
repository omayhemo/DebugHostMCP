/**
 * Tests for Log Store
 * Tests log storage, retrieval, rotation, and persistence operations
 */

const LogStore = require('../src/log-store');
const fs = require('fs').promises;
const path = require('path');

// Mock fs operations for controlled testing
jest.mock('fs', () => ({
  promises: {
    mkdir: jest.fn(),
    access: jest.fn(),
    readFile: jest.fn(),
    writeFile: jest.fn(),
    appendFile: jest.fn(),
    stat: jest.fn(),
    readdir: jest.fn(),
    unlink: jest.fn(),
    rename: jest.fn(),
    rmdir: jest.fn()
  }
}));

describe('LogStore', () => {
  let logStore;
  let mockLogger;
  let testStorePath;

  beforeEach(() => {
    mockLogger = global.mockLogger;
    testStorePath = path.join(global.TEST_CONFIG.testDir, 'log-store');
    
    // Create LogStore with constructor that allows path override
    logStore = new LogStore(mockLogger);
    logStore.storePath = testStorePath;
    
    // Reset all mocks
    jest.clearAllMocks();
    
    // Default successful mocks
    fs.mkdir.mockResolvedValue(undefined);
    fs.access.mockResolvedValue(undefined);
    fs.readdir.mockResolvedValue([]);
    fs.stat.mockResolvedValue({
      size: 1024,
      mtime: new Date(),
      isFile: () => true
    });
  });

  describe('Constructor and Initialization', () => {
    test('should initialize with correct storage path', () => {
      expect(logStore.storePath).toBe(testStorePath);
      expect(logStore.maxLogSize).toBe(10 * 1024 * 1024); // 10MB
      expect(logStore.maxLogAge).toBe(7 * 24 * 60 * 60 * 1000); // 7 days
    });

    test('should create storage directory on initialization', () => {
      expect(fs.mkdir).toHaveBeenCalledWith(testStorePath, { recursive: true });
    });

    test('should log successful initialization', () => {
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Log store initialized:',
        { storePath: testStorePath }
      );
    });

    test('should handle initialization errors gracefully', async () => {
      fs.mkdir.mockRejectedValue(new Error('Permission denied'));
      
      const store = new LogStore(mockLogger);
      await global.waitFor(10); // Wait for async initialization

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to initialize log store:',
        expect.objectContaining({
          error: 'Permission denied',
          storePath: expect.any(String)
        })
      );
    });
  });

  describe('storeLogs', () => {
    const sessionId = 'test-session-123';
    const testLogs = [
      { timestamp: Date.now() - 1000, type: 'stdout', data: 'Starting server...' },
      { timestamp: Date.now(), type: 'stderr', data: 'Warning: deprecated API' }
    ];

    test('should store logs to file', async () => {
      await logStore.storeLogs(sessionId, testLogs);

      const expectedFilePath = path.join(testStorePath, `${sessionId}.log`);
      expect(fs.appendFile).toHaveBeenCalledWith(
        expectedFilePath,
        expect.stringContaining('Starting server...')
      );
      expect(fs.appendFile).toHaveBeenCalledWith(
        expectedFilePath,
        expect.stringContaining('Warning: deprecated API')
      );
    });

    test('should format logs as JSON lines', async () => {
      await logStore.storeLogs(sessionId, testLogs);

      const appendCall = fs.appendFile.mock.calls[0];
      const logContent = appendCall[1];
      
      const lines = logContent.trim().split('\n');
      expect(lines).toHaveLength(2);
      
      const firstLog = JSON.parse(lines[0]);
      expect(firstLog).toMatchObject({
        timestamp: testLogs[0].timestamp,
        type: 'stdout',
        data: 'Starting server...'
      });
    });

    test('should handle empty logs array', async () => {
      await logStore.storeLogs(sessionId, []);
      expect(fs.appendFile).not.toHaveBeenCalled();
    });

    test('should handle null logs', async () => {
      await logStore.storeLogs(sessionId, null);
      expect(fs.appendFile).not.toHaveBeenCalled();
    });

    test('should check and rotate logs after storing', async () => {
      const largeStat = { size: 12 * 1024 * 1024 }; // 12MB (over limit)
      fs.stat.mockResolvedValue(largeStat);

      await logStore.storeLogs(sessionId, testLogs);

      expect(fs.rename).toHaveBeenCalled();
    });

    test('should handle storage errors', async () => {
      fs.appendFile.mockRejectedValue(new Error('Disk full'));

      await logStore.storeLogs(sessionId, testLogs);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to store logs:',
        expect.objectContaining({
          sessionId,
          error: 'Disk full',
          logCount: 2
        })
      );
    });
  });

  describe('retrieveLogs', () => {
    const sessionId = 'test-session-456';

    beforeEach(() => {
      const mockLogContent = [
        '{"timestamp":1000,"type":"stdout","data":"Log 1"}',
        '{"timestamp":2000,"type":"stderr","data":"Error log"}',
        '{"timestamp":3000,"type":"stdout","data":"Log 3"}',
        '{"timestamp":4000,"type":"stdout","data":"Final log"}'
      ].join('\n');

      fs.readFile.mockResolvedValue(mockLogContent);
    });

    test('should retrieve logs from file', async () => {
      const logs = await logStore.retrieveLogs(sessionId);

      const expectedFilePath = path.join(testStorePath, `${sessionId}.log`);
      expect(fs.access).toHaveBeenCalledWith(expectedFilePath);
      expect(fs.readFile).toHaveBeenCalledWith(expectedFilePath, 'utf8');
      
      expect(logs).toHaveLength(4);
      expect(logs[0].data).toBe('Log 1');
      expect(logs[3].data).toBe('Final log');
    });

    test('should apply tail limit', async () => {
      const logs = await logStore.retrieveLogs(sessionId, { tail: 2 });

      expect(logs).toHaveLength(2);
      expect(logs[0].data).toBe('Log 3');
      expect(logs[1].data).toBe('Final log');
    });

    test('should apply filter pattern', async () => {
      const logs = await logStore.retrieveLogs(sessionId, { filter: 'error' });

      expect(logs).toHaveLength(1);
      expect(logs[0].data).toBe('Error log');
      expect(logs[0].type).toBe('stderr');
    });

    test('should handle case-insensitive filtering', async () => {
      const logs = await logStore.retrieveLogs(sessionId, { filter: 'ERROR' });

      expect(logs).toHaveLength(1);
      expect(logs[0].data).toBe('Error log');
    });

    test('should handle invalid filter regex', async () => {
      const logs = await logStore.retrieveLogs(sessionId, { filter: '[invalid' });

      // Should return all logs when filter is invalid
      expect(logs).toHaveLength(4);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Invalid filter regex:',
        expect.objectContaining({ filter: '[invalid' })
      );
    });

    test('should handle non-existent log file', async () => {
      fs.access.mockRejectedValue(new Error('ENOENT'));

      const logs = await logStore.retrieveLogs(sessionId);

      expect(logs).toEqual([]);
    });

    test('should handle corrupted log entries', async () => {
      const corruptedContent = [
        '{"timestamp":1000,"type":"stdout","data":"Good log"}',
        'invalid json line',
        '{"timestamp":3000,"type":"stdout","data":"Another good log"}'
      ].join('\n');

      fs.readFile.mockResolvedValue(corruptedContent);

      const logs = await logStore.retrieveLogs(sessionId);

      expect(logs).toHaveLength(3);
      expect(logs[0].data).toBe('Good log');
      expect(logs[1].data).toBe('invalid json line'); // Corrupted line handled
      expect(logs[1].type).toBe('system');
      expect(logs[2].data).toBe('Another good log');
    });

    test('should handle file read errors', async () => {
      fs.readFile.mockRejectedValue(new Error('Permission denied'));

      const logs = await logStore.retrieveLogs(sessionId);

      expect(logs).toEqual([]);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to retrieve logs:',
        expect.objectContaining({
          sessionId,
          error: 'Permission denied'
        })
      );
    });
  });

  describe('getStorageStats', () => {
    beforeEach(() => {
      fs.readdir.mockResolvedValue(['session1.log', 'session2.log', 'other.txt']);
      fs.stat.mockImplementation((filePath) => {
        if (filePath.includes('session1.log')) {
          return Promise.resolve({
            size: 1024,
            mtime: new Date(Date.now() - 60000) // 1 minute ago
          });
        } else if (filePath.includes('session2.log')) {
          return Promise.resolve({
            size: 2048,
            mtime: new Date(Date.now() - 120000) // 2 minutes ago
          });
        }
        return Promise.resolve({ size: 512, mtime: new Date() });
      });
    });

    test('should return storage statistics', async () => {
      const stats = await logStore.getStorageStats();

      expect(stats).toMatchObject({
        totalSessions: 2,
        totalSize: 3072, // 1024 + 2048
        averageSize: 1536, // 3072 / 2
        sessions: expect.arrayContaining([
          expect.objectContaining({
            sessionId: 'session1',
            size: 1024
          }),
          expect.objectContaining({
            sessionId: 'session2',
            size: 2048
          })
        ])
      });
    });

    test('should sort sessions by last modified (newest first)', async () => {
      const stats = await logStore.getStorageStats();

      expect(stats.sessions[0].sessionId).toBe('session1'); // More recent
      expect(stats.sessions[1].sessionId).toBe('session2'); // Older
    });

    test('should handle empty storage directory', async () => {
      fs.readdir.mockResolvedValue([]);

      const stats = await logStore.getStorageStats();

      expect(stats).toMatchObject({
        totalSessions: 0,
        totalSize: 0,
        averageSize: 0,
        sessions: []
      });
    });

    test('should handle read directory errors', async () => {
      fs.readdir.mockRejectedValue(new Error('Access denied'));

      const stats = await logStore.getStorageStats();

      expect(stats).toMatchObject({
        totalSessions: 0,
        totalSize: 0,
        averageSize: 0,
        sessions: []
      });
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('cleanupOldLogs', () => {
    const oldDate = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000); // 8 days ago
    const recentDate = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000); // 1 day ago

    beforeEach(() => {
      fs.readdir.mockResolvedValue(['old-session.log', 'recent-session.log', 'other.txt']);
      fs.stat.mockImplementation((filePath) => {
        if (filePath.includes('old-session.log')) {
          return Promise.resolve({ mtime: oldDate });
        } else if (filePath.includes('recent-session.log')) {
          return Promise.resolve({ mtime: recentDate });
        }
        return Promise.resolve({ mtime: new Date() });
      });
    });

    test('should remove logs older than maxLogAge', async () => {
      await logStore.cleanupOldLogs();

      expect(fs.unlink).toHaveBeenCalledWith(
        path.join(testStorePath, 'old-session.log')
      );
      expect(fs.unlink).not.toHaveBeenCalledWith(
        path.join(testStorePath, 'recent-session.log')
      );
    });

    test('should log cleanup actions', async () => {
      await logStore.cleanupOldLogs();

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Removed old log file:',
        expect.objectContaining({
          file: 'old-session.log',
          age: expect.stringContaining('days')
        })
      );

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Log cleanup completed:',
        { cleanedCount: 1 }
      );
    });

    test('should handle no old logs gracefully', async () => {
      fs.readdir.mockResolvedValue(['recent-session.log']);

      await logStore.cleanupOldLogs();

      expect(fs.unlink).not.toHaveBeenCalled();
      expect(mockLogger.info).not.toHaveBeenCalledWith(
        'Log cleanup completed:',
        expect.any(Object)
      );
    });

    test('should handle cleanup errors', async () => {
      fs.unlink.mockRejectedValue(new Error('Permission denied'));

      await logStore.cleanupOldLogs();

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to cleanup logs:',
        expect.objectContaining({ error: 'Permission denied' })
      );
    });
  });

  describe('Log Rotation', () => {
    const sessionId = 'large-session';

    test('should rotate logs when size exceeds limit', async () => {
      const largeStat = { size: 12 * 1024 * 1024 }; // 12MB
      fs.stat.mockResolvedValue(largeStat);

      const logFile = path.join(testStorePath, `${sessionId}.log`);
      await logStore.checkAndRotateLogs(sessionId, logFile);

      expect(fs.rename).toHaveBeenCalledWith(
        logFile,
        expect.stringMatching(new RegExp(`${logFile}\\.\\d+\\.bak`))
      );
      
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Log file rotated:',
        expect.objectContaining({
          sessionId,
          size: largeStat.size
        })
      );
    });

    test('should not rotate logs under size limit', async () => {
      const smallStat = { size: 1024 }; // 1KB
      fs.stat.mockResolvedValue(smallStat);

      const logFile = path.join(testStorePath, `${sessionId}.log`);
      await logStore.checkAndRotateLogs(sessionId, logFile);

      expect(fs.rename).not.toHaveBeenCalled();
    });

    test('should cleanup old backups after rotation', async () => {
      const largeStat = { size: 12 * 1024 * 1024 };
      fs.stat.mockResolvedValue(largeStat);
      fs.readdir.mockResolvedValue([
        `${sessionId}.log.1000000.bak`,
        `${sessionId}.log.2000000.bak`,
        `${sessionId}.log.3000000.bak`
      ]);

      const logFile = path.join(testStorePath, `${sessionId}.log`);
      await logStore.checkAndRotateLogs(sessionId, logFile);

      // Should keep only the most recent backup (highest timestamp)
      expect(fs.unlink).toHaveBeenCalledWith(
        path.join(testStorePath, `${sessionId}.log.1000000.bak`)
      );
      expect(fs.unlink).toHaveBeenCalledWith(
        path.join(testStorePath, `${sessionId}.log.2000000.bak`)
      );
    });
  });

  describe('exportLogs', () => {
    const sessionId = 'export-session';
    const mockLogs = [
      { timestamp: 1000, type: 'stdout', data: 'Log entry 1' },
      { timestamp: 2000, type: 'stderr', data: 'Error entry' }
    ];

    beforeEach(() => {
      // Mock retrieveLogs method
      logStore.retrieveLogs = jest.fn().mockResolvedValue(mockLogs);
    });

    test('should export logs in JSON format', async () => {
      const exported = await logStore.exportLogs(sessionId, 'json');

      const parsed = JSON.parse(exported);
      expect(parsed).toMatchObject({
        sessionId,
        exportDate: expect.any(String),
        totalLogs: 2,
        logs: mockLogs
      });
    });

    test('should export logs in text format', async () => {
      const exported = await logStore.exportLogs(sessionId, 'text');

      const lines = exported.split('\n');
      expect(lines).toHaveLength(2);
      expect(lines[0]).toMatch(/\[.*\] STDOUT: Log entry 1/);
      expect(lines[1]).toMatch(/\[.*\] STDERR: Error entry/);
    });

    test('should default to JSON format', async () => {
      const exported = await logStore.exportLogs(sessionId);

      expect(() => JSON.parse(exported)).not.toThrow();
    });

    test('should handle export errors', async () => {
      logStore.retrieveLogs.mockRejectedValue(new Error('Retrieval failed'));

      await expect(logStore.exportLogs(sessionId)).rejects.toThrow('Retrieval failed');
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to export logs:',
        expect.objectContaining({
          sessionId,
          format: 'json',
          error: 'Retrieval failed'
        })
      );
    });
  });

  describe('deleteLogs', () => {
    const sessionId = 'delete-session';

    test('should delete log file', async () => {
      await logStore.deleteLogs(sessionId);

      const expectedPath = path.join(testStorePath, `${sessionId}.log`);
      expect(fs.unlink).toHaveBeenCalledWith(expectedPath);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Deleted log file:',
        { sessionId }
      );
    });

    test('should handle non-existent file gracefully', async () => {
      const enoentError = new Error('ENOENT');
      enoentError.code = 'ENOENT';
      fs.unlink.mockRejectedValue(enoentError);

      await expect(logStore.deleteLogs(sessionId)).resolves.not.toThrow();
    });

    test('should handle other deletion errors', async () => {
      fs.unlink.mockRejectedValue(new Error('Permission denied'));

      await expect(logStore.deleteLogs(sessionId)).rejects.toThrow('Permission denied');
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to delete logs:',
        expect.objectContaining({
          sessionId,
          error: 'Permission denied'
        })
      );
    });
  });

  describe('getLogFilePath', () => {
    test('should return correct log file path', () => {
      const sessionId = 'test-session';
      const path = logStore.getLogFilePath(sessionId);

      expect(path).toBe(`${testStorePath}/${sessionId}.log`);
    });
  });
});