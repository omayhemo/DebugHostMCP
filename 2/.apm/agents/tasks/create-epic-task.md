# Epic Creation Prompt for AP Product Manager

## Instructions
Use this prompt template to create comprehensive epics for the AP product. Fill in the bracketed sections with specific information relevant to your epic.

### Template Location
The epic template is available at: `@/epic-tmpl.md`

### Important Prerequisites
Before creating an epic, you MUST:
1. **Use the epic template** at `@/epic-tmpl.md` as your starting point
2. **Review the Product Requirements Document (PRD)** at `@/mnt/c/Code/MCPServers/DebugHostMCP/project_docs/base/prd.md` to ensure alignment with overall product vision and requirements
3. **Review existing documentation** in `@/mnt/c/Code/MCPServers/DebugHostMCP/project_docs/` including:
   - `/mnt/c/Code/MCPServers/DebugHostMCP/project_docs/planning/epics/` - Check existing epics to avoid duplication and ensure consistency
   - `/mnt/c/Code/MCPServers/DebugHostMCP/project_docs/planning/stories/` - Understand the story format and numbering conventions
   - `/base/` - Review architecture, development workflow, and technical standards

This ensures your epic aligns with the product strategy and maintains consistency with existing work.

---

## Epic Creation Request

**Create a detailed epic for the AP product with the following specifications:**

### Epic Overview
- **Epic Title:** [Provide a clear, descriptive title that captures the essence of the feature/initiative]
- **Epic ID:** [EPIC-XXX] *(Check @/mnt/c/Code/MCPServers/DebugHostMCP/project_docs/planning/epics/ for next available number)*
- **Product Area:** [Specify which area of AP this impacts] *(Align with PRD product areas)*
- **Target Release:** [Quarter/Year or specific version]
- **Priority:** [P1 - Must Have / P2 - Should Have / P3 - Nice to Have]
- **Epic Type:** [Feature Development/Technical Debt/Infrastructure/Research]

### Business Context
**Problem Statement:**
[Describe the problem this epic aims to solve. What pain points exist for users or the business?]

**Business Value:**
[Explain the expected business impact, including metrics like revenue, user satisfaction, efficiency gains, etc.]

**Target Users:**
[Identify primary and secondary user personas who will benefit from this epic]

### Epic Details
**Description:**
[Provide a comprehensive description of what this epic will deliver. Include:
- High-level functionality
- Key features and capabilities
- Integration points with existing AP features
- Any constraints or limitations]

**Success Criteria:**
[List 3-5 measurable success criteria that indicate when this epic is complete]
1. 
2. 
3. 

**Acceptance Criteria:**
[Define specific, testable criteria that must be met for the epic to be considered done]
- [ ] 
- [ ] 
- [ ] 

### Technical Considerations
**Architecture Impact:**
[Describe any architectural changes or considerations - review @/mnt/c/Code/MCPServers/DebugHostMCP/project_docs/base/architecture.md and frontend-architecture.md for alignment]

**Dependencies:**
- **Internal Dependencies:** [List other AP components or features this depends on]
- **External Dependencies:** [List third-party services, APIs, or systems required]

**Technical Risks:**
[Identify potential technical challenges or risks]

### User Stories

#### Priority 1 (Must Have)
- [ ] [STORY-XXX](../stories/STORY-XXX-story-name.md): [Story title - critical functionality]
- [ ] [STORY-XXX](../stories/STORY-XXX-story-name.md): [Story title - core features]
- [ ] [STORY-XXX](../stories/STORY-XXX-story-name.md): [Story title - essential requirements]
[Add more Must Have stories - these are non-negotiable for the epic to be considered complete]

#### Priority 2 (Should Have)
- [ ] [STORY-XXX](../stories/STORY-XXX-story-name.md): [Story title - important features]
- [ ] [STORY-XXX](../stories/STORY-XXX-story-name.md): [Story title - significant value adds]
- [ ] [STORY-XXX](../stories/STORY-XXX-story-name.md): [Story title - high-value enhancements]
[Add more Should Have stories - these add significant value but epic could launch without them]

#### Priority 3 (Nice to Have)
- [ ] [STORY-XXX](../stories/STORY-XXX-story-name.md): [Story title - desirable features]
- [ ] [STORY-XXX](../stories/STORY-XXX-story-name.md): [Story title - future enhancements]
- [ ] [STORY-XXX](../stories/STORY-XXX-story-name.md): [Story title - polish items]
[Add more Nice to Have stories - these would be great additions if time/resources permit]

### Scope and Constraints
**In Scope:**
- [List what IS included in this epic]

**Out of Scope:**
- [List what is NOT included in this epic]

**Constraints:**
- Budget: [If applicable]
- Timeline: [Specific deadlines or time constraints]
- Resources: [Team or resource limitations]
- Technical: [Platform, performance, or compatibility requirements]

### Stakeholders
**Primary Stakeholders:**
- Product Owner: [Name]
- Engineering Lead: [Name]
- Design Lead: [Name]
- Business Sponsor: [Name]

**Consulted/Informed:**
- [List other stakeholders who need to be kept informed]

### Metrics and KPIs
**Key Metrics to Track:**
1. [Metric 1 - e.g., User adoption rate]
2. [Metric 2 - e.g., Performance improvement]
3. [Metric 3 - e.g., Error rate reduction]

**Baseline Measurements:**
[Current state of these metrics before epic implementation]

### Timeline and Milestones
**Estimated Duration:** [X weeks/months]

**Key Milestones:**
1. [Milestone 1] - [Target Date]
2. [Milestone 2] - [Target Date]
3. [Milestone 3] - [Target Date]

### Additional Notes
**Open Questions:**
- [List any unresolved questions that need answers]

**Assumptions:**
- [List assumptions being made in the epic planning]

**Related Epics/Features:**
- [Link to related work or dependent epics from @/mnt/c/Code/MCPServers/DebugHostMCP/project_docs/planning/epics/]
- [Reference relevant sections from @/mnt/c/Code/MCPServers/DebugHostMCP/project_docs/base/prd.md]

---

## Output Format Instructions

Please generate the epic in the following format:
1. Use clear headings and subheadings
2. Include all sections listed above
3. Write in clear, concise language
4. Focus on outcomes and value delivery
5. Ensure all acceptance criteria are testable
6. Include specific metrics where possible
7. Format as a structured document suitable for Jira, Azure DevOps, or similar tools
8. Organize user stories by priority:
   - **Priority 1 (Must Have)**: Core functionality required for epic completion
   - **Priority 2 (Should Have)**: Important features that add significant value
   - **Priority 3 (Nice to Have)**: Desirable enhancements if resources permit

## Example Usage

To use this prompt, replace all bracketed placeholders with your specific information. For example:
- Replace "[Provide a clear, descriptive title...]" with "User Authentication System Redesign"
- Replace "[user type]" with "registered user" or "admin"
- Replace "[Quarter/Year]" with "Q2 2024"

This will generate a comprehensive epic document ready for review and implementation.

## Template Reference

For a complete epic template with all sections properly formatted, see:
`@/epic-tmpl.md`

This template includes:
- Comprehensive epic structure matching existing project epics
- RACI matrix for stakeholder management
- Sprint allocation planning
- Detailed risk assessment format
- Complete metrics and KPI tracking
- All sections required for a production-ready epic