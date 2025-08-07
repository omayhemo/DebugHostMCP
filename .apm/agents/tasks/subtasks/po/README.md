# Product Owner Subtasks

This directory contains parallel subtask templates for the Product Owner's `/groom` command.

## Overview

The PO grooming system executes 18 subtasks in parallel across 5 phases to transform documentation into a prioritized, optimized backlog with epics, stories, and sprint plans.

## Subtask Categories

### Phase 1: Documentation Analysis (5 subtasks)
- `groom-domain-analysis.md` - Extract domain models and boundaries
- `groom-feature-extraction.md` - Identify features and requirements
- `groom-technical-debt-analysis.md` - Find refactoring opportunities
- `groom-integration-analysis.md` - Map system dependencies
- `groom-compliance-analysis.md` - Identify regulatory requirements

### Phase 2: Epic Generation (4 subtasks)
- `groom-feature-epic-generation.md` - Create feature-based epics
- `groom-technical-epic-generation.md` - Create technical/infrastructure epics
- `groom-integration-epic-generation.md` - Create integration epics
- `groom-compliance-epic-generation.md` - Create compliance epics

### Phase 3: Story Decomposition (3 subtasks)
- `groom-story-breakdown.md` - Break epics into commit-level stories
- `groom-story-sizing.md` - Estimate story complexity and points
- `groom-story-dependencies.md` - Map inter-story relationships

### Phase 4: Optimization & Prioritization (4 subtasks)
- `groom-dependency-graph.md` - Build comprehensive dependency DAG
- `groom-business-value.md` - Calculate ROI and business value
- `groom-risk-assessment.md` - Assess implementation risks
- `groom-parallel-streams.md` - Identify parallelizable work

### Phase 5: Sprint Planning (2 subtasks)
- `groom-sprint-allocation.md` - Allocate stories to sprints
- `groom-capacity-optimization.md` - Optimize team utilization

## Synthesis Patterns

The PO uses specialized synthesis patterns to merge results:
- `po-epic-coherence-validator.md` - Ensure epic consistency
- `po-story-dependency-resolver.md` - Optimize execution order
- `po-sprint-capacity-optimizer.md` - Balance workload
- `po-business-value-maximizer.md` - Prioritize by ROI
- `po-risk-adjusted-planner.md` - Create realistic timelines

## Usage

The `/groom` command orchestrates all subtasks:

```bash
/groom --source /mnt/c/Code/MCPServers/DebugHostMCP/project_docs --sprint-length 14 --team-velocity 40
```

This will:
1. Analyze all documentation in parallel
2. Generate comprehensive epics
3. Break down into sized stories
4. Optimize for parallel execution
5. Create sprint-ready backlog

## Output Artifacts

- `backlog-manifest.yaml` - Complete epic and story catalog
- `dependencies.mermaid` - Visual dependency graph
- `sprint-plan.md` - Sprint-by-sprint allocation
- `parallel-tracks.json` - Parallelizable work streams
- `grooming-report.md` - Executive summary

## Performance

- Sequential execution: 30-45 minutes
- Parallel execution: 5-10 minutes
- Efficiency gain: 80%+