/**
 * Base adapter class for technology stack detection and management
 */
class BaseAdapter {
  constructor(logger) {
    this.logger = logger;
    this.name = 'base';
    this.priority = 0; // Lower numbers = higher priority
  }
  
  /**
   * Check if this adapter can handle the given project
   * @param {string} projectPath - Path to the project directory
   * @returns {Promise<boolean>}
   */
  async canHandle(projectPath) {
    throw new Error('canHandle method must be implemented by subclass');
  }
  
  /**
   * Detect and return the start command for this tech stack
   * @param {string} projectPath - Path to the project directory
   * @returns {Promise<Object|null>} - { command, port, framework, env? }
   */
  async detect(projectPath) {
    throw new Error('detect method must be implemented by subclass');
  }
  
  /**
   * Get default configuration for this adapter
   * @returns {Object}
   */
  getDefaults() {
    return {
      port: 3000,
      framework: this.name,
      env: {}
    };
  }
  
  /**
   * Check if a file exists
   * @param {string} filePath - Path to check
   * @returns {Promise<boolean>}
   */
  async fileExists(filePath) {
    const fs = require('fs').promises;
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
  
  /**
   * Read a file safely
   * @param {string} filePath - Path to read
   * @returns {Promise<string|null>}
   */
  async readFile(filePath) {
    const fs = require('fs').promises;
    try {
      return await fs.readFile(filePath, 'utf8');
    } catch (error) {
      this.logger.debug(`Failed to read ${filePath}:`, error.message);
      return null;
    }
  }
  
  /**
   * Parse JSON file safely
   * @param {string} filePath - Path to JSON file
   * @returns {Promise<Object|null>}
   */
  async readJSON(filePath) {
    const content = await this.readFile(filePath);
    if (!content) return null;
    
    try {
      return JSON.parse(content);
    } catch (error) {
      this.logger.debug(`Failed to parse JSON ${filePath}:`, error.message);
      return null;
    }
  }
  
  /**
   * Extract port number from a string
   * @param {string} text - Text to search
   * @returns {number|null}
   */
  extractPort(text) {
    const portMatch = text.match(/(?:--port|PORT=|:)(\d+)/);
    return portMatch ? parseInt(portMatch[1]) : null;
  }
  
  /**
   * Validate that a port is reasonable
   * @param {number} port - Port to validate
   * @returns {boolean}
   */
  isValidPort(port) {
    return port && port >= 1024 && port <= 65535;
  }
}

module.exports = BaseAdapter;