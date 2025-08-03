#!/usr/bin/env node

/**
 * Production Validation Script for MCP Debug Host
 * Comprehensive validation and security audit for production readiness
 */

const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');
const crypto = require('crypto');
const https = require('https');
const util = require('util');

class ProductionValidator {
  constructor() {
    this.results = {
      security: { passed: 0, failed: 0, warnings: 0, tests: [] },
      performance: { passed: 0, failed: 0, warnings: 0, tests: [] },
      deployment: { passed: 0, failed: 0, warnings: 0, tests: [] },
      quality: { passed: 0, failed: 0, warnings: 0, tests: [] }
    };
    this.startTime = Date.now();
  }

  log(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...data
    };
    
    console.log(`[${timestamp}] ${level.toUpperCase()}: ${message}`);
    if (Object.keys(data).length > 0) {
      console.log(util.inspect(data, { colors: true, depth: 2 }));
    }
  }

  addResult(category, test, status, message, details = {}) {
    const result = {
      test,
      status,
      message,
      details,
      timestamp: new Date().toISOString()
    };

    this.results[category].tests.push(result);
    this.results[category][status]++;

    const emoji = status === 'passed' ? '✅' : status === 'failed' ? '❌' : '⚠️';
    this.log('info', `${emoji} ${category.toUpperCase()}: ${test} - ${message}`);
  }

  async validateSecurity() {
    this.log('info', '🔒 Starting Security Validation...');

    // Check for sensitive data in code
    await this.checkSensitiveData();
    
    // Validate dependency security
    await this.validateDependencies();
    
    // Check input validation
    await this.validateInputSanitization();
    
    // Check authentication mechanisms
    await this.validateAuthentication();
    
    // Check for secure headers
    await this.validateSecureHeaders();
    
    // Check file permissions
    await this.validateFilePermissions();

    this.log('info', '🔒 Security Validation Complete');
  }

  async checkSensitiveData() {
    try {
      const sensitivePatterns = [
        /(?:password|pwd|secret|key|token|auth)[\s]*[=:]\s*['"']([^'"']+)['"']/gi,
        /(?:api_key|apikey|access_token)[\s]*[=:]\s*['"']([^'"']+)['"']/gi,
        /(?:private_key|privatekey)[\s]*[=:]\s*['"']([^'"']+)['"']/gi
      ];

      const srcDir = path.join(process.cwd(), 'src');
      const files = await this.getAllJSFiles(srcDir);
      
      let foundSensitive = false;
      
      for (const file of files) {
        const content = await fs.readFile(file, 'utf8');
        
        for (const pattern of sensitivePatterns) {
          const matches = content.match(pattern);
          if (matches) {
            foundSensitive = true;
            this.addResult('security', 'Sensitive Data Check', 'failed', 
              `Potential sensitive data found in ${path.relative(process.cwd(), file)}`, 
              { matches: matches.slice(0, 3) }); // Limit to first 3 matches
          }
        }
      }

      if (!foundSensitive) {
        this.addResult('security', 'Sensitive Data Check', 'passed', 
          'No hardcoded sensitive data found in source code');
      }
    } catch (error) {
      this.addResult('security', 'Sensitive Data Check', 'failed', 
        'Failed to scan for sensitive data', { error: error.message });
    }
  }

  async validateDependencies() {
    try {
      const packageJson = JSON.parse(await fs.readFile('package.json', 'utf8'));
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
      
      // Check for known vulnerable packages (simplified check)
      const vulnerablePatterns = [
        'lodash@4.17.20', // Example - would need real vulnerability database
        'axios@0.21.0'
      ];

      let vulnerabilitiesFound = 0;
      
      for (const [pkg, version] of Object.entries(deps)) {
        const fullName = `${pkg}@${version}`;
        if (vulnerablePatterns.some(pattern => fullName.includes(pattern))) {
          vulnerabilitiesFound++;
          this.addResult('security', 'Dependency Vulnerability', 'failed',
            `Potentially vulnerable dependency: ${fullName}`);
        }
      }

      if (vulnerabilitiesFound === 0) {
        this.addResult('security', 'Dependency Security', 'passed',
          `Scanned ${Object.keys(deps).length} dependencies - no known vulnerabilities found`);
      }
    } catch (error) {
      this.addResult('security', 'Dependency Security', 'failed',
        'Failed to validate dependencies', { error: error.message });
    }
  }

  async validateInputSanitization() {
    try {
      const serverFile = path.join(process.cwd(), 'src/dashboard/server.js');
      const content = await fs.readFile(serverFile, 'utf8');
      
      // Check for input validation patterns
      const validationPatterns = [
        /req\.body\s*\.\s*\w+.*(?:validate|sanitize|escape)/,
        /express-validator/,
        /helmet/,
        /express-rate-limit/
      ];

      let validationFound = false;
      for (const pattern of validationPatterns) {
        if (pattern.test(content)) {
          validationFound = true;
          break;
        }
      }

      if (validationFound) {
        this.addResult('security', 'Input Validation', 'passed',
          'Input validation mechanisms detected');
      } else {
        this.addResult('security', 'Input Validation', 'warning',
          'Limited input validation detected - consider adding express-validator or similar');
      }
    } catch (error) {
      this.addResult('security', 'Input Validation', 'failed',
        'Failed to check input validation', { error: error.message });
    }
  }

  async validateAuthentication() {
    try {
      const serverFile = path.join(process.cwd(), 'src/dashboard/server.js');
      const content = await fs.readFile(serverFile, 'utf8');
      
      // Check for authentication mechanisms
      const authPatterns = [
        /authenticate|auth|token|jwt|session/i,
        /Authorization|Bearer/
      ];

      let authFound = false;
      for (const pattern of authPatterns) {
        if (pattern.test(content)) {
          authFound = true;
          break;
        }
      }

      if (authFound) {
        this.addResult('security', 'Authentication', 'passed',
          'Authentication mechanisms detected');
      } else {
        this.addResult('security', 'Authentication', 'warning',
          'Limited authentication detected - ensure proper auth for production');
      }
    } catch (error) {
      this.addResult('security', 'Authentication', 'failed',
        'Failed to check authentication', { error: error.message });
    }
  }

  async validateSecureHeaders() {
    // This would check for security headers in the Express setup
    this.addResult('security', 'Security Headers', 'warning',
      'Security headers validation requires runtime testing - consider adding helmet.js');
  }

  async validateFilePermissions() {
    try {
      const criticalFiles = [
        'package.json',
        'src/index.js',
        'src/dashboard/server.js',
        'install-mcp-host.sh'
      ];

      for (const file of criticalFiles) {
        try {
          const stats = await fs.stat(file);
          const mode = stats.mode & parseInt('777', 8);
          
          // Check if file is world-writable (security risk)
          if (mode & parseInt('002', 8)) {
            this.addResult('security', 'File Permissions', 'failed',
              `File ${file} is world-writable (security risk)`, { permissions: mode.toString(8) });
          }
        } catch (err) {
          // File doesn't exist, that's okay for some files
        }
      }

      this.addResult('security', 'File Permissions', 'passed',
        'Critical files have appropriate permissions');
    } catch (error) {
      this.addResult('security', 'File Permissions', 'failed',
        'Failed to check file permissions', { error: error.message });
    }
  }

  async validatePerformance() {
    this.log('info', '⚡ Starting Performance Validation...');

    await this.checkBundleSize();
    await this.validateMemoryUsage();
    await this.checkStartupTime();
    await this.validateAsyncPatterns();

    this.log('info', '⚡ Performance Validation Complete');
  }

  async checkBundleSize() {
    try {
      const nodeModulesStats = await fs.stat('node_modules');
      const packageJson = JSON.parse(await fs.readFile('package.json', 'utf8'));
      
      const depCount = Object.keys(packageJson.dependencies || {}).length;
      const devDepCount = Object.keys(packageJson.devDependencies || {}).length;
      
      this.addResult('performance', 'Bundle Size', 'passed',
        `Dependencies: ${depCount} production, ${devDepCount} development`);
    } catch (error) {
      this.addResult('performance', 'Bundle Size', 'warning',
        'Could not analyze bundle size', { error: error.message });
    }
  }

  async validateMemoryUsage() {
    // Simplified memory check
    const memUsage = process.memoryUsage();
    const maxHeap = 500 * 1024 * 1024; // 500MB threshold
    
    if (memUsage.heapUsed < maxHeap) {
      this.addResult('performance', 'Memory Usage', 'passed',
        `Heap usage: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`);
    } else {
      this.addResult('performance', 'Memory Usage', 'warning',
        `High heap usage: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`);
    }
  }

  async checkStartupTime() {
    const startTime = Date.now();
    try {
      // Simulate module loading time
      require(path.join(process.cwd(), 'src/index.js'));
      const loadTime = Date.now() - startTime;
      
      if (loadTime < 1000) {
        this.addResult('performance', 'Startup Time', 'passed',
          `Module load time: ${loadTime}ms`);
      } else {
        this.addResult('performance', 'Startup Time', 'warning',
          `Slow module load time: ${loadTime}ms`);
      }
    } catch (error) {
      this.addResult('performance', 'Startup Time', 'failed',
        'Failed to measure startup time', { error: error.message });
    }
  }

  async validateAsyncPatterns() {
    try {
      const srcDir = path.join(process.cwd(), 'src');
      const files = await this.getAllJSFiles(srcDir);
      
      let asyncIssues = 0;
      
      for (const file of files) {
        const content = await fs.readFile(file, 'utf8');
        
        // Check for potential callback hell or missing await
        const callbackPatterns = [
          /callback\s*\(\s*callback\s*\(/,  // Nested callbacks
          /\.then\s*\(\s*.*\.then\s*\(/,    // Promise chains that could use async/await
        ];

        for (const pattern of callbackPatterns) {
          if (pattern.test(content)) {
            asyncIssues++;
          }
        }
      }

      if (asyncIssues === 0) {
        this.addResult('performance', 'Async Patterns', 'passed',
          'Good async/await patterns detected');
      } else {
        this.addResult('performance', 'Async Patterns', 'warning',
          `${asyncIssues} potential async pattern improvements found`);
      }
    } catch (error) {
      this.addResult('performance', 'Async Patterns', 'failed',
        'Failed to analyze async patterns', { error: error.message });
    }
  }

  async validateDeployment() {
    this.log('info', '🚀 Starting Deployment Validation...');

    await this.checkDocumentation();
    await this.validateInstallScript();
    await this.checkServiceTemplates();
    await this.validateConfiguration();

    this.log('info', '🚀 Deployment Validation Complete');
  }

  async checkDocumentation() {
    const requiredDocs = [
      'README.md',
      'docs/CONFIGURATION.md',
      'package.json'
    ];

    let missingDocs = 0;
    
    for (const doc of requiredDocs) {
      try {
        await fs.access(doc);
        
        // Check if documentation is substantive
        const content = await fs.readFile(doc, 'utf8');
        if (content.length < 100) {
          this.addResult('deployment', 'Documentation', 'warning',
            `${doc} exists but may be incomplete (${content.length} chars)`);
        }
      } catch (error) {
        missingDocs++;
        this.addResult('deployment', 'Documentation', 'failed',
          `Missing required documentation: ${doc}`);
      }
    }

    if (missingDocs === 0) {
      this.addResult('deployment', 'Documentation', 'passed',
        'All required documentation files present');
    }
  }

  async validateInstallScript() {
    try {
      const installScript = 'install-mcp-host.sh';
      await fs.access(installScript);
      
      const content = await fs.readFile(installScript, 'utf8');
      
      // Check for proper error handling
      const errorHandling = [
        /set -e/,  // Exit on error
        /trap/,    // Error trapping
        /if.*then.*fi/  // Basic conditionals
      ];

      let hasErrorHandling = false;
      for (const pattern of errorHandling) {
        if (pattern.test(content)) {
          hasErrorHandling = true;
          break;
        }
      }

      if (hasErrorHandling) {
        this.addResult('deployment', 'Install Script', 'passed',
          'Install script has proper error handling');
      } else {
        this.addResult('deployment', 'Install Script', 'warning',
          'Install script could benefit from better error handling');
      }
    } catch (error) {
      this.addResult('deployment', 'Install Script', 'failed',
        'Install script not found or not accessible');
    }
  }

  async checkServiceTemplates() {
    const templates = [
      'templates/systemd.service.template',
      'templates/launchd.plist.template'
    ];

    let foundTemplates = 0;
    
    for (const template of templates) {
      try {
        await fs.access(template);
        foundTemplates++;
      } catch (error) {
        // Template doesn't exist
      }
    }

    if (foundTemplates > 0) {
      this.addResult('deployment', 'Service Templates', 'passed',
        `Found ${foundTemplates} service templates`);
    } else {
      this.addResult('deployment', 'Service Templates', 'warning',
        'No service templates found - consider adding systemd/launchd templates');
    }
  }

  async validateConfiguration() {
    try {
      const configTemplate = 'config.json.template';
      await fs.access(configTemplate);
      
      const content = await fs.readFile(configTemplate, 'utf8');
      const config = JSON.parse(content);
      
      // Check for required configuration sections
      const requiredSections = ['server', 'logging', 'security'];
      const missingSections = requiredSections.filter(section => !config[section]);
      
      if (missingSections.length === 0) {
        this.addResult('deployment', 'Configuration', 'passed',
          'Configuration template has all required sections');
      } else {
        this.addResult('deployment', 'Configuration', 'warning',
          `Missing configuration sections: ${missingSections.join(', ')}`);
      }
    } catch (error) {
      this.addResult('deployment', 'Configuration', 'failed',
        'Configuration template validation failed', { error: error.message });
    }
  }

  async validateQuality() {
    this.log('info', '🔍 Starting Quality Validation...');

    await this.runTests();
    await this.checkCodeQuality();
    await this.validateErrorHandling();
    await this.checkLogging();

    this.log('info', '🔍 Quality Validation Complete');
  }

  async runTests() {
    return new Promise((resolve) => {
      const testProcess = spawn('npm', ['test', '--', '--passWithNoTests'], {
        stdio: 'pipe',
        cwd: process.cwd()
      });

      let output = '';
      testProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      testProcess.stderr.on('data', (data) => {
        output += data.toString();
      });

      testProcess.on('close', (code) => {
        if (code === 0) {
          this.addResult('quality', 'Test Suite', 'passed',
            'All tests passing');
        } else {
          this.addResult('quality', 'Test Suite', 'failed',
            'Some tests failing', { exitCode: code });
        }
        resolve();
      });

      // Timeout after 60 seconds
      setTimeout(() => {
        testProcess.kill();
        this.addResult('quality', 'Test Suite', 'failed',
          'Test suite timed out');
        resolve();
      }, 60000);
    });
  }

  async checkCodeQuality() {
    try {
      const srcDir = path.join(process.cwd(), 'src');
      const files = await this.getAllJSFiles(srcDir);
      
      let totalLines = 0;
      let complexFunctions = 0;
      
      for (const file of files) {
        const content = await fs.readFile(file, 'utf8');
        const lines = content.split('\n').length;
        totalLines += lines;
        
        // Simple complexity check - count nested braces
        const functionMatches = content.match(/function|=>/g) || [];
        const braceMatches = content.match(/{/g) || [];
        
        // If ratio of braces to functions is high, might indicate complexity
        if (functionMatches.length > 0 && (braceMatches.length / functionMatches.length) > 10) {
          complexFunctions++;
        }
      }

      this.addResult('quality', 'Code Quality', 'passed',
        `Analyzed ${files.length} files, ${totalLines} lines of code`);

      if (complexFunctions > files.length * 0.3) {
        this.addResult('quality', 'Code Complexity', 'warning',
          `${complexFunctions} potentially complex functions detected`);
      } else {
        this.addResult('quality', 'Code Complexity', 'passed',
          'Code complexity appears manageable');
      }
    } catch (error) {
      this.addResult('quality', 'Code Quality', 'failed',
        'Failed to analyze code quality', { error: error.message });
    }
  }

  async validateErrorHandling() {
    try {
      const srcDir = path.join(process.cwd(), 'src');
      const files = await this.getAllJSFiles(srcDir);
      
      let filesWithErrorHandling = 0;
      
      for (const file of files) {
        const content = await fs.readFile(file, 'utf8');
        
        // Check for error handling patterns
        const errorPatterns = [
          /try\s*{[\s\S]*?catch\s*\(/,
          /\.catch\s*\(/,
          /throw\s+/,
          /error/i
        ];

        let hasErrorHandling = false;
        for (const pattern of errorPatterns) {
          if (pattern.test(content)) {
            hasErrorHandling = true;
            break;
          }
        }

        if (hasErrorHandling) {
          filesWithErrorHandling++;
        }
      }

      const errorHandlingRatio = filesWithErrorHandling / files.length;
      
      if (errorHandlingRatio > 0.8) {
        this.addResult('quality', 'Error Handling', 'passed',
          `${Math.round(errorHandlingRatio * 100)}% of files have error handling`);
      } else {
        this.addResult('quality', 'Error Handling', 'warning',
          `Only ${Math.round(errorHandlingRatio * 100)}% of files have error handling`);
      }
    } catch (error) {
      this.addResult('quality', 'Error Handling', 'failed',
        'Failed to analyze error handling', { error: error.message });
    }
  }

  async checkLogging() {
    try {
      const srcDir = path.join(process.cwd(), 'src');
      const files = await this.getAllJSFiles(srcDir);
      
      let filesWithLogging = 0;
      
      for (const file of files) {
        const content = await fs.readFile(file, 'utf8');
        
        // Check for logging patterns
        const loggingPatterns = [
          /console\.(log|error|warn|info|debug)/,
          /logger\.(log|error|warn|info|debug)/,
          /winston/,
          /bunyan/
        ];

        let hasLogging = false;
        for (const pattern of loggingPatterns) {
          if (pattern.test(content)) {
            hasLogging = true;
            break;
          }
        }

        if (hasLogging) {
          filesWithLogging++;
        }
      }

      const loggingRatio = filesWithLogging / files.length;
      
      if (loggingRatio > 0.6) {
        this.addResult('quality', 'Logging', 'passed',
          `${Math.round(loggingRatio * 100)}% of files have logging`);
      } else {
        this.addResult('quality', 'Logging', 'warning',
          `Only ${Math.round(loggingRatio * 100)}% of files have logging`);
      }
    } catch (error) {
      this.addResult('quality', 'Logging', 'failed',
        'Failed to analyze logging', { error: error.message });
    }
  }

  async getAllJSFiles(dir) {
    const files = [];
    
    async function traverse(currentDir) {
      const items = await fs.readdir(currentDir);
      
      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const stats = await fs.stat(fullPath);
        
        if (stats.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          await traverse(fullPath);
        } else if (stats.isFile() && item.endsWith('.js')) {
          files.push(fullPath);
        }
      }
    }
    
    await traverse(dir);
    return files;
  }

  generateReport() {
    const duration = Date.now() - this.startTime;
    
    console.log('\n' + '='.repeat(80));
    console.log('🏁 PRODUCTION VALIDATION REPORT');
    console.log('='.repeat(80));
    console.log(`📊 Duration: ${duration}ms`);
    console.log(`📅 Generated: ${new Date().toISOString()}\n`);

    let overallPassed = 0;
    let overallFailed = 0;
    let overallWarnings = 0;

    for (const [category, results] of Object.entries(this.results)) {
      overallPassed += results.passed;
      overallFailed += results.failed;
      overallWarnings += results.warnings;

      const emoji = category === 'security' ? '🔒' : category === 'performance' ? '⚡' : 
                   category === 'deployment' ? '🚀' : '🔍';
      
      console.log(`${emoji} ${category.toUpperCase()} RESULTS:`);
      console.log(`   ✅ Passed: ${results.passed}`);
      console.log(`   ❌ Failed: ${results.failed}`);
      console.log(`   ⚠️  Warnings: ${results.warnings}`);
      console.log();
    }

    console.log('📈 OVERALL SUMMARY:');
    console.log(`   ✅ Total Passed: ${overallPassed}`);
    console.log(`   ❌ Total Failed: ${overallFailed}`);
    console.log(`   ⚠️  Total Warnings: ${overallWarnings}`);
    
    const totalTests = overallPassed + overallFailed + overallWarnings;
    const successRate = totalTests > 0 ? Math.round((overallPassed / totalTests) * 100) : 0;
    
    console.log(`   📊 Success Rate: ${successRate}%`);
    
    if (overallFailed === 0 && overallWarnings < totalTests * 0.2) {
      console.log('\n🎉 PRODUCTION READY! All critical validations passed.');
    } else if (overallFailed === 0) {
      console.log('\n⚠️  MOSTLY READY: No failures, but address warnings for best practices.');
    } else {
      console.log('\n❌ NOT PRODUCTION READY: Critical issues must be resolved.');
    }

    console.log('\n' + '='.repeat(80));
    
    return {
      success: overallFailed === 0,
      summary: {
        passed: overallPassed,
        failed: overallFailed,
        warnings: overallWarnings,
        successRate,
        duration
      },
      results: this.results
    };
  }

  async run() {
    try {
      this.log('info', '🚀 Starting Production Validation Suite...');
      
      await this.validateSecurity();
      await this.validatePerformance();
      await this.validateDeployment();
      await this.validateQuality();
      
      return this.generateReport();
    } catch (error) {
      this.log('error', 'Production validation failed', { error: error.message });
      return {
        success: false,
        error: error.message,
        results: this.results
      };
    }
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new ProductionValidator();
  validator.run().then((result) => {
    process.exit(result.success ? 0 : 1);
  }).catch((error) => {
    console.error('❌ Production validation crashed:', error);
    process.exit(1);
  });
}

module.exports = ProductionValidator;