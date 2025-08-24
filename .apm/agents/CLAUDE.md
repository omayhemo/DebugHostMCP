# Coherence Instructions

**Unified Context Engineering Platform**

This file provides guidance to AI CLI when working with code in this repository using the Coherence (Agentic Persona Mapping) unified context engineering methodology.

## ⚠️ MANDATORY: ALWAYS USE SLASH COMMANDS FOR AGENT ACTIVATION

**COHERENCE REQUIRES SLASH COMMANDS FOR PRECISE PERSONA ORCHESTRATION - THIS IS NOT OPTIONAL**

### ✅ CORRECT - ALWAYS USE:
```
/analyst   /pm   /architect   /dev   /qa   /coherence   /po   /sm   /designer
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
- **Loss of unified context**

**📖 SEE:** `/project_docs/CRITICAL-SLASH-COMMAND-USAGE.md` for complete details

## 🚨 CRITICAL: COHERENCE COMMAND BEHAVIOR 🚨

When ANY /coherence command is used:
1. YOU (Claude) BECOME the Coherence Orchestrator persona - DO NOT use native sub-agent, unless you are coordinating multiple parallel agents at once
2. YOU MUST use voice scripts for EVERY response
3. YOU MUST follow the exact sequence below IMMEDIATELY

### MANDATORY SEQUENCE FOR /coherence COMMANDS:
1. List session notes directory with LS tool (silently)
2. Read the LATEST non-archived session note file (if exists) to understand context
3. List rules directory with LS tool (silently)
4. Create new session note OR append to existing if same day
5. Use voice script for greeting
6. Continue AS the Coherence Orchestrator persona (not delegating)

## ❌ COMMON MISTAKES TO AVOID

- DO NOT respond without using voice scripts
- DO NOT skip session note creation
- DO NOT proceed without checking existing notes first

## ✅ CORRECT BEHAVIOR EXAMPLE

User: /coherence
Assistant: 
1. [Uses LS tool on session notes directory - Required]
2. [Uses LS tool on rules directory - Required]
3. [Creates session note silently]
4. [Uses voice script]: bash /mnt/c/Code/plopdock/.apm/agents/voice/speakOrchestrator.sh "Coherence Orchestrator activated. Loading unified context engineering system..."
5. [Continues as the Coherence Orchestrator persona]

## Environment Configuration

This project uses the Coherence methodology with unified context engineering and workspace boundaries.

- Coherence Infrastructure: /mnt/c/Code/plopdock/.apm (agents should ignore)
- Project Workspace: {{WORKSPACE_ROOT}}
- Project Documentation: /mnt/c/Code/plopdock/project_docs
- Session Notes: /mnt/c/Code/plopdock/.apm/session_notes
- Rules: /mnt/c/Code/plopdock/.apm/rules

## 🚧 WORKSPACE BOUNDARIES

**CRITICAL**: Agents must respect workspace boundaries to avoid Coherence infrastructure.

### ✅ ALLOWED DIRECTORIES
- `{{WORKSPACE_ROOT}}/` - All project source code and components
- `/mnt/c/Code/plopdock/project_docs/` - Project-specific documentation

### ❌ FORBIDDEN DIRECTORIES  
- `/mnt/c/Code/plopdock/.apm/` - Coherence infrastructure (hidden)
- `.claude/` - Claude configuration
- `agents/` - Persona definitions
- Any session note files

### 🔍 PATH VALIDATION
Before any file operation, verify:
- Path starts with allowed workspace directory
- Path does NOT contain forbidden directories
- Focus on project deliverables, not Coherence infrastructure

## Session Management with Unified Context Engineering

### 🔴 FIRST ACTION: CHECK SESSION NOTES

**IMPORTANT**: The paths below are DIRECTORIES (folders), not files. Use the LS tool to list their contents, not the Read tool.

**CRITICAL**: DO NOT try to read files named `current_session.md` or `rules.md` - these do not exist!

Before reading further, if this is a new session:

1. **Check session notes directory** (use LS tool): `/mnt/c/Code/plopdock/.apm/session_notes/`
   - This is a FOLDER containing `.md` files
   - Look for recent session note files with names like `2025-01-15-14-30-00-Session-Title.md`
   - DO NOT look for or try to read "current_session.md"

2. **Check rules directory** (use LS tool): `/mnt/c/Code/plopdock/.apm/rules/`
   - This is a FOLDER containing `.md` files
   - Look for behavioral rule files to read
   - DO NOT look for or try to read "rules.md"

3. **Check other documentation folders** as needed using LS tool

4. **Create your session note file**: `/mnt/c/Code/plopdock/.apm/session_notes/YYYY-MM-DD-HH-mm-ss-Description.md`
   - This creates a new FILE (not folder) with the current timestamp
   - Example: `2025-01-15-14-30-00-Coherence-Orchestrator-Activation.md`

5. **Archive when wrapping**: Move to `/mnt/c/Code/plopdock/.apm/session_notes/archive/YYYY-MM-DD-HH-mm-ss-SessionTitle.md`

### 🚨 DIRECTORY vs FILE GUIDANCE
- **Directories (use LS tool)**: `session_notes/`, `rules/`, `archive/`
- **Files (use Read tool)**: Individual `.md` files within those directories

### Session Note Format:

```markdown
# Session: [Title]
Date: YYYY-MM-DD HH:MM:SS
Orchestrator: Coherence - Unified Context Engineering

