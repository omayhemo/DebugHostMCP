# Story 2.1: Project Registration System

| Field | Value |
|-------|--------|
| **Epic** | Phase 2: Project Management |
| **Story ID** | 2.1 |
| **Title** | Project Registration System with Workspace Scanning |
| **Status** | Draft |
| **Priority** | High |
| **Story Points** | 8 |
| **Sprint** | Sprint 2 |
| **Assignee** | Developer Agent |

## 📝 User Story

**As a** developer using Claude Code with MCP Debug Host
**I want** to register my project workspace with the debug host system
**So that** I can manage my development environment with proper tech stack detection and configuration

## ✅ Acceptance Criteria

### AC1: Workspace Detection and Registration
- **Given** I have a project workspace with recognizable files (package.json, requirements.txt, composer.json, etc.)
- **When** I call the `host.register` MCP tool with my workspace path
- **Then** the system should:
  - Scan the workspace and detect the tech stack automatically
  - Create a unique project ID
  - Store project metadata in the registry
  - Return success confirmation with project details

### AC2: Tech Stack Auto-Detection
- **Given** a workspace contains technology indicator files
- **When** the registration scans the directory
- **Then** it should detect:
  - Node.js projects (package.json, .nvmrc, yarn.lock)
  - Python projects (requirements.txt, pyproject.toml, Pipfile)
  - PHP projects (composer.json, .php files)
  - Static sites (index.html, .css, .js files)
  - Mixed tech stacks (multiple indicators present)

### AC3: Port Allocation Integration
- **Given** a project is being registered with a detected tech stack
- **When** the registration process runs
- **Then** it should:
  - Request appropriate port range from Port Registry
  - Assign primary and backup ports
  - Store port assignments with the project
  - Validate ports are available

### AC4: Workspace Validation
- **Given** an invalid or inaccessible workspace path
- **When** registration is attempted
- **Then** it should:
  - Return clear error message
  - Not create partial registrations
  - Suggest valid workspace requirements

### AC5: Duplicate Prevention
- **Given** a workspace is already registered
- **When** registration is attempted again
- **Then** it should:
  - Detect existing registration
  - Offer to update existing project
  - Not create duplicate entries

## 🔧 Technical Requirements

### Core Components
- **Project Registry**: JSON-based persistent storage for project metadata
- **Workspace Scanner**: Module to detect tech stacks and project structure
- **Integration Points**: Docker Manager, Port Registry, MCP Tools

### Tech Stack Detection Rules
```javascript
const DETECTION_PATTERNS = {
  nodejs: ['package.json', '.nvmrc', 'yarn.lock', 'package-lock.json'],
  python: ['requirements.txt', 'pyproject.toml', 'Pipfile', 'setup.py'],
  php: ['composer.json', 'index.php', '*.php'],
  static: ['index.html', 'static/', 'public/', 'dist/']
};
```

### Data Model
```javascript
{
  projectId: "uuid-string",
  workspace: "/path/to/project",
  name: "project-name",
  techStack: ["node", "docker"],
  ports: {
    primary: 3001,
    backup: [3002, 3003]
  },
  registeredAt: "ISO-timestamp",
  lastAccessed: "ISO-timestamp",
  status: "registered|active|inactive"
}
```

### API Endpoints
- `POST /api/projects/register` - Register new project
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project registration
- `DELETE /api/projects/:id` - Unregister project

## 🏁 Definition of Done

### Requirements Met
- [ ] All functional requirements implemented
- [ ] All acceptance criteria met

### Coding Standards & Project Structure
- [ ] Adherence to MCP Debug Host operational guidelines
- [ ] Project structure compliance with existing codebase
- [ ] Tech stack alignment with Node.js/Express architecture
- [ ] API reference and data model compliance
- [ ] Security best practices (input validation, path sanitization)
- [ ] No new linter errors
- [ ] Proper code commenting for public APIs

### Testing
- [ ] Unit tests for workspace scanner
- [ ] Unit tests for project registry operations
- [ ] Integration tests for MCP tool registration
- [ ] All tests passing
- [ ] Test coverage >80% for new components

### Functionality & Verification
- [ ] Manual verification of all tech stack detection patterns
- [ ] Edge cases handled (symlinks, nested projects, missing files)

### Dependencies, Build & Configuration
- [ ] Successful project build
- [ ] Linting passes
- [ ] New dependencies approved and documented
- [ ] No security vulnerabilities
- [ ] Environment variables documented

### Documentation
- [ ] API documentation for new endpoints
- [ ] Developer guide for workspace scanning
- [ ] MCP tool usage examples

## 🧪 Test Scenarios

### Happy Path Tests
1. **Standard Node.js Project Registration**
   - Workspace with package.json
   - Expect: Tech stack detected, ports allocated, registration successful

2. **Multi-Tech Stack Detection**
   - Workspace with package.json AND requirements.txt
   - Expect: Both Node.js and Python detected

3. **Static Site Registration**
   - Workspace with index.html and assets
   - Expect: Static tech stack detected, appropriate port range

### Edge Cases
1. **Empty Workspace**
   - Directory with no recognizable files
   - Expect: Default/unknown tech stack, manual configuration option

2. **Nested Project Structures**
   - Monorepo with multiple package.json files
   - Expect: Root-level detection with notes about subprojects

3. **Symlinked Workspaces**
   - Workspace path is a symlink
   - Expect: Resolve to actual path, successful registration

### Error Scenarios
1. **Invalid Workspace Path**
   - Non-existent directory
   - Expect: Clear error, no partial registration

2. **Permission Denied**
   - Workspace not readable
   - Expect: Appropriate error message

3. **Registry Corruption**
   - Malformed project registry file
   - Expect: Recovery attempt, backup creation

## 📋 Implementation Tasks

### AP-TASKS-START
- [ ] Create `src/services/workspace-scanner.js`
- [ ] Create `src/services/project-registry.js` 
- [ ] Update `src/mcp-tools.js` with `host.register` tool
- [ ] Create `src/api/routes/projects.js`
- [ ] Create tests for workspace scanner
- [ ] Create tests for project registry
- [ ] Create integration tests for registration flow
- [ ] Update API documentation
### AP-TASKS-END

## 🔄 Dependencies

### Prerequisites
- Story 1.4: Port Registry System (✅ Complete)
- Story 1.3: Docker Manager Module (✅ Complete)

### Integrations Needed
- Port Registry for port allocation
- Docker Manager for container preparation
- MCP Tools for Claude Code integration

## 💼 Business Context

### Value Proposition
- Streamlines developer onboarding to MCP Debug Host
- Reduces manual configuration overhead
- Enables intelligent project-specific defaults
- Foundation for automated environment management

### Success Metrics
- Registration success rate >95%
- Tech stack detection accuracy >90%
- Average registration time <5 seconds

## 📝 Progress Log

### Development Notes
- Consider workspace caching for performance
- Tech stack detection may need extension for new frameworks
- Integration with existing project management tools possible

### Change Log
- v1.0: Initial story creation
- Focus on core registration functionality
- Extensible design for future tech stack additions

---

**Story Status**: Ready for Sprint 2 Planning
**Estimated Effort**: 8 Story Points
**Risk Level**: Medium (new component, multiple integrations)