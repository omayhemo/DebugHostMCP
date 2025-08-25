/**
 * Production Performance Configuration
 * 
 * Optimized configuration settings for production deployment based on comprehensive
 * performance analysis and testing. This configuration addresses identified bottlenecks
 * and ensures the system meets performance requirements in production environments.
 * 
 * Key Optimizations:
 * - Adaptive timeouts based on environment capabilities
 * - Graceful degradation for optional detectors
 * - Circuit breaker patterns for error recovery
 * - Environment-specific detector configuration
 */

const os = require('os');

/**
 * Environment Detection
 */
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
const isTest = process.env.NODE_ENV === 'test';

/**
 * System Capabilities Detection
 */
const systemCapabilities = {
  // Check for required external tools
  hasPhp: checkCommandAvailable('php'),
  hasPython: checkCommandAvailable('python3') || checkCommandAvailable('python'),
  hasNetstat: checkCommandAvailable('netstat'),
  hasDocker: checkCommandAvailable('docker'),
  
  // System resources
  cpuCount: os.cpus().length,
  totalMemory: Math.round(os.totalmem() / 1024 / 1024 / 1024), // GB
  
  // Platform detection
  isLinux: os.platform() === 'linux',
  isWindows: os.platform() === 'win32',
  isMacOS: os.platform() === 'darwin'
};

/**
 * Production Performance Configuration
 */
