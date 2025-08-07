# Parallel Acceptance Criteria Definition

**Product Owner Only**: Comprehensive acceptance criteria development using native sub-agents for 70% faster criteria definition with complete test coverage.

## Overview

The `/parallel-acceptance-criteria` command enables the Product Owner to define detailed acceptance criteria across multiple stories simultaneously:
- Parallel functional requirements analysis
- Concurrent edge case identification
- Simultaneous validation rule definition
- Coordinated test scenario creation
- Comprehensive measurability assessment

## Usage

```
/parallel-acceptance-criteria sprint={{SPRINT_NUMBER}}
/parallel-acceptance-criteria story={{STORY_ID}}
/parallel-acceptance-criteria epic={{EPIC_NUMBER}}
```

## Prerequisites

Before running this command, ensure:
- [ ] Target stories exist in backlog with basic descriptions
- [ ] Business requirements are understood
- [ ] Technical constraints are documented
- [ ] Backlog.md is accessible at /mnt/c/Code/MCPServers/DebugHostMCP//backlog.md

## What This Command Does

### Phase 1: Criteria Analysis (Native Sub-Agents 1-4)
When you run this command, I'll coordinate specialized agents for different criteria aspects:

```markdown
"I need a PO agent to define functional acceptance criteria for user-facing stories
 Context: Given-When-Then format, happy path scenarios, user value focus, measurable outcomes"

"I need another PO agent to identify edge cases and error scenarios
 Context: Boundary conditions, error handling, invalid inputs, security considerations"

"I need a PO agent to define data validation and business rules
 Context: Input validation, business logic constraints, data integrity, compliance requirements"

"I need a QA agent to create testable acceptance criteria
 Context: Test scenarios, performance criteria, accessibility requirements, automation potential"
```

### Phase 2: Enhancement & Integration (Native Sub-Agents 5-6)
```markdown
"I need a PO agent to ensure cross-story consistency in acceptance criteria
 Context: Shared behaviors, common patterns, integration points, dependency alignment"

"I need a Developer agent to add technical acceptance criteria
 Context: API contracts, performance thresholds, security requirements, technical constraints"
```

### Phase 3: Validation & Update (Native Sub-Agent 7)
```markdown
"I need a PO agent to validate all criteria and update backlog.md atomically
 Context: Completeness check, measurability validation, format consistency, backlog update"
```

## Expected Outcomes

- **Comprehensive Criteria**: 5-10 acceptance criteria per story
- **Complete Coverage**: Functional, edge cases, and technical criteria
- **Testable Format**: All criteria measurable and verifiable
- **Cross-Story Consistency**: Aligned criteria across related stories
- **Immediate Readiness**: Stories ready for development and testing

## Performance Benefits

- **70% Faster Definition**: 20 stories enhanced in 30 minutes vs 100 minutes
- **Better Coverage**: Multiple perspectives ensure nothing missed
- **Reduced Ambiguity**: Clear, testable criteria from the start
- **Quality Improvement**: Consistent format and completeness

## Acceptance Criteria Format

```gherkin
Feature: {{FEATURE_NAME}}
  Story: {{STORY_ID}} - {{STORY_TITLE}}

  Acceptance Criteria:
  
  Scenario: {{SCENARIO_NAME}}
    Given {{PRECONDITION}}
    When {{ACTION}}
    Then {{EXPECTED_RESULT}}
    
  Business Rules:
  - {{RULE_1}}
  - {{RULE_2}}
  
  Edge Cases:
  - {{EDGE_CASE_1}}
  - {{EDGE_CASE_2}}
  
  Technical Criteria:
  - Response time < {{THRESHOLD}}ms
  - {{TECHNICAL_REQUIREMENT}}
  
  Test Scenarios:
  - {{TEST_SCENARIO_1}}
  - {{TEST_SCENARIO_2}}
```

## Success Metrics

- **Criteria Completeness**: 100% stories have 5+ acceptance criteria
- **Testability Score**: All criteria measurable and verifiable
- **Coverage Analysis**: Functional, edge, and technical cases covered
- **Format Consistency**: 100% Given-When-Then compliance
- **Update Success**: Atomic backlog updates with zero conflicts

## Example Execution

```markdown
PO: Defining acceptance criteria for Sprint 19 stories...

📋 Parallel Criteria Development
════════════════════════════════

Active Agents:
[PO-1] Functional Criteria    ████████░░ 80% (16/20 stories)
[PO-2] Edge Case Analysis     ██████░░░░ 60% (12/20 stories)
[PO-3] Business Rules         █████████░ 90% (18/20 stories)
[QA-1] Test Scenarios         ███████░░░ 70% (14/20 stories)

Progress Summary:
Stories Enhanced: 16/20
Total Criteria Added: 142
Average per Story: 8.9
Edge Cases Identified: 67
Test Scenarios: 84

✅ Backlog.md updated atomically
✅ All criteria in Given-When-Then format
✅ Ready for development
```

## Advanced Features

### Story-Specific Enhancement
```
/parallel-acceptance-criteria story=17.5
```
Deep dive into acceptance criteria for a specific high-priority story.

### Epic-Wide Criteria
```
/parallel-acceptance-criteria epic=17
```
Ensure consistent acceptance criteria across all stories in an epic.

### Sprint Preparation
```
/parallel-acceptance-criteria sprint=19 status=approved
```
Add criteria to all approved stories for upcoming sprint.

## Quality Patterns

The command ensures all acceptance criteria follow best practices:
- **Independent**: Each criterion stands alone
- **Negotiable**: Business-focused, not implementation-specific
- **Valuable**: Clear user or business value
- **Estimable**: Complexity can be assessed
- **Small**: Focused on single behavior
- **Testable**: Clear pass/fail conditions

## Command Implementation

This command leverages native sub-agents to analyze different aspects of acceptance criteria simultaneously. The PO coordinator ensures consistency while each agent brings specialized perspective to create comprehensive, testable criteria that accelerate development and reduce ambiguity.