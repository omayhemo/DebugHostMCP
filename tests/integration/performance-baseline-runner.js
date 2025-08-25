/**
 * Performance Baseline Runner for Multi-Tech Process Discovery Engine
 * 
 * This runner executes comprehensive integration tests and establishes
 * performance baselines for ongoing monitoring and validation.
 * 
 * Features:
 * 1. Automated test execution with performance monitoring
 * 2. Baseline establishment and comparison
 * 3. Performance regression detection
 * 4. Comprehensive reporting
 * 5. CI/CD integration support
 */

const { MultiTechProcessDiscoveryEngine, TechStack } = require('../../src/services/multi-tech-process-discovery-engine');
const { EnhancedPortRegistry } = require('../../src/enhanced-port-registry');
const { ChaosTestingFramework } = require('./chaos-testing-framework.test');
const { IntegrationTestUtils, generateFinalTestReport } = require('./comprehensive-multi-tech-integration.test');
const fs = require('fs').promises;
const path = require('path');

/**
 * Performance Baseline Configuration
 */
const BASELINE_CONFIG = {
  TEST_ITERATIONS: 10,              // Number of iterations for averaging
  WARMUP_ITERATIONS: 3,             // Warmup iterations before measurement
  BASELINE_PERCENTILE: 95,          // 95th percentile for baseline establishment
  REGRESSION_THRESHOLD: 1.2,        // 20% regression threshold
  STABILITY_WINDOW: 5,              // Stability measurement window
  OUTPUT_DIRECTORY: '/mnt/c/Code/plopdock/project_docs/qa/performance-baselines'
};

/**
 * Baseline Test Categories
 */
const BaselineTestCategory = {
  SYSTEM_SCAN: 'system_scan',
  REGISTRY_REFRESH: 'registry_refresh', 
  PROCESS_CORRELATION: 'process_correlation',
  MULTI_TECH_DETECTION: 'multi_tech_detection',
  ERROR_RECOVERY: 'error_recovery',
  CONCURRENT_ACCESS: 'concurrent_access',
  MEMORY_USAGE: 'memory_usage',
  CPU_USAGE: 'cpu_usage'
};

/**
 * Performance Baseline Runner
 */
class PerformanceBaselineRunner {
  constructor() {
    this.discoveryEngine = null;
    this.enhancedRegistry = null;
    this.chaosFramework = null;
    
    this.baselines = new Map();
    this.currentMetrics = new Map();
    this.testResults = {
      startTime: null,
      endTime: null,
      duration: 0,
      iterations: 0,
      categories: {}
    };
  }

  /**
   * Initialize testing components
   */
  async initialize() {
    console.log('🎯 Initializing Performance Baseline Runner...');
    
    try {
      // Initialize Enhanced Port Registry
      this.enhancedRegistry = new EnhancedPortRegistry(null, {
        refreshInterval: 1000,
        enableRealTimeUpdates: true,
        enableErrorRecovery: true,
        enableSmartCaching: true,
        enablePerformanceMonitoring: true
      });

      // Initialize Discovery Engine
      this.discoveryEngine = new MultiTechProcessDiscoveryEngine({
        scanTimeout: 2000,
        performanceMonitoring: true,
        correlationEnabled: true,
        portRegistry: this.enhancedRegistry,
        // Enable all detectors with graceful degradation
        nodejs: { enabled: true, gracefulDegradation: true },
        php: { enabled: true, gracefulDegradation: true },
        python: { enabled: true, gracefulDegradation: true },
        static: { enabled: true, gracefulDegradation: true },
        docker: { enabled: true, gracefulDegradation: true }
      });

      await this.discoveryEngine.initialize();
      await this.enhancedRegistry.initialize();

      // Initialize Chaos Testing Framework
      this.chaosFramework = new ChaosTestingFramework(this.discoveryEngine, this.enhancedRegistry);

      console.log('✓ Performance Baseline Runner initialized successfully');

    } catch (error) {
      console.error('❌ Failed to initialize Performance Baseline Runner:', error.message);
      throw error;
    }
  }

