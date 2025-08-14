# Story 5.5: API Key Authentication System

**Story ID**: 5.5  
**Epic**: Authentication & Security Framework (Epic 4)  
**Sprint**: 5  
**Story Points**: 8  
**Priority**: Medium-High  
**Created**: August 8, 2025  

## User Story

**As a** developer or CI/CD system  
**I want** API key-based authentication for programmatic access  
**So that** automated tools and scripts can securely interact with the MCP Debug Host Platform without interactive login  

## Business Value

- **Automation Support**: Enables CI/CD pipeline integration
- **Developer Productivity**: Allows scripting and tool integration
- **Enterprise Integration**: Supports enterprise toolchain connectivity
- **Security**: Provides non-interactive authentication with proper access control

## Acceptance Criteria

### API Key Generation and Management
1. **GIVEN** a user wants to create an API key  
   **WHEN** they generate a new key  
   **THEN** a cryptographically secure API key is created with configurable permissions  

2. **GIVEN** a user has multiple API keys  
   **WHEN** they view their keys  
   **THEN** they see key name, permissions, last used date, and expiration  

3. **GIVEN** a user wants to revoke an API key  
   **WHEN** they delete the key  
   **THEN** the key becomes immediately invalid for all requests  

### API Key Authentication
4. **GIVEN** a client provides a valid API key  
   **WHEN** making API requests  
   **THEN** authentication succeeds and appropriate permissions are applied  

5. **GIVEN** a client provides an invalid API key  
   **WHEN** making API requests  
   **THEN** authentication fails with 401 Unauthorized status  

6. **GIVEN** an API key is used  
   **WHEN** the request completes  
   **THEN** last used timestamp is updated for the key  

### Permission Scoping
7. **GIVEN** an API key is created with specific permissions  
   **WHEN** the key is used for requests  
   **THEN** only actions within the granted permissions are allowed  

8. **GIVEN** an API key lacks required permissions  
   **WHEN** attempting a restricted action  
   **THEN** access is denied with 403 Forbidden status  

9. **GIVEN** multiple API keys exist for a user  
   **WHEN** each key is used  
   **THEN** permissions are enforced independently per key  

### Key Security Features
10. **GIVEN** an API key is created  
    **WHEN** examining key properties  
    **THEN** it has expiration date, rate limits, and IP restrictions (optional)  

11. **GIVEN** an API key exceeds rate limits  
    **WHEN** additional requests are made  
    **THEN** requests are rejected with 429 Too Many Requests  

12. **GIVEN** an API key has IP restrictions  
    **WHEN** requests come from unauthorized IPs  
    **THEN** access is denied regardless of key validity  

### Integration with Existing Auth
13. **GIVEN** the platform supports multiple auth methods  
    **WHEN** API key and JWT auth are both available  
    **THEN** either method can be used independently  

14. **GIVEN** a user has both session and API key auth  
    **WHEN** making requests  
    **THEN** the appropriate auth method is automatically detected  

15. **GIVEN** an API key user performs actions  
    **WHEN** audit logs are generated  
    **THEN** actions are attributed to the API key owner  

## Technical Requirements

### Database Schema
```sql
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  key_hash VARCHAR(255) NOT NULL UNIQUE,
  key_prefix VARCHAR(10) NOT NULL, -- First 8 chars for identification
  permissions JSONB NOT NULL DEFAULT '[]',
  ip_whitelist JSONB, -- Array of allowed IP addresses/ranges
  rate_limit_per_hour INTEGER DEFAULT 1000,
  expires_at TIMESTAMP,
  last_used_at TIMESTAMP,
  last_used_ip INET,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE api_key_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID REFERENCES api_keys(id) ON DELETE CASCADE,
  endpoint VARCHAR(255) NOT NULL,
  method VARCHAR(10) NOT NULL,
  ip_address INET,
  user_agent TEXT,
  status_code INTEGER,
  response_time_ms INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_user_active ON api_keys(user_id, is_active);
CREATE INDEX idx_api_key_usage_key_time ON api_key_usage_logs(api_key_id, created_at);
```

### API Key Format and Security
```javascript
// API Key format: mcp_dev_1234567890abcdef1234567890abcdef
const API_KEY_FORMAT = {
  prefix: 'mcp',        // Platform identifier
  env: 'dev',          // Environment (dev/prod)
  separator: '_',
  keyLength: 32,       // Hex characters
  totalLength: 43      // Full key length
};

// Key generation
const generateApiKey = () => {
  const randomBytes = crypto.randomBytes(16);
  const keyPart = randomBytes.toString('hex');
  const env = process.env.NODE_ENV === 'production' ? 'prod' : 'dev';
  return `mcp_${env}_${keyPart}`;
};

// Key hashing for storage
const hashApiKey = (key) => {
  return crypto.pbkdf2Sync(key, process.env.API_KEY_SALT, 100000, 64, 'sha512').toString('hex');
};
```

