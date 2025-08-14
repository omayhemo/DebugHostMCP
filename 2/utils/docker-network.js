/**
 * Docker Network Management Utility
 * 
 * Handles creation and management of the debug-host-network for containers
 */

class DockerNetwork {
  constructor(docker) {
    this.docker = docker;
    this.networkName = 'debug-host-network';
    this.networkConfig = {
      Name: this.networkName,
      Driver: 'bridge',
      IPAM: {
        Driver: 'default',
        Config: [{
          Subnet: '172.28.0.0/16',
          Gateway: '172.28.0.1'
        }]
      },
      Labels: {
        'debug-host': 'true',
        'created': new Date().toISOString()
      }
    };
  }

  /**
   * Check if the debug-host-network exists
   * 
   * @returns {Promise<boolean>} True if network exists
   */
  async networkExists() {
    try {
      const networks = await this.docker.listNetworks({
        filters: { name: [this.networkName] }
      });
      
      return networks.length > 0;
    } catch (error) {
      console.error('Error checking network existence:', error.message);
      return false;
    }
  }

  /**
   * Get the debug-host-network object if it exists
   * 
   * @returns {Promise<object|null>} Network object or null if not found
   */
  async getNetwork() {
    try {
      const networks = await this.docker.listNetworks({
        filters: { name: [this.networkName] }
      });

      if (networks.length === 0) {
        return null;
      }

      return this.docker.getNetwork(networks[0].Id);
    } catch (error) {
      console.error('Error getting network:', error.message);
      return null;
    }
  }

  /**
   * Validate that an existing network has the correct configuration
   * 
   * @returns {Promise<boolean>} True if network config is correct
   */
  async validateNetworkConfig() {
    try {
      const networks = await this.docker.listNetworks({
        filters: { name: [this.networkName] }
      });

      if (networks.length === 0) {
        return false;
      }

      const network = networks[0];
      
      // Check subnet configuration
      if (!network.IPAM || !network.IPAM.Config) {
        return false;
      }

      const config = network.IPAM.Config[0];
      if (!config || config.Subnet !== '172.28.0.0/16') {
        console.warn(`Network ${this.networkName} has incorrect subnet: ${config?.Subnet}`);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error validating network config:', error.message);
      return false;
    }
  }

  /**
   * Create the debug-host-network with proper configuration
   * 
   * @returns {Promise<object>} Created network object
   * @throws {Error} If network creation fails
   */
  async createNetwork() {
    try {
      console.log(`Creating Docker network: ${this.networkName}`);
      
      const network = await this.docker.createNetwork(this.networkConfig);
      
      console.log(`Network ${this.networkName} created successfully`);
      return network;
    } catch (error) {
      // If network already exists with same name but different config, this will fail
      if (error.statusCode === 409) {
        throw new Error(`Network ${this.networkName} already exists with conflicting configuration`);
      }
      
      throw new Error(`Failed to create network ${this.networkName}: ${error.message}`);
    }
  }

  /**
   * Ensure the debug-host-network exists and has correct configuration
   * Creates it if it doesn't exist, validates if it does
   * 
   * @returns {Promise<object>} Network object
   * @throws {Error} If network setup fails
   */
  async ensureNetwork() {
    try {
      const exists = await this.networkExists();
      
      if (!exists) {
        console.log('Debug host network does not exist, creating...');
        return await this.createNetwork();
      }

      const isValid = await this.validateNetworkConfig();
      if (!isValid) {
        throw new Error(
          `Network ${this.networkName} exists but has incorrect configuration. ` +
          'Please remove it manually and restart the service.'
        );
      }

      console.log(`Network ${this.networkName} exists and is properly configured`);
      return await this.getNetwork();
    } catch (error) {
      console.error('Error ensuring network:', error.message);
      throw error;
    }
  }

  /**
   * Remove the debug-host-network (cleanup)
   * Only removes if it has the debug-host label
   * 
   * @returns {Promise<boolean>} True if network was removed
   */
  async removeNetwork() {
    try {
      const network = await this.getNetwork();
      if (!network) {
        return false;
      }

      const networkInfo = await network.inspect();
      
      // Safety check: only remove networks we created
      if (!networkInfo.Labels || networkInfo.Labels['debug-host'] !== 'true') {
        console.warn(`Network ${this.networkName} not created by debug-host, skipping removal`);
        return false;
      }

      await network.remove();
      console.log(`Network ${this.networkName} removed successfully`);
      return true;
    } catch (error) {
      // Network might not exist or be in use
      if (error.statusCode === 404) {
        return false;
      }
      if (error.statusCode === 403) {
        console.warn(`Network ${this.networkName} is in use, cannot remove`);
        return false;
      }
      
      console.error('Error removing network:', error.message);
      throw error;
    }
  }

  /**
   * Get network connection configuration for containers
   * 
   * @returns {object} Network connection config for container creation
   */
  getContainerNetworkConfig() {
    return {
      [this.networkName]: {}
    };
  }

  /**
   * Connect a container to the debug-host-network
   * 
   * @param {string} containerId - Container ID to connect
   * @returns {Promise<void>}
   */
  async connectContainer(containerId) {
    try {
      const network = await this.getNetwork();
      if (!network) {
        throw new Error(`Network ${this.networkName} does not exist`);
      }

      await network.connect({
        Container: containerId
      });

      console.log(`Container ${containerId} connected to ${this.networkName}`);
    } catch (error) {
      // If already connected, that's okay
      if (error.statusCode === 403 && error.message.includes('already exists')) {
        return;
      }
      
      throw new Error(`Failed to connect container to network: ${error.message}`);
    }
  }

  /**
   * Disconnect a container from the debug-host-network
   * 
   * @param {string} containerId - Container ID to disconnect
   * @returns {Promise<void>}
   */
  async disconnectContainer(containerId) {
    try {
      const network = await this.getNetwork();
      if (!network) {
        return; // Network doesn't exist, nothing to disconnect from
      }

      await network.disconnect({
        Container: containerId,
        Force: true
      });

      console.log(`Container ${containerId} disconnected from ${this.networkName}`);
    } catch (error) {
      // If not connected or container doesn't exist, that's okay
      if (error.statusCode === 404) {
        return;
      }
      
      console.warn(`Failed to disconnect container from network: ${error.message}`);
    }
  }
}

module.exports = DockerNetwork;