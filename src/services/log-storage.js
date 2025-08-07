/**
 * Log Storage Service
 * Handles persistent storage, rotation, and retrieval of logs
 */

const fs = require('fs').promises;
const path = require('path');
const zlib = require('zlib');
const { promisify } = require('util');
const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

class LogStorage {
  constructor(options = {}) {
    this.baseDir = options.baseDir || path.join(process.cwd(), 'data', 'logs');
    this.maxFileSize = options.maxFileSize || 10 * 1024 * 1024; // 10MB
    this.maxFileAge = options.maxFileAge || 3 * 24 * 60 * 60 * 1000; // 3 days
    this.compressionEnabled = options.compressionEnabled !== false;
    this.rotationCheckInterval = options.rotationCheckInterval || 60000; // 1 minute
    this.rotationTimer = null;
    this.activeFiles = new Map(); // containerName -> fileHandle
    this.fileMetadata = new Map(); // filename -> metadata
  }

  /**
   * Initialize storage service
   */
  async initialize() {
    try {
      // Ensure base directory exists
      await fs.mkdir(this.baseDir, { recursive: true });
      
      // Load existing metadata
      await this.loadMetadata();
      
      // Start rotation check timer
      this.startRotationCheck();
      
      console.log(`[LogStorage] Initialized with base directory: ${this.baseDir}`);
      return true;
    } catch (error) {
      console.error('[LogStorage] Initialization error:', error);
      throw error;
    }
  }

  /**
   * Get log file path for a container
   */
  getLogFilePath(containerName, timestamp = Date.now()) {
    const date = new Date(timestamp);
    const dateStr = date.toISOString().split('T')[0];
    const filename = `${containerName}_${dateStr}.log`;
    return path.join(this.baseDir, containerName, filename);
  }

  /**
   * Get archived log file path
   */
  getArchivedFilePath(originalPath) {
    const dir = path.dirname(originalPath);
    const basename = path.basename(originalPath, '.log');
    return path.join(dir, 'archive', `${basename}.gz`);
  }

  /**
   * Write log entries to storage
   */
  async write(containerName, logEntries) {
    try {
      const entries = Array.isArray(logEntries) ? logEntries : [logEntries];
      const filePath = this.getLogFilePath(containerName);
      
      // Ensure directory exists
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      
      // Format log entries
      const lines = entries.map(entry => 
        JSON.stringify({
          timestamp: entry.timestamp,
          level: entry.level,
          stream: entry.stream,
          message: entry.message
        }) + '\n'
      ).join('');
      
      // Append to file
      await fs.appendFile(filePath, lines, 'utf8');
      
      // Update metadata
      await this.updateMetadata(filePath, lines.length);
      
      // Check if rotation needed
      await this.checkRotation(filePath);
      
      return true;
    } catch (error) {
      console.error(`[LogStorage] Write error for ${containerName}:`, error);
      throw error;
    }
  }

  /**
   * Read logs from storage
   */
  async read(containerName, options = {}) {
    try {
      const logs = [];
      const containerDir = path.join(this.baseDir, containerName);
      
      // Check if directory exists
      try {
        await fs.access(containerDir);
      } catch {
        return logs; // No logs yet
      }
      
      // Get all log files for the container
      const files = await this.getLogFiles(containerName, options);
      
      // Read and parse logs from each file
      for (const file of files) {
        const fileLogs = await this.readLogFile(file, options);
        logs.push(...fileLogs);
      }
      
      // Sort by timestamp
      logs.sort((a, b) => a.timestamp - b.timestamp);
      
      // Apply pagination
      const start = options.offset || 0;
      const limit = options.limit || 1000;
      
      return logs.slice(start, start + limit);
    } catch (error) {
      console.error(`[LogStorage] Read error for ${containerName}:`, error);
      throw error;
    }
  }

  /**
   * Read a single log file
   */
  async readLogFile(filePath, options = {}) {
    const logs = [];
    
    try {
      let content;
      
      // Check if it's a compressed file
      if (filePath.endsWith('.gz')) {
        const compressed = await fs.readFile(filePath);
        const decompressed = await gunzip(compressed);
        content = decompressed.toString('utf8');
      } else {
        content = await fs.readFile(filePath, 'utf8');
      }
      
      // Parse each line
      const lines = content.split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        try {
          const entry = JSON.parse(line);
          
          // Apply filters
          if (options.level && entry.level !== options.level) continue;
          if (options.stream && entry.stream !== options.stream) continue;
          if (options.since && entry.timestamp < new Date(options.since).getTime()) continue;
          if (options.until && entry.timestamp > new Date(options.until).getTime()) continue;
          if (options.search) {
            const regex = new RegExp(options.search, 'i');
            if (!regex.test(entry.message)) continue;
          }
          
          logs.push(entry);
        } catch (parseError) {
          // Skip malformed lines
          console.warn('[LogStorage] Skipping malformed log line:', parseError.message);
        }
      }
    } catch (error) {
      console.error(`[LogStorage] Error reading file ${filePath}:`, error);
    }
    
