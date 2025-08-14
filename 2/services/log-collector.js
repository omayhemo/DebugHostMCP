/**
 * Log Collector Service
 * Captures container stdout/stderr streams and manages log collection
 */

const Docker = require('dockerode');
const { EventEmitter } = require('events');

class LogCollector extends EventEmitter {
  constructor() {
    super();
    this.docker = new Docker();
    this.activeStreams = new Map(); // containerName -> stream
    this.buffers = new Map(); // containerName -> buffer
    this.maxBufferSize = 1024 * 1024; // 1MB max buffer per container
  }

  /**
   * Initialize the log collector
   */
  async initialize() {
    console.log('[LogCollector] Initializing log collector service');
    return true;
  }

  /**
   * Start collecting logs from a container
   */
  async startCollection(containerName, options = {}) {
    try {
      // Check if already collecting
      if (this.activeStreams.has(containerName)) {
        console.log(`[LogCollector] Already collecting logs for ${containerName}`);
        return true;
      }

      const container = this.docker.getContainer(containerName);
      
      // Check if container exists and is running
      const info = await container.inspect();
      if (!info.State.Running) {
        console.warn(`[LogCollector] Container ${containerName} is not running`);
        return false;
      }

      // Configure log stream options
      const streamOptions = {
        stdout: true,
        stderr: true,
        follow: true,
        tail: options.tail || 100,
        timestamps: true
      };

      // Attach to container logs
      const stream = await container.logs(streamOptions);
      
      // Initialize buffer for this container
      this.buffers.set(containerName, []);
      
      // Process the stream
      this.processStream(containerName, stream);
      
      // Store the stream reference
      this.activeStreams.set(containerName, stream);
      
      console.log(`[LogCollector] Started collecting logs for ${containerName}`);
      return true;
    } catch (error) {
      console.error(`[LogCollector] Error starting collection for ${containerName}:`, error);
      this.emit('error', {
        containerName,
        error: error.message,
        timestamp: Date.now()
      });
      return false;
    }
  }

  /**
   * Process log stream from container
   */
  processStream(containerName, stream) {
    let buffer = '';
    
    stream.on('data', (chunk) => {
      try {
        // Docker multiplexes stdout/stderr, need to demux
        const logs = this.demuxStream(chunk);
        
        for (const log of logs) {
          const logEntry = this.parseLogEntry(containerName, log);
          
          // Store in buffer
          this.addToBuffer(containerName, logEntry);
          
          // Emit log event for real-time streaming
          this.emit('log', logEntry);
        }
      } catch (error) {
        console.error(`[LogCollector] Error processing stream for ${containerName}:`, error);
      }
    });

    stream.on('end', () => {
      console.log(`[LogCollector] Stream ended for ${containerName}`);
      this.activeStreams.delete(containerName);
      this.emit('streamEnd', { containerName, timestamp: Date.now() });
    });

    stream.on('error', (error) => {
      console.error(`[LogCollector] Stream error for ${containerName}:`, error);
      this.activeStreams.delete(containerName);
      this.emit('streamError', { 
        containerName, 
        error: error.message, 
        timestamp: Date.now() 
      });
    });
  }

  /**
   * Demultiplex Docker stream (separates stdout/stderr)
   */
  demuxStream(chunk) {
    const logs = [];
    let offset = 0;
    
    while (offset < chunk.length) {
      // Docker stream format: [8 byte header][payload]
      // Header: [stream type][0][0][0][size1][size2][size3][size4]
      if (offset + 8 > chunk.length) break;
      
      const header = chunk.slice(offset, offset + 8);
      const streamType = header[0]; // 1 = stdout, 2 = stderr
      const payloadSize = header.readUInt32BE(4);
      
      if (offset + 8 + payloadSize > chunk.length) break;
      
      const payload = chunk.slice(offset + 8, offset + 8 + payloadSize);
      const text = payload.toString('utf8').trim();
      
      if (text) {
        logs.push({
          stream: streamType === 1 ? 'stdout' : 'stderr',
          text
        });
      }
      
      offset += 8 + payloadSize;
    }
    
    // If no Docker header found, treat as raw text
    if (logs.length === 0 && chunk.length > 0) {
      const text = chunk.toString('utf8').trim();
      if (text) {
        logs.push({ stream: 'stdout', text });
      }
    }
    
    return logs;
  }

