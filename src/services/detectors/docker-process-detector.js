/**
 * Docker Process Detector  
 * 
 * Specialized detector for Docker containers running development processes.
 * Integrates with existing Docker Manager to discover containers with port mappings.
 */

const { BaseTechStackDetector, DetectionMethod, HealthStatus } = require('./base-tech-stack-detector');
const Docker = require('dockerode');

/**
 * Docker Container States
 */
const ContainerStates = {
  RUNNING: 'running',
  EXITED: 'exited', 
  CREATED: 'created',
  RESTARTING: 'restarting',
  PAUSED: 'paused',
  REMOVING: 'removing',
  DEAD: 'dead'
};

/**
 * Docker Process Detector Implementation
 * Detects running Docker containers with development server port mappings
 */
class DockerProcessDetector extends BaseTechStackDetector {
  constructor(options = {}) {
    super('docker', {
      portRange: { start: 1024, end: 65535 }, // Docker can map to any port
      containerFilters: options.containerFilters || {},
      includeStoppedContainers: options.includeStoppedContainers || false,
      dockerOptions: options.dockerOptions || {},
      ...options
    });
    
    // Initialize Docker client
    this.docker = new Docker(this.options.dockerOptions);
    
    // Port mapping patterns for development servers
    this.devPortPatterns = [
      { range: [3000, 3999], techStack: 'nodejs' },
      { range: [4000, 4999], techStack: 'static' }, 
      { range: [5000, 5999], techStack: 'python' },
      { range: [8080, 8980], techStack: 'php' }
    ];
  }
  
  /**
   * Initialize the Docker detector
   */
  async initialize() {
    console.log('Initializing Docker Process Detector...');
    
    try {
      // Test Docker connection
      await this.docker.ping();
      
      // Validate Docker API access
      await this.docker.version();
      
      this.initialized = true;
      console.log('✓ Docker detector initialized successfully');
      
    } catch (error) {
      console.error('Docker not available:', error.message);
      throw error;
    }
  }
  
