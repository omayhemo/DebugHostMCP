/**
 * Session Manager
 * Manages session persistence and state
 */

const fs = require('fs').promises;
const path = require('path');
const EventEmitter = require('events');

class SessionManager extends EventEmitter {
  constructor(logger, config) {
    super();
    this.logger = logger;
    this.config = config;
    this.sessions = new Map();
    this.dbPath = path.join(config.dataDir, 'sessions.json');
    
    // Load sessions from disk
    this.loadSessions().catch(err => {
      this.logger.error('Failed to load sessions:', err);
    });
    
    // Auto-save periodically
    setInterval(() => {
      this.saveSessions().catch(err => {
        this.logger.error('Failed to save sessions:', err);
      });
    }, 30000); // Every 30 seconds
  }
  
  /**
   * Create a new session
   */
  async createSession(data) {
    const session = {
      id: data.id,
      name: data.name,
      command: data.command,
      cwd: data.cwd,
      port: data.port,
      env: data.env || {},
      status: 'pending',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      metadata: data.metadata || {}
    };
    
    this.sessions.set(session.id, session);
    await this.saveSessions();
    
    this.emit('session-created', session);
    return session;
  }
  
  /**
   * Update session
   */
  async updateSession(sessionId, updates) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }
    
    Object.assign(session, updates, {
      updatedAt: Date.now()
    });
    
    await this.saveSessions();
    this.emit('session-updated', session);
    return session;
  }
  
  /**
   * Delete session
   */
  async deleteSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }
    
    this.sessions.delete(sessionId);
    await this.saveSessions();
    
    this.emit('session-deleted', session);
    return { success: true };
  }
  
  /**
   * Get session
   */
  getSession(sessionId) {
    return this.sessions.get(sessionId);
  }
  
  /**
   * Get all sessions
   */
  getAllSessions() {
    return Array.from(this.sessions.values());
  }
  
  /**
   * Get active sessions
   */
  getActiveSessions() {
    return this.getAllSessions().filter(s => 
      s.status === 'running' || s.status === 'starting'
    );
  }
  
  /**
   * Load sessions from disk
   */
  async loadSessions() {
    try {
      // Ensure data directory exists
      await fs.mkdir(path.dirname(this.dbPath), { recursive: true });
      
      // Check if file exists
      try {
        await fs.access(this.dbPath);
      } catch {
        // File doesn't exist, start with empty sessions
        this.logger.info('No existing sessions file, starting fresh');
        return;
      }
      
      // Load sessions
      const data = await fs.readFile(this.dbPath, 'utf-8');
      const sessions = JSON.parse(data);
      
      // Restore sessions
      for (const session of sessions) {
        this.sessions.set(session.id, session);
      }
      
      this.logger.info(`Loaded ${sessions.length} sessions from disk`);
    } catch (error) {
      this.logger.error('Error loading sessions:', error);
      throw error;
    }
  }
  
  /**
   * Save sessions to disk
   */
  async saveSessions() {
    try {
      const sessions = Array.from(this.sessions.values());
      const data = JSON.stringify(sessions, null, 2);
      
      // Write atomically
      const tempPath = `${this.dbPath}.tmp`;
      await fs.writeFile(tempPath, data, 'utf-8');
      await fs.rename(tempPath, this.dbPath);
      
      this.logger.debug(`Saved ${sessions.length} sessions to disk`);
    } catch (error) {
      this.logger.error('Error saving sessions:', error);
      throw error;
    }
  }
  
  /**
   * Clean up old sessions
   */
  async cleanupOldSessions() {
    const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours
    let cleaned = 0;
    
    for (const [id, session] of this.sessions) {
      if (session.status === 'stopped' && session.updatedAt < cutoff) {
        this.sessions.delete(id);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      await this.saveSessions();
      this.logger.info(`Cleaned up ${cleaned} old sessions`);
    }
    
    return cleaned;
  }
}

module.exports = SessionManager;