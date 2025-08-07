# AP Mapping Subtask System

This directory contains templates for Claude Code Task tool integration, enabling parallel execution of subtasks for enhanced analysis and processing capabilities.

## Quick Start

1. **Choose a Template**: Browse categories for appropriate subtask
2. **Invoke via Task Tool**: Use template instructions in Task() call
3. **Synthesize Results**: Apply patterns from synthesis/ directory

## Directory Structure

```
subtasks/
├── _templates/          # Base templates and examples
│   └── base-subtask.md  # Template for creating new subtasks
├── analysis/            # Code and system analysis subtasks
│   └── code-quality.md  # Comprehensive code quality analysis
├── research/            # Information gathering subtasks
├── validation/          # Checking and verification subtasks
├── generation/          # Content creation subtasks
├── synthesis/           # Result combination patterns
│   ├── patterns/        # Synthesis strategies
│   │   └── weighted.md  # Priority-based aggregation
│   └── formats/         # Output format templates
└── orchestration/       # Workflow patterns
```

## Usage Example

```
# In agent conversation:
I'll analyze your authentication system using parallel subtasks.

# CRITICAL: All Task invocations must be in ONE response for parallel execution
[Multiple Task tool calls in single function_calls block]:
- Task 1: "Review authentication code quality..."
- Task 2: "Analyze authentication flow..."
- Task 3: "Check session management..."

# After ALL tasks complete, synthesize findings...
```

### ⚠️ PARALLEL EXECUTION REQUIREMENT

**DO**: Invoke all Task tools in a single response (one function_calls block)
**DON'T**: Call Task tools one at a time in separate responses

This ensures true parallel execution rather than sequential processing.

## Best Practices

1. **Independence**: Each subtask must be self-contained
2. **Clarity**: Provide specific, unambiguous instructions
3. **Consistency**: Use standard output formats
4. **Efficiency**: Limit scope to maintain fast execution
5. **Error Handling**: Always include failure scenarios

## Creating New Subtasks

1. Copy base template from `_templates/base-subtask.md`
2. Customize for specific analysis type
3. Follow the standard structure:
   - Metadata section
   - Clear execution instructions
   - Standardized output format
   - Error handling guidance
4. Test with real scenarios
5. Document in appropriate category

## Standard Output Format

All subtasks should return results in this structure:

```yaml
status: success|partial|failure
summary: One-line summary of findings
findings:
  - category: type_of_finding
    severity: critical|high|medium|low
    description: Clear description
    recommendation: Actionable recommendation
metrics:
  - name: metric_name
    value: metric_value
    unit: unit_of_measurement
```

## Synthesis Patterns

### Available Patterns

1. **Weighted** (`synthesis/patterns/weighted.md`)
   - Priority-based aggregation
   - Considers severity and consensus
   - Best for mixed-importance findings

2. **Unanimous** (coming soon)
   - All subtasks must agree
   - Best for critical validations

3. **Majority** (coming soon)
   - Most common findings win
   - Best for consensus building

4. **Expert** (coming soon)
   - Specialized opinion matters most
   - Best for domain-specific analysis

## Integration with AP Mapping

### Supported Agents
- **Architect**: System analysis, code quality, architecture review
- **Developer**: Code generation, refactoring, implementation
- **QA**: Test generation, validation, quality checks
- **Analyst**: Research, market analysis, requirements gathering

### Invocation Guidelines
1. Agent identifies parallelizable work
2. Selects appropriate subtask templates
3. Uses Task tool with clear instructions
4. Applies synthesis pattern to results
5. Presents unified findings to user

## Performance Considerations

- **Parallelism**: Up to 10 concurrent subtasks
- **Timeout**: Assume 5-minute limit per subtask
- **Result Size**: Keep individual results < 10KB
- **Total Time**: Most analyses complete in 5-10 minutes

## Troubleshooting

### Common Issues

1. **Subtask Timeout**
   - Reduce scope of analysis
   - Break into smaller subtasks

2. **Inconsistent Results**
   - Verify template instructions are clear
   - Check for ambiguous requirements

3. **Synthesis Challenges**
   - Ensure consistent output format
   - Use appropriate synthesis pattern

## Future Enhancements

- Additional synthesis patterns
- More specialized subtask templates
- Performance optimization guides
- Subtask composition patterns

---

For questions or contributions, refer to the main AP Mapping documentation.