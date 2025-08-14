const net = require('net');

/**
 * Port availability checking utilities
 * Uses net.createServer() to check if ports are available
 */
class PortChecker {
  /**
   * Check if a port is available
   * @param {number} port - Port number to check
   * @param {string} host - Host to bind to (default: 127.0.0.1)
   * @returns {Promise<boolean>} True if port is available
   */
  static isPortAvailable(port, host = '127.0.0.1') {
    return new Promise((resolve) => {
      const server = net.createServer();
      
      server.once('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          resolve(false);
        } else {
          resolve(false); // Treat other errors as unavailable
        }
      });
      
      server.once('listening', () => {
        server.close();
        resolve(true);
      });
      
      server.listen(port, host);
    });
  }

  /**
   * Check multiple ports for availability
   * @param {number[]} ports - Array of port numbers
   * @param {string} host - Host to bind to (default: 127.0.0.1)
   * @returns {Promise<Object>} Map of port -> availability
   */
  static async checkMultiplePorts(ports, host = '127.0.0.1') {
    const results = {};
    
    // Check ports in parallel
    const promises = ports.map(async (port) => {
      const available = await PortChecker.isPortAvailable(port, host);
      results[port] = available;
    });
    
    await Promise.all(promises);
    return results;
  }

  /**
   * Find the next available port in a range
   * @param {number} startPort - Starting port number
   * @param {number} endPort - Ending port number
   * @param {string} host - Host to bind to (default: 127.0.0.1)
   * @returns {Promise<number|null>} Next available port or null if none found
   */
  static async findNextAvailablePort(startPort, endPort, host = '127.0.0.1') {
    for (let port = startPort; port <= endPort; port++) {
      const available = await PortChecker.isPortAvailable(port, host);
      if (available) {
        return port;
      }
    }
    return null;
  }

  /**
   * Find multiple available ports in a range
   * @param {number} startPort - Starting port number
   * @param {number} endPort - Ending port number
   * @param {number} count - Number of ports to find
   * @param {string} host - Host to bind to (default: 127.0.0.1)
   * @returns {Promise<number[]>} Array of available ports
   */
  static async findAvailablePorts(startPort, endPort, count, host = '127.0.0.1') {
    const availablePorts = [];
    
    for (let port = startPort; port <= endPort && availablePorts.length < count; port++) {
      const available = await PortChecker.isPortAvailable(port, host);
      if (available) {
        availablePorts.push(port);
      }
    }
    
    return availablePorts;
  }

  /**
   * Get detailed port status information
   * @param {number} port - Port number to check
   * @param {string} host - Host to bind to (default: 127.0.0.1)
   * @returns {Promise<Object>} Detailed status information
   */
  static async getPortStatus(port, host = '127.0.0.1') {
    const startTime = Date.now();
    const available = await PortChecker.isPortAvailable(port, host);
    const checkTime = Date.now() - startTime;
    
    return {
      port,
      host,
      available,
      checkTime,
      checkedAt: new Date().toISOString()
    };
  }

  /**
   * Validate port number
   * @param {number} port - Port number to validate
   * @returns {boolean} True if port is valid
   */
  static isValidPort(port) {
    return Number.isInteger(port) && port >= 1 && port <= 65535;
  }

  /**
   * Check if port is in system range
   * @param {number} port - Port number to check
   * @returns {boolean} True if port is in system range
   */
  static isSystemPort(port) {
    return port >= 2601 && port <= 2699;
  }

  /**
   * Check if port is privileged (< 1024)
   * @param {number} port - Port number to check
   * @returns {boolean} True if port is privileged
   */
  static isPrivilegedPort(port) {
    return port < 1024;
  }
}

module.exports = PortChecker;