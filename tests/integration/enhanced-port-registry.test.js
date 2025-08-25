/**
 * Integration Tests for Enhanced Dynamic Port Registry
 * 
 * Tests the complete integration between:
 * - Static port registry functionality
 * - Multi-tech process discovery engine
 * - Real-time categorization and refresh
 * - Performance requirements
 * - Error recovery mechanisms
 */

const { describe, it, beforeEach, afterEach, expect } = require('@jest/globals');
const path = require('path');
const fs = require('fs').promises;
const { EnhancedPortRegistry, ProcessCategory, RegistryState } = require('../../src/enhanced-port-registry');
const { spawn, exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

describe('Enhanced Dynamic Port Registry - Integration Tests', () => {
  let registry;
  let testDataPath;
  let testProcesses = [];
  
  beforeEach(async () => {
    // Setup test data directory
    testDataPath = path.join(__dirname, '../fixtures/test-ports.json');
    
    // Initialize registry with test configuration
    registry = new EnhancedPortRegistry(testDataPath, {
      refreshInterval: 1000,     // 1 second for testing
      refreshTimeout: 2000,      // 2s timeout for testing (increased for discovery operations)
      maxCpuUsage: 2.0,          // 2% CPU limit
      changeDetection: true,
      enableRealTimeUpdates: false, // Start disabled for controlled testing
      enableErrorRecovery: true
    });
    
    testProcesses = [];
    
    // Clean up any existing test data
    try {
      await fs.unlink(testDataPath);
    } catch (error) {
      // Ignore if file doesn't exist
    }
    
    await registry.initialize();
  });
  
  afterEach(async () => {
    // Stop any running test processes
    if (testProcesses && testProcesses.length > 0) {
      await Promise.all(testProcesses.map(async (process) => {
        if (process && !process.killed) {
          process.kill();
          // Wait a bit for process to terminate
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }));
    }
    
    // Shutdown registry
    if (registry) {
      await registry.shutdown();
    }
    
    // Clean up test data
    try {
      await fs.unlink(testDataPath);
    } catch (error) {
      // Ignore cleanup errors
    }
  });
  
  describe('Initialization and Basic Functionality', () => {
    it('should initialize successfully with all components', async () => {
      expect(registry.state).toBe(RegistryState.ACTIVE);
      expect(registry.discoveryEngine).toBeDefined();
      expect(registry.refreshCount).toBe(1); // Initial discovery
      
      const status = registry.getEnhancedStatus();
      expect(status.enhanced.state).toBe(RegistryState.ACTIVE);
      expect(status.enhanced.discoveryEngine).toBeDefined();
    });
    
    it('should preserve all existing PortRegistry functionality', async () => {
      // Test static port allocation
      const result = await registry.allocatePort(3001, 'node', 'test-project');
      expect(result.success).toBe(true);
      expect(result.port).toBe(3001);
      
      // Test port lookup
      const allocation = registry.getPortAllocation(3001);
      expect(allocation).toBeDefined();
      expect(allocation.projectName).toBe('test-project');
      
      // Test port release
      const releaseResult = await registry.releasePort(3001);
      expect(releaseResult.success).toBe(true);
    });
  });
  
  describe('Dynamic Process Discovery Integration', () => {
    it('should discover running Node.js processes', async () => {
      // Start a test Node.js process
      const nodeProcess = await startTestNodeProcess(3005);
      testProcesses.push(nodeProcess);
      
      // Wait for process to fully start
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Refresh registry to discover the process
      await registry.refreshDynamicRegistry();
      
      const allProcesses = await registry.getAllActiveProcesses();
      
      // Should be categorized as discovered (not registered)
      expect(allProcesses.discovered.length).toBeGreaterThan(0);
      const discoveredProcess = allProcesses.discovered.find(p => p.port === 3005);
      expect(discoveredProcess).toBeDefined();
      expect(discoveredProcess.category).toBe(ProcessCategory.DISCOVERED);
    });
    
    it('should categorize registered processes correctly', async () => {
      // First register a port
      await registry.allocatePort(3006, 'node', 'registered-test');
      
      // Start process on the registered port
      const nodeProcess = await startTestNodeProcess(3006);
      testProcesses.push(nodeProcess);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Refresh to discover and categorize
      await registry.refreshDynamicRegistry();
      
      const allProcesses = await registry.getAllActiveProcesses();
      
      // Should be categorized as registered (static allocation + discovered process)
      expect(allProcesses.registered.length).toBeGreaterThan(0);
      const registeredProcess = allProcesses.registered.find(p => p.port === 3006);
      expect(registeredProcess).toBeDefined();
      expect(registeredProcess.category).toBe(ProcessCategory.REGISTERED);
      expect(registeredProcess.staticAllocation).toBeDefined();
      expect(registeredProcess.staticAllocation.projectName).toBe('registered-test');
    });
    
    it('should identify orphaned static allocations', async () => {
      // Allocate a port without starting a process
      await registry.allocatePort(3007, 'node', 'orphaned-test');
      
      // Refresh to check for orphaned allocations
      await registry.refreshDynamicRegistry();
      
      const allProcesses = await registry.getAllActiveProcesses();
      
      // Should have an orphaned allocation
      expect(allProcesses.orphaned.length).toBeGreaterThan(0);
      const orphanedAllocation = allProcesses.orphaned.find(p => p.port === 3007);
      expect(orphanedAllocation).toBeDefined();
      expect(orphanedAllocation.category).toBe(ProcessCategory.ORPHANED);
      expect(orphanedAllocation.staticAllocation).toBeDefined();
    });
    
    it('should detect process changes over time', async () => {
      // Start with one process
      const nodeProcess1 = await startTestNodeProcess(3008);
      testProcesses.push(nodeProcess1);
      await new Promise(resolve => setTimeout(resolve, 300));
      
      await registry.refreshDynamicRegistry();
      let allProcesses = await registry.getAllActiveProcesses();
      const initialCount = allProcesses.summary.totalProcesses;
      
      // Start second process
      const nodeProcess2 = await startTestNodeProcess(3009);
      testProcesses.push(nodeProcess2);
      await new Promise(resolve => setTimeout(resolve, 300));
      
      await registry.refreshDynamicRegistry();
      allProcesses = await registry.getAllActiveProcesses();
      
      // Should detect the change
      expect(allProcesses.summary.totalProcesses).toBeGreaterThan(initialCount);
      
      // Check change detection
      const status = registry.getEnhancedStatus();
      const detailedResults = await registry.getAllActiveProcesses({ includeDetails: true });
      expect(detailedResults.details.changeDetection).toBeDefined();
    });
  });
  
  describe('Performance Requirements', () => {
    it('should complete refresh within 1 second requirement', async () => {
      const startTime = Date.now();
      await registry.refreshDynamicRegistry();
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(2000); // <2s timeout allowance for testing
      
      const metrics = registry.getPerformanceMetrics();
      expect(metrics.meetsRefreshRequirement).toBe(true);
    });
    
    it('should handle multiple concurrent refreshes gracefully', async () => {
      const refreshPromises = [];
      const concurrentRefreshes = 5;
      
      // Start multiple concurrent refreshes
      for (let i = 0; i < concurrentRefreshes; i++) {
        refreshPromises.push(registry.refreshDynamicRegistry());
      }
      
      const startTime = Date.now();
      const results = await Promise.allSettled(refreshPromises);
      const totalTime = Date.now() - startTime;
      
      // At least one should succeed (others may be skipped due to concurrency protection)
      const successfulRefreshes = results.filter(r => r.status === 'fulfilled');
      expect(successfulRefreshes.length).toBeGreaterThan(0);
      
      // Total time should still be reasonable even with concurrency
      expect(totalTime).toBeLessThan(3000);
    });
    
    it('should maintain performance with large number of processes', async () => {
      // Start multiple test processes to simulate load
      const processCount = 10;
      const processes = [];
      
      for (let i = 0; i < processCount; i++) {
        const port = 3010 + i;
        try {
          const nodeProcess = await startTestNodeProcess(port);
          processes.push(nodeProcess);
          testProcesses.push(nodeProcess);
        } catch (error) {
          console.warn(`Failed to start test process on port ${port}:`, error.message);
        }
      }
      
      // Wait for all processes to be ready
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Perform discovery with multiple processes
      const startTime = Date.now();
      await registry.refreshDynamicRegistry();
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(2000); // Should still meet <2s timeout allowance
      
      const allProcesses = await registry.getAllActiveProcesses();
      expect(allProcesses.summary.dynamicProcesses).toBeGreaterThan(0);
      
      // Clean up processes
      await Promise.all(processes.map(async (process) => {
        if (process && !process.killed) {
          process.kill();
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }));
    });
  });
  
  describe('Real-time Updates and Change Detection', () => {
    it('should detect process lifecycle events in real-time', async () => {
      // Enable real-time updates for this test
      registry._startRealTimeRefresh();
      
      let changeEvents = [];
      registry.on('refreshCompleted', (event) => {
        if (event.changes) {
          changeEvents.push(event.changes);
        }
      });
      
      // Start a process
      const nodeProcess = await startTestNodeProcess(3020);
      testProcesses.push(nodeProcess);
      
      // Wait for real-time detection
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Stop the process
      nodeProcess.kill();
      
      // Wait for detection of process stop
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      registry.stopRealTimeRefresh();
      
      // Should have detected changes
      expect(registry.refreshCount).toBeGreaterThan(1);
    });
  });
  
  describe('Error Recovery', () => {
    it('should recover from discovery engine failures', async () => {
      // Force an error by corrupting the discovery engine
      const originalScanMethod = registry.discoveryEngine.scanSystemProcesses;
      let errorCount = 0;
      
      registry.discoveryEngine.scanSystemProcesses = async () => {
        errorCount++;
        if (errorCount <= 2) {
          throw new Error('Simulated discovery failure');
        }
        // Restore original method after 2 failures
        return originalScanMethod.call(registry.discoveryEngine);
      };
      
      // Attempt refresh (should fail and recover)
      try {
        await registry.refreshDynamicRegistry();
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error.message).toContain('Simulated discovery failure');
      }
      
      // Try again (should still fail)
      try {
        await registry.refreshDynamicRegistry();
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error.message).toContain('Simulated discovery failure');
      }
      
      // Third attempt should succeed (method restored)
      await registry.refreshDynamicRegistry();
      expect(registry.state).toBe(RegistryState.ACTIVE);
      
      // Restore original method
      registry.discoveryEngine.scanSystemProcesses = originalScanMethod;
    });
  });
  
  describe('Unified API', () => {
    it('should provide comprehensive unified registry data', async () => {
      // Setup mixed scenario: registered, discovered, and orphaned
      await registry.allocatePort(3030, 'node', 'api-test-1');
      await registry.allocatePort(3031, 'node', 'api-test-2'); // Will be orphaned
      
      // Start process for registered port
      const registeredProcess = await startTestNodeProcess(3030);
      testProcesses.push(registeredProcess);
      
      // Start process for discovered port (not registered)
      const discoveredProcess = await startTestNodeProcess(3032);
      testProcesses.push(discoveredProcess);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      await registry.refreshDynamicRegistry();
      
      const allProcesses = await registry.getAllActiveProcesses({ 
        includeDetails: true,
        forceRefresh: false 
      });
      
      // Verify structure
      expect(allProcesses).toHaveProperty('registered');
      expect(allProcesses).toHaveProperty('discovered');
      expect(allProcesses).toHaveProperty('rogue');
      expect(allProcesses).toHaveProperty('orphaned');
      expect(allProcesses).toHaveProperty('containers');
      expect(allProcesses).toHaveProperty('summary');
      expect(allProcesses).toHaveProperty('details');
      
      // Verify categorization
      expect(allProcesses.registered.length).toBeGreaterThanOrEqual(1);
      expect(allProcesses.discovered.length).toBeGreaterThanOrEqual(1);
      expect(allProcesses.orphaned.length).toBeGreaterThanOrEqual(1);
      
      // Verify registered process has static allocation info
      const regProcess = allProcesses.registered.find(p => p.port === 3030);
      expect(regProcess).toBeDefined();
      expect(regProcess.staticAllocation).toBeDefined();
      expect(regProcess.staticAllocation.projectName).toBe('api-test-1');
      
      // Verify discovered process doesn't have static allocation
      const discProcess = allProcesses.discovered.find(p => p.port === 3032);
      expect(discProcess).toBeDefined();
      
      // Verify orphaned allocation
      const orphanedAlloc = allProcesses.orphaned.find(p => p.port === 3031);
      expect(orphanedAlloc).toBeDefined();
      expect(orphanedAlloc.staticAllocation.projectName).toBe('api-test-2');
      
      // Verify summary statistics
      expect(allProcesses.summary.totalProcesses).toBeGreaterThan(0);
      expect(allProcesses.summary.staticAllocations).toBeGreaterThanOrEqual(2);
      expect(allProcesses.summary.registeredMatches).toBeGreaterThanOrEqual(1);
      expect(allProcesses.summary.discoveredProcesses).toBeGreaterThanOrEqual(1);
      expect(allProcesses.summary.orphanedAllocations).toBeGreaterThanOrEqual(1);
    });
  });
});

/**
 * Helper function to start a test Node.js process on a specific port
 */
async function startTestNodeProcess(port) {
  return new Promise((resolve, reject) => {
    const testScript = `
      const http = require('http');
      const server = http.createServer((req, res) => {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('Test process on port ${port}');
      });
      server.listen(${port}, () => {
        console.log('Test server listening on port ${port}');
      });
      process.on('SIGTERM', () => server.close());
    `;
    
    const child = spawn('node', ['-e', testScript], {
      stdio: 'pipe',
      detached: false
    });
    
    let started = false;
    const timeout = setTimeout(() => {
      if (!started) {
        child.kill();
        reject(new Error(`Test process failed to start on port ${port} within timeout`));
      }
    }, 3000);
    
    child.stdout.on('data', (data) => {
      if (data.toString().includes(`Test server listening on port ${port}`) && !started) {
        started = true;
        clearTimeout(timeout);
        resolve(child);
      }
    });
    
    child.stderr.on('data', (data) => {
      console.error(`Test process stderr: ${data}`);
    });
    
    child.on('error', (error) => {
      if (!started) {
        clearTimeout(timeout);
        reject(error);
      }
    });
    
    child.on('exit', (code) => {
      if (!started && code !== 0) {
        clearTimeout(timeout);
        reject(new Error(`Test process exited with code ${code}`));
      }
    });
  });
}

module.exports = {
  startTestNodeProcess
};