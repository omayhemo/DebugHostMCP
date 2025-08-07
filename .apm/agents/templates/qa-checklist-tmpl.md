==================== START: qa-checklist-tmpl ====================

# QA Checklist Template

## Instructions

This template provides a framework for creating specific QA checklists for different project phases. Copy and customize the relevant sections based on your project needs.

---

## Pre-Development Readiness Checklist

### Requirements & Planning Validation

- [ ] **PRD Complete:** Product Requirements Document is complete, approved, and accessible
- [ ] **User Stories Defined:** All user stories have complete acceptance criteria
- [ ] **Epic Goals Clear:** Epic goals are clearly defined and measurable
- [ ] **Requirements Testable:** All requirements can be objectively verified
- [ ] **Dependencies Identified:** Dependencies and constraints are documented
- [ ] **Success Metrics Defined:** KPIs and success metrics are established

### Technical Design Validation

- [ ] **Architecture Complete:** Architecture document is complete and approved
- [ ] **Tech Stack Finalized:** Technology stack decisions are documented
- [ ] **Database Design:** Database schema supports all requirements
- [ ] **API Specifications:** API contracts are documented and reviewed
- [ ] **Security Requirements:** Security requirements are addressed
- [ ] **Performance Requirements:** Performance benchmarks are specified

### Test Strategy Validation

- [ ] **Test Strategy Documented:** Testing approach is documented and approved
- [ ] **Test Environments Planned:** Test environments are defined and available
- [ ] **Test Data Requirements:** Test data needs are identified
- [ ] **Automation Strategy:** Test automation approach is defined
- [ ] **Quality Gates Established:** Entry/exit criteria are documented
- [ ] **Risk Assessment Complete:** Testing risks are identified and mitigated

### Team Readiness

- [ ] **Requirements Understanding:** Development team understands all requirements
- [ ] **Technical Setup Complete:** Development tools and environment ready
- [ ] **System Access:** Access to required systems and services confirmed
- [ ] **CI/CD Ready:** Code repositories and pipelines are configured
- [ ] **Communication Channels:** Team communication channels established
- [ ] **Sprint Planning Done:** Sprint capacity and planning completed

---

## Story Completion Checklist (Definition of Done)

### Functional Completion

- [ ] **Acceptance Criteria Met:** All acceptance criteria are satisfied and verified
- [ ] **Feature Functions:** Feature works as specified in requirements
- [ ] **Integration Successful:** Integration with existing components works
- [ ] **Error Handling:** Error handling is implemented and tested
- [ ] **Edge Cases Addressed:** Boundary conditions and edge cases handled
- [ ] **UX Matches Design:** User experience matches design specifications

### Technical Quality

- [ ] **Coding Standards:** Code follows established coding standards
- [ ] **Unit Tests Complete:** Unit tests written and passing (coverage targets met)
- [ ] **Integration Tests Pass:** Integration tests completed successfully
- [ ] **Code Review Approved:** Code review completed and approved
- [ ] **Performance Benchmarks:** Performance requirements met
- [ ] **Security Implemented:** Security requirements implemented correctly

### Documentation & Communication

- [ ] **Code Documented:** Code includes appropriate comments and documentation
- [ ] **User Docs Updated:** User documentation updated if required
- [ ] **Setup Instructions:** README or setup instructions updated
- [ ] **Demo Prepared:** Feature demo or walkthrough prepared
- [ ] **Issues Documented:** Known issues or limitations documented
- [ ] **Deployment Instructions:** Clear deployment instructions provided

---

## Epic Completion Checklist

### Epic Goal Achievement

- [ ] **Epic Objectives Met:** All epic objectives achieved and verified
- [ ] **User Value Delivered:** User value is delivered as specified
- [ ] **Business Goals Met:** Business goals and success metrics achieved
- [ ] **User Journeys Work:** End-to-end user journeys function correctly
- [ ] **Story Integration:** All epic stories integrate successfully
- [ ] **Epic Performance:** Performance at epic scale meets requirements

### Quality Assurance

- [ ] **Comprehensive Testing:** Full testing completed across epic scope
- [ ] **Regression Testing:** Regression testing confirms no negative impact
- [ ] **Security Testing:** Security requirements validated
- [ ] **Accessibility Testing:** Accessibility compliance verified
- [ ] **Cross-Browser Testing:** Multi-browser/device testing completed
- [ ] **Load Testing:** Performance under stress validated

### Production Readiness

- [ ] **Deployment Tested:** Deployment procedures tested and documented
- [ ] **Monitoring Configured:** System monitoring and alerting set up
- [ ] **Rollback Procedures:** Rollback procedures defined and tested
- [ ] **Database Migrations:** Database changes tested
- [ ] **Environment Validated:** Production environment configuration verified
- [ ] **Support Documentation:** Support and troubleshooting docs prepared

---

## Pre-Deployment Checklist