const ProductionPerformanceConfig = {
  // Environment Settings
  environment: {
    isProduction,
    isDevelopment,
    isTest,
    capabilities: systemCapabilities
  },
  
  // Discovery Engine Configuration
  discovery: {
    // Production-optimized timeouts
    scanTimeout: isProduction ? 2000 : 5000,                    // 2s production, 5s development
    maxTotalScanTime: isProduction ? 3000 : 8000,               // 3s production, 8s development
    
    // Performance settings
    enablePerformanceMonitoring: true,
    enableCorrelation: !isTest,                                 // Disable correlation in tests
    enableSmartCaching: true,
    enableGracefulDegradation: isProduction,                    // Enable graceful degradation in production
    
    // Concurrency control
    maxConcurrentDetectors: Math.min(systemCapabilities.cpuCount, isProduction ? 3 : 5),
    
    // Error recovery
    enableCircuitBreaker: isProduction,
    maxRecoveryAttempts: isProduction ? 2 : 5,
    recoveryTimeout: isProduction ? 15000 : 30000,              // 15s production, 30s development
    
    // Retry configuration
    retryConfig: {
      maxAttempts: isProduction ? 2 : 3,
      initialDelay: 1000,
      backoffMultiplier: 1.5,
      maxDelay: 5000
    }
  },
  
  // Technology Stack Detector Configuration
  detectors: {
    // Node.js - Always enabled (most reliable)
    nodejs: {
      enabled: true,
      timeout: isProduction ? 1500 : 3000,
      gracefulDegradation: true,
      priority: 1 // Highest priority
    },
    
    // Docker - Enabled if available
    docker: {
      enabled: systemCapabilities.hasDocker,
      timeout: isProduction ? 1000 : 2000,
      gracefulDegradation: true,
      priority: 2,
      fallbackBehavior: 'warn' // Warn if Docker not available but continue
    },
    
    // PHP - Conditional based on availability
    php: {
      enabled: systemCapabilities.hasPhp && !isProduction, // Disabled in production due to timeout issues
      timeout: 2000,
      gracefulDegradation: true,
      priority: 4,
      fallbackBehavior: 'silent', // Silently disable if not available
      productionConfig: {
        enabled: false,
        reason: 'timeout_optimization'
      }
    },
    
    // Python - Conditional based on availability
    python: {
      enabled: systemCapabilities.hasPython && systemCapabilities.hasNetstat && !isProduction,
      timeout: 2000,
      gracefulDegradation: true,
      priority: 5,
      fallbackBehavior: 'silent',
      productionConfig: {
        enabled: false,
        reason: 'dependency_unavailable'
      }
    },
    
    // Static Sites - Conditional based on netstat availability
    static: {
      enabled: systemCapabilities.hasNetstat && !isProduction,
      timeout: 2000,
      gracefulDegradation: true,
      priority: 6,
      fallbackBehavior: 'silent',
      productionConfig: {
        enabled: false,
        reason: 'dependency_unavailable'
      }
    }
  },
  
  // Performance Monitoring Configuration
  monitoring: {
    enabled: true,
    samplingInterval: isProduction ? 2000 : 1000,               // 2s production, 1s development
    historySize: isProduction ? 500 : 100,
    
    // Performance thresholds
    thresholds: {
      discoveryTime: isProduction ? 2000 : 5000,               // 2s production, 5s development
      cpuThreshold: isProduction ? 5.0 : 10.0,                 // 5% production, 10% development
      memoryThreshold: isProduction ? 50 : 100,                // 50MB production, 100MB development
      errorRateThreshold: isProduction ? 5.0 : 15.0            // 5% production, 15% development
    },
    
    // Alerting configuration
    alerting: {
      enabled: isProduction,
      thresholdViolationLimit: 3,                              // Alert after 3 consecutive violations
      cooldownPeriod: 300000                                   // 5 minutes cooldown between alerts
    }
  },
  
  // Registry Configuration
  registry: {
    refreshInterval: isProduction ? 2000 : 1000,               // 2s production, 1s development
    enableRealTimeUpdates: !isTest,
    enableErrorRecovery: true,
    enableSmartCaching: true,
    enablePerformanceMonitoring: true,
    
    // Performance optimization
    optimization: {
      enableBatchProcessing: true,
      enableAsyncQueueing: true,
      batchSize: isProduction ? 100 : 50,
      maxQueueSize: isProduction ? 200 : 100,
      maxConcurrentOperations: Math.min(systemCapabilities.cpuCount, isProduction ? 3 : 5)
    }
  },
  
  // Caching Configuration
  caching: {
    enabled: true,
    defaultTTL: isProduction ? 10000 : 5000,                   // 10s production, 5s development
    maxCacheSize: isProduction ? 1000 : 500,
    
    // Smart caching
    smartCaching: {
      enabled: true,
      adaptiveTTL: isProduction,                               // Enable adaptive TTL in production
      compressionEnabled: isProduction,                        // Enable compression in production
      persistentCache: isProduction                            // Enable persistent cache in production
    }
  },
  
  // Circuit Breaker Configuration
  circuitBreaker: {
    enabled: isProduction,
    
    // Per-detector circuit breakers
    detectorBreakers: {
      failureThreshold: 3,                                     // Open after 3 failures
      recoveryTimeout: 30000,                                  // 30s recovery timeout
      monitoringPeriod: 60000                                  // 1 minute monitoring period
    },
    
    // Global circuit breaker
    globalBreaker: {
      failureThreshold: 5,                                     // Open after 5 failures
      recoveryTimeout: 60000,                                  // 60s recovery timeout
      monitoringPeriod: 300000                                 // 5 minute monitoring period
    }
  },
  
  // Logging Configuration
  logging: {
    level: isProduction ? 'warn' : isDevelopment ? 'debug' : 'error',
    enablePerformanceLogging: !isTest,
    enableVerboseErrors: isDevelopment,
    
    // Performance logging
    performanceLogging: {
      logSlowOperations: true,
      slowOperationThreshold: isProduction ? 2000 : 5000,     // 2s production, 5s development
      logMemoryUsage: isProduction,
      logCacheHitRates: isProduction
    }
  }
};

/**
 * Utility Functions
 */

/**
 * Check if a command is available in the system PATH
 * @param {string} command - Command to check
 * @returns {boolean} - True if command is available
 */
