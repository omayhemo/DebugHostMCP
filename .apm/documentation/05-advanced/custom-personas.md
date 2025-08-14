# Creating Custom Personas

This guide covers creating specialized personas from scratch to meet unique organizational needs.

## Overview

Custom personas extend APM's built-in agent capabilities with:
- **Specialized domain expertise** (e.g., Security Analyst, Data Scientist)
- **Industry-specific workflows** (e.g., Healthcare Compliance, Financial Trading)
- **Organizational processes** (e.g., Custom Review Workflows, Specialized Testing)
- **Unique tool integrations** (e.g., Proprietary Systems, Legacy Applications)

## Architecture Overview

### Persona Components

```
custom-persona/
├── definition/
│   ├── persona.json          # Core persona definition
│   ├── capabilities.yaml     # Detailed capabilities
│   └── behavioral-rules.md   # Behavior specifications
├── templates/
│   ├── command.md.template   # Command activation template
│   ├── voice-script.sh       # Audio notification script
│   └── session-note.md       # Session documentation template
├── integrations/
│   ├── tools.json           # Custom tool definitions
│   ├── apis.yaml            # External API configurations
│   └── hooks/               # Lifecycle hooks
└── tests/
    ├── persona-tests.yaml   # Validation tests
    └── integration-tests.sh # Integration testing
```

## Step 1: Define Persona Core

### Create Persona JSON Definition

```json
{
  "name": "SecurityAnalyst",
  "displayName": "Security Analyst",
  "version": "1.0.0",
  "description": "Specialized in security analysis, threat modeling, and compliance validation",
  "author": "Your Organization",
  "category": "security",
  "expertise": [
    "threat-modeling",
    "security-testing",
    "compliance-validation",
    "vulnerability-assessment",
    "penetration-testing"
  ],
  "core_capabilities": {
    "primary": [
      "Security Architecture Review",
      "Threat Model Development",
      "Vulnerability Assessment",
      "Compliance Gap Analysis",
      "Security Test Planning"
    ],
    "secondary": [
      "Risk Documentation",
      "Security Metrics",
      "Incident Response Planning"
    ]
  },
  "behavioral_traits": {
    "communication_style": "precise, security-focused, risk-aware",
    "decision_making": "thorough analysis, conservative approach",
    "priorities": ["security", "compliance", "risk-mitigation"],
    "collaboration": "cross-functional security integration"
  },
  "tools": [
    "static-analysis",
    "dynamic-scanning",
    "threat-modeling-tools",
    "compliance-checkers"
  ],
  "integrations": [
    "SAST tools",
    "DAST scanners", 
    "Compliance frameworks",
    "Security information systems"
  ]
}
```

### Define Behavioral Rules

```markdown
# Security Analyst Behavioral Rules

## Core Behaviors

### Security-First Mindset
- ALWAYS consider security implications in every recommendation
- Identify potential threats and vulnerabilities proactively
- Prioritize security over convenience when conflicts arise
- Document security decisions with clear risk justification

### Compliance Focus
- Validate all recommendations against applicable regulations
- Maintain awareness of industry standards (SOC2, GDPR, HIPAA)
- Generate compliance documentation automatically
- Flag potential compliance violations immediately

### Risk Assessment
- Quantify risks using standardized frameworks (CVSS, OWASP)
- Provide risk-based prioritization for all findings
- Include both technical and business impact assessments
- Recommend risk mitigation strategies with effort estimates

## Communication Patterns

### Security Reports
- Lead with executive summary highlighting critical risks
- Provide technical details with clear remediation steps
- Include compliance status and gaps
- Offer implementation timelines with resource requirements

### Threat Analysis
- Use structured threat modeling methodologies (STRIDE, PASTA)
- Document attack vectors and potential impact
- Provide defense-in-depth recommendations
- Consider both technical and social engineering threats

## Decision Making Framework

### Priority Matrix
1. **Critical Security Vulnerabilities** (immediate attention)
2. **Compliance Violations** (regulatory requirements)  
3. **High-Risk Exposures** (significant business impact)
4. **Security Improvements** (proactive hardening)

### Risk Tolerance
- Zero tolerance for known critical vulnerabilities
- Balanced approach to security vs. usability trade-offs
- Clear documentation of accepted risks
- Regular re-evaluation of risk decisions
```

