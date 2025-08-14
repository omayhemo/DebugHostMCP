# APM Project Management Commands
## Planning, Tracking, and Coordination

The Project Management commands provide comprehensive tools for planning, tracking, and coordinating software development projects using the APM framework.

---

## /project-brief
### Project Initialization and Brief Creation

**Purpose**: Initialize a new project with comprehensive brief documentation capturing vision, goals, and high-level requirements.

**What it does**:
1. Creates project foundation documentation
2. Captures stakeholder vision and goals
3. Defines project scope and constraints
4. Establishes success criteria
5. Identifies key risks and assumptions

**Options**:
- --template=lean|standard|comprehensive - Brief template type
- --stakeholders="list" - Key stakeholder groups
- --timeline=weeks|months|quarters - Project timeline
- --methodology=agile|waterfall|hybrid - Development methodology

**Suggested Use Cases**:
- New project kickoff
- Project charter creation
- Vision alignment
- Stakeholder buy-in
- Initial planning

**Example Usage**:
```bash
# Basic project brief
/project-brief

# Comprehensive brief with timeline
/project-brief --template=comprehensive --timeline=quarters

# Agile project initialization
/project-brief --methodology=agile --template=lean
```

**Output**:
- Project brief document
- Vision statement
- Success criteria
- Risk register
- Stakeholder map

---

## /prd
### Product Requirements Document Creation

**Purpose**: Create comprehensive Product Requirements Documents capturing functional and non-functional requirements.

**What it does**:
1. Documents product requirements
2. Defines user personas and use cases
3. Specifies functional requirements
4. Captures non-functional requirements
5. Creates acceptance criteria

**Options**:
- --format=traditional|lean|agile - PRD format
- --sections="overview,features,requirements" - Include sections
- --detail=high|medium|low - Detail level
- --review=true|false - Include review section

**Parallel Version Available**:
- /parallel-prd - Create PRD 70% faster with parallel section generation

**Suggested Use Cases**:
- Product planning
- Feature documentation
- Requirements baseline
- Stakeholder alignment
- Development guide

**Example Usage**:
```bash
# Standard PRD
/prd

# Lean agile PRD
/prd --format=lean --detail=medium

# Comprehensive traditional PRD
/prd --format=traditional --detail=high --review=true
```

**Output**:
- PRD document
- Requirements matrix
- User personas
- Use cases
- Acceptance criteria

---

## /epic
### Epic Creation and Management

**Purpose**: Create and manage epics with comprehensive story breakdown and planning.

**What it does**:
1. Creates epic structure
2. Breaks down into user stories
3. Defines epic-level acceptance criteria
4. Maps dependencies
5. Estimates effort and timeline

**Options**:
- --stories=5|10|15|20 - Number of stories to generate
- --sizing=t-shirt|points|hours - Estimation method
- --dependencies=true|false - Map dependencies
- --template=standard|detailed - Epic template

**Parallel Version Available**:
- /parallel-epic - Create epics 4.2x faster

**Suggested Use Cases**:
- Feature planning
- Sprint preparation
- Backlog creation
- Capacity planning
- Release scoping

**Example Usage**:
```bash
# Basic epic with 10 stories
/epic --stories=10

# Detailed epic with dependencies
/epic --template=detailed --dependencies=true

# Epic with story points
/epic --stories=15 --sizing=points
```

**Output**:
- Epic document
- User stories
- Story map
- Dependency graph
- Effort estimates

---

## /stories
### User Story Generation

**Purpose**: Generate user stories with consistent format and comprehensive details.

**What it does**:
1. Creates user stories from requirements
2. Formats in standard story syntax
3. Adds acceptance criteria
4. Includes technical notes
5. Assigns story points

**Options**:
- --count=5|10|20|50 - Number of stories
- --format=classic|job|gherkin - Story format
- --persona="user_type" - Target persona
- --acceptance-criteria=basic|detailed - AC detail

**Parallel Version Available**:
- /parallel-stories - Generate stories 5.3x faster

**Suggested Use Cases**:
- Sprint planning
- Backlog population
- Feature breakdown
- Requirements translation
- Team alignment

**Example Usage**:
```bash
# Generate 10 classic user stories
/stories --count=10 --format=classic

# Job stories with detailed AC
/stories --format=job --acceptance-criteria=detailed

# Gherkin format for BDD
/stories --count=20 --format=gherkin
```

**Output**:
- User stories
- Acceptance criteria
- Story points
- Technical notes
- Story cards

---

## /groom
### Backlog Grooming and Refinement

**Purpose**: Groom and refine product backlog for sprint readiness and clarity.

