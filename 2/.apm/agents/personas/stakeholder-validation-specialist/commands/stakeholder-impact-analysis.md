# Stakeholder Impact Analysis Command

## Command: `/stakeholder-impact`

### Purpose
Deep-dive analysis of specific features or requirements across all stakeholder groups, quantifying impact levels and identifying optimization opportunities.

### Context
**Analysis Focus**: Individual feature/requirement impact assessment  
**Stakeholder Coverage**: All 6 primary groups (Developers, DevOps, Security, Compliance, Product, Team Leads)  
**Impact Dimensions**: Functional, Operational, Strategic, Risk, ROI  

### Execution Framework

#### 1. Multi-Dimensional Impact Assessment

```markdown
## Feature Impact Analysis Template

### Feature: [Feature Name]
**Sprint**: [3.1/3.2/3.3/3.4]
**Priority**: [P0/P1/P2]
**Effort**: [Low/Medium/High]

### Developer Impact Analysis
**Functional Impact**: [1-10 scale]
- Debugging workflow improvement: [Score]
- Context switching reduction: [Score]  
- Learning curve complexity: [Score]
- Integration with existing tools: [Score]

**Operational Impact**: [1-10 scale]
- Daily workflow change: [Score]
- Productivity gain potential: [Score]
- Error reduction capability: [Score]
- Time-to-resolution improvement: [Score]

**Strategic Value**: [1-10 scale]
- Alignment with 40% debugging improvement goal: [Score]
- Long-term skill development: [Score]
- Team collaboration enhancement: [Score]

**Risk Factors**:
- Adoption resistance: [Low/Medium/High]
- Performance impact on development: [Low/Medium/High]
- Complexity introduction: [Low/Medium/High]

### DevOps Impact Analysis  
**Functional Impact**: [1-10 scale]
- Monitoring capability enhancement: [Score]
- System visibility improvement: [Score]
- Operational efficiency gain: [Score]
- Troubleshooting support: [Score]

**Operational Impact**: [1-10 scale]
- Infrastructure management improvement: [Score]
- Resource optimization capability: [Score]
- Incident response enhancement: [Score]
- Capacity planning support: [Score]

**Strategic Value**: [1-10 scale]
- Enterprise scalability support: [Score]
- Operational maturity advancement: [Score]
- Cost reduction potential: [Score]

**Risk Factors**:
- System stability impact: [Low/Medium/High]
- Performance overhead: [Low/Medium/High]
- Operational complexity: [Low/Medium/High]

### Security Impact Analysis
**Functional Impact**: [1-10 scale]
- Security posture improvement: [Score]
- Vulnerability detection capability: [Score]
- Access control enhancement: [Score]
- Audit trail completeness: [Score]

**Operational Impact**: [1-10 scale]
- Security monitoring improvement: [Score]
- Incident detection speed: [Score]
- Compliance reporting automation: [Score]
- Risk reduction quantification: [Score]

**Strategic Value**: [1-10 scale]
- Regulatory compliance support: [Score]
- Enterprise security maturity: [Score]
- Risk management enhancement: [Score]

**Risk Factors**:
- New attack vectors: [Low/Medium/High]
- Data exposure risk: [Low/Medium/High]
- Security overhead: [Low/Medium/High]

### Compliance Impact Analysis
**Functional Impact**: [1-10 scale]
- Regulatory requirement coverage: [Score]
- Audit trail completeness: [Score]
- Data governance support: [Score]
- Reporting automation: [Score]

**Operational Impact**: [1-10 scale]
- Compliance process efficiency: [Score]
- Audit preparation time reduction: [Score]
- Manual validation elimination: [Score]
- Documentation automation: [Score]

**Strategic Value**: [1-10 scale]
- GDPR compliance advancement: [Score]
- SOC 2 readiness improvement: [Score]
- Regulatory risk reduction: [Score]

**Risk Factors**:
- Compliance gap introduction: [Low/Medium/High]
- Data retention violations: [Low/Medium/High]
- Regulatory interpretation issues: [Low/Medium/High]

### Product Owner Impact Analysis
**Functional Impact**: [1-10 scale]
- Business value demonstration: [Score]
- User adoption potential: [Score]
- Competitive advantage creation: [Score]
- Market differentiation: [Score]

**Operational Impact**: [1-10 scale]
- Revenue impact potential: [Score]
- Cost reduction achievement: [Score]
- Customer satisfaction improvement: [Score]
- Market positioning enhancement: [Score]

**Strategic Value**: [1-10 scale]
- Product roadmap alignment: [Score]
- Business model support: [Score]
- Growth enablement: [Score]

**Risk Factors**:
- Market acceptance uncertainty: [Low/Medium/High]
- ROI realization delay: [Low/Medium/High]
- Competitive response risk: [Low/Medium/High]

### Team Lead Impact Analysis
**Functional Impact**: [1-10 scale]
- Team productivity visibility: [Score]
- Resource utilization insight: [Score]
- Bottleneck identification: [Score]
- Performance tracking capability: [Score]

**Operational Impact**: [1-10 scale]
- Management efficiency improvement: [Score]
- Team coordination enhancement: [Score]
- Decision-making support: [Score]
- Reporting automation: [Score]

**Strategic Value**: [1-10 scale]
- Team development support: [Score]
- Capacity planning improvement: [Score]
- Performance management enhancement: [Score]

**Risk Factors**:
- Team resistance to monitoring: [Low/Medium/High]
- Privacy concerns: [Low/Medium/High]
- Management overhead: [Low/Medium/High]
```

#### 2. Impact Aggregation and Weighting

