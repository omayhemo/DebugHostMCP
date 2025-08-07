# Groom Backlog Task

## Purpose
To create and maintain a comprehensive product backlog that serves as the single source of truth for all planned work, ensuring proper epic-story relationships, accurate progress tracking, and clear prioritization following agile methodologies.

## Prerequisites
- Access to all project documentation
- Understanding of project goals and constraints
- Authority to prioritize work items

## Task Execution Steps

### 1. Gather and Review All Project Documentation

#### 1.1 Core Documents Review
- [ ] Read `/mnt/c/Code/MCPServers/DebugHostMCP/project_docs/requirements/prd.md` - Understand product vision and requirements
- [ ] Read `/mnt/c/Code/MCPServers/DebugHostMCP/project_docs/architecture/architecture.md` - Understand technical constraints and design
- [ ] Read `/mnt/c/Code/MCPServers/DebugHostMCP/project_docs/architecture/frontend-architecture.md` (if exists) - Frontend specific requirements
- [ ] Read `/mnt/c/Code/MCPServers/DebugHostMCP/project_docs/design/uxui-spec.md` (if exists) - Design requirements
- [ ] Read `/mnt/c/Code/MCPServers/DebugHostMCP/project_docs/requirements/project_brief.md` (if exists) - Initial project context
- [ ] Read `/mnt/c/Code/MCPServers/DebugHostMCP/project_docs/planning/operational-guidelines.md` (if exists) - Development standards

#### 1.2 Analyze Documentation for Work Items
- [ ] Extract implied work items from PRD that aren't yet stories
- [ ] Identify technical tasks from architecture documents
- [ ] Note UI/UX implementation requirements
- [ ] List any mentioned dependencies or risks

### 2. Inventory Existing Epics and Stories

#### 2.1 Locate Epic Files
- [ ] Search for all `epic-*.md` files in `/mnt/c/Code/MCPServers/DebugHostMCP/project_docs/epics/`
- [ ] Create a list of all epics with their:
  - Epic ID
  - Title
  - Description
  - Acceptance criteria
  - Priority indicators

#### 2.2 Locate Story Files
- [ ] Search for all `*.story.md` files in `/mnt/c/Code/MCPServers/DebugHostMCP/project_docs/stories/`
- [ ] For each story, note:
  - Story ID
  - Parent epic (if specified)
  - Title and description
  - Acceptance criteria
  - Story points (if estimated)
  - Current status
  - Dependencies

#### 2.3 Identify Orphaned Items
- [ ] List stories without epic assignments
- [ ] List implied work from docs without stories
- [ ] Note any duplicated or conflicting items

### 3. Harmonize Epics and Stories

#### 3.1 Establish Epic-Story Relationships
- [ ] Match each story to its appropriate epic based on:
  - Explicit epic references in story files
  - Functional alignment with epic goals
  - Technical dependencies
- [ ] Create a mapping table of Epic ID → Story IDs

#### 3.2 Validate Coverage
- [ ] Ensure each epic has sufficient stories to meet acceptance criteria
- [ ] Identify gaps where epics need additional stories
- [ ] Flag stories that don't align with any epic for review

#### 3.3 Resolve Inconsistencies
- [ ] Reconcile conflicting priorities between related items
- [ ] Update story dependencies based on technical architecture
- [ ] Ensure story titles and descriptions align with epic goals

### 4. Prioritize the Backlog

#### 4.1 Apply Prioritization Framework
Consider multiple factors:
- **Business Value**: Impact on user/business goals from PRD
- **Technical Dependencies**: Order based on architecture requirements
- **Risk Mitigation**: Address high-risk items early
- **Resource Optimization**: Group related work for efficiency

#### 4.2 Assign Priority Levels
- [ ] Mark items as Critical 🔴, High 🟠, Medium 🟡, Low 🟢, or Backlog ⚪
- [ ] Sequence stories within each epic (1, 2, 3...)
- [ ] Create global priority sequence across all stories