  /**
   * Execute comprehensive baseline testing
   */
  async executeBaselineTests() {
    console.log('🚀 Starting Performance Baseline Testing...');
    
    this.testResults.startTime = Date.now();
    
    try {
      // Load existing baselines if available
      await this.loadExistingBaselines();

      // Execute warmup iterations
      await this.executeWarmupPhase();

      // Execute baseline test categories
      for (const category of Object.values(BaselineTestCategory)) {
        console.log(`\n📊 Testing category: ${category}`);
        await this.executeBaselineCategory(category);
      }

      // Execute chaos testing for resilience baseline
      console.log('\n🌪️ Executing chaos resilience testing...');
      await this.executeChaosResilience();

      // Generate comparative analysis
      await this.generateComparativeAnalysis();

      // Save updated baselines
      await this.saveBaselines();

      // Generate comprehensive report
      await this.generateBaselineReport();

    } finally {
      this.testResults.endTime = Date.now();
      this.testResults.duration = this.testResults.endTime - this.testResults.startTime;
      
      console.log(`\n✅ Performance Baseline Testing completed in ${this.testResults.duration}ms`);
    }
  }

  /**
   * Execute warmup phase
   */
  async executeWarmupPhase() {
    console.log(`🔥 Executing ${BASELINE_CONFIG.WARMUP_ITERATIONS} warmup iterations...`);
    
    for (let i = 0; i < BASELINE_CONFIG.WARMUP_ITERATIONS; i++) {
      // Basic system scan
      await this.discoveryEngine.scanSystemProcesses({
        includeCorrelation: true,
        forceRefresh: true
      });

      // Registry refresh
      await this.enhancedRegistry.refreshDynamicRegistry();

      // Brief pause
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('✓ Warmup phase completed');
  }

  /**
   * Execute baseline testing for a specific category
   */
  async executeBaselineCategory(category) {
    const measurements = [];
    
    for (let iteration = 0; iteration < BASELINE_CONFIG.TEST_ITERATIONS; iteration++) {
      const measurement = await this.executeSingleCategoryTest(category);
      measurements.push(measurement);
      
      // Progress indicator
      if ((iteration + 1) % 3 === 0) {
        console.log(`  Progress: ${iteration + 1}/${BASELINE_CONFIG.TEST_ITERATIONS} iterations completed`);
      }

      // Brief pause between iterations
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Calculate baseline metrics
    const baseline = this.calculateBaselineMetrics(category, measurements);
    this.baselines.set(category, baseline);
    this.testResults.categories[category] = baseline;

    console.log(`  ✓ ${category}: avg=${baseline.average.toFixed(0)}ms, p95=${baseline.p95.toFixed(0)}ms`);
  }

  /**
   * Execute a single test for a category
   */
  async executeSingleCategoryTest(category) {
    const startTime = Date.now();
    const startMemory = process.memoryUsage();
    const startCpu = process.cpuUsage();
    
    try {
      switch (category) {
        case BaselineTestCategory.SYSTEM_SCAN:
          await this.discoveryEngine.scanSystemProcesses({
            includeCorrelation: true,
            forceRefresh: true
          });
          break;

        case BaselineTestCategory.REGISTRY_REFRESH:
          await this.enhancedRegistry.refreshDynamicRegistry();
          break;

        case BaselineTestCategory.PROCESS_CORRELATION:
          const scanResults = await this.discoveryEngine.scanSystemProcesses({
            includeCorrelation: true,
            forceRefresh: true
          });
          // Additional correlation processing
          if (scanResults.correlation) {
            const totalCorrelated = (scanResults.correlation.registeredProcesses?.length || 0) +
                                  (scanResults.correlation.discoveredProcesses?.length || 0);
          }
          break;

        case BaselineTestCategory.MULTI_TECH_DETECTION:
          await this.discoveryEngine.scanSystemProcesses({
            includeCorrelation: true,
            techStacks: [TechStack.NODEJS, TechStack.PHP, TechStack.PYTHON, TechStack.STATIC, TechStack.DOCKER],
            forceRefresh: true
          });
          break;

        case BaselineTestCategory.ERROR_RECOVERY:
          try {
            // Inject error and measure recovery
            await this.discoveryEngine.scanSystemProcesses({
              includeCorrelation: true,
              injectError: true // Test flag
            });
          } catch (error) {
            // Measure recovery scan
            await this.discoveryEngine.scanSystemProcesses({
              includeCorrelation: true,
              forceRefresh: true
            });
          }
          break;

        case BaselineTestCategory.CONCURRENT_ACCESS:
          const concurrentOps = [];
          for (let i = 0; i < 5; i++) {
            concurrentOps.push(this.discoveryEngine.scanSystemProcesses({
              includeCorrelation: true
            }));
          }
          await Promise.allSettled(concurrentOps);
          break;

        case BaselineTestCategory.MEMORY_USAGE:
          // Memory-intensive operations
          await this.enhancedRegistry.getAllActiveProcesses({
            includeDetails: true,
            forceRefresh: true
          });
          break;

        case BaselineTestCategory.CPU_USAGE:
          // CPU-intensive scanning
          for (let i = 0; i < 3; i++) {
            await this.discoveryEngine.scanSystemProcesses({
              includeCorrelation: true,
              forceRefresh: true
            });
          }
          break;
      }

      const endTime = Date.now();
      const endMemory = process.memoryUsage();
      const endCpu = process.cpuUsage(startCpu);

      return {
        duration: endTime - startTime,
        memoryDelta: endMemory.rss - startMemory.rss,
        cpuUsage: (endCpu.user + endCpu.system) / 1000, // Convert to ms
        success: true
      };

    } catch (error) {
      const endTime = Date.now();
      
      return {
        duration: endTime - startTime,
        memoryDelta: 0,
        cpuUsage: 0,
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Calculate baseline metrics from measurements
   */
  calculateBaselineMetrics(category, measurements) {
    const durations = measurements.map(m => m.duration);
    const memoryDeltas = measurements.map(m => m.memoryDelta);
    const cpuUsages = measurements.map(m => m.cpuUsage);
    const successRate = measurements.filter(m => m.success).length / measurements.length;

    durations.sort((a, b) => a - b);
    
    const baseline = {
      category,
      timestamp: new Date().toISOString(),
      iterations: measurements.length,
      
      // Duration metrics
      average: durations.reduce((a, b) => a + b, 0) / durations.length,
      median: durations[Math.floor(durations.length / 2)],
      min: Math.min(...durations),
      max: Math.max(...durations),
      p95: durations[Math.floor(durations.length * 0.95)],
      p99: durations[Math.floor(durations.length * 0.99)],
      
      // Resource metrics
      avgMemoryDelta: memoryDeltas.reduce((a, b) => a + b, 0) / memoryDeltas.length,
      maxMemoryDelta: Math.max(...memoryDeltas),
      avgCpuUsage: cpuUsages.reduce((a, b) => a + b, 0) / cpuUsages.length,
      
      // Reliability metrics
      successRate,
      failureRate: 1 - successRate,
      
      // Raw data for detailed analysis
      measurements: measurements
    };

    return baseline;
  }

  /**
   * Execute chaos resilience testing
   */
  async executeChaosResilience() {
    try {
      const chaosStartTime = Date.now();
      
      // Execute shortened chaos test for baseline
      this.chaosFramework.isRunning = true;
      
      // Initialize baseline processes
      await this.chaosFramework._initializeBaselineProcesses();
      
      // Run controlled chaos scenario
      const chaosPromise = this.chaosFramework._runChaosEventLoop();
      
      // Wait for controlled duration
      await Promise.race([
        chaosPromise,
        new Promise(resolve => setTimeout(resolve, 15000)) // 15 seconds
      ]);
      
      this.chaosFramework.isRunning = false;
      
      const chaosDuration = Date.now() - chaosStartTime;
      const chaosResults = this.chaosFramework.getChaosTestResults();
      
      // Store chaos resilience baseline
      this.baselines.set('chaos_resilience', {
        category: 'chaos_resilience',
        timestamp: new Date().toISOString(),
        duration: chaosDuration,
        totalEvents: chaosResults.totalEvents,
        successRate: chaosResults.totalEvents > 0 ? chaosResults.successfulEvents / chaosResults.totalEvents : 0,
        recoveryRate: chaosResults.recoveryAttempts > 0 ? chaosResults.successfulRecoveries / chaosResults.recoveryAttempts : 0,
        averageRecoveryTime: chaosResults.recoveryTimes.length > 0 ? 
          chaosResults.recoveryTimes.reduce((a, b) => a + b, 0) / chaosResults.recoveryTimes.length : 0
      });

      console.log(`  ✓ Chaos resilience baseline established: ${chaosResults.totalEvents} events, ${(chaosResults.successfulEvents / chaosResults.totalEvents * 100).toFixed(1)}% success rate`);

    } catch (error) {
      console.warn(`⚠️ Chaos resilience testing failed: ${error.message}`);
    }
  }

  /**
   * Generate comparative analysis against existing baselines
   */
  async generateComparativeAnalysis() {
    console.log('\n📈 Generating comparative analysis...');
    
    const analysis = {
      timestamp: new Date().toISOString(),
      comparisons: {},
      regressions: [],
      improvements: []
    };

    for (const [category, currentBaseline] of this.baselines.entries()) {
      // Compare with stored baselines if available
      const storedBaseline = await this.loadStoredBaseline(category);
      
      if (storedBaseline) {
        const comparison = this.compareBaselines(currentBaseline, storedBaseline);
        analysis.comparisons[category] = comparison;
        
        if (comparison.regression) {
          analysis.regressions.push({
            category,
            metric: comparison.regressionMetric,
            change: comparison.regressionPercentage
          });
        }
        
        if (comparison.improvement) {
          analysis.improvements.push({
            category,
            metric: comparison.improvementMetric,
            change: comparison.improvementPercentage
          });
        }
      }
    }

    this.testResults.analysis = analysis;

    if (analysis.regressions.length > 0) {
      console.log('⚠️ Performance regressions detected:');
      analysis.regressions.forEach(regression => {
        console.log(`  - ${regression.category}: ${regression.metric} increased by ${regression.change.toFixed(1)}%`);
      });
    }

    if (analysis.improvements.length > 0) {
      console.log('✅ Performance improvements detected:');
      analysis.improvements.forEach(improvement => {
        console.log(`  + ${improvement.category}: ${improvement.metric} improved by ${improvement.change.toFixed(1)}%`);
      });
    }
  }

  /**
   * Compare two baselines
   */
  compareBaselines(current, stored) {
    const comparison = {
      category: current.category,
      current: current.average,
      stored: stored.average,
      change: ((current.average - stored.average) / stored.average) * 100,
      regression: false,
      improvement: false
    };

    if (comparison.change > BASELINE_CONFIG.REGRESSION_THRESHOLD * 100) {
      comparison.regression = true;
      comparison.regressionMetric = 'average_duration';
      comparison.regressionPercentage = comparison.change;
    } else if (comparison.change < -10) { // 10% improvement threshold
      comparison.improvement = true;
      comparison.improvementMetric = 'average_duration';
      comparison.improvementPercentage = Math.abs(comparison.change);
    }

    return comparison;
  }

  /**
   * Load existing baselines
   */
  async loadExistingBaselines() {
    try {
      const baselinesPath = path.join(BASELINE_CONFIG.OUTPUT_DIRECTORY, 'baselines.json');
      const data = await fs.readFile(baselinesPath, 'utf8');
      const existingBaselines = JSON.parse(data);
      
      console.log(`✓ Loaded ${Object.keys(existingBaselines).length} existing baselines`);
      return existingBaselines;
    } catch (error) {
      console.log('No existing baselines found, will establish new baselines');
      return {};
    }
  }

  /**
   * Load stored baseline for specific category
   */
  async loadStoredBaseline(category) {
    try {
      const existingBaselines = await this.loadExistingBaselines();
      return existingBaselines[category] || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Save baselines to file system
   */
  async saveBaselines() {
    try {
      // Ensure output directory exists
      await fs.mkdir(BASELINE_CONFIG.OUTPUT_DIRECTORY, { recursive: true });

      // Convert baselines map to object
      const baselineData = {};
      for (const [category, baseline] of this.baselines.entries()) {
        baselineData[category] = baseline;
      }

      // Save baselines
      const baselinesPath = path.join(BASELINE_CONFIG.OUTPUT_DIRECTORY, 'baselines.json');
      await fs.writeFile(baselinesPath, JSON.stringify(baselineData, null, 2));

      // Save detailed measurements
      const measurementsPath = path.join(BASELINE_CONFIG.OUTPUT_DIRECTORY, `measurements-${Date.now()}.json`);
      await fs.writeFile(measurementsPath, JSON.stringify(this.testResults, null, 2));

      console.log(`✓ Baselines saved to ${baselinesPath}`);
      console.log(`✓ Detailed measurements saved to ${measurementsPath}`);

    } catch (error) {
      console.error(`❌ Failed to save baselines: ${error.message}`);
    }
  }

  /**
   * Generate comprehensive baseline report
   */
  async generateBaselineReport() {
    const report = {
      metadata: {
        timestamp: new Date().toISOString(),
        duration: this.testResults.duration,
        iterations: BASELINE_CONFIG.TEST_ITERATIONS,
        warmupIterations: BASELINE_CONFIG.WARMUP_ITERATIONS,
        environment: {
          platform: process.platform,
          nodeVersion: process.version,
          arch: process.arch,
          memory: Math.round(require('os').totalmem() / 1024 / 1024 / 1024) + 'GB'
        }
      },
      baselines: Object.fromEntries(this.baselines.entries()),
      analysis: this.testResults.analysis || {},
      summary: {
        totalCategories: this.baselines.size,
        averageTestDuration: 0,
        overallStability: 0,
        performanceGrade: 'A'
      }
    };

    // Calculate summary metrics
    const avgDurations = Array.from(this.baselines.values()).map(b => b.average);
    report.summary.averageTestDuration = avgDurations.reduce((a, b) => a + b, 0) / avgDurations.length;

    const successRates = Array.from(this.baselines.values()).map(b => b.successRate);
    report.summary.overallStability = successRates.reduce((a, b) => a + b, 0) / successRates.length;

    // Determine performance grade
    if (report.summary.overallStability > 0.95 && report.summary.averageTestDuration < 2000) {
      report.summary.performanceGrade = 'A';
    } else if (report.summary.overallStability > 0.9 && report.summary.averageTestDuration < 3000) {
      report.summary.performanceGrade = 'B';
    } else if (report.summary.overallStability > 0.8) {
      report.summary.performanceGrade = 'C';
    } else {
      report.summary.performanceGrade = 'D';
    }

    try {
      const reportPath = path.join(BASELINE_CONFIG.OUTPUT_DIRECTORY, `baseline-report-${Date.now()}.json`);
      await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

      // Generate human-readable report
      await this.generateHumanReadableReport(report);

      console.log(`✅ Comprehensive baseline report generated`);
      console.log(`   Performance Grade: ${report.summary.performanceGrade}`);
      console.log(`   Overall Stability: ${(report.summary.overallStability * 100).toFixed(1)}%`);
      console.log(`   Average Test Duration: ${report.summary.averageTestDuration.toFixed(0)}ms`);

    } catch (error) {
      console.error(`❌ Failed to generate baseline report: ${error.message}`);
    }
  }

  /**
   * Generate human-readable report
   */
  async generateHumanReadableReport(report) {
    const humanReport = `# Multi-Tech Process Discovery Engine - Performance Baseline Report

## Test Execution Summary

**Generated:** ${report.metadata.timestamp}  
**Duration:** ${(report.metadata.duration / 1000).toFixed(1)} seconds  
**Test Iterations:** ${report.metadata.iterations}  
**Environment:** ${report.metadata.environment.platform} ${report.metadata.environment.arch}, Node.js ${report.metadata.environment.nodeVersion}

## Overall Performance Grade: ${report.summary.performanceGrade}

- **Stability:** ${(report.summary.overallStability * 100).toFixed(1)}%
- **Average Response Time:** ${report.summary.averageTestDuration.toFixed(0)}ms
- **Categories Tested:** ${report.summary.totalCategories}

## Performance Baselines

${Array.from(Object.entries(report.baselines)).map(([category, baseline]) => `
### ${category.toUpperCase()}
- **Average:** ${baseline.average.toFixed(0)}ms
- **95th Percentile:** ${baseline.p95.toFixed(0)}ms
- **Success Rate:** ${(baseline.successRate * 100).toFixed(1)}%
- **Memory Impact:** ${(baseline.avgMemoryDelta / 1024 / 1024).toFixed(1)}MB
`).join('')}

## Performance Analysis

${report.analysis.regressions?.length > 0 ? `
### ⚠️ Regressions Detected
${report.analysis.regressions.map(r => `- **${r.category}**: ${r.metric} increased by ${r.change.toFixed(1)}%`).join('\n')}
` : '### ✅ No Performance Regressions Detected'}

${report.analysis.improvements?.length > 0 ? `
### 🎯 Performance Improvements
${report.analysis.improvements.map(i => `- **${i.category}**: ${i.metric} improved by ${i.change.toFixed(1)}%`).join('\n')}
` : ''}

## Recommendations

${report.summary.performanceGrade === 'A' ? '✅ System performance is excellent and ready for production.' : ''}
${report.summary.performanceGrade === 'B' ? '✅ System performance is good with minor areas for optimization.' : ''}
${report.summary.performanceGrade === 'C' ? '⚠️ System performance is acceptable but needs improvement before production.' : ''}
${report.summary.performanceGrade === 'D' ? '❌ System performance needs significant improvement before production deployment.' : ''}

${report.analysis.regressions?.length > 0 ? '- Address identified performance regressions before production deployment' : ''}
${report.summary.overallStability < 0.9 ? '- Investigate and improve system stability' : ''}
${report.summary.averageTestDuration > 2000 ? '- Optimize response times to meet <2s requirement' : ''}

---
*Generated by PlopDock Performance Baseline Runner*
`;

    try {
      const readableReportPath = path.join(BASELINE_CONFIG.OUTPUT_DIRECTORY, `baseline-report-${Date.now()}.md`);
      await fs.writeFile(readableReportPath, humanReport);
      console.log(`📄 Human-readable report saved to ${readableReportPath}`);
    } catch (error) {
      console.warn(`⚠️ Could not save human-readable report: ${error.message}`);
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    console.log('🧹 Cleaning up Performance Baseline Runner...');
    
    if (this.chaosFramework) {
      this.chaosFramework.isRunning = false;
    }
    
    if (this.discoveryEngine) {
      await this.discoveryEngine.shutdown();
    }
    
    if (this.enhancedRegistry) {
      await this.enhancedRegistry.shutdown();
    }
    
    console.log('✓ Performance Baseline Runner cleanup completed');
  }
}

/**
 * Main execution function
 */
async function runPerformanceBaselines() {
  const runner = new PerformanceBaselineRunner();
  
  try {
    await runner.initialize();
    await runner.executeBaselineTests();
    return runner.testResults;
    
  } finally {
    await runner.cleanup();
  }
}

// Execute if this file is run directly
if (require.main === module) {
  runPerformanceBaselines()
    .then(results => {
      console.log('\n🎉 Performance Baseline Testing completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Performance Baseline Testing failed:', error);
      process.exit(1);
    });
}

module.exports = {
  PerformanceBaselineRunner,
  BaselineTestCategory,
  BASELINE_CONFIG,
  runPerformanceBaselines
};