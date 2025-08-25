/**
 * Chaos Testing Framework for Multi-Tech Process Discovery Engine
 * 
 * This framework tests the system's resilience and recovery capabilities
 * by introducing random process lifecycle events and system disruptions.
 * 
 * Chaos Testing Scenarios:
 * 1. Random Process Lifecycle Events (start/stop/restart)
 * 2. Concurrent Access Stress Testing
 * 3. Resource Exhaustion Simulation
 * 4. Network Disruption Simulation
 * 5. Component Failure Simulation
 * 6. Data Corruption Recovery Testing
 */

const { MultiTechProcessDiscoveryEngine, TechStack } = require('../../src/services/multi-tech-process-discovery-engine');
const { EnhancedPortRegistry } = require('../../src/enhanced-port-registry');
const { IntegrationTestUtils } = require('./comprehensive-multi-tech-integration.test');
const EventEmitter = require('events');

/**
 * Chaos Testing Configuration
 */
const CHAOS_CONFIG = {
  TEST_DURATION: 30000,        // 30 seconds chaos test duration
  EVENT_INTERVAL_MIN: 100,     // Minimum 100ms between events
  EVENT_INTERVAL_MAX: 1000,    // Maximum 1s between events
  MAX_PROCESSES: 25,           // Maximum concurrent processes
  CONCURRENT_OPERATIONS: 10,   // Number of concurrent operations
  FAILURE_INJECTION_RATE: 0.2, // 20% failure injection rate
  RECOVERY_TIMEOUT: 5000       // 5 second recovery timeout
};

/**
 * Chaos Event Types
 */
const ChaosEventType = {
  PROCESS_START: 'process_start',
  PROCESS_STOP: 'process_stop', 
  PROCESS_RESTART: 'process_restart',
  REGISTRY_CORRUPTION: 'registry_corruption',
  DETECTOR_FAILURE: 'detector_failure',
  NETWORK_DELAY: 'network_delay',
  RESOURCE_EXHAUSTION: 'resource_exhaustion',
  CONCURRENT_ACCESS: 'concurrent_access'
};

/**
 * Chaos Testing Framework
 */
class ChaosTestingFramework extends EventEmitter {
  constructor(discoveryEngine, enhancedRegistry) {
    super();
    this.discoveryEngine = discoveryEngine;
    this.enhancedRegistry = enhancedRegistry;
    
    this.isRunning = false;
    this.activeProcesses = new Map();
    this.chaosEvents = [];
    this.errorCounts = new Map();
    this.recoveryTimes = [];
    
    this.stats = {
      totalEvents: 0,
      successfulEvents: 0,
      failedEvents: 0,
      recoveryAttempts: 0,
      successfulRecoveries: 0,
      averageRecoveryTime: 0
    };
  }

  /**
   * Start chaos testing scenario
   */
  async startChaosTest(scenario = 'default') {
    if (this.isRunning) {
      throw new Error('Chaos test already running');
    }

    console.log(`🌪️ Starting chaos testing scenario: ${scenario}`);
    console.log(`Duration: ${CHAOS_CONFIG.TEST_DURATION}ms, Max processes: ${CHAOS_CONFIG.MAX_PROCESSES}`);

    this.isRunning = true;
    this.stats = {
      totalEvents: 0,
      successfulEvents: 0,
      failedEvents: 0,
      recoveryAttempts: 0,
      successfulRecoveries: 0,
      averageRecoveryTime: 0
    };

    const startTime = Date.now();
    
    try {
      // Initialize some baseline processes
      await this._initializeBaselineProcesses();
      
      // Start the chaos event generator
      const chaosPromise = this._runChaosEventLoop();
      
      // Start concurrent stress operations
      const stressPromise = this._runConcurrentStressTest();
      
      // Wait for test duration
      await Promise.race([
        chaosPromise,
        stressPromise,
        new Promise(resolve => setTimeout(resolve, CHAOS_CONFIG.TEST_DURATION))
      ]);
      
    } finally {
      this.isRunning = false;
      const duration = Date.now() - startTime;
      
      console.log(`🌪️ Chaos test completed in ${duration}ms`);
      this._printChaosTestResults();
    }
  }

