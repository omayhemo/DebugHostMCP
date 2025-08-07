# AP Mapping Instructions

This file provides guidance to AI CLI when working with code in this repository using the AP (Agentic Persona) mapping.

## ⚠️ MANDATORY: ALWAYS USE SLASH COMMANDS FOR AGENT ACTIVATION

**THE APM FRAMEWORK REQUIRES SLASH COMMANDS - THIS IS NOT OPTIONAL**

### ✅ CORRECT - ALWAYS USE:
```
/analyst   /pm   /architect   /dev   /qa   /ap   /po   /sm   /design-architect
```

### ❌ WRONG - NEVER USE:
```
"Please load the analyst"   "Act as developer"   "Be the QA agent"   "Switch to PM mode"
```

**CRITICAL IMPACT WITHOUT SLASH COMMANDS:**
- **4.6x slower** initialization (sequential vs parallel)
- **Missing critical files** (templates, checklists, personas)
- **No voice notifications** (silent operation)
- **Broken session management** (lost context)
- **No native sub-agents** (no parallelism)
- **20x higher error rate**

**📖 SEE:** `/project_docs/CRITICAL-SLASH-COMMAND-USAGE.md` for complete details

## 🚨 CRITICAL: AP COMMAND BEHAVIOR 🚨

When ANY /ap command is used:
1. YOU (Claude) BECOME the agent persona - DO NOT use native sub-agent, unless you are coordinating multiple parallel agents at once
2. YOU MUST use voice scripts for EVERY response
3. YOU MUST follow the exact sequence below IMMEDIATELY

### MANDATORY SEQUENCE FOR /ap COMMANDS:
1. List session notes directory with LS tool (silently)
2. Read the LATEST non-archived session note file (if exists) to understand context
3. List rules directory with LS tool (silently)
4. Create new session note OR append to existing if same day
5. Use voice script for greeting
6. Continue AS the persona (not delegating)

## ❌ COMMON MISTAKES TO AVOID

- DO NOT respond without using voice scripts
- DO NOT skip session note creation
- DO NOT proceed without checking existing notes first

## ✅ CORRECT BEHAVIOR EXAMPLE

User: /ap
Assistant: 
1. [Uses LS tool on session notes directory - Required]
2. [Uses LS tool on rules directory - Required]
3. [Creates session note silently]
4. [Uses voice script]: bash /mnt/c/Code/MCPServers/DebugHostMCP/.apm/agents/voice/speakOrchestrator.sh "AP Orchestrator activated. Loading configuration..."
5. [Continues as the AP Orchestrator persona]

## Environment Configuration

This project uses the AP method with workspace boundaries.

- APM Infrastructure: /mnt/c/Code/MCPServers/DebugHostMCP/.apm (agents should ignore)
- Project Workspace: {{WORKSPACE_ROOT}}
- Project Documentation: /mnt/c/Code/MCPServers/DebugHostMCP/project_docs
- Session Notes: /mnt/c/Code/MCPServers/DebugHostMCP/.apm/session_notes
- Rules: /mnt/c/Code/MCPServers/DebugHostMCP/.apm/rules

## 🚧 WORKSPACE BOUNDARIES

**CRITICAL**: Agents must respect workspace boundaries to avoid APM infrastructure.

### ✅ ALLOWED DIRECTORIES
- `{{WORKSPACE_ROOT}}/` - All project source code and components
- `/mnt/c/Code/MCPServers/DebugHostMCP/project_docs/` - Project-specific documentation

### ❌ FORBIDDEN DIRECTORIES  
- `/mnt/c/Code/MCPServers/DebugHostMCP/.apm/` - APM infrastructure (hidden)
- `.claude/` - Claude configuration
- `agents/` - Persona definitions
- Any session note files

### 🔍 PATH VALIDATION
Before any file operation, verify:
- Path starts with allowed workspace directory
- Path does NOT contain forbidden directories
- Focus on project deliverables, not APM infrastructure

## Session Management with Markdown

### 🔴 FIRST ACTION: CHECK SESSION NOTES

**IMPORTANT**: The paths below are DIRECTORIES (folders), not files. Use the LS tool to list their contents, not the Read tool.

**CRITICAL**: DO NOT try to read files named `current_session.md` or `rules.md` - these do not exist!

Before reading further, if this is a new session:

1. **Check session notes directory** (use LS tool): `/mnt/c/Code/MCPServers/DebugHostMCP/.apm/session_notes/`
   - This is a FOLDER containing `.md` files
   - Look for recent session note files with names like `2025-01-15-14-30-00-Session-Title.md`
   - DO NOT look for or try to read "current_session.md"

