# Analyst Command: Parallel Research Prompt Creation

## Command Overview
**Command**: `/parallel-research-prompt`  
**Purpose**: Accelerated deep research prompt design using native sub-agents  
**Performance**: 4x faster than sequential (2 hours → 30 minutes)  
**Method**: Natural language sub-agent coordination

## Natural Language Implementation

When user requests `/parallel-research-prompt`, execute as Analyst persona:

### Phase 1: Research Design Coordination

```markdown
I need comprehensive research prompt design covering all critical aspects. Let me coordinate with research specialists to ensure thorough methodology.

"I need an Analyst agent to define research objectives and scope
Context: {{CONTEXT}}
Focus: Research question formulation, hypothesis development, scope boundaries, success criteria, timeline planning, and deliverable specifications"

"I need another Analyst agent to design research methodology and approach
Context: {{CONTEXT}}
Focus: Research method selection, data collection strategy, sampling methodology, validation approaches, bias mitigation, and quality assurance procedures"

"I need an Analyst agent to identify information sources and data strategy
Context: {{CONTEXT}}
Focus: Primary source identification, secondary source evaluation, expert networks, literature review approach, and data verification procedures"

"I need an Analyst agent to create research execution and analysis framework
Context: {{CONTEXT}}
Focus: Execution timeline, data collection procedures, analysis methodology, quality controls, and reporting framework design"
```

### Phase 2: Research Integration

After sub-agents complete their design:

1. **Objective-Methodology Alignment**: Ensure research methods address objectives effectively
2. **Source-Quality Optimization**: Validate information sources provide reliable data
3. **Execution-Timeline Feasibility**: Confirm approach fits constraints
4. **Analysis-Deliverable Coherence**: Validate analysis supports required outputs
5. **Quality-Reliability Assurance**: Ensure research maintains credibility standards

### Phase 3: Research Prompt Development

Generate comprehensive research prompt with:
- **Clear Research Questions**: Specific, answerable, measurable objectives
- **Rigorous Methodology**: Systematic approach with quality validation
- **Comprehensive Source Strategy**: Primary, secondary, and expert sources
- **Execution Framework**: Timeline, procedures, and analysis approach
- **Quality Standards**: Validity, reliability, and verification procedures

## Performance Metrics

- **Target Performance**: 4x improvement (2 hours → 30 minutes)
- **Quality Measures**: Methodological rigor, source reliability, execution readiness
- **Success Criteria**: Research-ready prompt with systematic approach

## Integration Points

- **Input**: Research topic, objectives, constraints, timeline
- **Dependencies**: Subject matter clarity, resource availability
- **Output**: Complete research prompt ready for execution
- **Handoff**: Research team for execution, stakeholders for approval

## Usage Examples

```markdown
User: "/parallel-research-prompt for competitive analysis of AI-powered customer service tools"

Analyst: I'll coordinate comprehensive research prompt design for AI customer service competitive analysis. Let me engage research methodology specialists...

[Executes natural language coordination with 4 sub-agents]
[Synthesizes methodological framework]
[Delivers research-ready prompt in 30 minutes]
```

## Research Prompt Template

Generated prompts follow this structure:

```markdown
# Deep Research Prompt: {{TOPIC}}

## Research Objectives
- Primary Question: {{SPECIFIC_QUESTION}}
- Secondary Questions: {{SUPPORTING_QUESTIONS}}
- Success Criteria: {{MEASURABLE_OUTCOMES}}

## Methodology
- Approach: {{RESEARCH_METHOD}}
- Data Collection: {{SOURCES_PROCEDURES}}
- Analysis Framework: {{ANALYSIS_APPROACH}}

## Information Sources
- Primary Sources: {{DIRECT_SOURCES}}
- Secondary Sources: {{LITERATURE_REPORTS}}
- Expert Networks: {{SUBJECT_EXPERTS}}

## Execution Plan
- Timeline: {{PHASES_MILESTONES}}
- Quality Controls: {{VALIDATION_PROCEDURES}}
- Deliverables: {{OUTPUT_REQUIREMENTS}}
```

## Quality Assurance

- ✅ Research questions are specific and answerable
- ✅ Methodology is systematic and rigorous
- ✅ Sources are credible and comprehensive
- ✅ Execution plan is feasible and detailed
- ✅ Quality standards ensure reliability
- ✅ 4x performance improvement achieved