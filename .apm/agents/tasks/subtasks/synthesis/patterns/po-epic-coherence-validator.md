# PO Epic Coherence Validator Synthesis Pattern

## Purpose
Validate epic consistency, prevent overlap, and ensure comprehensive coverage across all generated epics.

## When to Use
- After parallel epic generation from multiple sources
- When consolidating feature, technical, integration, and compliance epics
- Before finalizing epic catalog for development

## Input Format
Expects epic definitions from multiple generation subtasks with scope, features, and acceptance criteria.

## Validation Algorithm

```python
# Conceptual validation process
def validate_epic_coherence(epics):
    # 1. Overlap Detection
    feature_map = {}
    for epic in epics:
        for feature in epic.features:
            if feature in feature_map:
                flag_overlap(epic, feature_map[feature])
            feature_map[feature] = epic
    
    # 2. Coverage Analysis
    all_requirements = get_all_requirements()
    covered = set()
    for epic in epics:
        covered.update(epic.requirements_addressed)
    gaps = all_requirements - covered
    
    # 3. Dependency Validation
    for epic in epics:
        for dep in epic.dependencies:
            if not epic_exists(dep):
                flag_missing_dependency(epic, dep)
    
    # 4. Scope Coherence
    check_epic_boundaries()
    check_acceptance_criteria_consistency()
    
    return validation_report
```

## Validation Rules

### 1. **Overlap Detection**
- No feature should appear in multiple epics
- No duplicate acceptance criteria
- Clear boundaries between epics

### 2. **Coverage Validation**
- All PRD requirements mapped to epics
- All compliance needs addressed
- No orphaned features

### 3. **Dependency Coherence**
- All epic dependencies exist
- No circular dependencies
- Dependencies properly sequenced

### 4. **Scope Consistency**
- Epic sizes relatively balanced
- Consistent granularity
- Clear value propositions

## Output Template

```yaml
epic_coherence_report:
  validation_timestamp: "2024-01-20T10:30:00Z"
  total_epics_analyzed: 12
  validation_status: "PASSED_WITH_WARNINGS"
  
  overlap_analysis:
    overlapping_features: 2
    
    overlaps:
      - feature: "User profile management"
        found_in:
          - epic: "EPIC-001"
            context: "User authentication"
          - epic: "EPIC-004"
            context: "User settings"
        resolution: "Move to EPIC-001, update EPIC-004 scope"
        
  coverage_analysis:
    total_requirements: 145
    covered_requirements: 142
    coverage_percentage: 97.9
    
    gaps:
      - requirement: "REQ-089"
        description: "Audit log retention"
        suggested_epic: "EPIC-C001 (Compliance)"
        priority: "HIGH"
        
      - requirement: "REQ-103"
        description: "API rate limiting"
        suggested_epic: "EPIC-T002 (Technical)"
        priority: "MEDIUM"
        
  dependency_validation:
    valid_dependencies: 23
    issues: 1
    
    dependency_issues:
      - epic: "EPIC-005"
        missing_dependency: "Payment provider setup"
        impact: "Cannot start payment features"
        resolution: "Create EPIC-I002 for payment integration"
        
  scope_analysis:
    size_distribution:
      small: 2    # 1-2 sprints
      medium: 6   # 3-4 sprints
      large: 3    # 5-6 sprints
      xlarge: 1   # >6 sprints
      
    balance_score: 8.5  # out of 10
    
    recommendations:
      - epic: "EPIC-008"
        issue: "Too large (8 sprints)"
        suggestion: "Split into 2-3 smaller epics"
        
  semantic_consistency:
    naming_consistency: "GOOD"
    description_quality: "EXCELLENT"
    acceptance_criteria_clarity: "GOOD"
    
    improvements:
      - epic: "EPIC-003"
        issue: "Vague acceptance criteria"
        suggestion: "Add measurable success metrics"
        
  consolidated_epic_map:
    themes:
      - theme: "User Management"
        epics: ["EPIC-001", "EPIC-004"]
        coverage: "Complete"
        
      - theme: "Platform Infrastructure"
        epics: ["EPIC-T001", "EPIC-T002"]
        coverage: "Complete"
        
      - theme: "Integrations"
        epics: ["EPIC-I001", "EPIC-I002"]
        coverage: "Partial - missing analytics"
        
  final_recommendations:
    must_fix:
      - "Resolve feature overlap between EPIC-001 and EPIC-004"
      - "Create epic for missing payment provider setup"
      - "Add audit log retention to EPIC-C001"
      
    should_improve:
      - "Split EPIC-008 into smaller chunks"
      - "Clarify acceptance criteria for EPIC-003"
      - "Consider analytics integration epic"
      
    optimization_opportunities:
      - "Merge EPIC-011 and EPIC-012 (related features)"
      - "Resequence EPIC-005 after payment setup"
      
  quality_metrics:
    overlap_score: 9.5      # Lower overlap is better
    coverage_score: 9.8     # Higher coverage is better
    consistency_score: 8.5  # Scope and naming consistency
    overall_coherence: 9.3  # Weighted average
```

## Merge Strategies

### When Overlaps Detected:
1. **Feature Migration**: Move feature to most logical epic
2. **Epic Merger**: Combine highly overlapping epics
3. **Scope Refinement**: Adjust epic boundaries

### When Gaps Found:
1. **Epic Extension**: Add to existing epic if fits
2. **New Epic Creation**: For significant gaps
3. **Backlog Item**: For minor gaps

## Quality Thresholds
- **Coverage**: Must be >95%
- **Overlap**: Should be <5%
- **Balance**: Size variance <2x
- **Dependencies**: 100% valid

## Example Usage
Best for: Post-epic generation validation, sprint planning preparation, portfolio management