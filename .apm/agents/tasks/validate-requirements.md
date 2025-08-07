==================== START: validate-requirements ====================
# Validate Requirements Task

> **Note: Requirements validation is now automated by Claude Code hooks.** The hooks automatically check document completeness, validate formats, and ensure quality standards. This task now focuses on strategic validation and interpreting automated results.

## Automated Support
This task benefits from automated:
- ✅ Document completeness checking
- ✅ Format validation (user stories, acceptance criteria)
- ✅ Cross-document consistency verification
- ✅ Testability assessment
- ✅ Validation report generation
- ✅ Issue tracking and metrics

## Purpose

To systematically review and validate project requirements (PRD, User Stories, Acceptance Criteria) for completeness, testability, and quality assurance readiness before development begins.

## Inputs for this Task (Automatically Validated)

- Product Requirements Document (PRD)
- Epic definitions and user stories
- Acceptance criteria for all stories
- Architecture documents (main and frontend if applicable)
- Any existing project constraints or technical assumptions

## Task Execution Instructions

### 1. Review Automated Validation Results

**The hooks automatically check:**
- Document existence and format compliance
- Required sections in PRDs and epics
- User story format (As a... I want... So that...)
- Acceptance criteria completeness
- Cross-document consistency

**Your role:**
- Interpret validation reports
- Assess the business impact of any issues
- Provide context-specific recommendations
- Guide prioritization of fixes

### 2. Strategic Quality Assessment

Focus on aspects that require human judgment:

**Business Alignment:**
- Do requirements align with business objectives?
- Are success metrics meaningful and achievable?
- Is the scope appropriate for available resources?

**Technical Feasibility:**
- Are technical assumptions realistic?
- Do requirements consider system constraints?
- Are integration points well-defined?

**User Experience:**
- Do stories reflect actual user needs?
- Are workflows logical and efficient?
- Is accessibility properly addressed?

### 3. Deep Validation (Beyond Automation)

While hooks validate structure, you validate meaning:

**Requirement Coherence:**
- Do all requirements work together logically?
- Are there hidden dependencies or conflicts?
- Is the implementation sequence optimal?

**Risk Assessment:**
- What are the quality risks?
- Which requirements are most critical?
- Where might testing be challenging?

**Gap Analysis:**
- What scenarios might be missing?
- Are edge cases adequately covered?
- Do we need additional non-functional requirements?

### 4. Stakeholder Communication

Transform automated findings into actionable insights:

**For Product Managers:**
- Explain impact of missing requirements
- Suggest clarifications needed
- Highlight business risks

**For Developers:**
- Identify technical ambiguities
- Flag integration challenges
- Suggest implementation approaches

**For QA Team:**
- Highlight testing challenges
- Identify areas needing test focus
- Suggest test strategy adjustments

### 5. Create Strategic Validation Report

Build upon the automated report with:

**Executive Summary:**
- Overall requirements health assessment
- Critical issues requiring immediate attention
- Strategic recommendations

**Risk Analysis:**
- Quality risks by priority
- Mitigation strategies
- Resource implications

**Action Plan:**
- Specific improvements needed
- Owner assignments
- Timeline recommendations

## Working with Automated Reports

### Understanding Hook Output

Automated reports include:
```markdown
# Requirements Validation Report
- Document compliance status
- Format validation results
- Missing sections list
- Consistency issues
- Testability assessment
```

### Your Value-Add

Focus on:
1. **Interpretation**: What do the findings mean for the project?
2. **Prioritization**: Which issues are critical vs nice-to-have?
3. **Solutions**: How to address complex requirement gaps?
4. **Communication**: Translate technical findings for stakeholders

## Quality Gates

### Automated Checks (Via Hooks)
- ✅ All required documents present
- ✅ Documents follow templates
- ✅ User stories properly formatted
- ✅ Acceptance criteria complete

### Manual Strategic Review
- ✅ Business value clearly articulated
- ✅ Technical approach is sound
- ✅ User experience well-considered
- ✅ Risks identified and manageable

## Report Locations

- Automated validation: `$AP_ROOT/hooks/task-hooks/validation-report-*.md`
- Task workspaces: `$AP_ROOT/hooks/task-hooks/workspaces/`
- Session logs: Check for validation execution history

## Next Steps

1. Review all automated validation reports
2. Conduct strategic assessment
3. Create consolidated findings document
4. Meet with stakeholders to discuss
5. Track remediation progress
6. Re-validate after updates

Remember: Automation handles the mechanical validation. Your expertise provides the strategic insight that ensures requirements truly meet project needs.

==================== END: validate-requirements ====================