```markdown
### Weighted Impact Calculation

#### Stakeholder Priority Weights (Sprint 3-4)
- Developers: 35%
- DevOps: 25% 
- Security: 15%
- Compliance: 10%
- Product: 10%
- Team Leads: 5%

#### Impact Score Calculation
**Feature Overall Impact Score** = 
(Developer_Score × 0.35) + 
(DevOps_Score × 0.25) + 
(Security_Score × 0.15) + 
(Compliance_Score × 0.10) + 
(Product_Score × 0.10) + 
(TeamLead_Score × 0.05)

#### Risk Factor Aggregation
**Overall Risk Level** = MAX(All_Risk_Factors)
- If any HIGH risk exists → Overall: HIGH
- If any MEDIUM risk exists (no HIGH) → Overall: MEDIUM  
- All LOW risks → Overall: LOW
```

#### 3. Comparative Impact Analysis

```markdown
### Feature Comparison Matrix

| Feature | Developer | DevOps | Security | Compliance | Product | Team Lead | Weighted | Risk |
|---------|-----------|--------|----------|------------|---------|-----------|----------|------|
| Real-time Log Stream | 9.5 | 8.0 | 6.5 | 7.0 | 8.5 | 7.0 | **8.2** | MED |
| Metrics Dashboard | 7.0 | 9.5 | 7.0 | 6.0 | 8.0 | 9.0 | **7.8** | LOW |
| Container Controls | 9.0 | 8.5 | 8.0 | 7.5 | 8.0 | 8.0 | **8.4** | MED |
| Advanced Filtering | 8.5 | 7.0 | 9.0 | 8.5 | 7.0 | 8.0 | **8.0** | LOW |
| Batch Operations | 7.5 | 9.0 | 6.0 | 7.0 | 7.5 | 8.5 | **7.6** | HIGH |
```

#### 4. Impact Optimization Strategies

```markdown
### High-Impact, Low-Risk Features (Priority: Implement First)
- Features with Weighted Score >8.0 and Risk ≤ MEDIUM
- Fast implementation, high stakeholder value
- Sprint 3 focus candidates

### High-Impact, High-Risk Features (Priority: Risk Mitigation Required)
- Features with Weighted Score >8.0 and Risk = HIGH  
- Require detailed risk mitigation planning
- Phased implementation recommended

### Medium-Impact Features (Priority: Sprint 4 or Later)
- Features with Weighted Score 6.0-8.0
- Implementation after high-impact features
- Consider effort vs. impact trade-offs

### Low-Impact Features (Priority: Defer)
- Features with Weighted Score <6.0
- Minimal stakeholder value
- Consider removal from sprint scope
```

#### 5. Stakeholder Communication Framework

```markdown
### Developer Communication
**Focus**: Productivity gains, workflow improvements, technical benefits
**Messaging**: "This feature will reduce debugging time by X minutes per issue"
**Success Metrics**: Time-to-resolution, context switches, error rates

### DevOps Communication  
**Focus**: Operational efficiency, system visibility, enterprise capabilities
**Messaging**: "This enables proactive monitoring and reduces incident response time"
**Success Metrics**: MTTR, system visibility, operational efficiency

### Security Communication
**Focus**: Risk reduction, compliance support, security posture
**Messaging**: "This enhances security monitoring while maintaining audit trails"
**Success Metrics**: Security incidents, audit completeness, risk scores

### Compliance Communication
**Focus**: Regulatory adherence, audit readiness, governance support
**Messaging**: "This automates compliance reporting and reduces manual validation"
**Success Metrics**: Compliance scores, audit preparation time, violations

### Product Communication
**Focus**: Business value, competitive advantage, ROI
**Messaging**: "This delivers measurable productivity gains and market differentiation" 
**Success Metrics**: ROI, user adoption, competitive positioning

### Team Lead Communication
**Focus**: Team visibility, performance insights, management efficiency
**Messaging**: "This provides team productivity insights and bottleneck identification"
**Success Metrics**: Team performance, management efficiency, visibility quality
```

### 6. Output Format

```markdown
## Stakeholder Impact Analysis Report
**Feature**: [Feature Name]
**Analysis Date**: [Date]
**Analyst**: Stakeholder Validation Specialist

### Executive Summary
**Overall Impact Score**: [Score]/10
**Primary Beneficiaries**: [Top 2 stakeholder groups]
**Risk Level**: [Low/Medium/High]
**Implementation Recommendation**: [Prioritize/Standard/Defer]

### Detailed Impact Breakdown
**Developers**: [Score]/10 - [Key impact areas]
**DevOps**: [Score]/10 - [Key impact areas]  
**Security**: [Score]/10 - [Key impact areas]
**Compliance**: [Score]/10 - [Key impact areas]
**Product**: [Score]/10 - [Key impact areas]
**Team Leads**: [Score]/10 - [Key impact areas]

### Risk Analysis
**High-Risk Areas**: [List with mitigation strategies]
**Medium-Risk Areas**: [List with monitoring requirements]
**Overall Risk Assessment**: [Analysis and recommendations]

### Optimization Recommendations
**Implementation Priority**: [High/Medium/Low]
**Stakeholder Communication Strategy**: [Key messages per group]
**Success Metrics**: [Measurable outcomes]
**Risk Mitigation**: [Required actions]

### Next Steps
**Immediate Actions**: [What needs to happen first]
**Stakeholder Engagement**: [Required approvals/feedback]
**Implementation Considerations**: [Technical/operational factors]
```

This command provides detailed, quantified impact analysis enabling data-driven decisions about feature prioritization and stakeholder alignment optimization.