# APM Persona Selection Guide

## When to Use Which Persona

### 🎯 **AP Orchestrator** (`/ap`)
**Use when:**
- Starting a new project
- Need guidance on which persona to use
- Coordinating multiple work streams
- Planning complex initiatives

**Don't use when:** You know exactly what type of work you need done

---

### 💻 **Developer** (`/dev`)
**Use when:**
- Writing code
- Debugging issues
- Implementing features
- Code reviews
- Technical problem solving

**Avoid when:** Need architecture decisions or project planning

---

### 🏗️ **System Architect** (`/architect`)
**Use when:**
- Designing system architecture
- Making technology decisions
- Scalability planning
- Integration patterns
- Technical strategy

**Avoid when:** Need specific implementation details

---

### 📋 **Project Manager** (`/pm`)
**Use when:**
- Project planning & coordination
- Resource allocation
- Timeline management
- Risk assessment
- Stakeholder communication

**Avoid when:** Need technical implementation

---

### 🎨 **Design Architect** (`/design-architect`)
**Use when:**
- UI/UX design
- Design system creation
- User experience planning
- Visual design decisions
- Accessibility considerations

**Avoid when:** Need backend or data architecture

---

### 📊 **Product Owner** (`/po`)
**Use when:**
- Writing user stories
- Backlog management
- Feature prioritization
- Requirements gathering
- Sprint planning

**Avoid when:** Need technical implementation details

---

### 🧪 **Quality Assurance** (`/qa`)
**Use when:**
- Test planning & strategy
- Quality validation
- Test automation
- Bug analysis
- Performance testing

**Avoid when:** Need feature development

---

### 📈 **Business Analyst** (`/analyst`)
**Use when:**
- Requirements analysis
- Process modeling
- Data analysis
- Business case development
- Stakeholder analysis

**Avoid when:** Need technical implementation

---

### 🚀 **Scrum Master** (`/sm`)
**Use when:**
- Sprint facilitation
- Team coordination
- Process improvement
- Impediment removal
- Agile coaching

**Avoid when:** Need hands-on technical work

---

## Quick Decision Tree

```
Need to write code? → /dev
Need system design? → /architect
Need UI/UX work? → /design-architect
Need project planning? → /pm
Need user stories? → /po
Need testing strategy? → /qa
Need requirements analysis? → /analyst
Need sprint facilitation? → /sm
Not sure what you need? → /ap
```

## Persona Combinations

| Primary Task | Primary Persona | Follow-up Persona |
|-------------|----------------|-------------------|
| New feature | `/po` → `/architect` → `/dev` → `/qa` |
| Bug fix | `/qa` → `/dev` → `/qa` |
| Architecture review | `/architect` → `/dev` |
| Sprint planning | `/po` → `/pm` → `/sm` |
| Requirements gathering | `/analyst` → `/po` → `/architect` |

---
*Keep this guide handy for quick persona selection*