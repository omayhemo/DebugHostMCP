# Multi-Source Validator Synthesis Pattern

## Purpose
Validate findings by cross-referencing multiple independent analysis sources, establishing confidence through corroboration and identifying conflicts.

## When to Use
- Security vulnerability validation
- Bug report verification
- Performance issue confirmation
- Architecture decision validation
- Quality assessment synthesis

## Input Format
Expects findings from multiple analysis tools or perspectives with confidence scores and evidence.

## Validation Algorithm

```python
# Multi-source validation logic
def validate_findings(sources):
    CORROBORATION_WEIGHTS = {
        'exact_match': 1.0,
        'similar_finding': 0.8,
        'related_issue': 0.5,
        'conflicting': -0.5
    }
    
    SOURCE_RELIABILITY = {
        'automated_scan': 0.7,
        'manual_review': 0.9,
        'static_analysis': 0.8,
        'runtime_analysis': 0.85,
        'user_report': 0.6
    }
    
    def calculate_validation_score(finding, corroborations):
        base_score = finding.confidence * SOURCE_RELIABILITY[finding.source_type]
        
        corroboration_boost = 0
        for match in corroborations:
            weight = CORROBORATION_WEIGHTS[match.type]
            reliability = SOURCE_RELIABILITY[match.source_type]
            corroboration_boost += weight * reliability
        
        # Sigmoid function to cap at 1.0
        final_score = base_score * (1 + corroboration_boost)
        return min(final_score, 1.0)
```

## Synthesis Rules

1. **Evidence Stacking**: Multiple weak evidence > single weak evidence
2. **Conflict Resolution**: Explicit evidence trumps inferred
3. **Source Weighting**: Consider tool reliability and accuracy history
4. **Pattern Recognition**: Group similar findings across sources
5. **False Positive Detection**: Identify tool-specific false positives

## Output Template

