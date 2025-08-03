#!/usr/bin/env node

/**
 * Comprehensive Test Execution Script
 * Orchestrates the complete Epic 24 testing suite with performance monitoring
 */

const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

class ComprehensiveTestRunner {
    constructor() {
        this.results = {
            startTime: Date.now(),
            testSuites: [],
            summary: {
                total: 0,
                passed: 0,
                failed: 0,
                duration: 0,
                coverage: {
                    statements: 0,
                    branches: 0,
                    functions: 0,
                    lines: 0
                }
            }
        };
        
        this.testSuites = [
            {
                name: 'Unit Tests',
                command: 'npm run test:unit',
                weight: 1,
                timeout: 30000
            },
            {
                name: 'Integration Tests',
                command: 'npm run test:integration',
                weight: 2,
                timeout: 60000
            },
            {
                name: 'Advanced Integration Tests',
                command: 'jest tests/integration/advanced-integration.test.js',
                weight: 3,
                timeout: 120000
            },
            {
                name: 'Security Tests',
                command: 'npm run test:security',
                weight: 2,
                timeout: 45000
            },
            {
                name: 'Performance Tests',
                command: 'npm run test:performance',
                weight: 3,
                timeout: 180000
            },
            {
                name: 'Load Tests',
                command: 'jest tests/load/comprehensive-load.test.js --testTimeout=300000',
                weight: 4,
                timeout: 300000
            },
            {
                name: 'Deployment Tests',
                command: 'jest tests/deployment/production-deployment.test.js',
                weight: 2,
                timeout: 120000
            },
            {
                name: 'End-to-End Tests',
                command: 'npm run test:e2e',
                weight: 3,
                timeout: 90000
            }
        ];
    }
    
    async run(options = {}) {
        console.log('🚀 Starting Comprehensive Testing Suite - Epic 24');
        console.log('=' .repeat(60));
        
        const {
            parallel = false,
            coverage = true,
            skipHeavy = false,
            verbose = false
        } = options;
        
        this.logSystemInfo();
        
        if (skipHeavy) {
            this.testSuites = this.testSuites.filter(suite => suite.weight <= 2);
            console.log('⚡ Skipping heavy tests (load, performance)');
        }
        
        try {
            if (parallel) {
                await this.runTestsParallel();
            } else {
                await this.runTestsSequential();
            }
            
            if (coverage) {
                await this.runCoverageReport();
            }
            
            this.generateReport();
            await this.saveReport();
            
        } catch (error) {
            console.error('❌ Test execution failed:', error.message);
            process.exit(1);
        }
    }
    
    logSystemInfo() {
        console.log(`💻 System Information:`);
        console.log(`   Platform: ${os.platform()} ${os.arch()}`);
        console.log(`   Node.js: ${process.version}`);
        console.log(`   CPU Cores: ${os.cpus().length}`);
        console.log(`   Total Memory: ${(os.totalmem() / 1024 / 1024 / 1024).toFixed(2)}GB`);
        console.log(`   Free Memory: ${(os.freemem() / 1024 / 1024 / 1024).toFixed(2)}GB`);
        console.log('');
    }
    
    async runTestsSequential() {
        console.log('🔄 Running tests sequentially...');
        
        for (const suite of this.testSuites) {
            console.log(`\n📋 Running: ${suite.name}`);
            console.log('─'.repeat(40));
            
            const result = await this.runTestSuite(suite);
            this.results.testSuites.push(result);
            
            console.log(`   Result: ${result.success ? '✅ PASSED' : '❌ FAILED'}`);
            console.log(`   Duration: ${result.duration}ms`);
            
            if (!result.success && result.critical) {
                console.log('🛑 Critical test failed, stopping execution');
                break;
            }
        }
    }
    
    async runTestsParallel() {
        console.log('⚡ Running tests in parallel...');
        
        // Group tests by weight for staged parallel execution
        const testGroups = this.groupTestsByWeight();
        
        for (const [weight, tests] of testGroups) {
            console.log(`\n🎯 Running test group (weight ${weight}):`);
            tests.forEach(test => console.log(`   - ${test.name}`));
            
            const promises = tests.map(suite => this.runTestSuite(suite));
            const results = await Promise.allSettled(promises);
            
            results.forEach((result, index) => {
                const suite = tests[index];
                const testResult = result.status === 'fulfilled' ? result.value : {
                    name: suite.name,
                    success: false,
                    error: result.reason.message,
                    duration: 0,
                    output: ''
                };
                
                this.results.testSuites.push(testResult);
                console.log(`   ${suite.name}: ${testResult.success ? '✅' : '❌'}`);
            });
        }
    }
    
    groupTestsByWeight() {
        const groups = new Map();
        
        this.testSuites.forEach(suite => {
            if (!groups.has(suite.weight)) {
                groups.set(suite.weight, []);
            }
            groups.get(suite.weight).push(suite);
        });
        
        // Sort by weight (lighter tests first)
        return new Map([...groups.entries()].sort((a, b) => a[0] - b[0]));
    }
    
