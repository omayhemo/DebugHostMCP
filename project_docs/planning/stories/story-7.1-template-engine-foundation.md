# Story 7.1: Template Engine Foundation & YAML Parser

**Story ID**: 7.1  
**Epic**: Project Templates & Development Accelerators (Epic 6)  
**Sprint**: 7  
**Story Points**: 13  
**Priority**: Critical  
**Created**: August 8, 2025  

## User Story

**As a** developer  
**I want** a robust template engine that can process YAML-defined project templates  
**So that** I can quickly initialize projects with pre-configured setups, dependencies, and best practices  

## Business Value

- **Developer Productivity**: Reduces project setup time from hours to minutes
- **Consistency**: Ensures all projects follow established patterns and best practices
- **Quality**: Pre-configured templates include testing, linting, and CI/CD setups
- **Onboarding**: New developers can start productive work immediately

## Acceptance Criteria

### YAML Template Definition Processing
1. **GIVEN** a template is defined in YAML format  
   **WHEN** the template engine processes it  
   **THEN** all template metadata, structure, and configuration are correctly parsed  

2. **GIVEN** a template YAML contains Jinja2 variables and expressions  
   **WHEN** the template is rendered with user inputs  
   **THEN** all variables are substituted correctly with proper escaping  

3. **GIVEN** a template has conditional sections based on user choices  
   **WHEN** processing occurs with specific user options  
   **THEN** only relevant sections are included in the final project  

### File and Directory Structure Generation
4. **GIVEN** a template defines a file structure  
   **WHEN** project initialization occurs  
   **THEN** all directories and files are created with correct permissions  

5. **GIVEN** template files contain variable placeholders  
   **WHEN** files are generated  
   **THEN** placeholders are replaced with user-provided values  

6. **GIVEN** binary files or assets are part of the template  
   **WHEN** the project is generated  
   **THEN** binary files are copied without template processing  

### Variable Substitution and Configuration
7. **GIVEN** a template requires user inputs (project name, author, etc.)  
   **WHEN** the user provides values  
   **THEN** all template variables are consistently replaced throughout all files  

8. **GIVEN** a template has default values for variables  
   **WHEN** the user doesn't provide specific values  
   **THEN** defaults are used automatically  

9. **GIVEN** template variables have validation rules  
   **WHEN** user inputs are processed  
   **THEN** invalid inputs are rejected with helpful error messages  

### Environment and Dependency Management
10. **GIVEN** a template specifies environment variables  
    **WHEN** the project is initialized  
    **THEN** environment files (.env) are created with appropriate values  

11. **GIVEN** a template includes dependency specifications  
    **WHEN** project generation completes  
    **THEN** package.json, requirements.txt, or equivalent files are correctly generated  

12. **GIVEN** a template requires system-level dependencies  
    **WHEN** the template is processed  
    **THEN** dependency requirements are documented and validated  

### Post-Generation Hooks
13. **GIVEN** a template defines post-creation commands  
    **WHEN** project generation completes  
    **THEN** specified commands are executed in the correct order  

14. **GIVEN** post-creation hooks fail during execution  
    **WHEN** errors occur  
    **THEN** detailed error information is provided with rollback options  

15. **GIVEN** a template initializes Git repositories or other VCS  
    **WHEN** post-creation hooks run  
    **THEN** version control is properly initialized with initial commit  

## Technical Requirements

