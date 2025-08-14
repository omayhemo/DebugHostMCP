# Checklist Validation Task

> **Note: Checklist validation is now automated by Claude Code hooks.** The hooks automatically detect document types, run appropriate checklists, and generate validation reports. This task now focuses on interpreting results and handling special cases.

## Automated Support
This task benefits from automated:
- ✅ Checklist mapping and selection
- ✅ Document validation against checklists
- ✅ Progress tracking and reporting
- ✅ Quality metrics calculation
- ✅ Validation report generation

## Context

The AP Mapping uses various checklists to ensure quality and completeness of different artifacts. Checklist validation now runs automatically when documents are created or modified. The automated system:
- Detects document type
- Selects appropriate checklist
- Validates all checklist items
- Generates comprehensive reports
- Tracks completion metrics

## Instructions for Special Cases

### 1. **Manual Override Mode**

If you need to run checklist validation manually:

```bash
# Run directly using the validator
$AP_ROOT/hooks/task-hooks/checklist-validator.sh <document-file> [checklist-file] [mode]
```

### 2. **Interpreting Automated Reports**

When hooks generate validation reports, focus on:
- Understanding why certain items failed
- Providing context-specific recommendations
- Discussing remediation strategies with the user
- Prioritizing which issues to address first

### 3. **Interactive Review Mode**

For detailed review with the user:
- Review the automated validation report
- Discuss each failed item's importance
- Provide domain-specific guidance
- Help prioritize remediation efforts

### 4. **Custom Checklist Scenarios**

For checklists not yet configured in the automation:
- Identify the checklist requirements
- Run manual validation if needed
- Recommend adding to task-mappings.json
- Document any special validation needs

## Understanding Automated Reports

The automated system generates reports with:

```markdown
# Checklist Validation Report
- **Total Items**: X
- **Passed**: Y
- **Failed**: Z
- **Completion Rate**: XX%

## Detailed Results
- Specific pass/fail items
- Reasons for failures
- Recommendations
```

## Strategic Guidance

Focus your expertise on:

1. **Interpretation**: Help users understand why items failed
2. **Prioritization**: Which failures are critical vs nice-to-have
3. **Solutions**: Provide specific fixes for failed items
4. **Context**: Explain domain-specific requirements

## Special Considerations by Checklist Type

### Architecture Checklist
- Focus on architectural trade-offs
- Explain security implications
- Discuss scalability decisions

### Frontend Architecture Checklist
- Guide UI/UX decisions
- Explain component patterns
- Discuss performance impacts

### QA Checklists
- Interpret test coverage needs
- Explain risk assessments
- Guide testing priorities

### PM/PO Checklists
- Clarify business requirements
- Discuss user impact
- Guide feature priorities

## Working with Automation

The hooks handle:
- Finding and loading checklists
- Checking each item programmatically
- Calculating pass rates
- Generating reports

You provide:
- Expert interpretation
- Context-specific guidance
- Strategic recommendations
- Human judgment on edge cases

## Report Locations

Automated reports are saved to:
- `$AP_ROOT/hooks/task-hooks/checklist-report-*.md`
- Workspace directories for specific tasks
- Session activity logs

## Next Steps After Validation

1. Review the automated report with the user
2. Prioritize failed items based on impact
3. Create action items for remediation
4. Update documents as needed
5. Re-run validation to confirm fixes

Remember: The automation handles the mechanical validation. Your role is to provide expert guidance on what the results mean and how to address issues effectively.