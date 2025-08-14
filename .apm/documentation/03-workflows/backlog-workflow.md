# Backlog Workflow - Project Tracking & Progress Management

## Overview

The backlog workflow ensures systematic tracking of all project work, from epic planning through story completion. This workflow integrates with all APM personas to maintain accurate, real-time project status and progress tracking.

## 🎯 Backlog Management Philosophy

### Core Principles
1. **Single Source of Truth**: backlog.md is the authoritative project status
2. **Continuous Updates**: Status reflects real-time work progress
3. **Acceptance Criteria Driven**: Stories completed only when all criteria met
4. **Transparent Progress**: All stakeholders can see current project status
5. **Data-Driven Decisions**: Velocity and progress metrics guide planning

### Backlog Hierarchy
```
📋 PROJECT BACKLOG
├── 🌟 EPICS (Large features, 2-8 weeks)
│   ├── 📖 USER STORIES (1-5 days each)
│   │   ├── ✅ ACCEPTANCE CRITERIA (Specific requirements)
│   │   ├── 📊 STORY POINTS (Complexity estimate)  
│   │   └── 🏷️ STATUS (Ready, In Progress, Done, Blocked)
│   └── 🎯 EPIC PROGRESS (% completion based on story completion)
└── 📈 PROJECT METRICS (Velocity, burndown, capacity)
```

## 📋 Backlog.md Structure & Standards

### Standard Backlog Format
```markdown
# Project Backlog - [Project Name]

## Project Overview
- **Project Goal**: [Clear statement of project objective]
- **Success Criteria**: [How we measure project success]
- **Timeline**: [Overall project timeline]
- **Team**: [Team members and roles]

## Sprint Information
### Current Sprint: Sprint [X] (YYYY-MM-DD to YYYY-MM-DD)
- **Sprint Goal**: [Primary objective for this sprint]
- **Team Capacity**: [Total story points available]
- **Committed Points**: [Story points committed to sprint]
- **Completed Points**: [Story points completed so far]

### Sprint Backlog
[Stories assigned to current sprint with status]

## Epic Progress Summary
| Epic | Stories | Completed | Progress | Priority |
|------|---------|-----------|----------|----------|
| User Management | 8 | 6 | 75% | High |
| Payment Processing | 5 | 2 | 40% | High |
| Reporting Dashboard | 6 | 0 | 0% | Medium |

## Detailed Epic & Story Tracking

### EPIC: [Epic Name] (Priority: High/Medium/Low)
**Epic Goal**: [What this epic accomplishes]
**Business Value**: [Why this epic matters]
**Acceptance Criteria**: [Epic-level completion criteria]
**Progress**: [X/Y stories complete] - [%] complete
**Status**: [Not Started/In Progress/Done/Blocked]

#### Story: [Story Title] (Priority: High/Medium/Low)
**As a** [user type] **I want** [functionality] **so that** [benefit]
**Story Points**: [1/2/3/5/8/13] **Status**: [Ready/In Progress/Done/Blocked]
**Assigned to**: [Developer name] **Sprint**: [Sprint number]
**Progress**: [% complete based on acceptance criteria]

**Acceptance Criteria**:
- [ ] [Specific, testable requirement 1]
- [ ] [Specific, testable requirement 2] 
- [ ] [Specific, testable requirement 3]

**Definition of Done**:
- [ ] Code implemented and reviewed
- [ ] Unit tests written and passing
- [ ] Integration tests passing
- [ ] Documentation updated
- [ ] QA validation complete

**Notes & Updates**:
- **[YYYY-MM-DD HH:MM] - [Persona]**: [Update description]

---

## Velocity & Metrics Tracking

### Historical Velocity
| Sprint | Committed | Completed | Velocity | Team Notes |
|--------|-----------|-----------|----------|------------|
| Sprint 1 | 21 | 18 | 18 | Learning curve |
| Sprint 2 | 20 | 22 | 22 | Good rhythm |
| Sprint 3 | 24 | 20 | 20 | Blocked on integration |

### Current Metrics
- **Average Velocity**: [X story points per sprint]
- **Completion Rate**: [X% of committed stories completed]
- **Defect Rate**: [X defects per story point]
- **Cycle Time**: [Average days from start to done]

## Backlog Health Indicators
- **Ready Stories**: [X stories ready for next sprint]
- **Blocked Stories**: [X stories currently blocked]
- **Technical Debt**: [Estimated story points of technical debt]
- **Risk Items**: [High-risk stories or dependencies]
```