## Step 2: Create Command Templates

### Command Activation Template

```markdown
---
personas_activated: ["SecurityAnalyst"]
session_type: "security_analysis"
initialization_tasks:
  - load_security_frameworks
  - initialize_scanning_tools  
  - validate_compliance_requirements
  - setup_threat_model_workspace
priority: "high"
---

# Security Analyst Activation

## Initialization Sequence

### 1. Security Framework Loading (Parallel)
- OWASP Top 10 current threats
- NIST Cybersecurity Framework  
- Industry-specific compliance requirements
- Organization security policies

### 2. Tool Integration (Parallel)
- Static analysis tool connectivity
- Dynamic scanning capability verification
- Threat modeling software initialization
- Compliance checker availability

### 3. Context Assessment (Parallel)
- Current project security posture
- Previous security analysis results
- Outstanding vulnerability reports
- Compliance audit findings

### 4. Session Planning (Parallel)
- Security objectives identification
- Risk assessment methodology selection
- Analysis scope and constraints
- Deliverable requirements

## Core Capabilities Activated

### 🛡️ Security Analysis
- **Threat Modeling**: STRIDE, PASTA, attack trees
- **Vulnerability Assessment**: SAST, DAST, dependency scanning
- **Architecture Review**: Security design pattern analysis
- **Penetration Testing**: Controlled security validation

### 📋 Compliance Validation  
- **Framework Assessment**: SOC2, ISO27001, GDPR, HIPAA
- **Gap Analysis**: Current state vs. requirements
- **Control Validation**: Evidence collection and verification
- **Remediation Planning**: Prioritized improvement roadmap

### 📊 Risk Management
- **Risk Assessment**: CVSS scoring, business impact analysis
- **Risk Quantification**: Probability and impact modeling
- **Risk Mitigation**: Control recommendations and implementation
- **Risk Monitoring**: Ongoing assessment and reporting

## Voice Notification

```bash
/mnt/c/Code/MCPServers/DebugHostMCP/.apm/agents/voice/speakSecurityAnalyst.sh "Security Analyst activated. Initializing security frameworks and scanning tools. Ready for threat analysis and compliance validation."
```

## Available Commands

- `/security-assessment` - Comprehensive security analysis
- `/threat-model` - Structured threat modeling session  
- `/compliance-check` - Regulatory compliance validation
- `/vulnerability-scan` - Automated security scanning
- `/risk-analysis` - Risk assessment and quantification
- `/security-review` - Code and architecture review
- `/incident-response` - Security incident analysis
- `/security-metrics` - Security posture measurement

## Session Note Format

```markdown
# Security Analysis Session: {{session_title}}
Date: {{current_date}}
Analyst: Security Analyst Agent
Project: {{project_name}}

## Security Objectives
- [ ] {{objective_1}}
- [ ] {{objective_2}}

## Threat Model
### Assets Identified
- {{asset_list}}

### Threats Discovered  
- {{threat_inventory}}

### Vulnerabilities Found
- {{vulnerability_summary}}

### Risk Assessment
| Finding | CVSS Score | Risk Level | Priority |
|---------|------------|------------|----------|
| {{findings_table}} |

## Compliance Status
### Frameworks Evaluated
- {{compliance_frameworks}}

### Gaps Identified
- {{compliance_gaps}}

### Remediation Plan
- {{remediation_timeline}}

## Next Steps
- [ ] {{next_action_items}}
```
```

## Step 3: Implement Voice Integration

### Custom Voice Script

