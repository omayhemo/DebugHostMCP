/**
 * Process Manager
 * Handles process lifecycle, monitoring, and cleanup
 */

const { spawn } = require('child_process');
const EventEmitter = require('events');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const portfinder = require('portfinder');

class ProcessManager extends EventEmitter {
  constructor(logger, config) {
    super();
    this.logger = logger;
    this.config = config;
    this.processes = new Map();
    this.portAllocations = new Map();
    
    // Cleanup dead processes periodically
    setInterval(() => this.cleanupDeadProcesses(), 30000);
  }
  
  /**
   * Start a new server process
   */
  async startServer(options) {
    const {
      name,
      command,
      cwd = process.cwd(),
      port,
      env = {},
      sessionId = uuidv4()
    } = options;
    
    // Check if session already exists
    if (this.processes.has(sessionId)) {
      throw new Error(`Session ${sessionId} already exists`);
    }
    
    // Check max sessions limit
    if (this.processes.size >= this.config.maxSessions) {
      throw new Error(`Maximum sessions limit (${this.config.maxSessions}) reached`);
    }
    
    // Auto-detect or validate port
    let assignedPort = port;
    if (!assignedPort) {
      assignedPort = await this.findAvailablePort();
    } else {
      // Check if port is already in use
      if (this.isPortAllocated(assignedPort)) {
        throw new Error(`Port ${assignedPort} is already in use`);
      }
    }
    
    // Parse command
    const [cmd, ...args] = this.parseCommand(command);
    
    // Create session object
    const session = {
      id: sessionId,
      name: name || `server-${sessionId.slice(0, 8)}`,
      command,
      cmd,
      args,
      cwd,
      port: assignedPort,
      env: {
        ...process.env,
        ...env,
        PORT: assignedPort
      },
      status: 'starting',
      pid: null,
      startTime: Date.now(),
      endTime: null,
      exitCode: null,
      restarts: 0,
      logs: []
    };
    
    try {
      // Spawn the process
      const proc = spawn(cmd, args, {
        cwd,
        env: session.env,
        shell: true,
        detached: false
      });
      
      session.pid = proc.pid;
      session.process = proc;
      
      // Handle stdout
      proc.stdout.on('data', (data) => {
        const log = {
          type: 'stdout',
          data: data.toString(),
          timestamp: Date.now()
        };
        session.logs.push(log);
        this.emit('log', sessionId, log);
        
        // Check if server is ready
        if (session.status === 'starting' && this.isServerReady(data.toString())) {
          session.status = 'running';
          this.emit('server-ready', session);
        }
      });
      
      // Handle stderr
      proc.stderr.on('data', (data) => {
        const log = {
          type: 'stderr',
          data: data.toString(),
          timestamp: Date.now()
        };
        session.logs.push(log);
        this.emit('log', sessionId, log);
      });
      
      // Handle process exit
      proc.on('exit', (code, signal) => {
        session.status = 'stopped';
        session.exitCode = code;
        session.endTime = Date.now();
        
        if (signal) {
          this.logger.info(`Process ${sessionId} killed with signal ${signal}`);
        } else {
          this.logger.info(`Process ${sessionId} exited with code ${code}`);
        }
        
        // Release port
        this.releasePort(session.port);
        
        // Auto-restart if configured and not manually stopped
        if (session.autoRestart && session.restarts < 3 && code !== 0) {
          session.restarts++;
          this.logger.info(`Auto-restarting session ${sessionId} (attempt ${session.restarts})`);
          setTimeout(() => {
            this.restartServer(sessionId).catch(err => {
              this.logger.error(`Failed to auto-restart ${sessionId}:`, err);
            });
          }, 2000);
        }
        
        this.emit('server-stopped', session);
      });
      
      // Handle process errors
      proc.on('error', (error) => {
        this.logger.error(`Process error for ${sessionId}:`, error);
        session.status = 'failed';
        session.error = error.message;
        this.releasePort(session.port);
        this.emit('server-error', session, error);
      });
      
      // Store session
      this.processes.set(sessionId, session);
      this.allocatePort(assignedPort, sessionId);
      
      // Set running status after a delay if no explicit ready signal
      setTimeout(() => {
        if (session.status === 'starting') {
          session.status = 'running';
          this.emit('server-ready', session);
        }
      }, 3000);
      
      this.emit('server-started', session);
      this.logger.info(`Started server ${sessionId} on port ${assignedPort}`);
      
      return {
        id: sessionId,
        name: session.name,
        port: assignedPort,
        pid: session.pid,
        status: session.status,
        url: `http://localhost:${assignedPort}`
      };
      
    } catch (error) {
      this.logger.error(`Failed to start server ${sessionId}:`, error);
      this.releasePort(assignedPort);
      throw error;
    }
  }
  
  /**
   * Stop a server process
   */
  async stopServer(sessionId, force = false) {
    const session = this.processes.get(sessionId);
    
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }
    
    if (session.status === 'stopped' || session.status === 'stopping') {
      return { success: true, message: 'Server already stopped' };
    }
    
    session.status = 'stopping';
    session.autoRestart = false; // Prevent auto-restart
    
