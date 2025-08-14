#!/usr/bin/env node

/**
 * APM Debug Host MCP Server CLI
 * Command-line interface for MCP configuration, health checks, and management
 */

const MCPConfigGenerator = require('./src/mcp-config-generator');
const HealthChecker = require('./src/health-checker');
const RollbackManager = require('./src/rollback-manager');
const path = require('path');
const fs = require('fs').promises;

class MCPCLI {
    constructor() {
        this.commands = {
            'generate-config': this.generateConfig.bind(this),
            'health-check': this.healthCheck.bind(this),
            'install': this.install.bind(this),
            'uninstall': this.uninstall.bind(this),
            'rollback': this.rollback.bind(this),
            'status': this.status.bind(this),
            'help': this.help.bind(this)
        };
    }

    /**
     * Main CLI entry point
     */
    async run() {
        const args = process.argv.slice(2);
        const command = args[0] || 'help';
        const options = this.parseOptions(args.slice(1));

        if (!this.commands[command]) {
            console.error(`Unknown command: ${command}`);
            this.help();
            process.exit(1);
        }

        try {
            await this.commands[command](options);
        } catch (error) {
            console.error(`Error: ${error.message}`);
            if (options.verbose) {
                console.error(error.stack);
            }
            process.exit(1);
        }
    }

    /**
     * Generate MCP configuration
     */
    async generateConfig(options) {
        console.log('🔧 Generating MCP configuration...');
        
        const generator = new MCPConfigGenerator();
        const config = generator.generateConfig({
            environment: options.environment || 'development',
            serverPort: options.port || 8080,
            mcpPort: options.mcpPort || 3000,
            projectPath: options.projectPath || process.cwd(),
            enableLogging: !options.quiet,
            serverName: options.serverName || 'apm-debug-host'
        });

        // Validate configuration
        const validation = generator.validateConfig(config);
        if (!validation.valid) {
            console.error('❌ Configuration validation failed:');
            validation.errors.forEach(error => console.error(`  - ${error}`));
            process.exit(1);
        }

        if (validation.warnings.length > 0) {
            console.warn('⚠️  Configuration warnings:');
            validation.warnings.forEach(warning => console.warn(`  - ${warning}`));
        }

        // Write configuration
        const configPath = options.output || generator.getDefaultConfigPath();
        await generator.writeConfig(config, configPath);

        console.log(`✅ MCP configuration generated: ${configPath}`);
        
        if (options.verbose) {
            console.log('\n📋 Configuration summary:');
            console.log(`  Server: ${config.mcpServers[options.serverName || 'apm-debug-host'].description}`);
            console.log(`  Port: ${config.mcpServers[options.serverName || 'apm-debug-host'].env.PORT}`);
            console.log(`  Environment: ${config.mcpServers[options.serverName || 'apm-debug-host'].env.ENVIRONMENT}`);
            console.log(`  Capabilities: ${config.mcpServers[options.serverName || 'apm-debug-host'].capabilities.length} tools`);
        }

        return { success: true, configPath, config };
    }

    /**
     * Run health check
     */
    async healthCheck(options) {
        console.log('🔍 Running health check...');
        
        const checker = new HealthChecker({
            verbose: options.verbose,
            timeout: options.timeout || 10000
        });

        const results = await checker.runHealthCheck();
        
        // Display results
        console.log(checker.generateReport());
        
        // Exit with appropriate code
        const exitCode = results.overall === 'critical' ? 1 : 0;
        if (exitCode !== 0) {
            console.log('❌ Health check failed - see issues above');
        } else {
            console.log('✅ Health check passed');
        }

        if (options.json) {
            await fs.writeFile(
                options.output || 'health-report.json',
                JSON.stringify(results, null, 2)
            );
        }

        return results;
    }

    /**
     * Install MCP server
     */
    async install(options) {
        console.log('📦 Installing APM Debug Host MCP Server...');
        
        // Run health check first
        const healthResults = await this.healthCheck({ ...options, quiet: true });
        if (healthResults.overall === 'critical') {
            console.error('❌ Pre-installation health check failed');
            return { success: false, error: 'Health check failed' };
        }

        // Generate configuration
        const configResult = await this.generateConfig({
            ...options,
            quiet: true
        });

        if (!configResult.success) {
            console.error('❌ Configuration generation failed');
            return { success: false, error: 'Configuration failed' };
        }

        console.log('✅ Installation completed successfully');
        console.log(`📝 Configuration: ${configResult.configPath}`);
        console.log('🚀 Start the server with: npm start');
        
        return { success: true, configPath: configResult.configPath };
    }

    /**
     * Uninstall MCP server
     */
    async uninstall(options) {
        console.log('🗑️  Uninstalling APM Debug Host MCP Server...');
        
        if (!options.force) {
            console.log('⚠️  This will remove all MCP server files, configurations, and data.');
            console.log('Use --force to confirm uninstallation.');
            return { success: false, error: 'Confirmation required' };
        }

        const rollbackManager = new RollbackManager({
            verbose: options.verbose,
            dryRun: options.dryRun
        });

        const result = await rollbackManager.uninstall();
        
        if (result.success) {
            console.log('✅ Uninstallation completed successfully');
        } else {
            console.error(`❌ Uninstallation failed: ${result.error}`);
        }

        if (options.verbose) {
            console.log(rollbackManager.generateReport());
        }

        return result;
    }

