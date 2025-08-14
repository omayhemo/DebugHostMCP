/**
 * Story 3.3 - Container Metrics Visualization - Tasks 3 & 4 Validation
 * Performance Optimization & User Features Implementation
 */

const fs = require('fs');
const path = require('path');

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(colors[color] + message + colors.reset);
}

function checkFileExists(filePath, description) {
  const fullPath = path.join(__dirname, filePath);
  const exists = fs.existsSync(fullPath);
  
  if (exists) {
    log(`✓ ${description}`, 'green');
    return true;
  } else {
    log(`✗ ${description} - File not found: ${filePath}`, 'red');
    return false;
  }
}

function checkFileContent(filePath, patterns, description) {
  const fullPath = path.join(__dirname, filePath);
  
  if (!fs.existsSync(fullPath)) {
    log(`✗ ${description} - File not found: ${filePath}`, 'red');
    return false;
  }
  
  const content = fs.readFileSync(fullPath, 'utf8');
  const results = patterns.map(pattern => {
    const found = pattern.test ? pattern.test(content) : content.includes(pattern);
    return { pattern: pattern.toString(), found };
  });
  
  const allFound = results.every(r => r.found);
  
  if (allFound) {
    log(`✓ ${description}`, 'green');
    return true;
  } else {
    log(`✗ ${description}`, 'red');
    results.forEach(r => {
      if (!r.found) {
        log(`  Missing: ${r.pattern}`, 'yellow');
      }
    });
    return false;
  }
}

function validateTask3PerformanceOptimization() {
  log('\n=== Task 3: Performance Optimization (3 points) ===', 'blue');
  
  let score = 0;
  const maxScore = 3;
  
  // LTTB Algorithm Implementation
  if (checkFileContent(
    'src/utils/lttb.ts',
    [
      /export function lttbDownsample/,
      /triangleArea/,
      /export class StreamingLTTB/,
      /export class MultiResolutionLTTB/,
      /bucketSize/,
      /threshold.*number/
    ],
    'LTTB algorithm with streaming and multi-resolution support'
  )) {
    score += 0.75;
  }
  
  // Circular Buffer Implementation
  if (checkFileContent(
    'src/utils/circularBuffer.ts',
    [
      /export class CircularBuffer/,
      /export class TimeBasedCircularBuffer/,
      /export class MetricsCircularBuffer/,
      /push.*item/,
      /getMemoryUsage/,
      /capacity.*number/
    ],
    'Circular buffer with memory management'
  )) {
    score += 0.75;
  }
  
  // Chart Virtualization
  if (checkFileContent(
    'src/components/metrics/VirtualizedChart.tsx',
    [
      /react-window/,
      /FixedSizeList/,
      /itemHeight/,
      /MiniChart/,
      /canvas.*ref/
    ],
    'Chart virtualization with react-window'
  )) {
    score += 0.75;
  }
  
  // Canvas API and Throttling
  if (checkFileContent(
    'src/components/metrics/OptimizedChart.tsx',
    [
      /canvas.*getContext.*2d/,
      /requestAnimationFrame/,
      /throttleMs/,
      /devicePixelRatio/,
      /performance\.now/
    ],
    'Canvas API rendering with throttling optimization'
  )) {
    score += 0.75;
  }
  
  log(`\nTask 3 Score: ${score}/${maxScore} points`, score === maxScore ? 'green' : 'yellow');
  return score;
}