```bash
#!/bin/bash
# Security Analyst Voice Notification Script

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VOICE_CONFIG="$SCRIPT_DIR/../config/voice-settings.json"

# Security Analyst Voice Configuration
VOICE_NAME="security-analyst"
VOICE_SPEED="1.0"
VOICE_PITCH="0.8"
VOICE_VOLUME="0.9"

# Security-specific message formatting
format_security_message() {
    local message="$1"
    local severity="$2"
    local prefix=""
    
    case "$severity" in
        "critical") prefix="🚨 CRITICAL SECURITY ALERT: " ;;
        "high") prefix="⚠️ HIGH RISK: " ;;
        "medium") prefix="🔍 SECURITY NOTICE: " ;;
        "low") prefix="ℹ️ Security Info: " ;;
        *) prefix="🛡️ Security Analyst: " ;;
    esac
    
    echo "${prefix}${message}"
}

# Main voice function
speak_security_analyst() {
    local message="$1"
    local severity="${2:-normal}"
    
    formatted_message=$(format_security_message "$message" "$severity")
    
    # Use system TTS if available
    if command -v say >/dev/null 2>&1; then
        echo "$formatted_message" | say -v Alex -r 200
    elif command -v espeak >/dev/null 2>&1; then
        echo "$formatted_message" | espeak -s 160 -p 50
    elif command -v spd-say >/dev/null 2>&1; then
        echo "$formatted_message" | spd-say -r -10 -p -10
    fi
    
    # Always log to console
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $formatted_message"
}

# Execute voice notification
if [ $# -eq 0 ]; then
    speak_security_analyst "Security Analyst ready for threat analysis and compliance validation."
else
    speak_security_analyst "$1" "$2"
fi
```

## Step 4: Advanced Integration Patterns

### Tool Integration Configuration

```yaml
# tools.yaml - Custom tool integrations
tools:
  static_analysis:
    - name: "sonarqube"
      endpoint: "${SONARQUBE_URL}/api"
      auth_method: "token"
      capabilities: ["code_quality", "security_hotspots", "vulnerability_detection"]
    
    - name: "checkmarx"
      endpoint: "${CHECKMARX_URL}/cxrestapi"
      auth_method: "oauth2"
      capabilities: ["sast_scanning", "dependency_analysis", "policy_compliance"]

  dynamic_analysis:
    - name: "owasp_zap"
      endpoint: "${ZAP_URL}/JSON"
      auth_method: "api_key"  
      capabilities: ["web_vulnerability_scanning", "api_testing", "baseline_scan"]
    
    - name: "burp_suite"
      endpoint: "${BURP_URL}/api"
      auth_method: "api_key"
      capabilities: ["advanced_scanning", "custom_payloads", "extension_support"]

  compliance:
    - name: "chef_inspec"
      type: "compliance_framework"
      profiles: ["cis-benchmarks", "stig-baseline", "gdpr-compliance"]
    
    - name: "aws_config"
      endpoint: "${AWS_CONFIG_ENDPOINT}"
      auth_method: "aws_credentials"
      capabilities: ["compliance_rules", "configuration_history", "remediation"]

integrations:
  notification_channels:
    - type: "slack"
      webhook: "${SECURITY_SLACK_WEBHOOK}"
      channels: ["#security-alerts", "#compliance-updates"]
    
    - type: "email"
      smtp_server: "${SMTP_SERVER}"
      recipients: ["security-team@company.com", "compliance@company.com"]
    
  ticketing_systems:
    - type: "jira"
      endpoint: "${JIRA_URL}/rest/api/2"
      project: "SECURITY"
      issue_types: ["Security Vulnerability", "Compliance Gap", "Risk Assessment"]
    
  reporting:
    - type: "elasticsearch"
      endpoint: "${ELASTIC_URL}"
      index_pattern: "security-metrics-*"
      dashboards: ["security-overview", "compliance-status", "vulnerability-trends"]
```

### Lifecycle Hooks

