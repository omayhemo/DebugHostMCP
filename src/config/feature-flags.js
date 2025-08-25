/**
 * Feature Flag System for Production Rollout
 * 
 * Controls phased activation of v2.1 Multi-Tech Stack Process Discovery features
 * during zero-downtime production deployment. Features are activated gradually
 * with monitoring and rollback capability at each phase.
 * 
 * Deployment Phases:
 * - Phase 1: Discovery Engine (backend enhancement)
 * - Phase 2: MCP Tools (agent productivity enhancement)
 * - Phase 3: Dashboard Enhancement (UI transformation)
 */

const fs = require('fs');
const path = require('path');

/**
 * Feature Flag Definitions
 */
const FEATURE_FLAGS = {
  // Phase 1: Multi-Tech Process Discovery Engine
  DISCOVERY_ENGINE: {
    key: 'discoveryEngine',
    name: 'Multi-Tech Process Discovery Engine',
    description: 'Core discovery engine with multi-tech stack support',
    phase: 1,
    defaultEnabled: false,
    dependencies: [],
    impactLevel: 'low', // Backend only
    rollbackComplexity: 'simple'
  },
  
  ENHANCED_REGISTRY: {
    key: 'enhancedRegistry',
    name: 'Enhanced Dynamic Port Registry',
    description: 'Hybrid registry with static + dynamic process tracking',
    phase: 1,
    defaultEnabled: false,
    dependencies: ['discoveryEngine'], // Use actual key, not constant name
    impactLevel: 'low',
    rollbackComplexity: 'simple'
  },
  
  // Phase 2: MCP Tools Enhancement
  MCP_TOOLS_ENHANCED: {
    key: 'mcpToolsEnhanced',
    name: 'Enhanced MCP Tools (15 new tools)',
    description: 'Advanced process management tools for Claude agents',
    phase: 2,
    defaultEnabled: false,
    dependencies: ['discoveryEngine', 'enhancedRegistry'],
    impactLevel: 'medium', // Agent-facing changes
    rollbackComplexity: 'moderate'
  },
  
  AGENT_SAFETY_FRAMEWORK: {
    key: 'agentSafetyFramework',
    name: 'Agent Safety Framework',
    description: 'Context-aware safety mechanisms for process control',
    phase: 2,
    defaultEnabled: false,
    dependencies: ['mcpToolsEnhanced'],
    impactLevel: 'medium',
    rollbackComplexity: 'moderate'
  },
  
  // Phase 3: Dashboard Enhancement
  DASHBOARD_ENHANCED: {
    key: 'dashboardEnhanced',
    name: 'Multi-Tech Dashboard',
    description: 'Enhanced UI with multi-tech stack visualization',
    phase: 3,
    defaultEnabled: false,
    dependencies: ['discoveryEngine', 'enhancedRegistry'],
    impactLevel: 'high', // User-facing changes
    rollbackComplexity: 'complex'
  },
  
  REAL_TIME_MONITORING: {
    key: 'realTimeMonitoring',
    name: 'Real-time Process Monitoring',
    description: 'Live process monitoring with SSE updates',
    phase: 3,
    defaultEnabled: false,
    dependencies: ['dashboardEnhanced'],
    impactLevel: 'high',
    rollbackComplexity: 'complex'
  },
  
  BULK_OPERATIONS: {
    key: 'bulkOperations',
    name: 'Safety-Aware Bulk Operations',
    description: 'Bulk process management with safety validation',
    phase: 3,
    defaultEnabled: false,
    dependencies: ['agentSafetyFramework', 'dashboardEnhanced'],
    impactLevel: 'high',
    rollbackComplexity: 'complex'
  }
};

/**
 * Feature Flag Manager
 * Manages feature activation, validation, and rollback
 */
class FeatureFlagManager {
  constructor(configPath = null) {
    this.configPath = configPath || path.join(__dirname, '..', '..', 'data', 'feature-flags.json');
    this.flags = new Map();
    this.subscribers = new Map();
    this.rolloutMetrics = {
      activatedFeatures: [],
      rollbackEvents: [],
      performanceImpacts: [],
      errorEvents: []
    };
    
    this.loadConfiguration();
  }
  
