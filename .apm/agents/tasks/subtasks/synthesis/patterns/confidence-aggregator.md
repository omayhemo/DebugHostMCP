# Confidence Aggregator Synthesis Pattern

## Purpose
Aggregate findings with varying confidence levels, providing an overall confidence score and highlighting areas needing verification.

## When to Use
- Research synthesis
- Market analysis compilation  
- Requirement validation
- Feasibility assessments
- Architecture decisions

## Input Format
Expects findings with confidence scores, evidence strength, and source reliability.

## Confidence Algorithm

```python
# Base Confidence Calculation
def calculate_aggregate_confidence(findings):
    # Weight by source reliability
    SOURCE_WEIGHTS = {
        'empirical_data': 1.0,
        'expert_analysis': 0.9,
        'automated_scan': 0.7,
        'heuristic': 0.5,
        'assumption': 0.3
    }
    
    # Evidence strength multipliers
    EVIDENCE_MULTIPLIERS = {
        'proven': 1.0,
        'strong': 0.8,
        'moderate': 0.6,
        'weak': 0.4,
        'anecdotal': 0.2
    }
    
    # Corroboration bonus
    if multiple_sources_agree:
        confidence *= 1.2  # Up to 20% boost
    
    # Recency factor
    age_penalty = 0.1 * months_old  # 10% per month
    confidence *= (1 - age_penalty)
    
    return min(confidence, 1.0)  # Cap at 100%
```

## Aggregation Rules

1. **Weighted Average**: Not simple mean, weighted by source quality
2. **Minimum Threshold**: Overall confidence ≥ weakest critical component
3. **Cascading Doubt**: Low confidence in dependencies reduces parent confidence
4. **Evidence Stacking**: Multiple weak evidence > single weak evidence

## Output Template

```yaml
confidence_summary:
  overall_confidence: 0.78  # 78% confident
  confidence_level: "MODERATE-HIGH"
  total_findings: 156
  high_confidence_findings: 89
  low_confidence_findings: 12
  evidence_quality: "STRONG"

high_confidence_findings:
  - finding: "React is optimal framework choice"
    confidence: 0.95
    evidence:
      - source: "performance benchmarks"
        type: "empirical_data"
        strength: "proven"
      - source: "team expertise assessment"
        type: "expert_analysis"
        strength: "strong"
      - source: "community support metrics"
        type: "empirical_data"
        strength: "strong"
    corroboration: "3 independent sources"

moderate_confidence_findings:
  - finding: "Microservices will improve scalability"
    confidence: 0.65
    evidence:
      - source: "architectural analysis"
        type: "expert_analysis"
        strength: "moderate"
      - source: "similar project case study"
        type: "anecdotal"
        strength: "weak"
    caveats:
      - "Team lacks microservices experience"
      - "Complexity overhead not fully assessed"

low_confidence_areas:
  - area: "Third-party API reliability"
    confidence: 0.35
    issues:
      - "No SLA documentation found"
      - "Limited historical uptime data"
      - "Vendor communication concerns"
    recommendation: "Conduct proof of concept"
    risk_mitigation: "Implement fallback options"

verification_needed:
  - finding: "Database can handle 10x growth"
    current_confidence: 0.45
    verification_method: "Load testing required"
    estimated_effort: "3 days"
    confidence_after_verification: 0.85

confidence_breakdown:
  by_category:
    technical_feasibility: 0.82
    business_viability: 0.75
    user_acceptance: 0.71
    timeline_achievability: 0.68
  
  by_source_type:
    empirical_data: 0.89
    expert_analysis: 0.78
    automated_tools: 0.72
    assumptions: 0.45
```

## Confidence Visualization

```
Confidence Levels:
[████████████████████] 95-100% - VERY HIGH
[████████████████░░░░] 80-94%  - HIGH  
[████████████░░░░░░░░] 60-79%  - MODERATE
[████████░░░░░░░░░░░░] 40-59%  - LOW
[████░░░░░░░░░░░░░░░░] 0-39%   - VERY LOW

Evidence Strength:
◆◆◆◆◆ Proven (empirical data)
◆◆◆◆◇ Strong (expert validated)
◆◆◆◇◇ Moderate (multiple indicators)
◆◆◇◇◇ Weak (limited evidence)
◆◇◇◇◇ Anecdotal (single source)
```

## Decision Support

```yaml
decision_guidance:
  proceed_with_confidence:
    - findings with confidence > 0.8
    - critical_path_confidence: 0.85
    - recommendation: "Safe to proceed"
  
  proceed_with_caution:
    - findings with confidence 0.6-0.8
    - risk_areas: ["third-party dependencies", "scale assumptions"]
    - recommendation: "Implement with monitoring"
  
  requires_validation:
    - findings with confidence < 0.6
    - validation_priority: ["database scaling", "api reliability"]
    - recommendation: "Validate before commitment"
```

## Example Usage
Best for: Analyst research synthesis, Architect decision documentation, PM feasibility assessment