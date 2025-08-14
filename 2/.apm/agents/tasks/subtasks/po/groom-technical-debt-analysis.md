# Technical Debt Analysis Subtask

## Purpose
Analyze codebase and architecture documentation to identify technical debt and modernization opportunities.

## Input
- Architecture documents
- Code quality reports
- Dependency analysis
- Performance metrics
- Previous debt tracking

## Processing Steps
1. Identify outdated technologies and patterns
2. Analyze code complexity hotspots
3. Find deprecated dependencies
4. Assess refactoring opportunities
5. Estimate remediation effort
6. Calculate business impact of debt

## Output Format
```yaml
technical_debt:
  summary:
    total_debt_items: 23
    critical_items: 5
    estimated_effort_days: 45
    risk_score: 7.5
  
  debt_items:
    - id: "DEBT-001"
      type: "deprecated_framework"
      component: "Authentication"
      description: "Using deprecated OAuth 1.0"
      impact: "Security risk, maintenance burden"
      effort_estimate: "L"
      priority: "HIGH"
      remediation: "Migrate to OAuth 2.0"
      business_value: "Reduced security risk"
      
    - id: "DEBT-002"
      type: "code_duplication"
      component: "API Handlers"
      description: "40% code duplication in handlers"
      impact: "Maintenance overhead"
      effort_estimate: "M"
      priority: "MEDIUM"
      remediation: "Extract common middleware"
      business_value: "Faster feature development"
      
  modernization_opportunities:
    - area: "Frontend Framework"
      current: "React 16"
      recommended: "React 18"
      benefits: ["Concurrent rendering", "Better performance"]
      effort: "M"
      
  debt_by_category:
    security: 5
    performance: 8
    maintainability: 10
    scalability: 0
```

## Quality Checks
- Debt items have clear business impact
- Remediation efforts are realistic
- Priorities align with risk assessment
- Modernization provides clear value