    /**
     * Rollback installation
     */
    async rollback(options) {
        console.log('↩️  Rolling back installation...');
        
        const rollbackManager = new RollbackManager({
            verbose: options.verbose,
            dryRun: options.dryRun
        });

        // Try to load installation state
        let installationState = {};
        if (options.state) {
            try {
                const stateData = await fs.readFile(options.state, 'utf8');
                installationState = JSON.parse(stateData);
            } catch (e) {
                console.warn('⚠️  Could not load installation state, performing best-effort rollback');
            }
        }

        const result = await rollbackManager.rollbackInstallation(installationState);
        
        if (result.success) {
            console.log('✅ Rollback completed successfully');
        } else {
            console.error(`❌ Rollback failed: ${result.error}`);
        }

        if (options.verbose) {
            console.log(rollbackManager.generateReport());
        }

        return result;
    }

    /**
     * Show status
     */
    async status(options) {
        console.log('📊 APM Debug Host MCP Server Status');
        console.log('=' .repeat(40));
        
        // Check if server is running
        const isRunning = await this.checkServerStatus();
        console.log(`Server Status: ${isRunning ? '🟢 Running' : '🔴 Stopped'}`);
        
        // Check configuration
        const generator = new MCPConfigGenerator();
        const configPath = generator.getDefaultConfigPath();
        
        try {
            await fs.access(configPath);
            console.log(`Configuration: 🟢 Found (${configPath})`);
        } catch (e) {
            console.log(`Configuration: 🔴 Not found`);
        }

        // Quick health check
        const checker = new HealthChecker({ verbose: false });
        const health = await checker.runHealthCheck();
        
        const statusSymbol = {
            healthy: '🟢',
            warning: '🟡',
            critical: '🔴',
            unknown: '❓'
        }[health.overall];
        
        console.log(`Overall Health: ${statusSymbol} ${health.overall.toUpperCase()}`);
        
        if (options.verbose) {
            console.log('\n📋 Detailed Health Report:');
            console.log(checker.generateReport());
        }

        return { isRunning, configExists: true, health: health.overall };
    }

    /**
     * Show help
     */
    async help() {
        console.log(`
🔧 APM Debug Host MCP Server CLI

USAGE:
  node cli.js <command> [options]

COMMANDS:
  generate-config    Generate .mcp.json configuration file
  health-check      Run comprehensive health check
  install           Install and configure MCP server
  uninstall         Completely remove MCP server
  rollback          Rollback failed installation
  status            Show server status and health
  help              Show this help message

OPTIONS:
  --environment     Environment (development|staging|production)
  --port            Server port (default: 8080)
  --mcp-port        MCP protocol port (default: 3000)
  --server-name     MCP server name (default: apm-debug-host)
  --project-path    Project root path (default: current directory)
  --output          Output file path
  --verbose         Show detailed output
  --quiet           Suppress non-essential output
  --force           Force operation (for uninstall)
  --dry-run         Show what would be done without executing
  --json            Output results in JSON format
  --timeout         Operation timeout in milliseconds
  --state           Path to installation state file (for rollback)

EXAMPLES:
  # Generate development configuration
  node cli.js generate-config --environment development --port 8080

  # Run health check with detailed output
  node cli.js health-check --verbose

  # Install with custom configuration
  node cli.js install --environment production --port 3000

  # Check status
  node cli.js status

  # Uninstall (requires confirmation)
  node cli.js uninstall --force

For more information, visit: https://docs.apm-framework.com/mcp-debug-host
        `);
    }

    /**
     * Parse command line options
     */
    parseOptions(args) {
        const options = {};
        
        for (let i = 0; i < args.length; i++) {
            const arg = args[i];
            
            if (arg.startsWith('--')) {
                const key = arg.slice(2).replace(/-/g, '_');
                const nextArg = args[i + 1];
                
                if (nextArg && !nextArg.startsWith('--')) {
                    options[key] = nextArg;
                    i++;
                } else {
                    options[key] = true;
                }
            }
        }
        
        return options;
    }

    /**
     * Check if server is currently running
     */
    async checkServerStatus() {
        try {
            const http = require('http');
            return new Promise((resolve) => {
                const req = http.get('http://localhost:8080/api/health', (res) => {
                    resolve(res.statusCode === 200);
                });
                
                req.on('error', () => resolve(false));
                req.setTimeout(3000, () => {
                    req.destroy();
                    resolve(false);
                });
            });
        } catch (e) {
            return false;
        }
    }
}

// Run CLI if called directly
if (require.main === module) {
    const cli = new MCPCLI();
    cli.run();
}

module.exports = MCPCLI;