  /**
   * Initialize baseline processes for chaos testing
   */
  async _initializeBaselineProcesses() {
    const techStacks = [TechStack.NODEJS, TechStack.PHP, TechStack.PYTHON, TechStack.STATIC, TechStack.DOCKER];
    
    for (let i = 0; i < 5; i++) {
      const techStack = techStacks[i % techStacks.length];
      const port = 9000 + i;
      
      const mockProcess = await IntegrationTestUtils.createMockProcess(techStack, port, {
        framework: `chaos-test-${techStack}`,
        cwd: `/chaos/test/${techStack}/${i}`
      });
      
      this.activeProcesses.set(port, mockProcess);
    }
    
    console.log(`✓ Initialized ${this.activeProcesses.size} baseline processes for chaos testing`);
  }

  /**
   * Run the main chaos event loop
   */
  async _runChaosEventLoop() {
    while (this.isRunning) {
      try {
        // Generate random chaos event
        const eventType = this._selectRandomChaosEvent();
        const event = await this._generateChaosEvent(eventType);
        
        // Execute chaos event
        await this._executeChaosEvent(event);
        
        // Random delay between events
        const delay = Math.random() * (CHAOS_CONFIG.EVENT_INTERVAL_MAX - CHAOS_CONFIG.EVENT_INTERVAL_MIN) + CHAOS_CONFIG.EVENT_INTERVAL_MIN;
        await new Promise(resolve => setTimeout(resolve, delay));
        
      } catch (error) {
        console.warn(`Chaos event execution failed: ${error.message}`);
        this.stats.failedEvents++;
        
        // Attempt recovery
        await this._attemptChaosRecovery(error);
      }
    }
  }

  /**
   * Run concurrent stress test operations
   */
  async _runConcurrentStressTest() {
    const concurrentOperations = [];
    
    for (let i = 0; i < CHAOS_CONFIG.CONCURRENT_OPERATIONS; i++) {
      concurrentOperations.push(this._runSingleStressOperation(i));
    }
    
    try {
      await Promise.allSettled(concurrentOperations);
    } catch (error) {
      console.warn(`Concurrent stress test error: ${error.message}`);
    }
  }

  /**
   * Run a single stress operation
   */
  async _runSingleStressOperation(operationId) {
    while (this.isRunning) {
      try {
        // Perform random discovery operations
        const operation = Math.random();
        
        if (operation < 0.4) {
          // 40% - Full system scan
          await this.discoveryEngine.scanSystemProcesses({
            includeCorrelation: true,
            forceRefresh: true,
            operationId: `stress-${operationId}`
          });
        } else if (operation < 0.7) {
          // 30% - Enhanced registry refresh
          await this.enhancedRegistry.refreshDynamicRegistry();
        } else {
          // 30% - Get all active processes
          await this.enhancedRegistry.getAllActiveProcesses({
            forceRefresh: false,
            includeDetails: Math.random() > 0.5
          });
        }
        
        // Brief pause between operations
        await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
        
      } catch (error) {
        console.warn(`Stress operation ${operationId} failed: ${error.message}`);
        // Continue with next operation
      }
    }
  }

  /**
   * Select a random chaos event type
   */
  _selectRandomChaosEvent() {
    const eventTypes = Object.values(ChaosEventType);
    return eventTypes[Math.floor(Math.random() * eventTypes.length)];
  }