  /**
   * Load feature flag configuration from disk
   */
  loadConfiguration() {
    try {
      // Ensure data directory exists
      const dataDir = path.dirname(this.configPath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      
      // Load existing configuration or create default
      if (fs.existsSync(this.configPath)) {
        const configData = fs.readFileSync(this.configPath, 'utf8');
        const config = JSON.parse(configData);
        
        // Merge with defaults
        Object.values(FEATURE_FLAGS).forEach(flagDef => {
          const savedState = config.flags && config.flags[flagDef.key];
          this.flags.set(flagDef.key, {
            ...flagDef,
            enabled: savedState ? savedState.enabled : flagDef.defaultEnabled,
            activatedAt: savedState ? savedState.activatedAt : null,
            activatedBy: savedState ? savedState.activatedBy : null,
            rollbackCount: savedState ? savedState.rollbackCount || 0 : 0
          });
        });
        
        // Load metrics if available
        if (config.metrics) {
          this.rolloutMetrics = { ...this.rolloutMetrics, ...config.metrics };
        }
        
        console.log(`Feature flags loaded from ${this.configPath}`);
      } else {
        // Initialize with defaults
        Object.values(FEATURE_FLAGS).forEach(flagDef => {
          this.flags.set(flagDef.key, {
            ...flagDef,
            enabled: flagDef.defaultEnabled,
            activatedAt: null,
            activatedBy: null,
            rollbackCount: 0
          });
        });
        
        this.saveConfiguration();
        console.log(`Feature flags initialized with defaults`);
      }
    } catch (error) {
      console.error('Failed to load feature flag configuration:', error);
      throw new Error(`Feature flag initialization failed: ${error.message}`);
    }
  }
  
  /**
   * Save current configuration to disk
   */
  saveConfiguration() {
    try {
      const config = {
        version: '2.1.0',
        lastUpdated: new Date().toISOString(),
        flags: Object.fromEntries(
          Array.from(this.flags.entries()).map(([key, flag]) => [
            key,
            {
              enabled: flag.enabled,
              activatedAt: flag.activatedAt,
              activatedBy: flag.activatedBy,
              rollbackCount: flag.rollbackCount
            }
          ])
        ),
        metrics: this.rolloutMetrics
      };
      
      fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2));
    } catch (error) {
      console.error('Failed to save feature flag configuration:', error);
      throw error;
    }
  }
  
  /**
   * Check if a feature is enabled
   */
  isEnabled(featureKey) {
    const flag = this.flags.get(featureKey);
    return flag ? flag.enabled : false;
  }
  
  /**
   * Enable a feature with dependency validation
   */
  async enableFeature(featureKey, activatedBy = 'system') {
    const flag = this.flags.get(featureKey);
    if (!flag) {
      throw new Error(`Unknown feature flag: ${featureKey}`);
    }
    
    // Check if already enabled
    if (flag.enabled) {
      return { success: true, message: `Feature ${featureKey} already enabled` };
    }
    
    // Validate dependencies
    const dependencyCheck = this.validateDependencies(featureKey);
    if (!dependencyCheck.valid) {
      throw new Error(`Dependencies not met for ${featureKey}: ${dependencyCheck.missing.join(', ')}`);
    }
    
    // Enable the feature
    flag.enabled = true;
    flag.activatedAt = new Date().toISOString();
    flag.activatedBy = activatedBy;
    
    // Update metrics
    this.rolloutMetrics.activatedFeatures.push({
      featureKey,
      activatedAt: flag.activatedAt,
      activatedBy,
      phase: flag.phase
    });
    
    // Save configuration
    this.saveConfiguration();
    
    // Notify subscribers
    this.notifySubscribers(featureKey, true);
    
    console.log(`✓ Feature enabled: ${flag.name} (Phase ${flag.phase})`);
    
    return {
      success: true,
      message: `Feature ${flag.name} enabled successfully`,
      phase: flag.phase
    };
  }
  
  /**
   * Disable a feature (rollback)
   */
  async disableFeature(featureKey, reason = 'manual_rollback') {
    const flag = this.flags.get(featureKey);
    if (!flag) {
      throw new Error(`Unknown feature flag: ${featureKey}`);
    }
    
    // Check if already disabled
    if (!flag.enabled) {
      return { success: true, message: `Feature ${featureKey} already disabled` };
    }
    
    // Check for dependent features and warn
    const dependents = this.getFeatureDependents(featureKey);
    if (dependents.length > 0) {
      console.warn(`Warning: Disabling ${featureKey} affects dependent features: ${dependents.join(', ')}`);
    }
    
    // Disable the feature
    flag.enabled = false;
    flag.rollbackCount++;
    
    // Update metrics
    this.rolloutMetrics.rollbackEvents.push({
      featureKey,
      rolledBackAt: new Date().toISOString(),
      reason,
      rollbackCount: flag.rollbackCount,
      phase: flag.phase
    });
    
    // Save configuration
    this.saveConfiguration();
    
    // Notify subscribers
    this.notifySubscribers(featureKey, false);
    
    console.log(`⚠️ Feature disabled: ${flag.name} (Reason: ${reason})`);
    
    return {
      success: true,
      message: `Feature ${flag.name} disabled successfully`,
      dependents,
      rollbackCount: flag.rollbackCount
    };
  }
  
  /**
   * Enable all features for a specific phase
   */
  async enablePhase(phaseNumber, activatedBy = 'system') {
    const phaseFeatures = Array.from(this.flags.values()).filter(flag => flag.phase === phaseNumber);
    const results = [];
    
    console.log(`Enabling Phase ${phaseNumber} features...`);
    
    for (const flag of phaseFeatures) {
      try {
        const result = await this.enableFeature(flag.key, activatedBy);
        results.push({ feature: flag.key, ...result });
      } catch (error) {
        results.push({ 
          feature: flag.key, 
          success: false, 
          message: error.message 
        });
        console.error(`Failed to enable ${flag.key}:`, error.message);
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    console.log(`Phase ${phaseNumber} activation: ${successCount}/${results.length} features enabled`);
    
    return {
      phase: phaseNumber,
      results,
      successCount,
      totalFeatures: results.length,
      allSuccessful: successCount === results.length
    };
  }
  
  /**
   * Disable all features for a specific phase (rollback)
   */
  async rollbackPhase(phaseNumber, reason = 'phase_rollback') {
    const phaseFeatures = Array.from(this.flags.values())
      .filter(flag => flag.phase === phaseNumber && flag.enabled)
      .sort((a, b) => b.phase - a.phase); // Reverse order for rollback
    
    const results = [];
    
    console.log(`Rolling back Phase ${phaseNumber} features...`);
    
    for (const flag of phaseFeatures) {
      try {
        const result = await this.disableFeature(flag.key, reason);
        results.push({ feature: flag.key, ...result });
      } catch (error) {
        results.push({ 
          feature: flag.key, 
          success: false, 
          message: error.message 
        });
        console.error(`Failed to rollback ${flag.key}:`, error.message);
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    console.log(`Phase ${phaseNumber} rollback: ${successCount}/${results.length} features disabled`);
    
    return {
      phase: phaseNumber,
      results,
      successCount,
      totalFeatures: results.length,
      allSuccessful: successCount === results.length
    };
  }
  
  /**
   * Validate feature dependencies
   */
  validateDependencies(featureKey) {
    const flag = this.flags.get(featureKey);
    if (!flag) {
      return { valid: false, missing: ['feature_not_found'] };
    }
    
    const missing = [];
    
    for (const depKey of flag.dependencies) {
      const depFlag = this.flags.get(depKey);
      if (!depFlag || !depFlag.enabled) {
        missing.push(depKey);
      }
    }
    
    return {
      valid: missing.length === 0,
      missing
    };
  }
  
  /**
   * Get features that depend on the given feature
   */
  getFeatureDependents(featureKey) {
    const dependents = [];
    
    for (const [key, flag] of this.flags) {
      if (flag.dependencies.includes(featureKey) && flag.enabled) {
        dependents.push(key);
      }
    }
    
    return dependents;
  }
  
  /**
   * Get current rollout status
   */
  getRolloutStatus() {
    const phases = {};
    
    for (let phase = 1; phase <= 3; phase++) {
      const phaseFeatures = Array.from(this.flags.values()).filter(f => f.phase === phase);
      const enabledFeatures = phaseFeatures.filter(f => f.enabled);
      
      phases[phase] = {
        total: phaseFeatures.length,
        enabled: enabledFeatures.length,
        progress: phaseFeatures.length > 0 ? (enabledFeatures.length / phaseFeatures.length) * 100 : 0,
        complete: enabledFeatures.length === phaseFeatures.length && phaseFeatures.length > 0,
        features: phaseFeatures.map(f => ({
          key: f.key,
          name: f.name,
          enabled: f.enabled,
          activatedAt: f.activatedAt
        }))
      };
    }
    
    const totalFeatures = Array.from(this.flags.values()).length;
    const enabledFeatures = Array.from(this.flags.values()).filter(f => f.enabled).length;
    
    return {
      overall: {
        progress: totalFeatures > 0 ? (enabledFeatures / totalFeatures) * 100 : 0,
        totalFeatures,
        enabledFeatures,
        complete: enabledFeatures === totalFeatures && totalFeatures > 0
      },
      phases,
      metrics: this.rolloutMetrics
    };
  }
  
  /**
   * Subscribe to feature flag changes
   */
  subscribe(callback) {
    const subscriberId = Math.random().toString(36).substr(2, 9);
    this.subscribers.set(subscriberId, callback);
    return subscriberId;
  }
  
  /**
   * Unsubscribe from feature flag changes
   */
  unsubscribe(subscriberId) {
    return this.subscribers.delete(subscriberId);
  }
  
  /**
   * Notify subscribers of feature changes
   */
  notifySubscribers(featureKey, enabled) {
    const flag = this.flags.get(featureKey);
    const event = {
      featureKey,
      enabled,
      flag: flag ? { 
        name: flag.name, 
        phase: flag.phase,
        impactLevel: flag.impactLevel 
      } : null,
      timestamp: new Date().toISOString()
    };
    
    this.subscribers.forEach((callback, subscriberId) => {
      try {
        callback(event);
      } catch (error) {
        console.error(`Feature flag subscriber error (${subscriberId}):`, error);
      }
    });
  }
  
  /**
   * Record performance impact of feature activation
   */
  recordPerformanceImpact(featureKey, metrics) {
    this.rolloutMetrics.performanceImpacts.push({
      featureKey,
      timestamp: new Date().toISOString(),
      ...metrics
    });
    
    this.saveConfiguration();
  }
  
  /**
   * Record error event during feature operation
   */
  recordErrorEvent(featureKey, error) {
    this.rolloutMetrics.errorEvents.push({
      featureKey,
      timestamp: new Date().toISOString(),
      error: error.message,
      stack: error.stack
    });
    
    this.saveConfiguration();
  }
  
  /**
   * Get feature flag for use in conditional logic
   */
  getFeatureConfig(featureKey) {
    const flag = this.flags.get(featureKey);
    return flag ? {
      enabled: flag.enabled,
      name: flag.name,
      phase: flag.phase,
      impactLevel: flag.impactLevel,
      activatedAt: flag.activatedAt
    } : null;
  }
}

// Create singleton instance
let featureFlagManager = null;

/**
 * Get the singleton feature flag manager instance
 */
function getFeatureFlagManager() {
  if (!featureFlagManager) {
    featureFlagManager = new FeatureFlagManager();
  }
  return featureFlagManager;
}

/**
 * Utility functions for easy feature checking
 */
function isFeatureEnabled(featureKey) {
  return getFeatureFlagManager().isEnabled(featureKey);
}

function withFeatureFlag(featureKey, enabledCallback, disabledCallback = null) {
  if (isFeatureEnabled(featureKey)) {
    return enabledCallback();
  } else if (disabledCallback) {
    return disabledCallback();
  }
  return null;
}

module.exports = {
  FeatureFlagManager,
  FEATURE_FLAGS,
  getFeatureFlagManager,
  isFeatureEnabled,
  withFeatureFlag
};