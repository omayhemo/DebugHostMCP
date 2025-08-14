# Security Vulnerability Scan Subtask

## Metadata
- **Category**: analysis
- **Complexity**: high
- **Est. Duration**: 5-7 minutes
- **Dependencies**: none

## Context
Use this subtask to identify security vulnerabilities and potential attack vectors in code. Focuses on OWASP Top 10 and common security anti-patterns.

## Input Requirements
- **Required**: Code files or directory path to analyze
- **Optional**: Specific security concerns or compliance requirements

## Execution Instructions
Perform a comprehensive security analysis:

1. **Authentication & Authorization**
   - Check for hard-coded credentials
   - Review authentication flow
   - Verify authorization checks
   - Assess session management

2. **Input Validation & Sanitization**
   - Identify unvalidated inputs
   - Check for SQL injection vulnerabilities
   - Look for XSS possibilities
   - Review file upload handling

3. **Data Protection**
   - Check encryption usage
   - Review sensitive data handling
   - Assess data transmission security
   - Verify secure storage practices

4. **Common Vulnerabilities**
   - CSRF protection
   - Directory traversal
   - Command injection
   - XML/XXE attacks
   - Insecure deserialization

## Output Format
```yaml
status: success
summary: Security scan complete with X critical vulnerabilities found
findings:
  - category: authentication
    severity: critical
    description: "Password stored in plain text in database"
    recommendation: "Use bcrypt or argon2 for password hashing"
  - category: injection
    severity: high
    description: "SQL query constructed with string concatenation using user input"
    recommendation: "Use parameterized queries or prepared statements"
  - category: data-exposure
    severity: medium
    description: "API returns full user object including sensitive fields"
    recommendation: "Implement field filtering and use DTOs for API responses"
metrics:
  - name: "Critical Vulnerabilities"
    value: 2
    unit: "count"
  - name: "OWASP Coverage"
    value: 10
    unit: "categories checked"
```

## Error Handling
- If unable to determine security context: Note assumptions made
- If framework-specific: Identify framework and note limitations
- Focus on definite vulnerabilities over potential issues