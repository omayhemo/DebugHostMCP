==================== START: execute-quality-review ====================
# Execute Quality Review Task

## Purpose

To conduct systematic quality reviews of project artifacts, code implementations, and deliverables to ensure they meet defined quality standards and requirements before progression to the next phase.

## Inputs for this Task

- Artifact to be reviewed (PRD, Architecture, Code, Documentation, etc.)
- Relevant quality standards and checklists
- Original requirements and acceptance criteria
- Previous review feedback and resolution status
- Quality gates and criteria for the review

## Task Execution Instructions

### 1. Pre-Review Preparation

- **Identify Review Scope:**
  - Specific artifact(s) or deliverable(s) to review
  - Review objectives and success criteria
  - Quality standards and guidelines to apply
  - Stakeholders who need review results
- **Gather Review Materials:**
  - Current version of artifact(s) being reviewed
  - Relevant requirements, specifications, and standards
  - Previous review findings and resolution status
  - Applicable checklists and quality criteria
- **Set Review Context:**
  - Understand the artifact's purpose and intended audience
  - Review any constraints or special considerations
  - Identify critical quality aspects for this artifact type
  - Plan review approach and time allocation

### 2. Conduct Systematic Review

#### For Requirements Documents (PRD, User Stories)
- **Completeness Assessment:**
  - [ ] All required sections present and populated
  - [ ] No missing or undefined requirements
  - [ ] Acceptance criteria comprehensive and testable
  - [ ] Non-functional requirements specified
- **Quality Evaluation:**
  - [ ] Requirements are clear and unambiguous
  - [ ] Consistent terminology used throughout
  - [ ] No conflicting or contradictory statements
  - [ ] Appropriate level of detail for intended audience
- **Testability Review:**
  - [ ] All requirements can be objectively verified
  - [ ] Success criteria are measurable and specific
  - [ ] Edge cases and error scenarios considered
  - [ ] Dependencies and constraints identified

#### For Architecture Documents
- **Technical Completeness:**
  - [ ] All system components and interactions documented
  - [ ] Technology choices justified and appropriate
  - [ ] Integration points and data flows specified
  - [ ] Security and performance considerations addressed
- **Quality Assessment:**
  - [ ] Architecture supports all functional requirements
  - [ ] Non-functional requirements addressed adequately
  - [ ] Scalability and maintainability considered
  - [ ] Risk mitigation strategies included
- **Implementation Readiness:**
  - [ ] Sufficient detail for development planning
  - [ ] Clear guidance for technology implementation
  - [ ] Component interfaces well-defined
  - [ ] Development and deployment considerations covered

#### For Code Implementations
- **Functional Correctness:**
  - [ ] Code implements all required functionality
  - [ ] Business logic aligns with requirements
  - [ ] Error handling is comprehensive and appropriate
  - [ ] Edge cases are properly addressed
- **Code Quality Standards:**
  - [ ] Follows established coding standards and conventions
  - [ ] Code is readable and well-documented
  - [ ] Appropriate use of design patterns and best practices
  - [ ] No code smells or anti-patterns present
- **Testing Coverage:**
  - [ ] Unit tests cover all critical functionality
  - [ ] Test coverage meets established thresholds
  - [ ] Integration tests validate component interactions
  - [ ] Test cases cover both positive and negative scenarios

#### For User Interface Implementations
- **Functional Requirements:**
  - [ ] UI implements all specified functionality
  - [ ] User workflows function as designed
  - [ ] Form validation and error handling work correctly
  - [ ] Navigation and interaction patterns are consistent
- **Design Compliance:**
  - [ ] Visual design matches approved specifications
  - [ ] Responsive design works across target devices
  - [ ] Accessibility standards are met (WCAG compliance)
  - [ ] Performance meets established benchmarks
- **User Experience:**
  - [ ] Intuitive and user-friendly interface
  - [ ] Consistent interaction patterns throughout
  - [ ] Appropriate feedback and error messaging
  - [ ] Loading states and transitions are smooth

### 3. Document Review Findings

- **Categorize Issues:**
  - **Critical:** Blocking issues that prevent acceptance
  - **Major:** Significant issues that impact quality or functionality
  - **Minor:** Cosmetic or low-impact issues
  - **Enhancement:** Suggestions for improvement
