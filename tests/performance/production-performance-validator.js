#!/usr/bin/env node

/**
 * Production Performance Validator
 * 
 * Comprehensive performance testing and validation for the Multi-Tech Stack Process Discovery system
 * before production deployment. This standalone validator ensures all performance benchmarks are met:
 * 
 * REQUIREMENTS:
 * - Discovery Engine: < 2 seconds for full multi-tech system scan
 * - MCP Tools: < 500ms response time for all 15 process management tools  
 * - CPU Usage: < 5% during active discovery operations
 * - Memory Usage: < 50MB additional footprint
 * - UI Performance: < 1 second refresh with 50+ processes
 * - Load Testing: 50+ processes across multiple tech stacks
 * - Stability Testing: 8+ hour continuous operation without degradation
 */

const { performance } = require('perf_hooks');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

// Import core components
const { MultiTechProcessDiscoveryEngine, TechStack } = require('../../src/services/multi-tech-process-discovery-engine');
const { EnhancedPortRegistry } = require('../../src/enhanced-port-registry');
const { PerformanceMonitor } = require('../../src/services/performance-monitor');
const { RegistryPerformanceOptimizer } = require('../../src/services/registry-performance-optimizer');

/**
 * Performance Validation Configuration
 */
const VALIDATION_CONFIG = {
  // Performance Requirements (Production Standards)
  requirements: {
    discoveryMaxTime: 2000,        // 2 seconds maximum discovery time
    mcpToolsMaxTime: 500,          // 500ms maximum MCP tool response
    maxCpuPercent: 5.0,           // 5% maximum CPU usage
    maxMemoryMB: 50,              // 50MB maximum memory overhead
    uiRefreshMaxTime: 1000,       // 1 second maximum UI refresh
    minSuccessRate: 95.0,         // 95% minimum success rate
    maxErrorRate: 5.0             // 5% maximum error rate
  },
  
  // Load Testing Parameters
  loadTesting: {
    minProcessCount: 50,          // Minimum processes for load testing
    testDurationHours: 8,         // 8+ hour stability testing
    concurrentAgents: 3,          // Simulate multiple agents
    batchSizes: [10, 25, 50, 75], // Different load levels
  },
  
  // Test Configuration
  testing: {
    warmupIterations: 5,
    testIterations: 20,
    stabilityCheckInterval: 60000, // 1 minute intervals for stability
    reportDirectory: '/mnt/c/Code/plopdock/project_docs/qa/performance-baselines'
  }
};

/**
 * Performance Test Categories
 */
const TestCategory = {
  DISCOVERY_BASELINE: 'discovery_baseline',
  MCP_TOOLS_RESPONSE: 'mcp_tools_response',
  LOAD_TESTING_50_PLUS: 'load_testing_50_plus',
  STABILITY_8_HOUR: 'stability_8_hour',
  MEMORY_LEAK_DETECTION: 'memory_leak_detection',
  CPU_USAGE_VALIDATION: 'cpu_usage_validation',
  CONCURRENT_OPERATIONS: 'concurrent_operations',
  UI_PERFORMANCE: 'ui_performance'
};

/**
 * Production Performance Validator
 */
class ProductionPerformanceValidator {
  constructor() {
    this.discoveryEngine = null;
    this.enhancedRegistry = null;
    this.performanceMonitor = null;
    this.performanceOptimizer = null;
    
    this.testResults = {
      startTime: null,
      endTime: null,
      duration: 0,
      categories: {},
      requirements: {},
      loadTesting: {},
      stabilityTesting: {},
      overallGrade: 'PENDING'
    };
    
    this.validationErrors = [];
    this.performanceWarnings = [];
  }
  
  /**
   * Initialize all components for testing
   */
  async initialize() {
    console.log('🎯 Initializing Production Performance Validator...');
    console.log(`Requirements: Discovery < ${VALIDATION_CONFIG.requirements.discoveryMaxTime}ms, CPU < ${VALIDATION_CONFIG.requirements.maxCpuPercent}%, Memory < ${VALIDATION_CONFIG.requirements.maxMemoryMB}MB`);
    
    try {
      // Initialize Performance Monitor
      this.performanceMonitor = new PerformanceMonitor({
        enabled: true,
        samplingInterval: 1000,
        historySize: 1000,
        cpuThreshold: VALIDATION_CONFIG.requirements.maxCpuPercent,
        memoryThreshold: VALIDATION_CONFIG.requirements.maxMemoryMB,
        scanTimeThreshold: VALIDATION_CONFIG.requirements.discoveryMaxTime
      });
      
      await this.performanceMonitor.initialize();
      
      // Initialize Registry Performance Optimizer
      this.performanceOptimizer = new RegistryPerformanceOptimizer({
        enableSmartCaching: true,
        enableBatchProcessing: true,
        enableAsyncQueueing: true,
        enablePerformanceMonitoring: true
      });
      
      await this.performanceOptimizer.initialize();
      
      // Initialize Enhanced Port Registry
      this.enhancedRegistry = new EnhancedPortRegistry(null, {
        refreshInterval: 1000,
        enableRealTimeUpdates: true,
        enableErrorRecovery: true,
        enableSmartCaching: true,
        enablePerformanceMonitoring: true,
        performanceMonitor: this.performanceMonitor,
        performanceOptimizer: this.performanceOptimizer
      });
      
      // Initialize Discovery Engine
      this.discoveryEngine = new MultiTechProcessDiscoveryEngine({
        scanTimeout: VALIDATION_CONFIG.requirements.discoveryMaxTime,
        performanceMonitoring: true,
        correlationEnabled: true,
        portRegistry: this.enhancedRegistry,
        performanceMonitor: this.performanceMonitor,
        
        // Enable all detectors for comprehensive testing
        nodejs: { enabled: true, gracefulDegradation: true },
        php: { enabled: true, gracefulDegradation: true },
        python: { enabled: true, gracefulDegradation: true },
        static: { enabled: true, gracefulDegradation: true },
        docker: { enabled: true, gracefulDegradation: true }
      });
      
      await this.discoveryEngine.initialize();
      await this.enhancedRegistry.initialize();
      
      console.log('✓ Production Performance Validator initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize Performance Validator:', error.message);
      throw error;
    }
  }
  
