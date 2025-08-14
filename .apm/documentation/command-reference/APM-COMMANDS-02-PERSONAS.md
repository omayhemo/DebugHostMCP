# APM Persona Activation Commands
## Specialized Agent Activation and Management

Each persona represents a specialized agent with unique capabilities, behavioral patterns, and domain expertise. These commands directly activate specific personas for focused work.

---

## 🔍 `/analyst`
### Activate Analyst Agent - Research & Requirements Specialist

**Purpose**: Activates the Analyst persona for deep research, requirements gathering, and investigative analysis.

**Core Capabilities**:
- Requirements elicitation and documentation
- Stakeholder analysis and interviews
- Market research and competitive analysis
- Technical feasibility studies
- Risk assessment and mitigation planning

**What it does**:
1. Loads analyst-specific knowledge base
2. Activates research-oriented toolsets
3. Initializes requirements tracking
4. Enables deep analysis workflows
5. Sets up stakeholder communication patterns

**Options**:
- `--domain=technical|business|market` - Analysis focus area
- `--depth=surface|standard|deep` - Research depth level
- `--output=report|brief|findings` - Output format preference
- `--stakeholders="list"` - Stakeholder groups to consider

**Parallel Commands Available**:
- `/parallel-requirements` - Gather requirements from multiple sources
- `/parallel-research-prompt` - Conduct parallel research streams
- `/parallel-brainstorming` - Multi-perspective ideation
- `/parallel-stakeholder-review` - Concurrent stakeholder analysis

**Suggested Use Cases**:
- Project discovery phase
- Requirements documentation
- Feasibility analysis
- Risk assessment
- Market research
- Technical investigation

**Example Usage**:
```bash
# Basic activation
/analyst

# Technical deep dive
/analyst --domain=technical --depth=deep

# Business requirements focus
/analyst --domain=business --output=report

# Stakeholder-focused analysis
/analyst --stakeholders="users,admins,developers"
```

**Specialized Workflows**:
- Project Brief → Requirements → Feasibility Study
- Market Analysis → Competitive Research → Opportunity Assessment
- Technical Investigation → Architecture Options → Recommendations

---

## 📊 `/pm`
### Activate Product Manager - Product Strategy & Planning

**Purpose**: Activates the Product Manager persona for product strategy, roadmapping, and PRD creation.

**Core Capabilities**:
- Product Requirements Document (PRD) creation
- Feature prioritization and roadmapping
- User story generation and refinement
- Stakeholder alignment and communication
- Market positioning and strategy

**What it does**:
1. Loads product management frameworks
2. Initializes PRD templates
3. Sets up prioritization matrices
4. Enables roadmap visualization
5. Activates stakeholder communication protocols

**Options**:
- `--focus=strategy|execution|metrics` - PM focus area
- `--template=lean|standard|comprehensive` - PRD template type
- `--timeline=quarter|year|multi-year` - Planning horizon
- `--methodology=agile|lean|traditional` - PM methodology

**Parallel Commands Available**:
- `/parallel-prd` - Create PRD 70% faster
- `/parallel-prioritization` - Multi-criteria prioritization
- `/parallel-epic` - Parallel epic development

**Suggested Use Cases**:
- PRD creation and refinement
- Feature prioritization
- Roadmap development
- Stakeholder presentations
- Market analysis
- Success metrics definition

**Example Usage**:
```bash
# Basic activation
/pm

# Strategic planning focus
/pm --focus=strategy --timeline=year

# Lean PRD creation
/pm --template=lean --methodology=agile

# Comprehensive product planning
/pm --template=comprehensive --focus=execution
```

**Key Deliverables**:
- Product Requirements Documents
- Feature Roadmaps
- Prioritization Matrices
- Success Metrics
- Stakeholder Communications

---

## 🏗️ `/architect`
### Activate System Architect - Technical Design & Architecture

**Purpose**: Activates the Architect persona for system design, technical architecture, and technology decisions.

**Core Capabilities**:
- System architecture design
- Technology stack selection
- Integration planning
- Performance optimization
- Security architecture
- Scalability planning

**What it does**:
1. Loads architecture patterns and frameworks
2. Initializes design documentation tools
3. Sets up technology evaluation criteria
4. Enables architecture diagramming
5. Activates technical decision records

