# PM Command: Parallel PRD Creation

## Command Overview
**Command**: `/parallel-prd`  
**Purpose**: Accelerated PRD creation using native sub-agents  
**Performance**: 4x faster than sequential (5 hours → 1.25 hours)  
**Method**: Natural language sub-agent coordination

## Natural Language Implementation

When user requests `/parallel-prd`, execute as PM persona:

### Phase 1: PRD Foundation Coordination

```markdown
I need comprehensive PRD development across all critical sections. Let me coordinate with specialized PM agents to ensure thorough coverage and quality.

"I need a PM agent to analyze market context and create user foundation
Context: {{CONTEXT}}
Focus: User persona analysis, market opportunity assessment, competitive landscape, user journey mapping, pain point identification, and business value proposition creation"

"I need another PM agent to define product scope and MVP boundaries
Context: {{CONTEXT}}
Focus: Core feature identification, MVP boundary definition, feature prioritization matrix, phased rollout strategy, technical complexity assessment, and resource requirement analysis"

"I need a PM agent to create technical architecture and constraint analysis
Context: {{CONTEXT}}
Focus: Technology stack recommendations, architecture patterns, integration requirements, scalability considerations, deployment strategy, and technical constraint documentation"

"I need a PM agent to develop epic structure and story decomposition
Context: {{CONTEXT}}
Focus: Logical epic grouping, story breakdown using INVEST principles, dependency analysis, implementation sequencing, acceptance criteria frameworks, and testing alignment"

"I need a PM agent to define success metrics and KPI framework
Context: {{CONTEXT}}
Focus: SMART goal definitions, user engagement metrics, business impact measurements, technical performance indicators, A/B testing strategy, and success milestones"

"I need an Architect agent to provide technical requirements validation
Context: {{CONTEXT}}
Focus: Architecture requirements, system constraints, integration needs, performance requirements, and technical feasibility validation"
```

### Phase 2: PRD Integration & Synthesis

After sub-agents complete their analysis:

1. **User Experience Coherence**: Ensure user personas align with epic structure and metrics
2. **Technical Feasibility Validation**: Validate scope aligns with technical constraints
3. **Business Value Alignment**: Ensure features trace to business objectives
4. **Implementation Sequencing**: Optimize epic and story order for development efficiency
5. **Success Measurement**: Align KPIs with user personas and business goals
6. **Risk Assessment**: Identify scope, technical, and timeline risks

### Phase 3: Collaborative PRD Development

Generate comprehensive PRD with integrated sections:
- **Executive Summary & Goals**: Business objectives with success criteria
- **User Personas & Journeys**: Detailed user analysis with pain points
- **Product Scope & MVP Definition**: Clear boundaries with feature prioritization
- **Technical Assumptions**: Architecture decisions with constraints
- **Epic Structure**: Logical grouping with dependency analysis
- **User Stories**: INVEST-compliant stories with acceptance criteria
- **Success Metrics**: Measurable KPIs with analytics requirements
- **Implementation Roadmap**: Phased approach with timeline estimates

## Performance Metrics

- **Target Performance**: 4x improvement (5 hours → 1.25 hours)
- **Quality Measures**: Completeness, business alignment, technical feasibility
- **Success Criteria**: Implementation-ready PRD with comprehensive specifications

## Integration Points

- **Input**: Business requirements, user research, technical constraints
- **Dependencies**: Stakeholder alignment, market research availability
- **Output**: Complete PRD ready for development planning
- **Handoff**: Development team for implementation, Architect for design

## Usage Examples

```markdown
User: "/parallel-prd for our new customer support chatbot platform"

PM: I'll coordinate comprehensive PRD creation for your customer support chatbot platform. Let me engage specialized PM agents for parallel development...

[Executes natural language coordination with 6 sub-agents]
[Synthesizes market, technical, and implementation analysis]
[Delivers complete PRD in 1.25 hours with 12 sections and 28 pages]
```

## PRD Section Development

### Executive Summary & Goals
Generated from market analysis synthesis:
- **Problem Statement**: Market opportunity with user pain points
- **Business Objectives**: Clear goals with success criteria
- **Value Proposition**: Competitive differentiation with benefits
- **Success Metrics**: Measurable outcomes with target values

### User Personas & Journeys
Generated from user analysis synthesis:
- **Primary Personas**: Detailed user profiles with characteristics
- **User Journeys**: Current and future state workflows
- **Pain Points**: Specific problems with impact assessment
- **Success Scenarios**: Desired outcomes with value delivery

### Product Scope & MVP Definition
Generated from scope analysis synthesis:
- **Core Features**: Essential functionality for MVP
- **Feature Prioritization**: Impact vs effort matrix with rationale
- **Scope Boundaries**: What's included and excluded
- **Phased Rollout**: Release strategy with incremental value

### Technical Assumptions
Generated from technical analysis synthesis:
- **Architecture Decisions**: Technology stack with rationale
- **Integration Requirements**: External systems and APIs
- **Performance Targets**: Response times and scalability needs
- **Security Requirements**: Data protection and compliance needs

### Epic Structure & User Stories
Generated from decomposition analysis synthesis:
- **Epic Organization**: Logical groupings aligned with user journeys
- **Story Breakdown**: INVEST-compliant stories with clear value
- **Acceptance Criteria**: Testable conditions for story completion
- **Dependency Mapping**: Story relationships and sequencing

### Success Metrics & Analytics
Generated from metrics framework synthesis:
- **Business Metrics**: Revenue, conversion, retention targets
- **User Metrics**: Engagement, satisfaction, adoption measures
- **Technical Metrics**: Performance, reliability, scalability indicators
- **Analytics Implementation**: Tracking, measurement, reporting requirements

## Workflow Integration

### Standard PRD Flow
1. **Market & User Analysis** → User personas and problem definition
2. **Scope & MVP Definition** → Feature prioritization and boundaries
3. **Technical Architecture** → Feasibility validation and constraints
4. **Epic & Story Structure** → Implementation planning and sequencing
5. **Success Metrics** → Measurement framework and analytics
6. **Integration & Review** → Comprehensive PRD synthesis

### Collaborative Refinement Options
After parallel development, offer refinement:
- **Critical Self-Review**: Goal alignment and assumption validation
- **Alternative Solutions**: Feature and approach alternatives
- **User Journey Stress Test**: Edge case and error scenario analysis
- **Deep Constraint Dive**: Technical and business limitation exploration
- **Feature Brainstorming**: Creative enhancement and innovation
- **Future Evolution**: Roadmap extension and scalability planning

## Quality Assurance

- ✅ All PRD sections are complete and comprehensive
- ✅ User personas align with business objectives
- ✅ Technical feasibility is validated with constraints
- ✅ Epic and story structure supports efficient development
- ✅ Success metrics are measurable and achievable
- ✅ Implementation roadmap is realistic and sequenced
- ✅ 4x performance improvement achieved
- ✅ PRD quality score >95/100 with stakeholder satisfaction