    try {
      if (session.process) {
        // Try graceful shutdown first
        if (!force) {
          session.process.kill('SIGTERM');
          
          // Wait for graceful shutdown
          await new Promise((resolve) => {
            const timeout = setTimeout(() => {
              // Force kill if not stopped
              session.process.kill('SIGKILL');
              resolve();
            }, 5000);
            
            session.process.once('exit', () => {
              clearTimeout(timeout);
              resolve();
            });
          });
        } else {
          // Force kill immediately
          session.process.kill('SIGKILL');
        }
      }
      
      // Clean up
      this.releasePort(session.port);
      session.status = 'stopped';
      session.endTime = Date.now();
      
      this.logger.info(`Stopped server ${sessionId}`);
      return { success: true, message: 'Server stopped successfully' };
      
    } catch (error) {
      this.logger.error(`Failed to stop server ${sessionId}:`, error);
      throw error;
    }
  }
  
  /**
   * Restart a server
   */
  async restartServer(sessionId) {
    const session = this.processes.get(sessionId);
    
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }
    
    // Store the configuration before stopping
    const config = {
      name: session.name,
      command: session.command,
      cwd: session.cwd,
      port: session.port,
      env: session.env
    };
    
    // Stop the server
    await this.stopServer(sessionId);
    
    // Remove the old session from processes map to allow restart
    this.processes.delete(sessionId);
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Start with same configuration and new sessionId
    return this.startServer({
      ...config,
      sessionId: sessionId // This will create a new session with the same ID
    });
  }
  
  /**
   * Get session information
   */
  getSession(sessionId) {
    const session = this.processes.get(sessionId);
    if (!session) {
      return null;
    }
    
    return {
      id: session.id,
      name: session.name,
      command: session.command,
      cwd: session.cwd,
      port: session.port,
      pid: session.pid,
      status: session.status,
      startTime: session.startTime,
      endTime: session.endTime,
      exitCode: session.exitCode,
      restarts: session.restarts,
      uptime: session.endTime ? 
        session.endTime - session.startTime : 
        Date.now() - session.startTime,
      url: session.port ? `http://localhost:${session.port}` : null
    };
  }
  
  /**
   * Get all sessions
   */
  getAllSessions() {
    return Array.from(this.processes.values()).map(session => 
      this.getSession(session.id)
    );
  }
  
  /**
   * Get active sessions
   */
  getActiveSessions() {
    return this.getAllSessions().filter(session => 
      session.status === 'running' || session.status === 'starting'
    );
  }
  
  /**
   * Stop all servers
   */
  async stopAll() {
    const promises = [];
    for (const [sessionId] of this.processes) {
      promises.push(this.stopServer(sessionId));
    }
    return Promise.allSettled(promises);
  }
  
  /**
   * Get logs for a session
   */
  getLogs(sessionId, limit = 100) {
    const session = this.processes.get(sessionId);
    if (!session) {
      return [];
    }
    
    const logs = session.logs.slice(-limit);
    return logs;
  }
  
  /**
   * Clean up dead processes
   */
  async cleanupDeadProcesses() {
    for (const [sessionId, session] of this.processes) {
      if (session.status === 'stopped' && 
          session.endTime && 
          Date.now() - session.endTime > 3600000) { // 1 hour
        this.processes.delete(sessionId);
        this.logger.info(`Cleaned up old session ${sessionId}`);
      }
    }
  }
  
  // Utility methods
  
  parseCommand(command) {
    // Simple command parsing - in production use shell-quote
    return command.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
  }
  
  async findAvailablePort(startPort = 3000) {
    return portfinder.getPortPromise({
      port: startPort,
      stopPort: startPort + 100
    });
  }
  
  allocatePort(port, sessionId) {
    this.portAllocations.set(port, sessionId);
  }
  
  releasePort(port) {
    this.portAllocations.delete(port);
  }
  
  isPortAllocated(port) {
    return this.portAllocations.has(port);
  }
  
  isServerReady(output) {
    // Common patterns indicating server is ready
    const readyPatterns = [
      /listening on/i,
      /server started/i,
      /ready on/i,
      /running at/i,
      /started on port/i,
      /webpack: compiled successfully/i,
      /compiled with/i,
      /build finished/i
    ];
    
    return readyPatterns.some(pattern => pattern.test(output));
  }
  
  /**
   * Get all system processes matching a command pattern
   * This helps identify orphaned processes not tracked in sessions
   */
  async getSystemProcesses(commandPattern) {
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);
    
    try {
      // Use ps to find all processes matching the pattern
      const { stdout } = await execAsync(`ps aux | grep -E "${commandPattern}" | grep -v grep`);
      const lines = stdout.trim().split('\n').filter(line => line);
      
      const processes = lines.map(line => {
        const parts = line.split(/\s+/);
        return {
          user: parts[0],
          pid: parseInt(parts[1]),
          cpu: parseFloat(parts[2]),
          mem: parseFloat(parts[3]),
          vsz: parts[4],
          rss: parts[5],
          tty: parts[6],
          stat: parts[7],
          start: parts[8],
          time: parts[9],
          command: parts.slice(10).join(' ')
        };
      });
      
      // Cross-reference with our tracked sessions
      const trackedPids = Array.from(this.processes.values())
        .filter(s => s.pid)
        .map(s => s.pid);
      
      processes.forEach(proc => {
        proc.tracked = trackedPids.includes(proc.pid);
        // Try to find the session if tracked
        if (proc.tracked) {
          const session = Array.from(this.processes.values())
            .find(s => s.pid === proc.pid);
          if (session) {
            proc.sessionId = session.id;
            proc.sessionName = session.name;
            proc.port = session.port;
          }
        }
      });
      
      return processes;
    } catch (error) {
      // If ps fails or no processes found, return empty array
      if (error.message.includes('Command failed')) {
        return [];
      }
      throw error;
    }
  }
  
  /**
   * Get all processes for a specific environment (npm, node, python, etc.)
   */
  async getProcessesByEnvironment(environment) {
    const patterns = {
      npm: 'npm|node.*npm',
      node: 'node',
      python: 'python',
      java: 'java',
      ruby: 'ruby',
      go: 'go run',
      rust: 'cargo',
      php: 'php'
    };
    
    const pattern = patterns[environment.toLowerCase()] || environment;
    return this.getSystemProcesses(pattern);
  }
}

module.exports = ProcessManager;