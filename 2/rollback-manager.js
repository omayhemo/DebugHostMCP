/**
 * Rollback Manager
 * Complete uninstall and rollback system for APM Debug Host MCP Server
 */

const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');

class RollbackManager {
    constructor(options = {}) {
        this.options = {
            dryRun: options.dryRun || false,
            verbose: options.verbose || false,
            force: options.force || false,
            backupPath: options.backupPath || path.join(os.tmpdir(), 'apm-mcp-rollback'),
            ...options
        };
        
        this.rollbackState = {
            operations: [],
            backups: [],
            errors: [],
            warnings: []
        };
    }

    /**
     * Complete uninstall of APM Debug Host MCP Server
     * @returns {Promise<Object>} Uninstall results
     */
    async uninstall() {
        this.log('Starting APM Debug Host MCP Server uninstall...');
        
        try {
            // Stop all running services
            await this.stopServices();
            
            // Remove system services
            await this.removeSystemServices();
            
            // Remove configuration files
            await this.removeConfigurationFiles();
            
            // Remove application files
            await this.removeApplicationFiles();
            
            // Clean up logs and data
            await this.cleanupData();
            
            // Remove environment variables
            await this.cleanupEnvironment();
            
            // Verify cleanup
            await this.verifyCleanup();
            
            this.log('Uninstall completed successfully');
            
            return {
                success: true,
                operations: this.rollbackState.operations.length,
                backups: this.rollbackState.backups.length,
                errors: this.rollbackState.errors,
                warnings: this.rollbackState.warnings
            };
            
        } catch (error) {
            this.rollbackState.errors.push(error.message);
            return {
                success: false,
                error: error.message,
                operations: this.rollbackState.operations.length,
                errors: this.rollbackState.errors,
                warnings: this.rollbackState.warnings
            };
        }
    }

    /**
     * Rollback partial installation
     * @param {Object} installationState - State from failed installation
     * @returns {Promise<Object>} Rollback results
     */
    async rollbackInstallation(installationState = {}) {
        this.log('Starting installation rollback...');
        
        try {
            const operations = installationState.operations || [];
            
            // Reverse installation operations
            for (const operation of operations.reverse()) {
                await this.reverseOperation(operation);
            }
            
            // Restore backups if available
            if (installationState.backups) {
                await this.restoreBackups(installationState.backups);
            }
            
            this.log('Rollback completed successfully');
            
            return {
                success: true,
                rolledBack: operations.length,
                restored: installationState.backups ? installationState.backups.length : 0,
                errors: this.rollbackState.errors,
                warnings: this.rollbackState.warnings
            };
            
        } catch (error) {
            this.rollbackState.errors.push(error.message);
            return {
                success: false,
                error: error.message,
                errors: this.rollbackState.errors,
                warnings: this.rollbackState.warnings
            };
        }
    }

    /**
     * Stop all running MCP services
     */
    async stopServices() {
        this.log('Stopping MCP services...');
        
        try {
            // Try to stop via PM2 if available
            try {
                await this.runCommand('pm2', ['stop', 'apm-debug-host']);
                await this.runCommand('pm2', ['delete', 'apm-debug-host']);
                this.recordOperation('pm2_stop', 'Stopped PM2 process');
            } catch (e) {
                // PM2 not available or no process found
            }
            
            // Try to stop via systemd
            if (process.platform === 'linux') {
                try {
                    await this.runCommand('sudo', ['systemctl', 'stop', 'apm-debug-host']);
                    this.recordOperation('systemd_stop', 'Stopped systemd service');
                } catch (e) {
                    // Service not found or not running
                }
            }
            
            // Try to stop via launchd on macOS
            if (process.platform === 'darwin') {
                try {
                    await this.runCommand('launchctl', ['unload', '/Library/LaunchDaemons/com.apm.debug-host.plist']);
                    this.recordOperation('launchd_stop', 'Stopped launchd service');
                } catch (e) {
                    // Service not found or not running
                }
            }
            
            // Kill any remaining processes
            await this.killRemainingProcesses();
            
        } catch (error) {
            this.rollbackState.warnings.push(`Service stop warning: ${error.message}`);
        }
    }

