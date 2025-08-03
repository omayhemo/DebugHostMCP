/**
 * Log Manager
 * Handles log storage, retrieval, and streaming
 */

const fs = require('fs').promises;
const path = require('path');
const EventEmitter = require('events');
const { createReadStream, createWriteStream } = require('fs');
const readline = require('readline');

class LogManager extends EventEmitter {
  constructor(logger, config) {
    super();
    this.logger = logger;
    this.config = config;
    this.logStreams = new Map();
    this.logBuffers = new Map();
    
    // Ensure log directory exists
    this.initLogDir().catch(err => {
      this.logger.error('Failed to initialize log directory:', err);
    });
  }
  
  async initLogDir() {
    await fs.mkdir(this.config.logDir, { recursive: true });
  }
  
  /**
   * Get log file path for a session
   */
  getLogPath(sessionId) {
    return path.join(this.config.logDir, `${sessionId}.log`);
  }
  
  /**
   * Write log entry
   */
  async writeLog(sessionId, entry) {
    try {
      // Add to memory buffer
      if (!this.logBuffers.has(sessionId)) {
        this.logBuffers.set(sessionId, []);
      }
      const buffer = this.logBuffers.get(sessionId);
      buffer.push(entry);
      
      // Limit buffer size
      if (buffer.length > 1000) {
        buffer.shift();
      }
      
      // Get or create write stream
      let stream = this.logStreams.get(sessionId);
      if (!stream) {
        const logPath = this.getLogPath(sessionId);
        stream = createWriteStream(logPath, { flags: 'a' });
        this.logStreams.set(sessionId, stream);
      }
      
      // Write to file
      const line = JSON.stringify({
        sessionId,
        timestamp: entry.timestamp || Date.now(),
        type: entry.type,
        data: entry.data,
        metadata: entry.metadata
      }) + '\n';
      
      stream.write(line);
      
      // Emit event for real-time subscribers
      this.emit('log-entry', {
        sessionId,
        ...entry
      });
      
    } catch (error) {
      this.logger.error(`Failed to write log for ${sessionId}:`, error);
    }
  }
  
  /**
   * Read logs from file
   */
  async readLogs(sessionId, options = {}) {
    const {
      limit = 100,
      offset = 0,
      filter = null,
      reverse = false
    } = options;
    
    try {
      // Try memory buffer first for recent logs
      if (this.logBuffers.has(sessionId) && !offset) {
        const buffer = this.logBuffers.get(sessionId);
        let logs = buffer.slice(-limit);
        
        if (filter) {
          logs = logs.filter(log => this.matchesFilter(log, filter));
        }
        
        if (reverse) {
          logs.reverse();
        }
        
        return logs;
      }
      
      // Read from file
      const logPath = this.getLogPath(sessionId);
      
      // Check if file exists
      try {
        await fs.access(logPath);
      } catch {
        return [];
      }
      
      const logs = [];
      const fileStream = createReadStream(logPath);
      const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
      });
      
      let lineCount = 0;
      for await (const line of rl) {
        if (lineCount >= offset) {
          try {
            const log = JSON.parse(line);
            
            if (!filter || this.matchesFilter(log, filter)) {
              logs.push(log);
              
              if (logs.length >= limit) {
                break;
              }
            }
          } catch (err) {
            // Skip malformed lines
            this.logger.warn(`Skipping malformed log line: ${line}`);
          }
        }
        lineCount++;
      }
      
      if (reverse) {
        logs.reverse();
      }
      
