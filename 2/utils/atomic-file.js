const fs = require('fs').promises;
const path = require('path');

/**
 * Atomic file operations to prevent race conditions and corruption
 * Based on temp file + atomic rename pattern
 */
class AtomicFile {
  /**
   * Atomically write JSON data to file
   * @param {string} filePath - Target file path
   * @param {object} data - Data to write
   * @returns {Promise<void>}
   */
  static async writeJSON(filePath, data) {
    const tempPath = `${filePath}.tmp`;
    const backupPath = `${filePath}.bak`;
    
    try {
      // Ensure directory exists
      const dir = path.dirname(filePath);
      await fs.mkdir(dir, { recursive: true });
      
      // Write to temp file
      await fs.writeFile(tempPath, JSON.stringify(data, null, 2), 'utf8');
      
      // Create backup of existing file if it exists
      try {
        await fs.access(filePath);
        await fs.rename(filePath, backupPath);
      } catch (err) {
        // File doesn't exist yet, that's ok
      }
      
      // Atomic rename temp to actual
      await fs.rename(tempPath, filePath);
      
      // Clean up backup after successful write
      try {
        await fs.unlink(backupPath);
      } catch (err) {
        // Backup cleanup is non-critical
      }
    } catch (error) {
      // Clean up temp file on error
      try {
        await fs.unlink(tempPath);
      } catch (err) {
        // Temp file might not exist
      }
      
      // Restore from backup if available
      try {
        await fs.access(backupPath);
        await fs.rename(backupPath, filePath);
      } catch (err) {
        // No backup to restore
      }
      throw error;
    }
  }

  /**
   * Atomically read JSON data from file
   * @param {string} filePath - Source file path
   * @returns {Promise<object>} Parsed JSON data
   */
  static async readJSON(filePath) {
    try {
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        // File doesn't exist, return default structure
        return {
          allocations: {},
          history: []
        };
      }
      throw error;
    }
  }

  /**
   * Check if file exists
   * @param {string} filePath - File path to check
   * @returns {Promise<boolean>}
   */
  static async exists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Create a backup of a file
   * @param {string} filePath - Source file path
   * @param {string} backupPath - Backup file path
   * @returns {Promise<void>}
   */
  static async backup(filePath, backupPath) {
    try {
      await fs.copyFile(filePath, backupPath);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
      // Source file doesn't exist, that's ok
    }
  }
}

module.exports = AtomicFile;