    /**
     * Remove system services
     */
    async removeSystemServices() {
        this.log('Removing system services...');
        
        const servicePaths = [
            // Linux systemd
            '/etc/systemd/system/apm-debug-host.service',
            '/lib/systemd/system/apm-debug-host.service',
            // macOS launchd
            '/Library/LaunchDaemons/com.apm.debug-host.plist',
            '/Library/LaunchAgents/com.apm.debug-host.plist',
            // User-level services
            path.join(os.homedir(), 'Library/LaunchAgents/com.apm.debug-host.plist')
        ];
        
        for (const servicePath of servicePaths) {
            try {
                await this.backupAndRemove(servicePath, 'system_service');
            } catch (e) {
                // File doesn't exist, continue
            }
        }
        
        // Reload systemd daemon if on Linux
        if (process.platform === 'linux') {
            try {
                await this.runCommand('sudo', ['systemctl', 'daemon-reload']);
                this.recordOperation('systemd_reload', 'Reloaded systemd daemon');
            } catch (e) {
                this.rollbackState.warnings.push('Could not reload systemd daemon');
            }
        }
    }

    /**
     * Remove configuration files
     */
    async removeConfigurationFiles() {
        this.log('Removing configuration files...');
        
        const configPaths = [
            // Global configurations
            path.join(os.homedir(), '.claude', '.mcp.json'),
            path.join(os.homedir(), '.config', 'claude', '.mcp.json'),
            path.join(os.homedir(), '.apm', 'mcp-config.json'),
            // Local configurations
            path.join(process.cwd(), '.mcp.json'),
            path.join(process.cwd(), 'mcp-config.json'),
            // APM specific configurations
            path.join(os.homedir(), '.apm', 'installer.log'),
            path.join(os.homedir(), '.apm', 'mcp-installation.state')
        ];
        
        for (const configPath of configPaths) {
            try {
                await this.backupAndRemove(configPath, 'configuration');
            } catch (e) {
                // File doesn't exist, continue
            }
        }
    }

    /**
     * Remove application files
     */
    async removeApplicationFiles() {
        this.log('Removing application files...');
        
        // Find installation directory
        const possibleInstallPaths = [
            path.join(__dirname, '..'), // Current installation
            path.join(process.cwd(), 'installer', 'mcp-host'),
            path.join(os.homedir(), '.apm', 'mcp-host'),
            '/opt/apm/mcp-host',
            '/usr/local/lib/apm/mcp-host'
        ];
        
        for (const installPath of possibleInstallPaths) {
            try {
                const stat = await fs.stat(installPath);
                if (stat.isDirectory()) {
                    // Check if this is our installation
                    const packageJsonPath = path.join(installPath, 'package.json');
                    try {
                        const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
                        if (packageJson.name === '@apm/debug-host-mcp') {
                            await this.backupAndRemoveDirectory(installPath, 'application');
                            this.recordOperation('remove_installation', `Removed installation at ${installPath}`);
                        }
                    } catch (e) {
                        // Not our package.json, skip
                    }
                }
            } catch (e) {
                // Directory doesn't exist, continue
            }
        }
    }

    /**
     * Clean up logs and data
     */
    async cleanupData() {
        this.log('Cleaning up logs and data...');
        
        const dataPaths = [
            // Log directories
            path.join(os.homedir(), '.apm', 'logs'),
            path.join(process.cwd(), 'logs'),
            '/var/log/apm-debug-host',
            // Data directories
            path.join(os.homedir(), '.apm', 'data'),
            path.join(os.homedir(), '.apm', 'sessions'),
            // Temporary files
            path.join(os.tmpdir(), 'apm-mcp-*'),
            // Cache directories
            path.join(os.homedir(), '.cache', 'apm-mcp')
        ];
        
        for (const dataPath of dataPaths) {
            try {
                if (dataPath.includes('*')) {
                    // Handle glob patterns
                    const dir = path.dirname(dataPath);
                    const pattern = path.basename(dataPath);
                    const files = await fs.readdir(dir);
                    
                    for (const file of files) {
                        if (file.startsWith(pattern.replace('*', ''))) {
                            await this.backupAndRemove(path.join(dir, file), 'data');
                        }
                    }
                } else {
                    await this.backupAndRemoveDirectory(dataPath, 'data');
                }
            } catch (e) {
                // Path doesn't exist, continue
            }
        }
    }

