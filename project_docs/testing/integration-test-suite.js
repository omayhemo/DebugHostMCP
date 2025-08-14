/**
 * Integration Test Suite for Sprint 3 Stories 3.1 & 3.2
 * MCP Debug Host Platform - End-to-End Integration Testing
 */

const puppeteer = require('puppeteer');
const axios = require('axios');
const WebSocket = require('ws');
const fs = require('fs').promises;
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  baseURL: 'http://localhost:4173',
  apiURL: 'http://localhost:3001/api',
  wsURL: 'ws://localhost:3001',
  timeout: 30000,
  retryAttempts: 3,
  testData: {
    projectId: 'integration-test-project',
    containerName: 'test-container',
    sessionId: 'test-session-001'
  }
};

/**
 * Test Helper Functions
 */
class TestHelpers {
  static async waitFor(condition, timeout = 10000, interval = 100) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      if (await condition()) return true;
      await new Promise(resolve => setTimeout(resolve, interval));
    }
    throw new Error(`Condition not met within ${timeout}ms`);
  }
  
  static async retryOperation(operation, attempts = 3) {
    for (let i = 0; i < attempts; i++) {
      try {
        return await operation();
      } catch (error) {
        if (i === attempts - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  }
  
  static generateMockLog(index = 0) {
    return {
      id: `integration-log-${Date.now()}-${index}`,
      sessionId: TEST_CONFIG.testData.sessionId,
      timestamp: new Date().toISOString(),
      level: ['info', 'warn', 'error', 'debug'][index % 4],
      message: `Integration test log message ${index}`,
      source: TEST_CONFIG.testData.containerName,
      metadata: {
        component: 'integration-test',
        testIndex: index
      }
    };
  }
}

/**
 * Dashboard Navigation Integration Tests
 */
class DashboardNavigationTests {
  constructor(browser) {
    this.browser = browser;
    this.page = null;
  }
  
  async setup() {
    this.page = await this.browser.newPage();
    await this.page.goto(TEST_CONFIG.baseURL);
  }
  
  async teardown() {
    if (this.page) await this.page.close();
  }
  
  async testInitialDashboardLoad() {
    console.log('🏠 Testing initial dashboard load...');
    
    await TestHelpers.waitFor(async () => {
      const title = await this.page.title();
      return title.includes('MCP Debug Host');
    });
    
    // Verify core dashboard elements
    const elements = await this.page.evaluate(() => ({
      header: !!document.querySelector('header'),
      sidebar: !!document.querySelector('nav[role="navigation"]'),
      mainContent: !!document.querySelector('main'),
      themeToggle: !!document.querySelector('[data-testid="theme-toggle"]'),
      userMenu: !!document.querySelector('[data-testid="user-menu"]')
    }));
    
    const results = {
      passed: Object.values(elements).every(Boolean),
      elements,
      loadTime: await this.page.evaluate(() => performance.now())
    };
    
    console.log(`Dashboard Load: ${results.passed ? '✅ PASS' : '❌ FAIL'}`);
    return results;
  }
  
  async testNavigationToLogViewer() {
    console.log('🔗 Testing navigation to log viewer...');
    
    // Click on logs navigation link
    await this.page.click('a[href="/logs"]');
    
    await TestHelpers.waitFor(async () => {
      const url = this.page.url();
      return url.includes('/logs');
    });
    
    // Verify log viewer components loaded
    const logViewerElements = await this.page.evaluate(() => ({
      logViewer: !!document.querySelector('[data-testid="log-viewer"]'),
      logControls: !!document.querySelector('[data-testid="log-controls"]'),
      connectionStatus: !!document.querySelector('[data-testid="connection-status"]'),
      searchInput: !!document.querySelector('[data-testid="log-search"]'),
      filterButton: !!document.querySelector('[data-testid="log-filter"]')
    }));
    
    const results = {
      passed: Object.values(logViewerElements).every(Boolean),
      elements: logViewerElements,
      url: this.page.url()
    };
    
    console.log(`Navigation to Log Viewer: ${results.passed ? '✅ PASS' : '❌ FAIL'}`);
    return results;
  }
  
  async testThemeConsistency() {
    console.log('🎨 Testing theme consistency across navigation...');
    
    // Start in dashboard, toggle theme
    await this.page.goto(`${TEST_CONFIG.baseURL}/dashboard`);
    await this.page.click('[data-testid="theme-toggle"]');
    
    const dashboardTheme = await this.page.evaluate(() => {
      return document.documentElement.classList.contains('dark');
    });
    
    // Navigate to logs page
    await this.page.click('a[href="/logs"]');
    await TestHelpers.waitFor(async () => this.page.url().includes('/logs'));
    
    const logViewerTheme = await this.page.evaluate(() => {
      return document.documentElement.classList.contains('dark');
    });
    
    const results = {
      passed: dashboardTheme === logViewerTheme,
      dashboardTheme,
      logViewerTheme,
      consistent: dashboardTheme === logViewerTheme
    };
    
    console.log(`Theme Consistency: ${results.passed ? '✅ PASS' : '❌ FAIL'}`);
    return results;
  }
}

/**
 * Real-time Data Flow Integration Tests
 */
class RealTimeDataFlowTests {
  constructor(browser) {
    this.browser = browser;
    this.page = null;
    this.wsConnection = null;
  }
  
  async setup() {
    this.page = await this.browser.newPage();
    await this.page.goto(`${TEST_CONFIG.baseURL}/logs`);
  }
  
  async teardown() {
    if (this.wsConnection) {
      this.wsConnection.close();
    }
    if (this.page) await this.page.close();
  }
  
  async testSSEConnectionEstablishment() {
    console.log('📡 Testing SSE connection establishment...');
    
    // Start streaming from UI
    await this.page.click('[data-testid="start-streaming"]');
    
    // Monitor network requests
    const sseRequests = [];
    this.page.on('request', request => {
      if (request.url().includes('/logs/stream')) {
        sseRequests.push(request);
      }
    });
    
    await TestHelpers.waitFor(async () => sseRequests.length > 0);
    
    // Check connection status in UI
    const connectionStatus = await this.page.evaluate(() => {
      const statusElement = document.querySelector('[data-testid="connection-status"]');
      return statusElement ? statusElement.textContent : '';
    });
    
    const results = {
      passed: sseRequests.length > 0 && connectionStatus.includes('Connected'),
      sseRequestCount: sseRequests.length,
      connectionStatus,
      requestHeaders: sseRequests[0]?.headers() || {}
    };
    
    console.log(`SSE Connection: ${results.passed ? '✅ PASS' : '❌ FAIL'}`);
    return results;
  }
  
  async testWebSocketFallback() {
    console.log('🔄 Testing WebSocket fallback mechanism...');
    
    // Block SSE requests to force WebSocket fallback
    await this.page.setRequestInterception(true);
    this.page.on('request', request => {
      if (request.url().includes('/logs/stream') && request.method() === 'GET') {
        request.abort();
      } else {
        request.continue();
      }
    });
    
    // Attempt to start streaming
    await this.page.click('[data-testid="start-streaming"]');
    
    // Check for WebSocket connection attempt
    const wsAttempt = await this.page.evaluate(() => {
      return new Promise((resolve) => {
        const originalWebSocket = window.WebSocket;
        let wsConnected = false;
        
        window.WebSocket = function(url) {
          wsConnected = true;
          resolve(true);
          return new originalWebSocket(url);
        };
        
        setTimeout(() => resolve(wsConnected), 5000);
      });
    });
    
    const results = {
      passed: wsAttempt,
      fallbackTriggered: wsAttempt
    };
    
    console.log(`WebSocket Fallback: ${results.passed ? '✅ PASS' : '❌ FAIL'}`);
    return results;
  }
  
  async testLiveLogUpdates() {
    console.log('📊 Testing live log updates...');
    
    // Establish connection
    await this.page.click('[data-testid="start-streaming"]');
    await TestHelpers.waitFor(async () => {
      const status = await this.page.evaluate(() => {
        const el = document.querySelector('[data-testid="connection-status"]');
        return el ? el.textContent : '';
      });
      return status.includes('Connected');
    });
    
    // Get initial log count
    const initialLogCount = await this.page.evaluate(() => {
      return document.querySelectorAll('[data-testid="log-entry"]').length;
    });
    
    // Simulate backend sending logs via mock injection
    await this.page.evaluate((mockLogs) => {
      if (window.store) {
        mockLogs.forEach(log => {
          window.store.dispatch({
            type: 'logs/addLog',
            payload: log
          });
        });
      }
    }, [
      TestHelpers.generateMockLog(1),
      TestHelpers.generateMockLog(2),
      TestHelpers.generateMockLog(3)
    ]);
    
    // Wait for UI update
    await TestHelpers.waitFor(async () => {
      const currentCount = await this.page.evaluate(() => {
        return document.querySelectorAll('[data-testid="log-entry"]').length;
      });
      return currentCount > initialLogCount;
    });
    
    const finalLogCount = await this.page.evaluate(() => {
      return document.querySelectorAll('[data-testid="log-entry"]').length;
    });
    
    const results = {
      passed: finalLogCount > initialLogCount,
      initialCount: initialLogCount,
      finalCount: finalLogCount,
      logsAdded: finalLogCount - initialLogCount
    };
    
    console.log(`Live Log Updates: ${results.passed ? '✅ PASS' : '❌ FAIL'}`);
    return results;
  }
  
  async testReconnectionLogic() {
    console.log('🔁 Testing reconnection logic...');
    
    // Establish initial connection
    await this.page.click('[data-testid="start-streaming"]');
    await TestHelpers.waitFor(async () => {
      const status = await this.page.evaluate(() => {
        const el = document.querySelector('[data-testid="connection-status"]');
        return el ? el.textContent : '';
      });
      return status.includes('Connected');
    });
    
    // Simulate connection loss
    await this.page.evaluate(() => {
      // Trigger connection error in the app
      if (window.logService && window.logService.eventSource) {
        window.logService.eventSource.onerror(new Event('error'));
      }
    });
    
    // Check for reconnecting status
    const reconnectingDetected = await TestHelpers.waitFor(async () => {
      const status = await this.page.evaluate(() => {
        const el = document.querySelector('[data-testid="connection-status"]');
        return el ? el.textContent : '';
      });
      return status.includes('Reconnecting');
    }, 5000).catch(() => false);
    
    // Wait for eventual reconnection
    const reconnected = await TestHelpers.waitFor(async () => {
      const status = await this.page.evaluate(() => {
        const el = document.querySelector('[data-testid="connection-status"]');
        return el ? el.textContent : '';
      });
      return status.includes('Connected');
    }, 15000).catch(() => false);
    
    const results = {
      passed: reconnectingDetected && reconnected,
      reconnectingDetected,
      reconnected
    };
    
    console.log(`Reconnection Logic: ${results.passed ? '✅ PASS' : '❌ FAIL'}`);
    return results;
  }
}

/**
 * State Management Integration Tests
 */
class StateManagementIntegrationTests {
  constructor(browser) {
    this.browser = browser;
    this.page = null;
  }
  
  async setup() {
    this.page = await this.browser.newPage();
    await this.page.goto(`${TEST_CONFIG.baseURL}/logs`);
  }
  
  async teardown() {
    if (this.page) await this.page.close();
  }
  
  async testReduxStoreIntegration() {
    console.log('🏪 Testing Redux store integration...');
    
    const storeValidation = await this.page.evaluate(() => {
      const store = window.store;
      if (!store) return { hasStore: false };
      
      const state = store.getState();
      return {
        hasStore: true,
        hasAuth: !!state.auth,
        hasUI: !!state.ui,
        hasLogs: !!state.logs,
        hasServers: !!state.servers,
        initialLogCount: state.logs?.logs?.length || 0,
        authState: state.auth?.isAuthenticated || false
      };
    });
    
    // Test state updates
    await this.page.evaluate(() => {
      if (window.store) {
        window.store.dispatch({
          type: 'logs/addLog',
          payload: {
            id: 'integration-test-log',
            message: 'Test log for store integration',
            timestamp: new Date().toISOString(),
            level: 'info'
          }
        });
      }
    });
    
    const updatedState = await this.page.evaluate(() => {
      const state = window.store?.getState();
      return {
        logCount: state?.logs?.logs?.length || 0,
        latestLog: state?.logs?.logs?.[state.logs.logs.length - 1] || null
      };
    });
    
    const results = {
      passed: storeValidation.hasStore && 
               updatedState.logCount > storeValidation.initialLogCount,
      storeValidation,
      stateUpdate: updatedState,
      logAdded: updatedState.latestLog?.id === 'integration-test-log'
    };
    
    console.log(`Redux Store Integration: ${results.passed ? '✅ PASS' : '❌ FAIL'}`);
    return results;
  }
  
  async testFilterStateManagement() {
    console.log('🔍 Testing filter state management...');
    
    // Add test logs with different levels
    await this.page.evaluate(() => {
      if (window.store) {
        const testLogs = [
          { id: 'error-1', level: 'error', message: 'Error message 1' },
          { id: 'info-1', level: 'info', message: 'Info message 1' },
          { id: 'warn-1', level: 'warn', message: 'Warning message 1' },
          { id: 'error-2', level: 'error', message: 'Error message 2' }
        ].map(log => ({
          ...log,
          timestamp: new Date().toISOString(),
          source: 'test'
        }));
        
        window.store.dispatch({
          type: 'logs/setLogs',
          payload: testLogs
        });
      }
    });
    
    // Apply error filter
    await this.page.click('[data-testid="filter-level-error"]');
    
    // Check filtered results
    const filterResults = await this.page.evaluate(() => {
      const state = window.store?.getState();
      return {
        totalLogs: state?.logs?.logs?.length || 0,
        filteredLogs: state?.logs?.filteredLogs?.length || 0,
        activeFilters: state?.logs?.filters || {},
        visibleErrorLogs: Array.from(document.querySelectorAll('[data-testid="log-entry"]'))
          .filter(el => el.textContent.includes('Error')).length
      };
    });
    
    // Clear filters
    await this.page.click('[data-testid="clear-filters"]');
    
    const clearedState = await this.page.evaluate(() => {
      const state = window.store?.getState();
      return {
        filters: state?.logs?.filters || {},
        visibleLogs: document.querySelectorAll('[data-testid="log-entry"]').length
      };
    });
    
    const results = {
      passed: filterResults.filteredLogs < filterResults.totalLogs &&
              clearedState.visibleLogs >= filterResults.totalLogs,
      filterApplication: filterResults,
      filterClearing: clearedState
    };
    
    console.log(`Filter State Management: ${results.passed ? '✅ PASS' : '❌ FAIL'}`);
    return results;
  }
  
  async testSearchStateIntegration() {
    console.log('🔍 Testing search state integration...');
    
    // Add searchable test logs
    await this.page.evaluate(() => {
      if (window.store) {
        const searchTestLogs = [
          { id: 'search-1', message: 'Database connection established' },
          { id: 'search-2', message: 'User authentication successful' },
          { id: 'search-3', message: 'Database query executed' },
          { id: 'search-4', message: 'Cache invalidation triggered' }
        ].map(log => ({
          ...log,
          timestamp: new Date().toISOString(),
          level: 'info',
          source: 'test-app'
        }));
        
        window.store.dispatch({
          type: 'logs/setLogs',
          payload: searchTestLogs
        });
      }
    });
    
    // Perform search
    const searchInput = await this.page.$('[data-testid="log-search-input"]');
    await searchInput.type('Database');
    
    // Wait for debounced search
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const searchResults = await this.page.evaluate(() => {
      const state = window.store?.getState();
      return {
        searchTerm: state?.logs?.filters?.search || '',
        filteredCount: state?.logs?.filteredLogs?.length || 0,
        visibleResults: Array.from(document.querySelectorAll('[data-testid="log-entry"]'))
          .filter(el => el.textContent.includes('Database')).length
      };
    });
    
    // Clear search
    await searchInput.evaluate(el => el.value = '');
    await searchInput.type('');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const clearedSearch = await this.page.evaluate(() => {
      const state = window.store?.getState();
      return {
        searchTerm: state?.logs?.filters?.search || '',
        totalVisible: document.querySelectorAll('[data-testid="log-entry"]').length
      };
    });
    
    const results = {
      passed: searchResults.filteredCount === 2 && 
              searchResults.visibleResults === 2 &&
              clearedSearch.searchTerm === '',
      searchApplication: searchResults,
      searchClearing: clearedSearch
    };
    
    console.log(`Search State Integration: ${results.passed ? '✅ PASS' : '❌ FAIL'}`);
    return results;
  }
}

/**
 * API Integration Tests
 */
class APIIntegrationTests {
  constructor() {
    this.axiosInstance = axios.create({
      baseURL: TEST_CONFIG.apiURL,
      timeout: TEST_CONFIG.timeout
    });
  }
  
  async testAuthenticationFlow() {
    console.log('🔐 Testing authentication flow...');
    
    try {
      // Test login endpoint
      const loginResponse = await this.axiosInstance.post('/auth/login', {
        username: 'test-user',
        password: 'test-password'
      });
      
      const token = loginResponse.data.token;
      if (!token) throw new Error('No token received');
      
      // Test authenticated request
      const protectedResponse = await this.axiosInstance.get('/user/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const results = {
        passed: loginResponse.status === 200 && protectedResponse.status === 200,
        loginStatus: loginResponse.status,
        tokenReceived: !!token,
        protectedRequestStatus: protectedResponse.status
      };
      
      console.log(`Authentication Flow: ${results.passed ? '✅ PASS' : '❌ FAIL'}`);
      return results;
      
    } catch (error) {
      console.log(`Authentication Flow: ❌ FAIL - ${error.message}`);
      return { passed: false, error: error.message };
    }
  }
  
  async testLogStreamingEndpoints() {
    console.log('📡 Testing log streaming endpoints...');
    
    try {
      // Test SSE endpoint availability
      const sseResponse = await this.axiosInstance.get('/logs/stream', {
        headers: {
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache'
        },
        timeout: 5000
      });
      
      // Test log retrieval endpoint
      const logsResponse = await this.axiosInstance.get('/logs', {
        params: {
          projectId: TEST_CONFIG.testData.projectId,
          limit: 10
        }
      });
      
      const results = {
        passed: sseResponse.status === 200 && logsResponse.status === 200,
        sseEndpointStatus: sseResponse.status,
        logsEndpointStatus: logsResponse.status,
        logsReceived: Array.isArray(logsResponse.data?.logs)
      };
      
      console.log(`Log Streaming Endpoints: ${results.passed ? '✅ PASS' : '❌ FAIL'}`);
      return results;
      
    } catch (error) {
      console.log(`Log Streaming Endpoints: ❌ FAIL - ${error.message}`);
      return { passed: false, error: error.message };
    }
  }
  
  async testProjectManagementAPI() {
    console.log('📋 Testing project management API...');
    
    try {
      // Test project creation
      const createResponse = await this.axiosInstance.post('/projects', {
        id: TEST_CONFIG.testData.projectId,
        name: 'Integration Test Project',
        type: 'node',
        config: { port: 3000 }
      });
      
      // Test project retrieval
      const getResponse = await this.axiosInstance.get(`/projects/${TEST_CONFIG.testData.projectId}`);
      
      // Test project listing
      const listResponse = await this.axiosInstance.get('/projects');
      
      const results = {
        passed: createResponse.status === 201 && 
                getResponse.status === 200 && 
                listResponse.status === 200,
        createStatus: createResponse.status,
        getStatus: getResponse.status,
        listStatus: listResponse.status,
        projectFound: listResponse.data?.projects?.some(p => p.id === TEST_CONFIG.testData.projectId)
      };
      
      console.log(`Project Management API: ${results.passed ? '✅ PASS' : '❌ FAIL'}`);
      return results;
      
    } catch (error) {
      console.log(`Project Management API: ❌ FAIL - ${error.message}`);
      return { passed: false, error: error.message };
    }
  }
}

/**
 * End-to-End User Journey Tests
 */
class EndToEndJourneyTests {
  constructor(browser) {
    this.browser = browser;
    this.page = null;
  }
  
  async setup() {
    this.page = await this.browser.newPage();
  }
  
  async teardown() {
    if (this.page) await this.page.close();
  }
  
  async testCompleteUserWorkflow() {
    console.log('🎯 Testing complete user workflow...');
    
    const workflow = {
      steps: [],
      passed: true,
      totalSteps: 0,
      completedSteps: 0
    };
    
    try {
      // Step 1: Load application
      workflow.steps.push({ step: 'Load Application', status: 'running' });
      await this.page.goto(TEST_CONFIG.baseURL);
      await TestHelpers.waitFor(async () => await this.page.title());
      workflow.steps[0].status = 'completed';
      workflow.completedSteps++;
      
      // Step 2: Navigate to logs page
      workflow.steps.push({ step: 'Navigate to Logs', status: 'running' });
      await this.page.click('a[href="/logs"]');
      await TestHelpers.waitFor(async () => this.page.url().includes('/logs'));
      workflow.steps[1].status = 'completed';
      workflow.completedSteps++;
      
      // Step 3: Start log streaming
      workflow.steps.push({ step: 'Start Log Streaming', status: 'running' });
      await this.page.click('[data-testid="start-streaming"]');
      await TestHelpers.waitFor(async () => {
        const status = await this.page.evaluate(() => {
          const el = document.querySelector('[data-testid="connection-status"]');
          return el ? el.textContent : '';
        });
        return status.includes('Connected');
      });
      workflow.steps[2].status = 'completed';
      workflow.completedSteps++;
      
      // Step 4: Add and view logs
      workflow.steps.push({ step: 'View Logs', status: 'running' });
      await this.page.evaluate(() => {
        if (window.store) {
          for (let i = 0; i < 5; i++) {
            window.store.dispatch({
              type: 'logs/addLog',
              payload: {
                id: `e2e-log-${i}`,
                timestamp: new Date().toISOString(),
                level: ['info', 'warn', 'error'][i % 3],
                message: `End-to-end test log ${i}`,
                source: 'e2e-test'
              }
            });
          }
        }
      });
      
      await TestHelpers.waitFor(async () => {
        const logCount = await this.page.evaluate(() => {
          return document.querySelectorAll('[data-testid="log-entry"]').length;
        });
        return logCount >= 5;
      });
      workflow.steps[3].status = 'completed';
      workflow.completedSteps++;
      
      // Step 5: Test filtering
      workflow.steps.push({ step: 'Test Filtering', status: 'running' });
      await this.page.click('[data-testid="filter-level-error"]');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const errorLogsVisible = await this.page.evaluate(() => {
        return Array.from(document.querySelectorAll('[data-testid="log-entry"]'))
          .some(el => el.textContent.includes('error'));
      });
      
      if (errorLogsVisible) {
        workflow.steps[4].status = 'completed';
        workflow.completedSteps++;
      } else {
        workflow.steps[4].status = 'failed';
        workflow.passed = false;
      }
      
      // Step 6: Test search
      workflow.steps.push({ step: 'Test Search', status: 'running' });
      await this.page.click('[data-testid="clear-filters"]');
      const searchInput = await this.page.$('[data-testid="log-search-input"]');
      await searchInput.type('test log');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const searchResults = await this.page.evaluate(() => {
        return document.querySelectorAll('[data-testid="log-entry"]').length;
      });
      
      if (searchResults > 0) {
        workflow.steps[5].status = 'completed';
        workflow.completedSteps++;
      } else {
        workflow.steps[5].status = 'failed';
        workflow.passed = false;
      }
      
      // Step 7: Test export functionality
      workflow.steps.push({ step: 'Test Export', status: 'running' });
      await this.page.click('[data-testid="export-logs"]');
      
      // Wait for export to complete (check for download or success message)
      const exportCompleted = await TestHelpers.waitFor(async () => {
        const successMessage = await this.page.evaluate(() => {
          return document.querySelector('.toast-success') !== null;
        });
        return successMessage;
      }, 5000).catch(() => false);
      
      if (exportCompleted) {
        workflow.steps[6].status = 'completed';
        workflow.completedSteps++;
      } else {
        workflow.steps[6].status = 'failed';
        workflow.passed = false;
      }
      
      workflow.totalSteps = workflow.steps.length;
      workflow.successRate = (workflow.completedSteps / workflow.totalSteps) * 100;
      
    } catch (error) {
      workflow.passed = false;
      workflow.error = error.message;
      workflow.steps[workflow.steps.length - 1].status = 'failed';
    }
    
    console.log(`Complete User Workflow: ${workflow.passed ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Steps Completed: ${workflow.completedSteps}/${workflow.totalSteps} (${Math.round(workflow.successRate)}%)`);
    
    return workflow;
  }
}

/**
 * Main Integration Test Runner
 */
class IntegrationTestRunner {
  constructor() {
    this.browser = null;
    this.results = {
      timestamp: new Date().toISOString(),
      testSuite: 'Sprint 3 Integration Tests',
      categories: {},
      summary: {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        overallStatus: 'UNKNOWN'
      }
    };
  }
  
  async setup() {
    console.log('🚀 Setting up integration test environment...');
    this.browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  }
  
  async teardown() {
    if (this.browser) {
      await this.browser.close();
    }
  }
  
  async runAllTests() {
    console.log('🧪 Running comprehensive integration test suite...');
    console.log('==================================================');
    
    try {
      await this.setup();
      
      // Dashboard Navigation Tests
      console.log('\n🏠 DASHBOARD NAVIGATION TESTS');
      console.log('=============================');
      const dashboardTests = new DashboardNavigationTests(this.browser);
      await dashboardTests.setup();
      
      this.results.categories.dashboardNavigation = {
        initialLoad: await dashboardTests.testInitialDashboardLoad(),
        navigationToLogViewer: await dashboardTests.testNavigationToLogViewer(),
        themeConsistency: await dashboardTests.testThemeConsistency()
      };
      
      await dashboardTests.teardown();
      
      // Real-time Data Flow Tests
      console.log('\n📡 REAL-TIME DATA FLOW TESTS');
      console.log('============================');
      const dataFlowTests = new RealTimeDataFlowTests(this.browser);
      await dataFlowTests.setup();
      
      this.results.categories.realTimeDataFlow = {
        sseConnection: await dataFlowTests.testSSEConnectionEstablishment(),
        webSocketFallback: await dataFlowTests.testWebSocketFallback(),
        liveLogUpdates: await dataFlowTests.testLiveLogUpdates(),
        reconnectionLogic: await dataFlowTests.testReconnectionLogic()
      };
      
      await dataFlowTests.teardown();
      
      // State Management Tests
      console.log('\n🏪 STATE MANAGEMENT TESTS');
      console.log('=========================');
      const stateTests = new StateManagementIntegrationTests(this.browser);
      await stateTests.setup();
      
      this.results.categories.stateManagement = {
        reduxIntegration: await stateTests.testReduxStoreIntegration(),
        filterStateManagement: await stateTests.testFilterStateManagement(),
        searchStateIntegration: await stateTests.testSearchStateIntegration()
      };
      
      await stateTests.teardown();
      
      // API Integration Tests
      console.log('\n🌐 API INTEGRATION TESTS');
      console.log('========================');
      const apiTests = new APIIntegrationTests();
      
      this.results.categories.apiIntegration = {
        authenticationFlow: await apiTests.testAuthenticationFlow(),
        logStreamingEndpoints: await apiTests.testLogStreamingEndpoints(),
        projectManagementAPI: await apiTests.testProjectManagementAPI()
      };
      
      // End-to-End Journey Tests
      console.log('\n🎯 END-TO-END JOURNEY TESTS');
      console.log('===========================');
      const e2eTests = new EndToEndJourneyTests(this.browser);
      await e2eTests.setup();
      
      this.results.categories.endToEndJourney = {
        completeUserWorkflow: await e2eTests.testCompleteUserWorkflow()
      };
      
      await e2eTests.teardown();
      
      // Calculate summary
      this.calculateSummary();
      
      // Display results
      this.displayResults();
      
      // Save results
      await this.saveResults();
      
    } catch (error) {
      console.error('❌ Integration test suite failed:', error);
      this.results.error = error.message;
    } finally {
      await this.teardown();
    }
    
    return this.results;
  }
  
  calculateSummary() {
    let totalTests = 0;
    let passedTests = 0;
    
    Object.values(this.results.categories).forEach(category => {
      Object.values(category).forEach(test => {
        totalTests++;
        if (test.passed) passedTests++;
      });
    });
    
    this.results.summary = {
      totalTests,
      passedTests,
      failedTests: totalTests - passedTests,
      successRate: Math.round((passedTests / totalTests) * 100),
      overallStatus: passedTests === totalTests ? 'PASS' : 'FAIL'
    };
  }
  
  displayResults() {
    console.log('\n📊 INTEGRATION TEST SUMMARY');
    console.log('===========================');
    console.log(`✅ Passed: ${this.results.summary.passedTests}/${this.results.summary.totalTests}`);
    console.log(`❌ Failed: ${this.results.summary.failedTests}/${this.results.summary.totalTests}`);
    console.log(`📈 Success Rate: ${this.results.summary.successRate}%`);
    console.log(`🎯 Overall Status: ${this.results.summary.overallStatus === 'PASS' ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    
    // Detailed breakdown
    console.log('\n📋 DETAILED BREAKDOWN');
    console.log('====================');
    Object.entries(this.results.categories).forEach(([categoryName, tests]) => {
      console.log(`\n${categoryName.toUpperCase()}:`);
      Object.entries(tests).forEach(([testName, result]) => {
        console.log(`  ${result.passed ? '✅' : '❌'} ${testName}`);
      });
    });
  }
  
  async saveResults() {
    const resultsPath = path.join(__dirname, 'integration-test-results.json');
    await fs.writeFile(resultsPath, JSON.stringify(this.results, null, 2));
    console.log(`\n💾 Results saved to: ${resultsPath}`);
  }
}

// Export classes and runner
module.exports = {
  DashboardNavigationTests,
  RealTimeDataFlowTests,
  StateManagementIntegrationTests,
  APIIntegrationTests,
  EndToEndJourneyTests,
  IntegrationTestRunner,
  TestHelpers,
  TEST_CONFIG
};

// If run directly, execute all tests
if (require.main === module) {
  const runner = new IntegrationTestRunner();
  runner.runAllTests()
    .then(results => {
      process.exit(results.summary?.overallStatus === 'PASS' ? 0 : 1);
    })
    .catch(error => {
      console.error('Failed to run integration tests:', error);
      process.exit(1);
    });
}