### Template Schema Definition
```yaml
# template.yaml - Complete schema example
metadata:
  name: "Full-Stack MERN Application"
  description: "Complete MongoDB, Express, React, Node.js application with authentication"
  version: "2.1.0"
  author: "Platform Team"
  tags: ["react", "express", "mongodb", "javascript", "fullstack"]
  category: "web-application"
  license: "MIT"
  
requirements:
  system:
    node: ">=18.0.0"
    npm: ">=8.0.0"
    docker: ">=20.0.0"
  resources:
    memory: "2GB"
    storage: "5GB"
    
variables:
  - name: "project_name"
    prompt: "Project name"
    type: "string"
    required: true
    pattern: "^[a-z][a-z0-9-]*$"
    description: "Must be lowercase, start with letter, alphanumeric and hyphens only"
    
  - name: "author_name"
    prompt: "Author name"
    type: "string"
    default: "{{ user.fullName }}"
    
  - name: "author_email"
    prompt: "Author email"
    type: "email"
    default: "{{ user.email }}"
    
  - name: "include_auth"
    prompt: "Include authentication system?"
    type: "boolean"
    default: true
    
  - name: "database_type"
    prompt: "Choose database"
    type: "choice"
    choices: ["mongodb", "postgresql", "mysql"]
    default: "mongodb"
    
structure:
  - path: "frontend/"
    type: "directory"
    
  - path: "frontend/package.json"
    type: "file"
    template: "frontend-package.json.j2"
    
  - path: "frontend/src/App.js"
    type: "file"
    template: "react-app.js.j2"
    condition: "{{ not include_typescript }}"
    
  - path: "frontend/src/App.tsx"
    type: "file"
    template: "react-app.tsx.j2"
    condition: "{{ include_typescript }}"
    
  - path: "backend/"
    type: "directory"
    
  - path: "backend/package.json"
    type: "file"
    template: "backend-package.json.j2"
    
  - path: "backend/models/"
    type: "directory"
    condition: "{{ include_auth }}"
    
  - path: "backend/models/User.js"
    type: "file"
    template: "user-model.js.j2"
    condition: "{{ include_auth }}"
    
environment:
  files:
    - path: "backend/.env.example"
      variables:
        - name: "DATABASE_URL"
          value: "{{ database_connection_string }}"
        - name: "JWT_SECRET"
          generate: "random"
          length: 64
        - name: "NODE_ENV"
          value: "development"
          
    - path: "frontend/.env.example"
      variables:
        - name: "REACT_APP_API_URL"
          value: "http://localhost:3001"
          
services:
  - name: "mongodb"
    image: "mongo:5"
    ports: ["27017:27017"]
    condition: "{{ database_type == 'mongodb' }}"
    
  - name: "postgresql"
    image: "postgres:14"
    ports: ["5432:5432"]
    environment:
      POSTGRES_DB: "{{ project_name }}"
      POSTGRES_USER: "developer"
      POSTGRES_PASSWORD: "password"
    condition: "{{ database_type == 'postgresql' }}"
    
post_create:
  - command: "npm install"
    working_dir: "frontend/"
    description: "Installing frontend dependencies"
    
  - command: "npm install"
    working_dir: "backend/"
    description: "Installing backend dependencies"
    
  - command: "git init"
    description: "Initializing Git repository"
    
  - command: "git add ."
    description: "Adding initial files to Git"
    
  - command: "git commit -m 'Initial commit from {{ template.name }} template'"
    description: "Creating initial commit"
    
  - command: "docker-compose up -d"
    description: "Starting development services"
    condition: "{{ include_docker }}"
```

### Template Engine Implementation
```typescript
class TemplateEngine {
  private jinja: Environment;
  private templateCache: Map<string, Template> = new Map();

  constructor() {
    this.jinja = new Environment({
      loader: new FileSystemLoader(['templates/', 'custom-templates/']),
      autoescape: true,
      trimBlocks: true,
      lstripBlocks: true
    });
    
    this.setupCustomFilters();
  }

  async processTemplate(
    templatePath: string, 
    variables: TemplateVariables,
    outputPath: string
  ): Promise<ProjectGenerationResult> {
    
    const templateDef = await this.loadTemplateDefinition(templatePath);
    await this.validateTemplateRequirements(templateDef);
    
    const processedVariables = await this.processVariables(templateDef.variables, variables);
    const validationResult = this.validateVariables(templateDef.variables, processedVariables);
    
    if (!validationResult.valid) {
      throw new TemplateValidationError(validationResult.errors);
    }

    // Create project structure
    await this.generateProjectStructure(templateDef, processedVariables, outputPath);
    
    // Process environment files
    await this.generateEnvironmentFiles(templateDef, processedVariables, outputPath);
    
    // Execute post-creation hooks
    const hookResults = await this.executePostCreationHooks(
      templateDef, 
      processedVariables, 
      outputPath
    );

    return {
      templateName: templateDef.metadata.name,
      projectPath: outputPath,
      generatedFiles: await this.getGeneratedFilesList(outputPath),
      executedHooks: hookResults,
      variables: processedVariables
    };
  }

  async generateProjectStructure(
    templateDef: TemplateDefinition, 
    variables: ProcessedVariables,
    outputPath: string
  ) {
    
    for (const item of templateDef.structure) {
      const resolvedPath = path.join(outputPath, this.renderTemplate(item.path, variables));
      
      // Check condition if specified
      if (item.condition && !this.evaluateCondition(item.condition, variables)) {
        continue;
      }

      if (item.type === 'directory') {
        await fs.ensureDir(resolvedPath);
      } 
      else if (item.type === 'file') {
        await this.generateFile(item, resolvedPath, variables);
      }
      else if (item.type === 'copy') {
        await this.copyBinaryFile(item, resolvedPath);
      }
    }
  }

  async generateFile(
    fileDefinition: FileDefinition,
    outputPath: string,
    variables: ProcessedVariables
  ) {
    let content: string;

    if (fileDefinition.template) {
      // Process as Jinja2 template
      const template = await this.loadFileTemplate(fileDefinition.template);
      content = template.render(variables);
    } 
    else if (fileDefinition.content) {
      // Direct content with variable substitution
      content = this.renderTemplate(fileDefinition.content, variables);
    }
    else {
      throw new Error(`File definition missing template or content: ${fileDefinition.path}`);
    }

    await fs.ensureDir(path.dirname(outputPath));
    await fs.writeFile(outputPath, content, { 
      encoding: fileDefinition.encoding || 'utf8',
      mode: fileDefinition.mode || 0o644
    });
  }

  private setupCustomFilters() {
    this.jinja.addFilter('slugify', (str: string) => {
      return str.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').trim('-');
    });

    this.jinja.addFilter('camelCase', (str: string) => {
      return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    });

    this.jinja.addFilter('pascalCase', (str: string) => {
      const camel = this.jinja.getFilter('camelCase')(str);
      return camel.charAt(0).toUpperCase() + camel.slice(1);
    });

    this.jinja.addFilter('generateSecret', (length: number = 32) => {
      return crypto.randomBytes(length).toString('hex');
    });
  }
}
```