**What it does**:
1. Reviews backlog items for completeness
2. Refines story descriptions
3. Updates acceptance criteria
4. Adjusts priorities
5. Identifies ready stories

**Options**:
- --depth=quick|standard|thorough - Grooming depth
- --ready-definition=strict|standard|relaxed - Ready criteria
- --update-estimates=true|false - Re-estimate stories
- --remove-obsolete=true|false - Clean old items

**Suggested Use Cases**:
- Pre-sprint grooming
- Backlog health check
- Story refinement
- Priority adjustment
- Sprint preparation

**Example Usage**:
```bash
# Standard grooming session
/groom

# Thorough grooming with re-estimation
/groom --depth=thorough --update-estimates=true

# Quick grooming for sprint prep
/groom --depth=quick --ready-definition=standard
```

**Output**:
- Groomed backlog
- Ready stories list
- Refinement notes
- Updated priorities
- Grooming report

---

## /prioritization
### Feature and Story Prioritization

**Purpose**: Prioritize features and stories using various prioritization frameworks.

**What it does**:
1. Applies prioritization frameworks
2. Calculates priority scores
3. Creates priority matrix
4. Generates ranked list
5. Documents rationale

**Options**:
- --method=moscow|rice|kano|value-effort - Framework
- --criteria="value,effort,risk" - Scoring criteria
- --stakeholders="product,tech,users" - Input sources
- --output=matrix|list|report - Output format

**Parallel Version Available**:
- /parallel-prioritization - Multi-criteria prioritization 4.1x faster

**Suggested Use Cases**:
- Release planning
- Sprint planning
- Resource allocation
- Roadmap creation
- Trade-off decisions

**Example Usage**:
```bash
# MoSCoW prioritization
/prioritization --method=moscow

# RICE scoring with matrix output
/prioritization --method=rice --output=matrix

# Value-effort with stakeholder input
/prioritization --method=value-effort --stakeholders="product,tech"
```

**Output**:
- Priority rankings
- Scoring matrix
- Prioritization rationale
- Recommended sequence
- Trade-off analysis

---

## /acceptance-criteria
### Acceptance Criteria Definition

**Purpose**: Define comprehensive acceptance criteria for user stories and features.

**What it does**:
1. Creates testable acceptance criteria
2. Covers functional requirements
3. Includes non-functional criteria
4. Defines edge cases
5. Specifies validation methods

**Options**:
- --format=checklist|gherkin|plain - AC format
- --coverage=basic|standard|comprehensive - Coverage level
- --testability=strict|flexible - Testability requirement
- --stories="S1,S2,S3" - Target stories

**Parallel Version Available**:
- /parallel-acceptance-criteria - Define AC 3.9x faster

**Suggested Use Cases**:
- Story refinement
- Sprint planning
- QA preparation
- Definition of done
- Story validation

**Example Usage**:
```bash
# Basic checklist AC
/acceptance-criteria --format=checklist

# Gherkin format for BDD
/acceptance-criteria --format=gherkin --coverage=comprehensive

# AC for specific stories
/acceptance-criteria --stories="S1.1,S1.2" --testability=strict
```

**Output**:
- Acceptance criteria lists
- Test scenarios
- Validation methods
- Edge cases
- Success conditions

---

## /validation
### Story and Requirement Validation

**Purpose**: Validate stories and requirements for completeness, clarity, and feasibility.

**What it does**:
1. Checks story completeness
2. Validates acceptance criteria
3. Verifies technical feasibility
4. Assesses business value
5. Identifies gaps and issues

**Options**:
- --scope=story|epic|release - Validation scope
- --criteria=all|technical|business - Validation focus
- --depth=quick|standard|deep - Analysis depth
- --fix-issues=true|false - Auto-fix simple issues

**Parallel Version Available**:
- /parallel-validation - Multi-aspect validation 3.6x faster

**Suggested Use Cases**:
- Pre-sprint validation
- Story readiness check
- Quality gates
- Risk assessment
- Compliance verification

**Example Usage**:
```bash
# Validate current sprint stories
/validation --scope=story

# Deep technical validation
/validation --criteria=technical --depth=deep

# Release validation with fixes
/validation --scope=release --fix-issues=true
```

**Output**:
- Validation report
- Issue list
- Recommendations
- Fixed items
- Readiness score

---

## /next-story
### Story Progression and Selection

**Purpose**: Select and prepare the next story for development based on priority and readiness.

**What it does**:
1. Identifies next priority story
2. Checks prerequisites
3. Prepares story for development
4. Assigns to developer
5. Updates story status

