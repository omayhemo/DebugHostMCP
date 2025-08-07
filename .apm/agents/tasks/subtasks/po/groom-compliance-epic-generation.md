# Compliance Epic Generation Subtask

## Purpose
Generate epics for compliance requirements, regulatory implementations, and security standards.

## Input
- Compliance analysis results
- Regulatory requirements
- Security audit findings
- Privacy regulations
- Industry standards

## Processing Steps
1. Group compliance requirements by regulation
2. Define compliance objectives
3. Map technical implementations
4. Establish audit procedures
5. Plan certification paths
6. Estimate compliance effort

## Output Format
```yaml
compliance_epics:
  - id: "EPIC-C001"
    title: "GDPR Compliance Implementation"
    regulation: "GDPR"
    compliance_deadline: "2024-05-25"
    priority: "P0"
    legal_requirement: true
    
    description: |
      Implement full GDPR compliance including user consent management,
      data portability, right to deletion, and privacy by design principles
      across all systems handling EU user data.
    
    compliance_requirements:
      - req_id: "GDPR-01"
        article: "Article 17"
        requirement: "Right to erasure"
        implementation: "User data deletion API"
        
      - req_id: "GDPR-02"
        article: "Article 20"
        requirement: "Data portability"
        implementation: "Data export functionality"
        
      - req_id: "GDPR-03"
        article: "Article 7"
        requirement: "Consent management"
        implementation: "Consent tracking system"
    
    technical_implementations:
      data_deletion:
        - "Soft delete with retention period"
        - "Hard delete after 30 days"
        - "Cascade deletion to all services"
        - "Deletion audit log"
        
      data_export:
        - "JSON/CSV export formats"
        - "Include all personal data"
        - "Automated generation"
        - "Secure download link"
        
      consent_management:
        - "Granular consent options"
        - "Consent version tracking"
        - "Withdrawal mechanism"
        - "Consent audit trail"
    
    privacy_by_design:
      - "Data minimization"
      - "Purpose limitation"
      - "Default privacy settings"
      - "End-to-end encryption"
    
    audit_requirements:
      - "Quarterly compliance review"
      - "Annual third-party audit"
      - "Automated compliance checks"
      - "Documentation maintenance"
    
    deliverables:
      - "Privacy policy update"
      - "Data processing agreements"
      - "Technical documentation"
      - "Compliance dashboard"
      - "User-facing privacy center"
    
    success_criteria:
      - "100% data deletion requests fulfilled"
      - "Data export within 30 days"
      - "Consent tracked for all users"
      - "Pass compliance audit"
    
    phases:
      - phase: "Assessment"
        tasks:
          - "Data inventory"
          - "Gap analysis"
        duration: "2 weeks"
        
      - phase: "Implementation"
        tasks:
          - "Technical changes"
          - "Process updates"
        duration: "6 weeks"
        
      - phase: "Validation"
        tasks:
          - "Internal audit"
          - "Remediation"
        duration: "2 weeks"
    
    risks:
      - "Deadline penalties if missed"
      - "Complex cross-system changes"
      - "User experience impact"
    
    estimated_effort: "XL"
    penalty_for_non_compliance: "4% of annual revenue"
```

## Compliance Categories
- Data Privacy (GDPR, CCPA)
- Financial (PCI-DSS, SOX)
- Healthcare (HIPAA)
- Security (SOC2, ISO 27001)
- Accessibility (WCAG, ADA)
- Industry-specific

## Quality Checks
- All articles/sections addressed
- Implementation technically feasible
- Audit trail comprehensive
- Deadlines realistic
- Documentation complete