### Authentication Middleware
```typescript
const authenticateApiKey = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const apiKey = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    
    if (!apiKey || !apiKey.startsWith('mcp_')) {
      return next(); // Not an API key, try other auth methods
    }

    const keyHash = hashApiKey(apiKey);
    const keyRecord = await getApiKeyByHash(keyHash);
    
    if (!keyRecord || !keyRecord.is_active) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    // Check expiration
    if (keyRecord.expires_at && keyRecord.expires_at < new Date()) {
      return res.status(401).json({ error: 'API key expired' });
    }

    // Check IP whitelist
    if (keyRecord.ip_whitelist && keyRecord.ip_whitelist.length > 0) {
      const clientIp = req.ip;
      if (!isIpInWhitelist(clientIp, keyRecord.ip_whitelist)) {
        return res.status(403).json({ error: 'IP address not authorized' });
      }
    }

    // Check rate limiting
    const rateLimitOk = await checkApiKeyRateLimit(keyRecord.id);
    if (!rateLimitOk) {
      return res.status(429).json({ error: 'Rate limit exceeded' });
    }

    // Update usage tracking
    await updateApiKeyUsage(keyRecord.id, req);
    
    // Set user context
    req.user = await getUserById(keyRecord.user_id);
    req.apiKey = keyRecord;
    req.authMethod = 'api_key';
    
    next();
  } catch (error) {
    return res.status(500).json({ error: 'API key authentication failed' });
  }
};
```

### API Endpoints
```typescript
// API Key management endpoints
GET    /api/keys           // List user's API keys
POST   /api/keys           // Create new API key
PUT    /api/keys/:id       // Update API key (name, permissions, expiration)
DELETE /api/keys/:id       // Revoke API key
GET    /api/keys/:id/usage // Get usage statistics for key
POST   /api/keys/:id/rotate // Rotate key (generate new value)
```

### Permission Integration
```javascript
const apiKeyPermissions = {
  // Predefined permission templates
  'read-only': [
    'project:read',
    'container:logs',
    'resource:view'
  ],
  
  'developer': [
    'project:read', 'project:create', 'project:update',
    'container:start', 'container:stop', 'container:restart',
    'container:logs'
  ],
  
  'ci-cd': [
    'project:create', 'project:update',
    'container:start', 'container:stop',
    'container:logs'
  ],
  
  'monitoring': [
    'project:read',
    'container:logs',
    'resource:view'
  ]
};
```

## Dependencies

### Prerequisites
- Story 5.1 (JWT Authentication Service) - **REQUIRED**
- Story 5.3 (RBAC Foundation) - **REQUIRED**
- Database connection and user management
- Existing authentication middleware architecture

### External Libraries
- `crypto` - Key generation and hashing
- `express-rate-limit` - Rate limiting
- `ip-range-check` - IP whitelist validation
- `joi` - Input validation for API key creation

## Testing Strategy

### Unit Tests
- API key generation and validation
- Key hashing and verification
- Permission evaluation for API keys
- Rate limiting enforcement
- IP whitelist validation

### Integration Tests
- Complete API key authentication flow
- Permission enforcement with API keys
- Rate limiting under concurrent requests
- API key management endpoints
- Audit logging for API key usage

### Security Tests
- API key brute force resistance
- Permission bypass attempts
- Rate limit bypass testing
- IP restriction circumvention attempts
- Key enumeration attacks

## Definition of Done

- [ ] API key generation with secure randomness
- [ ] API key authentication middleware functional
- [ ] Permission scoping for API keys working
- [ ] Rate limiting per API key enforced
- [ ] IP whitelist functionality (optional)
- [ ] API key management endpoints complete
- [ ] Usage tracking and audit logging
- [ ] Key expiration and automatic cleanup
- [ ] Integration with existing RBAC system
- [ ] Comprehensive test suite (>85% coverage)
- [ ] Performance benchmarks met
- [ ] Security review completed
- [ ] API documentation with examples

## Security Considerations

### Key Security
- **Generation**: Cryptographically secure random generation
- **Storage**: PBKDF2 hashing with salt for stored keys
- **Transmission**: HTTPS required for API key authentication
- **Rotation**: Support for key rotation without service disruption

### Access Control
- **Permissions**: Granular permission scoping per key
- **Rate Limiting**: Per-key rate limits to prevent abuse
- **IP Restrictions**: Optional IP whitelisting for sensitive keys
- **Expiration**: Configurable expiration dates for keys

### Monitoring
- **Usage Tracking**: Log all API key usage for audit
- **Anomaly Detection**: Monitor for unusual usage patterns
- **Breach Response**: Immediate key revocation capability
- **Compliance**: Audit trails for regulatory compliance

## Story Sizing Justification (8 Points)

This is a **medium-high complexity** story requiring:
- Secure API key generation and management system
- Integration with existing authentication and authorization
- Database schema changes and usage tracking
- Rate limiting and IP whitelisting functionality
- Comprehensive security considerations
- API management endpoints and validation
- Performance optimization for programmatic access

The 8-point estimate reflects the security-sensitive nature and the need for seamless integration with existing authentication systems while providing enterprise-grade features.

---

*This story enables programmatic access to the platform, supporting automation, CI/CD integration, and developer tooling.*