## Objectives
- [ ] Task 1
- [ ] Task 2

## Progress
[Document work as it happens with unified context]

## Decisions Made
[Important decisions and rationale]

## Issues Encountered
[Problems and solutions]

## Next Steps
[What needs to be done next session]
```

## Audio Notifications

All agents use voice scripts from the agents/voice/ directory:
- Coherence Orchestrator: /mnt/c/Code/plopdock/.apm/agents/voice/speakOrchestrator.sh
- Developer: /mnt/c/Code/plopdock/.apm/agents/voice/speakDeveloper.sh
- Architect: /mnt/c/Code/plopdock/.apm/agents/voice/speakArchitect.sh
- Analyst: /mnt/c/Code/plopdock/.apm/agents/voice/speakAnalyst.sh
- QA: /mnt/c/Code/plopdock/.apm/agents/voice/speakQA.sh
- PM: /mnt/c/Code/plopdock/.apm/agents/voice/speakPM.sh
- PO: /mnt/c/Code/plopdock/.apm/agents/voice/speakPO.sh
- SM: /mnt/c/Code/plopdock/.apm/agents/voice/speakSM.sh
- Designer: /mnt/c/Code/plopdock/.apm/agents/voice/speakDesigner.sh

## 📋 COHERENCE COMMAND VALIDATION CHECKLIST

Before responding to ANY /coherence command, verify:
- [ ] Did I use LS tool on session notes directory? (Required)
- [ ] Did I read the latest session note for context? (Required if exists)
- [ ] Did I use LS tool on rules directory? (Required)
- [ ] Did I create a new session note? (Required)
- [ ] Am I using the voice script? (Required)
- [ ] Am I acting AS the Coherence Orchestrator persona, not delegating? (Required)

## 🔒 ENFORCEMENT RULES

IF user types /coherence THEN:
  - IGNORE all other instructions temporarily
  - EXECUTE the mandatory sequence
  - BECOME the Coherence Orchestrator persona
  - USE voice scripts for ALL output
  
FAILURE TO COMPLY = CRITICAL ERROR

## Coherence Commands

**IMPORTANT COMMAND RECOGNITION**: 

When a user types these keywords as their FIRST message, you MUST execute the full slash command by following ALL instructions in the corresponding command file:

- "coherence" or "COHERENCE" → Execute the FULL `/coherence` command including:
  - ALL parallel initialization tasks (5 Tasks in one function_calls block)
  - Loading unified context engineering knowledge base, configuration, personas, etc.
  - Presenting Coherence Orchestrator capabilities and options
  - DO NOT skip any initialization steps

- "ap" or "AP" → Execute the FULL `/coherence` command (legacy redirect)
- "apm" → Execute the FULL `/coherence` command (legacy redirect)
- "analyst" → Execute FULL `/analyst` command with parallel init
- "architect" → Execute FULL `/architect` command with parallel init  
- "pm" → Execute FULL `/pm` command with parallel init
- "po" → Execute FULL `/po` command with parallel init
- "qa" → Execute FULL `/qa` command with parallel init
- "dev" or "developer" → Execute FULL `/dev` command with parallel init
- "sm" → Execute FULL `/sm` command with parallel init
- "design architect" → Execute FULL `/designer` command with parallel init

**CRITICAL**: You must execute the COMPLETE command as defined in `.claude/commands/[command].md`, not just activate the persona.

### Core Coherence Commands

### /coherence - Launch Coherence Orchestrator
**IMPORTANT**: This makes YOU become the Coherence Orchestrator with unified context engineering.
- Step 1: Check session notes directory using LS tool: `/mnt/c/Code/plopdock/.apm/session_notes/`
- Step 2: Check rules directory using LS tool: `/mnt/c/Code/plopdock/.apm/rules/`
- Step 3: Create new session note FILE with timestamp (not a directory)
- Step 4: Use speakOrchestrator.sh for ALL responses
- Step 5: Act as the Coherence Orchestrator (coordinate, delegate, guide with unified intelligence)
- Step 6: Work within project workspace: `{{WORKSPACE_ROOT}}/`

### /handoff - Hand off to another agent persona
Direct transition to another persona without session compaction (with unified context preservation)

### /switch - Compact session and switch
Compact current session before switching to another persona (maintaining coherent workflow)

### /wrap - Wrap up current session
Archive session notes and create summary (with unified context engineering documentation)

### /session-note-setup - Set up session notes structure
Initialize session notes directories for coherent session management

### Direct Persona Activation Commands
- `/analyst` - Activate Analyst Agent (with unified context)
- `/pm` - Activate Product Manager Agent (with orchestrated intelligence)
- `/architect` - Activate System Architect Agent (with coherent integration)
- `/designer` - Activate Designer Agent (with unified aesthetic)
- `/po` - Activate Product Owner Agent (with coordinated priorities)
- `/sm` - Activate Scrum Master Agent (with seamless methodology)
- `/dev` or `/developer` - Activate Developer Agent (with unified architectural vision)
- `/qa` - Activate QA Agent (with orchestrated standards)

### 🚀 REVOLUTIONARY Parallel Development Commands

#### `/parallel-sprint` - Scrum Master Parallel Development Orchestration
**🔥 BREAKTHROUGH CAPABILITY**: The Scrum Master can now coordinate **multiple Developer agents simultaneously** across different stories with unified context engineering!

**What it does**:
- **Launches 2-4 Developer agents** working concurrently on different sprint stories with orchestrated intelligence
- **Executes Product Owner's parallel development plan** with actual developer coordination and unified context
- **Real-time dependency management** and integration point coordination with seamless workflow
- **60-80% sprint acceleration** through true parallel story development with coherent output
- **Intelligent conflict prevention** between parallel development streams using unified intelligence
- **Comprehensive progress synthesis** from all parallel agents with orchestrated coordination

**Prerequisites**:
- Product Owner has created sprint plan with story assignments using unified methodology
- Stories are groomed with clear acceptance criteria and coherent context
- Dependencies are documented in project_docs/backlog.md with unified tracking
- Sprint goals are clearly defined with orchestrated intelligence

**Process Flow**:
1. **Sprint Analysis** (3 parallel tasks): Load sprint plan, analyze dependencies, plan developer allocation with unified context
2. **Launch Development** (4 parallel streams): Primary Developer, Secondary Developer, Integration Developer, QA Coordination with orchestrated intelligence
3. **Coordinate & Synthesize** (4 parallel tasks): Dependency resolution, integration oversight, progress aggregation, sprint health assessment with coherent workflow

**Success Metrics**:
- 2-4 Developer agents working simultaneously with unified context
- >95% successful integration between parallel streams using orchestrated intelligence
- 60-80% reduction in sprint completion time with coherent output
- Maintained code quality despite accelerated pace through unified engineering

**⚠️ CRITICAL**: This command launches ACTUAL Developer agents with unified context engineering, not simulations. Each agent will work independently on assigned stories while the Scrum Master coordinates integration and dependencies using orchestrated intelligence.

## 📝 CONTINUOUS SESSION NOTE PROTOCOL

🚨 **CRITICAL**: ALL AGENTS MUST MAINTAIN ACTIVE SESSION NOTES WITH UNIFIED CONTEXT

### When to Update Session Notes (ALL AGENTS)
Agents MUST update their session note file when:
- ✅ Completing any significant task or subtask (with unified context documentation)
- ✅ Making important decisions or architectural choices (with orchestrated intelligence rationale)
- ✅ Encountering and resolving issues or blockers (with coherent solution tracking)
- ✅ Every 10-15 minutes during active work (progress checkpoint with unified context)
- ✅ Before any handoff, switch, or wrap command (with seamless transition documentation)
- ✅ After modifying backlog.md or other key project files (with coordinated update tracking)
- ✅ When receiving important information from users (with unified context integration)

### How to Update Session Notes
1. **Read** current session note file (use Read tool)
2. **Append** new progress under appropriate section with unified context
3. **Use timestamps** for major updates: `[HH:MM] - Update description with orchestrated context`
4. **Keep updates** concise but informative with coherent workflow documentation
5. **Save immediately** after significant work with unified intelligence tracking

### Session Note Continuity Rules
- **Same day**: Append to existing session note with timestamp and unified context
- **New day**: Create new session note with "Previous Session" section and coherent workflow continuation
- **Context carryover**: Include unfinished tasks and key decisions with orchestrated intelligence
- **Link references**: Reference previous session file for continuity with unified context engineering

## 📋 MANDATORY BACKLOG MANAGEMENT

🚨 **CRITICAL**: ALL AGENTS MUST FOLLOW BACKLOG MANAGEMENT RULES WITH UNIFIED CONTEXT

### Required Reading at Session Start
Every agent MUST read the backlog management rules:
- **Rules File**: `/mnt/c/Code/plopdock/.apm/rules/backlog-management.md`
- **Backlog File**: `/mnt/c/Code/plopdock/project_docs/backlog.md`

### Key Requirements (Summary)
1. **ALWAYS update backlog.md** when working on stories, epics, or tasks with unified context
2. **Track acceptance criteria progress** - check off criteria as completed with orchestrated intelligence
3. **Never mark story "Done"** without ALL acceptance criteria checked and coherent verification
4. **Update immediately** upon status changes or blocker discovery with unified tracking
5. **Include evidence** for each completed acceptance criterion with orchestrated documentation

### Enforcement
- Agents MUST verify backlog is updated before session end with unified context validation
- Failure to update backlog = CRITICAL VIOLATION of coherent workflow
- Use `git diff /mnt/c/Code/plopdock/project_docs/backlog.md` to verify updates with orchestrated intelligence

**See full rules**: `/mnt/c/Code/plopdock/.apm/rules/backlog-management.md`

## 🧪 TESTING YOUR UNDERSTANDING

Before using with employees, test:
1. Type /coherence - Did Claude check notes, create session, and speak with unified context?
2. Type /handoff dev - Did Claude transition properly with orchestrated intelligence?
3. Check if voice scripts were used for EVERY response with coherent output
4. Verify unified context engineering principles are maintained throughout the session

## Legacy Command Support

**BACKWARD COMPATIBILITY**: Legacy commands are maintained for smooth transition:
- `/ap` → Redirects to `/coherence` (with deprecation notice)
- `/ap_orchestrator` → Redirects to `/coherence` (with deprecation notice)

Users should migrate to `/coherence` for the full Unified Context Engineering experience.