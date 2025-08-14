# APM Commands Quick Reference Guide
## Version 4.0.0 - At-a-Glance Command Summary

Quick lookup for all APM commands with essential information. For detailed documentation, see the comprehensive guides.

---

## 🎯 Command Categories Quick Nav

| Category | Commands | Key Feature |
|----------|----------|-------------|
| [Core Orchestrator](#core-orchestrator) | 6 | Central control & coordination |
| [Persona Activation](#persona-activation) | 9 | Specialized agent activation |
| [Parallel Execution](#parallel-execution) | 25 | 4-8x performance boost |
| [QA Framework](#qa-framework) | 11 | AI/ML-powered testing |
| [Project Management](#project-management) | 15 | Planning & tracking |
| [Development](#development) | 8 | Implementation & coding |
| [Documentation](#documentation) | 6 | Document processing |
| [Utilities](#utilities) | 5 | Helper commands |

---

## Core Orchestrator

| Command | Purpose | Key Options | Performance |
|---------|---------|-------------|-------------|
| `/ap` or `/ap_orchestrator` | Launch central orchestrator | `--resume`, `--status` | 2.3s init |
| `/handoff <persona>` | Direct agent transition | `--notes`, `--task` | 0.8s |
| `/switch <persona>` | Switch with compaction | `--compact-level` | 1.5s |
| `/wrap` | Complete session | `--summary-level` | 1.2s |
| `/session-note-setup` | Initialize session mgmt | `--reset`, `--template` | 0.5s |
| `/personas` | List available personas | `--detailed`, `--filter` | 0.3s |

---

## Persona Activation

| Command | Persona | Specialization | Parallel Cmds |
|---------|---------|----------------|---------------|
| `/analyst` | Analyst | Research & requirements | 4 |
| `/pm` | Product Manager | PRDs & roadmaps | 3 |
| `/architect` | Architect | System design | 2 |
| `/design-architect` | Design Architect | UI/UX & frontend | 2 |
| `/po` | Product Owner | Backlog management | 5 |
| `/sm` | Scrum Master | Agile processes | 4 |
| `/dev` or `/developer` | Developer | Code implementation | 1 |
| `/qa` | QA Engineer | Testing & quality | 6 |
| `/subtask` | Subtask Specialist | Task breakdown | 0 |

---

## Parallel Execution (Native Sub-Agents)

### Requirements & Research
| Command | Sub-Agents | Speedup | Use Case |
|---------|------------|---------|----------|
| `/parallel-requirements` | 4 | 3.8x | Multi-source requirements |
| `/parallel-research-prompt` | 4 | 4.2x | Parallel research |
| `/parallel-brainstorming` | 4 | 5.1x | Multi-perspective ideation |
| `/parallel-stakeholder-review` | 4 | 3.5x | Stakeholder analysis |
| `/parallel-prioritization` | 4 | 4.1x | Multi-criteria ranking |

### Architecture & Design
| Command | Sub-Agents | Speedup | Use Case |
|---------|------------|---------|----------|
| `/parallel-architecture` | 4 | 4.0x | System design |
| `/parallel-frontend-architecture` | 4 | 3.7x | UI architecture |
| `/parallel-ai-prompt` | 4 | 4.5x | AI-enhanced design |

### Project Management
| Command | Sub-Agents | Speedup | Use Case |
|---------|------------|---------|----------|
| `/parallel-prd` | 5 | 3.5x | PRD creation |
| `/parallel-epic` | 4 | 4.2x | Epic development |
| `/parallel-stories` | 4 | 5.3x | Batch story generation |
| `/parallel-acceptance-criteria` | 4 | 3.9x | AC definition |
| `/parallel-validation` | 4 | 3.6x | Multi-aspect validation |

### Development
| Command | Sub-Agents | Speedup | Use Case |
|---------|------------|---------|----------|
| `/parallel-sprint` | 4 | **4.6x** | Sprint execution |

### Testing & Quality
| Command | Sub-Agents | Speedup | Use Case |
|---------|------------|---------|----------|
| `/parallel-qa-framework` | 4 | 4.0x | Complete QA execution |
| `/parallel-test-strategy` | 4 | 3.8x | Strategy development |
| `/parallel-test-plan` | 4 | 4.3x | Test planning |
| `/parallel-automation-plan` | 4 | 3.7x | Automation planning |
| `/parallel-quality-review` | 4 | 4.5x | Quality review |
| `/parallel-regression-suite` | 4 | 5.2x | Regression testing |

### Documentation
| Command | Sub-Agents | Speedup | Use Case |
|---------|------------|---------|----------|
| `/parallel-doc-sharding` | 4 | **6.7x** | Document processing |
| `/parallel-library-indexing` | 5 | **7.1x** | Knowledge indexing |

### Course Correction
| Command | Sub-Agents | Speedup | Use Case |
|---------|------------|---------|----------|
| `/parallel-checklist` | 4 | 3.4x | Checklist generation |
| `/parallel-course-correction` | 4 | 4.0x | Adjustment planning |

---

## QA Framework (AI/ML-Powered)

| Command | Feature | Accuracy/Impact | Key Benefit |
|---------|---------|-----------------|-------------|
| `/qa-framework` | Complete QA system | - | Full testing access |
| `/qa-predict` | Failure prediction | **92%** accuracy | 68% bug reduction |
| `/qa-optimize` | Test optimization | **63%** time saved | 2.8x efficiency |
| `/qa-anomaly` | Anomaly detection | **94%** precision | 45% earlier detection |
| `/qa-insights` | AI insights | **88%** accuracy | 3.2x decision speed |
| `/run-tests` | Test execution | - | Smart execution |
| `/monitor-tests` | Real-time monitoring | - | Live updates |
| `/show-test-status` | Status dashboard | - | Comprehensive view |
| `/test-dashboard` | Interactive dashboard | - | Web-based UI |
| `/test-metrics` | Metrics analysis | - | Trend analysis |
| `/test-plan` | Test planning | - | Resource allocation |

---

## Project Management

| Command | Purpose | Output | Typical Time |
|---------|---------|--------|--------------|
| `/project-brief` | Project initialization | Brief document | 15 min |
| `/prd` | PRD creation | Requirements doc | 45 min |
| `/epic` | Epic management | Epic + stories | 30 min |
| `/stories` | Story generation | User stories | 20 min |
| `/groom` | Backlog grooming | Refined backlog | 25 min |
| `/prioritization` | Feature ranking | Priority matrix | 15 min |
| `/acceptance-criteria` | AC definition | Test criteria | 10 min |
| `/validation` | Story validation | Validation report | 15 min |
| `/next-story` | Story progression | Next story ready | 5 min |
| `/checklist` | Task checklists | Checklist doc | 10 min |
| `/course-correction` | Agile adjustments | Action plan | 20 min |
| `/requirements` | Requirements gathering | Requirements doc | 30 min |
| `/stakeholder-review` | Stakeholder feedback | Review summary | 25 min |
| `/ux-spec` | UX specifications | UX document | 35 min |
| `/release` | Release management | Release plan | 30 min |

---

## Development

| Command | Purpose | Focus | Integration |
|---------|---------|-------|-------------|
| `/architecture` | System design | Technical | Backend |
| `/frontend-architecture` | UI architecture | Frontend | UI/UX |
| `/automation-plan` | Automation strategy | Testing | CI/CD |
| `/ai-prompt` | AI integration | AI/ML | Various |
| `/git-commit-all` | Version control | Git | Repository |
| `/buildit` | Build distribution | Packaging | Release |
| `/version` | Version management | Versioning | Release |
| `/update-all-documentation` | Doc updates | Documentation | All |

---

## Documentation

| Command | Purpose | Processing | Speed |
|---------|---------|------------|-------|
| `/doc-sharding` | Document segmentation | Intelligent | Fast |
| `/library-indexing` | Knowledge indexing | Comprehensive | Fast |
| `/doc-compliance` | Compliance check | Standard | Medium |
| `/doc-compliance-enhanced` | Advanced compliance | Deep | Slow |
| `/organize-docs` | Document organization | Structural | Fast |
| `/research-prompt` | Research documentation | Analytical | Medium |

---

## Utilities

| Command | Purpose | Scope | Frequency |
|---------|---------|-------|-----------|
| `/test-strategy` | Test strategy creation | Planning | Per release |
| `/test` | General testing | Execution | Daily |
| `/review` | Code/doc review | Quality | Per PR |
| `/quality-review` | Quality assessment | Comprehensive | Sprint |
| `/regression-suite` | Regression testing | Validation | Per release |

---

## 🚀 Common Workflows

### New Project Start
```bash
/ap → /analyst → /pm → /architect → /po → /sm → /dev → /qa
```

### Sprint Execution (Parallel)
```bash
/ap → /parallel-sprint --agents=4
```

### PRD Creation (Fast)
```bash
/pm → /parallel-prd --template=comprehensive
```

### Full QA Cycle
```bash
/qa → /qa-framework → /qa-predict → /run-tests → /qa-insights
```

### Document Processing
```bash
/parallel-doc-sharding --chunks=auto → /parallel-library-indexing
```

---

## 💡 Performance Tips

### Speed Optimization
- Use `/parallel-*` commands for tasks >30 minutes
- Leverage `/qa-optimize` for test execution
- Apply `/parallel-sprint` for development

### Quality Focus
- Start with `/qa-predict` before testing
- Use `/qa-anomaly` for continuous monitoring
- Apply `/parallel-quality-review` for comprehensive checks

### Efficiency Balance
- Combine personas for coverage
- Use handoff notes for context
- Archive sessions regularly

---

## 🎯 Command Selection Matrix

| If you need to... | Use this command | Alternative |
|-------------------|------------------|-------------|
| Start APM session | `/ap` | `/ap_orchestrator` |
| Create requirements | `/analyst` + `/requirements` | `/parallel-requirements` |
| Design system | `/architect` | `/parallel-architecture` |
| Create PRD | `/pm` + `/prd` | `/parallel-prd` |
| Manage backlog | `/po` + `/groom` | - |
| Run sprint | `/dev` | `/parallel-sprint` |
| Test thoroughly | `/qa` + `/qa-framework` | `/parallel-qa-framework` |
| Process documents | `/doc-sharding` | `/parallel-doc-sharding` |
| Get insights | `/qa-insights` | - |
| Wrap up work | `/wrap` | - |

---

## 📊 Performance Benchmarks

### Sequential vs Parallel
| Operation | Sequential | Parallel | Improvement |
|-----------|------------|----------|-------------|
| Sprint (5 stories) | 8.5h | 1.8h | **4.6x** |
| PRD Creation | 3.5h | 1.0h | **3.5x** |
| Full Testing | 2.0h | 0.5h | **4.0x** |
| Doc Processing | 6.0h | 0.9h | **6.7x** |

### AI/ML Impact
| Feature | Without AI | With AI | Benefit |
|---------|------------|---------|---------|
| Bug Detection | 100% | 235% | **+135%** |
| Test Time | 100% | 37% | **-63%** |
| Coverage | 100% | 121% | **+21%** |

---

## 🔑 Essential Options

### Most Used Options
- `--parallel=true` - Enable parallelization
- `--agents=4` - Set sub-agent count
- `--detailed=true` - Verbose output
- `--format=markdown` - Output format
- `--strategy=balanced` - Execution strategy

### Performance Options
- `--priority=velocity` - Speed focus
- `--optimization=aggressive` - Max optimization
- `--cache=true` - Enable caching
- `--fail-fast=true` - Quick failure

### Quality Options
- `--coverage=comprehensive` - Full coverage
- `--validation=strict` - Strict validation
- `--review=detailed` - Thorough review
- `--testing=all` - Complete testing

---

## 🚨 Quick Troubleshooting

| Issue | Quick Fix | Command |
|-------|-----------|---------|
| Slow performance | Use parallel | Add `/parallel-` prefix |
| Test failures | Predict first | `/qa-predict` |
| Context lost | Check notes | `/session-note-setup` |
| Agent confusion | List personas | `/personas` |
| Memory issues | Compact session | `/switch --compact-level=full` |

---

## 📚 Documentation Links

- [Master Index](./APM-COMMAND-DOCUMENTATION-MASTER.md)
- [Orchestrator Details](./APM-COMMANDS-01-ORCHESTRATOR.md)
- [Persona Details](./APM-COMMANDS-02-PERSONAS.md)
- [Parallel Details](./APM-COMMANDS-03-PARALLEL.md)
- [QA Framework Details](./APM-COMMANDS-04-QA-FRAMEWORK.md)

---

## 🎓 Getting Started Checklist

- [ ] Install APM: `./installer/install.sh`
- [ ] Initialize session: `/session-note-setup`
- [ ] Launch orchestrator: `/ap`
- [ ] List personas: `/personas --detailed`
- [ ] Try parallel command: `/parallel-brainstorming`
- [ ] Check QA capabilities: `/qa-framework`
- [ ] Review documentation: This guide

---

*APM Commands Quick Reference - v4.0.0*
*Native Sub-Agent Architecture | AI/ML-Powered*
*For detailed documentation, see comprehensive guides*