    /**
     * Clean up environment variables
     */
    async cleanupEnvironment() {
        this.log('Cleaning up environment variables...');
        
        // Environment variables to remove
        const envVars = [
            'APM_MCP_HOST_PORT',
            'APM_MCP_HOST_CONFIG',
            'APM_DEBUG_HOST_PATH',
            'MCP_SERVER_APM_DEBUG'
        ];
        
        // Remove from current process (won't persist)
        for (const envVar of envVars) {
            if (process.env[envVar]) {
                delete process.env[envVar];
                this.recordOperation('env_cleanup', `Removed environment variable ${envVar}`);
            }
        }
        
        // Try to remove from shell profiles
        const shellProfiles = [
            path.join(os.homedir(), '.bashrc'),
            path.join(os.homedir(), '.zshrc'),
            path.join(os.homedir(), '.bash_profile'),
            path.join(os.homedir(), '.profile')
        ];
        
        for (const profile of shellProfiles) {
            try {
                await this.removeEnvVarsFromFile(profile, envVars);
            } catch (e) {
                // File doesn't exist or can't be modified
            }
        }
    }

    /**
     * Verify cleanup was successful
     */
    async verifyCleanup() {
        this.log('Verifying cleanup...');
        
        const checkPaths = [
            path.join(__dirname, '..'),
            path.join(os.homedir(), '.claude', '.mcp.json'),
            '/etc/systemd/system/apm-debug-host.service',
            '/Library/LaunchDaemons/com.apm.debug-host.plist'
        ];
        
        const remainingFiles = [];
        
        for (const checkPath of checkPaths) {
            try {
                await fs.access(checkPath);
                remainingFiles.push(checkPath);
            } catch (e) {
                // File doesn't exist, good
            }
        }
        
        if (remainingFiles.length > 0) {
            this.rollbackState.warnings.push(`Some files may remain: ${remainingFiles.join(', ')}`);
        }
        
        // Check for running processes
        try {
            const processes = await this.findRunningProcesses();
            if (processes.length > 0) {
                this.rollbackState.warnings.push(`Some processes may still be running: ${processes.join(', ')}`);
            }
        } catch (e) {
            // Process check failed, add warning
            this.rollbackState.warnings.push('Could not verify all processes stopped');
        }
    }

    /**
     * Backup and remove a file
     * @param {string} filePath - Path to file
     * @param {string} category - Category for organization
     */
    async backupAndRemove(filePath, category) {
        if (this.options.dryRun) {
            this.log(`[DRY RUN] Would remove: ${filePath}`);
            return;
        }
        
        try {
            // Create backup
            const backupPath = await this.createBackup(filePath, category);
            
            // Remove original
            await fs.unlink(filePath);
            
            this.recordOperation('file_remove', `Removed ${filePath}`, { backup: backupPath });
            
        } catch (error) {
            if (error.code !== 'ENOENT') {
                throw error;
            }
        }
    }

    /**
     * Backup and remove a directory
     * @param {string} dirPath - Path to directory
     * @param {string} category - Category for organization
     */
    async backupAndRemoveDirectory(dirPath, category) {
        if (this.options.dryRun) {
            this.log(`[DRY RUN] Would remove directory: ${dirPath}`);
            return;
        }
        
        try {
            // Create backup
            const backupPath = await this.createBackup(dirPath, category);
            
            // Remove original directory
            await fs.rm(dirPath, { recursive: true, force: true });
            
            this.recordOperation('directory_remove', `Removed directory ${dirPath}`, { backup: backupPath });
            
        } catch (error) {
            if (error.code !== 'ENOENT') {
                throw error;
            }
        }
    }