  /**
   * Parse log entry and add metadata
   */
  parseLogEntry(containerName, log) {
    // Extract timestamp if present (Docker timestamps format)
    let timestamp = Date.now();
    let message = log.text;
    
    // Check for Docker timestamp format: 2024-01-15T10:30:45.123456789Z
    const timestampMatch = message.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z)\s+(.*)$/);
    if (timestampMatch) {
      timestamp = new Date(timestampMatch[1]).getTime();
      message = timestampMatch[2];
    }
    
    // Detect log level
    const level = this.detectLogLevel(message);
    
    return {
      containerName,
      timestamp,
      level,
      stream: log.stream,
      message,
      raw: log.text
    };
  }

  /**
   * Detect log level from message content
   */
  detectLogLevel(message) {
    const lowercased = message.toLowerCase();
    
    if (lowercased.includes('error') || lowercased.includes('fatal')) {
      return 'error';
    } else if (lowercased.includes('warn') || lowercased.includes('warning')) {
      return 'warn';
    } else if (lowercased.includes('info')) {
      return 'info';
    } else if (lowercased.includes('debug') || lowercased.includes('trace')) {
      return 'debug';
    }
    
    return 'info'; // default
  }

  /**
   * Add log entry to buffer with size management
   */
  addToBuffer(containerName, logEntry) {
    const buffer = this.buffers.get(containerName) || [];
    
    buffer.push(logEntry);
    
    // Manage buffer size - keep last N entries
    if (buffer.length > 10000) {
      buffer.splice(0, buffer.length - 10000);
    }
    
    this.buffers.set(containerName, buffer);
  }

  /**
   * Stop collecting logs from a container
   */
  async stopCollection(containerName) {
    const stream = this.activeStreams.get(containerName);
    
    if (stream) {
      try {
        stream.destroy();
        this.activeStreams.delete(containerName);
        console.log(`[LogCollector] Stopped collecting logs for ${containerName}`);
        return true;
      } catch (error) {
        console.error(`[LogCollector] Error stopping collection for ${containerName}:`, error);
        return false;
      }
    }
    
    return true;
  }

  /**
   * Stop all log collection
   */
  async stopAll() {
    const containers = Array.from(this.activeStreams.keys());
    const results = await Promise.all(
      containers.map(name => this.stopCollection(name))
    );
    
    this.buffers.clear();
    
    return results.every(r => r === true);
  }

  /**
   * Get buffered logs for a container
   */
  getBufferedLogs(containerName, options = {}) {
    const buffer = this.buffers.get(containerName) || [];
    let logs = [...buffer]; // Clone array
    
    // Apply filters
    if (options.level) {
      logs = logs.filter(log => log.level === options.level);
    }
    
    if (options.stream) {
      logs = logs.filter(log => log.stream === options.stream);
    }
    
    if (options.since) {
      const sinceTime = new Date(options.since).getTime();
      logs = logs.filter(log => log.timestamp >= sinceTime);
    }
    
    if (options.until) {
      const untilTime = new Date(options.until).getTime();
      logs = logs.filter(log => log.timestamp <= untilTime);
    }
    
    if (options.search) {
      const searchRegex = new RegExp(options.search, 'i');
      logs = logs.filter(log => searchRegex.test(log.message));
    }
    
    // Apply limit
    if (options.limit) {
      logs = logs.slice(-options.limit);
    }
    
    return logs;
  }

  /**
   * Get collection status
   */
  getStatus() {
    return {
      activeCollections: Array.from(this.activeStreams.keys()),
      bufferSizes: Array.from(this.buffers.entries()).map(([name, buffer]) => ({
        containerName: name,
        entries: buffer.length,
        oldestEntry: buffer[0]?.timestamp,
        newestEntry: buffer[buffer.length - 1]?.timestamp
      }))
    };
  }

  /**
   * Clear buffer for a container
   */
  clearBuffer(containerName) {
    this.buffers.set(containerName, []);
    console.log(`[LogCollector] Cleared buffer for ${containerName}`);
  }

  /**
   * Clear all buffers
   */
  clearAllBuffers() {
    this.buffers.clear();
    console.log('[LogCollector] Cleared all buffers');
  }
}

// Create singleton instance
let logCollector = null;

function getLogCollector() {
  if (!logCollector) {
    logCollector = new LogCollector();
  }
  return logCollector;
}

module.exports = {
  LogCollector,
  getLogCollector
};