**Options**:
- --criteria=priority|value|complexity - Selection criteria
- --assign=auto|manual|team - Assignment method
- --prep=full|quick|none - Preparation level
- --notify=true|false - Team notification

**Parallel Version Available**:
- /parallel-next-story - Process multiple stories

**Suggested Use Cases**:
- Sprint execution
- Daily standup
- Work assignment
- Flow management
- Continuous delivery

**Example Usage**:
```bash
# Get next priority story
/next-story

# Next story by value with auto-assign
/next-story --criteria=value --assign=auto

# Quick prep for urgent story
/next-story --prep=quick --notify=true
```

**Output**:
- Selected story
- Preparation checklist
- Assignment details
- Status update
- Next steps

---

## /checklist
### Task and Process Checklist Generation

**Purpose**: Generate comprehensive checklists for various development tasks and processes.

**What it does**:
1. Creates task-specific checklists
2. Includes validation points
3. Adds quality gates
4. Defines completion criteria
5. Tracks progress

**Options**:
- --type=deployment|release|review|testing - Checklist type
- --detail=basic|standard|comprehensive - Detail level
- --format=markdown|interactive|printable - Output format
- --tracking=true|false - Progress tracking

**Parallel Version Available**:
- /parallel-checklist - Generate checklists 3.4x faster

**Suggested Use Cases**:
- Release preparation
- Deployment validation
- Code review
- Testing cycles
- Process compliance

**Example Usage**:
```bash
# Deployment checklist
/checklist --type=deployment

# Comprehensive release checklist
/checklist --type=release --detail=comprehensive

# Interactive review checklist
/checklist --type=review --format=interactive
```

**Output**:
- Checklist document
- Progress tracker
- Validation points
- Sign-off items
- Completion report

---

## /course-correction
### Agile Adjustments and Pivots

**Purpose**: Plan and execute course corrections when project conditions change.

**What it does**:
1. Analyzes current vs. planned state
2. Identifies deviation causes
3. Proposes corrections
4. Updates plans and timelines
5. Communicates changes

**Options**:
- --trigger=scope|timeline|resource|quality - Correction trigger
- --impact=low|medium|high - Expected impact
- --approach=incremental|pivot|reset - Correction approach
- --communication=team|stakeholder|all - Update audience

**Parallel Version Available**:
- /parallel-course-correction - Multi-dimensional analysis 4.0x faster

**Suggested Use Cases**:
- Sprint adjustments
- Scope changes
- Timeline updates
- Resource reallocation
- Risk mitigation

**Example Usage**:
```bash
# Timeline correction
/course-correction --trigger=timeline

# Major pivot planning
/course-correction --approach=pivot --impact=high

# Incremental scope adjustment
/course-correction --trigger=scope --approach=incremental
```

**Output**:
- Correction plan
- Impact analysis
- Updated timeline
- Communication plan
- Action items

---

## /requirements
### Requirements Gathering and Documentation

**Purpose**: Gather, document, and organize project requirements comprehensively.

**What it does**:
1. Elicits requirements from sources
2. Documents functional requirements
3. Captures non-functional requirements
4. Creates traceability matrix
5. Validates completeness

**Options**:
- --source=stakeholder|document|system - Requirement source
- --type=functional|non-functional|all - Requirement type
- --format=traditional|agile|hybrid - Documentation format
- --validation=true|false - Validate requirements

**Parallel Version Available**:
- /parallel-requirements - Gather from multiple sources 3.8x faster

**Suggested Use Cases**:
- Project initiation
- Feature planning
- System analysis
- Compliance documentation
- Change requests

**Example Usage**:
```bash
# Comprehensive requirements gathering
/requirements

# Functional requirements from stakeholders
/requirements --source=stakeholder --type=functional

# System requirements with validation
/requirements --source=system --validation=true
```

**Output**:
- Requirements document
- Traceability matrix
- Validation report
- Gap analysis
- Sign-off sheet

---

## /stakeholder-review
### Stakeholder Feedback and Review

**Purpose**: Facilitate stakeholder reviews and incorporate feedback systematically.

**What it does**:
1. Prepares review materials
2. Collects stakeholder feedback
3. Analyzes feedback patterns
4. Prioritizes changes
5. Updates documentation

**Options**:
- --stakeholders="product,tech,users" - Review groups
- --format=presentation|document|demo - Review format
- --feedback=structured|open|hybrid - Feedback method
- --incorporation=immediate|planned|evaluated - Change approach

**Parallel Version Available**:
- /parallel-stakeholder-review - Concurrent stakeholder analysis 3.5x faster

**Suggested Use Cases**:
- Sprint reviews
- Release planning
- Feature validation
- Design reviews
- Milestone checkpoints