**Options**:
- `--style=microservices|monolithic|serverless|hybrid` - Architecture style
- `--focus=performance|security|scalability|maintainability` - Primary concern
- `--complexity=simple|moderate|complex` - System complexity
- `--cloud=aws|azure|gcp|multi|on-premise` - Deployment target

**Parallel Commands Available**:
- `/parallel-architecture` - Design system 75% faster
- `/parallel-frontend-architecture` - Frontend design parallelization

**Suggested Use Cases**:
- System architecture design
- Technology selection
- Integration architecture
- Performance optimization
- Security design
- Migration planning

**Example Usage**:
```bash
# Basic activation
/architect

# Microservices design
/architect --style=microservices --cloud=aws

# Security-focused architecture
/architect --focus=security --complexity=complex

# Scalable cloud architecture
/architect --focus=scalability --cloud=multi
```

**Architecture Artifacts**:
- System Design Documents
- Architecture Diagrams
- Technology Decision Records
- Integration Specifications
- Performance Models

---

## 🎨 `/design-architect`
### Activate Design Architect - UI/UX & Frontend Architecture

**Purpose**: Activates the Design Architect for UI/UX design, frontend architecture, and user experience optimization.

**Core Capabilities**:
- UI/UX design and prototyping
- Design system creation
- Component library architecture
- Accessibility planning
- Frontend performance optimization
- User journey mapping

**What it does**:
1. Loads design patterns and systems
2. Initializes UI/UX frameworks
3. Sets up component architecture
4. Enables design tooling
5. Activates user research protocols

**Options**:
- `--framework=react|vue|angular|native` - Frontend framework
- `--design-system=material|custom|bootstrap` - Design system
- `--device=web|mobile|tablet|responsive` - Target devices
- `--accessibility=wcag-a|wcag-aa|wcag-aaa` - Accessibility level

**Parallel Commands Available**:
- `/parallel-frontend-architecture` - Parallel frontend design
- `/parallel-ai-prompt` - AI-enhanced design generation

**Suggested Use Cases**:
- Design system creation
- Component architecture
- User interface design
- Accessibility implementation
- Performance optimization
- Responsive design

**Example Usage**:
```bash
# Basic activation
/design-architect

# React design system
/design-architect --framework=react --design-system=custom

# Mobile-first design
/design-architect --device=mobile --accessibility=wcag-aa

# Comprehensive responsive design
/design-architect --device=responsive --framework=vue
```

**Design Deliverables**:
- Design Systems
- Component Libraries
- UI Specifications
- Accessibility Guidelines
- Performance Budgets

---

## 📋 `/po`
### Activate Product Owner - Backlog Management & Story Refinement

**Purpose**: Activates the Product Owner persona for backlog management, story creation, and sprint planning.

**Core Capabilities**:
- Backlog grooming and prioritization
- Epic and story creation
- Acceptance criteria definition
- Sprint planning support
- Stakeholder communication
- Value delivery optimization

**What it does**:
1. Loads backlog management tools
2. Initializes story templates
3. Sets up prioritization frameworks
4. Enables sprint planning workflows
5. Activates value tracking metrics

**Options**:
- `--sprint-length=1|2|3|4` - Sprint duration in weeks
- `--team-size=small|medium|large` - Team capacity
- `--methodology=scrum|kanban|scrumban` - Agile methodology
- `--focus=delivery|quality|innovation` - Sprint focus

**Parallel Commands Available**:
- `/parallel-epic` - Create epics in parallel
- `/parallel-stories` - Generate multiple stories
- `/parallel-acceptance-criteria` - Define AC concurrently
- `/parallel-validation` - Validate multiple items

**Suggested Use Cases**:
- Backlog grooming sessions
- Sprint planning
- Story refinement
- Epic breakdown
- Release planning
- Velocity tracking

**Example Usage**:
```bash
# Basic activation
/po

# Sprint planning mode
/po --sprint-length=2 --team-size=medium

# Kanban flow management
/po --methodology=kanban --focus=delivery

# Innovation sprint
/po --sprint-length=1 --focus=innovation
```

**Backlog Artifacts**:
- Groomed Backlog
- User Stories
- Acceptance Criteria
- Sprint Plans
- Release Plans

---

## 🏃 `/sm`
### Activate Scrum Master - Agile Process & Team Facilitation

