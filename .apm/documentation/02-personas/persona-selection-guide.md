# Persona Selection Guide - Which Agent Should I Use?

This guide helps you choose the right APM agent for your current task. Each agent is a specialist designed for specific aspects of software development.

---

## 🎯 Quick Decision Tree

```
What do you need to do?
│
├─ 💡 "I have an idea to explore"
│   └─ Use: /analyst
│
├─ 📄 "I need to document requirements"
│   └─ Use: /pm (Product Manager)
│
├─ 🏗️ "I need to design the system"
│   └─ Use: /architect
│
├─ 🎨 "I need to design the UI/UX"
│   └─ Use: /design-architect
│
├─ 📋 "I need to manage the backlog"
│   └─ Use: /po (Product Owner)
│
├─ 📝 "I need to create user stories"
│   └─ Use: /sm (Scrum Master)
│
├─ 💻 "I need to write code"
│   └─ Use: /dev (Developer)
│
├─ 🔍 "I need to test/validate"
│   └─ Use: /qa (Quality Assurance)
│
└─ 🎯 "I need coordination/guidance"
    └─ Use: ap (Orchestrator)
```

---

## 👥 Meet Your Agent Team

### 🎯 AP Orchestrator
**Command:** `ap` or `/ap_orchestrator`

**When to Use:**
- Starting a new session
- Need guidance on which agent to use
- Coordinating multiple agents
- Managing complex workflows
- Getting project status updates

**Specialties:**
- Central coordination
- Workflow management
- Agent delegation
- Context preservation
- Project oversight

**Example Scenarios:**
```
"Help me plan my project workflow"
"Which agent should I use for this task?"
"Show me the project status"
"Guide me through building an API"
```

---

### 🔍 Analyst
**Command:** `/analyst`

**When to Use:**
- Starting a new project
- Exploring ideas
- Gathering requirements
- Researching solutions
- Validating concepts

**Specialties:**
- Brainstorming facilitation
- Requirements gathering
- Market research
- Feasibility analysis
- Problem definition

**Example Scenarios:**
```
"Help me brainstorm a fitness tracking app"
"Research authentication best practices"
"Analyze requirements for a payment system"
"Validate this business idea"
```

**Parallel Alternative:** `/parallel-brainstorming` (4x faster)

---

### 📊 Product Manager (PM)
**Command:** `/pm`

**When to Use:**
- Creating Product Requirements Documents (PRD)
- Defining product vision
- Planning features
- Setting success metrics
- Stakeholder communication prep

**Specialties:**
- PRD creation
- Feature prioritization
- User story mapping
- Success metrics definition
- Roadmap planning

**Example Scenarios:**
```
"Create a PRD for our todo application"
"Define success metrics for this feature"
"Prioritize these feature requests"
"Plan the product roadmap"
```

**Parallel Alternative:** `/parallel-prd` (70% faster)

---

### 🏗️ System Architect
**Command:** `/architect`

**When to Use:**
- Designing system architecture
- Choosing technology stack
- Planning integrations
- Defining APIs
- Solving technical challenges

**Specialties:**
- System design
- Technology selection
- Architecture patterns
- Scalability planning
- Security architecture

**Example Scenarios:**
```
"Design architecture for a chat application"
"Choose the tech stack for our project"
"Plan microservices architecture"
"Design the API structure"
```

**Parallel Alternative:** `/parallel-architecture` (75% faster)

---

### 🎨 Design Architect
**Command:** `/design-architect`

**When to Use:**
- Designing user interfaces
- Creating UX specifications
- Planning frontend architecture
- Defining design systems
- Creating UI component libraries

**Specialties:**
- UI/UX design
- Frontend architecture
- Component design
- Design systems
- Responsive layouts

**Example Scenarios:**
```
"Design the UI for our dashboard"
"Create a design system"
"Plan the frontend architecture"
"Design mobile-responsive layouts"
```

**Parallel Alternative:** `/parallel-frontend-architecture`

---

### 📋 Product Owner (PO)
**Command:** `/po`

**When to Use:**
- Managing product backlog
- Grooming user stories
- Planning sprints
- Prioritizing work
- Defining acceptance criteria

**Specialties:**
- Backlog management
- Story grooming
- Sprint planning
- Prioritization
- Stakeholder management

**Example Scenarios:**
```
"Groom the backlog for next sprint"
"Create epics from the PRD"
"Prioritize these user stories"
"Define acceptance criteria"
```

**Parallel Alternative:** `/parallel-epic`, `/parallel-stories`

---

### 🏃 Scrum Master (SM)
**Command:** `/sm`

**When to Use:**
- Creating user stories
- Planning sprints
- Facilitating ceremonies
- Removing blockers
- Process improvement

**Specialties:**
- Story creation
- Sprint facilitation
- Process optimization
- Team coordination
- Agile coaching

**Example Scenarios:**
```
"Create user stories for authentication"
"Plan the next sprint"
"Help resolve this blocker"
"Optimize our development process"
```

**Parallel Alternative:** `/parallel-next-story`

---

### 💻 Developer
**Command:** `/dev` or `/developer`

**When to Use:**
- Writing code
- Implementing features
- Debugging issues
- Code refactoring
- Technical implementation

**Specialties:**
- Code implementation
- Algorithm design
- Debugging
- Performance optimization
- Code review

**Example Scenarios:**
```
"Implement user authentication"
"Debug this error"
"Refactor this code for better performance"
"Write unit tests"
```

**Note:** Can spawn multiple developers for parallel development

