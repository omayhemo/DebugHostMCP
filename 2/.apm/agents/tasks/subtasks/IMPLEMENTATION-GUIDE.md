# Parallel Subtask Implementation Guide

## Overview
This guide details how to implement parallel subtask capabilities for AP Mapping personas using Claude Code's Task tool.

## Core Architecture

### 1. Directory Structure Extension
```
agents/
├── tasks/
│   └── subtasks/
│       ├── development/      # Developer subtasks
│       ├── qa/              # QA subtasks  
│       ├── analysis/        # Analyst subtasks
│       ├── validation/      # PO subtasks
│       ├── synthesis/       # Result combination
│       │   ├── patterns/    # Synthesis strategies
│       │   └── formatters/  # Output formatters
│       └── orchestration/   # Workflow patterns
```

### 2. Persona Enhancement Pattern

Each persona requiring parallel capabilities should be updated with:

```markdown
## Parallel Analysis Capability

When analyzing complex systems, I leverage Claude Code's Task tool for parallel execution:

### Supported Parallel Analyses
1. **[Analysis Type 1]**
   - Description of what this analyzes
   - Expected insights
   
2. **[Analysis Type 2]**
   - Description of what this analyzes
   - Expected insights

### Invocation Pattern

**CRITICAL**: For parallel execution, ALL Task tool calls MUST be in a single response. Do NOT call them sequentially.

### Best Practices
- Limit to 5-7 parallel subtasks per analysis
- Use consistent output formats for easy synthesis
- Always provide clear synthesis of findings
```

## Implementation Steps

### Phase 1: Developer Persona (Week 1)

1. **Create Base Templates**
   ```bash
   - security-scan.md ✓
   - performance-check.md ✓
   - test-coverage.md ✓
   - dependency-audit.md
   - code-complexity.md
   ```

2. **Update Developer Persona**
   - Add parallel capability section
   - Include invocation examples
   - Add synthesis guidance

3. **Create Developer-Specific Synthesis**
   - Technical debt prioritizer
   - Security risk matrix
   - Performance optimization ranker

### Phase 2: QA Persona (Week 1-2)

1. **Create QA Templates**
   ```bash
   - cross-browser-test.md ✓
   - accessibility-audit.md ✓
   - api-contract-test.md ✓
   - load-test.md
   - mobile-responsive-test.md
   ```

2. **Implement Test Result Aggregator**
   - Combine pass/fail across browsers
   - Prioritize critical path failures
   - Generate unified test report

### Phase 3: Product Owner (Week 2)

1. **Create Validation Templates**
   ```bash
   - story-completeness-check.md
   - acceptance-criteria-validation.md
   - dependency-analysis.md
   - effort-estimation-review.md
   ```

2. **Implement Story Quality Scorer**
   - Aggregate validation results
   - Flag incomplete stories
   - Suggest improvements

### Phase 4: Analyst (Week 3)

1. **Create Research Templates**
   ```bash
   - market-analysis.md
   - competitor-research.md
   - user-segment-analysis.md
   - technology-evaluation.md
   ```

2. **Implement Research Synthesizer**
   - Confidence-based aggregation
   - Trend identification
   - Insight extraction

## Integration with Existing Systems

### 1. Python Task Manager Integration

```python
# Extend TaskService with parallel execution
class TaskService:
    async def execute_parallel_subtasks(
        self,
        parent_task_id: UUID,
        subtask_templates: List[str],
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Execute multiple subtasks in parallel using Claude Code Task tool."""
        
        # This method would coordinate with Claude Code
        # Rather than executing directly
        subtask_definitions = self._load_templates(subtask_templates)
        
        # Return structured data for Claude to use
        return {
            "templates": subtask_definitions,
            "context": context,
            "synthesis_pattern": self._select_synthesis_pattern(subtask_templates)
        }
```

### 2. Hook System Integration

```bash
# Update hooks to track parallel task execution
# In .claude_hooks/task_started.py
def on_task_started(task_info):
    if task_info.get("parallel_subtasks"):
        log_parallel_execution(
            parent_task=task_info["task_id"],
            subtask_count=len(task_info["parallel_subtasks"])
        )
```

### 3. Session Note Integration

```markdown
## Parallel Task Execution Log

**Timestamp**: 2024-01-07 10:30:00
**Persona**: Developer
**Parallel Tasks Spawned**: 5
- Security vulnerability scan
- Performance analysis  
- Test coverage audit
- Code complexity check
- Dependency audit

**Synthesis Method**: Risk Matrix
**Total Execution Time**: 6 minutes
**Findings Summary**: 3 critical, 7 high, 15 medium issues
```

## Common Patterns

### 1. The Validation Suite Pattern
Multiple validators run in parallel, each checking different aspects:
- Completeness validator
- Consistency validator  
- Standards validator
- Business rules validator

### 2. The Multi-Perspective Pattern
Same data analyzed from different viewpoints:
- Technical perspective
- Business perspective
- User perspective
- Security perspective

### 3. The Cross-Environment Pattern
Testing across multiple environments:
- Different browsers
- Different devices
- Different data scenarios
- Different load conditions

### 4. The Comprehensive Audit Pattern
Full system analysis across dimensions:
- Security audit
- Performance audit
- Quality audit
- Compliance audit

## Success Metrics

### Efficiency Gains
- Sequential execution: 25-35 minutes
- Parallel execution: 5-7 minutes
- Efficiency gain: 80% reduction

### Quality Improvements
- Coverage increase: 40% more scenarios tested
- Issue detection: 25% more issues found
- False positive reduction: 15% via consensus

### Developer Experience
- Less waiting time
- More comprehensive results
- Better decision support
- Clearer action items

## Rollout Plan

### Week 1
- ✅ Implement Developer subtasks
- ✅ Test parallel execution
- ✅ Document patterns

### Week 2  
- Implement QA subtasks
- Create test aggregators
- Update QA persona

### Week 3
- Implement PO subtasks
- Create validation suite
- Update PO persona

### Week 4
- Implement Analyst subtasks
- Create research synthesizer
- Update Analyst persona

### Week 5
- Integration testing
- Performance optimization
- Documentation finalization

## Best Practices

1. **Always Test Parallel Execution**
   - Verify all Tasks launch together
   - Check for race conditions
   - Ensure consistent output formats

2. **Design for Synthesis**
   - Standardize output formats
   - Include confidence scores
   - Provide clear categorization

3. **Handle Failures Gracefully**
   - Partial results better than none
   - Clear error reporting
   - Fallback strategies

4. **Monitor Performance**
   - Track execution times
   - Measure quality improvements
   - Gather user feedback

## Next Steps

1. Begin with Developer persona implementation
2. Create working examples for each pattern
3. Update documentation with real results
4. Iterate based on user feedback
5. Expand to remaining personas