#### 4.3 Validate with Constraints
- [ ] Check technical dependencies are respected
- [ ] Ensure MVP/core features are prioritized appropriately
- [ ] Verify resource availability for high-priority items

### 5. Estimate and Track Progress

#### 5.1 Story Point Estimation
For stories without points:
- [ ] Apply consistent estimation scale (1, 2, 3, 5, 8, 13)
- [ ] Consider: Complexity, Uncertainty, Effort
- [ ] Document estimation rationale for large stories

#### 5.2 Calculate Progress Metrics
For each story:
- [ ] Assign current status (Backlog, Ready, In Progress, In Review, Done, Blocked)
- [ ] Set progress percentage based on status:
  - Backlog: 0%
  - Ready: 0%
  - In Progress: Variable (10-90%)
  - In Review: 90%
  - Done: 100%
  - Blocked: Maintain current %

For each epic:
- [ ] Sum total story points
- [ ] Sum completed story points (Done stories)
- [ ] Calculate epic progress: (Completed Points / Total Points) × 100

### 6. Create/Update the Backlog Document

#### 6.1 Initialize from Template
- [ ] Copy `backlog_tmpl.md` to `/mnt/c/Code/MCPServers/DebugHostMCP/project_docs/backlog/backlog.md`
- [ ] Fill in header information:
  - Project name
  - Current date
  - Product Owner name
  - Current sprint number

#### 6.2 Populate Epic Sections
For each epic (in priority order):
- [ ] Create epic section with all metadata
- [ ] Add epic description and acceptance criteria
- [ ] Insert story table with all child stories
- [ ] Calculate and display epic progress

#### 6.3 Add Supporting Sections
- [ ] List unassigned stories
- [ ] Document blocked items with details
- [ ] Add sprint planning information
- [ ] Include backlog health metrics

#### 6.4 Final Validation
- [ ] Verify all stories are included exactly once
- [ ] Confirm priority sequence is logical
- [ ] Check progress calculations are accurate
- [ ] Ensure dependencies are clearly noted

### 7. Establish Ongoing Maintenance

#### 7.1 Document Decisions
- [ ] Note any prioritization decisions made
- [ ] Record assumptions about story relationships
- [ ] List items needing further clarification

#### 7.2 Set Update Triggers
Document when backlog should be updated:
- [ ] After new story creation
- [ ] When story status changes
- [ ] After sprint planning/review
- [ ] When priorities shift

#### 7.3 Communication Plan
- [ ] Notify team of new backlog location
- [ ] Highlight major changes from previous state
- [ ] Schedule regular backlog review sessions

## Success Criteria

The grooming task is complete when:
1. All known epics and stories are captured in the backlog
2. Every story is linked to an appropriate epic (or marked as unassigned)
3. Clear priority sequence exists for all items
4. Progress metrics accurately reflect current state
5. The backlog document follows the standard template
6. All team members can find and understand the backlog

## Output Artifacts

**Primary Output:**
- `/mnt/c/Code/MCPServers/DebugHostMCP/project_docs/backlog/backlog.md` - The complete, prioritized product backlog

**Supporting Outputs:**
- Updated epic files with corrected relationships
- Updated story files with proper epic assignments
- List of identified gaps or issues requiring resolution

## Tips for Effective Grooming

1. **Regular Cadence**: Groom the backlog at least once per sprint
2. **Collaborative Effort**: Involve architects and developers for technical insights
3. **Living Document**: The backlog should evolve with project understanding
4. **Clear Communication**: Make priority rationale transparent
5. **Manageable Size**: Keep "Ready" stories to 2-3 sprints worth

## Common Pitfalls to Avoid

- Don't create stories without clear acceptance criteria
- Avoid over-detailed stories too far in the future
- Don't ignore technical dependencies when prioritizing
- Resist the urge to work on low-priority items first
- Don't let the backlog grow unbounded - archive old items

## Integration with Other Tasks

- **After**: PRD creation, Architecture definition, Epic creation
- **Before**: Sprint planning, Story implementation
- **Ongoing With**: Story refinement, Progress tracking