### Variable Processing System
```typescript
interface TemplateVariable {
  name: string;
  prompt: string;
  type: 'string' | 'number' | 'boolean' | 'choice' | 'email' | 'url';
  required?: boolean;
  default?: any;
  choices?: string[];
  pattern?: string;
  validation?: string;
  description?: string;
  condition?: string;
}

class VariableProcessor {
  async processVariables(
    variableDefinitions: TemplateVariable[], 
    userInputs: Record<string, any>
  ): Promise<ProcessedVariables> {
    
    const processed: ProcessedVariables = {};
    
    for (const varDef of variableDefinitions) {
      // Skip if condition not met
      if (varDef.condition && !this.evaluateCondition(varDef.condition, processed)) {
        continue;
      }

      let value = userInputs[varDef.name];
      
      // Apply default if no value provided
      if (value === undefined && varDef.default !== undefined) {
        value = this.processDefaultValue(varDef.default, processed);
      }

      // Validate required
      if (varDef.required && (value === undefined || value === '')) {
        throw new ValidationError(`Required variable '${varDef.name}' is missing`);
      }

      // Type conversion and validation
      value = this.convertAndValidateValue(varDef, value);
      
      processed[varDef.name] = value;
    }

    return processed;
  }

  private convertAndValidateValue(varDef: TemplateVariable, value: any): any {
    switch (varDef.type) {
      case 'string':
        value = String(value || '');
        if (varDef.pattern) {
          const regex = new RegExp(varDef.pattern);
          if (!regex.test(value)) {
            throw new ValidationError(
              `Variable '${varDef.name}' does not match pattern ${varDef.pattern}`
            );
          }
        }
        break;

      case 'number':
        value = Number(value);
        if (isNaN(value)) {
          throw new ValidationError(`Variable '${varDef.name}' must be a number`);
        }
        break;

      case 'boolean':
        value = Boolean(value);
        break;

      case 'choice':
        if (!varDef.choices?.includes(value)) {
          throw new ValidationError(
            `Variable '${varDef.name}' must be one of: ${varDef.choices?.join(', ')}`
          );
        }
        break;

      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          throw new ValidationError(`Variable '${varDef.name}' must be a valid email`);
        }
        break;
    }

    return value;
  }
}
```

## Dependencies

### Prerequisites
- Enhanced project management system
- File system utilities for project generation
- Git integration for repository initialization
- Docker integration for service management

### External Libraries
- `js-yaml` - YAML parsing and processing
- `nunjucks` or `jinja2-js` - Template rendering engine
- `joi` - Input validation
- `fs-extra` - Enhanced file system operations
- `inquirer` - Interactive CLI prompts (for CLI usage)

## Testing Strategy

### Unit Tests
- YAML template parsing accuracy
- Variable substitution correctness
- Conditional logic evaluation
- File generation with proper permissions
- Post-creation hook execution

### Integration Tests
- Complete template processing workflows
- Complex template with multiple conditions
- Error handling and rollback scenarios
- Template caching and performance
- Cross-platform compatibility

### Template Tests
- Validation of included template definitions
- Generated project functionality testing
- Template versioning and compatibility
- Performance with large template sets

## Definition of Done

- [ ] YAML template definition parser functional
- [ ] Jinja2-compatible template rendering engine
- [ ] Variable processing with validation and defaults
- [ ] Conditional template sections working
- [ ] File and directory structure generation
- [ ] Environment file generation
- [ ] Post-creation hook execution system
- [ ] Error handling with detailed messages
- [ ] Template caching for performance
- [ ] Comprehensive test suite (>90% coverage)
- [ ] API endpoints for template processing
- [ ] Documentation for template creation
- [ ] CLI interface for template testing

## Performance Requirements

### Template Processing Performance
- Template parsing: <500ms for complex templates
- Project generation: <30 seconds for full-stack templates
- Variable processing: <100ms for typical variable sets
- File generation: <1 second per 100 files

### Resource Efficiency
- Template caching to avoid re-parsing
- Streaming file generation for large templates
- Memory-efficient processing of binary assets
- Parallel processing of independent template sections

## Story Sizing Justification (13 Points)

This is a **high complexity** story requiring:
- Sophisticated YAML parsing and validation system
- Template rendering engine with conditional logic
- Complex variable processing with multiple data types
- File system operations with permission management
- Post-creation hook execution with error handling
- Template caching and performance optimization
- Integration with multiple external systems (Git, Docker)
- Comprehensive error handling and rollback mechanisms
- Extensive testing framework for template validation

The 13-point estimate reflects the foundational nature of the template engine and the complexity of creating a flexible, secure, and performant system that will support all future template functionality.

---

*This story establishes the core template processing engine that enables rapid project initialization and development acceleration through pre-configured templates.*