    /**
     * Create backup of file or directory
     * @param {string} sourcePath - Source path
     * @param {string} category - Category for organization
     * @returns {Promise<string>} Backup path
     */
    async createBackup(sourcePath, category) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = path.basename(sourcePath);
        const backupDir = path.join(this.options.backupPath, category);
        const backupPath = path.join(backupDir, `${fileName}.${timestamp}.backup`);
        
        // Ensure backup directory exists
        await fs.mkdir(backupDir, { recursive: true });
        
        // Copy file/directory to backup
        const stat = await fs.stat(sourcePath);
        if (stat.isDirectory()) {
            await this.copyDirectory(sourcePath, backupPath);
        } else {
            await fs.copyFile(sourcePath, backupPath);
        }
        
        this.rollbackState.backups.push({
            original: sourcePath,
            backup: backupPath,
            category: category,
            timestamp: timestamp
        });
        
        return backupPath;
    }

    /**
     * Copy directory recursively
     * @param {string} src - Source directory
     * @param {string} dest - Destination directory
     */
    async copyDirectory(src, dest) {
        await fs.mkdir(dest, { recursive: true });
        const entries = await fs.readdir(src, { withFileTypes: true });
        
        for (const entry of entries) {
            const srcPath = path.join(src, entry.name);
            const destPath = path.join(dest, entry.name);
            
            if (entry.isDirectory()) {
                await this.copyDirectory(srcPath, destPath);
            } else {
                await fs.copyFile(srcPath, destPath);
            }
        }
    }

    /**
     * Kill any remaining processes
     */
    async killRemainingProcesses() {
        try {
            const processes = await this.findRunningProcesses();
            
            for (const pid of processes) {
                try {
                    process.kill(pid, 'SIGTERM');
                    this.recordOperation('process_kill', `Killed process ${pid}`);
                    
                    // Wait a bit then force kill if still running
                    setTimeout(() => {
                        try {
                            process.kill(pid, 'SIGKILL');
                        } catch (e) {
                            // Process already dead
                        }
                    }, 5000);
                    
                } catch (e) {
                    // Process already dead or no permission
                }
            }
        } catch (error) {
            this.rollbackState.warnings.push(`Could not kill all processes: ${error.message}`);
        }
    }

    /**
     * Find running MCP processes
     * @returns {Promise<Array>} Array of process IDs
     */
    async findRunningProcesses() {
        try {
            const output = await this.runCommand('ps', ['aux']);
            const lines = output.split('\n');
            const processes = [];
            
            for (const line of lines) {
                if (line.includes('apm-debug-host') || line.includes('mcp-host')) {
                    const parts = line.trim().split(/\s+/);
                    const pid = parseInt(parts[1]);
                    if (!isNaN(pid) && pid !== process.pid) {
                        processes.push(pid);
                    }
                }
            }
            
            return processes;
        } catch (error) {
            return [];
        }
    }

    /**
     * Remove environment variables from shell profile file
     * @param {string} filePath - Path to shell profile
     * @param {Array} envVars - Environment variables to remove
     */
    async removeEnvVarsFromFile(filePath, envVars) {
        try {
            const content = await fs.readFile(filePath, 'utf8');
            const lines = content.split('\n');
            const filteredLines = lines.filter(line => {
                return !envVars.some(envVar => 
                    line.includes(`export ${envVar}=`) || 
                    line.includes(`${envVar}=`)
                );
            });
            
            if (filteredLines.length !== lines.length) {
                await fs.writeFile(filePath, filteredLines.join('\n'), 'utf8');
                this.recordOperation('env_file_cleanup', `Cleaned environment variables from ${filePath}`);
            }
        } catch (error) {
            // File doesn't exist or can't be modified
        }
    }

    /**
     * Reverse a specific operation
     * @param {Object} operation - Operation to reverse
     */
    async reverseOperation(operation) {
        switch (operation.type) {
            case 'file_create':
                await this.backupAndRemove(operation.path, 'rollback');
                break;
            case 'directory_create':
                await this.backupAndRemoveDirectory(operation.path, 'rollback');
                break;
            case 'service_install':
                await this.removeSystemServices();
                break;
            case 'config_create':
                await this.backupAndRemove(operation.path, 'rollback');
                break;
            default:
                this.rollbackState.warnings.push(`Unknown operation type: ${operation.type}`);
        }
    }

    /**
     * Restore backups
     * @param {Array} backups - Array of backup information
     */
    async restoreBackups(backups) {
        for (const backup of backups) {
            try {
                const stat = await fs.stat(backup.backup);
                if (stat.isDirectory()) {
                    await this.copyDirectory(backup.backup, backup.original);
                } else {
                    await fs.copyFile(backup.backup, backup.original);
                }
                
                this.recordOperation('backup_restore', `Restored ${backup.original} from backup`);
            } catch (error) {
                this.rollbackState.warnings.push(`Could not restore ${backup.original}: ${error.message}`);
            }
        }
    }

    /**
     * Run command and return output
     * @param {string} command - Command to run
     * @param {Array} args - Command arguments
     * @returns {Promise<string>} Command output
     */
    async runCommand(command, args = []) {
        return new Promise((resolve, reject) => {
            const proc = spawn(command, args);
            let output = '';
            let error = '';

            proc.stdout.on('data', (data) => {
                output += data.toString();
            });

            proc.stderr.on('data', (data) => {
                error += data.toString();
            });

            proc.on('close', (code) => {
                if (code === 0) {
                    resolve(output);
                } else {
                    reject(new Error(error || `Command failed with code ${code}`));
                }
            });
        });
    }

    /**
     * Record an operation for tracking
     * @param {string} type - Operation type
     * @param {string} description - Operation description
     * @param {Object} metadata - Additional metadata
     */
    recordOperation(type, description, metadata = {}) {
        this.rollbackState.operations.push({
            type,
            description,
            timestamp: new Date().toISOString(),
            ...metadata
        });
    }

    /**
     * Log message if verbose mode is enabled
     * @param {string} message - Message to log
     */
    log(message) {
        if (this.options.verbose) {
            console.log(`[RollbackManager] ${message}`);
        }
    }

    /**
     * Generate uninstall report
     * @returns {string} Formatted uninstall report
     */
    generateReport() {
        let report = `\n=== APM Debug Host MCP Server Uninstall Report ===\n`;
        report += `Operations Performed: ${this.rollbackState.operations.length}\n`;
        report += `Backups Created: ${this.rollbackState.backups.length}\n`;
        report += `Errors: ${this.rollbackState.errors.length}\n`;
        report += `Warnings: ${this.rollbackState.warnings.length}\n\n`;

        if (this.rollbackState.operations.length > 0) {
            report += `Operations:\n`;
            for (const op of this.rollbackState.operations) {
                report += `  - ${op.type}: ${op.description}\n`;
            }
            report += '\n';
        }

        if (this.rollbackState.backups.length > 0) {
            report += `Backups (can be restored if needed):\n`;
            for (const backup of this.rollbackState.backups) {
                report += `  - ${backup.original} -> ${backup.backup}\n`;
            }
            report += '\n';
        }

        if (this.rollbackState.errors.length > 0) {
            report += `Errors:\n`;
            for (const error of this.rollbackState.errors) {
                report += `  - ${error}\n`;
            }
            report += '\n';
        }

        if (this.rollbackState.warnings.length > 0) {
            report += `Warnings:\n`;
            for (const warning of this.rollbackState.warnings) {
                report += `  - ${warning}\n`;
            }
            report += '\n';
        }

        return report;
    }
}

module.exports = RollbackManager;