### Backlog Update Triggers

**🔴 MANDATORY UPDATES - Update backlog.md immediately when:**
- ✅ Story status changes (Ready → In Progress → Done)
- ✅ Acceptance criteria are completed (check off individual criteria)  
- ✅ Epic progress updates (story completion affects epic progress)
- ✅ Sprint assignments or capacity changes
- ✅ Dependencies discovered, resolved, or changed
- ✅ Story points estimates updated
- ✅ Blockers identified or resolved
- ✅ Any work item creation, modification, or deletion

**📊 PROGRESS TRACKING - Track and update:**
- ✅ Story progress percentage based on acceptance criteria completion
- ✅ Epic progress percentage based on story completion
- ✅ Sprint burndown based on completed story points
- ✅ Team velocity based on completed stories per sprint

## 🔄 Persona-Specific Backlog Responsibilities

### Product Owner (PO) - Primary Backlog Owner
**Daily Responsibilities:**
- Review and update backlog status (morning and evening)
- Groom upcoming stories for readiness
- Prioritize stories based on business value
- Work with stakeholders on requirement clarification
- Run `/groom` command weekly for comprehensive backlog analysis

**Update Pattern:**
```markdown
**[YYYY-MM-DD HH:MM] - PO**: [Backlog management action]
Action: Groomed Sprint 4 stories, updated priorities based on stakeholder feedback
Stories Affected: USER-001, USER-003, PAY-002
Metrics: Team velocity holding steady at 22 points/sprint
Health: 2 sprints of ready stories available, no critical blockers
```

### Developer - Story Progress Updates
**During Development:**
- Update story status when starting work (Ready → In Progress)
- Check off acceptance criteria as completed during development
- Update story progress percentage based on completion
- Note any technical decisions or architectural choices
- Update Definition of Done checklist items

**Update Pattern:**
```markdown
**[YYYY-MM-DD HH:MM] - Developer**: Story USER-001 progress update
Progress: 60% complete (3/5 acceptance criteria done)
Completed: User registration form, validation logic
Next: Email verification and password reset
Technical Notes: Using JWT for session management, bcrypt for passwords
Blockers: None currently
```

### QA - Testing and Validation Updates
**During Testing:**
- Update story status during testing phases
- Mark acceptance criteria as validated
- Note any defects found and resolution
- Update Definition of Done testing items
- Validate epic completion when all stories are done

**Update Pattern:**
```markdown
**[YYYY-MM-DD HH:MM] - QA**: Story USER-001 testing complete
Test Results: All acceptance criteria validated
Test Coverage: 95% code coverage achieved
Defects: 1 minor UI issue found and fixed
Status: Ready for production deployment
Epic Impact: Epic USER now 75% complete (6/8 stories done)
```

### Architect - Technical Design Updates
**During Architecture Work:**
- Update stories with technical design decisions
- Note any changes to story scope based on technical constraints
- Update dependencies between stories
- Document technical debt or future architecture improvements

**Update Pattern:**
```markdown
**[YYYY-MM-DD HH:MM] - Architect**: Technical design update for Epic PAY
Architecture Decision: Using Stripe for payment processing
Story Impact: Reduced complexity of PAY-001, PAY-002 (8pts → 5pts each)
Dependencies: PAY-003 now depends on Stripe webhook implementation
Tech Debt: Need to refactor existing payment validation in future sprint
```

### Project Manager (PM) - Sprint and Capacity Management
**Sprint Management:**
- Update sprint assignments and capacity
- Track velocity and completion rates
- Manage dependencies and resolve blockers
- Report on overall project progress

**Update Pattern:**
```markdown
**[YYYY-MM-DD HH:MM] - PM**: Sprint 3 planning complete
Sprint Goal: Complete user authentication and begin payment integration
Capacity: 24 story points (6 developers × 4 points average)
Committed: 22 story points (buffer for unknown work)
Risk: Payment integration dependency on legal approval
Mitigation: Parallel work on other epics if payment blocked
```

