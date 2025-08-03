#!/usr/bin/env node

/**
 * MCP Debug Host Configuration Setup Script
 * Handles configuration generation, validation, and deployment-specific setup
 */

const ConfigManager = require('../src/config-manager');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const os = require('os');

class ConfigSetup {
  constructor() {
    this.configManager = new ConfigManager(console);
    this.installDir = path.resolve(__dirname, '..');
  }

  /**
   * Display usage information
   */
  showUsage() {
    console.log(`
MCP Debug Host Configuration Setup

Usage:
  node config-setup.js <command> [options]

Commands:
  generate <env>    Generate configuration for environment (dev|staging|production)
  validate <file>   Validate configuration file
  keys             Generate new API keys and passwords
  deploy <env>     Deploy configuration to MCP home directory
  backup           Backup existing configuration
  restore <file>   Restore configuration from backup

Options:
  --output <dir>   Output directory (default: current directory)
  --force          Overwrite existing files
  --quiet          Suppress output
  --help           Show this help message

Examples:
  node config-setup.js generate production
  node config-setup.js validate ~/.apm-debug-host/config.json
  node config-setup.js keys
  node config-setup.js deploy staging --force
    `);
  }

  /**
   * Generate configuration for specific environment
   */
  async generateConfig(environment = 'production', options = {}) {
    try {
      console.log(`🔧 Generating ${environment} configuration...`);
      
      const outputDir = options.output || process.cwd();
      const templatePath = path.join(this.installDir, 'config.json.template');
      
      // Check if template exists
      try {
        await fs.access(templatePath);
      } catch (error) {
        throw new Error(`Configuration template not found: ${templatePath}`);
      }

      // Generate configuration
      const result = await this.configManager.generateInstallConfig(
        this.installDir, 
        environment
      );

      // Copy to output directory if different from MCP home
      if (outputDir !== path.dirname(result.configPath)) {
        const outputConfigPath = path.join(outputDir, 'config.json');
        const outputEnvPath = path.join(outputDir, '.env');
        
        await fs.copyFile(result.configPath, outputConfigPath);
        await fs.copyFile(result.envPath, outputEnvPath);
        
        console.log(`✅ Configuration files generated:`);
        console.log(`   Config: ${outputConfigPath}`);
        console.log(`   Environment: ${outputEnvPath}`);
      } else {
        console.log(`✅ Configuration deployed to: ${result.mcpHome}`);
      }

      // Display generated keys
      console.log(`\n🔑 Generated Security Keys:`);
      console.log(`   API Key: ${result.generatedKeys.apiKey}`);
      console.log(`   Dashboard Password: ${result.generatedKeys.dashboardPassword}`);
      
      // Display validation results
      if (result.validation.warnings.length > 0) {
        console.log(`\n⚠️  Configuration Warnings:`);
        result.validation.warnings.forEach(warning => {
          console.log(`   - ${warning}`);
        });
      }

      console.log(`\n🎯 Configuration generated successfully for ${environment} environment!`);
      
      return result;
    } catch (error) {
      console.error(`❌ Failed to generate configuration: ${error.message}`);
      process.exit(1);
    }
  }

  /**
   * Validate configuration file
   */
  async validateConfig(configPath) {
    try {
      console.log(`🔍 Validating configuration: ${configPath}`);
      
      const config = await this.configManager.loadConfig(configPath);
      const validation = this.configManager.validateConfig(config);
      
      if (validation.valid) {
        console.log(`✅ Configuration is valid!`);
        
        if (validation.warnings.length > 0) {
          console.log(`\n⚠️  Warnings:`);
          validation.warnings.forEach(warning => {
            console.log(`   - ${warning}`);
          });
        }
      } else {
        console.log(`❌ Configuration validation failed:`);
        validation.errors.forEach(error => {
          console.log(`   - ${error}`);
        });
        process.exit(1);
      }
      
      return validation;
    } catch (error) {
      console.error(`❌ Validation failed: ${error.message}`);
      process.exit(1);
    }
  }

  /**
   * Generate new API keys and passwords
   */
  generateKeys() {
    console.log(`🔑 Generating new security keys...`);
    
    const apiKey = this.configManager.generateApiKey(64);
    const dashboardPassword = this.configManager.generateSecurePassword(16);
    const backupEncryptionKey = this.configManager.generateApiKey(32);
    
    console.log(`\n🔐 Generated Security Keys:`);
    console.log(`   API Key: ${apiKey}`);
    console.log(`   Dashboard Password: ${dashboardPassword}`);
    console.log(`   Backup Encryption Key: ${backupEncryptionKey}`);
    
    console.log(`\n📝 Update your .env file with these values:`);
    console.log(`   API_KEY=${apiKey}`);
    console.log(`   DASHBOARD_PASSWORD=${dashboardPassword}`);
    
    return {
      apiKey,
      dashboardPassword,
      backupEncryptionKey
    };
  }