### Code Quality & Testing

- [ ] **Code Merged:** All code merged to main/production branch
- [ ] **Test Suite Passing:** Complete test suite passing (unit, integration, e2e)
- [ ] **Coverage Targets Met:** Code coverage meets established thresholds
- [ ] **Static Analysis Passed:** Static analysis and security scans clear
- [ ] **Performance Testing Complete:** Performance testing passed
- [ ] **UAT Completed:** Manual testing and user acceptance testing done

### Infrastructure & Environment

- [ ] **Production Environment Ready:** Production environment configured correctly
- [ ] **Database Migrations Ready:** Database migrations tested and prepared
- [ ] **Environment Variables Set:** All environment variables and secrets configured
- [ ] **Security Configurations:** SSL certificates and security settings verified
- [ ] **CDN Optimized:** Content delivery and static assets optimized
- [ ] **Backup Procedures:** Backup and disaster recovery tested

### Documentation & Communication

- [ ] **Release Notes Prepared:** Release documentation prepared and reviewed
- [ ] **User Documentation Updated:** End-user documentation current
- [ ] **Support Team Briefed:** Support team knows about new features
- [ ] **Stakeholders Notified:** Deployment timeline communicated
- [ ] **Rollback Plan Ready:** Rollback procedures documented and tested
- [ ] **Monitoring Plan Ready:** Post-deployment monitoring plan prepared

### Compliance & Security

- [ ] **Security Review Complete:** Security assessment completed and signed off
- [ ] **Accessibility Verified:** Accessibility compliance confirmed
- [ ] **Privacy Requirements Met:** Data privacy requirements satisfied
- [ ] **Regulatory Compliance:** Industry compliance requirements met
- [ ] **Third-party Integrations:** External service integrations tested
- [ ] **API Security Configured:** API rate limits and security controls active

---

## Production Release Checklist

### Final Validation

- [ ] **Deployment Successful:** Production deployment completed successfully
- [ ] **Systems Operational:** All systems responding and functional
- [ ] **Database Connectivity:** Database connections and performance verified
- [ ] **External Integrations Working:** Third-party services functioning
- [ ] **Monitoring Active:** All monitoring systems active and alerting
- [ ] **Authentication Working:** User login and authorization functional

### User Experience Validation

- [ ] **Critical Journeys Tested:** Key user workflows tested in production
- [ ] **Performance Meets Benchmarks:** Response times within expected ranges
- [ ] **Error Rates Acceptable:** Error rates within acceptable thresholds
- [ ] **UI Renders Correctly:** Interface displays correctly across browsers
- [ ] **Mobile Experience Validated:** Mobile functionality confirmed
- [ ] **SEO Optimized:** Search engine optimization verified (if applicable)

### Operational Readiness

- [ ] **Support Team Ready:** Support team prepared for user inquiries
- [ ] **Documentation Available:** User help documentation accessible
- [ ] **Analytics Configured:** Usage tracking and analytics active
- [ ] **Feedback Mechanisms:** User feedback collection systems active
- [ ] **Issue Tracking Active:** Bug reporting and escalation procedures ready
- [ ] **Success Metrics Monitoring:** KPI monitoring and reporting established

---

## Custom Checklist Template

### {Section Name}

- [ ] **{Criteria Name}:** {Description of what needs to be verified}
- [ ] **{Criteria Name}:** {Description of what needs to be verified}
- [ ] **{Criteria Name}:** {Description of what needs to be verified}

### Checklist Completion Summary

| Category | Items | Passed | Failed | N/A | Pass Rate |
|----------|-------|--------|--------|-----|-----------|
| {Category 1} | {Total} | {Count} | {Count} | {Count} | {Percentage} |
| {Category 2} | {Total} | {Count} | {Count} | {Count} | {Percentage} |
| **Total** | **{Total}** | **{Count}** | **{Count}** | **{Count}** | **{Percentage}** |

### Quality Gate Decision

- [ ] **PASS:** All critical criteria met, proceed to next phase
- [ ] **CONDITIONAL PASS:** Minor issues identified, proceed with conditions
- [ ] **FAIL:** Critical issues must be resolved before proceeding

### Issues & Action Items

| Issue ID | Description | Severity | Owner | Target Date | Status |
|----------|-------------|----------|-------|-------------|--------|
| {ID} | {Description} | {Critical/High/Medium/Low} | {Name} | {Date} | {Open/In Progress/Resolved} |

### Sign-off

| Role | Name | Decision | Comments | Date |
|------|------|----------|----------|------|
| QA Lead | {Name} | {Pass/Fail/Conditional} | {Comments} | {Date} |
| Product Manager | {Name} | {Approved/Rejected} | {Comments} | {Date} |
| Technical Lead | {Name} | {Approved/Rejected} | {Comments} | {Date} |

==================== END: qa-checklist-tmpl ====================
