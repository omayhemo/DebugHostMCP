/**
 * API Key Management and Rotation System for MCP Debug Host
 * Provides secure API key generation, validation, and rotation capabilities
 */

const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

class APIKeyManager {
  constructor(options = {}) {
    this.keyStorePath = options.keyStorePath || path.join(process.env.HOME || process.env.USERPROFILE, '.apm-debug-host', 'keys');
    this.rotationInterval = options.rotationInterval || 24 * 60 * 60 * 1000; // 24 hours
    this.maxKeyAge = options.maxKeyAge || 7 * 24 * 60 * 60 * 1000; // 7 days
    this.keyLength = options.keyLength || 32;
    this.logger = options.logger || console;
    
    this.keys = new Map();
    this.rotationTimer = null;
    
    this.init();
  }

  async init() {
    try {
      await this.ensureKeyStoreDirectory();
      await this.loadExistingKeys();
      this.setupAutoRotation();
      
      // Generate initial key if none exist
      if (this.keys.size === 0) {
        await this.generateKey('default');
      }
      
      this.logger.info('API Key Manager initialized', {
        keyCount: this.keys.size,
        rotationInterval: this.rotationInterval,
        maxKeyAge: this.maxKeyAge
      });
    } catch (error) {
      this.logger.error('Failed to initialize API Key Manager', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  async ensureKeyStoreDirectory() {
    try {
      await fs.mkdir(this.keyStorePath, { recursive: true, mode: 0o700 });
    } catch (error) {
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }
  }

  async loadExistingKeys() {
    try {
      const files = await fs.readdir(this.keyStorePath);
      const keyFiles = files.filter(file => file.endsWith('.key.json'));
      
      for (const keyFile of keyFiles) {
        const keyPath = path.join(this.keyStorePath, keyFile);
        const keyData = JSON.parse(await fs.readFile(keyPath, 'utf8'));
        
        // Validate key data structure
        if (this.validateKeyData(keyData)) {
          this.keys.set(keyData.id, keyData);
        } else {
          this.logger.warn('Invalid key data found, removing', { keyFile });
          await fs.unlink(keyPath);
        }
      }
      
      this.logger.info('Loaded existing keys', { count: this.keys.size });
    } catch (error) {
      if (error.code !== 'ENOENT') {
        this.logger.error('Failed to load existing keys', {
          error: error.message
        });
      }
    }
  }

  validateKeyData(keyData) {
    return keyData &&
           typeof keyData.id === 'string' &&
           typeof keyData.key === 'string' &&
           typeof keyData.createdAt === 'number' &&
           typeof keyData.lastUsed === 'number' &&
           typeof keyData.usageCount === 'number' &&
           typeof keyData.active === 'boolean';
  }

  async generateKey(id = null, options = {}) {
    const keyId = id || `key-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const keyValue = crypto.randomBytes(this.keyLength).toString('base64url');
    const hashedKey = this.hashKey(keyValue);
    
    const keyData = {
      id: keyId,
      key: hashedKey,
      plainKey: keyValue, // Only stored temporarily for initial response
      createdAt: Date.now(),
      lastUsed: 0,
      usageCount: 0,
      active: true,
      purpose: options.purpose || 'general',
      permissions: options.permissions || ['read', 'write'],
      expiresAt: options.expiresAt || (Date.now() + this.maxKeyAge),
      metadata: options.metadata || {}
    };

    this.keys.set(keyId, keyData);
    await this.saveKey(keyData);
    
    this.logger.info('Generated new API key', {
      keyId,
      purpose: keyData.purpose,
      permissions: keyData.permissions,
      expiresAt: new Date(keyData.expiresAt).toISOString()
    });

    // Return key data without the hashed version for security
    const responseData = { ...keyData };
    delete responseData.key;
    
    // Remove plain key from stored version after short delay
    setTimeout(() => {
      delete keyData.plainKey;
    }, 100); // Shorter delay for tests
    
    return responseData;
  }

  hashKey(key) {
    return crypto.createHash('sha256').update(key).digest('hex');
  }

  async saveKey(keyData) {
    const keyPath = path.join(this.keyStorePath, `${keyData.id}.key.json`);
    const saveData = { ...keyData };
    
    // Don't save the plain key to disk
    delete saveData.plainKey;
    
    await fs.writeFile(keyPath, JSON.stringify(saveData, null, 2), { mode: 0o600 });
  }

  async validateKey(providedKey) {
    if (!providedKey || typeof providedKey !== 'string') {
      return { valid: false, reason: 'No key provided' };
    }

    const hashedProvidedKey = this.hashKey(providedKey);
    
    for (const [keyId, keyData] of this.keys.entries()) {
      if (keyData.key === hashedProvidedKey) {
        // Check if key is active
        if (!keyData.active) {
          return { valid: false, reason: 'Key is inactive', keyId };
        }
        
        // Check if key is expired
        if (keyData.expiresAt && Date.now() > keyData.expiresAt) {
          return { valid: false, reason: 'Key has expired', keyId };
        }
        
        // Update usage statistics
        await this.updateKeyUsage(keyId);
        
        return {
          valid: true,
          keyId,
          permissions: keyData.permissions,
          purpose: keyData.purpose,
          metadata: keyData.metadata
        };
      }
    }
    
    return { valid: false, reason: 'Invalid key' };
  }

  async updateKeyUsage(keyId) {
    const keyData = this.keys.get(keyId);
    if (keyData) {
      keyData.lastUsed = Date.now();
      keyData.usageCount++;
      await this.saveKey(keyData);
    }
  }

  async rotateKey(keyId) {
    const oldKeyData = this.keys.get(keyId);
    if (!oldKeyData) {
      throw new Error(`Key ${keyId} not found`);
    }

    // Generate new key with unique ID but same properties
    const newKeyId = `${keyId}-rotated-${Date.now()}`;
    const newKeyData = await this.generateKey(newKeyId, {
      purpose: oldKeyData.purpose,
      permissions: oldKeyData.permissions,
      metadata: oldKeyData.metadata
    });

    // Deactivate old key but keep it for grace period
    oldKeyData.active = false;
    oldKeyData.rotatedAt = Date.now();
    oldKeyData.rotatedTo = newKeyData.id;
    await this.saveKey(oldKeyData);

    this.logger.info('Key rotated', {
      oldKeyId: keyId,
      newKeyId: newKeyData.id,
      purpose: newKeyData.purpose
    });

    return newKeyData;
  }

  async revokeKey(keyId, reason = 'Manual revocation') {
    const keyData = this.keys.get(keyId);
    if (!keyData) {
      throw new Error(`Key ${keyId} not found`);
    }

    keyData.active = false;
    keyData.revokedAt = Date.now();
    keyData.revocationReason = reason;
    await this.saveKey(keyData);

    this.logger.info('Key revoked', {
      keyId,
      reason,
      revokedAt: new Date(keyData.revokedAt).toISOString()
    });

    return true;
  }

  async listKeys(includeInactive = false) {
    const keyList = [];
    
    for (const [keyId, keyData] of this.keys.entries()) {
      if (!includeInactive && !keyData.active) {
        continue;
      }
      
      keyList.push({
        id: keyId,
        purpose: keyData.purpose,
        permissions: keyData.permissions,
        createdAt: new Date(keyData.createdAt).toISOString(),
        lastUsed: keyData.lastUsed ? new Date(keyData.lastUsed).toISOString() : null,
        usageCount: keyData.usageCount,
        active: keyData.active,
        expiresAt: keyData.expiresAt ? new Date(keyData.expiresAt).toISOString() : null,
        revokedAt: keyData.revokedAt ? new Date(keyData.revokedAt).toISOString() : null,
        revocationReason: keyData.revocationReason,
        metadata: keyData.metadata
      });
    }
    
    return keyList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  async getKeyUsageStats() {
    const stats = {
      totalKeys: this.keys.size,
      activeKeys: 0,
      expiredKeys: 0,
      revokedKeys: 0,
      totalUsage: 0,
      keysByPurpose: {},
      recentUsage: []
    };

    const now = Date.now();
    const recentThreshold = now - (24 * 60 * 60 * 1000); // 24 hours

    for (const keyData of this.keys.values()) {
      if (keyData.active) {
        stats.activeKeys++;
      }
      
      if (keyData.expiresAt && now > keyData.expiresAt) {
        stats.expiredKeys++;
      }
      
      if (keyData.revokedAt) {
        stats.revokedKeys++;
      }
      
      stats.totalUsage += keyData.usageCount;
      
      // Group by purpose
      if (!stats.keysByPurpose[keyData.purpose]) {
        stats.keysByPurpose[keyData.purpose] = 0;
      }
      stats.keysByPurpose[keyData.purpose]++;
      
      // Recent usage
      if (keyData.lastUsed > recentThreshold) {
        stats.recentUsage.push({
          keyId: keyData.id,
          purpose: keyData.purpose,
          lastUsed: new Date(keyData.lastUsed).toISOString(),
          usageCount: keyData.usageCount
        });
      }
    }

    stats.recentUsage.sort((a, b) => new Date(b.lastUsed) - new Date(a.lastUsed));

    return stats;
  }

  setupAutoRotation() {
    if (this.rotationTimer) {
      clearInterval(this.rotationTimer);
    }

    this.rotationTimer = setInterval(async () => {
      await this.performAutoRotation();
    }, this.rotationInterval);

    this.logger.info('Auto-rotation setup', {
      interval: this.rotationInterval,
      maxKeyAge: this.maxKeyAge
    });
  }

  async performAutoRotation() {
    const now = Date.now();
    const rotationThreshold = now - this.rotationInterval;

    for (const [keyId, keyData] of this.keys.entries()) {
      if (!keyData.active) continue;
      
      // Rotate keys that are old enough and haven't been rotated recently
      if (keyData.createdAt < rotationThreshold && 
          (!keyData.lastRotated || keyData.lastRotated < rotationThreshold)) {
        
        try {
          await this.rotateKey(keyId);
        } catch (error) {
          this.logger.error('Auto-rotation failed for key', {
            keyId,
            error: error.message
          });
        }
      }
    }
  }

  async cleanupExpiredKeys() {
    const now = Date.now();
    const cleanupThreshold = now - (30 * 24 * 60 * 60 * 1000); // 30 days
    
    const expiredKeys = [];
    
    for (const [keyId, keyData] of this.keys.entries()) {
      // Clean up keys that are expired and haven't been used in 30 days
      if (!keyData.active && 
          keyData.revokedAt && 
          keyData.revokedAt < cleanupThreshold) {
        expiredKeys.push(keyId);
      }
    }

    for (const keyId of expiredKeys) {
      try {
        const keyPath = path.join(this.keyStorePath, `${keyId}.key.json`);
        await fs.unlink(keyPath);
        this.keys.delete(keyId);
        
        this.logger.info('Cleaned up expired key', { keyId });
      } catch (error) {
        this.logger.error('Failed to cleanup expired key', {
          keyId,
          error: error.message
        });
      }
    }

    return expiredKeys.length;
  }

  async shutdown() {
    if (this.rotationTimer) {
      clearInterval(this.rotationTimer);
      this.rotationTimer = null;
    }

    this.logger.info('API Key Manager shutdown complete');
  }

  // Express middleware for API key authentication
  createMiddleware() {
    return async (req, res, next) => {
      const apiKey = req.headers['x-api-key'] || 
                   req.headers['authorization']?.replace('Bearer ', '') ||
                   req.query.api_key;

      if (!apiKey) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'API_KEY_REQUIRED',
            message: 'API key is required',
            guidance: [
              'Include API key in X-API-Key header',
              'Or use Authorization: Bearer <key> header',
              'Or include api_key query parameter'
            ]
          }
        });
      }

      const validation = await this.validateKey(apiKey);
      
      if (!validation.valid) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_API_KEY',
            message: validation.reason,
            guidance: [
              'Check that your API key is correct',
              'Ensure the key hasn\'t expired',
              'Verify the key is still active'
            ]
          }
        });
      }

      // Add key info to request
      req.apiKey = {
        id: validation.keyId,
        permissions: validation.permissions,
        purpose: validation.purpose,
        metadata: validation.metadata
      };

      next();
    };
  }

  // Permission check middleware
  requirePermission(permission) {
    return (req, res, next) => {
      if (!req.apiKey) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'Authentication required'
          }
        });
      }

      if (!req.apiKey.permissions.includes(permission)) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: `Permission '${permission}' required`,
            guidance: [
              `Your API key needs '${permission}' permission`,
              'Contact administrator to update key permissions'
            ]
          }
        });
      }

      next();
    };
  }
}

module.exports = APIKeyManager;