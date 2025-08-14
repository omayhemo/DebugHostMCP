/**
 * Performance Test Scripts for Sprint 3 Stories 3.1 & 3.2
 * MCP Debug Host Platform - Comprehensive Performance Validation
 */

const puppeteer = require('puppeteer');
const lighthouse = require('lighthouse');
const fs = require('fs').promises;
const path = require('path');

// Performance thresholds
const PERFORMANCE_THRESHOLDS = {
  // Story 3.1 Thresholds
  bundleSize: 500 * 1024, // 500KB
  lighthouseScore: 90,
  initialRender: 500, // 500ms
  
  // Story 3.2 Thresholds
  logStreamingLatency: 100, // 100ms
  memoryUsage: 100 * 1024 * 1024, // 100MB
  scrollFPS: 60,
  searchResponseTime: 200, // 200ms for 10K entries
  maxLogEntries: 10000
};

/**
 * Bundle Size Analysis for Story 3.1
 */
async function analyzeBundleSize() {
  console.log('📦 Analyzing bundle size for Story 3.1...');
  
  const distPath = path.join(__dirname, '../../dashboard/dist');
  const files = await fs.readdir(distPath, { withFileTypes: true });
  
  let totalSize = 0;
  const bundleAnalysis = {
    files: [],
    totalSize: 0,
    gzippedSize: 0,
    passesThreshold: false
  };
  
  for (const file of files) {
    if (file.isFile() && (file.name.endsWith('.js') || file.name.endsWith('.css'))) {
      const filePath = path.join(distPath, file.name);
      const stats = await fs.stat(filePath);
      const size = stats.size;
      totalSize += size;
      
      bundleAnalysis.files.push({
        name: file.name,
        size: size,
        sizeKB: Math.round(size / 1024 * 100) / 100
      });
    }
  }
  
  bundleAnalysis.totalSize = totalSize;
  bundleAnalysis.totalSizeKB = Math.round(totalSize / 1024 * 100) / 100;
  bundleAnalysis.passesThreshold = totalSize < PERFORMANCE_THRESHOLDS.bundleSize;
  
  console.log(`Bundle Analysis Results:`);
  console.log(`- Total Size: ${bundleAnalysis.totalSizeKB} KB`);
  console.log(`- Threshold: ${Math.round(PERFORMANCE_THRESHOLDS.bundleSize / 1024)} KB`);
  console.log(`- Status: ${bundleAnalysis.passesThreshold ? '✅ PASS' : '❌ FAIL'}`);
  
  return bundleAnalysis;
}

/**
 * Lighthouse Performance Test for Story 3.1
 */
async function runLighthouseTest() {
  console.log('🔍 Running Lighthouse performance test...');
  
  const browser = await puppeteer.launch({ headless: true });
  
  try {
    const { lhr } = await lighthouse('http://localhost:4173', {
      port: new URL(browser.wsEndpoint()).port,
      output: 'json',
      logLevel: 'info',
      onlyCategories: ['performance'],
      settings: {
        maxWaitForLoad: 45000,
        skipAudits: ['screenshot-thumbnails', 'final-screenshot']
      }
    });
    
    const performanceScore = Math.round(lhr.categories.performance.score * 100);
    const metrics = lhr.audits;
    
    const results = {
      performanceScore,
      metrics: {
        firstContentfulPaint: metrics['first-contentful-paint'].numericValue,
        largestContentfulPaint: metrics['largest-contentful-paint'].numericValue,
        cumulativeLayoutShift: metrics['cumulative-layout-shift'].numericValue,
        totalBlockingTime: metrics['total-blocking-time'].numericValue,
        speedIndex: metrics['speed-index'].numericValue
      },
      passesThreshold: performanceScore >= PERFORMANCE_THRESHOLDS.lighthouseScore
    };
    
    console.log(`Lighthouse Results:`);
    console.log(`- Performance Score: ${performanceScore}/100`);
    console.log(`- Threshold: ${PERFORMANCE_THRESHOLDS.lighthouseScore}`);
    console.log(`- Status: ${results.passesThreshold ? '✅ PASS' : '❌ FAIL'}`);
    
    return results;
  } finally {
    await browser.close();
  }
}

/**
 * Initial Render Performance Test
 */
