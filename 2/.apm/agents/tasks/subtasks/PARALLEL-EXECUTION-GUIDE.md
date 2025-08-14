# Parallel Execution Guide for Claude Code Subtasks

## Critical Implementation Rule

**ALL Task tool invocations MUST be in a SINGLE response to execute in parallel.**

## Technical Explanation

Claude Code's Task tool executes in parallel ONLY when multiple Task invocations are in the same function_calls block. Sequential invocations result in sequential execution.

## Correct Pattern ✅

```python
# Conceptual - What happens internally
<function_calls>
  <invoke name="Task">...</invoke>
  <invoke name="Task">...</invoke>
  <invoke name="Task">...</invoke>
</function_calls>
# All three tasks run simultaneously
```

## Wrong Pattern ❌

```python
# Conceptual - What happens internally
<function_calls>
  <invoke name="Task">...</invoke>
</function_calls>
# Wait for completion...
<function_calls>
  <invoke name="Task">...</invoke>
</function_calls>
# Tasks run one after another
```

## Implementation in Agents

### For Architects/Developers/QA

When implementing parallel analysis:

1. **Plan all subtasks first**
   - Identify what analyses are needed
   - Ensure they're independent
   - Define expected outputs

2. **Invoke in single block**
   ```
   I'll perform parallel analysis of your system.
   
   Spawning 3 parallel subtasks:
   [Single function_calls block with all Tasks]
   ```

3. **Wait for all results**
   - All subtasks complete before synthesis
   - Handle any failures gracefully

4. **Synthesize findings**
   - Apply appropriate pattern
   - Create unified report

## Examples

### Good: Parallel Architecture Review
```
Analyzing your authentication system with parallel subtasks:
[All in one function_calls block]:
- Task: Code quality analysis
- Task: Security vulnerability scan  
- Task: Performance assessment
```

### Bad: Sequential Analysis
```
Starting code quality analysis...
[Task invocation]
[Wait for result]
Now checking security...
[Task invocation]
[Wait for result]
```

## Debugging Tips

1. **Verify Parallelism**: Check if all tasks start simultaneously
2. **Monitor Completion**: All tasks should finish around the same time
3. **Check Dependencies**: Ensure subtasks don't depend on each other

## Performance Considerations

- Parallel execution: ~5-7 minutes for 5 tasks
- Sequential execution: ~25-35 minutes for 5 tasks
- Maximum parallel tasks: 10 (system limit)

## Update Checklist for Agents

When updating agent personas for subtask support:

- [ ] Add parallel execution warning
- [ ] Show correct invocation pattern
- [ ] Emphasize single response requirement
- [ ] Include synthesis step after ALL complete

---

**Remember**: The key to parallel execution is keeping all Task invocations in a single response!