## 🎪 Backlog Workflow Patterns

### Pattern 1: Epic Planning & Breakdown
```
/po → Epic creation → /architect → Technical analysis → /parallel-stories → Story breakdown
```

**Process:**
1. **Epic Creation**: Product Owner defines epic with business value
2. **Technical Analysis**: Architect reviews technical approach and constraints
3. **Story Breakdown**: Collaborative breakdown into manageable user stories
4. **Story Grooming**: Refinement of stories with acceptance criteria
5. **Estimation**: Team estimates story points for each story

### Pattern 2: Sprint Planning & Execution
```
/pm → Sprint planning → /groom → Story refinement → /parallel-sprint → Execution
```

**Process:**
1. **Capacity Planning**: Determine team capacity for sprint
2. **Story Selection**: Choose stories based on priority and capacity  
3. **Sprint Commitment**: Team commits to specific stories
4. **Parallel Execution**: Multiple developers work on stories simultaneously
5. **Progress Tracking**: Continuous updates to backlog status

### Pattern 3: Continuous Grooming & Refinement
```
Weekly: /groom → Backlog analysis → Story refinement → /prioritization → Updated priorities
```

**Process:**
1. **Backlog Health Check**: Review overall backlog health indicators
2. **Story Refinement**: Update stories based on new information
3. **Priority Adjustment**: Re-prioritize based on business changes
4. **Capacity Planning**: Ensure enough ready stories for upcoming sprints
5. **Risk Assessment**: Identify and plan for high-risk items

## 🚨 Critical Backlog Management Rules

### Rule 1: Story Completion Definition
**A story is only "Done" when:**
- ✅ ALL acceptance criteria are checked off as complete
- ✅ ALL Definition of Done items are completed  
- ✅ Code is reviewed, tested, and deployed
- ✅ Business stakeholder has validated functionality
- ✅ Documentation is updated

### Rule 2: Epic Progress Calculation
**Epic progress is calculated as:**
- **Completion Percentage**: (Completed Stories / Total Stories) × 100
- **Story Point Percentage**: (Completed Points / Total Points) × 100
- Use story point percentage for more accurate progress tracking

### Rule 3: Sprint Health Monitoring
**Sprint health indicators:**
- **Green**: On track to complete 90%+ of committed stories
- **Yellow**: May complete 70-89% of committed stories
- **Red**: Likely to complete <70% of committed stories

### Rule 4: Backlog Currency Requirement
**Backlog must be updated:**
- ✅ Within 4 hours of any story status change
- ✅ Daily during active development
- ✅ Immediately after sprint ceremonies
- ✅ Before any stakeholder or management reporting

## 📊 Backlog Analytics & Insights

### Velocity Tracking
```markdown
### Velocity Analysis
- **3-Sprint Average**: 21 story points per sprint
- **Trend**: Increasing (+2 points per sprint)
- **Predictability**: 85% accuracy (completed vs. committed)
- **Capacity Utilization**: 92% (good utilization without overcommitment)
```

### Completion Pattern Analysis
```markdown
### Story Completion Patterns  
- **Average Cycle Time**: 3.2 days per story
- **Completion Rate**: 89% (stories completed vs. started)
- **Defect Rate**: 0.8 defects per story (below 1.0 target)
- **Rework Rate**: 12% (acceptable, target <15%)
```

### Backlog Health Metrics
```markdown
### Backlog Health Dashboard
- **Ready Stories**: 2.5 sprints worth (target: 2-3 sprints)
- **Blocked Stories**: 2 stories (target: <3 stories)
- **Technical Debt**: 15% of total backlog (target: <20%)
- **Requirements Clarity**: 95% of next sprint stories fully defined
```

## 🛠️ APM Commands for Backlog Management

### Primary Backlog Commands

#### `/groom` - Comprehensive Backlog Analysis
**Purpose**: Complete backlog health assessment and grooming
**Frequency**: Weekly
**Output**: Updated backlog.md with health metrics and recommendations

