# APM Document Registry Index

## Overview
This directory contains the document registry system for the MCP Debug Host project, providing intelligent document placement and organization patterns for the APM (Agentic Persona Mapping) framework.

## Registry Files

### document-registry.yaml
**Primary registry file** containing:
- Document type definitions
- Location mappings
- Naming conventions
- Placement rules
- MCP Debug Host integration patterns
- Agent-specific document creation patterns

## Key Features

### MCP Debug Host Integration
- Server management documentation via MCP tools
- Real-time dashboard integration (http://localhost:8080)
- Live log streaming and session persistence
- Development workflow optimization

### APM Framework Support
- Native sub-agent architecture
- Parallel processing capabilities (4-8x faster generation)
- Zero CLI crash prevention
- Performance optimization patterns

### Document Organization
- **Core Documents**: Foundation project documentation
- **Epics**: Large-scale feature documentation
- **Stories**: Individual user story specifications
- **QA**: Testing and validation documentation
- **Reports**: Technical analysis and research
- **Architecture**: System design documentation

## Usage by APM Agents

### Document Creation Patterns
- **Analyst**: Research reports → `project_docs/reports/`
- **PM**: PRD, epics → `project_docs/base/`, `project_docs/epics/`
- **Architect**: Architecture docs → `project_docs/architecture/`
- **QA**: Test plans, reports → `project_docs/qa/`
- **Developer**: Implementation guides → `project_docs/docs/`

### Naming Conventions
- Kebab-case, lowercase, no spaces
- Epic pattern: `epic-{number}.md`
- Story pattern: `story-{epic}-{story}-{slug}.md`
- Report pattern: `{type}-report-{date}.md`

### Metadata Standards
All documents should include:
- Title, created_date, last_modified
- Author_agent, document_type, status
- APM-specific metadata (agent_persona, sub_agents_involved)

## Templates
Template files are organized in `.apm/templates/` with categories:
- `core/` - Foundation document templates
- `epics/` - Epic documentation templates
- `stories/` - User story templates
- `qa/` - Quality assurance templates
- `reports/` - Analysis and research templates
- `architecture/` - System design templates

## Integration Features

### Search and Discovery
- Epic search: `epic-{number}*`
- Story search: `story-{epic}-{story}*`
- Date search: `*{date}*`
- Agent search: `*{agent_name}*`
- MCP references: `start_dev_server|server_logs|server_status`

### Performance Optimization
- Parallel document generation
- Template and metadata caching
- Search index optimization
- Live updates and dashboard integration

## Maintenance
- Automatic archive policy for deprecated docs
- Link validation and reference updates
- Index maintenance and metadata registry updates
- Performance monitoring and optimization