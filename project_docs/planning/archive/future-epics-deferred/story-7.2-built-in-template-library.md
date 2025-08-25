# Story 7.2: Built-in Template Library (10 Popular Stacks)

**Story ID**: 7.2  
**Epic**: Project Templates & Development Accelerators (Epic 6)  
**Sprint**: 7  
**Story Points**: 8  
**Priority**: High  
**Created**: August 8, 2025  

## User Story

**As a** developer  
**I want** a curated library of built-in project templates for popular technology stacks  
**So that** I can quickly start projects with best practices, proper configuration, and industry-standard setups  

## Business Value

- **Time to Market**: Dramatically reduces project setup time from days to minutes
- **Best Practices**: Ensures all projects follow established patterns and conventions
- **Quality Assurance**: Pre-tested templates reduce configuration errors and bugs
- **Developer Onboarding**: New team members can start productive work immediately

## Acceptance Criteria

### Template Library Coverage
1. **GIVEN** the built-in template library is available  
   **WHEN** developers browse available templates  
   **THEN** 10+ production-ready templates covering major technology stacks are available  

2. **GIVEN** each template in the library  
   **WHEN** examining template quality  
   **THEN** templates include testing, linting, CI/CD, and documentation setups  

3. **GIVEN** templates are categorized by type  
   **WHEN** filtering templates  
   **THEN** clear categories (web apps, APIs, microservices, etc.) help developers find relevant templates  

### Full-Stack Application Templates
4. **GIVEN** a developer needs a complete web application  
   **WHEN** they select a full-stack template (MERN, LAMP, etc.)  
   **THEN** both frontend and backend are generated with proper integration  

5. **GIVEN** a full-stack template is generated  
   **WHEN** the project is initialized  
   **THEN** authentication, database integration, and API communication are pre-configured  

6. **GIVEN** full-stack templates include modern tooling  
   **WHEN** projects are generated  
   **THEN** hot reloading, TypeScript support, and build optimization are included  

### API and Backend Templates
7. **GIVEN** a developer needs to create an API service  
   **WHEN** they select backend templates (Express, FastAPI, Spring Boot)  
   **THEN** RESTful endpoints, middleware, and database integration are pre-configured  

8. **GIVEN** API templates are generated  
   **WHEN** examining the project structure  
   **THEN** OpenAPI documentation, validation, and error handling are included  

9. **GIVEN** microservice templates are available  
   **WHEN** developers create distributed systems  
   **THEN** service discovery, configuration management, and monitoring are pre-configured  

### Frontend Application Templates
10. **GIVEN** frontend-focused development is needed  
    **WHEN** selecting SPA templates (React, Vue, Angular)  
    **THEN** modern build tools, state management, and routing are configured  

11. **GIVEN** frontend templates include styling solutions  
    **WHEN** projects are generated  
    **THEN** CSS frameworks, component libraries, and design systems are integrated  

12. **GIVEN** frontend templates support multiple deployment targets  
    **WHEN** projects are built  
    **THEN** static hosting, CDN, and progressive web app configurations are available  

### Template Configuration and Customization
13. **GIVEN** developers have specific requirements  
    **WHEN** using templates with options  
    **THEN** database choices, authentication methods, and styling preferences can be selected  

14. **GIVEN** templates support environment-specific configurations  
    **WHEN** projects are generated  
    **THEN** development, staging, and production configurations are properly separated  

15. **GIVEN** templates include example implementations  
    **WHEN** projects are initialized  
    **THEN** sample features demonstrate proper usage patterns and best practices  

## Technical Requirements

### Built-in Template Definitions

#### 1. MERN Stack (MongoDB, Express, React, Node.js)
```yaml
metadata:
  name: "MERN Stack Application"
  description: "Full-stack JavaScript application with React frontend and Express API"
  version: "3.0.0"
  category: "fullstack"
  tags: ["react", "express", "mongodb", "node", "javascript"]

variables:
  - name: "include_auth"
    prompt: "Include JWT authentication?"
    type: "boolean" 
    default: true
  - name: "ui_framework"
    prompt: "Choose UI framework"
    type: "choice"
    choices: ["material-ui", "chakra-ui", "ant-design", "tailwind"]
    default: "material-ui"
```

#### 2. Next.js + Prisma + PostgreSQL
```yaml
metadata:
  name: "Next.js Full-Stack Application"
  description: "Modern React framework with Prisma ORM and PostgreSQL"
  version: "2.0.0"
  category: "fullstack"
  tags: ["nextjs", "prisma", "postgresql", "typescript", "react"]

variables:
  - name: "include_typescript"
    prompt: "Use TypeScript?"
    type: "boolean"
    default: true
  - name: "auth_provider"
    prompt: "Authentication provider"
    type: "choice"
    choices: ["next-auth", "auth0", "firebase", "none"]
    default: "next-auth"
```