**Purpose**: Activates the Scrum Master persona for agile process management, team facilitation, and impediment removal.

**Core Capabilities**:
- Sprint ceremony facilitation
- Story creation and validation
- Team velocity tracking
- Impediment identification and removal
- Process improvement
- Team coaching

**What it does**:
1. Loads agile frameworks and practices
2. Initializes ceremony templates
3. Sets up velocity tracking
4. Enables impediment tracking
5. Activates team collaboration tools

**Options**:
- `--ceremony=planning|daily|review|retro` - Ceremony focus
- `--team-maturity=forming|storming|norming|performing` - Team stage
- `--impediments=true|false` - Focus on blockers
- `--metrics=velocity|quality|happiness` - Tracking focus

**Parallel Commands Available**:
- `/parallel-next-story` - Process multiple stories
- `/parallel-stories` - Create story batches
- `/parallel-checklist` - Generate checklists
- `/parallel-course-correction` - Multi-aspect adjustments

**Suggested Use Cases**:
- Sprint ceremony facilitation
- Story workshop sessions
- Impediment resolution
- Team coaching
- Process improvement
- Velocity optimization

**Example Usage**:
```bash
# Basic activation
/sm

# Sprint planning facilitation
/sm --ceremony=planning --team-maturity=performing

# Impediment focus
/sm --impediments=true --metrics=velocity

# Team retrospective
/sm --ceremony=retro --team-maturity=norming
```

**Scrum Artifacts**:
- Sprint Backlogs
- Burndown Charts
- Impediment Logs
- Velocity Reports
- Retrospective Actions

---

## 💻 `/dev` or `/developer`
### Activate Developer Agent - Code Implementation & Technical Execution

**Purpose**: Activates the Developer persona for code implementation, technical story execution, and development tasks.

**Core Capabilities**:
- Code implementation
- API development
- Database design
- Testing implementation
- Code review
- Performance optimization
- Bug fixing

**What it does**:
1. Loads development frameworks and tools
2. Initializes coding standards
3. Sets up development environment
4. Enables code generation workflows
5. Activates testing frameworks

**Options**:
- `--language=javascript|python|java|go|rust` - Primary language
- `--type=frontend|backend|fullstack|api` - Development focus
- `--framework="specific-framework"` - Framework specification
- `--testing=unit|integration|e2e` - Testing emphasis

**Related Parallel Commands**:
- `/parallel-sprint` - Launch multiple developers (4.6x faster)

**Suggested Use Cases**:
- Feature implementation
- API development
- Bug fixing
- Code refactoring
- Performance optimization
- Test implementation

**Example Usage**:
```bash
# Basic activation
/dev

# Backend API development
/dev --type=backend --language=python

# Frontend React development
/dev --type=frontend --framework=react

# Full-stack development
/dev --type=fullstack --testing=unit
```

**Development Deliverables**:
- Implemented Features
- API Endpoints
- Test Suites
- Documentation
- Code Reviews

---

## 🔍 `/qa`
### Activate QA Agent - Quality Assurance & Testing

**Purpose**: Activates the QA persona for comprehensive testing, quality assurance, and validation.

**Core Capabilities**:
- Test strategy development
- Test case creation
- Automated testing
- Performance testing
- Security testing
- Bug tracking and validation
- Quality metrics

**What it does**:
1. Loads testing frameworks and tools
2. Initializes test templates
3. Sets up quality metrics
4. Enables test automation
5. Activates bug tracking systems

**Options**:
- `--focus=functional|performance|security|accessibility` - Testing focus
- `--automation=full|partial|manual` - Automation level
- `--coverage=basic|standard|comprehensive` - Test coverage
- `--environment=dev|staging|prod` - Target environment

**Parallel Commands Available**:
- `/parallel-qa-framework` - Execute all test types (4x speedup)
- `/parallel-test-strategy` - Develop strategies in parallel
- `/parallel-test-plan` - Create comprehensive test plans
- `/parallel-regression-suite` - Run regression tests

**AI/ML Enhanced Commands**:
- `/qa-predict` - ML-powered failure prediction (92% accuracy)
- `/qa-optimize` - Test optimization (63% time reduction)
- `/qa-anomaly` - Anomaly detection (94% precision)
- `/qa-insights` - AI-powered quality insights