  /**
   * Deploy configuration to MCP home directory
   */
  async deployConfig(environment = 'production', options = {}) {
    try {
      console.log(`🚀 Deploying ${environment} configuration...`);
      
      const mcpHome = path.join(os.homedir(), '.apm-debug-host');
      const configPath = path.join(mcpHome, 'config.json');
      const envPath = path.join(mcpHome, '.env');
      
      // Check if files exist and force flag
      if (!options.force) {
        try {
          await fs.access(configPath);
          console.log(`⚠️  Configuration already exists: ${configPath}`);
          console.log(`   Use --force to overwrite`);
          process.exit(1);
        } catch (error) {
          // File doesn't exist, continue
        }
      }

      // Generate and deploy configuration
      const result = await this.generateConfig(environment, { 
        output: mcpHome,
        ...options 
      });
      
      console.log(`✅ Configuration deployed successfully!`);
      console.log(`   MCP Home: ${mcpHome}`);
      
      return result;
    } catch (error) {
      console.error(`❌ Deployment failed: ${error.message}`);
      process.exit(1);
    }
  }

  /**
   * Backup existing configuration
   */
  async backupConfig() {
    try {
      console.log(`💾 Creating configuration backup...`);
      
      const mcpHome = path.join(os.homedir(), '.apm-debug-host');
      const configPath = path.join(mcpHome, 'config.json');
      const envPath = path.join(mcpHome, '.env');
      
      // Check if configuration exists
      try {
        await fs.access(configPath);
      } catch (error) {
        console.log(`ℹ️  No configuration found to backup`);
        return null;
      }

      // Create backup directory
      const backupDir = path.join(mcpHome, 'backups');
      await fs.mkdir(backupDir, { recursive: true });
      
      // Generate backup filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPrefix = `config-backup-${timestamp}`;
      
      // Backup files
      const backupConfigPath = path.join(backupDir, `${backupPrefix}.json`);
      const backupEnvPath = path.join(backupDir, `${backupPrefix}.env`);
      
      await fs.copyFile(configPath, backupConfigPath);
      
      try {
        await fs.copyFile(envPath, backupEnvPath);
      } catch (error) {
        console.log(`⚠️  No .env file found to backup`);
      }
      
      console.log(`✅ Configuration backed up:`);
      console.log(`   Config: ${backupConfigPath}`);
      console.log(`   Environment: ${backupEnvPath}`);
      
      return {
        configBackup: backupConfigPath,
        envBackup: backupEnvPath
      };
    } catch (error) {
      console.error(`❌ Backup failed: ${error.message}`);
      process.exit(1);
    }
  }

  /**
   * Restore configuration from backup
   */
  async restoreConfig(backupPath) {
    try {
      console.log(`🔄 Restoring configuration from: ${backupPath}`);
      
      const mcpHome = path.join(os.homedir(), '.apm-debug-host');
      const configPath = path.join(mcpHome, 'config.json');
      
      // Validate backup file
      await this.validateConfig(backupPath);
      
      // Create backup of current config
      await this.backupConfig();
      
      // Restore configuration
      await fs.copyFile(backupPath, configPath);
      
      console.log(`✅ Configuration restored successfully!`);
      
      return { configPath };
    } catch (error) {
      console.error(`❌ Restore failed: ${error.message}`);
      process.exit(1);
    }
  }

  /**
   * Main command processor
   */
  async run() {
    const args = process.argv.slice(2);
    
    if (args.length === 0 || args.includes('--help')) {
      this.showUsage();
      return;
    }

    const command = args[0];
    const options = this.parseOptions(args.slice(1));
    
    try {
      switch (command) {
        case 'generate':
          const env = args[1] || 'production';
          await this.generateConfig(env, options);
          break;
          
        case 'validate':
          const configFile = args[1];
          if (!configFile) {
            console.error('❌ Configuration file path required');
            process.exit(1);
          }
          await this.validateConfig(configFile);
          break;
          
        case 'keys':
          this.generateKeys();
          break;
          
        case 'deploy':
          const deployEnv = args[1] || 'production';
          await this.deployConfig(deployEnv, options);
          break;
          
        case 'backup':
          await this.backupConfig();
          break;
          
        case 'restore':
          const backupFile = args[1];
          if (!backupFile) {
            console.error('❌ Backup file path required');
            process.exit(1);
          }
          await this.restoreConfig(backupFile);
          break;
          
        default:
          console.error(`❌ Unknown command: ${command}`);
          this.showUsage();
          process.exit(1);
      }
    } catch (error) {
      console.error(`❌ Command failed: ${error.message}`);
      process.exit(1);
    }
  }

  /**
   * Parse command line options
   */
  parseOptions(args) {
    const options = {};
    
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      
      if (arg === '--force') {
        options.force = true;
      } else if (arg === '--quiet') {
        options.quiet = true;
      } else if (arg === '--output') {
        options.output = args[++i];
      }
    }
    
    return options;
  }
}

// Run if called directly
if (require.main === module) {
  const setup = new ConfigSetup();
  setup.run().catch(error => {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  });
}

module.exports = ConfigSetup;