      return logs;
      
    } catch (error) {
      this.logger.error(`Failed to read logs for ${sessionId}:`, error);
      return [];
    }
  }
  
  /**
   * Stream logs in real-time
   */
  streamLogs(sessionId, callback) {
    const listener = (entry) => {
      if (entry.sessionId === sessionId) {
        callback(entry);
      }
    };
    
    this.on('log-entry', listener);
    
    // Return unsubscribe function
    return () => {
      this.off('log-entry', listener);
    };
  }
  
  /**
   * Search logs
   */
  async searchLogs(query, options = {}) {
    const {
      sessionId = null,
      limit = 100,
      startTime = null,
      endTime = null
    } = options;
    
    const results = [];
    
    try {
      // Get list of log files to search
      const files = sessionId 
        ? [this.getLogPath(sessionId)]
        : await this.getAllLogFiles();
      
      for (const file of files) {
        try {
          await fs.access(file);
        } catch {
          continue;
        }
        
        const fileStream = createReadStream(file);
        const rl = readline.createInterface({
          input: fileStream,
          crlfDelay: Infinity
        });
        
        for await (const line of rl) {
          try {
            const log = JSON.parse(line);
            
            // Check time range
            if (startTime && log.timestamp < startTime) continue;
            if (endTime && log.timestamp > endTime) continue;
            
            // Check if matches query
            if (this.matchesQuery(log, query)) {
              results.push(log);
              
              if (results.length >= limit) {
                return results;
              }
            }
          } catch {
            // Skip malformed lines
          }
        }
      }
      
      return results;
      
    } catch (error) {
      this.logger.error('Failed to search logs:', error);
      return [];
    }
  }
  
  /**
   * Delete logs for a session
   */
  async deleteLogs(sessionId) {
    try {
      // Close stream if open
      const stream = this.logStreams.get(sessionId);
      if (stream) {
        stream.end();
        this.logStreams.delete(sessionId);
      }
      
      // Clear buffer
      this.logBuffers.delete(sessionId);
      
      // Delete file
      const logPath = this.getLogPath(sessionId);
      try {
        await fs.unlink(logPath);
        this.logger.info(`Deleted logs for session ${sessionId}`);
      } catch (err) {
        if (err.code !== 'ENOENT') {
          throw err;
        }
      }
      
      return { success: true };
      
    } catch (error) {
      this.logger.error(`Failed to delete logs for ${sessionId}:`, error);
      throw error;
    }
  }
  
  /**
   * Rotate logs
   */
  async rotateLogs() {
    try {
      const files = await this.getAllLogFiles();
      const maxSize = 10 * 1024 * 1024; // 10MB
      let rotated = 0;
      
      for (const file of files) {
        const stats = await fs.stat(file);
        
        if (stats.size > maxSize) {
          const rotatedPath = `${file}.${Date.now()}`;
          await fs.rename(file, rotatedPath);
          
          // Compress if possible (requires zlib)
          // await this.compressFile(rotatedPath);
          
          rotated++;
        }
      }
      
      if (rotated > 0) {
        this.logger.info(`Rotated ${rotated} log files`);
      }
      
      return rotated;
      
    } catch (error) {
      this.logger.error('Failed to rotate logs:', error);
      throw error;
    }
  }
  
  /**
   * Clean up old logs
   */
  async cleanupOldLogs(maxAge = 7 * 24 * 60 * 60 * 1000) {
    try {
      const files = await this.getAllLogFiles();
      const cutoff = Date.now() - maxAge;
      let cleaned = 0;
      
      for (const file of files) {
        const stats = await fs.stat(file);
        
        if (stats.mtime.getTime() < cutoff) {
          await fs.unlink(file);
          cleaned++;
        }
      }
      
      if (cleaned > 0) {
        this.logger.info(`Cleaned up ${cleaned} old log files`);
      }
      
      return cleaned;
      
    } catch (error) {
      this.logger.error('Failed to clean up old logs:', error);
      throw error;
    }
  }
  
  /**
   * Close all open streams
   */
  async closeAll() {
    for (const [sessionId, stream] of this.logStreams) {
      stream.end();
    }
    this.logStreams.clear();
    this.logBuffers.clear();
  }
  
  // Utility methods
  
  async getAllLogFiles() {
    const files = await fs.readdir(this.config.logDir);
    return files
      .filter(f => f.endsWith('.log'))
      .map(f => path.join(this.config.logDir, f));
  }
  
  matchesFilter(log, filter) {
    if (filter.type && log.type !== filter.type) {
      return false;
    }
    
    if (filter.level && log.level !== filter.level) {
      return false;
    }
    
    if (filter.contains && !log.data.includes(filter.contains)) {
      return false;
    }
    
    return true;
  }
  
  matchesQuery(log, query) {
    const searchText = `${log.data} ${JSON.stringify(log.metadata || {})}`.toLowerCase();
    return searchText.includes(query.toLowerCase());
  }
}

module.exports = LogManager;