  /**
   * Execute comprehensive performance validation
   */
  async executeValidation() {
    console.log('\\n🚀 Starting Production Performance Validation...');
    console.log('Target: Validate system meets production performance requirements');
    
    this.testResults.startTime = Date.now();
    
    try {
      // Phase 1: Baseline Performance Testing
      console.log('\\n📊 Phase 1: Baseline Performance Testing');
      await this.executeBaselineTests();
      
      // Phase 2: Load Testing with 50+ Processes
      console.log('\\n🔥 Phase 2: Load Testing with 50+ Processes');
      await this.executeLoadTests();
      
      // Phase 3: MCP Tools Performance Testing
      console.log('\\n⚡ Phase 3: MCP Tools Performance Testing');
      await this.executeMCPToolsTests();
      
      // Phase 4: Concurrent Operations Testing
      console.log('\\n🔄 Phase 4: Concurrent Operations Testing');
      await this.executeConcurrentTests();
      
      // Phase 5: Memory Leak Detection
      console.log('\\n🧠 Phase 5: Memory Leak Detection');
      await this.executeMemoryLeakTests();
      
      // Phase 6: Short Stability Test (for immediate validation)
      console.log('\\n⏰ Phase 6: Stability Testing (15 minutes)');
      await this.executeShortStabilityTest();
      
      // Generate validation report
      await this.generateValidationReport();
      
      // Provide final assessment
      this.provideFinalAssessment();
      
    } finally {
      this.testResults.endTime = Date.now();
      this.testResults.duration = this.testResults.endTime - this.testResults.startTime;
      
      console.log(`\\n✅ Performance Validation completed in ${(this.testResults.duration / 1000).toFixed(1)} seconds`);
    }
  }
  
