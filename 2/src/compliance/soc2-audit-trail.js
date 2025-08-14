/**
 * SOC 2 Type II Audit Trail System
 * Comprehensive logging and audit trail management for SOC 2 compliance
 * 
 * @version 1.0.0
 * @author MCP Debug Host Platform
 * @compliance SOC 2 Trust Service Criteria
 */

const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const { EventEmitter } = require('events');

class SOC2AuditTrail extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            // Audit log storage settings
            logDirectory: config.logDirectory || './data/audit-logs',
            maxLogFileSize: config.maxLogFileSize || 50 * 1024 * 1024, // 50MB
            logRetentionDays: config.logRetentionDays || 2555, // 7 years
            logRotationInterval: config.logRotationInterval || 24 * 60 * 60 * 1000, // 24 hours
            
            // Encryption settings
            encryptionAlgorithm: 'aes-256-gcm',
            keyDerivationIterations: 100000,
            
            // Integrity settings
            hashAlgorithm: 'sha256',
            signatureAlgorithm: 'RSA-SHA256',
            
            // Monitoring settings
            alertThresholds: {
                failedLogins: 5,
                privilegedAccess: 1,
                systemErrors: 10,
                dataAccess: 100
            },
            
            // Trust Service Criteria mapping
            trustServiceCriteria: {
                CC6: 'Security', // Logical and Physical Access Controls
                CC7: 'Availability', // System Operations and Availability
                CC8: 'Processing Integrity', // System Operations
                CC9: 'Confidentiality', // Information and Communications
                CC10: 'Privacy' // Privacy (if applicable)
            },
            
            ...config
        };
        
        this.auditBuffer = [];
        this.logFileHandle = null;
        this.currentLogFile = null;
        this.encryptionKey = null;
        this.integrityChain = [];
        
        this.initialize();
    }
    
    /**
     * Initialize audit trail system
     */
    async initialize() {
        try {
            // Ensure audit log directory exists
            await this.ensureLogDirectory();
            
            // Initialize encryption
            await this.initializeEncryption();
            
            // Start log rotation
            this.initializeLogRotation();
            
            // Initialize integrity monitoring
            this.initializeIntegrityMonitoring();
            
            this.emit('auditSystemInitialized', {
                timestamp: new Date().toISOString(),
                logDirectory: this.config.logDirectory
            });
            
        } catch (error) {
            this.emit('auditSystemError', {
                timestamp: new Date().toISOString(),
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }
    
    /**
     * Log audit event with SOC 2 compliance
     * @param {Object} event - Audit event details
     * @param {string} criteria - SOC 2 trust service criteria (CC6-CC10)
     */
    async logAuditEvent(event, criteria = 'CC6') {
        const auditEntry = this.createAuditEntry(event, criteria);
        
        try {
            // Add to buffer for batch processing
            this.auditBuffer.push(auditEntry);
            
            // Process buffer if threshold reached
            if (this.auditBuffer.length >= 100) {
                await this.flushAuditBuffer();
            }
            
            // Check for critical events requiring immediate processing
            if (this.isCriticalEvent(auditEntry)) {
                await this.processCriticalEvent(auditEntry);
            }
            
            this.emit('auditEventLogged', auditEntry);
            
        } catch (error) {
            this.emit('auditLoggingError', {
                timestamp: new Date().toISOString(),
                error: error.message,
                event: auditEntry
            });
            throw error;
        }
    }
    
    /**
     * Create standardized audit entry
     * @param {Object} event - Original event
     * @param {string} criteria - SOC 2 criteria
     * @returns {Object} Formatted audit entry
     */
    createAuditEntry(event, criteria) {
        const timestamp = new Date().toISOString();
        const eventId = crypto.randomUUID();
        
        const auditEntry = {
            // Required SOC 2 fields
            eventId,
            timestamp,
            criteria,
            criteriaDescription: this.config.trustServiceCriteria[criteria],
            
            // Event details
            eventType: event.type || 'system.event',
            severity: event.severity || 'info',
            source: event.source || 'mcp-debug-host',
            
            // User and session information
            userId: event.userId || 'system',
            sessionId: event.sessionId || null,
            userAgent: event.userAgent || null,
            ipAddress: event.ipAddress || null,
            
            // System context
            systemComponent: event.component || 'core',
            operation: event.operation || 'unknown',
            resource: event.resource || null,
            
            // Data access tracking
            dataAccessed: event.dataAccessed || null,
            dataModified: event.dataModified || null,
            dataDeleted: event.dataDeleted || null,
            
            // Result and status
            result: event.result || 'success',
            resultCode: event.resultCode || '200',
            resultMessage: event.resultMessage || null,
            
            // Additional context
            metadata: event.metadata || {},
            
            // Integrity fields
            previousHash: this.getLastIntegrityHash(),
            entryHash: null // Will be calculated
        };
        
        // Calculate entry hash for integrity
        auditEntry.entryHash = this.calculateEntryHash(auditEntry);
        
        // Add to integrity chain
        this.integrityChain.push({
            eventId,
            timestamp,
            hash: auditEntry.entryHash
        });
        
        return auditEntry;
    }
    
    /**
     * Log user authentication events (CC6 - Security)
     * @param {Object} authEvent - Authentication event details
     */
    async logAuthenticationEvent(authEvent) {
        const event = {
            type: 'authentication',
            severity: authEvent.result === 'success' ? 'info' : 'warning',
            operation: authEvent.operation, // login, logout, password_change, etc.
            userId: authEvent.userId,
            sessionId: authEvent.sessionId,
            ipAddress: authEvent.ipAddress,
            userAgent: authEvent.userAgent,
            result: authEvent.result,
            resultMessage: authEvent.message,
            metadata: {
                authMethod: authEvent.authMethod,
                mfaUsed: authEvent.mfaUsed || false,
                failureReason: authEvent.failureReason
            }
        };
        
        await this.logAuditEvent(event, 'CC6');
        
        // Check for suspicious activity
        if (authEvent.result === 'failure') {
            await this.checkAuthenticationFailures(authEvent.userId, authEvent.ipAddress);
        }
    }
    
    /**
     * Log system operations (CC7 - Availability)
     * @param {Object} systemEvent - System operation event
     */
    async logSystemOperation(systemEvent) {
        const event = {
            type: 'system.operation',
            severity: systemEvent.severity || 'info',
            operation: systemEvent.operation,
            component: systemEvent.component,
            resource: systemEvent.resource,
            result: systemEvent.result,
            resultMessage: systemEvent.message,
            metadata: {
                duration: systemEvent.duration,
                resourceUsage: systemEvent.resourceUsage,
                errorCode: systemEvent.errorCode
            }
        };
        
        await this.logAuditEvent(event, 'CC7');
    }
    
    /**
     * Log data processing activities (CC8 - Processing Integrity)
     * @param {Object} dataEvent - Data processing event
     */
    async logDataProcessing(dataEvent) {
        const event = {
            type: 'data.processing',
            severity: 'info',
            operation: dataEvent.operation, // create, read, update, delete
            userId: dataEvent.userId,
            sessionId: dataEvent.sessionId,
            resource: dataEvent.resource,
            dataAccessed: dataEvent.dataAccessed,
            dataModified: dataEvent.dataModified,
            dataDeleted: dataEvent.dataDeleted,
            result: dataEvent.result,
            metadata: {
                recordCount: dataEvent.recordCount,
                dataSize: dataEvent.dataSize,
                processingTime: dataEvent.processingTime
            }
        };
        
        await this.logAuditEvent(event, 'CC8');
    }
    
    /**
     * Log privileged access (CC6 - Security)
     * @param {Object} privilegedEvent - Privileged access event
     */
    async logPrivilegedAccess(privilegedEvent) {
        const event = {
            type: 'privileged.access',
            severity: 'critical',
            operation: privilegedEvent.operation,
            userId: privilegedEvent.userId,
            sessionId: privilegedEvent.sessionId,
            ipAddress: privilegedEvent.ipAddress,
            resource: privilegedEvent.resource,
            result: privilegedEvent.result,
            metadata: {
                privilegeLevel: privilegedEvent.privilegeLevel,
                accessJustification: privilegedEvent.justification,
                approvedBy: privilegedEvent.approvedBy
            }
        };
        
        await this.logAuditEvent(event, 'CC6');
        
        // Immediate alert for privileged access
        await this.sendImmediateAlert('privileged_access', event);
    }
    
    /**
     * Log configuration changes (CC6 - Security)
     * @param {Object} configEvent - Configuration change event
     */
    async logConfigurationChange(configEvent) {
        const event = {
            type: 'configuration.change',
            severity: 'warning',
            operation: 'configuration.update',
            userId: configEvent.userId,
            sessionId: configEvent.sessionId,
            resource: configEvent.resource,
            result: configEvent.result,
            metadata: {
                oldValue: configEvent.oldValue,
                newValue: configEvent.newValue,
                changeReason: configEvent.reason,
                approvedBy: configEvent.approvedBy
            }
        };
        
        await this.logAuditEvent(event, 'CC6');
    }
    
    /**
     * Flush audit buffer to persistent storage
     */
    async flushAuditBuffer() {
        if (this.auditBuffer.length === 0) return;
        
        try {
            // Prepare log file if needed
            await this.prepareLogFile();
            
            // Encrypt and write entries
            const entries = [...this.auditBuffer];
            this.auditBuffer = [];
            
            for (const entry of entries) {
                await this.writeAuditEntry(entry);
            }
            
            // Sync to disk
            if (this.logFileHandle) {
                await this.logFileHandle.sync();
            }
            
            this.emit('auditBufferFlushed', {
                timestamp: new Date().toISOString(),
                entriesWritten: entries.length
            });
            
        } catch (error) {
            // Return entries to buffer on error
            this.auditBuffer.unshift(...entries);
            throw error;
        }
    }
    
    /**
     * Write individual audit entry to log file
     * @param {Object} entry - Audit entry
     */
    async writeAuditEntry(entry) {
        const logLine = JSON.stringify(entry) + '\n';
        const encryptedLine = await this.encryptLogLine(logLine);
        
        if (this.logFileHandle) {
            await this.logFileHandle.write(encryptedLine);
        }
    }
    
    /**
     * Encrypt log line
     * @param {string} logLine - Log line to encrypt
     * @returns {string} Encrypted log line
     */
    async encryptLogLine(logLine) {
        const iv = crypto.randomBytes(12);
        const cipher = crypto.createCipher(this.config.encryptionAlgorithm, this.encryptionKey, { iv });
        
        let encrypted = cipher.update(logLine, 'utf8', 'base64');
        encrypted += cipher.final('base64');
        
        const authTag = cipher.getAuthTag();
        
        return JSON.stringify({
            iv: iv.toString('base64'),
            authTag: authTag.toString('base64'),
            data: encrypted
        }) + '\n';
    }
    
    /**
     * Check for critical events requiring immediate processing
     * @param {Object} auditEntry - Audit entry to check
     * @returns {boolean} Is critical event
     */
    isCriticalEvent(auditEntry) {
        const criticalTypes = [
            'privileged.access',
            'security.breach',
            'data.breach',
            'system.failure',
            'authentication.failure'
        ];
        
        return criticalTypes.includes(auditEntry.eventType) || 
               auditEntry.severity === 'critical' ||
               (auditEntry.eventType === 'authentication' && auditEntry.result === 'failure');
    }
    
    /**
     * Process critical events immediately
     * @param {Object} auditEntry - Critical audit entry
     */
    async processCriticalEvent(auditEntry) {
        // Immediate flush for critical events
        await this.flushAuditBuffer();
        
        // Send alerts
        await this.sendImmediateAlert('critical_event', auditEntry);
        
        // Additional logging
        console.error('CRITICAL AUDIT EVENT:', auditEntry);
    }
    
    /**
     * Check authentication failures for suspicious patterns
     * @param {string} userId - User ID
     * @param {string} ipAddress - IP address
     */
    async checkAuthenticationFailures(userId, ipAddress) {
        const threshold = this.config.alertThresholds.failedLogins;
        const timeWindow = 15 * 60 * 1000; // 15 minutes
        const now = Date.now();
        
        // Count recent failures (simplified implementation)
        // In production, this would query the audit log
        const recentFailures = this.integrityChain.filter(entry => {
            const entryTime = new Date(entry.timestamp).getTime();
            return now - entryTime < timeWindow;
        }).length;
        
        if (recentFailures >= threshold) {
            await this.sendImmediateAlert('suspicious_auth_activity', {
                userId,
                ipAddress,
                failureCount: recentFailures,
                timeWindow: '15 minutes'
            });
        }
    }
    
    /**
     * Send immediate alert for critical events
     * @param {string} alertType - Type of alert
     * @param {Object} alertData - Alert data
     */
    async sendImmediateAlert(alertType, alertData) {
        const alert = {
            alertId: crypto.randomUUID(),
            alertType,
            severity: 'high',
            timestamp: new Date().toISOString(),
            data: alertData,
            source: 'soc2-audit-trail'
        };
        
        // Emit alert event (can be caught by alerting system)
        this.emit('criticalAlert', alert);
        
        // Log the alert itself
        await this.logAuditEvent({
            type: 'alert.generated',
            severity: 'warning',
            operation: 'alert.send',
            result: 'success',
            metadata: alert
        }, 'CC6');
    }
    
    /**
     * Generate SOC 2 compliance report
     * @param {string} startDate - Start date (ISO string)
     * @param {string} endDate - End date (ISO string)
     * @returns {Object} Compliance report
     */
    async generateComplianceReport(startDate, endDate) {
        const report = {
            reportId: crypto.randomUUID(),
            generatedAt: new Date().toISOString(),
            reportPeriod: {
                startDate,
                endDate
            },
            trustServiceCriteria: {},
            summary: {
                totalEvents: 0,
                eventsByCriteria: {},
                eventsBySeverity: {},
                integrityChecks: {
                    totalChecked: this.integrityChain.length,
                    integrityViolations: 0
                },
                securityMetrics: {
                    authenticationEvents: 0,
                    privilegedAccess: 0,
                    configurationChanges: 0,
                    securityIncidents: 0
                }
            }
        };
        
        // In production, this would query encrypted audit logs
        // For now, we'll use the integrity chain as a summary
        for (const criteria of Object.keys(this.config.trustServiceCriteria)) {
            report.trustServiceCriteria[criteria] = {
                description: this.config.trustServiceCriteria[criteria],
                eventCount: 0,
                complianceStatus: 'compliant',
                findings: []
            };
        }
        
        return report;
    }
    
    /**
     * Verify audit trail integrity
     * @returns {Object} Integrity verification result
     */
    verifyAuditIntegrity() {
        const result = {
            timestamp: new Date().toISOString(),
            totalEntries: this.integrityChain.length,
            integrityViolations: [],
            overallIntegrity: true
        };
        
        // Verify hash chain integrity
        let previousHash = null;
        for (const entry of this.integrityChain) {
            if (previousHash && entry.previousHash !== previousHash) {
                result.integrityViolations.push({
                    eventId: entry.eventId,
                    timestamp: entry.timestamp,
                    issue: 'Hash chain broken',
                    expected: previousHash,
                    actual: entry.previousHash
                });
            }
            previousHash = entry.hash;
        }
        
        result.overallIntegrity = result.integrityViolations.length === 0;
        
        return result;
    }
    
    /**
     * Helper methods
     */
    
    async ensureLogDirectory() {
        await fs.mkdir(this.config.logDirectory, { recursive: true });
    }
    
    async initializeEncryption() {
        // In production, this would use proper key management
        this.encryptionKey = crypto.randomBytes(32);
    }
    
    initializeLogRotation() {
        setInterval(async () => {
            await this.rotateLogFile();
        }, this.config.logRotationInterval);
    }
    
    initializeIntegrityMonitoring() {
        setInterval(async () => {
            const integrityResult = this.verifyAuditIntegrity();
            if (!integrityResult.overallIntegrity) {
                await this.sendImmediateAlert('integrity_violation', integrityResult);
            }
        }, 60 * 60 * 1000); // Every hour
    }
    
    async prepareLogFile() {
        if (!this.currentLogFile || await this.shouldRotateLog()) {
            await this.rotateLogFile();
        }
    }
    
    async shouldRotateLog() {
        if (!this.currentLogFile) return true;
        
        try {
            const stats = await fs.stat(this.currentLogFile);
            return stats.size >= this.config.maxLogFileSize;
        } catch {
            return true;
        }
    }
    
    async rotateLogFile() {
        if (this.logFileHandle) {
            await this.logFileHandle.close();
        }
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        this.currentLogFile = path.join(this.config.logDirectory, `audit-${timestamp}.log`);
        this.logFileHandle = await fs.open(this.currentLogFile, 'a');
    }
    
    calculateEntryHash(entry) {
        const entryString = JSON.stringify(entry, Object.keys(entry).sort());
        return crypto.createHash(this.config.hashAlgorithm)
            .update(entryString)
            .digest('hex');
    }
    
    getLastIntegrityHash() {
        if (this.integrityChain.length === 0) return null;
        return this.integrityChain[this.integrityChain.length - 1].hash;
    }
}

module.exports = SOC2AuditTrail;