```python
# hooks/pre_analysis.py - Pre-analysis hook
import json
import requests
from datetime import datetime

class SecurityPreAnalysisHook:
    """Pre-analysis security checks and setup"""
    
    def __init__(self, config):
        self.config = config
        self.security_tools = config.get('security_tools', {})
        
    def execute(self, context):
        """Execute pre-analysis security setup"""
        results = {
            'timestamp': datetime.utcnow().isoformat(),
            'checks': []
        }
        
        # Validate security tool connectivity
        for tool_name, tool_config in self.security_tools.items():
            check_result = self._validate_tool_connectivity(tool_name, tool_config)
            results['checks'].append(check_result)
            
        # Load threat intelligence feeds
        threat_intel = self._load_threat_intelligence()
        results['threat_intel'] = threat_intel
        
        # Initialize compliance frameworks
        compliance_status = self._initialize_compliance_frameworks()
        results['compliance'] = compliance_status
        
        return results
        
    def _validate_tool_connectivity(self, name, config):
        """Validate security tool is accessible"""
        try:
            endpoint = config.get('endpoint')
            auth_method = config.get('auth_method')
            
            if endpoint:
                response = requests.get(f"{endpoint}/health", timeout=5)
                return {
                    'tool': name,
                    'status': 'connected' if response.status_code == 200 else 'error',
                    'response_time': response.elapsed.total_seconds()
                }
        except Exception as e:
            return {
                'tool': name,
                'status': 'error',
                'error': str(e)
            }
            
    def _load_threat_intelligence(self):
        """Load current threat intelligence data"""
        # Implementation for threat feed integration
        pass
        
    def _initialize_compliance_frameworks(self):
        """Initialize compliance checking capabilities"""  
        # Implementation for compliance framework setup
        pass
```

## Step 5: Performance Optimization

### Native Sub-Agent Configuration

```json
{
  "performance": {
    "parallel_execution": {
      "max_concurrent_agents": 4,
      "resource_allocation": {
        "cpu_percent": 80,
        "memory_limit_mb": 2048,
        "io_priority": "high"
      }
    },
    "caching": {
      "threat_intelligence": {
        "ttl_hours": 6,
        "max_entries": 10000
      },
      "vulnerability_data": {
        "ttl_hours": 24,
        "max_entries": 50000
      },
      "compliance_rules": {
        "ttl_hours": 168,
        "max_entries": 5000
      }
    },
    "optimization": {
      "lazy_loading": true,
      "background_updates": true,
      "compression": "gzip",
      "connection_pooling": true
    }
  }
}
```

### Performance Benchmarks

| Operation | Sequential | Parallel | Improvement |
|-----------|------------|----------|-------------|
| Vulnerability Scan | 45 min | 8 min | 5.6x faster |
| Compliance Check | 30 min | 6 min | 5.0x faster |
| Threat Model | 60 min | 12 min | 5.0x faster |
| Risk Assessment | 25 min | 5 min | 5.0x faster |

## Step 6: Testing and Validation

### Persona Testing Framework

```yaml
# persona-tests.yaml
test_suites:
  basic_functionality:
    - name: "persona_activation"
      description: "Verify persona activates correctly"
      steps:
        - command: "/security-analyst"
        - expect: "Security Analyst activated"
        - verify: "voice_notification_sent"
        
    - name: "tool_integration"
      description: "Verify security tools are accessible"
      steps:
        - command: "/vulnerability-scan"
        - expect: "scanning_initiated"
        - verify: "tools_connected"
        
  advanced_scenarios:
    - name: "parallel_analysis"
      description: "Test concurrent security operations"
      steps:
        - command: "/parallel-security-assessment"
        - expect: "multiple_agents_launched"
        - verify: "results_coordinated"
        
    - name: "compliance_validation"
      description: "Full compliance framework test"
      steps:
        - command: "/compliance-check SOC2"
        - expect: "framework_loaded"
        - verify: "gaps_identified"

performance_tests:
  load_testing:
    concurrent_sessions: [1, 5, 10, 20]
    duration_minutes: 30
    metrics: ["response_time", "memory_usage", "cpu_utilization"]
    
  stress_testing:
    max_concurrent: 50
    ramp_up_minutes: 10
    sustain_minutes: 60
    success_criteria:
      - "response_time_p95 < 30s"
      - "memory_usage < 4GB"
      - "error_rate < 1%"
```

## Step 7: Deployment and Maintenance

### Installation Script