#### 3. Vue.js + Laravel + MySQL (VLEMP)
```yaml
metadata:
  name: "Vue + Laravel Application"
  description: "Vue.js SPA with Laravel API backend and MySQL database"
  version: "1.5.0"
  category: "fullstack"
  tags: ["vue", "laravel", "mysql", "php", "spa"]

variables:
  - name: "vue_version"
    prompt: "Vue.js version"
    type: "choice"
    choices: ["vue2", "vue3"]
    default: "vue3"
  - name: "include_sanctum"
    prompt: "Include Laravel Sanctum for API authentication?"
    type: "boolean"
    default: true
```

#### 4. FastAPI + Pydantic + PostgreSQL
```yaml
metadata:
  name: "FastAPI REST API"
  description: "High-performance Python API with automatic documentation"
  version: "2.1.0"
  category: "backend"
  tags: ["fastapi", "python", "postgresql", "pydantic", "api"]

variables:
  - name: "include_auth"
    prompt: "Include OAuth2 authentication?"
    type: "boolean"
    default: true
  - name: "database_async"
    prompt: "Use async database operations?"
    type: "boolean"
    default: true
```

#### 5. Spring Boot + Maven + H2/PostgreSQL
```yaml
metadata:
  name: "Spring Boot REST API"
  description: "Enterprise Java application with Spring Boot framework"
  version: "1.8.0"
  category: "backend"
  tags: ["spring-boot", "java", "maven", "jpa", "enterprise"]

variables:
  - name: "database_type"
    prompt: "Choose database"
    type: "choice"
    choices: ["h2", "postgresql", "mysql"]
    default: "postgresql"
  - name: "include_security"
    prompt: "Include Spring Security?"
    type: "boolean"
    default: true
```

### Template Implementation Structure
```typescript
class BuiltInTemplateLibrary {
  private templates: Map<string, TemplateDefinition> = new Map();
  
  constructor() {
    this.initializeBuiltInTemplates();
  }

  private initializeBuiltInTemplates() {
    // Load all built-in templates
    const templateConfigs = [
      this.createMERNTemplate(),
      this.createNextJSTemplate(),
      this.createVueLaravelTemplate(),
      this.createFastAPITemplate(),
      this.createSpringBootTemplate(),
      this.createReactSPATemplate(),
      this.createExpressAPITemplate(),
      this.createDjangoTemplate(),
      this.createNestJSTemplate(),
      this.createMicroservicesTemplate()
    ];

    templateConfigs.forEach(template => {
      this.templates.set(template.metadata.name, template);
    });
  }

  private createMERNTemplate(): TemplateDefinition {
    return {
      metadata: {
        name: "mern-stack",
        displayName: "MERN Stack Application",
        description: "Full-stack JavaScript application with React frontend, Express API, and MongoDB",
        version: "3.0.0",
        category: "fullstack",
        tags: ["react", "express", "mongodb", "node", "javascript"],
        author: "MCP Debug Host Platform",
        complexity: "intermediate",
        estimatedSetupTime: "15 minutes"
      },
      
      requirements: {
        system: {
          node: ">=18.0.0",
          npm: ">=8.0.0",
          docker: ">=20.0.0"
        },
        resources: {
          memory: "2GB",
          storage: "3GB"
        }
      },

      variables: [
        {
          name: "project_name",
          prompt: "Project name",
          type: "string",
          required: true,
          pattern: "^[a-z][a-z0-9-]*$"
        },
        {
          name: "include_auth",
          prompt: "Include JWT authentication system?",
          type: "boolean",
          default: true
        },
        {
          name: "ui_framework",
          prompt: "Choose UI component library",
          type: "choice",
          choices: ["material-ui", "chakra-ui", "ant-design", "tailwind"],
          default: "material-ui"
        },
        {
          name: "include_typescript",
          prompt: "Use TypeScript?",
          type: "boolean",
          default: false
        }
      ],

      structure: [
        // Frontend structure
        { path: "frontend/", type: "directory" },
        { path: "frontend/package.json", type: "file", template: "mern/frontend-package.json.j2" },
        { path: "frontend/src/", type: "directory" },
        { path: "frontend/src/App.{{ 'tsx' if include_typescript else 'jsx' }}", 
          type: "file", template: "mern/react-app.j2" },
        
        // Backend structure  
        { path: "backend/", type: "directory" },
        { path: "backend/package.json", type: "file", template: "mern/backend-package.json.j2" },
        { path: "backend/src/", type: "directory" },
        { path: "backend/src/app.js", type: "file", template: "mern/express-app.js.j2" },
        
        // Auth components (conditional)
        { path: "backend/src/auth/", type: "directory", condition: "{{ include_auth }}" },
        { path: "backend/src/auth/auth.js", type: "file", 
          template: "mern/auth-middleware.js.j2", condition: "{{ include_auth }}" },
        
        // Configuration files
        { path: "docker-compose.yml", type: "file", template: "mern/docker-compose.yml.j2" },
        { path: ".gitignore", type: "file", template: "common/gitignore.j2" },
        { path: "README.md", type: "file", template: "mern/readme.md.j2" }
      ],

      services: [
        {
          name: "mongodb",
          image: "mongo:5",
          ports: ["27017:27017"],
          environment: {
            MONGO_INITDB_ROOT_USERNAME: "admin",
            MONGO_INITDB_ROOT_PASSWORD: "password"
          }
        }
      ],

      postCreate: [
        { command: "npm install", workingDir: "frontend/", description: "Installing frontend dependencies" },
        { command: "npm install", workingDir: "backend/", description: "Installing backend dependencies" },
        { command: "git init", description: "Initializing Git repository" },
        { command: "docker-compose up -d mongodb", description: "Starting MongoDB service" }
      ]
    };
  }

  async getAvailableTemplates(): Promise<TemplateMetadata[]> {
    return Array.from(this.templates.values()).map(template => ({
      name: template.metadata.name,
      displayName: template.metadata.displayName,
      description: template.metadata.description,
      category: template.metadata.category,
      tags: template.metadata.tags,
      complexity: template.metadata.complexity,
      estimatedSetupTime: template.metadata.estimatedSetupTime
    }));
  }

  async getTemplatesByCategory(category: string): Promise<TemplateDefinition[]> {
    return Array.from(this.templates.values())
      .filter(template => template.metadata.category === category);
  }

  async getTemplateByName(name: string): Promise<TemplateDefinition | null> {
    return this.templates.get(name) || null;
  }
}
```