**Suggested Use Cases**:
- Test strategy development
- Test case creation
- Automated testing
- Performance testing
- Security validation
- Regression testing
- Quality reporting

**Example Usage**:
```bash
# Basic activation
/qa

# Security-focused testing
/qa --focus=security --coverage=comprehensive

# Automated performance testing
/qa --focus=performance --automation=full

# Accessibility testing
/qa --focus=accessibility --environment=staging
```

**QA Deliverables**:
- Test Strategies
- Test Plans
- Test Cases
- Automation Scripts
- Quality Reports
- Bug Reports

---

## 📦 `/subtask`
### Activate Subtask Specialist - Granular Task Management

**Purpose**: Activates the Subtask specialist for breaking down complex tasks into manageable components.

**Core Capabilities**:
- Task decomposition
- Dependency mapping
- Effort estimation
- Subtask prioritization
- Progress tracking
- Resource allocation

**What it does**:
1. Loads task breakdown structures
2. Initializes dependency tracking
3. Sets up estimation frameworks
4. Enables progress monitoring
5. Activates resource planning

**Options**:
- `--complexity=simple|moderate|complex` - Task complexity
- `--granularity=high|medium|low` - Breakdown detail
- `--dependencies=true|false` - Track dependencies
- `--estimates=hours|points|days` - Estimation unit

**Suggested Use Cases**:
- Epic breakdown
- Complex feature decomposition
- Sprint planning support
- Resource planning
- Timeline estimation

**Example Usage**:
```bash
# Basic activation
/subtask

# Complex task breakdown
/subtask --complexity=complex --dependencies=true

# Sprint planning support
/subtask --granularity=high --estimates=hours
```

---

## 🎯 Persona Selection Guide

### By Project Phase

**Discovery & Research**:
- Primary: `/analyst`
- Support: `/pm`, `/architect`

**Planning & Design**:
- Primary: `/pm`, `/architect`
- Support: `/design-architect`, `/po`

**Implementation**:
- Primary: `/dev`, `/po`
- Support: `/sm`, `/qa`

**Testing & Validation**:
- Primary: `/qa`
- Support: `/dev`, `/po`

**Delivery & Maintenance**:
- Primary: `/sm`, `/po`
- Support: `/dev`, `/qa`

### By Task Type

**Requirements**: `/analyst` → `/pm`
**Architecture**: `/architect` → `/design-architect`
**Backlog**: `/po` → `/sm`
**Coding**: `/dev`
**Testing**: `/qa`
**Process**: `/sm`

---

## 📊 Persona Performance Metrics

| Persona | Activation Time | Specialized Tools | Parallel Capabilities |
|---------|----------------|-------------------|----------------------|
| Analyst | 1.2s | 12 | 4 parallel commands |
| PM | 1.5s | 15 | 3 parallel commands |
| Architect | 1.8s | 18 | 2 parallel commands |
| Design Architect | 1.6s | 14 | 2 parallel commands |
| PO | 1.3s | 16 | 5 parallel commands |
| SM | 1.1s | 11 | 4 parallel commands |
| Developer | 1.4s | 20 | 1 parallel (sprint) |
| QA | 1.7s | 22 | 6 parallel commands |
| Subtask | 0.9s | 8 | None |

---

## 💡 Best Practices

### Persona Activation
1. Always document reason for persona switch
2. Complete current work before switching
3. Use handoff notes for context transfer
4. Leverage parallel commands for speed

### Workflow Optimization
1. Follow natural phase progression
2. Use specialized personas for domain tasks
3. Combine personas for comprehensive coverage
4. Document decisions in session notes

### Team Collaboration
1. Clear handoffs between personas
2. Maintain consistent documentation
3. Use standard templates per persona
4. Track progress in backlog

---

## 🔗 Related Documentation

- [Orchestrator Commands](./APM-COMMANDS-01-ORCHESTRATOR.md)
- [Parallel Commands](./APM-COMMANDS-03-PARALLEL.md)
- [Project Management](./APM-COMMANDS-05-PROJECT-MANAGEMENT.md)
- [QA Framework](./APM-COMMANDS-04-QA-FRAMEWORK.md)

---

*APM Persona Activation Commands - v4.0.0*
*Native Sub-Agent Architecture*