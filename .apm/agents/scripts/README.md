# APM Agent Scripts - v{{VERSION}}

This directory contains project-agnostic scripts for:
1. **Native Sub-Agent Orchestration** - True parallel execution with 4-8x performance
2. **Task Management** - Intelligent work distribution across native sub-agents
3. **Session Management** - Automated documentation and handoffs

## Prerequisites

Before using these scripts, set the following environment variables:

```bash
export AP_ROOT="/path/to/your/ap/setup"          # Where agents folder is located
export PROJECT_ROOT="/path/to/your/project"       # Your project's root directory
export PROJECT_NAME="YourProject"                 # Your project name
export APM_VERSION="{{VERSION}}"                  # APM Framework version
```

## Available Scripts

### Agent Management Scripts

#### ap-env.sh
Sets up the AP environment with all necessary variables and paths.

```bash
source $AP_ROOT//ap-env.sh
```

#### setup-agent-worktrees.sh
Creates Git worktrees for all agents to enable parallel development.

```bash
# After sourcing ap-env.sh
bash $AP_ROOT//setup-agent-worktrees.sh
```

#### parallel-sprint.sh (v{{VERSION}} - Native Sub-Agents)
Launches multiple native sub-agents with true parallelism for sprint work.

**Performance**: 4.6x faster sprint completion with zero CLI crashes

```bash
# Launch default agents (dev-frontend, dev-backend, qa)
bash $AP_ROOT//parallel-sprint.sh

# Launch specific agents
bash $AP_ROOT//parallel-sprint.sh --agents dev-frontend,dev-backend,architect

# Launch with custom sprint name
bash $AP_ROOT//parallel-sprint.sh --sprint feature-auth --agents dev-frontend,dev-backend
```

### Task Management Scripts

#### extract-tasks.sh
Extracts tasks from story files and adds them to the central task tracking file.

```bash
./extract-tasks.sh /mnt/c/Code/MCPServers/DebugHostMCP/project_docs/stories/STORY-001.md
```

#### query-tasks.sh
Query and filter tasks by various criteria.

```bash
# Find ready tasks
./query-tasks.sh ready

# Query by status
./query-tasks.sh status pending
./query-tasks.sh status in-progress --format count

# Query by epic/story
./query-tasks.sh epic EPIC-001
./query-tasks.sh story STORY-002 --format summary
```

#### update-task.sh
Update task status and fields.

```bash
# Start/complete tasks
./update-task.sh TASK-001-002-03 start
./update-task.sh TASK-001-002-03 complete

# Update fields
./update-task.sh TASK-001-002-03 priority high
./update-task.sh TASK-001-002-03 notes "Implemented feature"
```

#### archive-tasks.sh
Archive completed tasks to monthly files.

```bash
# Archive by month
./archive-tasks.sh --month 2025-01

# Archive all completed
./archive-tasks.sh --all

# Preview changes
./archive-tasks.sh --dry-run
```

### Test Scripts

- `test-suite.sh` - Run all unit tests (~1 second)
- `integration-tests.sh` - Run end-to-end tests (~30 seconds)
- `test-*.sh` - Individual component tests

## Customization

### Custom Agent Configuration

Create `.ap-agents` in your project root to define custom agents:

```bash
# .ap-agents
create_worktree "dev-api" "agent/dev/api-main"
create_worktree "dev-ui" "agent/dev/ui-main"
create_worktree "dev-services" "agent/dev/services-main"
```

### Default Sprint Agents

Create `.ap-default-agents` in your project root:

```bash
# .ap-default-agents
AGENTS_TO_LAUNCH=("dev-api" "dev-ui" "qa" "architect")
```

### Agent-Specific Instructions

Create `.agent-instructions.md` in any worktree to provide agent-specific guidance:

```markdown
# Frontend Developer Agent

## Focus Areas
- React components
- State management
- UI/UX implementation

## Key Commands
- `npm run dev` - Start development server
- `npm test` - Run tests
- `npm run build` - Build for production
```

## Integration with Claude Code

These scripts are designed to work seamlessly with Claude Code:

1. Each worktree can run its own Claude instance
2. Agents share memory through Obsidian vault
3. Audio notifications announce agent activities
4. Session notes track work across agents

## Documentation

### Task Management
- **Parallel Task Guide**: [`../docs/PARALLEL-SUBTASK-USAGE-GUIDE.md`](../docs/PARALLEL-SUBTASK-USAGE-GUIDE.md)
- **Quick Reference**: [`../docs/PARALLEL-SUBTASK-QUICK-REFERENCE.md`](../docs/PARALLEL-SUBTASK-QUICK-REFERENCE.md)

### File Locations
- **Tasks File**: `/mnt/c/Code/MCPServers/DebugHostMCP/project_docs/session-notes/tasks/tasks.md`
- **Archive Directory**: `/mnt/c/Code/MCPServers/DebugHostMCP/project_docs/session-notes/tasks/archive/`
- **Story Files**: `/mnt/c/Code/MCPServers/DebugHostMCP/project_docs/stories/`

## Troubleshooting

### Agent Management Issues

#### tmux not found
Install tmux:
- Ubuntu/Debian: `sudo apt-get install tmux`
- macOS: `brew install tmux`
- RHEL/CentOS: `sudo yum install tmux`

#### Worktree already exists
Remove the worktree:
```bash
git worktree remove $PROJECT_ROOT/$PROJECT_NAME-agent-name
```

#### Port conflicts
Each worktree automatically gets unique ports. Check `.env` files if conflicts occur.

#### Voice scripts not working
Ensure the voice scripts are executable:
```bash
chmod +x $AP_ROOT//*.sh
```

### Task Management Issues

#### Task not found
- Verify task ID format: `TASK-XXX-XXX-XX`
- Check if task exists: `./query-tasks.sh list | grep TASK-001-002-03`

#### Dependencies not resolving
- Ensure dependency task IDs are correct
- Check if dependencies are completed: `./query-tasks.sh ready`

#### Debug mode
Enable verbose output:
```bash
DEBUG=1 ./extract-tasks.sh story.md
DEBUG=1 ./query-tasks.sh status pending
```