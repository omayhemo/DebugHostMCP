# Feature Epic Generation Subtask

## Purpose
Generate feature epics from extracted functional requirements and feature analysis.

## Input
- Feature extraction results
- Business objectives
- User personas
- PRD sections
- Success metrics

## Processing Steps
1. Group related features into epic themes
2. Define epic scope and boundaries
3. Create epic-level acceptance criteria
4. Establish success metrics
5. Identify MVP vs. future scope
6. Estimate epic complexity

## Output Format
```yaml
feature_epics:
  - id: "EPIC-001"
    title: "User Authentication & Authorization"
    theme: "Security & Access"
    business_objective: "Secure user access and data protection"
    priority: "P0"
    
    description: |
      Implement complete authentication and authorization system
      supporting multiple auth methods, role-based access control,
      and enterprise SSO integration.
    
    features_included:
      - "F001: User registration"
      - "F002: Multi-factor authentication"
      - "F003: Password management"
      - "F004: SSO integration"
      - "F005: Role-based permissions"
    
    acceptance_criteria:
      - "Users can register with email/password"
      - "MFA can be enabled/disabled per user"
      - "Password reset flow via email"
      - "Support for OAuth 2.0 providers"
      - "Granular permission system"
      
    success_metrics:
      - metric: "Registration conversion"
        target: ">60%"
        measurement: "Completed registrations / started"
        
      - metric: "Authentication time"
        target: "<2 seconds"
        measurement: "95th percentile response time"
        
      - metric: "Security incidents"
        target: "0 breaches"
        measurement: "Unauthorized access attempts"
    
    mvp_scope:
      - "Email/password authentication"
      - "Basic role system (admin/user)"
      - "Password reset"
      
    future_scope:
      - "SSO integration"
      - "Advanced RBAC"
      - "Biometric authentication"
    
    dependencies:
      - "Database schema design"
      - "Email service integration"
      - "Security audit"
    
    estimated_sprints: 3
    team_requirements:
      - "Backend developers (2)"
      - "Frontend developer (1)"
      - "Security reviewer"
    
    risks:
      - "Security vulnerabilities if improperly implemented"
      - "Performance impact with complex permission checks"
```

## Epic Themes
Common themes for grouping:
- User Management
- Core Functionality
- Integration & APIs
- Analytics & Reporting
- Administration
- Performance & Scale
- Security & Compliance

## Quality Checks
- Epic has clear business value
- Scope is well-defined
- MVP is achievable
- Success metrics are measurable
- Dependencies identified