- **Create Detailed Findings:**
  ```
  Finding ID: QR_[ArtifactType]_[Number]
  Category: [Critical/Major/Minor/Enhancement]
  Title: [Brief description of issue]
  Description: [Detailed explanation of the problem]
  Location: [Specific location in artifact/code]
  Impact: [Potential consequences if not addressed]
  Recommendation: [Suggested resolution approach]
  Priority: [High/Medium/Low]
  ```
- **Provide Evidence:**
  - Screenshots or code snippets demonstrating issues
  - References to violated standards or requirements
  - Specific examples and test cases that fail
  - Comparative analysis with requirements or standards

### 4. Assess Overall Quality

- **Quality Metrics Evaluation:**
  - Calculate quality scores based on defined criteria
  - Compare against established quality thresholds
  - Identify trends and patterns in findings
  - Assess progress since previous reviews
- **Risk Assessment:**
  - Evaluate quality risks and their potential impact
  - Identify areas requiring additional attention
  - Assess readiness for next development phase
  - Recommend risk mitigation strategies
- **Compliance Verification:**
  - Verify adherence to coding standards and guidelines
  - Check compliance with accessibility and security requirements
  - Validate alignment with architectural principles
  - Confirm requirement traceability and coverage

### 5. Communicate Review Results

- **Executive Summary:**
  - Overall quality assessment and recommendation
  - Key findings and their implications
  - Critical issues requiring immediate attention
  - Quality trends and improvement areas
- **Detailed Findings Report:**
  - Complete list of findings with categorization
  - Specific recommendations for each issue
  - Timeline and priority for resolution
  - Resource requirements for addressing findings
- **Stakeholder Communication:**
  - Present findings to relevant team members
  - Facilitate discussion of critical issues
  - Collaborate on resolution planning and prioritization
  - Schedule follow-up reviews as needed

### 6. Track Resolution & Follow-up

- **Issue Tracking:**
  - Create tracking entries for all identified issues
  - Assign ownership and target resolution dates
  - Monitor progress on issue resolution
  - Verify fixes and validate improvements
- **Re-review Process:**
  - Schedule follow-up reviews for critical findings
  - Validate that fixes address the root causes
  - Ensure new changes don't introduce regression issues
  - Update quality metrics and trends
- **Continuous Improvement:**
  - Identify patterns in review findings
  - Recommend process improvements to prevent similar issues
  - Update quality standards and checklists based on learnings
  - Share best practices and lessons learned with team

## Quality Review Checklists

### Universal Quality Criteria
- [ ] **Completeness:** All required elements present
- [ ] **Correctness:** Accurate and error-free content
- [ ] **Consistency:** Uniform style and approach throughout
- [ ] **Clarity:** Clear and understandable to intended audience
- [ ] **Compliance:** Adheres to established standards and guidelines

### Requirements-Specific Criteria
- [ ] **Testability:** Can be objectively verified
- [ ] **Traceability:** Clear links to business objectives
- [ ] **Feasibility:** Technically and practically achievable
- [ ] **Completeness:** Covers all necessary functionality
- [ ] **Unambiguity:** Clear and specific language

### Code-Specific Criteria
- [ ] **Functionality:** Implements all required features correctly
- [ ] **Maintainability:** Easy to understand and modify
- [ ] **Performance:** Meets established performance benchmarks
- [ ] **Security:** Follows security best practices
- [ ] **Testability:** Well-structured for automated testing

## Output Deliverables

- **Quality Review Report** with findings and recommendations
- **Issue Tracking Matrix** with prioritized action items
- **Quality Metrics Dashboard** showing current status and trends
- **Resolution Plan** with timelines and ownership
- **Updated Quality Standards** based on review learnings
- **Stakeholder Communication** summary and next steps

## Success Criteria

The quality review is complete when:

1. All artifacts have been systematically reviewed against quality criteria
2. Findings are documented with clear categorization and recommendations
3. Critical and major issues have resolution plans with ownership
4. Quality metrics are updated and trends are analyzed
5. Stakeholders understand findings and agree on resolution approach
6. Follow-up review schedule is established for tracking improvements

==================== END: execute-quality-review ====================