    return logs;
  }

  /**
   * Get list of log files for a container
   */
  async getLogFiles(containerName, options = {}) {
    const containerDir = path.join(this.baseDir, containerName);
    const files = [];
    
    try {
      // List main directory
      const mainFiles = await fs.readdir(containerDir);
      for (const file of mainFiles) {
        if (file.endsWith('.log')) {
          files.push(path.join(containerDir, file));
        }
      }
      
      // List archive directory if needed
      if (!options.excludeArchived) {
        const archiveDir = path.join(containerDir, 'archive');
        try {
          const archiveFiles = await fs.readdir(archiveDir);
          for (const file of archiveFiles) {
            if (file.endsWith('.gz')) {
              files.push(path.join(archiveDir, file));
            }
          }
        } catch {
          // Archive directory might not exist
        }
      }
      
      // Filter by date range if specified
      if (options.since || options.until) {
        const filteredFiles = [];
        for (const file of files) {
          const stats = await fs.stat(file);
          if (options.since && stats.mtime < new Date(options.since)) continue;
          if (options.until && stats.mtime > new Date(options.until)) continue;
          filteredFiles.push(file);
        }
        return filteredFiles;
      }
      
      return files;
    } catch (error) {
      console.error(`[LogStorage] Error listing files for ${containerName}:`, error);
      return [];
    }
  }

  /**
   * Update file metadata
   */
  async updateMetadata(filePath, bytesAdded) {
    const metadata = this.fileMetadata.get(filePath) || {
      size: 0,
      created: Date.now(),
      lastModified: Date.now()
    };
    
    metadata.size += bytesAdded;
    metadata.lastModified = Date.now();
    
    this.fileMetadata.set(filePath, metadata);
  }

  /**
   * Load metadata from disk
   */
  async loadMetadata() {
    const metadataPath = path.join(this.baseDir, '.metadata.json');
    
    try {
      const content = await fs.readFile(metadataPath, 'utf8');
      const metadata = JSON.parse(content);
      this.fileMetadata = new Map(Object.entries(metadata));
    } catch {
      // Metadata file doesn't exist yet
      this.fileMetadata = new Map();
    }
  }

  /**
   * Save metadata to disk
   */
  async saveMetadata() {
    const metadataPath = path.join(this.baseDir, '.metadata.json');
    const metadata = Object.fromEntries(this.fileMetadata);
    
    try {
      await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
    } catch (error) {
      console.error('[LogStorage] Error saving metadata:', error);
    }
  }

  /**
   * Check if file needs rotation
   */
  async checkRotation(filePath) {
    try {
      const stats = await fs.stat(filePath);
      
      // Check size-based rotation
      if (stats.size >= this.maxFileSize) {
        await this.rotateFile(filePath);
      }
    } catch (error) {
      console.error(`[LogStorage] Rotation check error for ${filePath}:`, error);
    }
  }

  /**
   * Rotate a log file
   */
  async rotateFile(filePath) {
    try {
      console.log(`[LogStorage] Rotating file: ${filePath}`);
      
      // Create archive directory
      const archiveDir = path.join(path.dirname(filePath), 'archive');
      await fs.mkdir(archiveDir, { recursive: true });
      
      // Generate archive filename with timestamp
      const basename = path.basename(filePath, '.log');
      const timestamp = Date.now();
      const archiveName = `${basename}_${timestamp}.log${this.compressionEnabled ? '.gz' : ''}`;
      const archivePath = path.join(archiveDir, archiveName);
      
      // Read original file
      const content = await fs.readFile(filePath);
      
      // Compress if enabled
      if (this.compressionEnabled) {
        const compressed = await gzip(content);
        await fs.writeFile(archivePath, compressed);
      } else {
        await fs.writeFile(archivePath, content);
      }
      
      // Clear original file
      await fs.writeFile(filePath, '');
      
      // Update metadata
      this.fileMetadata.delete(filePath);
      await this.saveMetadata();
      
      console.log(`[LogStorage] File rotated to: ${archivePath}`);
    } catch (error) {
      console.error(`[LogStorage] Rotation error for ${filePath}:`, error);
    }
  }

  /**
   * Start periodic rotation check
   */
  startRotationCheck() {
    this.rotationTimer = setInterval(async () => {
      await this.performRotationCheck();
    }, this.rotationCheckInterval);
  }

  /**
   * Perform rotation check on all files
   */
  async performRotationCheck() {
    try {
      // Check all active log files
      const containers = await fs.readdir(this.baseDir);
      
      for (const container of containers) {
        if (container.startsWith('.')) continue; // Skip hidden files
        
        const containerDir = path.join(this.baseDir, container);
        const stats = await fs.stat(containerDir);
        
        if (!stats.isDirectory()) continue;
        
        // Check each log file
        const files = await fs.readdir(containerDir);
        
        for (const file of files) {
          if (!file.endsWith('.log')) continue;
          
          const filePath = path.join(containerDir, file);
          
          // Check age-based rotation
          const fileStats = await fs.stat(filePath);
          const age = Date.now() - fileStats.mtime.getTime();
          
          if (age > this.maxFileAge) {
            await this.rotateFile(filePath);
          }
        }
        
        // Clean up old archived files
        await this.cleanupOldArchives(containerDir);
      }
    } catch (error) {
      console.error('[LogStorage] Rotation check error:', error);
    }
  }

  /**
   * Clean up old archived files
   */
  async cleanupOldArchives(containerDir) {
    const archiveDir = path.join(containerDir, 'archive');
    
    try {
      const files = await fs.readdir(archiveDir);
      const maxArchiveAge = this.maxFileAge * 3; // Keep archives for 3x the normal retention
      
      for (const file of files) {
        const filePath = path.join(archiveDir, file);
        const stats = await fs.stat(filePath);
        const age = Date.now() - stats.mtime.getTime();
        
        if (age > maxArchiveAge) {
          await fs.unlink(filePath);
          console.log(`[LogStorage] Deleted old archive: ${filePath}`);
        }
      }
    } catch {
      // Archive directory might not exist
    }
  }

  /**
   * Delete logs for a container
   */
  async deleteLogs(containerName) {
    try {
      const containerDir = path.join(this.baseDir, containerName);
      await fs.rm(containerDir, { recursive: true, force: true });
      
      // Clean metadata
      for (const [filePath] of this.fileMetadata) {
        if (filePath.includes(containerName)) {
          this.fileMetadata.delete(filePath);
        }
      }
      
      await this.saveMetadata();
      
      console.log(`[LogStorage] Deleted logs for ${containerName}`);
      return true;
    } catch (error) {
      console.error(`[LogStorage] Delete error for ${containerName}:`, error);
      return false;
    }
  }

  /**
   * Get storage statistics
   */
  async getStats() {
    const stats = {
      totalSize: 0,
      containerCount: 0,
      fileCount: 0,
      oldestLog: null,
      newestLog: null,
      containers: {}
    };
    
    try {
      const containers = await fs.readdir(this.baseDir);
      
      for (const container of containers) {
        if (container.startsWith('.')) continue;
        
        const containerDir = path.join(this.baseDir, container);
        const dirStats = await fs.stat(containerDir);
        
        if (!dirStats.isDirectory()) continue;
        
        stats.containerCount++;
        
        const containerStats = {
          size: 0,
          fileCount: 0,
          oldestFile: null,
          newestFile: null
        };
        
        // Process main files
        const files = await fs.readdir(containerDir);
        for (const file of files) {
          if (file.endsWith('.log')) {
            const filePath = path.join(containerDir, file);
            const fileStats = await fs.stat(filePath);
            
            containerStats.size += fileStats.size;
            containerStats.fileCount++;
            stats.fileCount++;
            stats.totalSize += fileStats.size;
            
            if (!containerStats.oldestFile || fileStats.mtime < containerStats.oldestFile) {
              containerStats.oldestFile = fileStats.mtime;
            }
            if (!containerStats.newestFile || fileStats.mtime > containerStats.newestFile) {
              containerStats.newestFile = fileStats.mtime;
            }
          }
        }
        
        // Process archived files
        try {
          const archiveDir = path.join(containerDir, 'archive');
          const archiveFiles = await fs.readdir(archiveDir);
          
          for (const file of archiveFiles) {
            const filePath = path.join(archiveDir, file);
            const fileStats = await fs.stat(filePath);
            
            containerStats.size += fileStats.size;
            containerStats.fileCount++;
            stats.fileCount++;
            stats.totalSize += fileStats.size;
          }
        } catch {
          // Archive directory might not exist
        }
        
        stats.containers[container] = containerStats;
        
        if (!stats.oldestLog || containerStats.oldestFile < stats.oldestLog) {
          stats.oldestLog = containerStats.oldestFile;
        }
        if (!stats.newestLog || containerStats.newestFile > stats.newestLog) {
          stats.newestLog = containerStats.newestFile;
        }
      }
    } catch (error) {
      console.error('[LogStorage] Error getting stats:', error);
    }
    
    return stats;
  }

  /**
   * Shutdown the storage service
   */
  async shutdown() {
    if (this.rotationTimer) {
      clearInterval(this.rotationTimer);
      this.rotationTimer = null;
    }
    
    await this.saveMetadata();
    
    console.log('[LogStorage] Shutdown complete');
  }
}

// Create singleton instance
let logStorage = null;

function getLogStorage() {
  if (!logStorage) {
    logStorage = new LogStorage();
  }
  return logStorage;
}

module.exports = {
  LogStorage,
  getLogStorage
};