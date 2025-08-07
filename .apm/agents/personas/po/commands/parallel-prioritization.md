# Parallel Backlog Prioritization

**Product Owner Only**: Smart backlog prioritization using native sub-agents for 70% faster value-based story ordering.

## Overview

The `/parallel-prioritization` command enables the Product Owner to analyze and prioritize the backlog from multiple dimensions simultaneously:
- Business value assessment
- Technical complexity analysis
- User impact evaluation
- Dependency chain optimization
- Risk and opportunity scoring

## Usage

```
/parallel-prioritization
/parallel-prioritization sprint={{SPRINT_NUMBER}}
/parallel-prioritization epic={{EPIC_NUMBER}}
```

## Prerequisites

Before running this command, ensure:
- [ ] Backlog contains unpriorized or re-prioritization candidate stories
- [ ] Business objectives are clear
- [ ] Technical constraints are documented
- [ ] Backlog.md is current at /mnt/c/Code/MCPServers/DebugHostMCP//backlog.md

## What This Command Does

### Phase 1: Multi-Dimensional Analysis (Native Sub-Agents 1-5)
When you run this command, I'll coordinate agents to analyze different prioritization factors:

```markdown
"I need a PO agent to analyze business value and ROI for all backlog stories
 Context: Revenue impact, cost savings, strategic alignment, competitive advantage, user satisfaction"

"I need an Architect agent to assess technical complexity and effort
 Context: Implementation difficulty, technical debt, architecture impact, skill requirements"

"I need a PO agent to evaluate user impact and satisfaction potential
 Context: User segments affected, pain points addressed, feature requests, usage projections"

"I need a Developer agent to map technical dependencies and constraints
 Context: Story dependencies, blocking relationships, parallel development opportunities"

"I need a PO agent to identify risks and opportunities for each story
 Context: Market timing, competitive threats, technical risks, opportunity windows"
```

### Phase 2: Scoring & Optimization (Native Sub-Agents 6-7)
```markdown
"I need a PO agent to calculate weighted priority scores using all factors
 Context: Apply WSJF, MoSCoW, or custom scoring model, normalize across dimensions"

"I need a PO agent to optimize story sequence for maximum flow efficiency
 Context: Minimize dependencies, maximize parallel work, optimize team utilization"
```

### Phase 3: Backlog Update (Native Sub-Agent 8)
```markdown
"I need a PO agent to update backlog.md with new prioritization
 Context: Update priority field, reorder stories, add prioritization rationale, atomic update"
```

## Expected Outcomes

- **Data-Driven Prioritization**: Multi-factor analysis for each story
- **Optimized Sequence**: Dependencies minimized, value maximized
- **Clear Rationale**: Documented reasoning for priorities
- **Sprint-Ready Backlog**: Top stories ready for immediate development
- **Stakeholder Alignment**: Transparent prioritization logic

## Performance Benefits

- **70% Faster Analysis**: Complete backlog prioritization in 20 minutes
- **Comprehensive Coverage**: 5 dimensions analyzed simultaneously
- **Better Decisions**: Data-driven vs intuition-based prioritization
- **Reduced Conflicts**: Clear rationale prevents priority debates

## Prioritization Framework

```yaml
priority_analysis:
  story_id: "{{STORY_ID}}"
  
  dimensions:
    business_value:
      score: {{1-10}}
      factors:
        - revenue_impact: {{AMOUNT}}
        - cost_savings: {{AMOUNT}}
        - strategic_fit: {{HIGH/MEDIUM/LOW}}
        
    technical_complexity:
      score: {{1-10}}
      factors:
        - effort_days: {{NUMBER}}
        - skill_requirement: {{LEVEL}}
        - technical_risk: {{HIGH/MEDIUM/LOW}}
        
    user_impact:
      score: {{1-10}}
      factors:
        - users_affected: {{NUMBER}}
        - pain_level: {{HIGH/MEDIUM/LOW}}
        - satisfaction_delta: {{PERCENTAGE}}
        
    dependencies:
      blocking: [{{STORY_IDS}}]
      blocked_by: [{{STORY_IDS}}]
      enables: [{{STORY_IDS}}]
      
    risk_opportunity:
      score: {{1-10}}
      risks: [{{RISK_LIST}}]
      opportunities: [{{OPPORTUNITY_LIST}}]
      
  weighted_score: {{CALCULATED_SCORE}}
  recommended_priority: {{P0/P1/P2/P3}}
  rationale: "{{EXPLANATION}}"
```

## Success Metrics

- **Analysis Completeness**: 100% stories analyzed across all dimensions
- **Scoring Consistency**: Normalized scores with clear methodology
- **Dependency Resolution**: All blocking chains identified
- **Time to Prioritize**: < 1 minute per story with full analysis
- **Stakeholder Satisfaction**: Clear rationale for all decisions

## Example Execution

```markdown
PO: Analyzing and prioritizing backlog stories...

🎯 Parallel Prioritization Analysis
═══════════════════════════════════

Active Analysis Agents:
[PO-1] Business Value     ████████░░ 80% (71/89 stories)
[ARCH] Technical Effort   ██████░░░░ 60% (53/89 stories)
[PO-2] User Impact        █████████░ 90% (80/89 stories)
[DEV]  Dependencies       ███████░░░ 70% (62/89 stories)
[PO-3] Risk Analysis      ████████░░ 85% (76/89 stories)

Prioritization Results:
P0 (Critical): 8 stories (23 points)
P1 (High): 24 stories (67 points)
P2 (Medium): 38 stories (112 points)
P3 (Low): 19 stories (45 points)

Top Value Stories:
1. Story 17.5 - WSJF Score: 94.2
2. Story 17.1 - WSJF Score: 89.7
3. Story 17.6 - WSJF Score: 87.3

✅ Backlog.md updated with new priorities
✅ Dependency chains optimized
✅ Sprint planning ready
```

## Advanced Features

### Sprint-Specific Prioritization
```
/parallel-prioritization sprint=19
```
Prioritize only stories targeted for specific sprint.

### Epic Prioritization
```
/parallel-prioritization epic=17
```
Prioritize stories within a specific epic.

### Custom Scoring Models
The command supports various prioritization frameworks:
- **WSJF** (Weighted Shortest Job First)
- **MoSCoW** (Must/Should/Could/Won't)
- **RICE** (Reach, Impact, Confidence, Effort)
- **Value vs Complexity** Matrix
- **Kano Model** Analysis

## Command Implementation

This command orchestrates multiple specialized agents to analyze the backlog from every angle simultaneously. Each agent contributes their perspective while the PO coordinator synthesizes results into actionable prioritization that maximizes value delivery while minimizing risk and dependencies.