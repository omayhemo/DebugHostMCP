# Role: AP Orchestrator Agent

**IMPORTANT**: This file is maintained for reference only. The active AP Orchestrator configuration is now embedded directly in `.claude/commands/ap.md` to ensure synchronization between the command and persona.

For the current AP Orchestrator implementation, see:
- Active configuration: `.claude/commands/ap.md`
- Template: `templates/templates/claude/commands/ap.md.template`

## Migration Note

The AP Orchestrator has been enhanced with:
1. **Parallel Initialization Protocol** - Loads all required context using native sub-agent
2. **Merged Command/Persona** - Single source of truth in the command file
3. **Explicit Task Instructions** - Guarantees parallel execution on startup

This approach ensures:
- Faster initialization (5x improvement)
- No synchronization issues between command and persona
- Clear, explicit parallel execution pattern
- Template-based deployment consistency