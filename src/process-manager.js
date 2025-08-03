/**
 * Process Manager for MCP Debug Host Server
 * Handles server process lifecycle, monitoring, and session management
 */

const { spawn } = require('child_process');
const { v4: uuidv4 } = require('uuid');
const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');

class ProcessManager extends EventEmitter {
  constructor(logger) {
    super();
    this.logger = logger;
    this.processes = new Map();
    this.setupGracefulShutdown();
  }

  /**
   * Start a development server
   * @param {Object} params - Server startup parameters
   * @param {string} params.command - Command to run (optional, auto-detected)
   * @param {string} params.cwd - Working directory
   * @param {Object} params.env - Environment variables
   * @param {number} params.port - Port number (optional, auto-detected)
   * @param {string} params.sessionName - Session name (optional)
   * @returns {Promise<Object>} Server session information
   */
  async startServer(params) {
    const { cwd, env = {}, sessionName } = params;
    let { command, port } = params;
    
    // Check if directory exists
    try {
      await fs.access(cwd);
    } catch (error) {
      throw new Error(`Working directory does not exist: ${cwd}`);
    }
    
    // Auto-detect project type and command if not provided
    if (!command) {
      const detected = await this.detectProjectType(cwd);
      if (!detected) {
        throw new Error('Could not detect project type. Please provide a command.');
      }
      command = detected.command;
      port = port || detected.port;
    }
    
    // Auto-detect port if not provided
    if (!port) {
      port = await this.detectPort(command) || 3000;
    }
    
    // Check if server is already running on this port
    const existing = this.findByPort(port);
    if (existing && existing.status === 'running') {
      this.logger.info('Server already running on port', { port, sessionId: existing.id });
      return {
        sessionId: existing.id,
        status: 'already_running',
        pid: existing.pid,
        port: existing.port,
        url: `http://localhost:${port}`,
        message: `Server already running on port ${port}`
      };
    }
    
    // Create session
    const sessionId = uuidv4();
    const startTime = Date.now();
    
    this.logger.info('Starting server process', {
      sessionId,
      command,
      cwd,
      port,
      sessionName
    });
    
    // Spawn process
    const child = spawn('bash', ['-c', command], {
      cwd,
      env: { ...process.env, ...env, PORT: port.toString() },
      stdio: ['pipe', 'pipe', 'pipe'],
      detached: false // Keep attached for better control
    });
    
    // Create session object
    const session = {
      id: sessionId,
      name: sessionName || `Server on port ${port}`,
      command,
      cwd,
      port,
      pid: child.pid,
      startTime,
      status: 'starting',
      logs: [],
      process: child,
      env
    };
    
    // Set up output capture
    this.setupProcessLogging(child, session);
    
    // Handle process events
    child.on('error', (error) => {
      this.logger.error('Process error:', { sessionId, error: error.message });
      session.status = 'error';
      session.error = error.message;
      this.emit('process-error', { sessionId, error });
    });
    
    child.on('exit', (code, signal) => {
      this.logger.info('Process exited:', { sessionId, code, signal });
      session.status = 'stopped';
      session.exitCode = code;
      session.exitSignal = signal;
      session.endTime = Date.now();
      this.emit('process-exit', { sessionId, code, signal });
    });
    
    // Store session
    this.processes.set(sessionId, session);
    
    // Set initial timeout for server to start
    setTimeout(() => {
      if (session.status === 'starting') {
        this.logger.warn('Server taking longer than expected to start', { sessionId });
      }
    }, 30000); // 30 second warning
    
    this.logger.info('Server process started:', {
      sessionId,
      pid: child.pid,
      port,
      status: 'starting'
    });
    
    return {
      sessionId,
      pid: child.pid,
      port,
      status: 'starting',
      url: `http://localhost:${port}`,
      message: `Server starting on port ${port}. Check dashboard for live status.`
    };
  }
  
  /**
   * Stop a server session
   * @param {string} sessionId - Session ID to stop
   * @returns {Object} Stop result
   */
  stopServer(sessionId) {
    const session = this.processes.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }
    
    this.logger.info('Stopping server:', { sessionId, pid: session.pid, status: session.status });
    
