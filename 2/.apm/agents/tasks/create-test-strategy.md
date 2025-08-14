==================== START: create-test-strategy ====================
# Create Test Strategy Task

> **Note: Document prerequisites and validation are now automated by Claude Code hooks.** Hooks verify that required documents exist and validate the test strategy structure automatically.

## Automated Support
This task benefits from automated:
- ✅ Prerequisite document validation
- ✅ Test strategy template compliance
- ✅ Quality checklist execution
- ✅ Report generation
- ✅ Handoff documentation

## Purpose

To develop a comprehensive testing strategy that aligns with project requirements, technical architecture, and quality objectives. This strategy serves as the foundation for all testing activities throughout the project lifecycle.

## Inputs for this Task (Automatically Validated)

- Product Requirements Document (PRD) with epics and user stories
- Architecture Document (technical design and system components)
- Frontend Architecture Document (if applicable)
- UI/UX Specifications (if applicable)
- Risk assessment or known technical constraints

## Task Execution Instructions

### 1. Analyze Project Context & Requirements

**Automated validation ensures all required documents are present. Focus on strategic analysis:**

- **Strategic PRD Analysis:**
  - Focus on critical user journeys and business value
  - Identify high-risk functional areas
  - Assess compliance and regulatory impact
  - Prioritize testing based on user impact
- **Architecture Risk Assessment:**
  - Identify complex integration points
  - Assess performance bottlenecks
  - Evaluate security vulnerabilities
  - Plan for scalability testing
- **UI/UX Testing Strategy:**
  - Plan usability testing approaches
  - Define accessibility standards
  - Identify cross-browser/device needs

### 2. Risk Assessment & Prioritization

- **Identify High-Risk Areas:**
  - Critical user journeys that must work flawlessly
  - Complex integrations with external systems
  - Performance-sensitive operations
  - Security-critical components (authentication, payment, data handling)
  - New or unfamiliar technologies in the stack
- **Assess Business Impact:**
  - Revenue-affecting functionality
  - User experience critical paths
  - Regulatory compliance requirements
  - Brand reputation sensitive areas
- **Technical Risk Evaluation:**
  - Complex algorithms or business logic
  - Data migration or transformation processes
  - Scalability and performance bottlenecks
  - Browser/device compatibility challenges

### 3. Define Testing Scope & Approach

- **Functional Testing Strategy:**
  - Unit testing approach and coverage targets
  - Integration testing for component interactions
  - API testing for all endpoints and data contracts
  - End-to-end testing for critical user journeys
  - User acceptance testing criteria and process
- **Non-Functional Testing Strategy:**
  - Performance testing (load, stress, spike, volume)
  - Security testing (authentication, authorization, data protection)
  - Accessibility testing (WCAG compliance level)
  - Compatibility testing (browsers, devices, screen sizes)
  - Usability testing approach and criteria
- **Specialized Testing Needs:**
  - Regression testing strategy for ongoing development
  - Database testing for data integrity and performance
  - Configuration testing for different environments
  - Disaster recovery and backup testing

### 4. Establish Testing Framework & Tools

- **Test Automation Strategy:**
  - Identify automation candidates (repetitive, high-risk, regression-prone)
  - Select appropriate testing tools and frameworks
  - Define automation coverage targets and timelines
  - Plan for test data management and environment setup
- **Manual Testing Approach:**
  - Exploratory testing guidelines and focus areas
  - User acceptance testing process and criteria
  - Usability testing methods and success metrics
  - Cross-browser and device testing matrix
- **Quality Gates & Criteria:**
  - Define entry and exit criteria for each testing phase
  - Establish quality thresholds (code coverage, defect density)
  - Create escalation procedures for quality issues
  - Define sign-off criteria for production readiness

### 5. Resource Planning & Timeline

- **Testing Resource Requirements:**
  - QA team size and skill requirements
  - Developer involvement in testing activities
  - External testing resource needs (performance, security, accessibility)
  - Test environment and infrastructure requirements
- **Testing Timeline & Milestones:**
  - Align testing phases with development sprints
  - Plan for parallel testing activities where possible
  - Schedule critical testing milestones and deliverables
  - Build in buffer time for issue resolution and retesting
- **Test Data & Environment Strategy:**
  - Test data creation and management approach
  - Environment provisioning and maintenance
  - Data privacy and security considerations
  - Refresh and reset procedures

### 6. Create Test Strategy Document

Using the `test-strategy-tmpl` template (found in `qa_templates#test-strategy-tmpl`), create a comprehensive document that includes:

- **Executive Summary:** High-level testing approach and objectives
- **Scope & Objectives:** What will and won't be tested, and why
- **Testing Approach:** Detailed strategy for each type of testing
- **Tools & Environment:** Selected tools, frameworks, and infrastructure
- **Timeline & Resources:** Testing schedule and resource allocation
- **Risk Assessment:** Identified risks and mitigation strategies
- **Quality Criteria:** Success metrics and acceptance criteria
- **Process & Procedures:** Testing workflows and escalation paths

### 7. Validate & Refine Strategy

- **Stakeholder Review:**
  - Present strategy to PM, Architect, and development team
  - Gather feedback on feasibility and completeness
  - Adjust approach based on team capacity and constraints
- **Alignment Check:**
  - Ensure strategy supports all PRD requirements
  - Verify compatibility with technical architecture
  - Confirm resource and timeline feasibility
- **Iteration & Refinement:**
  - Update strategy based on feedback
  - Plan for strategy updates as project evolves
  - Establish review and update cadence

## Output Deliverables

- **Test Strategy Document** (following `test-strategy-tmpl`)
- **Risk Assessment Matrix** with prioritized testing focus areas
- **Testing Timeline** integrated with development milestones
- **Tool & Framework Recommendations** with justification
- **Quality Gates Definition** with specific criteria and thresholds

## Success Criteria

The test strategy is complete when:

1. All functional and non-functional requirements have testing coverage planned
2. High-risk areas are identified with appropriate mitigation strategies
3. Testing approach is feasible within project constraints
4. Quality criteria and success metrics are clearly defined
5. Stakeholders have reviewed and approved the strategy
6. Timeline and resource requirements are realistic and agreed upon

==================== END: create-test-strategy ====================