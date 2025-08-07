# Define Acceptance Criteria Task

## Purpose

To systematically define clear, testable, and comprehensive acceptance criteria that ensure user stories meet business requirements and user needs while providing unambiguous guidance for development and testing teams.

## Inputs for this Task

- User story with defined user, goal, and benefit
- Business requirements and constraints
- User research and feedback (if available)
- Technical constraints and dependencies
- UI/UX mockups or wireframes (if applicable)
- Business rules and logic requirements
- Non-functional requirements (performance, security, etc.)

## Task Execution Instructions

### 1. Story Analysis and Context Understanding

- **Review Story Components:**
  - Analyze the user role and their specific needs
  - Understand the goal/action the user wants to accomplish
  - Clarify the business benefit or value being delivered
  - Identify the scope and boundaries of the story

- **Gather Contextual Information:**
  - Review related user stories and dependencies
  - Understand the user workflow and process context
  - Identify any existing system behaviors that need to be maintained
  - Clarify business rules and constraints that apply

- **Stakeholder Input Collection:**
  - Confirm story understanding with business stakeholders
  - Validate user needs with user representatives
  - Review technical constraints with development team
  - Identify any compliance or regulatory requirements

### 2. Scenario Identification and Mapping

- **Happy Path Scenarios:**
  - Define the main success scenario(s)
  - Identify the optimal user flow
  - Specify expected system behavior for normal conditions
  - Define successful completion criteria

- **Alternative Flow Scenarios:**
  - Identify alternative ways to achieve the goal
  - Define system behavior for different user choices
  - Specify handling of optional features or settings
  - Address different user contexts or environments

- **Error and Edge Case Scenarios:**
  - Identify potential error conditions
  - Define system behavior for invalid inputs
  - Specify handling of system failures or unavailability
  - Address boundary conditions and limits

- **Integration Scenarios:**
  - Define behavior with external systems
  - Specify data exchange requirements
  - Address authentication and authorization scenarios
  - Define fallback behavior for integration failures

### 3. Acceptance Criteria Formulation

- **Use Behavior-Driven Format:**
  - Structure criteria using "Given-When-Then" format
  - **Given:** Initial context, conditions, or state
  - **When:** Action or event that triggers the behavior
  - **Then:** Expected outcome, result, or new state

- **Ensure Criteria Quality:**
  - Make each criterion specific and unambiguous
  - Ensure criteria are testable and verifiable
  - Write from the user's perspective
  - Avoid implementation details
  - Include both functional and user experience aspects

- **Cover All Aspects:**
  - Functional behavior and business logic
  - User interface behavior and feedback
  - Data validation and error handling
  - Performance expectations (where relevant)
  - Security requirements (where applicable)

### 4. Comprehensive Coverage Validation

- **Functional Coverage:**
  - Verify all stated functionality is covered
  - Ensure all user interactions are addressed
  - Confirm all business rules are included
  - Validate data processing requirements are covered

- **User Experience Coverage:**
  - Include user feedback and confirmation messages
  - Specify navigation and workflow elements
  - Address accessibility requirements
  - Define responsive behavior (if applicable)

- **Technical Coverage:**
  - Include performance criteria where relevant
  - Specify security requirements where needed
  - Address integration points and dependencies
  - Include error handling and recovery scenarios

- **Business Coverage:**
  - Ensure compliance requirements are addressed
  - Include audit and logging requirements (if needed)
  - Address business process integration
  - Validate business value delivery

### 5. Criteria Refinement and Validation

- **Review for Quality:**
  - Check for clarity and unambiguous language
  - Ensure each criterion is independently testable
  - Verify criteria are at appropriate level of detail
  - Remove redundant or overlapping criteria

- **Stakeholder Validation:**
  - Review criteria with business stakeholders
  - Validate technical feasibility with development team
  - Confirm testability with QA team
  - Get user representative feedback (if possible)

- **Test Scenario Derivation:**
  - Ensure test scenarios can be directly derived
  - Verify both positive and negative test cases are supported
  - Confirm automation potential where appropriate
  - Validate performance testing requirements

### 6. Documentation and Finalization

- **Format and Structure:**
  - Number criteria for easy reference
  - Group related criteria logically
  - Use consistent language and terminology
  - Ensure proper formatting and readability

- **Integration with Story:**
  - Link criteria to specific story elements
  - Ensure criteria support the stated benefit
  - Verify alignment with story priority and scope
  - Confirm criteria reflect business value

- **Traceability and Links:**
  - Link to business requirements where appropriate
  - Reference design mockups or specifications
  - Connect to dependent stories or epics
  - Include links to business rules or processes

## Success Criteria

The acceptance criteria definition task is complete when:

1. All functional aspects of the user story are covered
2. Happy path, alternative flows, and error scenarios are addressed
3. Criteria are clear, testable, and unambiguous
4. Business rules and constraints are properly reflected
5. User experience requirements are included
6. Technical requirements are appropriately specified
7. Stakeholders have validated and approved the criteria
8. Criteria serve as sufficient guidance for development and testing

## Output Deliverables

- **Primary:** Complete set of acceptance criteria for the user story
- **Supporting:** Stakeholder validation record, Test scenario outline, Business rule references

## Best Practices

### Writing Effective Acceptance Criteria

1. **Be Specific:** Avoid vague terms like "user-friendly" or "fast"
2. **Focus on Outcomes:** Describe what should happen, not how it should be implemented
3. **Include Both Positive and Negative Cases:** Cover success and failure scenarios
4. **Make Them Testable:** Each criterion should be verifiable
5. **Keep User-Focused:** Write from the user's perspective and experience

### Common Pitfalls to Avoid

1. **Implementation Details:** Don't specify technical implementation approaches
2. **Ambiguous Language:** Avoid terms that can be interpreted multiple ways
3. **Missing Edge Cases:** Don't forget error conditions and boundary cases
4. **Over-Specification:** Don't include unnecessary detail that constrains design
5. **Under-Specification:** Don't leave important behaviors undefined

### Quality Indicators

- Each criterion has a clear pass/fail condition
- Criteria cover all aspects mentioned in the user story
- Non-technical stakeholders can understand all criteria
- Development team can implement based on criteria alone
- QA team can create comprehensive test cases from criteria