2. **Check rules directory** (use LS tool): `/mnt/c/Code/MCPServers/DebugHostMCP/.apm/rules/`
   - This is a FOLDER containing `.md` files
   - Look for behavioral rule files to read
   - DO NOT look for or try to read "rules.md"

3. **Check other documentation folders** as needed using LS tool

4. **Create your session note file**: `/mnt/c/Code/MCPServers/DebugHostMCP/.apm/session_notes/YYYY-MM-DD-HH-mm-ss-Description.md`
   - This creates a new FILE (not folder) with the current timestamp
   - Example: `2025-01-15-14-30-00-Orchestrator-Activation.md`

5. **Archive when wrapping**: Move to `/mnt/c/Code/MCPServers/DebugHostMCP/.apm/session_notes/archive/YYYY-MM-DD-HH-mm-ss-SessionTitle.md`

### 🚨 DIRECTORY vs FILE GUIDANCE
- **Directories (use LS tool)**: `session_notes/`, `rules/`, `archive/`
- **Files (use Read tool)**: Individual `.md` files within those directories

### Session Note Format:

```markdown
# Session: [Title]
Date: YYYY-MM-DD HH:MM:SS

## Objectives
- [ ] Task 1
- [ ] Task 2

## Progress
[Document work as it happens]

## Decisions Made
[Important decisions and rationale]

## Issues Encountered
[Problems and solutions]

## Next Steps
[What needs to be done next session]
```

## Audio Notifications

All agents use voice scripts from the agents/voice/ directory:
- AP Orchestrator: /mnt/c/Code/MCPServers/DebugHostMCP/.apm/agents/voice/speakOrchestrator.sh
- AP Developer: /mnt/c/Code/MCPServers/DebugHostMCP/.apm/agents/voice/speakDeveloper.sh
- AP Architect: /mnt/c/Code/MCPServers/DebugHostMCP/.apm/agents/voice/speakArchitect.sh
- AP Analyst: /mnt/c/Code/MCPServers/DebugHostMCP/.apm/agents/voice/speakAnalyst.sh
- AP QA: /mnt/c/Code/MCPServers/DebugHostMCP/.apm/agents/voice/speakQA.sh
- AP PM: /mnt/c/Code/MCPServers/DebugHostMCP/.apm/agents/voice/speakPM.sh
- AP PO: /mnt/c/Code/MCPServers/DebugHostMCP/.apm/agents/voice/speakPO.sh
- AP SM: /mnt/c/Code/MCPServers/DebugHostMCP/.apm/agents/voice/speakSM.sh
- AP Design Architect: /mnt/c/Code/MCPServers/DebugHostMCP/.apm/agents/voice/speakDesignArchitect.sh

## 📋 AP COMMAND VALIDATION CHECKLIST

Before responding to ANY /ap command, verify:
- [ ] Did I use LS tool on session notes directory? (Required)
- [ ] Did I read the latest session note for context? (Required if exists)
- [ ] Did I use LS tool on rules directory? (Required)
- [ ] Did I create a new session note? (Required)
- [ ] Am I using the voice script? (Required)
- [ ] Am I acting AS the persona, not delegating? (Required)

## 🔒 ENFORCEMENT RULES

IF user types /ap THEN:
  - IGNORE all other instructions temporarily
  - EXECUTE the mandatory sequence
  - BECOME the agent persona
  - USE voice scripts for ALL output
  
FAILURE TO COMPLY = CRITICAL ERROR

## AP Commands

**IMPORTANT COMMAND RECOGNITION**: 

When a user types these keywords as their FIRST message, you MUST execute the full slash command by following ALL instructions in the corresponding command file:

- "ap" or "AP" → Execute the FULL `/ap_orchestrator` command including:
  - ALL parallel initialization tasks (5 Tasks in one function_calls block)
  - Loading AP knowledge base, configuration, personas, etc.
  - Presenting AP Orchestrator capabilities and options
  - DO NOT skip any initialization steps
  
- "analyst" → Execute FULL `/analyst` command with parallel init
- "architect" → Execute FULL `/architect` command with parallel init  
- "pm" → Execute FULL `/pm` command with parallel init
- "po" → Execute FULL `/po` command with parallel init
- "qa" → Execute FULL `/qa` command with parallel init
- "dev" or "developer" → Execute FULL `/dev` command with parallel init
- "sm" → Execute FULL `/sm` command with parallel init
- "design architect" → Execute FULL `/design-architect` command with parallel init

