# Parallel Epic Decomposition

**Product Owner Only**: Comprehensive epic analysis and story creation using native sub-agents for 70% faster epic breakdown.

## Overview

The `/parallel-epic` command enables the Product Owner to decompose large epics into actionable user stories through parallel analysis:
- Simultaneous feature analysis and scope definition
- Parallel story identification and creation
- Concurrent acceptance criteria development
- Dependency mapping across all components
- Business value assessment and prioritization

## Usage

```
/parallel-epic
```

## Prerequisites

Before running this command, ensure:
- [ ] Epic is defined in PRD or backlog with clear objectives
- [ ] Business goals and success metrics are documented
- [ ] Technical constraints are understood
- [ ] Backlog.md is accessible at /mnt/c/Code/MCPServers/DebugHostMCP//backlog.md

## What This Command Does

### Phase 1: Epic Analysis (Native Sub-Agents 1-3)
When you run this command, I'll coordinate multiple PO sub-agents:

```markdown
"I need a PO agent to analyze the epic scope and identify major feature themes
 Context: Epic {{EPIC_NUMBER}} - {{EPIC_TITLE}}, {{STORY_POINTS}} points, identify 4-6 major themes"

"I need another PO agent to break down technical components and integration points
 Context: Identify technical boundaries, API requirements, data flows, and system touchpoints"

"I need a PO agent to define success metrics and business value for each theme
 Context: Map to business objectives, ROI expectations, user impact metrics"
```

### Phase 2: Story Creation (Native Sub-Agents 4-6)
```markdown
"I need a PO agent to create user stories for the primary feature theme
 Context: Follow story template, 3-8 points each, clear acceptance criteria, INVEST compliant"

"I need another PO agent to create supporting and infrastructure stories
 Context: Technical enablers, data migration, monitoring, security requirements"

"I need a PO agent to create integration and testing stories
 Context: Cross-feature integration, E2E testing, performance validation"
```

### Phase 3: Refinement & Validation (Native Sub-Agents 7-8)
```markdown
"I need a PO agent to validate all stories meet INVEST criteria
 Context: Independent, Negotiable, Valuable, Estimable, Small, Testable"

"I need an Architect agent to review technical feasibility and dependencies
 Context: Validate architectural alignment, identify technical risks"
```

## Expected Outcomes

- **Complete Epic Breakdown**: 15-25 user stories created from single epic
- **Consistent Quality**: All stories follow template with clear acceptance criteria
- **Dependency Clarity**: Complete dependency graph between stories
- **Business Alignment**: Each story tied to business value
- **Technical Validation**: Architecture review completed

## Performance Benefits

- **70% Faster**: Epic decomposition in 30 minutes vs 100 minutes sequential
- **Higher Quality**: Multiple perspectives analyzed simultaneously
- **Better Coverage**: No missed requirements due to parallel analysis
- **Immediate Validation**: Technical feasibility confirmed during creation

## Backlog Integration

All created stories are automatically added to backlog.md with:
- Proper epic association
- Story point estimates
- Priority assignments
- Dependency mappings
- Sprint recommendations

## Success Metrics

- **Epic Analysis Time**: < 30 minutes for 89-point epic
- **Story Quality Score**: 100% INVEST compliance
- **Dependency Accuracy**: All dependencies identified
- **Technical Validation**: 100% architecture approved
- **Business Alignment**: All stories linked to value

## Example Output

```markdown
📊 Epic Decomposition Results
════════════════════════════════

Epic: {{EPIC_NUMBER}} - {{EPIC_TITLE}}
Original Estimate: {{STORY_POINTS}} points

Themes Identified:
✓ User Management (21 points)
✓ Data Processing (34 points)
✓ Integration Layer (21 points)
✓ Monitoring & Analytics (13 points)

Stories Created: 23
Total Points: 89
Dependencies Mapped: 47
Risk Items: 3

All stories added to backlog.md
Ready for sprint planning
```

## Command Implementation

This command leverages native Claude Code sub-agents for true parallel execution. Each sub-agent operates independently while the PO coordinates results, ensuring atomic backlog updates and consistent story quality.