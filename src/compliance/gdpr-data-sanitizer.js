/**
 * GDPR Data Sanitization Framework
 * Handles data anonymization, PII detection, and privacy compliance
 * 
 * @version 1.0.0
 * @author MCP Debug Host Platform
 * @compliance GDPR Articles 17, 25, 32
 */

const crypto = require('crypto');
const { EventEmitter } = require('events');

class GDPRDataSanitizer extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            // Data retention policies (in days)
            retentionPeriods: {
                logs: 30,
                userSessions: 7,
                errorReports: 90,
                auditTrail: 2555, // 7 years for compliance
                personalData: 365
            },
            
            // PII detection patterns
            piiPatterns: {
                email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
                ipAddress: /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g,
                creditCard: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
                ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
                phone: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
                apiKey: /(?:api[_-]?key|token|secret)[_-]?[:=]\s*['"]?([a-z0-9]{20,})/gi,
                password: /(?:password|pwd|pass)[_-]?[:=]\s*['"]?([^\s'"]{8,})/gi,
                authHeader: /authorization:\s*(?:bearer|basic)\s+([a-z0-9+/=]+)/gi,
                privateKey: /-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----[\s\S]*?-----END\s+(RSA\s+)?PRIVATE\s+KEY-----/gi
            },
            
            // Anonymization methods
            anonymizationMethods: {
                mask: '***MASKED***',
                hash: true,
                truncate: true,
                remove: true
            },
            
            // Data classification
            dataClassification: {
                public: 0,
                internal: 1,
                confidential: 2,
                restricted: 3
            },
            
            ...config
        };
        
        this.dataRegistry = new Map();
        this.deletionQueue = new Map();
        this.consentRegistry = new Map();
        
        // Initialize periodic cleanup
        this.initializePeriodicCleanup();
    }
    
    /**
     * Sanitize data according to GDPR requirements
     * @param {Object} data - Data to sanitize
     * @param {string} dataType - Type of data (logs, userSession, etc.)
     * @param {Object} options - Sanitization options
     * @returns {Object} Sanitized data
     */
    sanitizeData(data, dataType = 'general', options = {}) {
        try {
            const sanitized = JSON.parse(JSON.stringify(data));
            const classification = this.classifyData(sanitized);
            
            // Apply sanitization based on data classification
            if (classification >= this.config.dataClassification.confidential) {
                this.applySanitization(sanitized, options);
            }
            
            // Register data for lifecycle management
            this.registerData(sanitized, dataType);
            
            // Emit sanitization event for audit trail
            this.emit('dataSanitized', {
                timestamp: new Date().toISOString(),
                dataType,
                classification,
                sanitizedFields: this.getModifiedFields(data, sanitized)
            });
            
            return sanitized;
            
        } catch (error) {
            this.emit('sanitizationError', {
                timestamp: new Date().toISOString(),
                error: error.message,
                dataType
            });
            throw error;
        }
    }
    
    /**
     * Detect and classify data sensitivity
     * @param {Object} data - Data to classify
     * @returns {number} Classification level
     */
    classifyData(data) {
        const dataString = JSON.stringify(data).toLowerCase();
        let maxClassification = this.config.dataClassification.public;
        
        // Check for PII patterns
        for (const [pattern, regex] of Object.entries(this.config.piiPatterns)) {
            if (regex.test(dataString)) {
                maxClassification = Math.max(maxClassification, this.config.dataClassification.confidential);
                break;
            }
        }
        
        // Check for sensitive keywords
        const sensitiveKeywords = [
            'password', 'secret', 'key', 'token', 'auth', 'credential',
            'personal', 'private', 'confidential', 'internal'
        ];
        
        for (const keyword of sensitiveKeywords) {
            if (dataString.includes(keyword)) {
                maxClassification = Math.max(maxClassification, this.config.dataClassification.internal);
            }
        }
        
        return maxClassification;
    }
    
    /**
     * Apply sanitization to data
     * @param {Object} data - Data to sanitize
     * @param {Object} options - Sanitization options
     */
    applySanitization(data, options = {}) {
        const method = options.method || 'mask';
        
        this.recursiveSanitize(data, method);
    }
    
    /**
     * Recursively sanitize object properties
     * @param {*} obj - Object to sanitize
     * @param {string} method - Sanitization method
     */
    recursiveSanitize(obj, method) {
        if (typeof obj !== 'object' || obj === null) return;
        
        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'string') {
                obj[key] = this.sanitizeString(value, method, key);
            } else if (typeof value === 'object') {
                this.recursiveSanitize(value, method);
            }
        }
    }
    
    /**
     * Sanitize string value
     * @param {string} value - String to sanitize
     * @param {string} method - Sanitization method
     * @param {string} key - Object key for context
     * @returns {string} Sanitized string
     */
    sanitizeString(value, method, key) {
        let sanitized = value;
        
        // Apply PII detection and sanitization
        for (const [patternName, regex] of Object.entries(this.config.piiPatterns)) {
            if (regex.test(value)) {
                switch (method) {
                    case 'mask':
                        sanitized = sanitized.replace(regex, this.config.anonymizationMethods.mask);
                        break;
                    case 'hash':
                        sanitized = this.hashValue(value);
                        break;
                    case 'truncate':
                        sanitized = value.substring(0, 8) + '***';
                        break;
                    case 'remove':
                        sanitized = '[REMOVED]';
                        break;
                    default:
                        sanitized = this.config.anonymizationMethods.mask;
                }
                
                // Log sanitization for audit
                this.emit('piiDetected', {
                    timestamp: new Date().toISOString(),
                    pattern: patternName,
                    key,
                    method,
                    originalLength: value.length
                });
            }
        }
        
        return sanitized;
    }
    
    /**
     * Hash sensitive value
     * @param {string} value - Value to hash
     * @returns {string} Hashed value
     */
    hashValue(value) {
        return crypto.createHash('sha256')
            .update(value)
            .digest('hex')
            .substring(0, 16) + '***';
    }
    
    /**
     * Register data for lifecycle management
     * @param {Object} data - Data to register
     * @param {string} dataType - Type of data
     */
    registerData(data, dataType) {
        const id = this.generateDataId(data);
        const retentionPeriod = this.config.retentionPeriods[dataType] || this.config.retentionPeriods.personalData;
        const expiryDate = new Date(Date.now() + (retentionPeriod * 24 * 60 * 60 * 1000));
        
        this.dataRegistry.set(id, {
            dataType,
            timestamp: new Date(),
            expiryDate,
            size: JSON.stringify(data).length,
            classification: this.classifyData(data)
        });
    }
    
    /**
     * Generate unique ID for data entry
     * @param {Object} data - Data to generate ID for
     * @returns {string} Unique ID
     */
    generateDataId(data) {
        return crypto.createHash('sha256')
            .update(JSON.stringify(data) + Date.now())
            .digest('hex');
    }
    
    /**
     * Right to erasure - Delete personal data
     * @param {string} userId - User ID
     * @param {string} dataType - Type of data to delete
     * @returns {Promise<Object>} Deletion result
     */
    async deletePersonalData(userId, dataType = 'all') {
        try {
            const deletionId = crypto.randomUUID();
            const deletionRequest = {
                id: deletionId,
                userId,
                dataType,
                timestamp: new Date(),
                status: 'pending',
                deletedItems: []
            };
            
            this.deletionQueue.set(deletionId, deletionRequest);
            
            // Process deletion
            const result = await this.processDeletion(deletionRequest);
            
            // Update deletion request
            this.deletionQueue.set(deletionId, {
                ...deletionRequest,
                status: 'completed',
                completedAt: new Date(),
                ...result
            });
            
            // Emit deletion event for audit trail
            this.emit('dataDeleted', {
                deletionId,
                userId,
                dataType,
                deletedCount: result.deletedCount,
                timestamp: new Date().toISOString()
            });
            
            return result;
            
        } catch (error) {
            this.emit('deletionError', {
                userId,
                dataType,
                error: error.message,
                timestamp: new Date().toISOString()
            });
            throw error;
        }
    }
    
    /**
     * Process data deletion request
     * @param {Object} deletionRequest - Deletion request details
     * @returns {Promise<Object>} Deletion result
     */
    async processDeletion(deletionRequest) {
        const { userId, dataType } = deletionRequest;
        let deletedCount = 0;
        const deletedItems = [];
        
        // Search and delete data from registry
        for (const [id, entry] of this.dataRegistry) {
            if (this.shouldDeleteEntry(entry, userId, dataType)) {
                this.dataRegistry.delete(id);
                deletedItems.push({
                    id,
                    dataType: entry.dataType,
                    timestamp: entry.timestamp
                });
                deletedCount++;
            }
        }
        
        return {
            deletedCount,
            deletedItems,
            processedAt: new Date()
        };
    }
    
    /**
     * Check if data entry should be deleted
     * @param {Object} entry - Data entry
     * @param {string} userId - User ID
     * @param {string} dataType - Data type filter
     * @returns {boolean} Should delete
     */
    shouldDeleteEntry(entry, userId, dataType) {
        if (dataType !== 'all' && entry.dataType !== dataType) {
            return false;
        }
        
        // Additional logic to match user data would go here
        // This is a simplified implementation
        return true;
    }
    
    /**
     * Manage user consent
     * @param {string} userId - User ID
     * @param {Object} consentOptions - Consent options
     */
    manageConsent(userId, consentOptions) {
        this.consentRegistry.set(userId, {
            ...consentOptions,
            timestamp: new Date(),
            version: '1.0'
        });
        
        this.emit('consentUpdated', {
            userId,
            consentOptions,
            timestamp: new Date().toISOString()
        });
    }
    
    /**
     * Check user consent for data processing
     * @param {string} userId - User ID
     * @param {string} purpose - Data processing purpose
     * @returns {boolean} Consent granted
     */
    hasConsent(userId, purpose) {
        const consent = this.consentRegistry.get(userId);
        if (!consent) return false;
        
        return consent[purpose] === true;
    }
    
    /**
     * Get data processing report
     * @returns {Object} Processing report
     */
    getProcessingReport() {
        const report = {
            timestamp: new Date().toISOString(),
            totalDataEntries: this.dataRegistry.size,
            dataByType: {},
            dataByClassification: {},
            upcomingExpirations: [],
            consentStatus: {
                totalUsers: this.consentRegistry.size,
                consentByType: {}
            }
        };
        
        // Aggregate data statistics
        for (const entry of this.dataRegistry.values()) {
            report.dataByType[entry.dataType] = (report.dataByType[entry.dataType] || 0) + 1;
            report.dataByClassification[entry.classification] = (report.dataByClassification[entry.classification] || 0) + 1;
            
            // Check for upcoming expirations (next 7 days)
            const daysUntilExpiry = Math.ceil((entry.expiryDate - new Date()) / (1000 * 60 * 60 * 24));
            if (daysUntilExpiry <= 7 && daysUntilExpiry > 0) {
                report.upcomingExpirations.push({
                    dataType: entry.dataType,
                    expiryDate: entry.expiryDate,
                    daysUntilExpiry
                });
            }
        }
        
        return report;
    }
    
    /**
     * Initialize periodic cleanup of expired data
     */
    initializePeriodicCleanup() {
        // Run cleanup every 24 hours
        setInterval(() => {
            this.cleanupExpiredData();
        }, 24 * 60 * 60 * 1000);
        
        // Initial cleanup
        this.cleanupExpiredData();
    }
    
    /**
     * Clean up expired data entries
     */
    cleanupExpiredData() {
        const now = new Date();
        let cleanedCount = 0;
        
        for (const [id, entry] of this.dataRegistry) {
            if (entry.expiryDate <= now) {
                this.dataRegistry.delete(id);
                cleanedCount++;
            }
        }
        
        if (cleanedCount > 0) {
            this.emit('dataCleanup', {
                timestamp: now.toISOString(),
                cleanedCount
            });
        }
    }
    
    /**
     * Get modified fields between original and sanitized data
     * @param {Object} original - Original data
     * @param {Object} sanitized - Sanitized data
     * @returns {Array} Modified field paths
     */
    getModifiedFields(original, sanitized) {
        const modifiedFields = [];
        
        const compare = (obj1, obj2, path = '') => {
            for (const key in obj1) {
                const currentPath = path ? `${path}.${key}` : key;
                
                if (typeof obj1[key] === 'object' && obj1[key] !== null) {
                    compare(obj1[key], obj2[key] || {}, currentPath);
                } else if (obj1[key] !== obj2[key]) {
                    modifiedFields.push(currentPath);
                }
            }
        };
        
        compare(original, sanitized);
        return modifiedFields;
    }
    
    /**
     * Export data for user (data portability)
     * @param {string} userId - User ID
     * @returns {Object} User data export
     */
    exportUserData(userId) {
        const userEntries = [];
        
        for (const [id, entry] of this.dataRegistry) {
            // Logic to match user data would be more sophisticated in practice
            userEntries.push({
                id,
                dataType: entry.dataType,
                timestamp: entry.timestamp,
                size: entry.size
            });
        }
        
        return {
            userId,
            exportDate: new Date().toISOString(),
            dataEntries: userEntries,
            consent: this.consentRegistry.get(userId)
        };
    }
}

module.exports = GDPRDataSanitizer;