    async runTestSuite(suite) {
        const startTime = Date.now();
        
        return new Promise((resolve) => {
            const timeout = setTimeout(() => {
                resolve({
                    name: suite.name,
                    success: false,
                    error: 'Test timeout',
                    duration: Date.now() - startTime,
                    output: 'Test execution timed out'
                });
            }, suite.timeout);
            
            const [command, ...args] = suite.command.split(' ');
            const testProcess = spawn(command, args, {
                stdio: ['pipe', 'pipe', 'pipe'],
                cwd: process.cwd()
            });
            
            let output = '';
            let errorOutput = '';
            
            testProcess.stdout.on('data', (data) => {
                output += data.toString();
            });
            
            testProcess.stderr.on('data', (data) => {
                errorOutput += data.toString();
            });
            
            testProcess.on('close', (code) => {
                clearTimeout(timeout);
                
                const duration = Date.now() - startTime;
                const success = code === 0;
                
                resolve({
                    name: suite.name,
                    success: success,
                    exitCode: code,
                    duration: duration,
                    output: output,
                    errorOutput: errorOutput,
                    error: success ? null : `Process exited with code ${code}`
                });
            });
            
            testProcess.on('error', (error) => {
                clearTimeout(timeout);
                
                resolve({
                    name: suite.name,
                    success: false,
                    error: error.message,
                    duration: Date.now() - startTime,
                    output: output,
                    errorOutput: errorOutput
                });
            });
        });
    }
    
    async runCoverageReport() {
        console.log('\n📊 Generating coverage report...');
        
        const coverageResult = await this.runTestSuite({
            name: 'Coverage Report',
            command: 'npm run test:coverage',
            timeout: 60000
        });
        
        if (coverageResult.success) {
            console.log('✅ Coverage report generated');
            this.parseCoverageData(coverageResult.output);
        } else {
            console.log('❌ Coverage report failed');
        }
    }
    
    parseCoverageData(output) {
        // Parse Jest coverage output
        const coverageRegex = /All files\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)/;
        const match = output.match(coverageRegex);
        
