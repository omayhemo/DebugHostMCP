# Parallel Requirements Validation

**Product Owner Only**: Comprehensive requirements validation using native sub-agents for 70% faster quality assurance across all backlog items.

## Overview

The `/parallel-validation` command enables the Product Owner to validate requirements across multiple quality dimensions simultaneously:
- INVEST criteria compliance
- Technical feasibility assessment
- Testability verification
- Business alignment confirmation
- Dependency validation
- Completeness checking

## Usage

```
/parallel-validation
/parallel-validation sprint={{SPRINT_NUMBER}}
/parallel-validation epic={{EPIC_NUMBER}}
/parallel-validation status=ready
```

## Prerequisites

Before running this command, ensure:
- [ ] Stories exist in backlog with descriptions and acceptance criteria
- [ ] Technical architecture is documented
- [ ] Business objectives are defined
- [ ] Backlog.md is accessible at /mnt/c/Code/MCPServers/DebugHostMCP//backlog.md

## What This Command Does

### Phase 1: Multi-Aspect Validation (Native Sub-Agents 1-6)
When you run this command, I'll coordinate specialized validation agents:

```markdown
"I need a PO agent to validate all stories meet INVEST criteria
 Context: Independent, Negotiable, Valuable, Estimable, Small, Testable - flag violations"

"I need an Architect agent to validate technical feasibility and alignment
 Context: Architecture compatibility, technology constraints, implementation viability"

"I need a QA agent to validate testability of all acceptance criteria
 Context: Clear test scenarios, measurable outcomes, automation potential, test data needs"

"I need a PO agent to validate business value and alignment
 Context: Strategic objectives, ROI clarity, user value proposition, success metrics"

"I need a Developer agent to validate story completeness and clarity
 Context: Implementation details, technical requirements, ambiguity detection"

"I need a PO agent to validate dependencies and sequencing
 Context: Blocking relationships, parallel opportunities, critical path analysis"
```

### Phase 2: Issue Resolution (Native Sub-Agents 7-8)
```markdown
"I need a PO agent to create remediation plan for validation issues
 Context: Priority issues, suggested fixes, story amendments, missing information"

"I need a PO agent to update backlog.md with validation results
 Context: Add validation status, flag issues, update story details, atomic update"
```

## Expected Outcomes

- **Quality Assurance**: All stories validated across 6 dimensions
- **Issue Identification**: Clear list of validation failures
- **Remediation Plan**: Specific fixes for each issue
- **Improved Readiness**: Higher percentage of "Ready" stories
- **Risk Mitigation**: Early detection of problematic requirements

## Performance Benefits

- **70% Faster Validation**: Complete backlog validation in 25 minutes
- **Comprehensive Coverage**: Multiple perspectives validated simultaneously  
- **Early Detection**: Issues found before development starts
- **Reduced Rework**: Clear requirements prevent misunderstandings

## Validation Report Format

```yaml
validation_report:
  timestamp: "{{TIMESTAMP}}"
  scope: "{{SCOPE}}"
  
  summary:
    total_stories: {{NUMBER}}
    passed_validation: {{NUMBER}}
    failed_validation: {{NUMBER}}
    warnings: {{NUMBER}}
    
  invest_compliance:
    independent: {{PASS_COUNT}}/{{TOTAL}}
    negotiable: {{PASS_COUNT}}/{{TOTAL}}
    valuable: {{PASS_COUNT}}/{{TOTAL}}
    estimable: {{PASS_COUNT}}/{{TOTAL}}
    small: {{PASS_COUNT}}/{{TOTAL}}
    testable: {{PASS_COUNT}}/{{TOTAL}}
    
  validation_failures:
    - story_id: "{{STORY_ID}}"
      failures:
        - dimension: "{{DIMENSION}}"
          issue: "{{DESCRIPTION}}"
          severity: "{{HIGH/MEDIUM/LOW}}"
          recommendation: "{{FIX_SUGGESTION}}"
          
  technical_feasibility:
    validated: {{NUMBER}}
    concerns: {{NUMBER}}
    blockers: {{NUMBER}}
    
  testability_analysis:
    fully_testable: {{NUMBER}}
    partially_testable: {{NUMBER}}
    not_testable: {{NUMBER}}
    
  remediation_plan:
    immediate_fixes: {{COUNT}}
    clarifications_needed: {{COUNT}}
    architectural_reviews: {{COUNT}}
    story_splits_recommended: {{COUNT}}
```

## Success Metrics

- **Validation Coverage**: 100% of active stories validated
- **INVEST Compliance**: > 95% stories pass all criteria
- **Technical Feasibility**: > 90% stories technically viable
- **Testability Score**: 100% stories have testable criteria
- **Resolution Time**: < 2 minutes per story for full validation

## Example Execution

```markdown
PO: Validating Sprint 19 requirements across all dimensions...

✅ Parallel Requirements Validation
═══════════════════════════════════

Active Validation Agents:
[PO-1] INVEST Criteria    ████████░░ 80% (32/40 stories)
[ARCH] Tech Feasibility   ██████░░░░ 60% (24/40 stories)
[QA]   Testability        █████████░ 90% (36/40 stories)
[PO-2] Business Value     ███████░░░ 70% (28/40 stories)
[DEV]  Completeness       ████████░░ 85% (34/40 stories)
[PO-3] Dependencies       █████████░ 95% (38/40 stories)

Validation Results:
✅ Passed: 31 stories (77.5%)
⚠️  Warnings: 6 stories (15%)
❌ Failed: 3 stories (7.5%)

Critical Issues Found:
1. Story 17.12: Not Independent - depends on 17.10, 17.11
2. Story 17.15: Not Testable - acceptance criteria too vague
3. Story 17.8: Too Large - recommend split into 2 stories

Remediation Actions:
- 3 stories need acceptance criteria clarification
- 2 stories require architectural review
- 1 story should be split
- 6 stories need dependency documentation

✅ Validation report added to backlog.md
✅ Issues flagged for resolution
✅ Ready for remediation
```

## Advanced Features

### Focused Validation
```
/parallel-validation status=ready
```
Validate only stories marked as "Ready" for final check.

### Sprint Validation
```
/parallel-validation sprint=19
```
Validate all stories assigned to upcoming sprint.

### Continuous Validation
The command can be run regularly to maintain backlog quality:
- **Weekly**: Full backlog validation
- **Pre-Sprint**: Validate next sprint's stories
- **Post-Grooming**: Validate newly groomed stories
- **Pre-Release**: Final validation before development

## Quality Gates

The validation enforces quality gates:
1. **Definition of Ready**: All criteria must pass
2. **Technical Review**: Architecture approval required
3. **Test Coverage**: Testable acceptance criteria mandatory
4. **Business Alignment**: Clear value proposition
5. **Dependency Clear**: All dependencies documented

## Command Implementation

This command orchestrates multiple specialized agents to validate requirements from every critical angle simultaneously. Each agent brings domain expertise while the PO coordinator ensures comprehensive coverage and actionable remediation plans, resulting in a high-quality, development-ready backlog.