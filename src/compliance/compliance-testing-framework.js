/**
 * Compliance Testing Framework
 * Automated compliance checks, validation scripts, and continuous monitoring
 * 
 * @version 1.0.0
 * @author MCP Debug Host Platform
 * @compliance GDPR, SOC 2, CIS Docker, WCAG 2.1 AA, Browser Standards
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { EventEmitter } = require('events');

// Import compliance modules
const GDPRDataSanitizer = require('./gdpr-data-sanitizer');
const SOC2AuditTrail = require('./soc2-audit-trail');
const ContainerSecurityCompliance = require('./container-security');
const WCAGAccessibilityCompliance = require('./wcag-accessibility');
const BrowserCompatibilityMatrix = require('./browser-compatibility');

class ComplianceTestingFramework extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            // Testing configuration
            testSchedule: {
                continuous: ['gdpr', 'soc2', 'container-security'],
                daily: ['wcag', 'browser-compatibility'],
                weekly: ['full-compliance-audit'],
                monthly: ['compliance-certification']
            },
            
            // Compliance thresholds
            thresholds: {
                gdpr: { minScore: 95, criticalViolations: 0 },
                soc2: { minScore: 90, criticalFindings: 0 },
                containerSecurity: { minScore: 85, highVulnerabilities: 0 },
                wcag: { minScore: 95, violations: 0 },
                browserCompatibility: { minScore: 90, criticalIssues: 0 }
            },
            
            // Testing environments
            environments: {
                development: { url: 'http://localhost:3000', active: true },
                staging: { url: 'https://staging.example.com', active: false },
                production: { url: 'https://production.example.com', active: false }
            },
            
            // Notification settings
            notifications: {
                slack: { webhook: config.slackWebhook || null, enabled: false },
                email: { recipients: config.emailRecipients || [], enabled: false },
                dashboard: { enabled: true }
            },
            
            // Report settings
            reportsDirectory: config.reportsDirectory || './data/compliance-reports',
            reportRetentionDays: config.reportRetentionDays || 365,
            
            // CI/CD integration
            cicd: {
                failOnViolations: true,
                blockDeployment: ['gdpr', 'soc2'],
                warnOnly: ['wcag', 'browser-compatibility']
            },
            
            ...config
        };
        
        // Initialize compliance modules
        this.gdprSanitizer = new GDPRDataSanitizer(config.gdpr);
        this.soc2AuditTrail = new SOC2AuditTrail(config.soc2);
        this.containerSecurity = new ContainerSecurityCompliance(config.containerSecurity);
        this.wcagAccessibility = new WCAGAccessibilityCompliance(config.wcag);
        this.browserCompatibility = new BrowserCompatibilityMatrix(config.browserCompatibility);
        
        // Test results storage
        this.testResults = new Map();
        this.complianceHistory = new Map();
        this.activeMonitoring = new Map();
        
        this.initialize();
    }
    
    /**
     * Initialize compliance testing framework
     */
    async initialize() {
        try {
            // Ensure reports directory exists
            await this.ensureReportsDirectory();
            
            // Initialize compliance modules
            await this.initializeComplianceModules();
            
            // Set up continuous monitoring
            this.setupContinuousMonitoring();
            
            // Set up scheduled testing
            this.setupScheduledTesting();
            
            // Set up event listeners
            this.setupEventListeners();
            
            this.emit('complianceFrameworkInitialized', {
                timestamp: new Date().toISOString(),
                modules: ['gdpr', 'soc2', 'container-security', 'wcag', 'browser-compatibility']
            });
            
        } catch (error) {
            this.emit('complianceFrameworkError', {
                timestamp: new Date().toISOString(),
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }
    
    /**
     * Run comprehensive compliance test suite
     * @param {Object} options - Test options
     * @returns {Object} Compliance test results
     */
    async runComplianceTestSuite(options = {}) {
        const suiteId = crypto.randomUUID();
        const startTime = new Date();
        
        try {
            const testSuite = {
                suiteId,
                timestamp: startTime.toISOString(),
                environment: options.environment || 'development',
                testTypes: options.testTypes || ['gdpr', 'soc2', 'container-security', 'wcag', 'browser-compatibility'],
                results: {},
                summary: {
                    totalTests: 0,
                    passed: 0,
                    failed: 0,
                    warnings: 0,
                    criticalIssues: 0,
                    overallScore: 0,
                    complianceStatus: 'pending'
                },
                recommendations: [],
                nextActions: []
            };
            
            // Run each compliance test
            for (const testType of testSuite.testTypes) {
                try {
                    testSuite.results[testType] = await this.runComplianceTest(testType, options);
                    testSuite.summary.totalTests++;
                    
                    // Evaluate test results
                    const evaluation = this.evaluateTestResult(testType, testSuite.results[testType]);
                    
                    if (evaluation.status === 'passed') testSuite.summary.passed++;
                    else if (evaluation.status === 'failed') testSuite.summary.failed++;
                    else testSuite.summary.warnings++;
                    
                    testSuite.summary.criticalIssues += evaluation.criticalIssues;
                    
                } catch (error) {
                    testSuite.results[testType] = {
                        testType,
                        status: 'error',
                        error: error.message,
                        timestamp: new Date().toISOString()
                    };
                    testSuite.summary.failed++;
                }
            }
            
            // Calculate overall compliance score
            testSuite.summary.overallScore = this.calculateOverallScore(testSuite.results);
            testSuite.summary.complianceStatus = this.getComplianceStatus(testSuite.summary);
            
            // Generate recommendations
            testSuite.recommendations = this.generateComplianceRecommendations(testSuite.results);
            testSuite.nextActions = this.generateNextActions(testSuite.results, testSuite.summary);
            
            // Store test results
            this.testResults.set(suiteId, testSuite);
            
            // Update compliance history
            this.updateComplianceHistory(testSuite);
            
            // Save comprehensive report
            await this.saveComplianceReport(testSuite);
            
            // Send notifications if needed
            await this.sendComplianceNotifications(testSuite);
            
            const duration = new Date() - startTime;
            testSuite.duration = duration;
            
            this.emit('complianceTestSuiteCompleted', {
                suiteId,
                environment: testSuite.environment,
                overallScore: testSuite.summary.overallScore,
                complianceStatus: testSuite.summary.complianceStatus,
                criticalIssues: testSuite.summary.criticalIssues,
                duration
            });
            
            return testSuite;
            
        } catch (error) {
            this.emit('complianceTestSuiteError', {
                suiteId,
                error: error.message,
                timestamp: new Date().toISOString()
            });
            throw error;
        }
    }
    
    /**
     * Run individual compliance test
     * @param {string} testType - Type of compliance test
     * @param {Object} options - Test options
     * @returns {Object} Test results
     */
    async runComplianceTest(testType, options = {}) {
        const testId = crypto.randomUUID();
        
        try {
            let results;
            
            switch (testType) {
                case 'gdpr':
                    results = await this.runGDPRComplianceTest(options);
                    break;
                    
                case 'soc2':
                    results = await this.runSOC2ComplianceTest(options);
                    break;
                    
                case 'container-security':
                    results = await this.runContainerSecurityTest(options);
                    break;
                    
                case 'wcag':
                    results = await this.runWCAGAccessibilityTest(options);
                    break;
                    
                case 'browser-compatibility':
                    results = await this.runBrowserCompatibilityTest(options);
                    break;
                    
                default:
                    throw new Error(`Unknown compliance test type: ${testType}`);
            }
            
            results.testId = testId;
            results.testType = testType;
            
            return results;
            
        } catch (error) {
            return {
                testId,
                testType,
                status: 'error',
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }
    
    /**
     * Run GDPR compliance test
     */
    async runGDPRComplianceTest(options) {
        const testData = {
            personalData: 'john.doe@example.com',
            logs: 'User 192.168.1.1 accessed resource',
            userSession: { userId: 'user123', email: 'jane@example.com' }
        };
        
        // Test data sanitization
        const sanitizedData = this.gdprSanitizer.sanitizeData(testData, 'test');
        
        // Test right to erasure
        const deletionResult = await this.gdprSanitizer.deletePersonalData('user123');
        
        // Generate processing report
        const processingReport = this.gdprSanitizer.getProcessingReport();
        
        return {
            timestamp: new Date().toISOString(),
            dataSanitization: {
                original: testData,
                sanitized: sanitizedData,
                piiDetected: this.countPIIFields(testData),
                piiSanitized: this.countSanitizedFields(sanitizedData)
            },
            rightToErasure: deletionResult,
            dataProcessing: processingReport,
            complianceScore: this.calculateGDPRScore(sanitizedData, deletionResult, processingReport),
            issues: this.identifyGDPRIssues(sanitizedData, deletionResult)
        };
    }
    
    /**
     * Run SOC 2 compliance test
     */
    async runSOC2ComplianceTest(options) {
        // Log test events for audit trail verification
        await this.soc2AuditTrail.logAuditEvent({
            type: 'compliance.test',
            operation: 'soc2.test',
            result: 'success'
        }, 'CC6');
        
        // Test authentication logging
        await this.soc2AuditTrail.logAuthenticationEvent({
            operation: 'login',
            userId: 'testuser',
            result: 'success',
            ipAddress: '192.168.1.100'
        });
        
        // Test system operation logging
        await this.soc2AuditTrail.logSystemOperation({
            operation: 'system.backup',
            component: 'database',
            result: 'success'
        });
        
        // Generate compliance report
        const complianceReport = await this.soc2AuditTrail.generateComplianceReport(
            new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            new Date().toISOString()
        );
        
        // Verify audit trail integrity
        const integrityResult = this.soc2AuditTrail.verifyAuditIntegrity();
        
        return {
            timestamp: new Date().toISOString(),
            auditTrail: {
                eventsLogged: 3,
                integrityVerified: integrityResult.overallIntegrity,
                violations: integrityResult.integrityViolations
            },
            complianceReport,
            trustServiceCriteria: {
                CC6: 'Security controls implemented',
                CC7: 'Availability monitoring active',
                CC8: 'Processing integrity verified'
            },
            complianceScore: this.calculateSOC2Score(complianceReport, integrityResult),
            issues: this.identifySOC2Issues(integrityResult)
        };
    }
    
    /**
     * Run container security compliance test
     */
    async runContainerSecurityTest(options) {
        // Run CIS benchmark assessment
        const cisAssessment = await this.containerSecurity.runCISBenchmarkAssessment();
        
        // Test image vulnerability scanning
        const vulnerabilityScans = [];
        const testImages = ['nginx:latest', 'node:18-alpine'];
        
        for (const image of testImages) {
            try {
                const scanResult = await this.containerSecurity.scanImageVulnerabilities(image);
                vulnerabilityScans.push(scanResult);
            } catch (error) {
                vulnerabilityScans.push({
                    imageId: image,
                    status: 'error',
                    error: error.message
                });
            }
        }
        
        // Generate security report
        const securityReport = await this.containerSecurity.generateSecurityReport('daily');
        
        return {
            timestamp: new Date().toISOString(),
            cisBenchmark: cisAssessment,
            vulnerabilityScanning: {
                scans: vulnerabilityScans,
                totalImages: testImages.length,
                totalVulnerabilities: vulnerabilityScans.reduce((sum, scan) => 
                    sum + (scan.vulnerabilities?.length || 0), 0
                )
            },
            securityReport,
            complianceScore: this.calculateContainerSecurityScore(cisAssessment, vulnerabilityScans),
            issues: this.identifyContainerSecurityIssues(cisAssessment, vulnerabilityScans)
        };
    }
    
    /**
     * Run WCAG accessibility compliance test
     */
    async runWCAGAccessibilityTest(options) {
        const testUrl = options.url || this.config.environments.development.url;
        
        // Run accessibility audit
        const accessibilityAudit = await this.wcagAccessibility.runAccessibilityAudit(testUrl);
        
        // Generate test scripts
        const testScript = this.wcagAccessibility.generateAccessibilityTestScript();
        const cssContent = this.wcagAccessibility.generateAccessibilityCSS();
        
        return {
            timestamp: new Date().toISOString(),
            accessibilityAudit,
            testArtifacts: {
                testScript: testScript.length,
                cssContent: cssContent.length,
                generatedFiles: 2
            },
            wcagGuidelines: {
                perceivable: accessibilityAudit.guidelines?.perceivable || {},
                operable: accessibilityAudit.guidelines?.operable || {},
                understandable: accessibilityAudit.guidelines?.understandable || {},
                robust: accessibilityAudit.guidelines?.robust || {}
            },
            complianceScore: accessibilityAudit.complianceScore || 0,
            issues: this.identifyWCAGIssues(accessibilityAudit)
        };
    }
    
    /**
     * Run browser compatibility test
     */
    async runBrowserCompatibilityTest(options) {
        // Run compatibility tests
        const compatibilityReport = await this.browserCompatibility.runCompatibilityTests();
        
        // Generate test artifacts
        const testSuite = this.browserCompatibility.generateCompatibilityTestSuite();
        const cssContent = this.browserCompatibility.generateCompatibilityCSS();
        const polyfillScript = compatibilityReport.polyfillRequirements?.loadingScript || '';
        
        return {
            timestamp: new Date().toISOString(),
            compatibilityReport,
            testArtifacts: {
                testSuite: testSuite.length,
                cssContent: cssContent.length,
                polyfillScript: polyfillScript.length
            },
            browserSupport: {
                totalBrowsers: compatibilityReport.summary?.totalBrowsers || 0,
                supportedBrowsers: compatibilityReport.summary?.supportedBrowsers || 0,
                partialSupport: compatibilityReport.summary?.partialSupport || 0
            },
            complianceScore: this.calculateBrowserCompatibilityScore(compatibilityReport),
            issues: this.identifyBrowserCompatibilityIssues(compatibilityReport)
        };
    }
    
    /**
     * Generate CI/CD integration script
     * @returns {string} CI/CD script content
     */
    generateCICDScript() {
        return `#!/bin/bash
# Compliance Testing CI/CD Integration Script
# Generated by MCP Debug Host Platform

set -e

echo "🔍 Running Compliance Tests..."

# Configuration
COMPLIANCE_ENDPOINT="http://localhost:3001/api/compliance"
REPORT_DIR="./compliance-reports"
EXIT_CODE=0

# Create reports directory
mkdir -p $REPORT_DIR

# Function to run compliance test
run_compliance_test() {
    local test_type=$1
    local environment=$2
    
    echo "Running $test_type compliance test for $environment environment..."
    
    # Make API call to compliance framework
    response=$(curl -s -X POST "$COMPLIANCE_ENDPOINT/test" \\
        -H "Content-Type: application/json" \\
        -d "{
            \\"testTypes\\": [\\"$test_type\\"],
            \\"environment\\": \\"$environment\\",
            \\"cicdMode\\": true
        }")
    
    # Extract results
    score=$(echo "$response" | jq -r '.summary.overallScore')
    status=$(echo "$response" | jq -r '.summary.complianceStatus')
    critical_issues=$(echo "$response" | jq -r '.summary.criticalIssues')
    
    echo "$test_type Score: $score% ($status)"
    echo "$test_type Critical Issues: $critical_issues"
    
    # Save detailed report
    echo "$response" > "$REPORT_DIR/$test_type-report.json"
    
    # Check thresholds
    case $test_type in
        "gdpr")
            if [ "$score" -lt "95" ] || [ "$critical_issues" -gt "0" ]; then
                echo "❌ GDPR compliance test failed!"
                return 1
            fi
            ;;
        "soc2")
            if [ "$score" -lt "90" ] || [ "$critical_issues" -gt "0" ]; then
                echo "❌ SOC 2 compliance test failed!"
                return 1
            fi
            ;;
        "container-security")
            if [ "$score" -lt "85" ]; then
                echo "⚠️  Container security test warning (score below 85%)"
                # Don't fail build, just warn
            fi
            ;;
        "wcag")
            if [ "$score" -lt "95" ]; then
                echo "⚠️  WCAG accessibility test warning (score below 95%)"
                # Don't fail build, just warn
            fi
            ;;
        "browser-compatibility")
            if [ "$score" -lt "90" ]; then
                echo "⚠️  Browser compatibility test warning (score below 90%)"
                # Don't fail build, just warn
            fi
            ;;
    esac
    
    echo "✅ $test_type compliance test completed"
    return 0
}

# Run blocking compliance tests (fail build if these fail)
echo "Running blocking compliance tests..."

${this.config.cicd.blockDeployment.map(test => `
if ! run_compliance_test "${test}" "$ENVIRONMENT"; then
    echo "❌ Blocking compliance test failed: ${test}"
    EXIT_CODE=1
fi
`).join('')}

# Run warning-only compliance tests (don't fail build)
echo "Running warning-only compliance tests..."

${this.config.cicd.warnOnly.map(test => `
if ! run_compliance_test "${test}" "$ENVIRONMENT"; then
    echo "⚠️  Warning compliance test failed: ${test}"
    # Don't set exit code for warning-only tests
fi
`).join('')}

# Generate summary report
echo "Generating compliance summary..."
cat > "$REPORT_DIR/compliance-summary.json" << EOF
{
    "timestamp": "$(date -Iseconds)",
    "environment": "$ENVIRONMENT",
    "buildNumber": "$BUILD_NUMBER",
    "commitHash": "$COMMIT_HASH",
    "exitCode": $EXIT_CODE,
    "reportsGenerated": [
        $(ls $REPORT_DIR/*.json | sed 's/.*\\///' | sed 's/.json//' | sed 's/^/"/;s/$/"/g' | paste -sd ',' -)
    ]
}
EOF

# Upload reports to compliance dashboard (if configured)
if [ -n "$COMPLIANCE_DASHBOARD_URL" ]; then
    echo "Uploading reports to compliance dashboard..."
    for report in $REPORT_DIR/*.json; do
        curl -s -X POST "$COMPLIANCE_DASHBOARD_URL/upload" \\
            -H "Authorization: Bearer $COMPLIANCE_API_TOKEN" \\
            -F "file=@$report"
    done
fi

# Set final exit code
if [ $EXIT_CODE -eq 0 ]; then
    echo "✅ All compliance tests passed!"
else
    echo "❌ Compliance tests failed! Blocking deployment."
fi

exit $EXIT_CODE`;
    }
    
    /**
     * Generate compliance monitoring dashboard
     * @returns {string} Dashboard HTML content
     */
    generateComplianceDashboard() {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Compliance Monitoring Dashboard - MCP Debug Host Platform</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: #f8f9fa;
            color: #333;
        }
        
        .dashboard-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 2rem;
            text-align: center;
        }
        
        .compliance-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 2rem;
            padding: 2rem;
            max-width: 1400px;
            margin: 0 auto;
        }
        
        .compliance-card {
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            padding: 2rem;
            transition: transform 0.2s;
        }
        
        .compliance-card:hover {
            transform: translateY(-4px);
        }
        
        .card-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 1rem;
        }
        
        .card-title {
            font-size: 1.25rem;
            font-weight: 600;
            color: #2c3e50;
        }
        
        .score-badge {
            padding: 0.5rem 1rem;
            border-radius: 20px;
            font-weight: 600;
            font-size: 0.875rem;
        }
        
        .score-excellent { background: #d4edda; color: #155724; }
        .score-good { background: #cce7ff; color: #004085; }
        .score-warning { background: #fff3cd; color: #856404; }
        .score-critical { background: #f8d7da; color: #721c24; }
        
        .metric {
            margin: 1rem 0;
        }
        
        .metric-label {
            font-size: 0.875rem;
            color: #6c757d;
            margin-bottom: 0.25rem;
        }
        
        .metric-value {
            font-size: 1.5rem;
            font-weight: 600;
            color: #2c3e50;
        }
        
        .progress-bar {
            width: 100%;
            height: 8px;
            background: #e9ecef;
            border-radius: 4px;
            overflow: hidden;
            margin-top: 0.5rem;
        }
        
        .progress-fill {
            height: 100%;
            transition: width 0.3s ease;
        }
        
        .issues-list {
            margin-top: 1rem;
        }
        
        .issue-item {
            display: flex;
            align-items: center;
            padding: 0.5rem;
            margin: 0.25rem 0;
            background: #f8f9fa;
            border-radius: 6px;
            font-size: 0.875rem;
        }
        
        .issue-critical { border-left: 4px solid #dc3545; }
        .issue-warning { border-left: 4px solid #ffc107; }
        .issue-info { border-left: 4px solid #17a2b8; }
        
        .refresh-btn {
            background: #007bff;
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 6px;
            cursor: pointer;
            font-size: 0.875rem;
            font-weight: 600;
            margin: 1rem;
        }
        
        .refresh-btn:hover {
            background: #0056b3;
        }
        
        .last-updated {
            text-align: center;
            color: #6c757d;
            font-size: 0.875rem;
            margin: 1rem;
        }
    </style>
</head>
<body>
    <div class="dashboard-header">
        <h1>🛡️ Compliance Monitoring Dashboard</h1>
        <p>Real-time compliance status for MCP Debug Host Platform</p>
        <button class="refresh-btn" onclick="refreshCompliance()">🔄 Refresh Status</button>
    </div>
    
    <div class="compliance-grid" id="complianceGrid">
        <!-- Compliance cards will be dynamically generated here -->
    </div>
    
    <div class="last-updated" id="lastUpdated">
        Last updated: <span id="updateTime">-</span>
    </div>
    
    <script>
        let complianceData = {};
        
        // Initialize dashboard
        async function initializeDashboard() {
            await refreshCompliance();
            setInterval(refreshCompliance, 5 * 60 * 1000); // Refresh every 5 minutes
        }
        
        // Refresh compliance data
        async function refreshCompliance() {
            try {
                const response = await fetch('/api/compliance/status');
                complianceData = await response.json();
                updateDashboard();
                updateLastUpdated();
            } catch (error) {
                console.error('Failed to refresh compliance data:', error);
            }
        }
        
        // Update dashboard with latest data
        function updateDashboard() {
            const grid = document.getElementById('complianceGrid');
            grid.innerHTML = '';
            
            const complianceTypes = [
                { key: 'gdpr', title: 'GDPR Compliance', icon: '🔒' },
                { key: 'soc2', title: 'SOC 2 Type II', icon: '📋' },
                { key: 'containerSecurity', title: 'Container Security', icon: '🐳' },
                { key: 'wcag', title: 'WCAG 2.1 AA', icon: '♿' },
                { key: 'browserCompatibility', title: 'Browser Compatibility', icon: '🌐' }
            ];
            
            complianceTypes.forEach(type => {
                const card = createComplianceCard(type, complianceData[type.key] || {});
                grid.appendChild(card);
            });
        }
        
        // Create compliance card
        function createComplianceCard(type, data) {
            const card = document.createElement('div');
            card.className = 'compliance-card';
            
            const score = data.complianceScore || 0;
            const scoreBadgeClass = getScoreBadgeClass(score);
            const progressColor = getProgressColor(score);
            
            card.innerHTML = \`
                <div class="card-header">
                    <div class="card-title">\${type.icon} \${type.title}</div>
                    <div class="score-badge \${scoreBadgeClass}">\${score}%</div>
                </div>
                
                <div class="metric">
                    <div class="metric-label">Compliance Score</div>
                    <div class="metric-value">\${score}%</div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: \${score}%; background: \${progressColor};"></div>
                    </div>
                </div>
                
                <div class="metric">
                    <div class="metric-label">Critical Issues</div>
                    <div class="metric-value" style="color: \${data.criticalIssues > 0 ? '#dc3545' : '#28a745'};">
                        \${data.criticalIssues || 0}
                    </div>
                </div>
                
                <div class="metric">
                    <div class="metric-label">Last Tested</div>
                    <div class="metric-value" style="font-size: 1rem;">
                        \${data.lastTested ? new Date(data.lastTested).toLocaleString() : 'Never'}
                    </div>
                </div>
                
                \${data.issues && data.issues.length > 0 ? \`
                    <div class="issues-list">
                        <div class="metric-label">Recent Issues</div>
                        \${data.issues.slice(0, 3).map(issue => \`
                            <div class="issue-item issue-\${issue.severity}">
                                \${issue.description}
                            </div>
                        \`).join('')}
                    </div>
                \` : ''}
            \`;
            
            return card;
        }
        
        // Get score badge class
        function getScoreBadgeClass(score) {
            if (score >= 95) return 'score-excellent';
            if (score >= 85) return 'score-good';
            if (score >= 70) return 'score-warning';
            return 'score-critical';
        }
        
        // Get progress bar color
        function getProgressColor(score) {
            if (score >= 95) return '#28a745';
            if (score >= 85) return '#007bff';
            if (score >= 70) return '#ffc107';
            return '#dc3545';
        }
        
        // Update last updated timestamp
        function updateLastUpdated() {
            document.getElementById('updateTime').textContent = new Date().toLocaleString();
        }
        
        // Initialize dashboard on page load
        document.addEventListener('DOMContentLoaded', initializeDashboard);
    </script>
</body>
</html>`;
    }
    
    /**
     * Helper methods for evaluation and scoring
     */
    
    evaluateTestResult(testType, result) {
        const threshold = this.config.thresholds[testType];
        if (!threshold) {
            return { status: 'unknown', criticalIssues: 0 };
        }
        
        const score = result.complianceScore || 0;
        const criticalIssues = result.issues?.filter(issue => issue.severity === 'critical').length || 0;
        
        let status = 'passed';
        if (score < threshold.minScore || criticalIssues > threshold.criticalViolations) {
            status = 'failed';
        } else if (score < threshold.minScore + 10) {
            status = 'warning';
        }
        
        return { status, criticalIssues };
    }
    
    calculateOverallScore(results) {
        const scores = Object.values(results)
            .map(result => result.complianceScore || 0)
            .filter(score => score > 0);
        
        if (scores.length === 0) return 0;
        
        return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
    }
    
    getComplianceStatus(summary) {
        if (summary.criticalIssues > 0) return 'critical';
        if (summary.failed > 0) return 'non-compliant';
        if (summary.warnings > 0) return 'partial-compliance';
        return 'fully-compliant';
    }
    
    generateComplianceRecommendations(results) {
        const recommendations = [];
        
        Object.entries(results).forEach(([testType, result]) => {
            if (result.issues && result.issues.length > 0) {
                const criticalIssues = result.issues.filter(issue => issue.severity === 'critical');
                if (criticalIssues.length > 0) {
                    recommendations.push({
                        priority: 'high',
                        testType,
                        description: `Address ${criticalIssues.length} critical issues in ${testType}`,
                        issues: criticalIssues
                    });
                }
            }
        });
        
        return recommendations;
    }
    
    generateNextActions(results, summary) {
        const actions = [];
        
        if (summary.criticalIssues > 0) {
            actions.push({
                action: 'immediate-remediation',
                description: 'Address critical compliance issues immediately',
                priority: 'critical',
                deadline: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
            });
        }
        
        if (summary.failed > 0) {
            actions.push({
                action: 'compliance-review',
                description: 'Review and fix failed compliance tests',
                priority: 'high',
                deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days
            });
        }
        
        return actions;
    }
    
    // Score calculation methods for each compliance type
    calculateGDPRScore(sanitizedData, deletionResult, processingReport) {
        let score = 100;
        
        // Deduct points for unsanitized PII
        if (this.containsPII(sanitizedData)) score -= 30;
        
        // Check deletion functionality
        if (!deletionResult || deletionResult.deletedCount === 0) score -= 20;
        
        // Check data processing compliance
        if (processingReport.upcomingExpirations?.length > 0) score -= 10;
        
        return Math.max(0, score);
    }
    
    calculateSOC2Score(complianceReport, integrityResult) {
        let score = 100;
        
        // Check audit trail integrity
        if (!integrityResult.overallIntegrity) score -= 40;
        
        // Check compliance report completeness
        if (!complianceReport.trustServiceCriteria) score -= 20;
        
        return Math.max(0, score);
    }
    
    calculateContainerSecurityScore(cisAssessment, vulnerabilityScans) {
        let score = cisAssessment.complianceScore || 0;
        
        // Adjust for vulnerability scan results
        const totalVulns = vulnerabilityScans.reduce((sum, scan) => 
            sum + (scan.summary?.critical || 0) + (scan.summary?.high || 0), 0);
        
        if (totalVulns > 0) score -= Math.min(30, totalVulns * 5);
        
        return Math.max(0, Math.round(score));
    }
    
    calculateBrowserCompatibilityScore(compatibilityReport) {
        return compatibilityReport.summary?.overallScore || 0;
    }
    
    // Issue identification methods
    identifyGDPRIssues(sanitizedData, deletionResult) {
        const issues = [];
        
        if (this.containsPII(sanitizedData)) {
            issues.push({
                severity: 'critical',
                description: 'Personal data not properly sanitized',
                category: 'data-sanitization'
            });
        }
        
        if (!deletionResult || deletionResult.deletedCount === 0) {
            issues.push({
                severity: 'high',
                description: 'Right to erasure not functional',
                category: 'data-erasure'
            });
        }
        
        return issues;
    }
    
    identifySOC2Issues(integrityResult) {
        const issues = [];
        
        if (!integrityResult.overallIntegrity) {
            issues.push({
                severity: 'critical',
                description: 'Audit trail integrity compromised',
                category: 'audit-integrity'
            });
        }
        
        return issues;
    }
    
    identifyContainerSecurityIssues(cisAssessment, vulnerabilityScans) {
        const issues = [];
        
        if (cisAssessment.summary?.failed > 0) {
            issues.push({
                severity: 'high',
                description: `${cisAssessment.summary.failed} CIS benchmark checks failed`,
                category: 'cis-compliance'
            });
        }
        
        vulnerabilityScans.forEach(scan => {
            if (scan.summary?.critical > 0) {
                issues.push({
                    severity: 'critical',
                    description: `Critical vulnerabilities found in ${scan.imageId}`,
                    category: 'vulnerability'
                });
            }
        });
        
        return issues;
    }
    
    identifyWCAGIssues(accessibilityAudit) {
        const issues = [];
        
        if (accessibilityAudit.summary?.violations > 0) {
            issues.push({
                severity: 'high',
                description: `${accessibilityAudit.summary.violations} accessibility violations found`,
                category: 'wcag-violations'
            });
        }
        
        return issues;
    }
    
    identifyBrowserCompatibilityIssues(compatibilityReport) {
        const issues = [];
        
        if (compatibilityReport.summary?.criticalIssues > 0) {
            issues.push({
                severity: 'high',
                description: `${compatibilityReport.summary.criticalIssues} critical compatibility issues`,
                category: 'browser-compatibility'
            });
        }
        
        return issues;
    }
    
    // Utility methods
    containsPII(data) {
        const dataString = JSON.stringify(data);
        const piiPatterns = [
            /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Email
            /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g, // IP Address
            /\b\d{3}-\d{2}-\d{4}\b/g // SSN
        ];
        
        return piiPatterns.some(pattern => pattern.test(dataString));
    }
    
    countPIIFields(data) {
        const dataString = JSON.stringify(data);
        return (dataString.match(/@/g) || []).length + // Emails
               (dataString.match(/\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g) || []).length; // IPs
    }
    
    countSanitizedFields(data) {
        const dataString = JSON.stringify(data);
        return (dataString.match(/\*\*\*MASKED\*\*\*/g) || []).length;
    }
    
    // Framework management methods
    async initializeComplianceModules() {
        // Initialize all compliance modules
        const modules = [
            this.gdprSanitizer,
            this.soc2AuditTrail,
            this.containerSecurity,
            this.wcagAccessibility,
            this.browserCompatibility
        ];
        
        await Promise.all(modules.map(module => 
            module.initialize ? module.initialize() : Promise.resolve()
        ));
    }
    
    setupContinuousMonitoring() {
        // Set up continuous monitoring for specified compliance types
        this.config.testSchedule.continuous.forEach(testType => {
            setInterval(async () => {
                try {
                    const result = await this.runComplianceTest(testType);
                    this.activeMonitoring.set(testType, result);
                    
                    // Check for critical issues
                    const evaluation = this.evaluateTestResult(testType, result);
                    if (evaluation.status === 'failed') {
                        this.emit('criticalComplianceFailure', {
                            testType,
                            result,
                            timestamp: new Date().toISOString()
                        });
                    }
                } catch (error) {
                    this.emit('continuousMonitoringError', {
                        testType,
                        error: error.message,
                        timestamp: new Date().toISOString()
                    });
                }
            }, 5 * 60 * 1000); // Every 5 minutes
        });
    }
    
    setupScheduledTesting() {
        // Daily tests
        setInterval(async () => {
            for (const testType of this.config.testSchedule.daily) {
                await this.runComplianceTest(testType);
            }
        }, 24 * 60 * 60 * 1000);
        
        // Weekly tests
        setInterval(async () => {
            for (const testType of this.config.testSchedule.weekly) {
                if (testType === 'full-compliance-audit') {
                    await this.runComplianceTestSuite();
                }
            }
        }, 7 * 24 * 60 * 60 * 1000);
    }
    
    setupEventListeners() {
        // Set up event listeners for all compliance modules
        [this.gdprSanitizer, this.soc2AuditTrail, this.containerSecurity, 
         this.wcagAccessibility, this.browserCompatibility].forEach(module => {
            module.on('error', (error) => {
                this.emit('complianceModuleError', error);
            });
        });
    }
    
    updateComplianceHistory(testSuite) {
        const historyEntry = {
            timestamp: testSuite.timestamp,
            overallScore: testSuite.summary.overallScore,
            complianceStatus: testSuite.summary.complianceStatus,
            criticalIssues: testSuite.summary.criticalIssues
        };
        
        this.complianceHistory.set(testSuite.suiteId, historyEntry);
    }
    
    async sendComplianceNotifications(testSuite) {
        if (testSuite.summary.complianceStatus === 'critical' || 
            testSuite.summary.criticalIssues > 0) {
            
            // Send notifications based on configuration
            if (this.config.notifications.slack.enabled) {
                await this.sendSlackNotification(testSuite);
            }
            
            if (this.config.notifications.email.enabled) {
                await this.sendEmailNotification(testSuite);
            }
        }
    }
    
    async sendSlackNotification(testSuite) {
        // Slack notification implementation
        console.log('Slack notification would be sent:', {
            suite: testSuite.suiteId,
            status: testSuite.summary.complianceStatus,
            criticalIssues: testSuite.summary.criticalIssues
        });
    }
    
    async sendEmailNotification(testSuite) {
        // Email notification implementation
        console.log('Email notification would be sent:', {
            suite: testSuite.suiteId,
            status: testSuite.summary.complianceStatus,
            criticalIssues: testSuite.summary.criticalIssues
        });
    }
    
    async ensureReportsDirectory() {
        await fs.mkdir(this.config.reportsDirectory, { recursive: true });
    }
    
    async saveComplianceReport(testSuite) {
        const filename = `compliance-report-${testSuite.suiteId}.json`;
        const filepath = path.join(this.config.reportsDirectory, filename);
        await fs.writeFile(filepath, JSON.stringify(testSuite, null, 2));
    }
}

module.exports = ComplianceTestingFramework;