        if (match) {
            this.results.summary.coverage = {
                statements: parseFloat(match[1]),
                branches: parseFloat(match[2]),
                functions: parseFloat(match[3]),
                lines: parseFloat(match[4])
            };
        }
    }
    
    generateReport() {
        const endTime = Date.now();
        this.results.summary.duration = endTime - this.results.startTime;
        
        const successful = this.results.testSuites.filter(s => s.success);
        const failed = this.results.testSuites.filter(s => !s.success);
        
        this.results.summary.total = this.results.testSuites.length;
        this.results.summary.passed = successful.length;
        this.results.summary.failed = failed.length;
        
        console.log('\n' + '='.repeat(60));
        console.log('📊 COMPREHENSIVE TEST RESULTS - EPIC 24');
        console.log('='.repeat(60));
        
        console.log(`\n🎯 Overall Results:`);
        console.log(`   Total Suites: ${this.results.summary.total}`);
        console.log(`   Passed: ${this.results.summary.passed} ✅`);
        console.log(`   Failed: ${this.results.summary.failed} ❌`);
        console.log(`   Success Rate: ${((this.results.summary.passed / this.results.summary.total) * 100).toFixed(1)}%`);
        console.log(`   Total Duration: ${(this.results.summary.duration / 1000).toFixed(2)}s`);
        
        console.log(`\n📈 Coverage Summary:`);
        console.log(`   Statements: ${this.results.summary.coverage.statements.toFixed(1)}%`);
        console.log(`   Branches: ${this.results.summary.coverage.branches.toFixed(1)}%`);
        console.log(`   Functions: ${this.results.summary.coverage.functions.toFixed(1)}%`);
        console.log(`   Lines: ${this.results.summary.coverage.lines.toFixed(1)}%`);
        
        console.log(`\n📋 Suite Details:`);
        this.results.testSuites.forEach(suite => {
            const status = suite.success ? '✅' : '❌';
            const duration = (suite.duration / 1000).toFixed(2);
            console.log(`   ${status} ${suite.name}: ${duration}s`);
            
            if (!suite.success && suite.error) {
                console.log(`      Error: ${suite.error}`);
            }
        });
        
        // Epic 24 specific metrics
        console.log(`\n🚀 Epic 24 - Testing Quality Assurance Metrics:`);
        console.log(`   Advanced Integration Tests: ${this.getTestStatus('Advanced Integration Tests')}`);
        console.log(`   High-Load WebSocket Testing: ${this.getTestStatus('Load Tests')}`);
        console.log(`   Security Vulnerability Scanning: ${this.getTestStatus('Security Tests')}`);
        console.log(`   Production Deployment Testing: ${this.getTestStatus('Deployment Tests')}`);
        console.log(`   Performance Benchmarking: ${this.getTestStatus('Performance Tests')}`);
        
        const overallSuccess = this.results.summary.failed === 0;
        const coverageThreshold = 85; // Epic 24 requires >85% coverage
        const coverageMet = this.results.summary.coverage.lines >= coverageThreshold;
        
        console.log(`\n🎯 Epic 24 Completion Status:`);
        console.log(`   All Tests Passing: ${overallSuccess ? '✅' : '❌'}`);
        console.log(`   Coverage Target (≥${coverageThreshold}%): ${coverageMet ? '✅' : '❌'} (${this.results.summary.coverage.lines.toFixed(1)}%)`);
        console.log(`   Production Ready: ${overallSuccess && coverageMet ? '✅ YES' : '❌ NO'}`);
    }
    
    getTestStatus(suiteName) {
        const suite = this.results.testSuites.find(s => s.name === suiteName);
        return suite ? (suite.success ? '✅ PASSED' : '❌ FAILED') : '⏭️  SKIPPED';
    }
    
    async saveReport() {
        const reportDir = path.join(process.cwd(), 'test-reports');
        await fs.mkdir(reportDir, { recursive: true });
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const reportFile = path.join(reportDir, `comprehensive-test-report-${timestamp}.json`);
        
        await fs.writeFile(reportFile, JSON.stringify(this.results, null, 2));
        
        console.log(`\n💾 Test report saved: ${reportFile}`);
        
        // Also save a human-readable summary
        const summaryFile = path.join(reportDir, `test-summary-${timestamp}.txt`);
        const summary = this.generateTextSummary();
        await fs.writeFile(summaryFile, summary);
        
        console.log(`📄 Summary saved: ${summaryFile}`);
    }
    
    generateTextSummary() {
        const lines = [];
        lines.push('COMPREHENSIVE TEST RESULTS - EPIC 24');
        lines.push('=' .repeat(50));
        lines.push('');
        lines.push(`Date: ${new Date().toISOString()}`);
        lines.push(`Platform: ${os.platform()} ${os.arch()}`);
        lines.push(`Node.js: ${process.version}`);
        lines.push('');
        lines.push('SUMMARY:');
        lines.push(`  Total Suites: ${this.results.summary.total}`);
        lines.push(`  Passed: ${this.results.summary.passed}`);
        lines.push(`  Failed: ${this.results.summary.failed}`);
        lines.push(`  Success Rate: ${((this.results.summary.passed / this.results.summary.total) * 100).toFixed(1)}%`);
        lines.push(`  Duration: ${(this.results.summary.duration / 1000).toFixed(2)}s`);
        lines.push('');
        lines.push('COVERAGE:');
        lines.push(`  Statements: ${this.results.summary.coverage.statements.toFixed(1)}%`);
        lines.push(`  Branches: ${this.results.summary.coverage.branches.toFixed(1)}%`);
        lines.push(`  Functions: ${this.results.summary.coverage.functions.toFixed(1)}%`);
        lines.push(`  Lines: ${this.results.summary.coverage.lines.toFixed(1)}%`);
        lines.push('');
        lines.push('SUITE DETAILS:');
        this.results.testSuites.forEach(suite => {
            lines.push(`  ${suite.success ? 'PASS' : 'FAIL'} ${suite.name} (${(suite.duration / 1000).toFixed(2)}s)`);
            if (!suite.success && suite.error) {
                lines.push(`    Error: ${suite.error}`);
            }
        });
        
        return lines.join('\n');
    }
}

// CLI interface
if (require.main === module) {
    const args = process.argv.slice(2);
    const options = {};
    
    args.forEach(arg => {
        switch (arg) {
            case '--parallel':
                options.parallel = true;
                break;
            case '--no-coverage':
                options.coverage = false;
                break;
            case '--skip-heavy':
                options.skipHeavy = true;
                break;
            case '--verbose':
                options.verbose = true;
                break;
            case '--help':
                console.log(`
Usage: node run-comprehensive-tests.js [options]

Options:
  --parallel      Run tests in parallel (faster but more resource intensive)
  --no-coverage   Skip coverage report generation
  --skip-heavy    Skip heavy tests (load testing, stress testing)
  --verbose       Enable verbose output
  --help          Show this help message

Epic 24 - Testing and Quality Assurance Suite
Implements comprehensive testing infrastructure with:
- Advanced Integration Testing (8 pts)
- Performance & Load Testing (5 pts) 
- Security & Vulnerability Testing (4 pts)
- Production Deployment Testing (3 pts)

Total: 20 story points for enterprise-grade testing reliability
                `);
                process.exit(0);
        }
    });
    
    const runner = new ComprehensiveTestRunner();
    runner.run(options).catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

module.exports = ComprehensiveTestRunner;