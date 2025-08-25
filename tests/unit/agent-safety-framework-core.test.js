/**
 * Agent Safety Framework Core Unit Tests
 * 
 * Tests the core functionality of the Agent Safety Framework without
 * complex integration dependencies.
 */

const { describe, beforeAll, afterAll, beforeEach, afterEach, it, expect } = require('@jest/globals');
const { 
  AgentSafetyFramework, 
  SafetyLevel, 
  RiskLevel, 
  ProcessContext, 
  SafetyDecision, 
  SafetyEvaluation 
} = require('../../src/agent-safety-framework');
const { SafetyAwareToolResult } = require('../../src/safety-aware-mcp-tools');
const path = require('path');
const os = require('os');

describe('Agent Safety Framework Core Tests', () => {
  describe('Constants and Enums', () => {
    it('should define correct SafetyLevel constants', () => {
      expect(SafetyLevel.SAFE).toBe('safe');
      expect(SafetyLevel.MODERATE).toBe('moderate');
      expect(SafetyLevel.DANGEROUS).toBe('dangerous');
    });

    it('should define correct RiskLevel constants', () => {
      expect(RiskLevel.LOW).toBe('low');
      expect(RiskLevel.MEDIUM).toBe('medium');
      expect(RiskLevel.HIGH).toBe('high');
      expect(RiskLevel.CRITICAL).toBe('critical');
    });

    it('should define correct ProcessContext constants', () => {
      expect(ProcessContext.REGISTERED).toBe('registered');
      expect(ProcessContext.WORKSPACE).toBe('workspace');
      expect(ProcessContext.ROGUE).toBe('rogue');
      expect(ProcessContext.SYSTEM).toBe('system');
      expect(ProcessContext.UNKNOWN).toBe('unknown');
    });

    it('should define correct SafetyDecision constants', () => {
      expect(SafetyDecision.ALLOW).toBe('allow');
      expect(SafetyDecision.REQUIRE_CONFIRMATION).toBe('require_confirmation');
      expect(SafetyDecision.BLOCK).toBe('block');
      expect(SafetyDecision.EMERGENCY_OVERRIDE).toBe('emergency_override');
    });
  });

  describe('SafetyEvaluation Class', () => {
    it('should create basic safety evaluation', () => {
      const evaluation = new SafetyEvaluation({
        allowed: true,
        requiresConfirmation: false,
        riskLevel: RiskLevel.LOW,
        reasoning: 'Test evaluation',
        processContext: ProcessContext.WORKSPACE
      });

      expect(evaluation.allowed).toBe(true);
      expect(evaluation.requiresConfirmation).toBe(false);
      expect(evaluation.riskLevel).toBe(RiskLevel.LOW);
      expect(evaluation.reasoning).toBe('Test evaluation');
      expect(evaluation.processContext).toBe(ProcessContext.WORKSPACE);
      expect(evaluation.timestamp).toBeDefined();
    });

    it('should create blocked evaluation correctly', () => {
      const alternatives = ['Use safer alternative', 'Contact administrator'];
      const evaluation = SafetyEvaluation.createBlocked(
        'System process detected',
        alternatives,
        ProcessContext.SYSTEM
      );

      expect(evaluation.allowed).toBe(false);
      expect(evaluation.requiresConfirmation).toBe(false);
      expect(evaluation.riskLevel).toBe(RiskLevel.HIGH);
      expect(evaluation.reasoning).toBe('System process detected');
      expect(evaluation.alternatives).toEqual(alternatives);
      expect(evaluation.processContext).toBe(ProcessContext.SYSTEM);
      expect(evaluation.confidence).toBe(0.9);
    });

    it('should create confirmation required evaluation correctly', () => {
      const evaluation = SafetyEvaluation.createRequireConfirmation(
        'Dangerous operation on registered process',
        RiskLevel.MEDIUM,
        ProcessContext.REGISTERED
      );

      expect(evaluation.allowed).toBe(false);
      expect(evaluation.requiresConfirmation).toBe(true);
      expect(evaluation.riskLevel).toBe(RiskLevel.MEDIUM);
      expect(evaluation.reasoning).toBe('Dangerous operation on registered process');
      expect(evaluation.processContext).toBe(ProcessContext.REGISTERED);
      expect(evaluation.confidence).toBe(0.8);
    });

    it('should create allowed evaluation correctly', () => {
      const evaluation = SafetyEvaluation.createAllowed(
        'Safe operation approved',
        ProcessContext.WORKSPACE
      );

      expect(evaluation.allowed).toBe(true);
      expect(evaluation.requiresConfirmation).toBe(false);
      expect(evaluation.riskLevel).toBe(RiskLevel.LOW);
      expect(evaluation.reasoning).toBe('Safe operation approved');
      expect(evaluation.processContext).toBe(ProcessContext.WORKSPACE);
      expect(evaluation.confidence).toBe(0.7);
    });
  });

  describe('SafetyAwareToolResult Class', () => {
    it('should create basic tool result', () => {
      const originalResult = { success: true, message: 'Tool executed successfully' };
      const safetyEvaluation = SafetyEvaluation.createAllowed('Safe operation');
      const performanceMetrics = { totalTime: 250, safetyEvaluationTime: 50, toolExecutionTime: 200 };

      const toolResult = new SafetyAwareToolResult(originalResult, safetyEvaluation, performanceMetrics);

      expect(toolResult.success).toBe(true);
      expect(toolResult.result).toEqual(originalResult);
      expect(toolResult.safety.evaluation).toEqual(safetyEvaluation);
      expect(toolResult.safety.framework).toBe('AgentSafetyFramework');
      expect(toolResult.performance.totalTime).toBe(250);
      expect(toolResult.performance.meetsPerfReq).toBe(true);
      expect(toolResult.timestamp).toBeDefined();
    });

    it('should identify slow operations correctly', () => {
      const originalResult = { success: true, message: 'Slow operation' };
      const safetyEvaluation = SafetyEvaluation.createAllowed('Safe but slow');
      const performanceMetrics = { totalTime: 750 }; // Exceeds 500ms requirement

      const toolResult = new SafetyAwareToolResult(originalResult, safetyEvaluation, performanceMetrics);

      expect(toolResult.performance.meetsPerfReq).toBe(false);
      expect(toolResult.performance.totalTime).toBe(750);
    });

    it('should create blocked result correctly', () => {
      const safetyEvaluation = SafetyEvaluation.createBlocked(
        'System process blocked',
        ['Use service manager'],
        ProcessContext.SYSTEM
      );
      const performanceMetrics = { totalTime: 100, safetyEvaluationTime: 100 };

      const blockedResult = SafetyAwareToolResult.createBlocked(safetyEvaluation, performanceMetrics);

      expect(blockedResult.success).toBe(false);
      expect(blockedResult.result.error).toBe('Operation blocked by safety framework');
      expect(blockedResult.result.reason).toBe('System process blocked');
      expect(blockedResult.result.alternatives).toEqual(['Use service manager']);
      expect(blockedResult.safety.evaluation).toEqual(safetyEvaluation);
    });

    it('should create confirmation required result correctly', () => {
      const safetyEvaluation = SafetyEvaluation.createRequireConfirmation(
        'Dangerous operation needs confirmation',
        RiskLevel.HIGH,
        ProcessContext.ROGUE
      );
      const performanceMetrics = { totalTime: 150 };

      const confirmResult = SafetyAwareToolResult.createConfirmationRequired(safetyEvaluation, performanceMetrics);

      expect(confirmResult.success).toBe(false);
      expect(confirmResult.result.requiresConfirmation).toBe(true);
      expect(confirmResult.result.confirmationMessage).toBe('Dangerous operation needs confirmation');
      expect(confirmResult.result.riskLevel).toBe(RiskLevel.HIGH);
      expect(confirmResult.result.processContext).toBe(ProcessContext.ROGUE);
    });
  });

  describe('AgentSafetyFramework Basic Functionality', () => {
    let safetyFramework;
    let testAuditLogPath;

    beforeAll(async () => {
      testAuditLogPath = path.join(os.tmpdir(), `safety-core-test-${Date.now()}.log`);
      
      // Create framework without external dependencies for unit testing
      safetyFramework = new AgentSafetyFramework({
        auditLogPath: testAuditLogPath,
        performanceTimeout: 500,
        enableEmergencyOverride: true,
        // No external dependencies for unit tests
        processCorrelationEngine: null,
        enhancedPortRegistry: null,
        discoveryEngine: null
      });

      await safetyFramework.initialize();
    });

    afterAll(async () => {
      if (safetyFramework) {
        await safetyFramework.shutdown();
      }
    });

    it('should initialize successfully without external dependencies', async () => {
      expect(safetyFramework.initialized).toBe(true);
      expect(safetyFramework.auditLogEntries).toBeDefined();
      expect(safetyFramework.performanceStats).toBeDefined();
      expect(safetyFramework.emergencyOverrideActive).toBe(false);
    });

    it('should have correct performance timeout configuration', () => {
      expect(safetyFramework.options.performanceTimeout).toBe(500);
    });

    it('should track performance statistics', () => {
      const stats = safetyFramework.getPerformanceStats();
      
      expect(stats.totalEvaluations).toBeDefined();
      expect(stats.averageResponseTime).toBeDefined();
      expect(stats.slowEvaluations).toBeDefined();
      expect(stats.fastEvaluations).toBeDefined();
      expect(stats.performanceCompliance).toBeDefined();
      expect(stats.performanceCompliance.target).toBe('<500ms');
    });

    it('should allow emergency override activation', async () => {
      const reason = 'Unit test emergency override';
      const duration = 1; // 1 minute
      const authorizedBy = { user: 'test-admin', role: 'administrator' };

      const result = await safetyFramework.activateEmergencyOverride(reason, duration, authorizedBy);

      expect(result).toBe(true);
      expect(safetyFramework.emergencyOverrideActive).toBe(true);
      expect(safetyFramework.emergencyOverrideExpiry).toBeDefined();

      // Check audit log
      const lastAuditEntry = safetyFramework.auditLogEntries[safetyFramework.auditLogEntries.length - 1];
      expect(lastAuditEntry.operation).toBe('emergency_override_activated');
      expect(lastAuditEntry.data.reason).toBe(reason);
      expect(lastAuditEntry.data.authorizedBy).toEqual(authorizedBy);
    });

    it('should allow emergency override deactivation', async () => {
      // Ensure override is active first
      if (!safetyFramework.emergencyOverrideActive) {
        await safetyFramework.activateEmergencyOverride('Test setup', 1);
      }

      const deactivationReason = 'Unit test completion';
      const result = await safetyFramework.deactivateEmergencyOverride(deactivationReason);

      expect(result).toBe(true);
      expect(safetyFramework.emergencyOverrideActive).toBe(false);
      expect(safetyFramework.emergencyOverrideExpiry).toBeNull();

      // Check audit log
      const lastAuditEntry = safetyFramework.auditLogEntries[safetyFramework.auditLogEntries.length - 1];
      expect(lastAuditEntry.operation).toBe('emergency_override_deactivated');
      expect(lastAuditEntry.data.reason).toBe(deactivationReason);
    });

    it('should create audit log entries with proper structure', async () => {
      const initialAuditSize = safetyFramework.auditLogEntries.length;

      await safetyFramework.auditLog('test_operation', {
        testData: 'unit test audit',
        timestamp: new Date().toISOString()
      });

      expect(safetyFramework.auditLogEntries.length).toBe(initialAuditSize + 1);

      const newEntry = safetyFramework.auditLogEntries[safetyFramework.auditLogEntries.length - 1];
      expect(newEntry.id).toBeDefined();
      expect(newEntry.operation).toBe('test_operation');
      expect(newEntry.timestamp).toBeDefined();
      expect(newEntry.data).toBeDefined();
      expect(newEntry.hash).toBeDefined();
      expect(newEntry.hash).toMatch(/^[a-f0-9]{64}$/); // SHA-256 hex hash
    });

    it('should allow safety rules updates', async () => {
      const newRules = {
        registeredProcess: {
          safe: SafetyDecision.ALLOW,
          moderate: SafetyDecision.ALLOW,
          dangerous: SafetyDecision.REQUIRE_CONFIRMATION
        }
      };

      await safetyFramework.updateSafetyRules(newRules);

      // Check that rules were updated (basic verification)
      expect(safetyFramework.safetyRules.registeredProcess).toEqual(newRules.registeredProcess);

      // Check audit log
      const lastAuditEntry = safetyFramework.auditLogEntries[safetyFramework.auditLogEntries.length - 1];
      expect(lastAuditEntry.operation).toBe('safety_rules_updated');
      expect(lastAuditEntry.data.newRules).toEqual(newRules);
    });

    it('should handle safety evaluation with minimal dependencies', async () => {
      const command = {
        toolName: 'host.discover_processes',
        safetyLevel: SafetyLevel.SAFE,
        params: { techStacks: ['nodejs'] }
      };

      const context = {
        agent: 'unit-test-agent',
        user: 'unit-test-user',
        sessionId: 'unit-test-session'
      };

      const startTime = Date.now();
      const evaluation = await safetyFramework.evaluateProcessControlRequest(command, context);
      const evaluationTime = Date.now() - startTime;

      expect(evaluationTime).toBeLessThan(500);
      expect(evaluation).toBeDefined();
      expect(evaluation.timestamp).toBeDefined();
      expect(evaluation.allowed).toBe(true); // SAFE operations should be allowed
      expect(evaluation.requiresConfirmation).toBe(false);
      expect(evaluation.riskLevel).toBe(RiskLevel.LOW);
      expect(evaluation.auditRequired).toBe(true);
    });

    it('should meet performance requirements consistently', async () => {
      const performanceTests = 10;
      const results = [];

      for (let i = 0; i < performanceTests; i++) {
        const startTime = Date.now();
        
        await safetyFramework.evaluateProcessControlRequest({
          toolName: `host.test_tool_${i}`,
          safetyLevel: SafetyLevel.SAFE,
          params: {}
        }, {
          agent: 'perf-test',
          user: 'perf-user'
        });
        
        const duration = Date.now() - startTime;
        results.push(duration);
      }

      const avgTime = results.reduce((sum, time) => sum + time, 0) / results.length;
      const slowOperations = results.filter(time => time > 500).length;

      expect(avgTime).toBeLessThan(500);
      expect(slowOperations).toBe(0);
      
      console.log(`Average evaluation time: ${Math.round(avgTime)}ms (${performanceTests} tests)`);
    });
  });
});