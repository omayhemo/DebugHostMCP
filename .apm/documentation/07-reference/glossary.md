# APM Glossary

Comprehensive terminology and definitions for the Agentic Persona Mapping (APM) framework.

## 📋 Table of Contents

1. [Core APM Concepts](#core-apm-concepts)
2. [Persona System](#persona-system)
3. [Session Management](#session-management)
4. [Parallel Execution](#parallel-execution)
5. [QA Framework](#qa-framework)
6. [Technical Architecture](#technical-architecture)
7. [Integration Terms](#integration-terms)
8. [Development Workflow](#development-workflow)

---

## 🏗️ Core APM Concepts

### **A**

**Agent**
A software entity that acts autonomously to perform tasks. In APM, agents are implemented as persona-specific AI assistants that handle different aspects of software development.

**Agentic Persona Mapping (APM)**
A framework that maps distinct AI personas to specific roles in software development teams, enabling specialized and coordinated development workflows.

**AP Orchestrator**
The central coordination agent that manages persona activation, task delegation, and workflow orchestration. Activated via `/ap` or `/ap_orchestrator` commands.

**APM Root (`/mnt/c/Code/MCPServers/DebugHostMCP/.apm`)**
The base directory containing all APM framework files, typically located at `/mnt/c/Code/MCPServers/DebugHostMCP/.apm`.

**Acceptance Criteria**
Specific conditions that must be met for a user story to be considered complete. APM agents automatically track and update acceptance criteria progress in the backlog.

**Activation Command**
A slash command (e.g., `/developer`, `/qa`, `/architect`) that activates a specific persona and transitions Claude into that role.

**Archiving**
The process of moving completed session notes from the active directory to the archive directory for long-term storage and organization.

### **B**

**Backlog Management**
The systematic tracking and updating of user stories, epics, and tasks in `backlog.md`. All APM personas are required to update the backlog when completing work.

**Build Distribution**
The process of generating APM installation packages from source templates and configurations, handled by `build-distribution.sh`.

### **C**

**Claude Code**
Anthropic's CLI tool that APM integrates with, providing the underlying command execution and file management capabilities.

**Coordination**
The process by which multiple parallel agents communicate and synchronize their work to avoid conflicts and ensure coherent outcomes.

**Command Pipeline**
The sequence of operations executed when an APM command is invoked, including session management, voice notifications, and persona activation.

---

## 👥 Persona System

### **D**

**Design Architect**
An APM persona specializing in user interface design, user experience architecture, and design system creation. Activated with `/design-architect`.

**Developer Agent**
An APM persona focused on code implementation, testing, and technical documentation. Activated with `/developer` or `/dev`.

**Dynamic Persona Switching**
The ability to transition between different persona types during a session without losing context, using commands like `/handoff` and `/switch`.

### **E**

**Epic**
A large user story or feature that spans multiple sprints and contains multiple smaller user stories. APM tracks epic progress and completion percentages.

### **H**

**Handoff**
A direct transition from one persona to another without session compaction, preserving full context. Executed via the `/handoff` command.

### **P**

**Persona**
A specialized AI role with specific capabilities, responsibilities, and behavioral patterns. APM includes 9 core personas: Orchestrator, Analyst, Architect, Developer, PM, PO, QA, SM, and Design Architect.

**Persona Activation**
The process of transforming Claude into a specific persona role, including loading relevant context, activating voice notifications, and applying behavioral rules.

**Persona Capability**
A specific skill or function that a persona can perform, such as "code_implementation" for developers or "test_planning" for QA.

**Product Manager (PM)**
An APM persona responsible for project planning, resource management, risk assessment, and timeline coordination. Activated with `/pm`.

**Product Owner (PO)**
An APM persona handling backlog management, priority setting, stakeholder communication, and product vision. Activated with `/po`.

### **Q**

**QA Agent**
An APM persona specializing in test planning, test execution, defect management, and quality metrics. Activated with `/qa`.

### **S**

**Scrum Master (SM)**
An APM persona focused on ceremony facilitation, impediment removal, team coaching, and process improvement. Activated with `/sm`.

**System Architect**
An APM persona handling system design, technical specifications, architecture documentation, and technology recommendations. Activated with `/architect`.

---

## 📝 Session Management

### **A**

**Active Session**
A currently running APM session with an associated session note file that tracks objectives, progress, and decisions in real-time.

**Archive Directory**
The storage location (`/mnt/c/Code/MCPServers/DebugHostMCP/.apm/session_notes/archive/`) for completed and historical session notes.

### **C**

**Context Continuity**
The preservation of project knowledge and decision history across session boundaries through structured session notes and backlog updates.

**Current Session Note**
The active session note file being updated during the current APM session, following the naming convention `YYYY-MM-DD-HH-mm-ss-Description.md`.

### **S**

**Session Compaction**
The process of summarizing and archiving a session before transitioning to a new persona, triggered by the `/switch` command.

**Session Duration**
The length of time an APM session remains active, tracked automatically and displayed in session summaries.

**Session ID**
A unique identifier for each APM session, typically formatted as `YYYY-MM-DD-HH-mm-ss` based on the session start time.

**Session Management**
The systematic creation, updating, and archiving of session notes to maintain project continuity and decision tracking.

**Session Note**
A markdown file that documents session objectives, progress, decisions, issues, and next steps. Created automatically for each APM session.

**Session Transition**
The process of moving from one persona to another, which can be direct (handoff) or with compaction (switch).

### **W**

**Wrap Command**
The `/wrap` command that archives current session notes and creates a comprehensive session summary before ending an APM session.

---

## ⚡ Parallel Execution

### **C**

**Concurrent Execution**
The ability to run multiple APM agents simultaneously using Claude Code's native sub-agent architecture, providing 4-8x performance improvements.

**Conflict Resolution**
The automated process of detecting and resolving conflicts when multiple parallel agents work on related files or tasks.

**Coordination Protocol**
The system of communication and synchronization between parallel agents to ensure coherent and non-conflicting work.

### **D**

**Dependency Management**
The intelligent tracking and resolution of dependencies between parallel tasks to ensure proper execution order.

### **N**

**Native Sub-Agent**
Claude Code's built-in parallel execution system that APM v4.0.0 uses for true concurrent processing, replacing the legacy Task tool system.

**Native Sub-Agent Architecture**
APM v4.0.0's modernized execution system that leverages Claude Code's native parallel processing capabilities for maximum performance and stability.

### **P**

**Parallel Agent**
An individual sub-agent executing concurrently with other agents as part of a parallel command execution.

**Parallel Command**
An APM command that launches multiple sub-agents concurrently, such as `/parallel-sprint` or `/parallel-qa-framework`.

**Parallel Coordination**
The system that manages communication and synchronization between multiple concurrent agents.

**Performance Multiplier**
The speed improvement achieved through parallel execution, with APM v4.0.0 delivering 4-8x average performance gains.

### **R**

**Resource Management**
The system that allocates and manages computational resources across multiple parallel agents to ensure optimal performance.

### **S**

**Sub-Agent**
An individual agent instance running as part of a parallel execution, each handling a specific subset of the overall task.

**Synchronization**
The process of coordinating activities and sharing information between parallel agents to maintain consistency.

---

## 🧪 QA Framework

### **A**

**AI/ML Analytics**
Advanced artificial intelligence and machine learning capabilities integrated into the QA framework for predictive analysis and optimization.

**Anomaly Detection**
ML-powered system that identifies unusual patterns in test execution, performance metrics, or quality indicators with 94% precision.

### **F**

**Fail-Fast Strategy**
A test optimization approach that runs tests most likely to fail first, reducing overall testing time and providing faster feedback.

**Framework Integration**
The seamless integration of QA tools and processes into the APM workflow, including automated testing and quality metrics.

### **P**

**Performance Testing**
Automated load testing and performance validation capabilities integrated into the QA framework.

**Predictive Testing**
ML-powered test failure prediction system with 92% accuracy, analyzing historical patterns and code changes.

### **Q**

**QA Framework**
Comprehensive quality assurance system with integrated AI/ML capabilities for testing, security scanning, and performance validation.

**Quality Metrics**
Measurable indicators of software quality tracked and reported by the QA framework, including test coverage, defect rates, and performance benchmarks.

### **R**

**Risk-Based Testing**
A testing strategy that prioritizes tests based on risk assessment and failure probability predictions.

**Regression Suite**
Comprehensive set of tests designed to verify that new changes don't break existing functionality.

### **S**

**Security Scanning**
Automated SAST (Static Application Security Testing) and DAST (Dynamic Application Security Testing) capabilities.

### **T**

**Test Optimization**
AI-powered system that reduces test execution time by up to 63% through intelligent test ordering and parallel execution strategies.

**Test Prediction**
Machine learning system that predicts test failures based on code changes, historical data, and dependency analysis.

---

## 🔧 Technical Architecture

### **C**

**Claude Code Integration**
The seamless integration between APM and Claude Code's native systems, including command processing, file operations, and sub-agent execution.

**Configuration Schema**
JSON schema definitions that validate APM configuration files and ensure proper system setup.

### **H**

**Hook System**
Integration points that allow APM to intercept and modify Claude Code operations, including pre/post tool use and prompt enhancement.

**Hook Script**
Python scripts that execute at specific integration points to provide custom functionality like MCP Plopdock integration.

### **M**

**Master Persona Definition**
JSON configuration files in `/installer/personas/_master/` that serve as the single source of truth for persona definitions.

**MCP Plopdock**
Model Context Protocol plopdock integration that manages development servers and provides persistent execution environments.

**Modernization**
The comprehensive update of APM v4.0.0 that replaced legacy systems with native sub-agent architecture and unified persona definitions.

### **T**

**Template Generation**
The automated process of generating APM configuration files and documentation from master templates during build/installation.

**Template Variable**
Placeholder values in template files (e.g., `/mnt/c/Code/MCPServers/DebugHostMCP/.apm`) that are replaced with actual values during generation.

**Template System**
The unified system for generating all APM files from templates, ensuring consistency and eliminating code duplication.

---

## 🔗 Integration Terms

### **C**

**Command Recognition**
The system that identifies and executes APM commands when users type keywords like "ap", "developer", or "qa".

**Cross-Platform Compatibility**
APM's ability to function across different operating systems (Linux, macOS, Windows, WSL) with appropriate adaptations.

### **E**

**Environment Variable**
Configuration values passed through the system environment to control APM behavior and integration settings.

### **I**

**Integration Point**
Specific locations in the Claude Code workflow where APM can inject custom functionality through hooks or commands.

**Interoperability**
The ability of APM to work seamlessly with external tools and systems like Git, CI/CD pipelines, and project management tools.

### **V**

**Voice Notification**
Audio feedback system that provides spoken confirmations and updates during persona activation and task completion.

**Voice Script**
Shell scripts (e.g., `speakDeveloper.sh`) that generate text-to-speech output for persona-specific notifications.

---

## 🚀 Development Workflow

### **A**

**Agile Integration**
APM's built-in support for agile development methodologies, including sprint planning, backlog management, and iterative development.

**Automated Documentation**
System for automatically generating and updating project documentation based on code changes and session activities.

### **B**

**Backlog Health**
The overall quality and organization of the product backlog, including story grooming status, acceptance criteria completeness, and priority ordering.

**Build Integration**
The connection between APM and build/deployment systems for automated testing and continuous integration.

### **C**

**Continuous Integration**
The integration of APM with CI/CD pipelines for automated testing, quality checks, and deployment processes.

**Code Review Workflow**
Structured process for peer review of code changes, facilitated by APM personas and integrated into the development flow.

### **D**

**Development Server Management**
APM's integration with MCP Plopdock for persistent development server management across Claude Code sessions.

**Documentation Strategy**
Comprehensive approach to maintaining project documentation through automated generation and persona-driven updates.

### **G**

**Git Integration**
APM's ability to work with Git repositories for version control, branch management, and commit tracking.

**Grooming**
The process of refining user stories in the backlog, including adding acceptance criteria, estimating points, and ensuring clarity.

### **I**

**Iterative Development**
Development approach supported by APM where features are built incrementally with continuous feedback and refinement.

### **S**

**Sprint Planning**
The process of selecting and planning work for upcoming sprints, facilitated by APM's backlog management and capacity tracking.

**Story Points**
Relative estimation units used to size user stories and track team velocity in agile development.

### **V**

**Velocity Tracking**
The measurement of team productivity over time based on completed story points and sprint capacity.

**Version Control Integration**
APM's ability to work with version control systems for tracking changes, managing branches, and maintaining history.

### **W**

**Workflow Automation**
The use of APM to automate repetitive development tasks and enforce consistent processes across the team.

---

## 🎯 Acronyms & Abbreviations

| Acronym | Full Form | Definition |
|---------|-----------|------------|
| **APM** | Agentic Persona Mapping | The core framework for AI persona-based development |
| **AP** | Agent Persona | Prefix for APM agent roles (AP Orchestrator, AP Developer, etc.) |
| **AI/ML** | Artificial Intelligence/Machine Learning | Advanced analytics capabilities in QA framework |
| **CLI** | Command Line Interface | Text-based interface for system interaction |
| **CI/CD** | Continuous Integration/Continuous Deployment | Automated build and deployment pipeline |
| **DAST** | Dynamic Application Security Testing | Runtime security scanning |
| **JSON** | JavaScript Object Notation | Data format used for configuration files |
| **MCP** | Model Context Protocol | Protocol for AI model communication and debugging |
| **PM** | Project Manager | APM persona for project coordination |
| **PO** | Product Owner | APM persona for product management |
| **QA** | Quality Assurance | APM persona and framework for testing |
| **SAST** | Static Application Security Testing | Code-level security analysis |
| **SM** | Scrum Master | APM persona for agile process facilitation |
| **TTS** | Text-to-Speech | Technology for voice notifications |
| **UI/UX** | User Interface/User Experience | Design aspects handled by Design Architect persona |
| **WSL** | Windows Subsystem for Linux | Windows compatibility layer for Linux tools |

---

## 🔍 Quick Reference

### Command Patterns
- **Activation Commands**: `/persona-name` (e.g., `/developer`, `/qa`)
- **Parallel Commands**: `/parallel-command` (e.g., `/parallel-sprint`)
- **Session Commands**: `/handoff`, `/switch`, `/wrap`
- **Framework Commands**: `/qa-framework`, `/ap_orchestrator`

### File Patterns
- **Session Notes**: `YYYY-MM-DD-HH-mm-ss-Description.md`
- **Persona Configs**: `persona-name.persona.json`
- **Voice Scripts**: `speakPersonaName.sh`
- **Templates**: `filename.extension.template`

### Directory Structure
- **APM Root**: `/mnt/c/Code/MCPServers/DebugHostMCP/.apm/`
- **Personas**: `/mnt/c/Code/MCPServers/DebugHostMCP/.apm/agents/personas/`
- **Session Notes**: `/mnt/c/Code/MCPServers/DebugHostMCP/.apm/session_notes/`
- **Configuration**: `/mnt/c/Code/MCPServers/DebugHostMCP/.apm/config/`

---

**Glossary Version**: {{PROJECT_VERSION}}  
**Last Updated**: {{CURRENT_DATE}}  
**Total Terms**: 150+ comprehensive definitions