    if (session.process && ['starting', 'running'].includes(session.status)) {
      // Try graceful shutdown first
      session.process.kill('SIGTERM');
      session.status = 'stopping';
      
      // Force kill after 5 seconds if still running
      setTimeout(() => {
        if (session.status === 'stopping' && session.process) {
          this.logger.warn('Forcing process termination:', { sessionId });
          session.process.kill('SIGKILL');
        }
      }, 5000);
      
      return { 
        success: true, 
        message: `Server ${sessionId} stopping gracefully` 
      };
    } else {
      return { 
        success: true, 
        message: `Server ${sessionId} was already stopped` 
      };
    }
  }
  
  /**
   * Get logs for a session
   * @param {string} sessionId - Session ID
   * @param {Object} options - Log options
   * @param {number} options.tail - Number of recent logs
   * @param {string} options.filter - Filter pattern
   * @returns {Array} Log entries
   */
  getLogs(sessionId, options = {}) {
    const session = this.processes.get(sessionId);
    if (!session) {
      return [];
    }
    
    const { tail = 100, filter } = options;
    let logs = [...session.logs]; // Create copy
    
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
  }
  
  /**
   * Get all server sessions
   * @returns {Array} Array of session information
   */
  getAllSessions() {
    const sessions = Array.from(this.processes.values()).map(session => ({
      id: session.id,
      name: session.name,
      command: session.command,
      cwd: session.cwd,
      port: session.port,
      status: session.status,
      pid: session.pid,
      startTime: session.startTime,
      endTime: session.endTime,
      uptime: session.status !== 'stopped' ? Date.now() - session.startTime : null,
      logCount: session.logs.length,
      error: session.error,
      exitCode: session.exitCode
    }));
    
    // Sort by start time (newest first)
    return sessions.sort((a, b) => b.startTime - a.startTime);
  }
  
  /**
   * Find session by port
   * @param {number} port - Port number
   * @returns {Object|null} Session object or null
   */
  findByPort(port) {
    for (const session of this.processes.values()) {
      if (session.port === port) {
        return session;
      }
    }
    return null;
  }
  
  /**
   * Stop all running processes
   */
  async stopAll() {
    this.logger.info('Stopping all processes...');
    const promises = [];
    
    for (const session of this.processes.values()) {
      if (['starting', 'running'].includes(session.status)) {
        promises.push(this.stopServer(session.id));
      }
    }
    
    await Promise.all(promises);
    this.logger.info('All processes stopped');
  }
  
  /**
   * Set up process logging
   * @private
   */
  setupProcessLogging(child, session) {
    const { sessionId } = session;
    
    child.stdout.on('data', (data) => {
      const logEntry = {
        timestamp: Date.now(),
        type: 'stdout',
        data: data.toString()
      };
      
      session.logs.push(logEntry);
      this.emit('log', { sessionId, log: logEntry });
      
      // Check if server is ready
      if (this.isServerReady(logEntry.data)) {
        session.status = 'running';
        this.logger.info('Server is ready:', { sessionId });
        this.emit('server-ready', session);
      }
      
      // Trim logs if too many (keep last 1000)
      if (session.logs.length > 1000) {
        session.logs = session.logs.slice(-1000);
      }
    });
    
    child.stderr.on('data', (data) => {
      const logEntry = {
        timestamp: Date.now(),
        type: 'stderr',
        data: data.toString()
      };
      
      session.logs.push(logEntry);
      this.emit('log', { sessionId, log: logEntry });
      
      // Check for common error patterns
      const errorText = logEntry.data.toLowerCase();
      if (errorText.includes('error') || errorText.includes('failed')) {
        this.logger.warn('Server error detected:', { sessionId, error: logEntry.data.trim() });
      }
      
      // Trim logs if too many
      if (session.logs.length > 1000) {
        session.logs = session.logs.slice(-1000);
      }
    });
  }
  
  /**
   * Detect project type and return appropriate command
   * @private
   */
  async detectProjectType(projectPath) {
    try {
      // Check for Node.js projects
      const packageJsonPath = path.join(projectPath, 'package.json');
      try {
        const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
        return this.detectNodeJsCommand(packageJson);
      } catch (error) {
        // Not a Node.js project, continue checking
      }
      
      // Check for PHP projects
      if (await this.fileExists(path.join(projectPath, 'artisan'))) {
        return { command: 'php artisan serve', port: 8000, framework: 'laravel' };
      }
      
      if (await this.fileExists(path.join(projectPath, 'composer.json'))) {
        return { command: 'php -S localhost:8000', port: 8000, framework: 'php' };
      }
      
      // Check for Python projects
      if (await this.fileExists(path.join(projectPath, 'manage.py'))) {
        return { command: 'python manage.py runserver', port: 8000, framework: 'django' };
      }
      
      if (await this.fileExists(path.join(projectPath, 'requirements.txt'))) {
        const requirements = await fs.readFile(path.join(projectPath, 'requirements.txt'), 'utf8');
        if (requirements.includes('flask')) {
          return { 
            command: 'flask run', 
            port: 5000, 
            framework: 'flask',
            env: { FLASK_ENV: 'development' }
          };
        }
        if (requirements.includes('fastapi')) {
          return { command: 'uvicorn main:app --reload', port: 8000, framework: 'fastapi' };
        }
      }
      
      return null;
    } catch (error) {
      this.logger.error('Error detecting project type:', { projectPath, error: error.message });
      return null;
    }
  }
  
  /**
   * Detect Node.js command from package.json
   * @private
   */
  detectNodeJsCommand(packageJson) {
    const scripts = packageJson.scripts || {};
    
    // Check common dev script names in order of preference
    const scriptNames = ['dev', 'start', 'serve', 'develop', 'run'];
    
    for (const scriptName of scriptNames) {
      if (scripts[scriptName]) {
        const script = scripts[scriptName];
        return {
          command: `npm run ${scriptName}`,
          port: this.detectPort(script) || this.detectFrameworkPort(packageJson),
          framework: this.detectFramework(packageJson)
        };
      }
    }
    
    return null;
  }
  
  /**
   * Detect port from script command
   * @private
   */
  detectPort(script) {
    if (!script) return null;
    
    // Try to extract port from script
    const portMatch = script.match(/(?:--port|PORT=|:)(\d+)/);
    if (portMatch) {
      return parseInt(portMatch[1]);
    }
    
    return null;
  }
  
  /**
   * Detect framework port defaults
   * @private
   */
  detectFrameworkPort(packageJson) {
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    if (deps.vite) return 5173;
    if (deps.next) return 3000;
    if (deps.nuxt) return 3000;
    if (deps['webpack-dev-server']) return 8080;
    if (deps['@angular/cli']) return 4200;
    
    return 3000; // Default
  }
  
  /**
   * Detect framework type
   * @private
   */
  detectFramework(packageJson) {
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    if (deps.next) return 'nextjs';
    if (deps.nuxt) return 'nuxt';
    if (deps['@angular/core']) return 'angular';
    if (deps.vue) return 'vue';
    if (deps.react) return 'react';
    if (deps.svelte) return 'svelte';
    if (deps.vite) return 'vite';
    
    return 'node';
  }
  
  /**
   * Check if file exists
   * @private
   */
  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
  
  /**
   * Check if server output indicates it's ready
   * @private
   */
  isServerReady(output) {
    const readyPatterns = [
      /listening on/i,
      /server started/i,
      /ready (?:on|in)/i,
      /compiled successfully/i,
      /webpack compiled/i,
      /vite.*ready/i,
      /local:\s*http/i,
      /development server is running/i,
      /serving at/i,
      /started server on/i
    ];
    
    return readyPatterns.some(pattern => pattern.test(output));
  }
  
  /**
   * Set up graceful shutdown handling
   * @private
   */
  setupGracefulShutdown() {
    const handleShutdown = (signal) => {
      this.logger.info(`Received ${signal}, shutting down gracefully...`);
      this.stopAll().then(() => {
        process.exit(0);
      }).catch(error => {
        this.logger.error('Error during shutdown:', error);
        process.exit(1);
      });
    };
    
    process.on('SIGINT', () => handleShutdown('SIGINT'));
    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  }
}

module.exports = ProcessManager;