function checkCommandAvailable(command) {
  try {
    const { execSync } = require('child_process');
    execSync(`${command} --version`, { 
      stdio: 'ignore', 
      timeout: 1000 // 1 second timeout for availability check
    });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get optimized configuration for current environment
 * @returns {Object} - Environment-optimized configuration
 */
function getOptimizedConfig() {
  const config = { ...ProductionPerformanceConfig };
  
  // Apply production-specific optimizations
  if (isProduction) {
    // Disable detectors with known timeout issues
    config.detectors.php.enabled = false;
    config.detectors.python.enabled = false;
    config.detectors.static.enabled = false;
    
    // Enable only reliable detectors
    const reliableDetectors = ['nodejs', 'docker'].filter(detector => 
      config.detectors[detector] && systemCapabilities[`has${detector.charAt(0).toUpperCase() + detector.slice(1)}`] !== false
    );
    
    // Update discovery configuration for production
    config.discovery.enabledDetectors = reliableDetectors;
    config.discovery.totalTimeout = 2500; // 2.5s total timeout for production
    
    console.log(`Production configuration loaded: ${reliableDetectors.length} reliable detectors enabled`);
    console.log(`Disabled detectors: ${Object.keys(config.detectors).filter(d => !config.detectors[d].enabled).join(', ')}`);
  }
  
  return config;
}

/**
 * Validate system capabilities and warn about potential issues
 */
function validateSystemCapabilities() {
  const warnings = [];
  const recommendations = [];
  
  // Check for missing dependencies
  if (!systemCapabilities.hasPhp && isDevelopment) {
    warnings.push('PHP not available - PHP process detection will be disabled');
    recommendations.push('Install PHP for complete multi-tech stack detection');
  }
  
  if (!systemCapabilities.hasPython && isDevelopment) {
    warnings.push('Python not available - Python process detection will be disabled');
    recommendations.push('Install Python for complete multi-tech stack detection');
  }
  
  if (!systemCapabilities.hasNetstat && isDevelopment) {
    warnings.push('netstat not available - Network-based detection methods will be limited');
    recommendations.push('Install net-tools package for enhanced process detection');
  }
  
  if (!systemCapabilities.hasDocker && isDevelopment) {
    warnings.push('Docker not available - Container process detection will be disabled');
    recommendations.push('Install Docker for container process detection');
  }
  
  // Check system resources
  if (systemCapabilities.cpuCount < 2) {
    warnings.push(`Limited CPU cores (${systemCapabilities.cpuCount}) - Performance may be impacted`);
    recommendations.push('Consider using a system with multiple CPU cores for better performance');
  }
  
  if (systemCapabilities.totalMemory < 4) {
    warnings.push(`Limited memory (${systemCapabilities.totalMemory}GB) - Memory usage will be closely monitored`);
    recommendations.push('Consider increasing available memory for optimal performance');
  }
  
  // Log findings
  if (warnings.length > 0) {
    console.warn('System capability warnings:');
    warnings.forEach(warning => console.warn(`  ⚠️ ${warning}`));
  }
  
  if (recommendations.length > 0 && isDevelopment) {
    console.log('Recommendations for optimal performance:');
    recommendations.forEach(rec => console.log(`  💡 ${rec}`));
  }
  
  return {
    warnings,
    recommendations,
    capabilities: systemCapabilities
  };
}

/**
 * Create performance configuration summary
 */
function getConfigurationSummary() {
  const config = getOptimizedConfig();
  
  return {
    environment: process.env.NODE_ENV || 'development',
    enabledDetectors: Object.keys(config.detectors).filter(d => config.detectors[d].enabled),
    disabledDetectors: Object.keys(config.detectors).filter(d => !config.detectors[d].enabled),
    timeouts: {
      discovery: config.discovery.scanTimeout,
      maxTotal: config.discovery.maxTotalScanTime,
      detectors: Object.fromEntries(
        Object.entries(config.detectors).map(([name, cfg]) => [name, cfg.timeout])
      )
    },
    performance: {
      monitoringEnabled: config.monitoring.enabled,
      cachingEnabled: config.caching.enabled,
      circuitBreakerEnabled: config.circuitBreaker.enabled,
      maxConcurrentDetectors: config.discovery.maxConcurrentDetectors
    },
    systemCapabilities
  };
}

module.exports = {
  ProductionPerformanceConfig,
  getOptimizedConfig,
  validateSystemCapabilities,
  getConfigurationSummary,
  systemCapabilities,
  isProduction,
  isDevelopment,
  isTest
};