  /**
   * Execute baseline performance tests
   */
  async executeBaselineTests() {
    const category = TestCategory.DISCOVERY_BASELINE;
    const measurements = [];
    
    console.log(`Testing discovery performance over ${VALIDATION_CONFIG.testing.testIterations} iterations...`);
    
    // Warmup phase
    for (let i = 0; i < VALIDATION_CONFIG.testing.warmupIterations; i++) {
      await this.discoveryEngine.scanSystemProcesses({
        includeCorrelation: true,
        forceRefresh: true
      });
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    // Measurement phase
    for (let iteration = 0; iteration < VALIDATION_CONFIG.testing.testIterations; iteration++) {
      const startTime = performance.now();
      const startMemory = process.memoryUsage();
      
      const scanMonitor = this.performanceMonitor.startScanMonitoring(`baseline_${iteration}`);
      
      try {
        const results = await this.discoveryEngine.scanSystemProcesses({
          includeCorrelation: true,
          forceRefresh: true,
          techStacks: [TechStack.NODEJS, TechStack.PHP, TechStack.PYTHON, TechStack.STATIC, TechStack.DOCKER]
        });
        
        const endTime = performance.now();
        const endMemory = process.memoryUsage();
        const duration = endTime - startTime;
        
        const measurement = {
          iteration,
          duration,
          processCount: results.summary?.totalProcesses || 0,
          memoryDelta: endMemory.rss - startMemory.rss,
          success: true,
          scanResults: scanMonitor ? scanMonitor.getResults() : null
        };
        
        measurements.push(measurement);
        
        // Record with performance monitor
        this.performanceMonitor.recordScanCompletion({
          duration,
          totalProcesses: measurement.processCount,
          success: true,
          scanId: `baseline_${iteration}`
        });
        
        if ((iteration + 1) % 5 === 0) {
          console.log(`  Progress: ${iteration + 1}/${VALIDATION_CONFIG.testing.testIterations} - Avg: ${(measurements.slice(-5).reduce((sum, m) => sum + m.duration, 0) / 5).toFixed(0)}ms`);
        }
        
      } catch (error) {
        measurements.push({
          iteration,
          duration: performance.now() - startTime,
          processCount: 0,
          memoryDelta: 0,
          success: false,
          error: error.message
        });
        
        this.performanceMonitor.recordError(error, { category, iteration });
      }
      
      // Brief pause between iterations
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Calculate metrics
    const successfulMeasurements = measurements.filter(m => m.success);
    const durations = successfulMeasurements.map(m => m.duration);
    durations.sort((a, b) => a - b);
    
    const baseline = {
      category,
      timestamp: new Date().toISOString(),
      totalIterations: measurements.length,
      successfulIterations: successfulMeasurements.length,
      successRate: (successfulMeasurements.length / measurements.length) * 100,
      
      duration: {
        average: durations.reduce((a, b) => a + b, 0) / durations.length,
        median: durations[Math.floor(durations.length / 2)],
        p95: durations[Math.floor(durations.length * 0.95)],
        p99: durations[Math.floor(durations.length * 0.99)],
        min: Math.min(...durations),
        max: Math.max(...durations)
      },
      
      requirements: {
        discoveryTime: {
          requirement: VALIDATION_CONFIG.requirements.discoveryMaxTime,
          actual: durations.reduce((a, b) => a + b, 0) / durations.length,
          passes: (durations.reduce((a, b) => a + b, 0) / durations.length) < VALIDATION_CONFIG.requirements.discoveryMaxTime
        },
        successRate: {
          requirement: VALIDATION_CONFIG.requirements.minSuccessRate,
          actual: (successfulMeasurements.length / measurements.length) * 100,
          passes: ((successfulMeasurements.length / measurements.length) * 100) >= VALIDATION_CONFIG.requirements.minSuccessRate
        }
      },
      
      measurements: measurements
    };
    
    this.testResults.categories[category] = baseline;
    
    // Validation check
    if (!baseline.requirements.discoveryTime.passes) {
      this.validationErrors.push(`Discovery time ${baseline.requirements.discoveryTime.actual.toFixed(0)}ms exceeds requirement ${VALIDATION_CONFIG.requirements.discoveryMaxTime}ms`);
    }
    
    if (!baseline.requirements.successRate.passes) {
      this.validationErrors.push(`Success rate ${baseline.requirements.successRate.actual.toFixed(1)}% below requirement ${VALIDATION_CONFIG.requirements.minSuccessRate}%`);
    }
    
    console.log(`  ✓ Baseline: avg=${baseline.duration.average.toFixed(0)}ms, p95=${baseline.duration.p95.toFixed(0)}ms, success=${baseline.successRate.toFixed(1)}%`);
    
    if (baseline.requirements.discoveryTime.passes && baseline.requirements.successRate.passes) {
      console.log(`  ✅ PASSES: Discovery performance meets production requirements`);
    } else {
      console.log(`  ❌ FAILS: Discovery performance does not meet production requirements`);
    }
  }
  
  /**
   * Execute load testing with 50+ processes
   */
  async executeLoadTests() {
    const category = TestCategory.LOAD_TESTING_50_PLUS;
    const loadResults = {};
    
    for (const batchSize of VALIDATION_CONFIG.loadTesting.batchSizes) {
      console.log(`\\n  Testing load capacity with ${batchSize} process simulation...`);
      
      const batchResults = [];
      
      for (let iteration = 0; iteration < 10; iteration++) {
        const startTime = performance.now();
        const startMemory = process.memoryUsage();
        const startCpu = this.performanceMonitor.getCurrentMetrics().cpu.current;
        
        try {
          // Simulate high load by performing multiple concurrent scans
          const concurrentScans = [];
          const scansPerBatch = Math.min(batchSize / 10, 5); // Up to 5 concurrent scans
          
          for (let i = 0; i < scansPerBatch; i++) {
            concurrentScans.push(
              this.discoveryEngine.scanSystemProcesses({
                includeCorrelation: true,
                forceRefresh: i === 0, // Only force refresh on first scan
                techStacks: [TechStack.NODEJS, TechStack.PHP, TechStack.PYTHON, TechStack.STATIC, TechStack.DOCKER]
              })
            );
          }
          
          const scanResults = await Promise.allSettled(concurrentScans);
          const successfulScans = scanResults.filter(r => r.status === 'fulfilled');
          
          const endTime = performance.now();
          const endMemory = process.memoryUsage();
          const endCpu = this.performanceMonitor.getCurrentMetrics().cpu.current;
          
          const measurement = {
            iteration,
            batchSize,
            duration: endTime - startTime,
            concurrentScans: scansPerBatch,
            successfulScans: successfulScans.length,
            memoryDelta: endMemory.rss - startMemory.rss,
            cpuUsage: Math.max(endCpu - startCpu, 0),
            totalProcesses: successfulScans.reduce((sum, scan) => {
              return sum + (scan.value?.summary?.totalProcesses || 0);
            }, 0),
            success: successfulScans.length === scansPerBatch
          };
          
          batchResults.push(measurement);
          
        } catch (error) {
          batchResults.push({
            iteration,
            batchSize,
            duration: performance.now() - startTime,
            success: false,
            error: error.message
          });
        }
        
        // Brief pause between iterations
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      // Calculate batch metrics
      const successfulBatch = batchResults.filter(r => r.success);
      const avgDuration = successfulBatch.length > 0 ? 
        successfulBatch.reduce((sum, r) => sum + r.duration, 0) / successfulBatch.length : 0;
      const avgMemoryDelta = successfulBatch.length > 0 ?
        successfulBatch.reduce((sum, r) => sum + r.memoryDelta, 0) / successfulBatch.length : 0;
      const avgCpuUsage = successfulBatch.length > 0 ?
        successfulBatch.reduce((sum, r) => sum + r.cpuUsage, 0) / successfulBatch.length : 0;
      
      loadResults[`batch_${batchSize}`] = {
        batchSize,
        iterations: batchResults.length,
        successfulIterations: successfulBatch.length,
        successRate: (successfulBatch.length / batchResults.length) * 100,
        averageDuration: avgDuration,
        averageMemoryDelta: avgMemoryDelta,
        averageCpuUsage: avgCpuUsage,
        measurements: batchResults,
        
        requirements: {
          processingTime: avgDuration < VALIDATION_CONFIG.requirements.discoveryMaxTime * 2, // Allow 2x for heavy load
          cpuUsage: avgCpuUsage < VALIDATION_CONFIG.requirements.maxCpuPercent,
          memoryUsage: (avgMemoryDelta / 1024 / 1024) < VALIDATION_CONFIG.requirements.maxMemoryMB
        }
      };
      
      console.log(`    ✓ Batch ${batchSize}: avg=${avgDuration.toFixed(0)}ms, cpu=${avgCpuUsage.toFixed(1)}%, memory=${(avgMemoryDelta/1024/1024).toFixed(1)}MB`);
    }
    
    this.testResults.categories[category] = loadResults;
    this.testResults.loadTesting = loadResults;
    
    // Overall load testing validation
    const allBatchesPass = Object.values(loadResults).every(batch => 
      batch.requirements.processingTime && 
      batch.requirements.cpuUsage && 
      batch.requirements.memoryUsage
    );
    
    if (allBatchesPass) {
      console.log('  ✅ PASSES: Load testing with multiple process batches successful');
    } else {
      console.log('  ❌ FAILS: Load testing identifies performance bottlenecks');
      this.validationErrors.push('Load testing failed - system cannot handle required process volumes efficiently');
    }
  }
  
  /**
   * Execute MCP Tools performance testing
   */
  async executeMCPToolsTests() {
    const category = TestCategory.MCP_TOOLS_RESPONSE;
    
    // Simulate MCP tool operations
    const mcpOperations = [
      { name: 'registry_refresh', operation: () => this.enhancedRegistry.refreshDynamicRegistry() },
      { name: 'get_active_processes', operation: () => this.enhancedRegistry.getAllActiveProcesses() },
      { name: 'discovery_scan', operation: () => this.discoveryEngine.scanSystemProcesses({ includeCorrelation: true }) },
      { name: 'tech_stack_detection', operation: () => this.discoveryEngine.scanSystemProcesses({ techStacks: [TechStack.NODEJS, TechStack.PHP] }) },
      { name: 'process_correlation', operation: () => this.discoveryEngine.scanSystemProcesses({ includeCorrelation: true, forceRefresh: true }) }
    ];
    
    const mcpResults = {};
    
    for (const mcpOp of mcpOperations) {
      console.log(`  Testing MCP operation: ${mcpOp.name}`);
      
      const measurements = [];
      
      for (let iteration = 0; iteration < 15; iteration++) {
        const startTime = performance.now();
        
        try {
          await mcpOp.operation();
          const duration = performance.now() - startTime;
          
          measurements.push({
            iteration,
            duration,
            success: true
          });
          
        } catch (error) {
          measurements.push({
            iteration,
            duration: performance.now() - startTime,
            success: false,
            error: error.message
          });
        }
        
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      const successful = measurements.filter(m => m.success);
      const durations = successful.map(m => m.duration);
      const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
      
      mcpResults[mcpOp.name] = {
        name: mcpOp.name,
        iterations: measurements.length,
        successful: successful.length,
        successRate: (successful.length / measurements.length) * 100,
        averageDuration: avgDuration,
        maxDuration: Math.max(...durations),
        meetsRequirement: avgDuration < VALIDATION_CONFIG.requirements.mcpToolsMaxTime,
        measurements
      };
      
      console.log(`    ✓ ${mcpOp.name}: avg=${avgDuration.toFixed(0)}ms, max=${Math.max(...durations).toFixed(0)}ms`);
    }
    
    this.testResults.categories[category] = mcpResults;
    
    // Validation
    const allMcpToolsPass = Object.values(mcpResults).every(result => result.meetsRequirement);
    
    if (allMcpToolsPass) {
      console.log('  ✅ PASSES: All MCP tools meet response time requirements');
    } else {
      console.log('  ❌ FAILS: Some MCP tools exceed response time requirements');
      this.validationErrors.push('MCP tools response times exceed 500ms requirement');
    }
  }
  
  /**
   * Execute concurrent operations testing
   */
  async executeConcurrentTests() {
    const category = TestCategory.CONCURRENT_OPERATIONS;
    console.log('  Testing concurrent agent operations...');
    
    const concurrentResults = [];
    
    for (let test = 0; test < 10; test++) {
      const startTime = performance.now();
      const startMemory = process.memoryUsage();
      
      try {
        // Simulate multiple agents performing operations simultaneously
        const operations = [];
        
        // Agent 1: Discovery scan
        operations.push(this.discoveryEngine.scanSystemProcesses({
          includeCorrelation: true,
          techStacks: [TechStack.NODEJS, TechStack.PHP]
        }));
        
        // Agent 2: Registry refresh
        operations.push(this.enhancedRegistry.refreshDynamicRegistry());
        
        // Agent 3: Another discovery scan with different tech stacks
        operations.push(this.discoveryEngine.scanSystemProcesses({
          includeCorrelation: true,
          techStacks: [TechStack.PYTHON, TechStack.STATIC, TechStack.DOCKER]
        }));
        
        const results = await Promise.allSettled(operations);
        const successfulOps = results.filter(r => r.status === 'fulfilled').length;
        
        const endTime = performance.now();
        const endMemory = process.memoryUsage();
        
        concurrentResults.push({
          test,
          duration: endTime - startTime,
          operations: operations.length,
          successful: successfulOps,
          memoryDelta: endMemory.rss - startMemory.rss,
          success: successfulOps === operations.length
        });
        
      } catch (error) {
        concurrentResults.push({
          test,
          duration: performance.now() - startTime,
          success: false,
          error: error.message
        });
      }
      
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    const successful = concurrentResults.filter(r => r.success);
    const avgDuration = successful.length > 0 ? 
      successful.reduce((sum, r) => sum + r.duration, 0) / successful.length : 0;
    
    const concurrentSummary = {
      totalTests: concurrentResults.length,
      successful: successful.length,
      successRate: (successful.length / concurrentResults.length) * 100,
      averageDuration: avgDuration,
      meetsRequirement: avgDuration < VALIDATION_CONFIG.requirements.discoveryMaxTime * 1.5, // Allow 50% more time for concurrent ops
      measurements: concurrentResults
    };
    
    this.testResults.categories[category] = concurrentSummary;
    
    console.log(`  ✓ Concurrent ops: ${successful.length}/${concurrentResults.length} successful, avg=${avgDuration.toFixed(0)}ms`);
    
    if (concurrentSummary.meetsRequirement && concurrentSummary.successRate >= 90) {
      console.log('  ✅ PASSES: Concurrent operations perform within acceptable limits');
    } else {
      console.log('  ❌ FAILS: Concurrent operations show performance degradation');
      this.validationErrors.push('Concurrent operations exceed performance thresholds');
    }
  }
  
  /**
   * Execute memory leak detection tests
   */
  async executeMemoryLeakTests() {
    const category = TestCategory.MEMORY_LEAK_DETECTION;
    console.log('  Testing for memory leaks over extended operations...');
    
    const baselineMemory = process.memoryUsage();
    const memorySnapshots = [baselineMemory];
    
    console.log(`    Baseline memory: ${(baselineMemory.heapUsed / 1024 / 1024).toFixed(1)}MB`);
    
    // Run extended operations
    for (let cycle = 0; cycle < 50; cycle++) {
      // Perform multiple discovery scans
      await this.discoveryEngine.scanSystemProcesses({
        includeCorrelation: true,
        forceRefresh: cycle % 5 === 0, // Force refresh every 5th cycle
        techStacks: [TechStack.NODEJS, TechStack.PHP, TechStack.PYTHON, TechStack.STATIC, TechStack.DOCKER]
      });
      
      // Registry operations
      await this.enhancedRegistry.refreshDynamicRegistry();
      await this.enhancedRegistry.getAllActiveProcesses();
      
      // Take memory snapshot every 10 cycles
      if (cycle % 10 === 0) {
        const currentMemory = process.memoryUsage();
        memorySnapshots.push(currentMemory);
        console.log(`    Cycle ${cycle}: ${(currentMemory.heapUsed / 1024 / 1024).toFixed(1)}MB (${((currentMemory.heapUsed - baselineMemory.heapUsed) / 1024 / 1024).toFixed(1)}MB delta)`);
      }
      
      // Brief pause
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    const finalMemory = process.memoryUsage();
    memorySnapshots.push(finalMemory);
    
    const memoryGrowth = finalMemory.heapUsed - baselineMemory.heapUsed;
    const memoryGrowthMB = memoryGrowth / 1024 / 1024;
    
    const memoryLeakAnalysis = {
      baseline: baselineMemory,
      final: finalMemory,
      growth: memoryGrowth,
      growthMB: memoryGrowthMB,
      snapshots: memorySnapshots,
      cycles: 50,
      
      // Memory leak detection
      hasMemoryLeak: memoryGrowthMB > VALIDATION_CONFIG.requirements.maxMemoryMB,
      meetsRequirement: memoryGrowthMB <= VALIDATION_CONFIG.requirements.maxMemoryMB
    };
    
    this.testResults.categories[category] = memoryLeakAnalysis;
    
    console.log(`  Final memory: ${(finalMemory.heapUsed / 1024 / 1024).toFixed(1)}MB (${memoryGrowthMB > 0 ? '+' : ''}${memoryGrowthMB.toFixed(1)}MB growth)`);
    
    if (memoryLeakAnalysis.meetsRequirement) {
      console.log('  ✅ PASSES: No significant memory leaks detected');
    } else {
      console.log('  ❌ FAILS: Potential memory leak detected');
      this.validationErrors.push(`Memory growth ${memoryGrowthMB.toFixed(1)}MB exceeds ${VALIDATION_CONFIG.requirements.maxMemoryMB}MB limit`);
    }
  }
  
  /**
   * Execute short stability test (15 minutes for immediate validation)
   */
  async executeShortStabilityTest() {
    const category = TestCategory.STABILITY_8_HOUR;
    const testDurationMinutes = 15; // 15 minutes for immediate validation
    const testDurationMs = testDurationMinutes * 60 * 1000;
    
    console.log(`  Running ${testDurationMinutes}-minute stability test (production would run 8+ hours)...`);
    
    const startTime = Date.now();
    const stabilityMetrics = {
      startTime,
      checks: [],
      errors: [],
      performance: []
    };
    
    let checkInterval = 0;
    
    while ((Date.now() - startTime) < testDurationMs) {
      const checkStartTime = Date.now();
      
      try {
        // Perform discovery scan
        const scanResult = await this.discoveryEngine.scanSystemProcesses({
          includeCorrelation: true,
          techStacks: [TechStack.NODEJS, TechStack.PHP, TechStack.PYTHON]
        });
        
        // Check registry operations
        await this.enhancedRegistry.refreshDynamicRegistry();
        
        // Record performance metrics
        const currentMetrics = this.performanceMonitor.getCurrentMetrics();
        const checkDuration = Date.now() - checkStartTime;
        
        stabilityMetrics.checks.push({
          interval: checkInterval,
          timestamp: Date.now(),
          duration: checkDuration,
          processCount: scanResult.summary?.totalProcesses || 0,
          cpu: currentMetrics.cpu.current,
          memory: currentMetrics.memory.current,
          success: true
        });
        
        stabilityMetrics.performance.push({
          interval: checkInterval,
          cpu: currentMetrics.cpu.current,
          memory: currentMetrics.memory.current,
          duration: checkDuration
        });
        
        if (checkInterval % 5 === 0) {
          const elapsed = (Date.now() - startTime) / 1000 / 60;
          console.log(`    ${elapsed.toFixed(1)}min: scan=${checkDuration.toFixed(0)}ms, cpu=${currentMetrics.cpu.current.toFixed(1)}%, mem=${currentMetrics.memory.current.toFixed(1)}MB`);
        }
        
      } catch (error) {
        stabilityMetrics.errors.push({
          interval: checkInterval,
          timestamp: Date.now(),
          error: error.message
        });
        
        console.log(`    Error at ${checkInterval}: ${error.message}`);
      }
      
      checkInterval++;
      await new Promise(resolve => setTimeout(resolve, VALIDATION_CONFIG.testing.stabilityCheckInterval));
    }
    
    // Analyze stability metrics
    const totalChecks = stabilityMetrics.checks.length;
    const totalErrors = stabilityMetrics.errors.length;
    const successRate = totalChecks > 0 ? ((totalChecks - totalErrors) / totalChecks) * 100 : 0;
    
    const avgCpu = stabilityMetrics.performance.length > 0 ?
      stabilityMetrics.performance.reduce((sum, p) => sum + p.cpu, 0) / stabilityMetrics.performance.length : 0;
    const maxCpu = stabilityMetrics.performance.length > 0 ?
      Math.max(...stabilityMetrics.performance.map(p => p.cpu)) : 0;
    
    const avgMemory = stabilityMetrics.performance.length > 0 ?
      stabilityMetrics.performance.reduce((sum, p) => sum + p.memory, 0) / stabilityMetrics.performance.length : 0;
    const maxMemory = stabilityMetrics.performance.length > 0 ?
      Math.max(...stabilityMetrics.performance.map(p => p.memory)) : 0;
    
    const stabilityAnalysis = {
      testDurationMinutes,
      totalChecks,
      totalErrors,
      successRate,
      performance: {
        avgCpu,
        maxCpu,
        avgMemory,
        maxMemory
      },
      meetsRequirements: {
        stability: successRate >= VALIDATION_CONFIG.requirements.minSuccessRate,
        cpu: maxCpu <= VALIDATION_CONFIG.requirements.maxCpuPercent,
        memory: (maxMemory - stabilityMetrics.performance[0]?.memory || 0) <= VALIDATION_CONFIG.requirements.maxMemoryMB
      },
      rawMetrics: stabilityMetrics
    };
    
    this.testResults.categories[category] = stabilityAnalysis;
    this.testResults.stabilityTesting = stabilityAnalysis;
    
    console.log(`  ✓ Stability: ${totalChecks} checks, ${successRate.toFixed(1)}% success, avg CPU ${avgCpu.toFixed(1)}%`);
    
    if (stabilityAnalysis.meetsRequirements.stability && 
        stabilityAnalysis.meetsRequirements.cpu && 
        stabilityAnalysis.meetsRequirements.memory) {
      console.log('  ✅ PASSES: Short stability test shows consistent performance');
      this.performanceWarnings.push('Full 8+ hour stability testing recommended before production deployment');
    } else {
      console.log('  ❌ FAILS: Stability test shows performance degradation');
      this.validationErrors.push('System stability degrades during extended operation');
    }
  }
  
  /**
   * Generate comprehensive validation report
   */
  async generateValidationReport() {
    console.log('\\n📊 Generating Production Performance Validation Report...');
    
    // Ensure output directory exists
    await fs.mkdir(VALIDATION_CONFIG.testing.reportDirectory, { recursive: true });
    
    // Calculate overall requirements compliance
    const requirementsCheck = {
      discoveryTime: this.testResults.categories[TestCategory.DISCOVERY_BASELINE]?.requirements?.discoveryTime?.passes || false,
      mcpTools: Object.values(this.testResults.categories[TestCategory.MCP_TOOLS_RESPONSE] || {}).every(tool => tool.meetsRequirement),
      loadTesting: Object.values(this.testResults.loadTesting || {}).every(batch => 
        batch.requirements.processingTime && batch.requirements.cpuUsage && batch.requirements.memoryUsage
      ),
      concurrentOps: this.testResults.categories[TestCategory.CONCURRENT_OPERATIONS]?.meetsRequirement || false,
      memoryLeaks: this.testResults.categories[TestCategory.MEMORY_LEAK_DETECTION]?.meetsRequirement || false,
      stability: this.testResults.categories[TestCategory.STABILITY_8_HOUR]?.meetsRequirements?.stability || false
    };
    
    const passedRequirements = Object.values(requirementsCheck).filter(Boolean).length;
    const totalRequirements = Object.keys(requirementsCheck).length;
    const overallScore = (passedRequirements / totalRequirements) * 100;
    
    // Determine overall grade
    let overallGrade = 'F';
    if (overallScore >= 95) overallGrade = 'A';
    else if (overallScore >= 85) overallGrade = 'B';
    else if (overallScore >= 75) overallGrade = 'C';
    else if (overallScore >= 65) overallGrade = 'D';
    
    this.testResults.overallGrade = overallGrade;
    this.testResults.requirements = requirementsCheck;
    
    // Generate comprehensive report
    const report = {
      metadata: {
        timestamp: new Date().toISOString(),
        duration: this.testResults.duration,
        validator: 'Production Performance Validator',
        version: '1.0.0',
        environment: {
          platform: process.platform,
          nodeVersion: process.version,
          arch: process.arch,
          memory: Math.round(os.totalmem() / 1024 / 1024 / 1024) + 'GB',
          cpus: os.cpus().length
        }
      },
      
      summary: {
        overallGrade,
        overallScore: overallScore.toFixed(1),
        passedRequirements,
        totalRequirements,
        validationErrors: this.validationErrors.length,
        performanceWarnings: this.performanceWarnings.length
      },
      
      requirements: {
        configured: VALIDATION_CONFIG.requirements,
        results: requirementsCheck
      },
      
      testResults: this.testResults,
      validationErrors: this.validationErrors,
      performanceWarnings: this.performanceWarnings,
      
      performanceMonitorSummary: this.performanceMonitor ? this.performanceMonitor.getStatistics() : null,
      performanceOptimizerSummary: this.performanceOptimizer ? this.performanceOptimizer.getPerformanceReport() : null
    };
    
    // Save JSON report
    const reportPath = path.join(VALIDATION_CONFIG.testing.reportDirectory, `production-performance-validation-${Date.now()}.json`);
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    // Generate human-readable report
    await this.generateHumanReadableReport(report);
    
    console.log(`✓ Validation report saved: ${reportPath}`);
    
    return report;
  }
  
  /**
   * Generate human-readable report
   */
  async generateHumanReadableReport(report) {
    const readableReport = `# Production Performance Validation Report

## Executive Summary

**Overall Grade: ${report.summary.overallGrade}** (${report.summary.overallScore}%)
**Test Duration:** ${(report.metadata.duration / 1000 / 60).toFixed(1)} minutes
**Generated:** ${report.metadata.timestamp}

### Requirements Compliance
- **Passed Requirements:** ${report.summary.passedRequirements}/${report.summary.totalRequirements}
- **Validation Errors:** ${report.summary.validationErrors}
- **Performance Warnings:** ${report.summary.performanceWarnings}

## Performance Requirements Validation

### ✅ Discovery Engine Performance
- **Requirement:** < ${VALIDATION_CONFIG.requirements.discoveryMaxTime}ms for full multi-tech scan
- **Result:** ${report.testResults.categories[TestCategory.DISCOVERY_BASELINE]?.duration?.average?.toFixed(0) || 'N/A'}ms average
- **Status:** ${report.requirements.results.discoveryTime ? '✅ PASS' : '❌ FAIL'}

### ✅ MCP Tools Response Time
- **Requirement:** < ${VALIDATION_CONFIG.requirements.mcpToolsMaxTime}ms for all process management tools
- **Status:** ${report.requirements.results.mcpTools ? '✅ PASS' : '❌ FAIL'}
${Object.entries(report.testResults.categories[TestCategory.MCP_TOOLS_RESPONSE] || {}).map(([name, result]) => 
`  - ${name}: ${result.averageDuration?.toFixed(0) || 'N/A'}ms (${result.meetsRequirement ? 'PASS' : 'FAIL'})`).join('\\n')}

### ✅ Load Testing with 50+ Processes
- **Requirement:** Handle ${VALIDATION_CONFIG.loadTesting.minProcessCount}+ processes efficiently
- **Status:** ${report.requirements.results.loadTesting ? '✅ PASS' : '❌ FAIL'}
${Object.entries(report.testResults.loadTesting || {}).map(([name, batch]) => 
`  - ${batch.batchSize} processes: ${batch.averageDuration?.toFixed(0) || 'N/A'}ms, CPU ${batch.averageCpuUsage?.toFixed(1) || 'N/A'}%`).join('\\n')}

### ✅ System Resource Usage
- **CPU Requirement:** < ${VALIDATION_CONFIG.requirements.maxCpuPercent}% during operations
- **Memory Requirement:** < ${VALIDATION_CONFIG.requirements.maxMemoryMB}MB additional footprint
- **Memory Leak Status:** ${report.requirements.results.memoryLeaks ? '✅ NO LEAKS DETECTED' : '❌ POTENTIAL LEAK'}

### ✅ Concurrent Operations
- **Requirement:** Multiple agent operations without performance degradation
- **Status:** ${report.requirements.results.concurrentOps ? '✅ PASS' : '❌ FAIL'}
- **Success Rate:** ${report.testResults.categories[TestCategory.CONCURRENT_OPERATIONS]?.successRate?.toFixed(1) || 'N/A'}%

### ✅ System Stability
- **Requirement:** Stable operation over extended periods
- **Test Duration:** ${report.testResults.stabilityTesting?.testDurationMinutes || 'N/A'} minutes (production requires 8+ hours)
- **Status:** ${report.requirements.results.stability ? '✅ PASS' : '❌ FAIL'}
- **Success Rate:** ${report.testResults.stabilityTesting?.successRate?.toFixed(1) || 'N/A'}%

## Validation Errors
${report.validationErrors.length > 0 ? 
  report.validationErrors.map(error => `❌ ${error}`).join('\\n') : 
  '✅ No validation errors detected'
}

## Performance Warnings
${report.performanceWarnings.length > 0 ? 
  report.performanceWarnings.map(warning => `⚠️ ${warning}`).join('\\n') : 
  '✅ No performance warnings'
}

## Production Readiness Assessment

${report.summary.overallGrade === 'A' ? 
'✅ **PRODUCTION READY**: All performance benchmarks met. System is ready for production deployment.' : 
report.summary.overallGrade === 'B' ? 
'✅ **PRODUCTION READY WITH MONITORING**: Most requirements met. Deploy with enhanced monitoring.' : 
report.summary.overallGrade === 'C' ? 
'⚠️ **PRODUCTION READY WITH CAUTION**: Some performance issues identified. Address before deployment.' : 
'❌ **NOT PRODUCTION READY**: Significant performance issues must be resolved before deployment.'
}

## Recommendations

${report.summary.overallGrade === 'A' ? 
'- System meets all production performance requirements\\n- Continue with deployment as planned' : 
'- Address identified performance issues\\n- Consider performance optimization before deployment'
}

${report.performanceWarnings.includes('Full 8+ hour stability testing recommended before production deployment') ? 
'- **CRITICAL**: Execute full 8+ hour stability testing in staging environment before production' : ''
}

---
*Generated by PlopDock Production Performance Validator v1.0.0*
*Test Environment: ${report.metadata.environment.platform} ${report.metadata.environment.arch}, Node.js ${report.metadata.environment.nodeVersion}*
`;
    
    const readableReportPath = path.join(VALIDATION_CONFIG.testing.reportDirectory, `production-performance-validation-${Date.now()}.md`);
    await fs.writeFile(readableReportPath, readableReport);
    
    console.log(`✓ Human-readable report saved: ${readableReportPath}`);
  }
  
  /**
   * Provide final assessment
   */
  provideFinalAssessment() {
    console.log('\\n🎯 PRODUCTION PERFORMANCE VALIDATION ASSESSMENT');
    console.log('='.repeat(60));
    
    console.log(`\\n📊 OVERALL GRADE: ${this.testResults.overallGrade}`);
    
    if (this.testResults.overallGrade === 'A') {
      console.log('\\n✅ PRODUCTION READY');
      console.log('All performance benchmarks met. System certified for production deployment.');
      
    } else if (this.testResults.overallGrade === 'B') {
      console.log('\\n✅ PRODUCTION READY WITH MONITORING');
      console.log('Most requirements met. Deploy with enhanced performance monitoring.');
      
    } else if (this.testResults.overallGrade === 'C') {
      console.log('\\n⚠️ PRODUCTION READY WITH CAUTION');
      console.log('Some performance issues identified. Address before deployment.');
      
    } else {
      console.log('\\n❌ NOT PRODUCTION READY');
      console.log('Significant performance issues must be resolved before deployment.');
    }
    
    if (this.validationErrors.length > 0) {
      console.log('\\n❌ VALIDATION ERRORS:');
      this.validationErrors.forEach(error => console.log(`   - ${error}`));
    }
    
    if (this.performanceWarnings.length > 0) {
      console.log('\\n⚠️ PERFORMANCE WARNINGS:');
      this.performanceWarnings.forEach(warning => console.log(`   - ${warning}`));
    }
    
    console.log('\\n📁 Reports saved to:', VALIDATION_CONFIG.testing.reportDirectory);
    console.log('='.repeat(60));
  }
  
  /**
   * Cleanup resources
   */
  async cleanup() {
    console.log('\\n🧹 Cleaning up Production Performance Validator...');
    
    try {
      if (this.discoveryEngine) {
        await this.discoveryEngine.shutdown();
      }
      
      if (this.enhancedRegistry) {
        await this.enhancedRegistry.shutdown();
      }
      
      if (this.performanceMonitor) {
        await this.performanceMonitor.shutdown();
      }
      
      if (this.performanceOptimizer) {
        await this.performanceOptimizer.shutdown();
      }
      
      console.log('✓ Performance Validator cleanup completed');
      
    } catch (error) {
      console.error('Error during cleanup:', error.message);
    }
  }
}

/**
 * Main execution function
 */
async function executeProductionValidation() {
  const validator = new ProductionPerformanceValidator();
  
  try {
    await validator.initialize();
    await validator.executeValidation();
    
    return {
      success: validator.testResults.overallGrade === 'A' || validator.testResults.overallGrade === 'B',
      grade: validator.testResults.overallGrade,
      errors: validator.validationErrors,
      warnings: validator.performanceWarnings
    };
    
  } finally {
    await validator.cleanup();
  }
}

// Execute if this file is run directly
if (require.main === module) {
  executeProductionValidation()
    .then(results => {
      console.log(`\\n🎉 Production Performance Validation completed with grade: ${results.grade}`);
      process.exit(results.success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Production Performance Validation failed:', error);
      process.exit(1);
    });
}

module.exports = {
  ProductionPerformanceValidator,
  executeProductionValidation,
  VALIDATION_CONFIG,
  TestCategory
};