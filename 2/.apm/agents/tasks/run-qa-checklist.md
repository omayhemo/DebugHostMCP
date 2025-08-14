==================== START: run-qa-checklist ====================
# Run QA Checklist Task

> **Note: QA checklist execution and tracking are now automated by Claude Code hooks.** Hooks automatically run appropriate checklists, track completion status, and generate reports. This task now focuses on interpreting results and strategic quality decisions.

## Automated Support
This task benefits from automated:
- ✅ Checklist selection and execution
- ✅ Pass/fail status tracking
- ✅ Issue identification and logging
- ✅ Progress monitoring
- ✅ Report generation
- ✅ Metrics collection

## Purpose

To execute comprehensive quality assurance checklists at various project milestones to ensure deliverables meet quality standards before progression to the next phase. This task provides systematic validation using predefined quality criteria.

## Inputs for this Task

- Specific checklist to execute (pre-deployment, story completion, epic sign-off, etc.)
- Artifacts or deliverables to be validated
- Quality standards and acceptance criteria
- Previous checklist results (if applicable)
- Stakeholder requirements and expectations

## Task Execution Instructions

### 1. Select and Prepare Checklist

- **Identify Appropriate Checklist:**
  - Pre-development readiness checklist
  - Story completion and DoD (Definition of Done) checklist
  - Epic completion and acceptance checklist
  - Pre-deployment readiness checklist
  - Production release readiness checklist
  - Security and compliance checklist
- **Gather Required Materials:**
  - Current versions of all artifacts to be validated
  - Relevant test results and quality metrics
  - Documentation and specifications
  - Previous checklist results and resolved issues
- **Set Execution Context:**
  - Understand checklist objectives and scope
  - Identify stakeholders who need results
  - Determine success criteria and quality gates
  - Plan execution timeline and resources

### 2. Execute Pre-Development Readiness Checklist

**Requirements & Planning Validation:**
- [ ] PRD is complete, approved, and accessible to team
- [ ] All user stories have complete acceptance criteria
- [ ] Epic goals are clearly defined and measurable
- [ ] Requirements are testable and verifiable
- [ ] Dependencies and constraints are identified
- [ ] Success metrics and KPIs are defined

**Technical Design Validation:**
- [ ] Architecture document is complete and approved
- [ ] Technical stack decisions are finalized
- [ ] Database design supports all requirements
- [ ] API specifications are documented
- [ ] Security requirements are addressed
- [ ] Performance requirements are specified

**Test Strategy Validation:**
- [ ] Test strategy is documented and approved
- [ ] Test environments are planned and available
- [ ] Test data requirements are identified
- [ ] Automation strategy is defined
- [ ] Quality gates and criteria are established
- [ ] Risk assessment is complete

**Team Readiness:**
- [ ] Development team understands requirements
- [ ] Technical setup and tooling is complete
- [ ] Access to required systems and services
- [ ] Code repositories and CI/CD pipelines ready
- [ ] Communication channels established
- [ ] Sprint planning and capacity confirmed

### 3. Execute Story Completion Checklist

**Functional Completion:**
- [ ] All acceptance criteria are met and verified
- [ ] Feature works as specified in requirements
- [ ] Integration with existing components successful
- [ ] Error handling is implemented and tested
- [ ] Edge cases and boundary conditions addressed
- [ ] User experience matches design specifications

**Technical Quality:**
- [ ] Code follows established coding standards
- [ ] Unit tests written and passing (coverage targets met)
- [ ] Integration tests completed successfully
- [ ] Code review completed and approved
- [ ] Performance benchmarks met
- [ ] Security requirements implemented

**Documentation & Communication:**
- [ ] Code is properly documented (comments, API docs)
- [ ] User documentation updated if required
- [ ] README or setup instructions updated
- [ ] Demo or walkthrough prepared for stakeholders
- [ ] Known issues or limitations documented
- [ ] Deployment instructions are clear

### 4. Execute Epic Completion Checklist

**Epic Goal Achievement:**
- [ ] All epic objectives are met and verified
- [ ] User value is delivered as specified
- [ ] Business goals and success metrics achieved
- [ ] End-to-end user journeys work correctly
- [ ] Integration across all epic stories successful
- [ ] Performance at epic scale meets requirements

**Quality Assurance:**
- [ ] Comprehensive testing completed across epic scope
- [ ] Regression testing confirms no negative impact
- [ ] Security testing validates protection mechanisms
- [ ] Accessibility testing meets compliance standards
- [ ] Cross-browser/device testing completed
- [ ] Load testing validates performance under stress

**Production Readiness:**
- [ ] Deployment procedures tested and documented
- [ ] Monitoring and alerting configured
- [ ] Rollback procedures defined and tested
- [ ] Database migrations tested
- [ ] Environment configuration validated
- [ ] Support documentation prepared

### 5. Execute Pre-Deployment Checklist

**Code Quality & Testing:**
- [ ] All code merged to main/production branch
- [ ] Full test suite passing (unit, integration, e2e)
- [ ] Code coverage meets established thresholds
- [ ] Static analysis and security scans passed
- [ ] Performance testing completed successfully
- [ ] Manual testing and UAT completed