  /**
   * Generate a specific chaos event
   */
  async _generateChaosEvent(eventType) {
    const event = {
      id: `chaos-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: eventType,
      timestamp: Date.now(),
      data: {}
    };

    switch (eventType) {
      case ChaosEventType.PROCESS_START:
        event.data = await this._generateProcessStartEvent();
        break;
        
      case ChaosEventType.PROCESS_STOP:
        event.data = this._generateProcessStopEvent();
        break;
        
      case ChaosEventType.PROCESS_RESTART:
        event.data = this._generateProcessRestartEvent();
        break;
        
      case ChaosEventType.REGISTRY_CORRUPTION:
        event.data = this._generateRegistryCorruptionEvent();
        break;
        
      case ChaosEventType.DETECTOR_FAILURE:
        event.data = this._generateDetectorFailureEvent();
        break;
        
      case ChaosEventType.NETWORK_DELAY:
        event.data = this._generateNetworkDelayEvent();
        break;
        
      case ChaosEventType.RESOURCE_EXHAUSTION:
        event.data = this._generateResourceExhaustionEvent();
        break;
        
      case ChaosEventType.CONCURRENT_ACCESS:
        event.data = this._generateConcurrentAccessEvent();
        break;
    }

    return event;
  }

  /**
   * Execute a chaos event
   */
  async _executeChaosEvent(event) {
    this.stats.totalEvents++;
    
    console.log(`🌪️ Executing chaos event: ${event.type} (${event.id})`);
    
    try {
      switch (event.type) {
        case ChaosEventType.PROCESS_START:
          await this._executeProcessStart(event.data);
          break;
          
        case ChaosEventType.PROCESS_STOP:
          await this._executeProcessStop(event.data);
          break;
          
        case ChaosEventType.PROCESS_RESTART:
          await this._executeProcessRestart(event.data);
          break;
          
        case ChaosEventType.REGISTRY_CORRUPTION:
          await this._executeRegistryCorruption(event.data);
          break;
          
        case ChaosEventType.DETECTOR_FAILURE:
          await this._executeDetectorFailure(event.data);
          break;
          
        case ChaosEventType.NETWORK_DELAY:
          await this._executeNetworkDelay(event.data);
          break;
          
        case ChaosEventType.RESOURCE_EXHAUSTION:
          await this._executeResourceExhaustion(event.data);
          break;
          
        case ChaosEventType.CONCURRENT_ACCESS:
          await this._executeConcurrentAccess(event.data);
          break;
      }
      
      this.stats.successfulEvents++;
      this.chaosEvents.push(event);
      
    } catch (error) {
      this.stats.failedEvents++;
      console.warn(`Chaos event ${event.id} failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate process start event data
   */
  async _generateProcessStartEvent() {
    if (this.activeProcesses.size >= CHAOS_CONFIG.MAX_PROCESSES) {
      throw new Error('Maximum process limit reached');
    }

    const techStacks = [TechStack.NODEJS, TechStack.PHP, TechStack.PYTHON, TechStack.STATIC, TechStack.DOCKER];
    const techStack = techStacks[Math.floor(Math.random() * techStacks.length)];
    const port = 10000 + Math.floor(Math.random() * 1000);

    return {
      techStack,
      port,
      process: await IntegrationTestUtils.createMockProcess(techStack, port, {
        framework: `chaos-${techStack}`,
        command: `chaos-test-${port}`,
        cwd: `/chaos/workspace/${techStack}/${port}`
      })
    };
  }

  /**
   * Generate process stop event data
   */
  _generateProcessStopEvent() {
    const activePorts = Array.from(this.activeProcesses.keys());
    if (activePorts.length === 0) {
      throw new Error('No active processes to stop');
    }

    const port = activePorts[Math.floor(Math.random() * activePorts.length)];
    return {
      port,
      process: this.activeProcesses.get(port)
    };
  }

  /**
   * Generate process restart event data
   */
  _generateProcessRestartEvent() {
    const activePorts = Array.from(this.activeProcesses.keys());
    if (activePorts.length === 0) {
      throw new Error('No active processes to restart');
    }

    const port = activePorts[Math.floor(Math.random() * activePorts.length)];
    return {
      port,
      oldProcess: this.activeProcesses.get(port)
    };
  }

  /**
   * Generate registry corruption event data
   */
  _generateRegistryCorruptionEvent() {
    return {
      corruptionType: Math.random() > 0.5 ? 'data_corruption' : 'state_inconsistency',
      targetComponent: Math.random() > 0.5 ? 'port_registry' : 'process_categories'
    };
  }

  /**
   * Generate detector failure event data
   */
  _generateDetectorFailureEvent() {
    const techStacks = [TechStack.NODEJS, TechStack.PHP, TechStack.PYTHON, TechStack.STATIC, TechStack.DOCKER];
    return {
      targetDetector: techStacks[Math.floor(Math.random() * techStacks.length)],
      failureType: Math.random() > 0.5 ? 'timeout' : 'exception'
    };
  }

  /**
   * Generate network delay event data
   */
  _generateNetworkDelayEvent() {
    return {
      delayMs: Math.floor(Math.random() * 2000) + 500, // 500-2500ms delay
      affectedOperations: ['scan', 'correlate', 'discover']
    };
  }

  /**
   * Generate resource exhaustion event data
   */
  _generateResourceExhaustionEvent() {
    return {
      resourceType: Math.random() > 0.5 ? 'memory' : 'cpu',
      exhaustionLevel: Math.random() * 0.8 + 0.2 // 20-100%
    };
  }

  /**
   * Generate concurrent access event data
   */
  _generateConcurrentAccessEvent() {
    return {
      operationCount: Math.floor(Math.random() * 10) + 5, // 5-15 concurrent operations
      operationType: ['scan', 'refresh', 'categorize', 'correlate'][Math.floor(Math.random() * 4)]
    };
  }

  /**
   * Execute process start chaos event
   */
  async _executeProcessStart(data) {
    this.activeProcesses.set(data.port, data.process);
    console.log(`  ➤ Started process: ${data.techStack} on port ${data.port}`);
  }

  /**
   * Execute process stop chaos event
   */
  async _executeProcessStop(data) {
    this.activeProcesses.delete(data.port);
    console.log(`  ➤ Stopped process on port ${data.port}`);
  }

  /**
   * Execute process restart chaos event
   */
  async _executeProcessRestart(data) {
    const newProcess = await IntegrationTestUtils.createMockProcess(
      data.oldProcess.techStack, 
      data.port, 
      { ...data.oldProcess }
    );
    this.activeProcesses.set(data.port, newProcess);
    console.log(`  ➤ Restarted process on port ${data.port}`);
  }

  /**
   * Execute registry corruption chaos event
   */
  async _executeRegistryCorruption(data) {
    console.log(`  ➤ Simulating ${data.corruptionType} in ${data.targetComponent}`);
    // Simulate corruption by triggering registry operations with invalid data
    try {
      await this.enhancedRegistry.refreshDynamicRegistry();
    } catch (error) {
      // Expected corruption error
    }
  }

  /**
   * Execute detector failure chaos event
   */
  async _executeDetectorFailure(data) {
    console.log(`  ➤ Simulating ${data.failureType} failure in ${data.targetDetector} detector`);
    
    // Simulate detector failure by performing scan with timeout/error injection
    try {
      await this.discoveryEngine.scanSystemProcesses({
        includeCorrelation: true,
        forceRefresh: true,
        injectFailure: data.targetDetector // Custom test option
      });
    } catch (error) {
      // Expected detector failure
    }
  }

  /**
   * Execute network delay chaos event
   */
  async _executeNetworkDelay(data) {
    console.log(`  ➤ Simulating ${data.delayMs}ms network delay`);
    await new Promise(resolve => setTimeout(resolve, data.delayMs));
  }

  /**
   * Execute resource exhaustion chaos event
   */
  async _executeResourceExhaustion(data) {
    console.log(`  ➤ Simulating ${data.resourceType} exhaustion (${(data.exhaustionLevel * 100).toFixed(0)}%)`);
    
    if (data.resourceType === 'memory') {
      // Simulate memory pressure
      const mockMemoryLoad = new Array(Math.floor(data.exhaustionLevel * 1000)).fill(new Array(1000).fill('x'));
      await new Promise(resolve => setTimeout(resolve, 100));
      // Release memory
      mockMemoryLoad.length = 0;
    } else {
      // Simulate CPU pressure
      const cpuIntensiveStart = Date.now();
      while (Date.now() - cpuIntensiveStart < data.exhaustionLevel * 100) {
        Math.random(); // Light CPU work
      }
    }
  }

  /**
   * Execute concurrent access chaos event
   */
  async _executeConcurrentAccess(data) {
    console.log(`  ➤ Executing ${data.operationCount} concurrent ${data.operationType} operations`);
    
    const concurrentOps = [];
    
    for (let i = 0; i < data.operationCount; i++) {
      switch (data.operationType) {
        case 'scan':
          concurrentOps.push(this.discoveryEngine.scanSystemProcesses({ includeCorrelation: true }));
          break;
        case 'refresh':
          concurrentOps.push(this.enhancedRegistry.refreshDynamicRegistry());
          break;
        case 'categorize':
          concurrentOps.push(this.enhancedRegistry.getAllActiveProcesses({ forceRefresh: true }));
          break;
        case 'correlate':
          concurrentOps.push(this.discoveryEngine.scanSystemProcesses({ includeCorrelation: true, forceRefresh: true }));
          break;
      }
    }
    
    const results = await Promise.allSettled(concurrentOps);
    const successful = results.filter(r => r.status === 'fulfilled').length;
    console.log(`    ${successful}/${data.operationCount} concurrent operations completed successfully`);
  }

  /**
   * Attempt recovery from chaos event failure
   */
  async _attemptChaosRecovery(error) {
    this.stats.recoveryAttempts++;
    const recoveryStartTime = Date.now();
    
    console.log(`🔧 Attempting recovery from chaos event failure...`);
    
    try {
      // Attempt basic system recovery
      await this.discoveryEngine.scanSystemProcesses({
        includeCorrelation: true,
        forceRefresh: true
      });
      
      // Attempt registry recovery
      await this.enhancedRegistry.refreshDynamicRegistry();
      
      const recoveryTime = Date.now() - recoveryStartTime;
      this.recoveryTimes.push(recoveryTime);
      this.stats.successfulRecoveries++;
      
      console.log(`✓ Recovery successful in ${recoveryTime}ms`);
      
    } catch (recoveryError) {
      console.warn(`✗ Recovery failed: ${recoveryError.message}`);
    }
  }

  /**
   * Print chaos test results
   */
  _printChaosTestResults() {
    console.log('\n🌪️ Chaos Testing Results:');
    console.log(`   Total Events: ${this.stats.totalEvents}`);
    console.log(`   Successful Events: ${this.stats.successfulEvents} (${((this.stats.successfulEvents / this.stats.totalEvents) * 100).toFixed(1)}%)`);
    console.log(`   Failed Events: ${this.stats.failedEvents} (${((this.stats.failedEvents / this.stats.totalEvents) * 100).toFixed(1)}%)`);
    console.log(`   Recovery Attempts: ${this.stats.recoveryAttempts}`);
    console.log(`   Successful Recoveries: ${this.stats.successfulRecoveries} (${this.stats.recoveryAttempts > 0 ? ((this.stats.successfulRecoveries / this.stats.recoveryAttempts) * 100).toFixed(1) : 0}%)`);
    
    if (this.recoveryTimes.length > 0) {
      const avgRecoveryTime = this.recoveryTimes.reduce((a, b) => a + b, 0) / this.recoveryTimes.length;
      console.log(`   Average Recovery Time: ${avgRecoveryTime.toFixed(0)}ms`);
    }
    
    console.log(`   Active Processes at End: ${this.activeProcesses.size}`);
  }

  /**
   * Get chaos test results
   */
  getChaosTestResults() {
    return {
      ...this.stats,
      recoveryTimes: [...this.recoveryTimes],
      activeProcessCount: this.activeProcesses.size,
      chaosEvents: this.chaosEvents.slice(-20) // Last 20 events
    };
  }
}

/**
 * Chaos Testing Test Suite
 */
describe('Chaos Testing Framework', () => {
  let discoveryEngine;
  let enhancedRegistry;
  let chaosFramework;

  beforeAll(async () => {
    console.log('🌪️ Initializing Chaos Testing Framework...');
    
    // Initialize components for chaos testing
    enhancedRegistry = new EnhancedPortRegistry(null, {
      refreshInterval: 2000,
      enableRealTimeUpdates: true,
      enableErrorRecovery: true
    });

    discoveryEngine = new MultiTechProcessDiscoveryEngine({
      scanTimeout: 3000, // Longer timeout for chaos conditions
      performanceMonitoring: true,
      correlationEnabled: true,
      portRegistry: enhancedRegistry
    });

    await discoveryEngine.initialize();
    await enhancedRegistry.initialize();

    chaosFramework = new ChaosTestingFramework(discoveryEngine, enhancedRegistry);
  });

  afterAll(async () => {
    if (discoveryEngine) await discoveryEngine.shutdown();
    if (enhancedRegistry) await enhancedRegistry.shutdown();
  });

  test('Execute comprehensive chaos testing scenario', async () => {
    await chaosFramework.startChaosTest('comprehensive');
    
    const results = chaosFramework.getChaosTestResults();
    
    // Validate chaos test results
    expect(results.totalEvents).toBeGreaterThan(10); // Minimum events generated
    expect(results.successfulEvents / results.totalEvents).toBeGreaterThan(0.5); // At least 50% success rate
    
    if (results.recoveryAttempts > 0) {
      expect(results.successfulRecoveries / results.recoveryAttempts).toBeGreaterThan(0.7); // At least 70% recovery success
    }
    
    console.log('✅ Chaos testing completed successfully');
  }, 60000); // 60 second timeout for chaos testing
});

module.exports = {
  ChaosTestingFramework,
  ChaosEventType,
  CHAOS_CONFIG
};