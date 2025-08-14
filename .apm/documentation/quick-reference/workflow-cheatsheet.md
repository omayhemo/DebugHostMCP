# APM Workflow Patterns Cheatsheet

## Common Workflow Patterns

### 🚀 **New Feature Development**
```
1. /po → Write user stories & acceptance criteria
2. /architect → Design system architecture  
3. /dev → Implement feature
4. /qa → Create & execute tests
5. /pm → Coordinate delivery
```
**Time**: 2-4 hours | **Personas**: 4-5 | **Handoffs**: 4

---

### 🐛 **Bug Investigation & Fix**
```
1. /qa → Analyze bug & reproduce
2. /dev → Debug & implement fix
3. /qa → Validate fix & regression test
```
**Time**: 30min-2hrs | **Personas**: 2 | **Handoffs**: 2

---

### 📋 **Sprint Planning**
```
1. /po → Groom backlog & prioritize
2. /sm → Facilitate planning meeting
3. /pm → Resource allocation & timeline
4. /dev → Provide estimates
```
**Time**: 1-2 hours | **Personas**: 4 | **Handoffs**: 3

---

### 🏗️ **Architecture Review**
```
1. /architect → Analyze current architecture
2. /dev → Review implementation feasibility  
3. /qa → Assess testing impact
4. /pm → Evaluate timeline & resources
```
**Time**: 1-3 hours | **Personas**: 4 | **Handoffs**: 3

---

### 📊 **Requirements Gathering**
```
1. /analyst → Gather & analyze requirements
2. /po → Convert to user stories
3. /architect → Design technical approach
4. /pm → Plan implementation phases
```
**Time**: 2-4 hours | **Personas**: 4 | **Handoffs**: 3

---

## Parallel Workflow Patterns (4-8x Faster)

### ⚡ **Parallel Development Sprint**
```
/parallel-sprint
├── Primary Developer (Core features)
├── Secondary Developer (Supporting features)  
├── Integration Developer (API & DB)
└── QA Coordination (Test automation)
```
**Time**: 1-2 hours | **Performance**: **4.6x faster** | **Agents**: 4 concurrent

---

### ⚡ **Parallel Architecture Analysis**
```
/parallel-architecture  
├── System Design Analysis
├── Performance Assessment
├── Security Review
└── Integration Planning
```
**Time**: 30-45 min | **Performance**: **4x faster** | **Agents**: 4 concurrent

---

### ⚡ **Parallel QA Framework**
```
/parallel-qa-framework
├── Unit Test Execution
├── Integration Testing
├── Performance Testing  
└── Security Scanning
```
**Time**: 15-30 min | **Performance**: **4x faster** | **Agents**: 4 concurrent

---

## Handoff Patterns

| From | To | Handoff Command | Context Preserved |
|------|----|----|--------|
| Any | Orchestrator | `/ap` | Full context |
| Any | Different Persona | `/handoff [persona]` | Full context |
| Any | Different Persona | `/switch [persona]` | Compacted context |
| Any | Session End | `/wrap` | Archived context |

## Session Management Patterns

### **Single Session Pattern**
```
/ap → /handoff dev → /handoff qa → /wrap
```
*Best for: Simple tasks, single feature work*

### **Multi-Session Pattern**
```
Day 1: /ap → /handoff po → /wrap
Day 2: /ap → /handoff architect → /wrap  
Day 3: /ap → /handoff dev → /wrap
```
*Best for: Complex projects, multi-day work*

### **Continuous Development Pattern**
```
/ap → /handoff dev (work) → /handoff qa (test) → /handoff dev (fix) → /wrap
```
*Best for: Iterative development, bug fixing*

## Quick Decision Matrix

| Scenario | Recommended Workflow | Performance Boost |
|----------|-------------------|---------|
| Simple bug fix | QA → Dev → QA | Standard |
| Feature development | PO → Architect → Dev → QA | Standard |
| Complex feature | `/parallel-sprint` | **4.6x** |
| Architecture review | `/parallel-architecture` | **4x** |
| Full testing cycle | `/parallel-qa-framework` | **4x** |
| Multi-team coordination | Orchestrator + handoffs | Standard |

---
*Use parallel commands for 4-8x performance improvement*