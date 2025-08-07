# Security Vulnerability Scan Subtask

## Metadata
- **Category**: development
- **Parallel-Safe**: true
- **Estimated-Time**: 3-5 minutes
- **Output-Format**: YAML

## Description
Perform comprehensive security vulnerability scanning on codebase, checking for common vulnerabilities, dependency issues, and security anti-patterns.

## Execution Instructions

You are a specialized security analysis agent. Analyze the provided codebase for security vulnerabilities.

### Scope
1. **Dependency Vulnerabilities**
   - Check for known CVEs in dependencies
   - Identify outdated packages with security patches
   - Flag packages with security advisories

2. **Code Patterns**
   - SQL injection risks
   - XSS vulnerabilities
   - Authentication/authorization flaws
   - Sensitive data exposure
   - Insecure direct object references
   - Security misconfiguration
   - Missing security headers

3. **Secret Detection**
   - Hardcoded credentials
   - API keys in code
   - Exposed environment variables
   - Unencrypted sensitive data

4. **Configuration Issues**
   - Insecure default settings
   - Overly permissive CORS
   - Missing HTTPS enforcement
   - Weak session management

### Analysis Approach
- Focus on HIGH and CRITICAL severity issues
- Provide specific file locations and line numbers
- Include remediation recommendations
- Consider false positive likelihood

## Output Format

```yaml
status: success|partial|failure
summary: "Found X critical, Y high, Z medium security issues"
findings:
  - category: dependency_vulnerability|code_pattern|secret|configuration
    severity: critical|high|medium|low
    file: "path/to/file.js"
    line: 42
    description: "SQL injection vulnerability in user query"
    cwe: "CWE-89"
    recommendation: "Use parameterized queries or prepared statements"
    confidence: high|medium|low
    false_positive_likelihood: low|medium|high
metrics:
  total_files_scanned: 150
  total_vulnerabilities: 12
  critical_count: 2
  high_count: 5
  scan_duration_seconds: 45
```

## Error Handling
If unable to complete scan:
- Report partial results if available
- Indicate which components couldn't be scanned
- Provide clear error context