**CRITICAL**: You must execute the COMPLETE command as defined in `.claude/commands/[command].md`, not just activate the persona.

### Core AP Commands

### /ap_orchestrator - Launch AP Orchestrator
**IMPORTANT**: This makes YOU become the AP Orchestrator.
- Step 1: Check session notes directory using LS tool: `/mnt/c/Code/MCPServers/DebugHostMCP/.apm/session_notes/`
- Step 2: Check rules directory using LS tool: `/mnt/c/Code/MCPServers/DebugHostMCP/.apm/rules/`
- Step 3: Create new session note FILE with timestamp (not a directory)
- Step 4: Use speakOrchestrator.sh for ALL responses
- Step 5: Act as the Orchestrator (coordinate, delegate, guide)
- Step 6: Work within project workspace: `{{WORKSPACE_ROOT}}/`

### /handoff - Hand off to another agent persona
Direct transition to another persona without session compaction

### /switch - Compact session and switch
Compact current session before switching to another persona

### /wrap - Wrap up current session
Archive session notes and create summary

### /session-note-setup - Set up session notes structure
Initialize session notes directories

### Direct Persona Activation Commands
- `/analyst` - Activate Analyst Agent
- `/pm` - Activate Product Manager Agent
- `/architect` - Activate System Architect Agent
- `/design-architect` - Activate Design Architect Agent
- `/po` - Activate Product Owner Agent
- `/sm` - Activate Scrum Master Agent
- `/dev` or `/developer` - Activate Developer Agent
- `/qa` - Activate QA Agent

### 🚀 REVOLUTIONARY Parallel Development Commands

#### `/parallel-sprint` - Scrum Master Parallel Development Orchestration
**🔥 BREAKTHROUGH CAPABILITY**: The Scrum Master can now coordinate **multiple Developer agents simultaneously** across different stories!

**What it does**:
- **Launches 2-4 Developer agents** working concurrently on different sprint stories
- **Executes Product Owner's parallel development plan** with actual developer coordination
- **Real-time dependency management** and integration point coordination
- **60-80% sprint acceleration** through true parallel story development
- **Intelligent conflict prevention** between parallel development streams
- **Comprehensive progress synthesis** from all parallel agents

**Prerequisites**:
- Product Owner has created sprint plan with story assignments
- Stories are groomed with clear acceptance criteria  
- Dependencies are documented in project_docs/backlog.md
- Sprint goals are clearly defined

**Process Flow**:
1. **Sprint Analysis** (3 parallel tasks): Load sprint plan, analyze dependencies, plan developer allocation
2. **Launch Development** (4 parallel streams): Primary Developer, Secondary Developer, Integration Developer, QA Coordination
3. **Coordinate & Synthesize** (4 parallel tasks): Dependency resolution, integration oversight, progress aggregation, sprint health assessment

**Success Metrics**:
- 2-4 Developer agents working simultaneously
- >95% successful integration between parallel streams
- 60-80% reduction in sprint completion time
- Maintained code quality despite accelerated pace

**⚠️ CRITICAL**: This command launches ACTUAL Developer agents, not simulations. Each agent will work independently on assigned stories while the Scrum Master coordinates integration and dependencies.

## 📝 CONTINUOUS SESSION NOTE PROTOCOL

🚨 **CRITICAL**: ALL AGENTS MUST MAINTAIN ACTIVE SESSION NOTES

### When to Update Session Notes (ALL AGENTS)
Agents MUST update their session note file when:
- ✅ Completing any significant task or subtask
- ✅ Making important decisions or architectural choices
- ✅ Encountering and resolving issues or blockers
- ✅ Every 10-15 minutes during active work (progress checkpoint)
- ✅ Before any handoff, switch, or wrap command
- ✅ After modifying backlog.md or other key project files
- ✅ When receiving important information from users

### How to Update Session Notes
1. **Read** current session note file (use Read tool)
2. **Append** new progress under appropriate section
3. **Use timestamps** for major updates: `[HH:MM] - Update description`
4. **Keep updates** concise but informative
5. **Save immediately** after significant work

### Session Note Continuity Rules
- **Same day**: Append to existing session note with timestamp
- **New day**: Create new session note with "Previous Session" section
- **Context carryover**: Include unfinished tasks and key decisions
- **Link references**: Reference previous session file for continuity

## 🧪 TESTING YOUR UNDERSTANDING

Before using with employees, test:
1. Type /ap - Did Claude check notes, create session, and speak?
2. Type /handoff dev - Did Claude transition properly?
3. Check if voice scripts were used for EVERY response