/**
 * Configuration Manager for MCP Debug Host Server
 * Handles configuration loading, validation, API key generation, and secure storage
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const os = require('os');

class ConfigManager {
  constructor(logger) {
    this.logger = logger;
    this.configCache = new Map();
    this.configWatchers = new Map();
  }

  /**
   * Generate a secure API key
   * @param {number} length - Key length (default: 64)
   * @returns {string} Generated API key
   */
  generateApiKey(length = 64) {
    return crypto.randomBytes(Math.ceil(length / 2))
      .toString('hex')
      .slice(0, length);
  }

  /**
   * Generate a secure password
   * @param {number} length - Password length (default: 16)
   * @returns {string} Generated password
   */
  generateSecurePassword(length = 16) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  /**
   * Create default environment values
   * @param {string} environment - Target environment (dev, staging, production)
   * @returns {Object} Default environment configuration
   */
  createDefaultEnvValues(environment = 'production') {
    const mcpHome = path.join(os.homedir(), '.apm-debug-host');
    const apiKey = this.generateApiKey();
    const dashboardPassword = this.generateSecurePassword();

    const defaults = {
      // Environment & Deployment
      ENVIRONMENT: environment,
      NODE_ENV: environment,
      DEBUG_MODE: environment === 'development' ? 'true' : 'false',
      VERBOSE_LOGGING: environment === 'development' ? 'true' : 'false',

      // Server Configuration
      PORT: '8080',
      HOST: '0.0.0.0',
      PROTOCOL: 'http',
      MAX_REQUEST_SIZE: '10mb',
      REQUEST_TIMEOUT: '30000',
      KEEP_ALIVE_TIMEOUT: '65000',

      // Security Settings
      API_KEY: apiKey,
      ENABLE_CORS: 'true',
      ALLOWED_ORIGINS: '*',
      RATE_LIMIT_ENABLED: 'true',
      RATE_LIMIT_WINDOW: '900000', // 15 minutes
      RATE_LIMIT_MAX_REQUESTS: '100',
      AUTH_ENABLED: 'false',
      TOKEN_EXPIRY: '3600', // 1 hour
      REFRESH_TOKEN_EXPIRY: '604800', // 7 days

      // Storage & Logging
      MCP_HOME: mcpHome,
      LOG_LEVEL: environment === 'development' ? 'debug' : 'info',
      LOG_DIR: path.join(mcpHome, 'logs'),
      MAX_LOG_SIZE: '104857600', // 100MB
      MAX_LOG_FILES: '10',
      LOG_ROTATION: 'daily',
      LOG_RETENTION: '30d',
      LOG_COMPRESSION: 'gzip',
      LOG_FORMAT: 'json',

      // Session Storage
      SESSION_DIR: path.join(mcpHome, 'sessions'),
      MAX_SESSION_SIZE: '52428800', // 50MB
      SESSION_CLEANUP_INTERVAL: '3600000', // 1 hour

      // Cache Configuration
      CACHE_ENABLED: 'true',
      CACHE_DIR: path.join(mcpHome, 'cache'),
      CACHE_MAX_SIZE: '1073741824', // 1GB
      CACHE_TTL: '3600', // 1 hour

      // Process Management
      MAX_CONCURRENT_PROCESSES: '10',
      PROCESS_TIMEOUT: '86400000', // 24 hours
      AUTO_RESTART: 'false',
      RESTART_DELAY: '5000',
      MAX_RESTARTS: '3',
      KILL_SIGNAL: 'SIGTERM',
      KILL_TIMEOUT: '5000',
      MEMORY_LIMIT: '2048', // MB
      CPU_LIMIT: '80', // Percentage
      PROCESS_PRIORITY: '0',

      // Monitoring & Health Checks
      MONITORING_ENABLED: environment === 'production' ? 'true' : 'false',
      METRICS_INTERVAL: '60000', // 1 minute
      HEALTH_CHECK_ENABLED: 'true',
      HEALTH_CHECK_INTERVAL: '30000', // 30 seconds
      HEALTH_CHECK_TIMEOUT: '5000',

      // Alerting
      ALERTS_ENABLED: environment === 'production' ? 'true' : 'false',
      MEMORY_ALERT_THRESHOLD: '85',
      MEMORY_ALERT_ACTION: 'log',
      CPU_ALERT_THRESHOLD: '90',
      CPU_ALERT_ACTION: 'log',
      DISK_ALERT_THRESHOLD: '90',
      DISK_ALERT_ACTION: 'log',

      // Project Detection
      DETECTION_ENABLED: 'true',
      SCAN_DEPTH: '3',
      CACHE_DETECTION_RESULTS: 'true',

      // Dashboard Settings
      DASHBOARD_ENABLED: 'true',
      DASHBOARD_TITLE: 'APM Debug Host Dashboard',
      DASHBOARD_THEME: 'dark',
      DASHBOARD_LOG_BUFFER: '2000',
      DASHBOARD_AUTO_SCROLL: 'true',
      DASHBOARD_REFRESH_INTERVAL: '5000',
      DASHBOARD_MAX_CONNECTIONS: '50',

      // Dashboard Authentication
      DASHBOARD_AUTH_ENABLED: environment === 'production' ? 'true' : 'false',
      DASHBOARD_USERNAME: 'admin',
      DASHBOARD_PASSWORD: dashboardPassword,

      // Dashboard Features
      DASHBOARD_REAL_TIME: 'true',
      DASHBOARD_DOWNLOAD_LOGS: 'true',
      DASHBOARD_PROCESS_CONTROLS: 'true',
      DASHBOARD_SYSTEM_METRICS: 'true',

      // Integrations
      CLAUDE_INTEGRATION_ENABLED: 'true',
      CLAUDE_API_VERSION: '2024-01-01',
      CLAUDE_MAX_TOKENS: '4096',
      WEBHOOKS_ENABLED: 'false',
      WEBHOOK_ENDPOINTS: '',
      WEBHOOK_TIMEOUT: '10000',
      WEBHOOK_RETRIES: '3',
      NOTIFICATIONS_ENABLED: 'false',
      NOTIFICATION_CHANNELS: 'email,slack',
      NOTIFICATION_EVENTS: 'error,restart,deploy',

      // Development Settings
      HOT_RELOAD: environment === 'development' ? 'true' : 'false',
      PROFILING_ENABLED: 'false',
      MOCK_DATA_ENABLED: environment === 'development' ? 'true' : 'false',

      // Backup Configuration
      BACKUP_ENABLED: environment === 'production' ? 'true' : 'false',
      BACKUP_INTERVAL: '86400000', // 24 hours
      BACKUP_RETENTION: '30d',
      BACKUP_COMPRESSION: 'gzip',
      BACKUP_DESTINATION: path.join(mcpHome, 'backups')
    };

    return defaults;
  }

  /**
   * Replace template placeholders with actual values
   * @param {string} template - Template string with {{PLACEHOLDER}} syntax
   * @param {Object} values - Values to replace placeholders
   * @returns {string} Processed string
   */
  processTemplate(template, values) {
    return template.replace(/{{([^}]+)}}/g, (match, key) => {
      return values[key] || match;
    });
  }

  /**
   * Load and process configuration template
   * @param {string} templatePath - Path to config template
   * @param {string} environment - Target environment
   * @returns {Promise<Object>} Processed configuration
   */
  async loadConfigTemplate(templatePath, environment = 'production') {
    try {
      const templateContent = await fs.readFile(templatePath, 'utf8');
      const envValues = this.createDefaultEnvValues(environment);
      const processedContent = this.processTemplate(templateContent, envValues);
      
      return {
        config: JSON.parse(processedContent),
        envValues,
        generatedKeys: {
          apiKey: envValues.API_KEY,
          dashboardPassword: envValues.DASHBOARD_PASSWORD
        }
      };
    } catch (error) {
      this.logger?.error('Failed to load config template:', error);
      throw new Error(`Configuration template processing failed: ${error.message}`);
    }
  }

  /**
   * Save environment file
   * @param {string} envPath - Path to save .env file
   * @param {Object} envValues - Environment values
   * @returns {Promise<void>}
   */
  async saveEnvFile(envPath, envValues) {
    try {
      // Read template if it exists
      const templatePath = `${envPath}.template`;
      let template;
      
      try {
        template = await fs.readFile(templatePath, 'utf8');
      } catch (error) {
        // Create basic template if none exists
        template = Object.keys(envValues)
          .map(key => `${key}={{${key}}}`)
          .join('\n');
      }

      const processedContent = this.processTemplate(template, envValues);
      await fs.writeFile(envPath, processedContent, { mode: 0o600 }); // Secure permissions
      
      this.logger?.info(`Environment file saved: ${envPath}`);
    } catch (error) {
      this.logger?.error('Failed to save environment file:', error);
      throw error;
    }
  }

  /**
   * Validate configuration against schema
   * @param {Object} config - Configuration to validate
   * @returns {Object} Validation result
   */
  validateConfig(config) {
    const errors = [];
    const warnings = [];

    // Required fields validation
    const requiredFields = [
      'version',
      'server.port',
      'security.apiKey',
      'storage.logs.path'
    ];

    for (const field of requiredFields) {
      if (!this.getNestedValue(config, field)) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    // Port validation
    const port = parseInt(config.server?.port);
    if (isNaN(port) || port < 1 || port > 65535) {
      errors.push('Server port must be a valid number between 1 and 65535');
    }

    // API key validation
    const apiKey = config.security?.apiKey;
    if (apiKey && apiKey.length < 32) {
      warnings.push('API key should be at least 32 characters long for security');
    }

    // Memory limit validation
    const memoryLimit = parseInt(config.processes?.memoryLimit);
    if (memoryLimit && memoryLimit < 256) {
      warnings.push('Memory limit below 256MB may cause stability issues');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Get nested object value by dot notation
   * @param {Object} obj - Object to search
   * @param {string} path - Dot notation path
   * @returns {*} Found value or undefined
   */
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  /**
   * Secure configuration storage
   * @param {string} configPath - Path to store configuration
   * @param {Object} config - Configuration object
   * @returns {Promise<void>}
   */
  async secureStoreConfig(configPath, config) {
    try {
      // Ensure directory exists
      await fs.mkdir(path.dirname(configPath), { recursive: true });
      
      // Write with secure permissions
      await fs.writeFile(
        configPath, 
        JSON.stringify(config, null, 2), 
        { mode: 0o600 }
      );
      
      this.logger?.info(`Configuration securely stored: ${configPath}`);
    } catch (error) {
      this.logger?.error('Failed to store configuration:', error);
      throw error;
    }
  }

  /**
   * Generate installation-specific configuration
   * @param {string} installDir - Installation directory
   * @param {string} environment - Target environment
   * @returns {Promise<Object>} Installation configuration
   */
  async generateInstallConfig(installDir, environment = 'production') {
    const templatePath = path.join(installDir, 'config.json.template');
    const envTemplatePath = path.join(installDir, '.env.template');
    
    // Load and process configuration
    const { config, envValues, generatedKeys } = await this.loadConfigTemplate(
      templatePath, 
      environment
    );
    
    // Validate configuration
    const validation = this.validateConfig(config);
    if (!validation.valid) {
      throw new Error(`Configuration validation failed: ${validation.errors.join(', ')}`);
    }
    
    // Create target paths
    const mcpHome = envValues.MCP_HOME;
    const configPath = path.join(mcpHome, 'config.json');
    const envPath = path.join(mcpHome, '.env');
    
    // Ensure MCP home directory exists
    await fs.mkdir(mcpHome, { recursive: true, mode: 0o700 });
    
    // Save configuration files
    await this.secureStoreConfig(configPath, config);
    await this.saveEnvFile(envPath, envValues);
    
    return {
      configPath,
      envPath,
      mcpHome,
      generatedKeys,
      validation
    };
  }

  /**
   * Load runtime configuration
   * @param {string} configPath - Path to configuration file
   * @returns {Promise<Object>} Loaded configuration
   */
  async loadConfig(configPath) {
    try {
      const cacheKey = configPath;
      
      // Check cache first
      if (this.configCache.has(cacheKey)) {
        const cached = this.configCache.get(cacheKey);
        const stats = await fs.stat(configPath);
        
        // Return cached if file hasn't changed
        if (cached.mtime >= stats.mtime) {
          return cached.config;
        }
      }
      
      // Load fresh configuration
      const content = await fs.readFile(configPath, 'utf8');
      const config = JSON.parse(content);
      const stats = await fs.stat(configPath);
      
      // Cache configuration
      this.configCache.set(cacheKey, {
        config,
        mtime: stats.mtime
      });
      
      // Validate loaded configuration
      const validation = this.validateConfig(config);
      if (validation.warnings.length > 0) {
        this.logger?.warn('Configuration warnings:', validation.warnings);
      }
      
      return config;
    } catch (error) {
      this.logger?.error('Failed to load configuration:', error);
      throw error;
    }
  }

  /**
   * Watch configuration file for changes
   * @param {string} configPath - Path to configuration file
   * @param {Function} callback - Callback function for changes
   * @returns {Function} Unwatch function
   */
  watchConfig(configPath, callback) {
    if (this.configWatchers.has(configPath)) {
      return this.configWatchers.get(configPath).unwatch;
    }

    const watcher = fs.watch(configPath, async (eventType) => {
      if (eventType === 'change') {
        try {
          // Clear cache
          this.configCache.delete(configPath);
          
          // Load new configuration
          const config = await this.loadConfig(configPath);
          callback(config);
        } catch (error) {
          this.logger?.error('Failed to reload configuration:', error);
        }
      }
    });

    const unwatch = () => {
      watcher.close();
      this.configWatchers.delete(configPath);
    };

    this.configWatchers.set(configPath, { watcher, unwatch });
    return unwatch;
  }

  /**
   * Clean up resources
   */
  destroy() {
    // Close all config watchers
    for (const [path, { watcher }] of this.configWatchers) {
      watcher.close();
    }
    
    this.configWatchers.clear();
    this.configCache.clear();
  }
}

module.exports = ConfigManager;