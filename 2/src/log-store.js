/**
 * Log Store for MCP Debug Host Server
 * Handles log storage, retrieval, and persistence
 */

const fs = require('fs').promises;
const path = require('path');

class LogStore {
  constructor(logger) {
    this.logger = logger;
    this.storePath = path.join(process.env.HOME || '/tmp', '.apm-debug-host', 'logs');
    this.maxLogSize = 10 * 1024 * 1024; // 10MB per session
    this.maxLogAge = 7 * 24 * 60 * 60 * 1000; // 7 days
    
    this.initializeStorage();
  }

  /**
   * Initialize storage directories
   */
  async initializeStorage() {
    try {
      await fs.mkdir(this.storePath, { recursive: true });
      this.logger.info('Log store initialized:', { storePath: this.storePath });
      
      // Clean up old logs on startup
      await this.cleanupOldLogs();
    } catch (error) {
      this.logger.error('Failed to initialize log store:', { 
        error: error.message, 
        storePath: this.storePath 
      });
    }
  }

  /**
   * Store logs for a session
   * @param {string} sessionId - Session ID
   * @param {Array} logs - Array of log entries
   */
  async storeLogs(sessionId, logs) {
    if (!logs || logs.length === 0) return;

    try {
      const logFile = path.join(this.storePath, `${sessionId}.log`);
      const logEntries = logs.map(log => 
        JSON.stringify({
          timestamp: log.timestamp,
          type: log.type,
          data: log.data
        })
      ).join('\n') + '\n';

      await fs.appendFile(logFile, logEntries);
      
      // Check file size and rotate if necessary
      await this.checkAndRotateLogs(sessionId, logFile);
      
    } catch (error) {
      this.logger.error('Failed to store logs:', { 
        sessionId, 
        error: error.message,
        logCount: logs.length 
      });
    }
  }

  /**
   * Retrieve logs for a session
   * @param {string} sessionId - Session ID
   * @param {Object} options - Retrieval options
   * @param {number} options.tail - Number of recent logs
   * @param {string} options.filter - Filter pattern
   * @returns {Promise<Array>} Array of log entries
   */
  async retrieveLogs(sessionId, options = {}) {
    const { tail = 100, filter } = options;

    try {
      const logFile = path.join(this.storePath, `${sessionId}.log`);
      
      // Check if log file exists
      try {
        await fs.access(logFile);
      } catch {
        return []; // No logs found
      }

      const content = await fs.readFile(logFile, 'utf8');
      const lines = content.trim().split('\n').filter(line => line.length > 0);
      
      let logs = lines.map(line => {
        try {
          return JSON.parse(line);
        } catch {
          // Handle corrupted log entries
          return {
            timestamp: Date.now(),
            type: 'system',
            data: line
          };
        }
      });

      // Apply filter if provided
      if (filter) {
        try {
          const regex = new RegExp(filter, 'i');
          logs = logs.filter(log => regex.test(log.data));
        } catch (error) {
          this.logger.warn('Invalid filter regex:', { filter, error: error.message });
        }
      }

      // Return tail number of logs
      return logs.slice(-tail);
      
    } catch (error) {
      this.logger.error('Failed to retrieve logs:', { 
        sessionId, 
        error: error.message 
      });
      return [];
    }
  }

  /**
   * Get storage statistics
   * @returns {Promise<Object>} Storage statistics
   */
  async getStorageStats() {
    try {
      const files = await fs.readdir(this.storePath);
      const logFiles = files.filter(file => file.endsWith('.log'));
      
      let totalSize = 0;
      const sessionStats = [];

      for (const file of logFiles) {
        const filePath = path.join(this.storePath, file);
        const stats = await fs.stat(filePath);
        const sessionId = path.basename(file, '.log');
        
        totalSize += stats.size;
        sessionStats.push({
          sessionId,
          size: stats.size,
          lastModified: stats.mtime,
          age: Date.now() - stats.mtime.getTime()
        });
      }

      return {
        totalSessions: logFiles.length,
        totalSize,
        averageSize: logFiles.length > 0 ? Math.round(totalSize / logFiles.length) : 0,
        sessions: sessionStats.sort((a, b) => b.lastModified - a.lastModified)
      };
      
    } catch (error) {
      this.logger.error('Failed to get storage stats:', { error: error.message });
      return {
        totalSessions: 0,
        totalSize: 0,
        averageSize: 0,
        sessions: []
      };
    }
  }