```yaml
validation_summary:
  total_findings: 156
  validated_findings: 89
  conflicting_findings: 12
  unconfirmed_findings: 55
  overall_confidence: 0.82

highly_validated_findings:
  - finding_id: "SEC-001"
    description: "SQL injection in user search"
    validation_score: 0.95
    sources_confirming: 4
    sources:
      - tool: "SecurityScanner"
        confidence: 0.9
        evidence: "Unsanitized input at line 145"
      - tool: "CodeReview"
        confidence: 0.85
        evidence: "Manual verification confirmed"
      - tool: "PenTest"
        confidence: 1.0
        evidence: "Successfully exploited"
      - tool: "StaticAnalysis"
        confidence: 0.8
        evidence: "Taint analysis positive"
    consensus: "UNANIMOUS"
    action_priority: "CRITICAL"

  - finding_id: "PERF-003"
    description: "N+1 query in order listing"
    validation_score: 0.88
    sources_confirming: 3
    sources:
      - tool: "QueryAnalyzer"
        confidence: 0.9
        evidence: "547 queries for 100 orders"
      - tool: "APM"
        confidence: 0.85
        evidence: "Database time 89% of request"
      - tool: "CodeAnalysis"
        confidence: 0.75
        evidence: "Missing eager loading"
    consensus: "STRONG"
    action_priority: "HIGH"

conflicting_findings:
  - finding_id: "MEM-002"
    description: "Memory leak in cache service"
    conflict_type: "CONTRADICTORY"
    sources_pro:
      - tool: "MemoryProfiler"
        confidence: 0.8
        evidence: "Heap growth 50MB/hour"
        interpretation: "Definite leak"
    sources_against:
      - tool: "RuntimeMonitor"
        confidence: 0.7
        evidence: "Stable memory after 24h"
        interpretation: "No leak, just cache growth"
    resolution: "REQUIRES_INVESTIGATION"
    recommended_action: "Extended profiling needed"

  - finding_id: "API-005"
    description: "Endpoint authentication missing"
    conflict_type: "SCOPE_DIFFERENCE"
    sources_pro:
      - tool: "SecurityScanner"
        confidence: 0.9
        evidence: "No auth header required"
        scope: "External access"
    sources_against:
      - tool: "IntegrationTests"
        confidence: 0.95
        evidence: "Auth middleware present"
        scope: "Internal access only"
    resolution: "BOTH_CORRECT"
    clarification: "External vs internal endpoint confusion"

pattern_clusters:
  - pattern: "Input validation issues"
    finding_count: 15
    sources_detecting: ["SecurityScanner", "StaticAnalysis", "CodeReview"]
    confidence: 0.85
    common_locations: ["API endpoints", "Form handlers"]
    root_cause: "Missing validation layer"

  - pattern: "Resource cleanup failures"
    finding_count: 8
    sources_detecting: ["MemoryProfiler", "ResourceMonitor"]
    confidence: 0.72
    common_scenarios: ["File handles", "DB connections", "Event listeners"]

false_positive_analysis:
  identified_false_positives: 23
  by_tool:
    - tool: "StaticAnalysis"
      false_positive_rate: 15%
      common_patterns: ["Unused variable warnings in tests"]
    - tool: "SecurityScanner"
      false_positive_rate: 8%
      common_patterns: ["Hash comparison timing"]

source_reliability_metrics:
  - source: "ManualCodeReview"
    total_findings: 45
    confirmed_by_others: 41
    reliability_score: 0.91
    trust_level: "HIGH"

  - source: "AutomatedScan"
    total_findings: 89
    confirmed_by_others: 67
    reliability_score: 0.75
    trust_level: "MEDIUM"

cross_validation_matrix:
  #         Sec  Perf  Code  Test
  Security  [1.0, 0.3, 0.7, 0.2]
  Perf      [0.3, 1.0, 0.5, 0.4]
  CodeRev   [0.7, 0.5, 1.0, 0.6]
  Testing   [0.2, 0.4, 0.6, 1.0]

evidence_strength:
  strong_evidence:
    - "Runtime exploitation successful"
    - "Performance degradation measured"
    - "Failing test cases"
  
  moderate_evidence:
    - "Static analysis warnings"
    - "Code pattern detection"
    - "Configuration analysis"
  
  weak_evidence:
    - "Heuristic detection"
    - "Similarity to known issues"
    - "Theoretical vulnerability"

recommendations:
  high_confidence_actions:
    - finding_ids: ["SEC-001", "SEC-003", "PERF-003"]
      action: "Fix immediately"
      confidence: "> 0.85"
  
  medium_confidence_actions:
    - finding_ids: ["CODE-012", "API-008"]
      action: "Investigate and fix"
      confidence: "0.60 - 0.85"
  
  requires_validation:
    - finding_ids: ["MEM-002", "ARCH-005"]
      action: "Additional analysis needed"
      confidence: "< 0.60"

validation_metadata:
  analysis_date: "2024-01-07"
  tools_used: 6
  total_analysis_time: "4 hours"
  coverage_estimate: 85%
```

## Confidence Visualization

```
Finding Validation Confidence:

SEC-001 ████████████████████ 95% (4 sources)
PERF-003 █████████████████░░░ 88% (3 sources)
CODE-007 ██████████████░░░░░░ 72% (3 sources)
MEM-002  ████████░░░░░░░░░░░░ 45% (conflicting)
API-012  ██████░░░░░░░░░░░░░░ 35% (1 source)

Legend: █ Validated  ░ Uncertain
```

## Decision Framework

```yaml
action_thresholds:
  immediate_action: "> 0.85 confidence"
  standard_action: "0.60 - 0.85 confidence"
  investigate_further: "0.40 - 0.60 confidence"
  likely_false_positive: "< 0.40 confidence"

conflict_resolution_priority:
  1: "Runtime evidence"
  2: "Manual verification"
  3: "Multiple automated tools"
  4: "Single automated tool"
  5: "Heuristic detection"
```

## Example Usage
Best for: Security assessments, Bug triage, Code review synthesis, Quality gates