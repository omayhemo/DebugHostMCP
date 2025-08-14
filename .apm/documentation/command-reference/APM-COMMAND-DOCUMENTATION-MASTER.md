# APM Command Documentation Master Index
## Version 4.0.0 - Complete Native Sub-Agent Architecture

This master documentation provides comprehensive details for all APM (Agentic Persona Mapping) framework commands. All commands leverage Claude Code's native sub-agent system for maximum performance and reliability.

---

## 📚 Documentation Structure

### Core Documentation Files
1. **[Command Categories Overview](#command-categories)** - High-level categorization
2. **[Core Orchestrator Commands](APM-COMMANDS-01-ORCHESTRATOR.md)** - Central control and coordination
3. **[Persona Activation Commands](APM-COMMANDS-02-PERSONAS.md)** - Agent activation and switching
4. **[Parallel Execution Commands](APM-COMMANDS-03-PARALLEL.md)** - Native sub-agent parallelism (4-8x performance)
5. **[QA Framework Commands](APM-COMMANDS-04-QA-FRAMEWORK.md)** - Testing and quality assurance
6. **[Project Management Commands](APM-COMMANDS-05-PROJECT-MANAGEMENT.md)** - Planning and tracking
7. **[Development Commands](APM-COMMANDS-06-DEVELOPMENT.md)** - Implementation and coding
8. **[Documentation Commands](APM-COMMANDS-07-DOCUMENTATION.md)** - Document management
9. **[Utility Commands](APM-COMMANDS-08-UTILITIES.md)** - Helper and maintenance commands
10. **[Quick Reference Guide](APM-COMMANDS-QUICK-REFERENCE.md)** - At-a-glance command summary

---

## 🎯 Command Categories

### 1. Core Orchestrator Commands (6 commands)
Central control, session management, and agent coordination
- `/ap` or `/ap_orchestrator` - Launch AP Orchestrator 
- `/handoff` - Direct agent transition
- `/switch` - Agent switching with context
- `/wrap` - Session completion
- `/session-note-setup` - Initialize session management
- `/personas` - List available personas

### 2. Persona Activation Commands (9 commands)
Direct activation of specialized agent personas
- `/analyst` - Research and requirements specialist
- `/pm` - Product Manager for PRDs and roadmaps
- `/architect` - System architecture and design
- `/design-architect` - UI/UX and frontend architecture
- `/po` - Product Owner for backlog management
- `/sm` - Scrum Master for agile processes
- `/dev` or `/developer` - Code implementation
- `/qa` - Quality assurance and testing
- `/subtask` - Subtask management specialist

### 3. Parallel Execution Commands (25 commands)
Native sub-agent parallel processing (4-8x performance boost)
- **Requirements & Research** (5): brainstorming, requirements, research, stakeholder review, prioritization
- **Architecture & Design** (3): architecture, frontend-architecture, AI prompts
- **Project Management** (5): PRD, epic, stories, acceptance criteria, validation
- **Quality & Testing** (6): test strategy, test plan, automation, quality review, regression, QA framework
- **Development** (2): sprint coordination, parallel execution
- **Course Correction** (2): checklist, course correction
- **Documentation** (2): doc sharding, library indexing

### 4. QA Framework Commands (11 commands)
Comprehensive testing and quality assurance
- `/qa-framework` - Complete QA system access
- `/qa-predict` - ML-powered failure prediction
- `/qa-optimize` - Test execution optimization
- `/qa-anomaly` - Quality anomaly detection
- `/qa-insights` - AI-powered insights
- `/run-tests` - Execute test suites
- `/monitor-tests` - Real-time test monitoring
- `/show-test-status` - Test status dashboard
- `/test-dashboard` - Comprehensive test view
- `/test-metrics` - Quality metrics analysis
- `/test-plan` - Test planning

### 5. Project Management Commands (15 commands)
Planning, tracking, and coordination
- `/project-brief` - Project initialization
- `/prd` - Product Requirements Document
- `/epic` - Epic creation and management
- `/stories` - User story generation
- `/groom` - Backlog grooming
- `/prioritization` - Feature prioritization
- `/acceptance-criteria` - AC definition
- `/validation` - Story validation
- `/next-story` - Story progression
- `/checklist` - Task checklists
- `/course-correction` - Agile adjustments
- `/requirements` - Requirements gathering
- `/stakeholder-review` - Stakeholder feedback
- `/ux-spec` - UX specifications
- `/release` - Release management

### 6. Development Commands (8 commands)
Code implementation and technical work
- `/architecture` - System design
- `/frontend-architecture` - UI architecture
- `/automation-plan` - Automation strategy
- `/ai-prompt` - AI integration prompts
- `/git-commit-all` - Version control
- `/buildit` - Build distribution
- `/version` - Version management
- `/update-all-documentation` - Doc updates

### 7. Documentation Commands (6 commands)
Document processing and management
- `/doc-sharding` - Document segmentation
- `/library-indexing` - Knowledge indexing
- `/doc-compliance` - Compliance checking
- `/doc-compliance-enhanced` - Advanced compliance
- `/organize-docs` - Document organization
- `/research-prompt` - Research documentation

---

## 🚀 Key Features

### Native Sub-Agent Architecture (v4.0.0)
- **Performance**: 4-8x faster than sequential execution
- **Reliability**: Zero CLI crashes with native integration
- **Scalability**: 2-8 concurrent sub-agents per command
- **Intelligence**: Smart dependency management and conflict resolution

### Command Execution Patterns

#### Single Agent Commands
```
User: /dev
Result: Activates Developer persona for sequential work
```

#### Parallel Commands (Native Sub-Agents)
```
User: /parallel-sprint
Result: Launches 4 native Developer sub-agents working concurrently
Performance: 4.6x faster completion
```

#### Command Chaining
```
User: /analyst → /pm → /architect → /dev → /qa
Result: Complete development lifecycle workflow
```

---

## 📊 Performance Metrics

### Parallel Command Performance Gains
| Command Category | Sequential Time | Parallel Time | Speedup |
|-----------------|-----------------|---------------|---------|
| Sprint Development | 8.5 hours | 1.8 hours | 4.6x |
| PRD Creation | 3.5 hours | 1.0 hour | 3.5x |
| Architecture Design | 4.0 hours | 1.0 hour | 4.0x |
| Test Suite Execution | 2.0 hours | 0.5 hours | 4.0x |
| Document Processing | 6.0 hours | 0.9 hours | 6.7x |

---

## 🎓 Usage Guidelines

### When to Use Parallel Commands
- **Large Tasks**: Any task requiring >30 minutes of work
- **Multiple Components**: Tasks with independent subtasks
- **Time-Critical**: When speed is essential
- **Batch Operations**: Processing multiple items

### When to Use Single Agent Commands
- **Simple Tasks**: Quick, focused work
- **Sequential Dependencies**: Tasks requiring ordered execution
- **Interactive Work**: Real-time collaboration needed
- **Learning/Exploration**: Understanding codebase

---

## 🔧 Command Syntax

### Basic Command Structure
```
/<command> [options] [parameters]
```

### Examples
```bash
# Basic activation
/dev

# With parameters
/stories --count=5 --type=user

# Parallel execution
/parallel-sprint --agents=4

# Chained workflow
/analyst && /pm && /architect
```

---

## 📈 Version History

### v4.0.0 (Current)
- Complete Task tool modernization
- 100% native sub-agent architecture
- 25,599 lines of deprecated code removed
- Unified persona system with JSON definitions

### v3.5.0
- Enhanced parallel commands
- QA framework AI/ML integration
- MCP Plopdock integration

### v3.2.0
- Initial parallel command implementation
- Performance optimization framework

---

## 🔗 Related Documentation

- [APM Framework Overview](README.md)
- [Installation Guide](../installer/README.md)
- [Architecture Documentation](ARCHITECTURE.md)
- [Best Practices Guide](BEST-PRACTICES.md)
- [Troubleshooting Guide](TROUBLESHOOTING.md)

---

## 📝 Quick Start

### First Time Setup
```bash
1. Install APM: ./installer/install.sh
2. Initialize: /session-note-setup
3. Launch: /ap
4. Select persona: /dev
5. Begin work!
```

### Common Workflows

#### New Project
```
/ap → /analyst → /pm → /architect → /po → /sm → /dev → /qa
```

#### Sprint Development
```
/parallel-sprint --stories=5 --agents=4
```

#### Document Processing
```
/parallel-doc-sharding --file=requirements.pdf --chunks=10
```

---

## 🆘 Getting Help

- **Command Help**: `/<command> --help`
- **List Commands**: `/personas`
- **View Status**: `/ap status`
- **Documentation**: This guide and linked files
- **Support**: Create issue in project repository

---

*Generated by APM Framework v4.0.0 - Native Sub-Agent Architecture*
*Last Updated: 2025-08-08*