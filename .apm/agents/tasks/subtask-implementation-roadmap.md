# Subtask Implementation Roadmap

**Created:** 2025-01-11  
**Approach:** Direct Claude Code Task Tool Integration

## Quick Start Guide

### Phase 1: Foundation Setup

#### 1. Create Subtask Directory Structure
```bash
/subtasks/
├── README.md                    # Subtask usage guide
├── analysis/
│   ├── code-quality.md         # Code quality analysis subtask
│   ├── security-scan.md        # Security vulnerability scan
│   └── performance-check.md    # Performance analysis
├── research/
│   ├── market-research.md      # Market analysis subtask
│   ├── technical-research.md   # Technical feasibility
│   └── user-research.md        # User needs analysis
└── synthesis/
    ├── result-template.md      # Standard result format
    └── synthesis-guide.md      # How to combine results
```

#### 2. Update First Agent (Architect)
Add to `/architect.md`:
```markdown
## Parallel Analysis Capability

When analyzing complex systems:
1. Break down into independent components
2. Use native sub-agents for parallel analysis:
   - Task("Analyze database design patterns and optimization opportunities")
   - Task("Review API architecture for REST compliance and security")
   - Task("Assess frontend architecture for scalability")
3. Synthesize results into cohesive assessment
```

#### 3. Create First Subtask Template
`/subtasks/analysis/code-quality.md`:
```markdown
# Code Quality Analysis Subtask

Perform a comprehensive code quality analysis focusing on:

1. **Code Structure**
   - Module organization
   - Separation of concerns
   - Dependency management

2. **Best Practices**
   - Naming conventions
   - Error handling
   - Documentation coverage

3. **Maintainability**
   - Code complexity metrics
   - Duplication detection
   - Refactoring opportunities

Return results in this format:
- **Summary**: High-level findings
- **Critical Issues**: Must-fix problems
- **Recommendations**: Improvement suggestions
- **Metrics**: Quantifiable measurements
```

### Phase 2: Rollout Plan

#### Week 1: Proof of Concept
- [ ] Implement Architect subtasks
- [ ] Test with real architecture review
- [ ] Document lessons learned

#### Week 2: Expand Coverage
- [ ] Add Developer agent subtasks
- [ ] Create QA agent parallel testing
- [ ] Implement Analyst research subtasks

#### Week 3: Standardization
- [ ] Create result synthesis templates
- [ ] Document best practices
- [ ] Build subtask pattern library

### Success Metrics

1. **Efficiency Gain**: Measure time reduction for complex tasks
2. **Quality Improvement**: Track comprehensiveness of analyses
3. **Agent Adoption**: Monitor which agents use subtasks most
4. **Pattern Emergence**: Identify common subtask patterns

## Implementation Checklist

### Immediate Actions
- [ ] Create subtask directory structure
- [ ] Write README for subtask usage
- [ ] Update Architect persona with native sub-agent instructions
- [ ] Create 3 initial subtask templates
- [ ] Test with simple parallel analysis

### Next Sprint
- [ ] Expand to 3 more agents
- [ ] Create 10+ subtask templates
- [ ] Document synthesis patterns
- [ ] Gather usage metrics

### Future Considerations
- [ ] Evaluate need for tracking system
- [ ] Consider hybrid approach if needed
- [ ] Build subtask library
- [ ] Create subtask composition patterns

## Quick Reference

### Spawning Subtasks
```
# In agent conversation:
I'll analyze this system using parallel subtasks for efficiency.

*Uses native sub-agent to spawn:*
- Task("Analyze security vulnerabilities in authentication system")
- Task("Review database queries for N+1 problems")
- Task("Check API rate limiting implementation")

*Waits for results and synthesizes findings*
```

### Best Practices
1. Keep subtasks focused and independent
2. Use consistent result formats
3. Limit to 5-7 subtasks per operation
4. Always synthesize results meaningfully
5. Handle subtask failures gracefully

---

**Next Step**: Create the subtask directory structure and first template!