#### `/groom-backlog-task` - Specific Story Grooming  
**Purpose**: Detailed analysis and refinement of specific stories
**Use Case**: When stories need deeper analysis or clarification
**Output**: Refined story with clear acceptance criteria

#### `/prioritization` - Strategic Priority Assessment
**Purpose**: Re-evaluate and adjust story priorities based on business changes
**Frequency**: Bi-weekly or when business priorities change
**Output**: Updated priority rankings with justification

### Supporting Commands

#### `/stakeholder-review` - Business Validation
**Purpose**: Review backlog items with business stakeholders
**Use Case**: Epic completion, major milestone reviews
**Output**: Stakeholder feedback and approval documentation

#### `/parallel-stories` - Multi-Story Development
**Purpose**: Develop multiple stories simultaneously  
**Performance**: 3-5x speedup for related stories
**Output**: Parallel progress on multiple backlog items

#### `/next-story` - Intelligent Story Selection
**Purpose**: AI-powered recommendation for next story to work on
**Factors**: Priority, dependencies, developer skills, capacity
**Output**: Optimal story selection with justification

## 🚨 Common Backlog Anti-Patterns

### ❌ Anti-Pattern 1: Status Lag
**Problem**: Backlog status doesn't reflect actual work progress
**Impact**: Inaccurate reporting, poor planning decisions
**Solution**: Real-time updates, mandatory update triggers

### ❌ Anti-Pattern 2: Acceptance Criteria Neglect
**Problem**: Stories marked "Done" with incomplete acceptance criteria
**Impact**: Incomplete features, technical debt, user dissatisfaction
**Solution**: Strict completion definition, QA validation

### ❌ Anti-Pattern 3: Epic Scope Creep
**Problem**: Epics grow beyond original scope without recognition
**Impact**: Timeline delays, resource overallocation
**Solution**: Regular epic review, scope change documentation

### ❌ Anti-Pattern 4: Velocity Gaming
**Problem**: Manipulating story points to show higher velocity
**Impact**: Inaccurate planning, unrealistic expectations
**Solution**: Consistent estimation practices, velocity trend analysis

## ✅ Backlog Management Best Practices

### Practice 1: Continuous Grooming
- **Weekly Grooming Sessions**: Regular backlog health assessment
- **Just-in-Time Refinement**: Refine stories 1-2 sprints before development
- **Stakeholder Involvement**: Include business stakeholders in grooming
- **Technical Review**: Include technical team in story refinement

### Practice 2: Data-Driven Planning
- **Historical Velocity**: Use past performance for future planning
- **Completion Patterns**: Analyze what types of stories are completed successfully
- **Risk Assessment**: Factor risk into story point estimates
- **Capacity Planning**: Plan for team member availability and skills

### Practice 3: Transparent Communication
- **Real-Time Status**: Backlog reflects current state at all times
- **Regular Reporting**: Consistent reporting to stakeholders
- **Issue Escalation**: Clear escalation path for blockers
- **Success Celebration**: Recognize and celebrate epic completions

## 📚 Integration with Other Workflows

### Integration with Session Management
- **Session Notes**: Link session work to specific backlog items
- **Progress Documentation**: Document story progress in session notes
- **Context Preservation**: Maintain context between development sessions

### Integration with Parallel Development
- **Multi-Story Sprints**: Use parallel development for related stories
- **Epic Coordination**: Coordinate parallel work across epic stories
- **Dependency Management**: Manage dependencies in parallel development

### Integration with Team Collaboration
- **Multi-User Updates**: Multiple team members updating same backlog
- **Communication Protocols**: Clear communication about backlog changes
- **Conflict Resolution**: Process for resolving conflicting updates

## 📚 Related Documentation

- **[Session Management](session-management.md)** - Linking work sessions to backlog items
- **[Team Collaboration](team-collaboration.md)** - Multi-user backlog management
- **[Parallel Development](parallel-development.md)** - Accelerating backlog completion
- **[Typical Project Flow](typical-project-flow.md)** - Backlog role in project lifecycle

---

*Maintain accurate, real-time project tracking through disciplined backlog management and continuous progress updates.*