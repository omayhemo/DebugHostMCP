==================== START: defect-report-tmpl ====================

# Defect Report Template

## Defect Overview

### Basic Information

- **Defect ID:** {Unique identifier - DEF-ProjectName-Number}
- **Title:** {Clear, concise description of the issue}
- **Reporter:** {Name of person who found the defect}
- **Date Reported:** {Date when defect was discovered}
- **Environment:** {Where the defect was found - Dev/QA/Staging/Production}
- **Build Version:** {Specific build or version number}

### Classification

- **Severity:** {Critical/High/Medium/Low}
- **Priority:** {P0/P1/P2/P3}
- **Category:** {Functional/UI/Performance/Security/Integration/Usability}
- **Component:** {Specific system component or module affected}
- **Affected Platforms:** {Browser/OS/Device where issue occurs}

## Defect Details

### Summary

{Brief 1-2 sentence description of what's wrong}

### Description

{Detailed explanation of the issue, including what's happening vs. what should happen}

### Steps to Reproduce

1. {Step 1 - be specific and detailed}
2. {Step 2 - include exact data used}
3. {Step 3 - note any special conditions}
4. {Continue until issue reproduces}

### Expected Result

{What should happen when following the steps above}

### Actual Result

{What actually happens - describe the incorrect behavior}

### Preconditions

- {Any setup required before reproducing}
- {Specific user roles or permissions needed}
- {Data that must exist in the system}
- {Environmental conditions required}

## Technical Details

### Test Data Used

- **User Account:** {Username or test account details}
- **Input Data:** {Specific data values used}
- **Test Files:** {Any files uploaded or used}
- **Configuration:** {Relevant system configuration}

### Environment Information

- **URL/Application:** {Specific application URL or version}
- **Browser:** {Browser name and version}
- **Operating System:** {OS name and version}
- **Screen Resolution:** {If UI-related}
- **Network Conditions:** {If network-related}

### Error Information

- **Error Messages:** {Exact text of any error messages}
- **Console Errors:** {JavaScript console errors if applicable}
- **HTTP Status Codes:** {For API or network-related issues}
- **Log Entries:** {Relevant log file entries}

## Evidence & Attachments

### Screenshots

- {Screenshot 1: Description of what it shows}
- {Screenshot 2: Description of what it shows}
- {Screenshot 3: Expected vs. Actual comparison}

### Video/Screen Recording

- {Link to video showing the issue reproduction}
- {Description of what the video demonstrates}

### Log Files

- {Relevant log file excerpts or attachments}
- {Database query results if applicable}
- {Network traffic captures if needed}

### Supporting Documents

- {Links to related requirements or specifications}
- {Reference to test cases that fail}
- {Related defect reports}

## Impact Assessment

### User Impact

- **Affected Users:** {Who is impacted - all users, specific roles, percentage}
- **Business Impact:** {How this affects business operations or goals}
- **User Experience:** {How this degrades the user experience}
- **Workaround Available:** {Yes/No - if yes, describe the workaround}

### Technical Impact

- **System Stability:** {Does this cause crashes or instability}
- **Data Integrity:** {Any risk to data accuracy or completeness}
- **Performance Impact:** {Does this slow down the system}
- **Integration Issues:** {Does this affect other system components}

### Risk Assessment

- **Probability of Occurrence:** {How likely users are to encounter this}
- **Frequency:** {How often the issue occurs}
- **Detectability:** {How easy it is for users to notice}
- **Recovery:** {How difficult it is to recover from this issue}

## Additional Information

### Related Issues

- **Duplicate Reports:** {Links to any duplicate defect reports}
- **Related Defects:** {Links to related or similar issues}
- **Parent/Child Issues:** {If this is part of a larger problem}

### Test Case Information

- **Test Case ID:** {ID of test case that revealed this defect}
- **Test Suite:** {Which test suite was being executed}
- **Automation Status:** {Was this found by automated or manual testing}

### Regression Information

- **Previously Working:** {Was this functionality working before}
- **Last Known Good Build:** {Last build where this worked correctly}
- **Recent Changes:** {Any recent code changes that might be related}

## Developer Investigation

### Root Cause Analysis

{To be filled by developer}

- **Root Cause:** {Technical explanation of why this occurred}
- **Code Location:** {Specific files/methods where the issue exists}
- **Contributing Factors:** {Other factors that led to this issue}

### Fix Information

{To be filled by developer}

- **Fix Description:** {What changes were made to resolve this}
- **Code Changes:** {Summary of code modifications}
- **Side Effects:** {Any potential impact of the fix}
- **Testing Required:** {What testing is needed to verify the fix}

## Resolution Tracking

### Assignment & Ownership

- **Assigned To:** {Developer name}
- **Date Assigned:** {When it was assigned}
- **Team/Component Owner:** {Team responsible for this area}
- **Reviewer:** {Who will review the fix}

### Resolution Details

- **Resolution:** {Fixed/Duplicate/Not a Bug/Won't Fix/Cannot Reproduce}
- **Resolution Date:** {When the issue was resolved}
- **Fix Build/Version:** {Build where the fix will be available}
- **Resolution Notes:** {Additional details about the resolution}

### Verification

- **Verified By:** {QA person who verified the fix}
- **Verification Date:** {When verification was completed}
- **Verification Notes:** {Results of verification testing}
- **Regression Testing:** {Was regression testing performed}

## Communication & Updates

### Status History

| Date | Status | Updated By | Comments |
|------|--------|------------|----------|
| {Date} | New | {Reporter} | Initial report |
| {Date} | Assigned | {PM/Lead} | Assigned to {Developer} |
| {Date} | In Progress | {Developer} | Investigation started |
| {Date} | Fixed | {Developer} | Fix implemented |
| {Date} | Verified | {QA} | Fix verified in build {X} |
| {Date} | Closed | {QA} | Issue resolved |

### Stakeholder Communication

- **Reported To:** {Who was notified about this defect}
- **Escalated To:** {If escalated, who was contacted}
- **Customer Impact:** {Was customer notified if applicable}

## Metrics & Analysis

### Time Tracking

- **Time to Assignment:** {Hours from report to assignment}
- **Time to Fix:** {Hours from assignment to fix}
- **Time to Verification:** {Hours from fix to verification}
- **Total Resolution Time:** {Total time from report to closure}

### Defect Classification

- **Defect Source:** {Code Review/Unit Testing/System Testing/UAT/Production}
- **Defect Type:** {Logic Error/Interface Error/Data Error/etc.}
- **Phase Introduced:** {Requirements/Design/Development/Testing}
- **Phase Detected:** {Development/Testing/Production}

## Sign-off & Closure

### Quality Assurance Sign-off

- **QA Tester:** {Name}
- **Verification Status:** {Verified/Not Verified}
- **Sign-off Date:** {Date}
- **Comments:** {Any additional notes}

### Product Owner Approval

- **Product Owner:** {Name}
- **Approval Status:** {Approved/Rejected}
- **Approval Date:** {Date}
- **Comments:** {Business impact assessment}

---

**Template Usage Notes:**

- Fill in all applicable sections
- Include sufficient detail for reproduction
- Attach evidence (screenshots, logs, videos)
- Update status as defect progresses
- Archive when resolved and verified

==================== END: defect-report-tmpl ====================