  /**
   * Scan for Docker container processes - PERFORMANCE OPTIMIZED
   * Uses parallel container analysis and timeout handling for Story 3.2 performance requirements
   */
  async scanProcesses(options = {}) {
    if (!this.options.enabled) {
      return [];
    }
    
    const startTime = Date.now();
    
    try {
      console.log('Scanning for Docker container processes (optimized)...');
      
      // **PERFORMANCE FIX 1: Get containers with timeout**
      const containers = await Promise.race([
        this._listContainers(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Docker container listing timeout')), 1000)
        )
      ]);
      
      if (!containers || containers.length === 0) {
        const duration = Date.now() - startTime;
        this._updateStats(true, duration);
        console.log(`✓ Found 0 Docker container processes in ${duration}ms (optimized)`);
        return [];
      }
      
      // **PERFORMANCE FIX 2: Analyze containers in PARALLEL instead of sequential**
      const containerAnalysisPromises = containers.map(container => 
        Promise.race([
          this._analyzeContainer(container),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error(`Container ${container.Id} analysis timeout`)), 800)
          )
        ]).catch(error => {
          console.warn(`Failed to analyze container ${container.Id}:`, error.message);
          return []; // Return empty array instead of failing
        })
      );
      
      const results = await Promise.allSettled(containerAnalysisPromises);
      
      // **PERFORMANCE FIX 3: Collect successful results, ignore timeouts**
      const processes = [];
      for (const result of results) {
        if (result.status === 'fulfilled' && result.value) {
          processes.push(...result.value);
        }
      }
      
      const duration = Date.now() - startTime;
      this._updateStats(true, duration);
      
      console.log(`✓ Found ${processes.length} Docker container processes in ${duration}ms (optimized)`);
      
      processes.forEach(process => this._emitProcessDetected(process));
      
      return processes;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      this._updateStats(false, duration);
      
      console.error('Error scanning Docker container processes:', error.message);
      throw error;
    }
  }
  
  getSupportedDetectionMethods() {
    return [
      DetectionMethod.API_CALL,
      DetectionMethod.PORT_SCAN
    ];
  }
  
  async validateProcessHealth(process) {
    try {
      const health = {
        status: HealthStatus.HEALTHY,
        checks: { timestamp: new Date().toISOString() }
      };
      
      // Check container status
      if (process.containerId) {
        const container = this.docker.getContainer(process.containerId);
        const containerInfo = await container.inspect();
        
        health.checks.containerStatus = containerInfo.State.Status;
        health.checks.containerRunning = containerInfo.State.Running;
        
        if (!containerInfo.State.Running) {
          health.status = HealthStatus.UNHEALTHY;
          health.checks.reason = `Container status: ${containerInfo.State.Status}`;
        }
        
        // Check port mappings
        if (process.portMappings && process.portMappings.length > 0) {
          const portHealthChecks = [];
          
          for (const mapping of process.portMappings) {
            const portHealthy = await this._checkPortListening(mapping.hostPort);
            portHealthChecks.push({
              hostPort: mapping.hostPort,
              containerPort: mapping.containerPort,
              healthy: portHealthy
            });
            
            if (!portHealthy) {
              health.status = HealthStatus.UNHEALTHY;
            }
          }
          
          health.checks.portMappings = portHealthChecks;
        }
      }
      
      return health;
      
    } catch (error) {
      return {
        status: HealthStatus.UNHEALTHY,
        checks: {
          error: error.message,
          timestamp: new Date().toISOString()
        }
      };
    }
  }
  
  /**
   * Get detailed container information
   * @param {string} containerId - Container ID
   * @returns {Promise<Object>} Container details
   */
  async getContainerDetails(containerId) {
    try {
      const container = this.docker.getContainer(containerId);
      const info = await container.inspect();
      
      return {
        id: info.Id,
        name: info.Name,
        image: info.Config.Image,
        state: info.State,
        ports: info.NetworkSettings.Ports,
        mounts: info.Mounts,
        labels: info.Config.Labels,
        env: info.Config.Env
      };
    } catch (error) {
      console.error(`Failed to get container details for ${containerId}:`, error);
      throw error;
    }
  }
  
  // Private implementation methods
  
  /**
   * List Docker containers based on filters
   * @private
   */
  async _listContainers() {
    const listOptions = {
      all: this.options.includeStoppedContainers,
      filters: {
        ...this.options.containerFilters
      }
    };
    
    // Add label filter for debug-host containers if available
    if (!listOptions.filters.label) {
      listOptions.filters.label = [];
    }
    
    // Include debug-host containers but also scan for others
    const containers = await this.docker.listContainers(listOptions);
    
    return containers;
  }
  
  /**
   * Analyze a container for development server patterns
   * @private
   */
  async _analyzeContainer(containerInfo) {
    const processes = [];
    
    try {
      // Get detailed container information
      const container = this.docker.getContainer(containerInfo.Id);
      const details = await container.inspect();
      
      // Extract port mappings
      const portMappings = this._extractPortMappings(details);
      
      if (portMappings.length === 0) {
        // No port mappings, skip this container
        return processes;
      }
      
      // Analyze port mappings for development patterns
      for (const mapping of portMappings) {
        const techStack = this._identifyTechStackFromPort(mapping.hostPort);
        
        const process = {
          pid: null, // Docker containers don't have traditional PIDs from host perspective
          containerId: containerInfo.Id,
          containerName: containerInfo.Names[0].replace(/^\//, ''),
          port: mapping.hostPort,
          containerPort: mapping.containerPort,
          techStack: techStack || 'docker',
          framework: await this._detectFrameworkFromContainer(details),
          workspacePath: this._extractWorkspacePath(details),
          detectionMethod: DetectionMethod.API_CALL,
          metadata: {
            containerImage: containerInfo.Image,
            containerStatus: containerInfo.State,
            containerCreated: containerInfo.Created,
            portMappings: portMappings,
            labels: details.Config.Labels || {},
            mounts: details.Mounts || []
          }
        };
        
        processes.push(process);
      }
      
    } catch (error) {
      console.warn(`Error analyzing container ${containerInfo.Id}:`, error.message);
    }
    
    return processes;
  }
  
  /**
   * Extract port mappings from container details
   * @private
   */
  _extractPortMappings(containerDetails) {
    const mappings = [];
    
    if (!containerDetails.NetworkSettings || !containerDetails.NetworkSettings.Ports) {
      return mappings;
    }
    
    const ports = containerDetails.NetworkSettings.Ports;
    
    for (const [containerPortSpec, hostBindings] of Object.entries(ports)) {
      if (!hostBindings) continue;
      
      const containerPortMatch = containerPortSpec.match(/^(\d+)/);
      if (!containerPortMatch) continue;
      
      const containerPort = parseInt(containerPortMatch[1]);
      
      for (const binding of hostBindings) {
        if (binding.HostPort) {
          mappings.push({
            containerPort,
            hostPort: parseInt(binding.HostPort),
            hostIP: binding.HostIp || '0.0.0.0'
          });
        }
      }
    }
    
    return mappings;
  }
  
  /**
   * Identify technology stack from port number
   * @private
   */
  _identifyTechStackFromPort(port) {
    for (const pattern of this.devPortPatterns) {
      if (port >= pattern.range[0] && port <= pattern.range[1]) {
        return pattern.techStack;
      }
    }
    return null;
  }
  
  /**
   * Detect framework from container configuration
   * @private
   */
  async _detectFrameworkFromContainer(containerDetails) {
    try {
      // Check environment variables for framework indicators
      const env = containerDetails.Config.Env || [];
      
      for (const envVar of env) {
        const [key, value] = envVar.split('=');
        
        // Common framework environment variables
        if (key === 'FRAMEWORK' || key === 'APP_FRAMEWORK') {
          return value.toLowerCase();
        }
        
        // Vite specific
        if (key.includes('VITE') || value.includes('vite')) {
          return 'vite';
        }
        
        // Next.js specific
        if (key.includes('NEXT') || value.includes('next')) {
          return 'nextjs';
        }
        
        // Django specific
        if (key.includes('DJANGO') || value.includes('django')) {
          return 'django';
        }
        
        // Flask specific
        if (key.includes('FLASK') || value.includes('flask')) {
          return 'flask';
        }
      }
      
      // Check image name for framework indicators
      const imageName = containerDetails.Config.Image.toLowerCase();
      
      if (imageName.includes('node') && imageName.includes('vite')) {
        return 'vite';
      } else if (imageName.includes('node')) {
        return 'nodejs';
      } else if (imageName.includes('python')) {
        return 'python';
      } else if (imageName.includes('php')) {
        return 'php';
      } else if (imageName.includes('nginx') || imageName.includes('apache')) {
        return 'static';
      }
      
      return null;
      
    } catch (error) {
      return null;
    }
  }
  
  /**
   * Extract workspace path from container mounts
   * @private
   */
  _extractWorkspacePath(containerDetails) {
    try {
      const mounts = containerDetails.Mounts || [];
      
      // Look for bind mounts that might be workspace directories
      for (const mount of mounts) {
        if (mount.Type === 'bind' && mount.Source) {
          // Common development mount patterns
          if (mount.Destination === '/app' || 
              mount.Destination === '/workspace' ||
              mount.Destination === '/src') {
            return mount.Source;
          }
        }
      }
      
      return null;
      
    } catch (error) {
      return null;
    }
  }
}

module.exports = DockerProcessDetector;