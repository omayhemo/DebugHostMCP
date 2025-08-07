/**
 * Path Normalizer Utility
 * 
 * Handles cross-platform path normalization for Docker volume mounting,
 * specifically converting Windows paths to WSL2 mounted paths.
 */

const path = require('path');
const os = require('os');

class PathNormalizer {
  /**
   * Normalize workspace path for Docker volume mounting
   * Converts Windows paths (C:\path) to WSL2 mount format (/mnt/c/path)
   * 
   * @param {string} workspace - The workspace path to normalize
   * @returns {string} Normalized path suitable for Docker volumes
   */
  static normalizeWorkspacePath(workspace) {
    if (!workspace || typeof workspace !== 'string') {
      throw new Error('Workspace path must be a non-empty string');
    }

    // Convert Windows drive paths to WSL2 mounts
    // Match pattern like C:\ or C:/ at the start of the path
    if (workspace.match(/^[A-Z]:[\\\/]/i)) {
      return workspace
        .replace(/^([A-Z]):/i, (_, drive) => `/mnt/${drive.toLowerCase()}`)
        .replace(/\\/g, '/');
    }

    // For Unix-like paths, ensure they're absolute
    if (!path.isAbsolute(workspace)) {
      throw new Error(`Workspace path must be absolute: ${workspace}`);
    }

    return workspace;
  }

  /**
   * Validate that a normalized path is suitable for Docker mounting
   * 
   * @param {string} normalizedPath - The normalized path to validate
   * @returns {boolean} True if path is valid for Docker mounting
   */
  static isValidDockerPath(normalizedPath) {
    if (!normalizedPath || typeof normalizedPath !== 'string') {
      return false;
    }

    // Must be absolute path
    if (!normalizedPath.startsWith('/')) {
      return false;
    }

    // Should not contain Windows-style backslashes
    if (normalizedPath.includes('\\')) {
      return false;
    }

    // Should not contain relative path components
    if (normalizedPath.includes('../') || normalizedPath.includes('./')) {
      return false;
    }

    return true;
  }

  /**
   * Get the platform-specific path information for debugging
   * 
   * @returns {object} Platform and path information
   */
  static getPlatformInfo() {
    return {
      platform: os.platform(),
      homedir: os.homedir(),
      cwd: process.cwd(),
      isWindows: os.platform() === 'win32',
      isWSL: process.env.WSL_DISTRO_NAME !== undefined
    };
  }

  /**
   * Convert a container path back to host path (reverse operation)
   * Useful for logging and debugging
   * 
   * @param {string} containerPath - Path as seen inside the container
   * @param {string} originalHost - Original host path for reference
   * @returns {string} Host path
   */
  static containerToHostPath(containerPath, originalHost) {
    if (!containerPath || !originalHost) {
      return containerPath;
    }

    // If container path starts with /app, replace with original host path
    if (containerPath.startsWith('/app')) {
      const relativePath = containerPath.substring(4); // Remove '/app'
      return path.join(originalHost, relativePath);
    }

    return containerPath;
  }
}

module.exports = PathNormalizer;