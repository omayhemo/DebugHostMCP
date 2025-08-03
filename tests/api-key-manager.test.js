/**
 * Test Suite for API Key Manager
 * Comprehensive testing of API key generation, validation, rotation, and security
 */

const fs = require('fs').promises;
const path = require('path');
const tmp = require('tmp');
const APIKeyManager = require('../src/api-key-manager');

describe('API Key Manager', () => {
  let keyManager;
  let tempDir;
  let mockLogger;

  beforeEach(async () => {
    // Create temporary directory for test keys
    tempDir = tmp.dirSync({ unsafeCleanup: true });
    
    // Mock logger
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    };

    // Initialize key manager with test configuration
    keyManager = new APIKeyManager({
      keyStorePath: tempDir.name,
      rotationInterval: 100, // 100ms for testing
      maxKeyAge: 1000, // 1 second for testing
      logger: mockLogger
    });

    await new Promise(resolve => setTimeout(resolve, 50)); // Allow initialization
  });

  afterEach(async () => {
    if (keyManager) {
      await keyManager.shutdown();
    }
    tempDir.removeCallback();
  });

  describe('Initialization', () => {
    test('should initialize with default key', async () => {
      const keys = await keyManager.listKeys();
      expect(keys).toHaveLength(1);
      expect(keys[0].id).toBe('default');
      expect(keys[0].active).toBe(true);
    });

    test('should create key store directory', async () => {
      const stats = await fs.stat(tempDir.name);
      expect(stats.isDirectory()).toBe(true);
    });

    test('should load existing keys on restart', async () => {
      // Generate additional key
      await keyManager.generateKey('test-key');
      
      // Create new manager instance
      const newManager = new APIKeyManager({
        keyStorePath: tempDir.name,
        logger: mockLogger
      });
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const keys = await newManager.listKeys();
      expect(keys).toHaveLength(2);
      
      await newManager.shutdown();
    });
  });

  describe('Key Generation', () => {
    test('should generate new API key', async () => {
      const keyData = await keyManager.generateKey('test-key', {
        purpose: 'testing',
        permissions: ['read']
      });

      expect(keyData.id).toBe('test-key');
      expect(keyData.purpose).toBe('testing');
      expect(keyData.permissions).toEqual(['read']);
      expect(keyData.plainKey).toBeDefined();
      expect(keyData.active).toBe(true);
      expect(keyData.createdAt).toBeGreaterThan(0);
    });

    test('should generate unique keys', async () => {
      const key1 = await keyManager.generateKey();
      const key2 = await keyManager.generateKey();

      expect(key1.id).not.toBe(key2.id);
      expect(key1.plainKey).not.toBe(key2.plainKey);
    });

    test('should save key to disk', async () => {
      const keyData = await keyManager.generateKey('disk-test');
      
      const keyPath = path.join(tempDir.name, 'disk-test.key.json');
      const savedData = JSON.parse(await fs.readFile(keyPath, 'utf8'));
      
      expect(savedData.id).toBe('disk-test');
      expect(savedData.plainKey).toBeUndefined(); // Should not save plain key
    });
  });

  describe('Key Validation', () => {
    test('should validate correct API key', async () => {
      const keyData = await keyManager.generateKey('valid-key');
      
      const validation = await keyManager.validateKey(keyData.plainKey);
      
      expect(validation.valid).toBe(true);
      expect(validation.keyId).toBe('valid-key');
    });

    test('should reject invalid API key', async () => {
      const validation = await keyManager.validateKey('invalid-key');
      
      expect(validation.valid).toBe(false);
      expect(validation.reason).toBe('Invalid key');
    });

    test('should reject empty API key', async () => {
      const validation = await keyManager.validateKey('');
      
      expect(validation.valid).toBe(false);
      expect(validation.reason).toBe('No key provided');
    });

    test('should reject inactive API key', async () => {
      const keyData = await keyManager.generateKey('inactive-key');
      await keyManager.revokeKey('inactive-key');
      
      const validation = await keyManager.validateKey(keyData.plainKey);
      
      expect(validation.valid).toBe(false);
      expect(validation.reason).toBe('Key is inactive');
    });

    test('should update usage statistics on validation', async () => {
      const keyData = await keyManager.generateKey('usage-key');
      
      await keyManager.validateKey(keyData.plainKey);
      await keyManager.validateKey(keyData.plainKey);
      
      const keys = await keyManager.listKeys();
      const usageKey = keys.find(k => k.id === 'usage-key');
      
      expect(usageKey.usageCount).toBe(2);
      expect(usageKey.lastUsed).not.toBeNull();
    });
  });

  describe('Key Rotation', () => {
    test('should rotate API key', async () => {
      const originalKey = await keyManager.generateKey('rotate-key');
      
      const rotatedKey = await keyManager.rotateKey('rotate-key');
      
      expect(rotatedKey.id).toBe('rotate-key');
      expect(rotatedKey.plainKey).not.toBe(originalKey.plainKey);
      expect(rotatedKey.active).toBe(true);
      
      // Original key should be inactive
      const keys = await keyManager.listKeys(true); // Include inactive
      const originalKeyData = keys.find(k => k.id === 'rotate-key' && !k.active);
      expect(originalKeyData).toBeDefined();
    });

    test('should perform auto-rotation', async () => {
      const keyData = await keyManager.generateKey('auto-rotate');
      
      // Wait for auto-rotation to trigger
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const keys = await keyManager.listKeys(true);
      const rotatedKeys = keys.filter(k => k.id === 'auto-rotate');
      
      // Should have both old and new versions
      expect(rotatedKeys.length).toBeGreaterThan(1);
    });
  });

  describe('Key Revocation', () => {
    test('should revoke API key', async () => {
      await keyManager.generateKey('revoke-key');
      
      const result = await keyManager.revokeKey('revoke-key', 'Test revocation');
      
      expect(result).toBe(true);
      
      const keys = await keyManager.listKeys(true);
      const revokedKey = keys.find(k => k.id === 'revoke-key');
      
      expect(revokedKey.active).toBe(false);
      expect(revokedKey.revocationReason).toBe('Test revocation');
      expect(revokedKey.revokedAt).not.toBeNull();
    });

    test('should throw error when revoking non-existent key', async () => {
      await expect(keyManager.revokeKey('non-existent')).rejects.toThrow('Key non-existent not found');
    });
  });

  describe('Key Listing and Statistics', () => {
    test('should list active keys only by default', async () => {
      await keyManager.generateKey('active-key');
      await keyManager.generateKey('revoked-key');
      await keyManager.revokeKey('revoked-key');
      
      const keys = await keyManager.listKeys();
      
      expect(keys).toHaveLength(2); // default + active-key
      expect(keys.every(k => k.active)).toBe(true);
    });

    test('should list all keys when requested', async () => {
      await keyManager.generateKey('active-key');
      await keyManager.generateKey('revoked-key');
      await keyManager.revokeKey('revoked-key');
      
      const keys = await keyManager.listKeys(true);
      
      expect(keys).toHaveLength(3); // default + active-key + revoked-key
    });

    test('should provide usage statistics', async () => {
      await keyManager.generateKey('stats-key-1', { purpose: 'testing' });
      await keyManager.generateKey('stats-key-2', { purpose: 'production' });
      
      const stats = await keyManager.getKeyUsageStats();
      
      expect(stats.totalKeys).toBe(3); // default + 2 new keys
      expect(stats.activeKeys).toBe(3);
      expect(stats.keysByPurpose.testing).toBe(1);
      expect(stats.keysByPurpose.production).toBe(1);
    });
  });

  describe('Middleware', () => {
    let middleware;
    let mockReq;
    let mockRes;
    let mockNext;

    beforeEach(() => {
      middleware = keyManager.createMiddleware();
      mockNext = jest.fn();
      mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
    });

    test('should authenticate valid API key in header', async () => {
      const keyData = await keyManager.generateKey('middleware-key');
      
      mockReq = {
        headers: { 'x-api-key': keyData.plainKey }
      };
      
      await middleware(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.apiKey).toBeDefined();
      expect(mockReq.apiKey.id).toBe('middleware-key');
    });

    test('should authenticate valid API key in authorization header', async () => {
      const keyData = await keyManager.generateKey('auth-header-key');
      
      mockReq = {
        headers: { 'authorization': `Bearer ${keyData.plainKey}` }
      };
      
      await middleware(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.apiKey.id).toBe('auth-header-key');
    });

    test('should authenticate valid API key in query parameter', async () => {
      const keyData = await keyManager.generateKey('query-key');
      
      mockReq = {
        headers: {},
        query: { api_key: keyData.plainKey }
      };
      
      await middleware(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.apiKey.id).toBe('query-key');
    });

    test('should reject request without API key', async () => {
      mockReq = {
        headers: {},
        query: {}
      };
      
      await middleware(mockReq, mockRes, mockNext);
      
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'API_KEY_REQUIRED'
          })
        })
      );
    });

    test('should reject request with invalid API key', async () => {
      mockReq = {
        headers: { 'x-api-key': 'invalid-key' }
      };
      
      await middleware(mockReq, mockRes, mockNext);
      
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'INVALID_API_KEY'
          })
        })
      );
    });
  });

  describe('Permission Middleware', () => {
    let permissionMiddleware;
    let mockReq;
    let mockRes;
    let mockNext;

    beforeEach(() => {
      permissionMiddleware = keyManager.requirePermission('write');
      mockNext = jest.fn();
      mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
    });

    test('should allow request with required permission', () => {
      mockReq = {
        apiKey: {
          permissions: ['read', 'write']
        }
      };
      
      permissionMiddleware(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
    });

    test('should reject request without required permission', () => {
      mockReq = {
        apiKey: {
          permissions: ['read']
        }
      };
      
      permissionMiddleware(mockReq, mockRes, mockNext);
      
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'INSUFFICIENT_PERMISSIONS'
          })
        })
      );
    });

    test('should reject request without authentication', () => {
      mockReq = {};
      
      permissionMiddleware(mockReq, mockRes, mockNext);
      
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });
  });

  describe('Cleanup', () => {
    test('should cleanup expired keys', async () => {
      // Create old revoked key
      const keyData = await keyManager.generateKey('old-key');
      await keyManager.revokeKey('old-key');
      
      // Manually set old revocation date
      const key = keyManager.keys.get('old-key');
      key.revokedAt = Date.now() - (31 * 24 * 60 * 60 * 1000); // 31 days ago
      await keyManager.saveKey(key);
      
      const cleanedCount = await keyManager.cleanupExpiredKeys();
      
      expect(cleanedCount).toBe(1);
      expect(keyManager.keys.has('old-key')).toBe(false);
    });
  });

  describe('Security', () => {
    test('should hash keys for storage', async () => {
      const keyData = await keyManager.generateKey('hash-test');
      
      const keyPath = path.join(tempDir.name, 'hash-test.key.json');
      const savedData = JSON.parse(await fs.readFile(keyPath, 'utf8'));
      
      expect(savedData.key).not.toBe(keyData.plainKey);
      expect(savedData.key).toHaveLength(64); // SHA-256 hex
    });

    test('should not store plain keys on disk', async () => {
      const keyData = await keyManager.generateKey('plain-test');
      
      // Wait for plain key to be removed from memory
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      const memoryKey = keyManager.keys.get('plain-test');
      expect(memoryKey.plainKey).toBeUndefined();
    });

    test('should use secure file permissions', async () => {
      await keyManager.generateKey('perm-test');
      
      const keyPath = path.join(tempDir.name, 'perm-test.key.json');
      const stats = await fs.stat(keyPath);
      
      // Check that file is readable only by owner (600 permissions)
      const permissions = stats.mode & parseInt('777', 8);
      expect(permissions).toBe(parseInt('600', 8));
    });
  });
});