### Template File Organization
```
templates/
├── mern/
│   ├── template.yml
│   ├── frontend-package.json.j2
│   ├── backend-package.json.j2
│   ├── react-app.j2
│   ├── express-app.js.j2
│   ├── auth-middleware.js.j2
│   ├── docker-compose.yml.j2
│   └── readme.md.j2
├── nextjs-prisma/
│   ├── template.yml
│   ├── package.json.j2
│   ├── next.config.js.j2
│   ├── prisma-schema.j2
│   └── ...
├── vue-laravel/
├── fastapi/
├── spring-boot/
├── react-spa/
├── express-api/
├── django/
├── nestjs/
├── microservices/
└── common/
    ├── gitignore.j2
    ├── dockerfile.j2
    ├── ci-cd.yml.j2
    └── ...
```

## Dependencies

### Prerequisites
- Story 7.1 (Template Engine Foundation & YAML Parser) - **REQUIRED**
- Template file storage and organization system
- Git integration for repository initialization

### External Libraries
- Template asset management utilities
- Language-specific package managers integration
- Docker Compose file generation utilities

## Testing Strategy

### Unit Tests
- Template definition validation
- Variable substitution accuracy
- Conditional logic in templates
- File generation completeness
- Post-creation hook execution

### Integration Tests
- Complete project generation for each template
- Generated project functionality verification
- Cross-platform compatibility testing
- Template performance benchmarking
- Docker service integration testing

### Template Quality Tests
- Generated project compilation/execution
- Linting and code quality validation
- Security vulnerability scanning
- Best practices compliance checking
- Documentation accuracy verification

## Definition of Done

- [ ] 10+ production-ready templates implemented and tested
- [ ] All templates include comprehensive documentation
- [ ] Templates support common configuration options
- [ ] Generated projects include testing and CI/CD setup
- [ ] All templates validated for functionality and best practices
- [ ] Template categories and metadata properly defined
- [ ] Integration with template engine working correctly
- [ ] Performance optimization for template generation
- [ ] Comprehensive test coverage for all templates
- [ ] Template versioning and update mechanism
- [ ] Documentation for template usage and customization

## Template Library Specifications

### Categories and Templates
1. **Full-Stack Applications** (4 templates)
   - MERN Stack (MongoDB, Express, React, Node.js)
   - Next.js + Prisma + PostgreSQL
   - Vue.js + Laravel + MySQL
   - Django + React + PostgreSQL

2. **Backend APIs** (3 templates)
   - FastAPI + Pydantic + PostgreSQL
   - Spring Boot + Maven + JPA
   - Express.js REST API + TypeScript

3. **Frontend Applications** (2 templates)
   - React SPA with TypeScript
   - Vue.js SPA with Vite

4. **Microservices** (1 template)
   - Docker Compose Multi-Service Setup

### Quality Standards
- All templates must include automated testing setup
- ESLint/Prettier configuration for JavaScript/TypeScript projects
- CI/CD pipeline configuration (GitHub Actions)
- Comprehensive README with setup instructions
- Environment variable configuration
- Security best practices implementation

## Story Sizing Justification (8 Points)

This is a **medium-high complexity** story requiring:
- Creation and testing of 10+ comprehensive project templates
- Template file organization and asset management
- Integration with the template engine foundation
- Quality assurance for each generated project type
- Documentation and best practices implementation
- Performance testing and optimization
- Cross-platform compatibility validation

The 8-point estimate reflects the substantial content creation effort while building on the foundation provided by the template engine, with well-defined requirements and clear deliverables.

---

*This story provides developers with immediate value through a comprehensive library of production-ready project templates that embody best practices and modern development workflows.*