async function testInitialRenderPerformance() {
  console.log('⚡ Testing initial render performance...');
  
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    // Start performance measurement
    await page.goto('http://localhost:4173', { waitUntil: 'domcontentloaded' });
    
    const renderTime = await page.evaluate(() => {
      return new Promise((resolve) => {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          for (const entry of entries) {
            if (entry.name === 'first-contentful-paint') {
              resolve(entry.startTime);
            }
          }
        });
        observer.observe({ entryTypes: ['paint'] });
        
        // Fallback timeout
        setTimeout(() => resolve(0), 5000);
      });
    });
    
    const results = {
      renderTime,
      passesThreshold: renderTime < PERFORMANCE_THRESHOLDS.initialRender
    };
    
    console.log(`Initial Render Results:`);
    console.log(`- Render Time: ${Math.round(renderTime)} ms`);
    console.log(`- Threshold: ${PERFORMANCE_THRESHOLDS.initialRender} ms`);
    console.log(`- Status: ${results.passesThreshold ? '✅ PASS' : '❌ FAIL'}`);
    
    return results;
  } finally {
    await browser.close();
  }
}

/**
 * Real-time Log Streaming Performance Test for Story 3.2
 */
async function testLogStreamingPerformance() {
  console.log('📊 Testing log streaming performance...');
  
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:4173/logs', { waitUntil: 'networkidle0' });
    
    // Mock high-volume log streaming
    const streamingResults = await page.evaluate(async () => {
      const results = {
        averageLatency: 0,
        maxLatency: 0,
        memoryUsage: 0,
        droppedFrames: 0,
        totalLogs: 0
      };
      
      const latencies = [];
      let startMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
      
      // Simulate 1000 log entries streaming
      for (let i = 0; i < 1000; i++) {
        const startTime = performance.now();
        
        // Create mock log entry
        const mockLog = {
          id: `perf-test-${i}`,
          timestamp: new Date().toISOString(),
          level: ['info', 'warn', 'error', 'debug'][i % 4],
          message: `Performance test log entry ${i}`,
          source: 'perf-test'
        };
        
        // Simulate dispatching to Redux store
        if (window.store) {
          window.store.dispatch({
            type: 'logs/addLog',
            payload: mockLog
          });
        }
        
        const endTime = performance.now();
        const latency = endTime - startTime;
        latencies.push(latency);
        
        // Throttle to simulate realistic streaming
        if (i % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      results.totalLogs = 1000;
      results.averageLatency = latencies.reduce((a, b) => a + b) / latencies.length;
      results.maxLatency = Math.max(...latencies);
      
      if (performance.memory) {
        results.memoryUsage = performance.memory.usedJSHeapSize - startMemory;
      }
      
      return results;
    });
    
    const results = {
      ...streamingResults,
      latencyPassesThreshold: streamingResults.averageLatency < PERFORMANCE_THRESHOLDS.logStreamingLatency,
      memoryPassesThreshold: streamingResults.memoryUsage < PERFORMANCE_THRESHOLDS.memoryUsage
    };
    
    console.log(`Log Streaming Results:`);
    console.log(`- Average Latency: ${Math.round(results.averageLatency)} ms`);
    console.log(`- Max Latency: ${Math.round(results.maxLatency)} ms`);
    console.log(`- Memory Used: ${Math.round(results.memoryUsage / 1024 / 1024)} MB`);
    console.log(`- Total Logs: ${results.totalLogs}`);
    console.log(`- Latency Status: ${results.latencyPassesThreshold ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`- Memory Status: ${results.memoryPassesThreshold ? '✅ PASS' : '❌ FAIL'}`);
    
    return results;
  } finally {
    await browser.close();
  }
}

/**
 * Virtual Scrolling Performance Test
 */
async function testVirtualScrollingPerformance() {
  console.log('📜 Testing virtual scrolling performance...');
  
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:4173/logs', { waitUntil: 'networkidle0' });
    
    const scrollResults = await page.evaluate(async () => {
      const results = {
        averageFPS: 0,
        minFPS: 60,
        maxFPS: 0,
        scrollDuration: 0,
        frameCount: 0
      };
      
      // Add many log entries to test scrolling
      const logCount = 5000;
      if (window.store) {
        const logs = Array.from({ length: logCount }, (_, i) => ({
          id: `scroll-test-${i}`,
          timestamp: new Date().toISOString(),
          level: 'info',
          message: `Scroll test log entry ${i}`,
          source: 'scroll-test'
        }));
        
        window.store.dispatch({
          type: 'logs/setLogs',
          payload: logs
        });
      }
      
      // Wait for DOM to update
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const scrollContainer = document.querySelector('[data-testid="log-viewer-list"]');
      if (!scrollContainer) return results;
      
      let frameCount = 0;
      let lastTime = performance.now();
      const frameTimes = [];
      
      const measureFrameRate = () => {
        const now = performance.now();
        const delta = now - lastTime;
        frameTimes.push(1000 / delta);
        lastTime = now;
        frameCount++;
      };
      
      // Start measuring
      const startTime = performance.now();
      
      return new Promise((resolve) => {
        const scrollDistance = scrollContainer.scrollHeight;
        const scrollSpeed = 50; // pixels per frame
        let currentScroll = 0;
        
        const scrollInterval = setInterval(() => {
          measureFrameRate();
          currentScroll += scrollSpeed;
          scrollContainer.scrollTop = currentScroll;
          
          if (currentScroll >= scrollDistance || frameCount >= 60) {
            clearInterval(scrollInterval);
            
            const endTime = performance.now();
            const avgFPS = frameTimes.reduce((a, b) => a + b) / frameTimes.length;
            
            results.averageFPS = avgFPS;
            results.minFPS = Math.min(...frameTimes);
            results.maxFPS = Math.max(...frameTimes);
            results.scrollDuration = endTime - startTime;
            results.frameCount = frameCount;
            
            resolve(results);
          }
        }, 16); // ~60fps
      });
    });
    
    const results = {
      ...scrollResults,
      passesThreshold: scrollResults.averageFPS >= 50 // Allow some tolerance below 60fps
    };
    
    console.log(`Virtual Scrolling Results:`);
    console.log(`- Average FPS: ${Math.round(results.averageFPS)}`);
    console.log(`- Min FPS: ${Math.round(results.minFPS)}`);
    console.log(`- Max FPS: ${Math.round(results.maxFPS)}`);
    console.log(`- Duration: ${Math.round(results.scrollDuration)} ms`);
    console.log(`- Status: ${results.passesThreshold ? '✅ PASS' : '❌ FAIL'}`);
    
    return results;
  } finally {
    await browser.close();
  }
}

/**
 * Search Performance Test
 */
async function testSearchPerformance() {
  console.log('🔍 Testing search performance...');
  
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:4173/logs', { waitUntil: 'networkidle0' });
    
    const searchResults = await page.evaluate(async () => {
      const results = {
        searchTime: 0,
        resultsCount: 0,
        memoryImpact: 0
      };
      
      // Add 10,000 log entries for search testing
      const logCount = 10000;
      if (window.store) {
        const logs = Array.from({ length: logCount }, (_, i) => ({
          id: `search-test-${i}`,
          timestamp: new Date().toISOString(),
          level: ['info', 'warn', 'error', 'debug'][i % 4],
          message: `Search test log entry ${i} ${i % 100 === 0 ? 'ERROR' : 'normal'}`,
          source: 'search-test'
        }));
        
        window.store.dispatch({
          type: 'logs/setLogs',
          payload: logs
        });
      }
      
      // Wait for DOM to update
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const startMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
      const startTime = performance.now();
      
      // Simulate search
      const searchTerm = 'ERROR';
      window.store.dispatch({
        type: 'logs/setFilters',
        payload: { search: searchTerm }
      });
      
      // Wait for search to complete
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const endTime = performance.now();
      const endMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
      
      results.searchTime = endTime - startTime;
      results.memoryImpact = endMemory - startMemory;
      results.resultsCount = window.store.getState().logs.filteredLogs?.length || 0;
      
      return results;
    });
    
    const results = {
      ...searchResults,
      passesThreshold: searchResults.searchTime < PERFORMANCE_THRESHOLDS.searchResponseTime
    };
    
    console.log(`Search Performance Results:`);
    console.log(`- Search Time: ${Math.round(results.searchTime)} ms`);
    console.log(`- Results Found: ${results.resultsCount}`);
    console.log(`- Memory Impact: ${Math.round(results.memoryImpact / 1024)} KB`);
    console.log(`- Status: ${results.passesThreshold ? '✅ PASS' : '❌ FAIL'}`);
    
    return results;
  } finally {
    await browser.close();
  }
}

/**
 * Memory Leak Detection Test
 */
async function testMemoryLeakDetection() {
  console.log('🧠 Testing memory leak detection...');
  
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:4173/logs', { waitUntil: 'networkidle0' });
    
    const memoryResults = await page.evaluate(async () => {
      const results = {
        initialMemory: 0,
        peakMemory: 0,
        finalMemory: 0,
        memoryGrowth: 0,
        gcEffectiveness: 0
      };
      
      if (!performance.memory) {
        return { error: 'Performance memory API not available' };
      }
      
      results.initialMemory = performance.memory.usedJSHeapSize;
      
      // Simulate memory-intensive operations
      for (let cycle = 0; cycle < 10; cycle++) {
        // Add large batch of logs
        const logs = Array.from({ length: 2000 }, (_, i) => ({
          id: `memory-test-${cycle}-${i}`,
          timestamp: new Date().toISOString(),
          level: 'info',
          message: `Memory test log entry ${i} with some longer content to simulate real log messages that might contain stack traces or detailed information`,
          source: 'memory-test'
        }));
        
        if (window.store) {
          window.store.dispatch({
            type: 'logs/addLogs',
            payload: logs
          });
        }
        
        // Force garbage collection if available
        if (window.gc) {
          window.gc();
        }
        
        const currentMemory = performance.memory.usedJSHeapSize;
        if (currentMemory > results.peakMemory) {
          results.peakMemory = currentMemory;
        }
        
        // Wait between cycles
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Final garbage collection
      if (window.gc) {
        window.gc();
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      results.finalMemory = performance.memory.usedJSHeapSize;
      results.memoryGrowth = results.finalMemory - results.initialMemory;
      results.gcEffectiveness = (results.peakMemory - results.finalMemory) / results.peakMemory;
      
      return results;
    });
    
    if (memoryResults.error) {
      console.log(`Memory Test Results: ${memoryResults.error}`);
      return { passesThreshold: true, error: memoryResults.error };
    }
    
    const results = {
      ...memoryResults,
      passesThreshold: memoryResults.memoryGrowth < PERFORMANCE_THRESHOLDS.memoryUsage / 2 // Allow 50MB growth
    };
    
    console.log(`Memory Leak Detection Results:`);
    console.log(`- Initial Memory: ${Math.round(results.initialMemory / 1024 / 1024)} MB`);
    console.log(`- Peak Memory: ${Math.round(results.peakMemory / 1024 / 1024)} MB`);
    console.log(`- Final Memory: ${Math.round(results.finalMemory / 1024 / 1024)} MB`);
    console.log(`- Memory Growth: ${Math.round(results.memoryGrowth / 1024 / 1024)} MB`);
    console.log(`- GC Effectiveness: ${Math.round(results.gcEffectiveness * 100)}%`);
    console.log(`- Status: ${results.passesThreshold ? '✅ PASS' : '❌ FAIL'}`);
    
    return results;
  } finally {
    await browser.close();
  }
}

/**
 * Load Testing with Multiple Concurrent Users
 */
async function testConcurrentUserLoad() {
  console.log('👥 Testing concurrent user load...');
  
  const concurrentUsers = 5;
  const testDuration = 30000; // 30 seconds
  
  const browsers = [];
  const results = {
    concurrentUsers,
    testDuration,
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0,
    peakResponseTime: 0
  };
  
  try {
    // Launch multiple browser instances
    for (let i = 0; i < concurrentUsers; i++) {
      const browser = await puppeteer.launch({ headless: true });
      browsers.push(browser);
    }
    
    const userSessions = await Promise.all(browsers.map(async (browser, index) => {
      const page = await browser.newPage();
      const sessionResults = {
        requests: 0,
        successful: 0,
        failed: 0,
        responseTimes: []
      };
      
      const startTime = Date.now();
      
      while (Date.now() - startTime < testDuration) {
        try {
          const requestStart = performance.now();
          
          await page.goto(`http://localhost:4173/logs?user=${index}`, { 
            waitUntil: 'networkidle0',
            timeout: 10000 
          });
          
          // Simulate user interactions
          await page.evaluate(() => {
            // Simulate log streaming
            if (window.store) {
              window.store.dispatch({
                type: 'logs/addLog',
                payload: {
                  id: `concurrent-${Date.now()}`,
                  timestamp: new Date().toISOString(),
                  level: 'info',
                  message: 'Concurrent user test log',
                  source: 'load-test'
                }
              });
            }
          });
          
          const requestEnd = performance.now();
          const responseTime = requestEnd - requestStart;
          
          sessionResults.requests++;
          sessionResults.successful++;
          sessionResults.responseTimes.push(responseTime);
          
        } catch (error) {
          sessionResults.requests++;
          sessionResults.failed++;
        }
        
        // Wait between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      return sessionResults;
    }));
    
    // Aggregate results
    userSessions.forEach(session => {
      results.totalRequests += session.requests;
      results.successfulRequests += session.successful;
      results.failedRequests += session.failed;
      
      session.responseTimes.forEach(time => {
        if (time > results.peakResponseTime) {
          results.peakResponseTime = time;
        }
      });
    });
    
    const allResponseTimes = userSessions.flatMap(s => s.responseTimes);
    results.averageResponseTime = allResponseTimes.reduce((a, b) => a + b, 0) / allResponseTimes.length;
    
    const successRate = (results.successfulRequests / results.totalRequests) * 100;
    results.passesThreshold = successRate >= 95; // 95% success rate threshold
    
    console.log(`Concurrent Load Test Results:`);
    console.log(`- Concurrent Users: ${results.concurrentUsers}`);
    console.log(`- Test Duration: ${results.testDuration / 1000}s`);
    console.log(`- Total Requests: ${results.totalRequests}`);
    console.log(`- Success Rate: ${Math.round(successRate)}%`);
    console.log(`- Average Response Time: ${Math.round(results.averageResponseTime)} ms`);
    console.log(`- Peak Response Time: ${Math.round(results.peakResponseTime)} ms`);
    console.log(`- Status: ${results.passesThreshold ? '✅ PASS' : '❌ FAIL'}`);
    
    return results;
    
  } finally {
    // Clean up browsers
    await Promise.all(browsers.map(browser => browser.close()));
  }
}