---

### 🔍 Quality Assurance (QA)
**Command:** `/qa`

**When to Use:**
- Creating test plans
- Writing test cases
- Performing testing
- Quality validation
- Bug tracking

**Specialties:**
- Test strategy
- Test automation
- Quality metrics
- Bug detection (92-94% accuracy)
- Performance testing

**Example Scenarios:**
```
"Create test plan for this feature"
"Write test cases for authentication"
"Perform security testing"
"Validate the implementation"
```

**Parallel Alternative:** `/parallel-qa-framework` (comprehensive testing)

---

## 🔄 Typical Workflow Sequences

### New Project Workflow
```
1. ap → Initialize orchestrator
2. /analyst → Explore and research
3. /pm → Create PRD
4. /architect → Design system
5. /po → Create backlog
6. /sm → Generate stories
7. /dev → Implement
8. /qa → Test and validate
```

### Feature Development Workflow
```
1. /analyst → Research requirements
2. /architect → Technical design
3. /sm → Create stories
4. /dev → Implementation
5. /qa → Testing
```

### Quick Prototype Workflow
```
1. /analyst → Quick ideation
2. /design-architect → UI mockup
3. /dev → Rapid prototype
```

### Bug Fix Workflow
```
1. /qa → Identify issue
2. /dev → Fix implementation
3. /qa → Validate fix
```

---

## ⚡ Parallel Execution Guide

### When to Use Parallel Commands

Use parallel commands when you need:
- Multiple analyses simultaneously
- Faster document generation
- Batch processing of similar tasks
- Comprehensive coverage quickly

### Parallel Command Mapping

| Sequential | Parallel | Speed Gain |
|------------|----------|------------|
| `/analyst` | `/parallel-brainstorming` | 4x |
| `/pm` | `/parallel-prd` | 70% faster |
| `/architect` | `/parallel-architecture` | 75% faster |
| `/po` + `/sm` | `/parallel-stories` | 4x |
| `/qa` | `/parallel-qa-framework` | 4x |

---

## 💡 Best Practices

### 1. Start with the Orchestrator
Always begin with `ap` to initialize the system and get guidance.

### 2. Follow the Natural Flow
Idea → Research → Requirements → Design → Implementation → Testing

### 3. Use Specialists for Depth
Each agent is an expert - use them for their specialty.

### 4. Leverage Parallel for Speed
When time matters, use parallel commands.

### 5. Maintain Context
Agents share session notes - no need to repeat information.

---

## 🎯 Decision Matrix

| I Need To... | Best Agent | Alternative | Parallel Option |
|--------------|------------|-------------|-----------------|
| Explore ideas | Analyst | PM | `/parallel-brainstorming` |
| Write requirements | PM | Analyst | `/parallel-prd` |
| Design system | Architect | Design Arch | `/parallel-architecture` |
| Design UI | Design Arch | Architect | `/parallel-frontend-architecture` |
| Manage backlog | PO | SM | `/parallel-stories` |
| Create stories | SM | PO | `/parallel-next-story` |
| Write code | Developer | - | Multiple developers |
| Test code | QA | Developer | `/parallel-qa-framework` |
| Coordinate | Orchestrator | - | - |

---

## 📊 Agent Collaboration Patterns

### Sequential Handoff
```
Analyst → PM → Architect → Developer → QA
```
Each agent completes their work before handing off.

### Parallel Coordination
```
        ┌→ Developer 1
Architect → Developer 2
        └→ Developer 3
```
Multiple agents work simultaneously.

### Iterative Refinement
```
PM ↔ Architect ↔ Developer
```
Agents collaborate back and forth.

### Hub and Spoke
```
    Analyst
       ↓
  Orchestrator → PM
       ↓       ↘ Architect
   Developer    ↘ QA
```
Orchestrator coordinates multiple specialists.

---

## 🚨 Common Mistakes to Avoid

### ❌ Using the Wrong Agent
- **Wrong:** Using Developer for requirements gathering
- **Right:** Use Analyst or PM for requirements

### ❌ Skipping Planning Phases
- **Wrong:** Jumping straight to development
- **Right:** Research → Plan → Design → Develop

### ❌ Not Using Parallel Commands
- **Wrong:** Sequential execution for everything
- **Right:** Use parallel for appropriate tasks

### ❌ Forgetting Context
- **Wrong:** Repeating information to each agent
- **Right:** Agents share context automatically

---

## 🎪 Pro Tips

### Rapid Prototyping
```bash
/parallel-brainstorming  # Quick ideation
/design-architect        # Fast UI design
/dev                     # Immediate implementation
```

### Comprehensive Documentation
```bash
/parallel-prd            # Complete PRD
/parallel-architecture   # Full system design
/parallel-stories        # All user stories
```

### Quality-First Development
```bash
/qa-framework           # Set quality standards first
/dev                    # Develop with quality in mind
/parallel-test          # Comprehensive testing
```

---

## 📚 Learn More

- **Agent Details:** See individual guides in [`../02-personas/`](../02-personas/)
- **Workflows:** Check [`../03-workflows/`](../03-workflows/)
- **Commands:** Reference [`../04-commands/`](../04-commands/)
- **Examples:** Browse [`../examples/`](../examples/)

---

## 🆘 Need Help?

- Can't decide? Use `ap` and ask for guidance
- Want details? Read the specific agent guide
- Need examples? Check the examples directory
- Still stuck? See troubleshooting guide

---

*Remember: Each agent is a specialist. Use the right expert for the right job!*