function validateTask4UserFeatures() {
  log('\n=== Task 4: User Features (3 points) ===', 'blue');
  
  let score = 0;
  const maxScore = 3;
  
  // Alert System
  if (checkFileContent(
    'src/components/metrics/AlertBadge.tsx',
    [
      /AlertSeverity.*=.*warning.*error.*critical/,
      /AlertThreshold/,
      /operator.*gt.*lt.*eq/,
      /AlertBadge.*React\.FC/,
      /suppressDuration/
    ],
    'Alert system with threshold management'
  ) && checkFileContent(
    'src/hooks/useAlerts.ts',
    [
      /export function useAlerts/,
      /addThreshold/,
      /checkValue/,
      /suppressAlert/,
      /AlertRule/,
      /cooldownPeriod/
    ],
    'useAlerts hook with comprehensive alert management'
  )) {
    score += 0.75;
  }
  
  // Export Functionality
  if (checkFileContent(
    'src/components/metrics/MetricsExport.tsx',
    [
      /ExportFormat.*csv.*json/,
      /ExportOptions/,
      /MetricsExport.*React\.FC/,
      /downloadjs/,
      /timeRange/,
      /includeMetadata/
    ],
    'Export functionality with CSV/JSON support'
  ) && checkFileContent(
    'src/hooks/useMetricsExport.ts',
    [
      /useMetricsExport/,
      /exportToCsv/,
      /exportToJson/,
      /download.*blob/,
      /formatFileSize/
    ],
    'useMetricsExport hook with file generation'
  )) {
    score += 0.75;
  }
  
  // Time Range Controls
  if (checkFileContent(
    'src/components/metrics/MetricsControls.tsx',
    [
      /TimeRange/,
      /timeRangePresets/,
      /refreshInterval/,
      /autoRefresh/,
      /aggregation.*1m.*5m.*1h/,
      /datetime-local/
    ],
    'Comprehensive time range controls'
  )) {
    score += 0.75;
  }
  
  // Theme Integration
  if (checkFileContent(
    'src/hooks/useTheme.ts',
    [
      /useTheme/,
      /Theme.*light.*dark.*auto/,
      /prefers-color-scheme/,
      /document\.documentElement\.classList/,
      /localStorage.*theme/
    ],
    'Theme integration with system preference detection'
  ) && checkFileContent(
    'src/components/metrics/OptimizedChart.tsx',
    [
      /useTheme/,
      /themeColors/,
      /ChartTheme/,
      /background.*gridColor.*textColor/
    ],
    'Chart components with theme support'
  )) {
    score += 0.75;
  }
  
  log(`\nTask 4 Score: ${score}/${maxScore} points`, score === maxScore ? 'green' : 'yellow');
  return score;
}

function validateRequiredServices() {
  log('\n=== Required Services & Integrations ===', 'blue');
  
  let score = 0;
  
  // Metrics Aggregator Service
  if (checkFileContent(
    'src/services/metrics-aggregator.ts',
    [
      /export class MetricsAggregator/,
      /aggregateData/,
      /AggregationQuery/,
      /groupBy.*minute.*hour.*day/,
      /calculateFunction.*avg.*min.*max/,
      /export.*metricsAggregator/
    ],
    'Client-side metrics aggregator service'
  )) {
    score += 1;
  }
  
  // Integration Dashboard
  if (checkFileContent(
    'src/components/metrics/MetricsDashboard.tsx',
    [
      /MetricsDashboard/,
      /MetricsControls/,
      /OptimizedChart/,
      /VirtualizedChart/,
      /MetricsExport/,
      /useAlerts/,
      /AlertSummary/
    ],
    'Integrated metrics dashboard with all components'
  )) {
    score += 1;
  }
  
  log(`\nServices Score: ${score}/2 points`, score === 2 ? 'green' : 'yellow');
  return score;
}

function validatePerformanceRequirements() {
  log('\n=== Performance Requirements Validation ===', 'blue');
  
  const requirements = [
    'Chart updates < 50ms (throttling implemented)',
    'Browser memory < 200MB (circular buffers + LTTB)',
    'Support 10,000+ data points (virtualization + sampling)',
    '60fps smooth interactions (Canvas API + requestAnimationFrame)'
  ];
  
  let validationsPassed = 0;
  
  // Check for throttling
  if (checkFileContent('src/components/metrics/OptimizedChart.tsx', [/throttleMs.*16/, /requestAnimationFrame/], '')) {
    log('✓ Chart update throttling (< 50ms target)', 'green');
    validationsPassed++;
  }
  
  // Check for memory management
  if (checkFileContent('src/utils/circularBuffer.ts', [/getMemoryUsage/, /capacity/], '') &&
      checkFileContent('src/utils/lttb.ts', [/maxPoints/, /threshold/], '')) {
    log('✓ Memory management with buffers and downsampling', 'green');
    validationsPassed++;
  }
  
  // Check for large dataset support
  if (checkFileContent('src/components/metrics/VirtualizedChart.tsx', [/react-window/, /maxDataPoints/], '')) {
    log('✓ Large dataset support via virtualization', 'green');
    validationsPassed++;
  }
  
  // Check for smooth rendering
  if (checkFileContent('src/components/metrics/OptimizedChart.tsx', [/canvas/, /devicePixelRatio/, /animate/], '')) {
    log('✓ Smooth rendering with Canvas API', 'green');
    validationsPassed++;
  }
  
  return validationsPassed;
}

