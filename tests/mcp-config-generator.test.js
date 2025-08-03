/**
 * Tests for MCP Configuration Generator
 */

const MCPConfigGenerator = require('../src/mcp-config-generator');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

describe('MCPConfigGenerator', () => {
    let generator;
    let tempDir;

    beforeEach(async () => {
        generator = new MCPConfigGenerator();
        tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'mcp-config-test-'));
    });

    afterEach(async () => {
        try {
            await fs.rm(tempDir, { recursive: true, force: true });
        } catch (e) {
            // Cleanup failed, continue
        }
    });

    describe('generateConfig', () => {
        it('should generate valid default configuration', () => {
            const config = generator.generateConfig();

            expect(config).toHaveProperty('mcpServers');
            expect(config.mcpServers).toHaveProperty('apm-debug-host');
            expect(config.mcpServers['apm-debug-host']).toHaveProperty('command', 'node');
            expect(config.mcpServers['apm-debug-host']).toHaveProperty('capabilities');
            expect(config.mcpServers['apm-debug-host'].capabilities).toContain('server:start');
        });

        it('should accept custom options', () => {
            const options = {
                environment: 'production',
                serverPort: 9000,
                mcpPort: 4000,
                serverName: 'custom-server',
                enableLogging: false
            };

            const config = generator.generateConfig(options);

            expect(config.mcpServers['custom-server'].env.PORT).toBe('9000');
            expect(config.mcpServers['custom-server'].env.MCP_PORT).toBe('4000');
            expect(config.mcpServers['custom-server'].env.ENVIRONMENT).toBe('production');
            expect(config.mcpServers['custom-server'].env.LOG_LEVEL).toBe('error');
        });

        it('should generate secure API key', () => {
            const config = generator.generateConfig();
            const apiKey = config.mcpServers['apm-debug-host'].env.API_KEY;

            expect(apiKey).toMatch(/^apm_[A-Za-z0-9]{32}$/);
        });

        it('should include all required capabilities', () => {
            const config = generator.generateConfig();
            const capabilities = config.mcpServers['apm-debug-host'].capabilities;

            const requiredCapabilities = [
                'server:start',
                'server:stop',
                'server:logs',
                'server:status',
                'tech-stack:detect',
                'dashboard:access'
            ];

            requiredCapabilities.forEach(capability => {
                expect(capabilities).toContain(capability);
            });
        });

        it('should include metadata', () => {
            const config = generator.generateConfig();
            const metadata = config.mcpServers['apm-debug-host'].metadata;

            expect(metadata).toHaveProperty('author', 'APM Framework');
            expect(metadata).toHaveProperty('license', 'MIT');
            expect(metadata).toHaveProperty('generated');
            expect(metadata).toHaveProperty('generatedBy');
        });
    });

    describe('writeConfig', () => {
        it('should write configuration to file', async () => {
            const config = generator.generateConfig();
            const configPath = path.join(tempDir, 'test-config.json');

            const writtenPath = await generator.writeConfig(config, configPath);

            expect(writtenPath).toBe(configPath);
            
            const fileContent = await fs.readFile(configPath, 'utf8');
            const parsedConfig = JSON.parse(fileContent);
            
            expect(parsedConfig).toEqual(config);
        });

        it('should create directory if not exists', async () => {
            const config = generator.generateConfig();
            const nestedPath = path.join(tempDir, 'nested', 'dir', 'config.json');

            await generator.writeConfig(config, nestedPath);

            const fileExists = await fs.access(nestedPath).then(() => true).catch(() => false);
            expect(fileExists).toBe(true);
        });
    });

    describe('validateConfig', () => {
        it('should validate correct configuration', () => {
            const config = generator.generateConfig();
            const validation = generator.validateConfig(config);

            expect(validation.valid).toBe(true);
            expect(validation.errors).toHaveLength(0);
        });

        it('should detect missing mcpServers', () => {
            const config = { claudeCode: {} };
            const validation = generator.validateConfig(config);

            expect(validation.valid).toBe(false);
            expect(validation.errors).toContain('Missing required field: mcpServers');
        });

        it('should detect empty mcpServers', () => {
            const config = { mcpServers: {} };
            const validation = generator.validateConfig(config);

            expect(validation.valid).toBe(false);
            expect(validation.errors).toContain('At least one MCP server must be configured');
        });

        it('should warn about unusual ports', () => {
            const config = generator.generateConfig({ serverPort: 80 });
            const validation = generator.validateConfig(config);

            expect(validation.valid).toBe(true);
            expect(validation.warnings.length).toBeGreaterThan(0);
            expect(validation.warnings[0]).toContain('Port 80 may require special permissions');
        });

        it('should warn about invalid environment', () => {
            const config = generator.generateConfig({ environment: 'invalid' });
            const validation = generator.validateConfig(config);

            expect(validation.valid).toBe(true);
            expect(validation.warnings.length).toBeGreaterThan(0);
            expect(validation.warnings[0]).toContain("Invalid environment 'invalid'");
        });
    });

    describe('generateClaudeCodeConfig', () => {
        it('should generate Claude Code specific configuration', () => {
            const config = generator.generateClaudeCodeConfig();

            expect(config).toHaveProperty('workspace');
            expect(config).toHaveProperty('integration');
            expect(config).toHaveProperty('ui');
            expect(config.integration.enabled).toBe(true);
            expect(config.integration.features.persistentServers).toBe(true);
        });

        it('should accept custom options', () => {
            const options = {
                workspaceRoot: '/custom/workspace',
                serverName: 'custom-server',
                autoStart: true,
                enableIntegration: false
            };

            const config = generator.generateClaudeCodeConfig(options);

            expect(config.workspace.root).toBe('/custom/workspace');
            expect(config.workspace.mcpServers).toContain('custom-server');
            expect(config.workspace.autoStart).toBe(true);
            expect(config.integration.enabled).toBe(false);
        });
    });

    describe('updateConfig', () => {
        it('should update existing configuration', async () => {
            const configPath = path.join(tempDir, 'existing-config.json');
            const existingConfig = { existing: 'value' };
            
            await fs.writeFile(configPath, JSON.stringify(existingConfig), 'utf8');

            const updates = { mcpServers: { 'new-server': { command: 'node' } } };
            const mergedConfig = await generator.updateConfig(configPath, updates);

            expect(mergedConfig.existing).toBe('value');
            expect(mergedConfig.mcpServers).toHaveProperty('new-server');
        });

        it('should handle non-existent config file', async () => {
            const configPath = path.join(tempDir, 'non-existent.json');
            const updates = { mcpServers: { 'new-server': { command: 'node' } } };

            const mergedConfig = await generator.updateConfig(configPath, updates);

            expect(mergedConfig.mcpServers).toHaveProperty('new-server');
        });
    });

    describe('deepMerge', () => {
        it('should merge objects deeply', () => {
            const target = {
                a: 1,
                b: { c: 2, d: 3 },
                e: [1, 2]
            };

            const source = {
                b: { d: 4, f: 5 },
                g: 6
            };

            const result = generator.deepMerge(target, source);

            expect(result.a).toBe(1);
            expect(result.b.c).toBe(2);
            expect(result.b.d).toBe(4);
            expect(result.b.f).toBe(5);
            expect(result.g).toBe(6);
            expect(result.e).toEqual([1, 2]);
        });

        it('should handle arrays correctly', () => {
            const target = { arr: [1, 2, 3] };
            const source = { arr: [4, 5, 6] };

            const result = generator.deepMerge(target, source);

            expect(result.arr).toEqual([4, 5, 6]);
        });
    });

    describe('getDefaultConfigPath', () => {
        it('should return a valid path', () => {
            const configPath = generator.getDefaultConfigPath();

            expect(configPath).toBeTruthy();
            expect(path.isAbsolute(configPath)).toBe(true);
            expect(configPath).toMatch(/\.mcp\.json$/);
        });
    });

    describe('generateApiKey', () => {
        it('should generate unique API keys', () => {
            const key1 = generator.generateApiKey();
            const key2 = generator.generateApiKey();

            expect(key1).not.toBe(key2);
            expect(key1).toMatch(/^apm_[A-Za-z0-9]{32}$/);
            expect(key2).toMatch(/^apm_[A-Za-z0-9]{32}$/);
        });
    });

    describe('environment templates', () => {
        it('should provide development template', () => {
            const template = generator.getDevelopmentTemplate();

            expect(template.server.debug).toBe(true);
            expect(template.logging.level).toBe('debug');
            expect(template.dashboard.enabled).toBe(true);
        });

        it('should provide staging template', () => {
            const template = generator.getStagingTemplate();

            expect(template.server.debug).toBe(false);
            expect(template.logging.level).toBe('info');
            expect(template.processes.maxConcurrent).toBe(8);
        });

        it('should provide production template', () => {
            const template = generator.getProductionTemplate();

            expect(template.server.debug).toBe(false);
            expect(template.logging.level).toBe('warn');
            expect(template.dashboard.enabled).toBe(false);
            expect(template.processes.maxConcurrent).toBe(10);
        });
    });
});