**Example Usage**:
```bash
# Sprint review with all stakeholders
/stakeholder-review --stakeholders="product,tech,users"

# Document review with structured feedback
/stakeholder-review --format=document --feedback=structured

# Demo with immediate incorporation
/stakeholder-review --format=demo --incorporation=immediate
```

**Output**:
- Review summary
- Feedback analysis
- Action items
- Updated plans
- Stakeholder sign-off

---

## /ux-spec
### UX Specifications and Design Documentation

**Purpose**: Create comprehensive UX specifications and design documentation.

**What it does**:
1. Documents UX requirements
2. Specifies interaction patterns
3. Defines visual guidelines
4. Creates user flows
5. Establishes design system

**Options**:
- --detail=low|medium|high - Specification detail
- --components=all|core|custom - Component coverage
- --flows=true|false - Include user flows
- --accessibility=wcag-a|wcag-aa|wcag-aaa - Accessibility level

**Suggested Use Cases**:
- Design documentation
- Developer handoff
- Design system creation
- Accessibility planning
- UX validation

**Example Usage**:
```bash
# Comprehensive UX specification
/ux-spec --detail=high

# Core components with WCAG-AA
/ux-spec --components=core --accessibility=wcag-aa

# Detailed with user flows
/ux-spec --detail=high --flows=true
```

**Output**:
- UX specification document
- Component library
- User flows
- Interaction patterns
- Design guidelines

---

## /release
### Release Planning and Management

**Purpose**: Plan, coordinate, and manage software releases comprehensively.

**What it does**:
1. Creates release plan
2. Defines release scope
3. Coordinates release activities
4. Manages release checklist
5. Tracks release metrics

**Options**:
- --type=major|minor|patch|hotfix - Release type
- --environment=dev|staging|prod - Target environment
- --strategy=rolling|blue-green|canary - Deployment strategy
- --rollback=auto|manual|none - Rollback plan

**Suggested Use Cases**:
- Release planning
- Deployment coordination
- Version management
- Risk mitigation
- Go-live preparation

**Example Usage**:
```bash
# Major release planning
/release --type=major

# Production canary release
/release --environment=prod --strategy=canary

# Hotfix with auto-rollback
/release --type=hotfix --rollback=auto
```

**Output**:
- Release plan
- Deployment checklist
- Risk assessment
- Rollback plan
- Release notes

---

## Command Performance Metrics

| Command | Execution Time | Parallel Speedup | Typical Output |
|---------|---------------|------------------|----------------|
| /project-brief | 15-20 min | N/A | 3-5 page brief |
| /prd | 45-60 min | 3.5x | 10-15 page PRD |
| /epic | 30-45 min | 4.2x | Epic + 10-20 stories |
| /stories | 20-30 min | 5.3x | 10-50 stories |
| /groom | 25-35 min | N/A | Refined backlog |
| /prioritization | 15-20 min | 4.1x | Priority matrix |
| /acceptance-criteria | 10-15 min | 3.9x | AC for stories |
| /validation | 15-20 min | 3.6x | Validation report |
| /next-story | 5 min | N/A | Ready story |
| /checklist | 10-15 min | 3.4x | Complete checklist |
| /course-correction | 20-30 min | 4.0x | Correction plan |
| /requirements | 30-45 min | 3.8x | Requirements doc |
| /stakeholder-review | 25-35 min | 3.5x | Review summary |
| /ux-spec | 35-45 min | N/A | UX documentation |
| /release | 30-40 min | N/A | Release plan |

---

## Best Practices

### Planning Phase
1. Start with /project-brief for new projects
2. Use /requirements early and comprehensively
3. Create /prd before development starts
4. Break down with /epic and /stories

### Execution Phase
1. Regular /groom sessions (weekly)
2. Use /prioritization for sprint planning
3. Define /acceptance-criteria for all stories
4. Validate with /validation before sprint

### Monitoring Phase
1. Use /next-story for work flow
2. Apply /course-correction when needed
3. Regular /stakeholder-review sessions
4. Track with /checklist completion

### Delivery Phase
1. Plan with /release command
2. Validate with comprehensive checklists
3. Document with /ux-spec updates
4. Gather feedback post-release

---

## Related Commands

- **Development**: /dev, /architecture
- **Testing**: /qa, /test-plan
- **Documentation**: /doc-sharding, /update-all-documentation
- **Orchestration**: /ap, /handoff
- **Parallel Versions**: Most commands have /parallel-* variants

---

*APM Project Management Commands - v4.0.0*
*Comprehensive Planning and Coordination Tools*