**Infrastructure & Environment:**
- [ ] Production environment configured correctly
- [ ] Database migrations tested and ready
- [ ] Environment variables and secrets configured
- [ ] SSL certificates and security configurations verified
- [ ] CDN and static assets optimized
- [ ] Backup and disaster recovery procedures tested

**Documentation & Communication:**
- [ ] Release notes prepared and reviewed
- [ ] User documentation updated
- [ ] Support team briefed on new features
- [ ] Stakeholders notified of deployment timeline
- [ ] Rollback plan documented and tested
- [ ] Post-deployment monitoring plan prepared

**Compliance & Security:**
- [ ] Security review completed and signed off
- [ ] Accessibility compliance verified
- [ ] Data privacy requirements met
- [ ] Regulatory compliance validated (if applicable)
- [ ] Third-party integrations tested
- [ ] API rate limits and security configured

### 6. Execute Production Release Checklist

**Final Validation:**
- [ ] Production deployment successful
- [ ] All systems operational and responding
- [ ] Database connectivity and performance verified
- [ ] External integrations functioning correctly
- [ ] Monitoring systems active and alerting configured
- [ ] User authentication and authorization working

**User Experience Validation:**
- [ ] Critical user journeys tested in production
- [ ] Performance meets expected benchmarks
- [ ] Error rates within acceptable thresholds
- [ ] User interface renders correctly across browsers
- [ ] Mobile experience validated
- [ ] Search engine optimization (if applicable)

**Operational Readiness:**
- [ ] Support team ready to handle user inquiries
- [ ] Documentation available to support users
- [ ] Analytics and tracking configured
- [ ] Feedback collection mechanisms in place
- [ ] Issue tracking and escalation procedures active
- [ ] Success metrics monitoring established

### 7. Review Automated Results & Strategic Actions

> **Note: Results documentation and tracking are automated.** Focus on interpretation and strategic decisions.

**Automated processes handle:**
- Pass/fail status documentation for each item
- Evidence collection and verification logging
- Issue report generation for failed items
- Severity categorization and tracking
- Progress monitoring and updates
- Metrics collection and trending

**Your strategic focus:**
- **Quality Gate Decision:**
  - Interpret automated results for go/no-go recommendation
  - Assess business impact of identified issues
  - Define risk mitigation strategies
  - Recommend timeline adjustments if needed

### 8. Strategic Communication & Follow-up

**Automated tracking provides:**
- Real-time issue status updates
- Progress dashboards
- Historical trend analysis
- Automated re-validation triggers

**Your value-add:**
- **Stakeholder Communication:**
  - Translate technical findings for business stakeholders
  - Facilitate strategic discussions on critical issues
  - Guide prioritization based on business impact
  - Build consensus on resolution approaches
- **Process Improvement:**
  - Analyze patterns in automated reports
  - Recommend systemic improvements
  - Enhance quality processes based on data
  - Share insights across teams

## Checklist Execution Guidelines

### Checklist Item Evaluation
- **Pass (✓):** Item meets all criteria with evidence
- **Fail (✗):** Item does not meet criteria or has issues
- **N/A:** Item not applicable to current context
- **Partial (△):** Item partially meets criteria but needs attention

### Evidence Requirements
- **Objective Verification:** Provide measurable evidence where possible
- **Documentation:** Link to relevant documents, test results, or artifacts
- **Screenshots/Logs:** Include visual evidence for UI or system verification
- **Test Results:** Reference specific test cases or validation procedures

### Risk-Based Prioritization
- **Critical:** Must be resolved before progression (blocking issues)
- **Major:** Should be resolved soon (quality/functionality impact)
- **Minor:** Can be addressed in future iterations (cosmetic/low impact)

## Automated Reports & Locations

**Hooks automatically generate:**
- Checklist execution reports: `$AP_ROOT/hooks/task-hooks/checklist-report-*.md`
- Completion tracking: `$AP_ROOT/hooks/task-hooks/checklist-tracking.json`
- Quality metrics: Task workspace directories
- Session activity logs with all validations

**Report contents include:**
- Total items checked
- Pass/fail counts
- Completion percentage
- Detailed findings per item
- Timestamp and agent information

## Output Deliverables

**Automated outputs:**
- **Completed Checklist** with pass/fail status for each item (automated)
- **Issue Summary Report** with findings (automated)
- **Tracking entries** for all issues (automated)
- **Evidence logs** with verification details (automated)

**Your strategic outputs:**
- **Quality Gate Recommendation** (Go/No-Go decision)
- **Resolution Action Plan** with business priorities
- **Risk Assessment** for stakeholders
- **Stakeholder Communication** summary and next steps

## Success Criteria

The QA checklist execution is complete when:

1. All applicable checklist items have been evaluated with evidence
2. Issues are documented with clear categorization and ownership
3. Quality gate decision is made with stakeholder agreement
4. Action plan exists for resolving critical and major issues
5. Follow-up schedule established for tracking resolution progress
6. Results are communicated to all relevant stakeholders

==================== END: run-qa-checklist ====================