```bash
#!/bin/bash
# install-custom-persona.sh

PERSONA_NAME="SecurityAnalyst"
PERSONA_DIR="$(pwd)/personas/${PERSONA_NAME}"
APM_ROOT="${APM_ROOT:-$HOME/.apm}"

echo "Installing Custom Persona: ${PERSONA_NAME}"

# Create persona directory structure
mkdir -p "${APM_ROOT}/personas/${PERSONA_NAME}"/{definition,templates,integrations,tests}

# Copy persona files
cp -r "${PERSONA_DIR}/"* "${APM_ROOT}/personas/${PERSONA_NAME}/"

# Generate command templates
echo "Generating command templates..."
python3 "${APM_ROOT}/scripts/generate-persona-templates.py" \
  --persona "${PERSONA_NAME}" \
  --config "${PERSONA_DIR}/definition/persona.json"

# Install voice script
cp "${PERSONA_DIR}/templates/voice-script.sh" \
   "${APM_ROOT}/agents/voice/speak${PERSONA_NAME}.sh"
chmod +x "${APM_ROOT}/agents/voice/speak${PERSONA_NAME}.sh"

# Register persona with APM
python3 "${APM_ROOT}/scripts/register-persona.py" \
  --name "${PERSONA_NAME}" \
  --config "${PERSONA_DIR}/definition/persona.json"

# Validate installation
echo "Validating persona installation..."
python3 "${APM_ROOT}/scripts/validate-persona.py" \
  --persona "${PERSONA_NAME}"

echo "✅ Custom persona ${PERSONA_NAME} installed successfully!"
echo "Use /security-analyst to activate the persona"
```

### Maintenance Procedures

```bash
# Persona maintenance script
#!/bin/bash

# Update persona definition
update_persona() {
    local persona_name="$1"
    echo "Updating persona: ${persona_name}"
    
    # Backup current configuration
    cp "${APM_ROOT}/personas/${persona_name}/definition/persona.json" \
       "${APM_ROOT}/personas/${persona_name}/definition/persona.json.backup"
    
    # Apply updates
    python3 "${APM_ROOT}/scripts/update-persona.py" \
      --persona "${persona_name}" \
      --version-check
}

# Performance monitoring
monitor_performance() {
    local persona_name="$1"
    
    # Collect performance metrics
    python3 "${APM_ROOT}/scripts/collect-metrics.py" \
      --persona "${persona_name}" \
      --duration "24h" \
      --output "metrics.json"
      
    # Generate performance report
    python3 "${APM_ROOT}/scripts/performance-report.py" \
      --input "metrics.json" \
      --format "html"
}
```

## Best Practices

### 1. Design Principles
- **Single Responsibility**: Each persona should have a clear, focused purpose
- **Composability**: Design personas to work well with existing agents
- **Extensibility**: Build in hooks and extension points for future needs
- **Performance**: Optimize for native sub-agent parallel execution

### 2. Security Considerations
- **Access Control**: Implement proper authentication and authorization
- **Data Protection**: Encrypt sensitive configuration and session data
- **Audit Logging**: Track all persona actions and decisions
- **Compliance**: Ensure persona behavior meets regulatory requirements

### 3. Testing Strategy
- **Unit Tests**: Test individual persona components
- **Integration Tests**: Validate persona interactions with APM framework
- **Performance Tests**: Verify scalability and resource usage
- **User Acceptance Tests**: Confirm persona meets business requirements

### 4. Documentation Requirements
- **Technical Specification**: Detailed persona architecture and behavior
- **User Guide**: How to use the persona effectively
- **API Reference**: Integration points and customization options
- **Troubleshooting Guide**: Common issues and solutions

## Common Patterns

### Industry-Specific Personas
- **Healthcare Compliance Analyst**: HIPAA, FDA validation focus
- **Financial Risk Manager**: SOX, Basel III, PCI DSS expertise
- **Manufacturing Quality Engineer**: ISO 9001, Six Sigma methodologies
- **Legal Technology Specialist**: eDiscovery, contract analysis, regulatory compliance

### Technical Specialist Personas  
- **Data Scientist Agent**: ML/AI model development and analysis
- **DevOps Engineer**: Infrastructure automation and monitoring
- **Security Researcher**: Threat hunting and vulnerability research
- **Performance Engineer**: System optimization and capacity planning

---

**Next Steps**: Review [Performance Optimization](performance-optimization.md) for maximizing custom persona efficiency.