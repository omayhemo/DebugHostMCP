# APM Path Constants

## Project Paths
These are the standard paths that all agents should use:

```bash
# Base paths
PROJECT_ROOT="/mnt/c/Code/MCPServers/DebugHostMCP"
APM_ROOT="/mnt/c/Code/MCPServers/DebugHostMCP/.apm"

# Documentation paths
DOCS_ROOT="$PROJECT_ROOT/project_docs"
REQUIREMENTS_PATH="$DOCS_ROOT/requirements"
ARCHITECTURE_PATH="$DOCS_ROOT/architecture"
SPECIFICATIONS_PATH="$DOCS_ROOT/specifications"
BACKLOG_PATH="$DOCS_ROOT/backlog.md"
PLANNING_PATH="$DOCS_ROOT/planning"

# Output paths
DELIVERABLES_ROOT="$PROJECT_ROOT/deliverables"
REPORTS_PATH="$DELIVERABLES_ROOT/reports"
ARTIFACTS_PATH="$DELIVERABLES_ROOT/artifacts"
RELEASES_PATH="$DELIVERABLES_ROOT/releases"

# Workspace paths
WORKSPACE_ROOT="$PROJECT_ROOT/workspace"
SOURCE_PATH="$WORKSPACE_ROOT/src"
TESTS_PATH="$WORKSPACE_ROOT/tests"
COMPONENTS_PATH="$WORKSPACE_ROOT/components"

# Session paths (APM internal)
SESSION_NOTES_PATH="$APM_ROOT/session_notes"
HANDOFFS_PATH="$SESSION_NOTES_PATH/handoffs"
ARCHIVE_PATH="$SESSION_NOTES_PATH/archive"
```

## Usage
Always use these constants when creating files:
- Never hardcode paths
- Always verify directory exists before writing
- Use absolute paths only