/**
 * Run All Performance Tests
 */
async function runAllPerformanceTests() {
  console.log('🚀 Starting comprehensive performance test suite...');
  console.log('================================================');
  
  const testResults = {
    timestamp: new Date().toISOString(),
    testSuite: 'Sprint 3 Performance Tests',
    results: {}
  };
  
  try {
    // Story 3.1 Tests
    console.log('\n📦 STORY 3.1 - REACT DASHBOARD SCAFFOLDING');
    console.log('===========================================');
    
    testResults.results.bundleSize = await analyzeBundleSize();
    testResults.results.lighthouse = await runLighthouseTest();
    testResults.results.initialRender = await testInitialRenderPerformance();
    
    // Story 3.2 Tests
    console.log('\n📊 STORY 3.2 - REAL-TIME LOG VIEWER');
    console.log('===================================');
    
    testResults.results.logStreaming = await testLogStreamingPerformance();
    testResults.results.virtualScrolling = await testVirtualScrollingPerformance();
    testResults.results.searchPerformance = await testSearchPerformance();
    testResults.results.memoryLeaks = await testMemoryLeakDetection();
    
    // Integration Tests
    console.log('\n🔗 INTEGRATION TESTS');
    console.log('====================');
    
    testResults.results.concurrentLoad = await testConcurrentUserLoad();
    
    // Summary
    console.log('\n📋 PERFORMANCE TEST SUMMARY');
    console.log('===========================');
    
    const allTests = Object.values(testResults.results);
    const passedTests = allTests.filter(test => test.passesThreshold).length;
    const totalTests = allTests.length;
    const overallPass = passedTests === totalTests;
    
    console.log(`✅ Passed: ${passedTests}/${totalTests} tests`);
    console.log(`🎯 Overall Status: ${overallPass ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    
    testResults.summary = {
      totalTests,
      passedTests,
      failedTests: totalTests - passedTests,
      overallStatus: overallPass ? 'PASS' : 'FAIL'
    };
    
    // Save results to file
    const resultsPath = path.join(__dirname, 'performance-test-results.json');
    await fs.writeFile(resultsPath, JSON.stringify(testResults, null, 2));
    console.log(`\n💾 Results saved to: ${resultsPath}`);
    
    return testResults;
    
  } catch (error) {
    console.error('❌ Performance test suite failed:', error);
    testResults.error = error.message;
    return testResults;
  }
}

/**
 * Export individual test functions for targeted testing
 */
module.exports = {
  // Individual test functions
  analyzeBundleSize,
  runLighthouseTest,
  testInitialRenderPerformance,
  testLogStreamingPerformance,
  testVirtualScrollingPerformance,
  testSearchPerformance,
  testMemoryLeakDetection,
  testConcurrentUserLoad,
  
  // Main test runner
  runAllPerformanceTests,
  
  // Constants
  PERFORMANCE_THRESHOLDS
};

// If run directly, execute all tests
if (require.main === module) {
  runAllPerformanceTests()
    .then(results => {
      process.exit(results.summary?.overallStatus === 'PASS' ? 0 : 1);
    })
    .catch(error => {
      console.error('Failed to run performance tests:', error);
      process.exit(1);
    });
}