/**
 * MCP Configuration Generator
 * Generates .mcp.json files for Claude Code integration with APM Debug Host Server
 */

const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const { v4: uuidv4 } = require('uuid');

class MCPConfigGenerator {
    constructor() {
        this.configTemplates = {
            development: this.getDevelopmentTemplate(),
            staging: this.getStagingTemplate(),
            production: this.getProductionTemplate()
        };
    }

    /**
     * Generate complete .mcp.json configuration for Claude Code
     * @param {Object} options - Configuration options
     * @returns {Object} MCP configuration object
     */
    generateConfig(options = {}) {
        const {
            environment = 'development',
            serverPort = 8080,
            mcpPort = 3000,
            projectPath = process.cwd(),
            claudeCodePath = this.detectClaudeCodePath(),
            serverName = 'apm-debug-host',
            enableLogging = true,
            apiKey = this.generateApiKey()
        } = options;

        const config = {
            mcpServers: {
                [serverName]: {
                    command: "node",
                    args: [
                        path.join(__dirname, "../index.js")
                    ],
                    env: {
                        PORT: serverPort.toString(),
                        MCP_PORT: mcpPort.toString(),
                        ENVIRONMENT: environment,
                        PROJECT_PATH: projectPath,
                        API_KEY: apiKey,
                        LOG_LEVEL: enableLogging ? "info" : "error",
                        NODE_ENV: environment
                    },
                    description: "APM Debug Host MCP Server for persistent process management",
                    version: "1.0.0",
                    capabilities: [
                        "server:start",
                        "server:stop", 
                        "server:logs",
                        "server:status",
                        "tech-stack:detect",
                        "dashboard:access"
                    ],
                    configuration: {
                        dashboard: {
                            enabled: true,
                            url: `http://localhost:${serverPort}`,
                            autoOpen: false
                        },
                        techStack: {
                            autoDetect: true,
                            supportedFrameworks: [
                                "react", "nextjs", "vue", "angular", "svelte",
                                "express", "fastify", "django", "flask", "fastapi",
                                "laravel", "symfony", "rails", "spring"
                            ]
                        },
                        logging: {
                            enabled: enableLogging,
                            level: enableLogging ? "info" : "error",
                            retention: "7d",
                            maxSize: "10MB"
                        },
                        processes: {
                            maxConcurrent: 10,
                            autoRestart: true,
                            timeout: 30000
                        }
                    },
                    metadata: {
                        author: "APM Framework",
                        repository: "https://github.com/apm-framework/debug-host-mcp",
                        documentation: "https://docs.apm-framework.com/mcp-debug-host",
                        license: "MIT",
                        tags: ["development", "debugging", "process-management", "apm"],
                        generated: new Date().toISOString(),
                        generatedBy: "APM Installer v3.3.0"
                    }
                }
            },
            // Claude Code specific configuration
            claudeCode: {
                integration: {
                    enabled: true,
                    serverName: serverName,
                    autoConnect: true,
                    features: {
                        persistentServers: true,
                        realTimeLogging: true,
                        techStackDetection: true,
                        dashboardAccess: true
                    }
                },
                shortcuts: {
                    "start-server": `server:start`,
                    "stop-server": `server:stop`,
                    "view-logs": `server:logs`,
                    "server-status": `server:status`,
                    "open-dashboard": `dashboard:access`
                },
                notifications: {
                    enabled: true,
                    events: ["server_started", "server_stopped", "error_occurred"],
                    sound: true
                }
            },
            // Environment-specific configurations
            environments: {
                development: this.configTemplates.development,
                staging: this.configTemplates.staging,
                production: this.configTemplates.production
            },
            // Global settings
            global: {
                version: "1.0.0",
                configVersion: "1.0",
                lastUpdated: new Date().toISOString(),
                platform: os.platform(),
                nodeVersion: process.version,
                installationId: uuidv4()
            }
        };

        return config;
    }

    /**
     * Write .mcp.json configuration to file
     * @param {Object} config - MCP configuration object
     * @param {string} outputPath - Path to write configuration file
     * @returns {Promise<string>} Path to written configuration file
     */
    async writeConfig(config, outputPath = null) {
        const configPath = outputPath || this.getDefaultConfigPath();
        const configDir = path.dirname(configPath);

        // Ensure directory exists
        await fs.mkdir(configDir, { recursive: true });

        // Write configuration with proper formatting
        const configJson = JSON.stringify(config, null, 2);
        await fs.writeFile(configPath, configJson, 'utf8');

        return configPath;
    }

    /**
     * Generate Claude Code specific configuration
     * @param {Object} options - Configuration options
     * @returns {Object} Claude Code specific configuration
     */
    generateClaudeCodeConfig(options = {}) {
        const {
            workspaceRoot = process.cwd(),
            serverName = 'apm-debug-host',
            autoStart = false,
            enableIntegration = true
        } = options;

        return {
            workspace: {
                root: workspaceRoot,
                mcpServers: [serverName],
                autoStart: autoStart
            },
            integration: {
                enabled: enableIntegration,
                features: {
                    persistentServers: true,
                    realTimeOutput: true,
                    processManagement: true,
                    techStackDetection: true
                }
            },
            ui: {
                showServerStatus: true,
                showDashboardLink: true,
                notifications: true,
                shortcuts: true
            }
        };
    }