  /**
   * Clean up old logs
   */
  async cleanupOldLogs() {
    try {
      const files = await fs.readdir(this.storePath);
      const logFiles = files.filter(file => file.endsWith('.log'));
      
      let cleanedCount = 0;
      const now = Date.now();

      for (const file of logFiles) {
        const filePath = path.join(this.storePath, file);
        const stats = await fs.stat(filePath);
        const age = now - stats.mtime.getTime();

        if (age > this.maxLogAge) {
          await fs.unlink(filePath);
          cleanedCount++;
          this.logger.info('Removed old log file:', { 
            file, 
            age: Math.round(age / (1000 * 60 * 60 * 24)) + ' days' 
          });
        }
      }

      if (cleanedCount > 0) {
        this.logger.info('Log cleanup completed:', { cleanedCount });
      }
      
    } catch (error) {
      this.logger.error('Failed to cleanup logs:', { error: error.message });
    }
  }

  /**
   * Check and rotate logs if they exceed size limit
   */
  async checkAndRotateLogs(sessionId, logFile) {
    try {
      const stats = await fs.stat(logFile);
      
      if (stats.size > this.maxLogSize) {
        const backupFile = `${logFile}.${Date.now()}.bak`;
        await fs.rename(logFile, backupFile);
        
        this.logger.info('Log file rotated:', { 
          sessionId, 
          size: stats.size, 
          backupFile 
        });
        
        // Keep only the most recent backup to prevent disk space issues
        await this.cleanupOldBackups(sessionId);
      }
      
    } catch (error) {
      this.logger.error('Failed to rotate logs:', { 
        sessionId, 
        error: error.message 
      });
    }
  }

  /**
   * Clean up old backup files for a session
   */
  async cleanupOldBackups(sessionId) {
    try {
      const files = await fs.readdir(this.storePath);
      const backupFiles = files
        .filter(file => file.startsWith(`${sessionId}.log.`) && file.endsWith('.bak'))
        .map(file => ({
          name: file,
          path: path.join(this.storePath, file),
          timestamp: parseInt(file.split('.')[2]) || 0
        }))
        .sort((a, b) => b.timestamp - a.timestamp);

      // Keep only the most recent backup
      for (let i = 1; i < backupFiles.length; i++) {
        await fs.unlink(backupFiles[i].path);
        this.logger.info('Removed old backup:', { file: backupFiles[i].name });
      }
      
    } catch (error) {
      this.logger.error('Failed to cleanup backups:', { 
        sessionId, 
        error: error.message 
      });
    }
  }

  /**
   * Export logs for a session
   * @param {string} sessionId - Session ID
   * @param {string} format - Export format ('json' or 'text')
   * @returns {Promise<string>} Exported log data
   */
  async exportLogs(sessionId, format = 'json') {
    try {
      const logs = await this.retrieveLogs(sessionId, { tail: 10000 }); // Export up to 10k logs
      
      if (format === 'text') {
        return logs.map(log => {
          const timestamp = new Date(log.timestamp).toISOString();
          return `[${timestamp}] ${log.type.toUpperCase()}: ${log.data}`;
        }).join('\n');
      } else {
        return JSON.stringify({
          sessionId,
          exportDate: new Date().toISOString(),
          totalLogs: logs.length,
          logs
        }, null, 2);
      }
      
    } catch (error) {
      this.logger.error('Failed to export logs:', { 
        sessionId, 
        format, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Delete logs for a session
   * @param {string} sessionId - Session ID
   */
  async deleteLogs(sessionId) {
    try {
      const logFile = path.join(this.storePath, `${sessionId}.log`);
      
      try {
        await fs.unlink(logFile);
        this.logger.info('Deleted log file:', { sessionId });
      } catch (error) {
        if (error.code !== 'ENOENT') {
          throw error;
        }
        // File doesn't exist, which is fine
      }

      // Also clean up any backup files
      await this.cleanupOldBackups(sessionId);
      
    } catch (error) {
      this.logger.error('Failed to delete logs:', { 
        sessionId, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Get log file path for a session
   * @param {string} sessionId - Session ID
   * @returns {string} Log file path
   */
  getLogFilePath(sessionId) {
    return path.join(this.storePath, `${sessionId}.log`);
  }
}

module.exports = LogStore;