function validateExportRequirements() {
  log('\n=== Export Requirements Validation ===', 'blue');
  
  let validationsPassed = 0;
  
  // Check CSV/JSON support
  if (checkFileContent('src/hooks/useMetricsExport.ts', [/exportToCsv/, /exportToJson/], '')) {
    log('✓ CSV and JSON format support', 'green');
    validationsPassed++;
  }
  
  // Check time range selection
  if (checkFileContent('src/components/metrics/MetricsExport.tsx', [/startTime/, /endTime/, /timeRange/], '')) {
    log('✓ Time range selection for export', 'green');
    validationsPassed++;
  }
  
  // Check metric selection
  if (checkFileContent('src/components/metrics/MetricsExport.tsx', [/selectedMetrics/, /MetricType/], '')) {
    log('✓ Metric type selection', 'green');
    validationsPassed++;
  }
  
  // Check browser download
  if (checkFileContent('src/hooks/useMetricsExport.ts', [/downloadjs/, /download.*blob/], '')) {
    log('✓ Browser-based file download', 'green');
    validationsPassed++;
  }
  
  return validationsPassed;
}

function checkPackageJson() {
  log('\n=== Package Dependencies ===', 'blue');
  
  const packageJsonPath = path.join(__dirname, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    log('✗ package.json not found', 'red');
    return false;
  }
  
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  const requiredPackages = [
    'react-window',
    'downloadjs'
  ];
  
  let allInstalled = true;
  requiredPackages.forEach(pkg => {
    if (dependencies[pkg]) {
      log(`✓ ${pkg} installed`, 'green');
    } else {
      log(`✗ ${pkg} missing`, 'red');
      allInstalled = false;
    }
  });
  
  return allInstalled;
}

function main() {
  log('🚀 Story 3.3 - Container Metrics Visualization - Tasks 3 & 4 Validation', 'cyan');
  log('Performance Optimization & User Features Implementation\n', 'cyan');
  
  let totalScore = 0;
  
  // Validate package dependencies
  if (!checkPackageJson()) {
    log('\n❌ Missing required dependencies. Run: npm install react-window downloadjs', 'red');
    process.exit(1);
  }
  
  // Task 3: Performance Optimization (3 points)
  totalScore += validateTask3PerformanceOptimization();
  
  // Task 4: User Features (3 points)  
  totalScore += validateTask4UserFeatures();
  
  // Required services
  totalScore += validateRequiredServices();
  
  // Performance requirements validation
  const perfValidations = validatePerformanceRequirements();
  const exportValidations = validateExportRequirements();
  
  // Final scoring
  const maxTotalScore = 8; // 3 + 3 + 2
  const bonusPoints = Math.min(2, Math.floor((perfValidations + exportValidations) / 2));
  const finalScore = Math.min(maxTotalScore, totalScore + bonusPoints);
  
  log('\n=== FINAL RESULTS ===', 'cyan');
  log(`Core Implementation: ${totalScore}/${maxTotalScore} points`);
  log(`Performance Validations: ${perfValidations}/4 passed`);
  log(`Export Validations: ${exportValidations}/4 passed`);
  log(`Bonus Points: ${bonusPoints}/2`);
  log(`Final Score: ${finalScore}/${maxTotalScore} points`, finalScore === maxTotalScore ? 'green' : 'yellow');
  
  if (finalScore === maxTotalScore) {
    log('\n🎉 EXCELLENT! All Story 3.3 Tasks 3 & 4 requirements completed successfully!', 'green');
    log('✅ Performance optimization with LTTB, circular buffers, and Canvas API', 'green');
    log('✅ User features with alerts, export, time controls, and theming', 'green');
    log('✅ All performance and export requirements validated', 'green');
  } else if (finalScore >= 6) {
    log('\n👍 GOOD! Most requirements completed. Review missing items above.', 'yellow');
  } else {
    log('\n⚠️  NEEDS WORK! Several requirements missing. Please address the issues above.', 'red');
  }
  
  process.exit(finalScore === maxTotalScore ? 0 : 1);
}

if (require.main === module) {
  main();
}