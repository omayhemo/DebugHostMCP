# Compliance & Constraint Analysis Subtask

## Purpose
Identify regulatory requirements, business constraints, and compliance needs from documentation.

## Input
- Compliance documentation
- Legal requirements
- Industry standards
- Business policies
- Security requirements
- Privacy regulations

## Processing Steps
1. Identify applicable regulations (GDPR, CCPA, PCI, etc.)
2. Extract specific compliance requirements
3. Map requirements to system components
4. Identify gaps in current compliance
5. Define audit requirements
6. Estimate compliance effort

## Output Format
```yaml
compliance_analysis:
  applicable_regulations:
    - name: "GDPR"
      scope: "EU user data"
      status: "partial_compliance"
      
    - name: "PCI-DSS"
      scope: "Payment processing"
      status: "required"
      
    - name: "SOC2"
      scope: "Security controls"
      status: "planned"
      
  requirements:
    - id: "COMP-001"
      regulation: "GDPR"
      requirement: "Right to deletion"
      description: "Users can request data deletion"
      current_status: "not_implemented"
      priority: "HIGH"
      components_affected:
        - "User service"
        - "Database"
        - "Backup systems"
      implementation:
        - "Add deletion API endpoint"
        - "Cascade delete to all services"
        - "Log deletion requests"
      effort: "M"
      deadline: "2024-05-25"
      
    - id: "COMP-002"
      regulation: "GDPR"
      requirement: "Data portability"
      description: "Export user data in machine-readable format"
      current_status: "not_implemented"
      priority: "HIGH"
      implementation:
        - "Create data export service"
        - "Define standard export format"
        - "Add UI for data requests"
      effort: "L"
      
    - id: "COMP-003"
      regulation: "PCI-DSS"
      requirement: "No storage of CVV"
      description: "Never store card verification values"
      current_status: "compliant"
      priority: "CRITICAL"
      verification: "Code review required"
      
  business_constraints:
    - constraint: "Data residency"
      description: "EU data must stay in EU"
      impact: "Infrastructure choices"
      
    - constraint: "Audit logging"
      description: "90-day retention required"
      impact: "Storage planning"
      
  security_requirements:
    - "End-to-end encryption for PII"
    - "Multi-factor authentication"
    - "Role-based access control"
    - "Audit trail for all data access"
    
  compliance_gaps:
    critical: 2
    high: 5
    medium: 3
    estimated_effort_days: 30
```

## Quality Checks
- All applicable regulations identified
- Requirements mapped to components
- Deadlines clearly specified
- Implementation steps actionable
- Compliance gaps prioritized