    /**
     * Validate MCP configuration
     * @param {Object} config - Configuration to validate
     * @returns {Object} Validation result
     */
    validateConfig(config) {
        const errors = [];
        const warnings = [];

        // Required fields validation
        if (!config.mcpServers) {
            errors.push("Missing required field: mcpServers");
        }

        if (config.mcpServers && Object.keys(config.mcpServers).length === 0) {
            errors.push("At least one MCP server must be configured");
        }

        // Port validation
        for (const [serverName, serverConfig] of Object.entries(config.mcpServers || {})) {
            if (serverConfig.env && serverConfig.env.PORT) {
                const port = parseInt(serverConfig.env.PORT);
                if (port < 1024 || port > 65535) {
                    warnings.push(`Server ${serverName}: Port ${port} may require special permissions or is invalid`);
                }
            }
        }

        // Environment validation
        const validEnvironments = ['development', 'staging', 'production'];
        for (const [serverName, serverConfig] of Object.entries(config.mcpServers || {})) {
            if (serverConfig.env && serverConfig.env.ENVIRONMENT) {
                if (!validEnvironments.includes(serverConfig.env.ENVIRONMENT)) {
                    warnings.push(`Server ${serverName}: Invalid environment '${serverConfig.env.ENVIRONMENT}'`);
                }
            }
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * Get default MCP configuration path
     * @returns {string} Default configuration path
     */
    getDefaultConfigPath() {
        const homeDir = os.homedir();
        
        // Try to find existing Claude Code configuration directory
        const possiblePaths = [
            path.join(homeDir, '.claude', '.mcp.json'),
            path.join(homeDir, '.config', 'claude', '.mcp.json'),
            path.join(process.cwd(), '.mcp.json')
        ];

        // Return first existing directory or default
        for (const configPath of possiblePaths) {
            const dir = path.dirname(configPath);
            try {
                require('fs').accessSync(dir);
                return configPath;
            } catch (e) {
                // Directory doesn't exist, continue
            }
        }

        // Default to home directory
        return possiblePaths[0];
    }

    /**
     * Detect Claude Code installation path
     * @returns {string|null} Claude Code path or null if not found
     */
    detectClaudeCodePath() {
        const possiblePaths = [
            '/Applications/Claude.app',
            '/usr/local/bin/claude',
            '/opt/claude',
            path.join(os.homedir(), '.local', 'bin', 'claude'),
            path.join(os.homedir(), 'AppData', 'Local', 'Claude')
        ];

        for (const claudePath of possiblePaths) {
            try {
                require('fs').accessSync(claudePath);
                return claudePath;
            } catch (e) {
                // Path doesn't exist, continue
            }
        }

        return null;
    }

    /**
     * Generate secure API key
     * @returns {string} Generated API key
     */
    generateApiKey() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = 'apm_';
        for (let i = 0; i < 32; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    /**
     * Get development environment template
     * @returns {Object} Development configuration template
     */
    getDevelopmentTemplate() {
        return {
            server: {
                port: 8080,
                host: "localhost",
                debug: true
            },
            logging: {
                level: "debug",
                enabled: true,
                verbose: true
            },
            processes: {
                autoRestart: true,
                timeout: 30000,
                maxConcurrent: 5
            },
            dashboard: {
                enabled: true,
                autoOpen: false,
                theme: "dark"
            }
        };
    }

    /**
     * Get staging environment template
     * @returns {Object} Staging configuration template
     */
    getStagingTemplate() {
        return {
            server: {
                port: 8080,
                host: "0.0.0.0",
                debug: false
            },
            logging: {
                level: "info",
                enabled: true,
                verbose: false
            },
            processes: {
                autoRestart: true,
                timeout: 45000,
                maxConcurrent: 8
            },
            dashboard: {
                enabled: true,
                autoOpen: false,
                theme: "light"
            }
        };
    }

    /**
     * Get production environment template
     * @returns {Object} Production configuration template
     */
    getProductionTemplate() {
        return {
            server: {
                port: 8080,
                host: "0.0.0.0",
                debug: false
            },
            logging: {
                level: "warn",
                enabled: true,
                verbose: false
            },
            processes: {
                autoRestart: true,
                timeout: 60000,
                maxConcurrent: 10
            },
            dashboard: {
                enabled: false,
                autoOpen: false,
                theme: "light"
            }
        };
    }

    /**
     * Update existing MCP configuration
     * @param {string} configPath - Path to existing configuration
     * @param {Object} updates - Configuration updates
     * @returns {Promise<Object>} Updated configuration
     */
    async updateConfig(configPath, updates) {
        let existingConfig = {};
        
        try {
            const configData = await fs.readFile(configPath, 'utf8');
            existingConfig = JSON.parse(configData);
        } catch (e) {
            // File doesn't exist or is invalid, start with empty config
        }

        // Deep merge configurations
        const mergedConfig = this.deepMerge(existingConfig, updates);
        
        // Write updated configuration
        await this.writeConfig(mergedConfig, configPath);
        
        return mergedConfig;
    }

    /**
     * Deep merge two objects
     * @param {Object} target - Target object
     * @param {Object} source - Source object
     * @returns {Object} Merged object
     */
    deepMerge(target, source) {
        const result = { ...target };
        
        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = this.deepMerge(result[key] || {}, source[key]);
            } else {
                result[key] = source[key];
            }
        }
        
        return result;
    }
}

module.exports = MCPConfigGenerator;