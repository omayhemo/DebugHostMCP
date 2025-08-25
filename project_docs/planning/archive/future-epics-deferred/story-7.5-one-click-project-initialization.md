# Story 7.5: One-Click Project Initialization

**Story ID**: 7.5  
**Epic**: Project Templates & Development Accelerators (Epic 6)  
**Sprint**: 7  
**Story Points**: 5  
**Priority**: Medium  
**Created**: August 8, 2025  

## User Story

**As a** developer  
**I want** one-click project initialization from templates with automatic setup  
**So that** I can start coding immediately without spending time on configuration, dependency installation, or environment setup  

## Business Value

- **Instant Productivity**: Eliminates setup time, allowing immediate development focus
- **Reduced Friction**: Removes barriers to starting new projects or experiments
- **Consistency**: Ensures all projects start with proper configuration and best practices
- **Developer Experience**: Provides seamless transition from template selection to active development

## Acceptance Criteria

### Seamless Template Selection and Initialization
1. **GIVEN** a developer selects a template from the marketplace or library  
   **WHEN** they click "Create Project"  
   **THEN** a streamlined initialization flow begins with minimal required inputs  

2. **GIVEN** template initialization is started  
   **WHEN** the process runs  
   **THEN** all necessary files, dependencies, and services are automatically set up  

3. **GIVEN** a project is being initialized  
   **WHEN** the process completes  
   **THEN** the development environment is immediately ready for coding  

### Automated Dependency Installation
4. **GIVEN** a template specifies dependencies  
   **WHEN** project initialization occurs  
   **THEN** all package managers (npm, pip, composer, etc.) automatically install required dependencies  

5. **GIVEN** dependencies are being installed  
   **WHEN** installation is in progress  
   **THEN** real-time progress indicators show installation status  

6. **GIVEN** dependency installation encounters errors  
   **WHEN** failures occur  
   **THEN** clear error messages and resolution suggestions are provided  

### Automatic Service Startup
7. **GIVEN** a template includes services (databases, redis, etc.)  
   **WHEN** project initialization completes  
   **THEN** required services are automatically started in containers  

8. **GIVEN** services are starting up  
   **WHEN** monitoring service status  
   **THEN** health checks confirm all services are running correctly  

9. **GIVEN** development services are running  
   **WHEN** the project is ready  
   **THEN** service endpoints and connection information are displayed  

### Development Environment Activation
10. **GIVEN** a project has been initialized  
    **WHEN** the setup completes  
    **THEN** the development server starts automatically on the assigned port  

11. **GIVEN** the development environment is active  
    **WHEN** developers access the project  
    **THEN** hot reloading, file watching, and debugging tools are pre-configured  

12. **GIVEN** multiple services need to run  
    **WHEN** the project starts  
    **THEN** all services are coordinated and started in the correct order  

### IDE and Workspace Integration
13. **GIVEN** a project is initialized successfully  
    **WHEN** developers want to start coding  
    **THEN** workspace configuration files (VS Code, etc.) are automatically generated  

14. **GIVEN** development tools are needed  
    **WHEN** the project environment is ready  
    **THEN** linting, formatting, and debugging configurations are pre-configured  

15. **GIVEN** version control is required  
    **WHEN** project initialization completes  
    **THEN** Git repository is initialized with an appropriate initial commit  

### Progress Monitoring and Error Handling
16. **GIVEN** project initialization is complex  
    **WHEN** the process runs  
    **THEN** detailed progress tracking shows each step's completion status  

17. **GIVEN** initialization steps may fail  
    **WHEN** errors occur  
    **THEN** rollback mechanisms restore the system to a clean state  

18. **GIVEN** initialization is successful  
    **WHEN** the process completes  
    **THEN** summary information shows what was created and how to access it  

## Technical Requirements

### One-Click Initialization Workflow
```typescript
interface ProjectInitializationRequest {
  templateId: string;
  projectName: string;
  variables: Record<string, any>;
  targetDirectory?: string;
  autoStart?: boolean;
  skipDependencies?: boolean;
}

interface InitializationProgress {
  step: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  message: string;
  progress: number; // 0-100
  startTime?: Date;
  endTime?: Date;
  error?: string;
}

class OneClickInitializer {
  async initializeProject(request: ProjectInitializationRequest): Promise<ProjectInitializationResult> {
    const progressTracker = new ProgressTracker();
    
    try {
      // Step 1: Validate and prepare
      await this.validateRequest(request, progressTracker);
      
      // Step 2: Generate project structure
      const projectPath = await this.generateProjectStructure(request, progressTracker);
      
      // Step 3: Install dependencies
      if (!request.skipDependencies) {
        await this.installDependencies(projectPath, progressTracker);
      }
      
      // Step 4: Initialize services
      const services = await this.initializeServices(projectPath, progressTracker);
      
      // Step 5: Start development environment
      const devServer = await this.startDevelopmentServer(projectPath, progressTracker);
      
      // Step 6: Setup IDE configuration
      await this.setupIDEConfiguration(projectPath, progressTracker);
      
      // Step 7: Initialize version control
      await this.initializeVersionControl(projectPath, progressTracker);
      
      return {
        success: true,
        projectPath: projectPath,
        services: services,
        devServer: devServer,
        accessUrls: await this.getAccessUrls(projectPath, devServer, services),
        summary: this.generateSuccessSummary(request, projectPath, devServer)
      };
      
    } catch (error) {
      await this.handleInitializationError(error, progressTracker);
      throw error;
    }
  }

  private async generateProjectStructure(
    request: ProjectInitializationRequest,
    progress: ProgressTracker
  ): Promise<string> {
    
    progress.updateStep('Generating project structure', 'running');
    
    const template = await this.templateEngine.loadTemplate(request.templateId);
    const projectPath = path.resolve(request.targetDirectory || '.', request.projectName);
    
    // Ensure target directory doesn't exist or is empty
    if (await fs.pathExists(projectPath)) {
      const files = await fs.readdir(projectPath);
      if (files.length > 0) {
        throw new ProjectDirectoryNotEmptyError(projectPath);
      }
    }
    
    // Generate project from template
    await this.templateEngine.processTemplate(
      template,
      request.variables,
      projectPath
    );
    
    progress.updateStep('Project structure generated', 'completed');
    return projectPath;
  }

  private async installDependencies(
    projectPath: string,
    progress: ProgressTracker
  ): Promise<DependencyInstallResult[]> {
    
    progress.updateStep('Installing dependencies', 'running');
    
    const results: DependencyInstallResult[] = [];
    
    // Detect and install Node.js dependencies
    if (await fs.pathExists(path.join(projectPath, 'package.json'))) {
      results.push(await this.installNodeDependencies(projectPath, progress));
    }
    
    // Detect and install Python dependencies
    if (await fs.pathExists(path.join(projectPath, 'requirements.txt'))) {
      results.push(await this.installPythonDependencies(projectPath, progress));
    }
    
    // Detect and install PHP dependencies
    if (await fs.pathExists(path.join(projectPath, 'composer.json'))) {
      results.push(await this.installPHPDependencies(projectPath, progress));
    }
    
    progress.updateStep('Dependencies installed', 'completed');
    return results;
  }

  private async installNodeDependencies(
    projectPath: string,
    progress: ProgressTracker
  ): Promise<DependencyInstallResult> {
    
    const packageManager = await this.detectNodePackageManager(projectPath);
    const command = this.getInstallCommand(packageManager);
    
    const result = await this.executeCommand(command, {
      cwd: projectPath,
      onProgress: (data) => {
        progress.updateStep(`Installing Node.js dependencies: ${data}`, 'running');
      }
    });
    
    return {
      type: 'node',
      packageManager: packageManager,
      success: result.exitCode === 0,
      duration: result.duration,
      output: result.stdout,
      error: result.stderr
    };
  }

  private async initializeServices(
    projectPath: string,
    progress: ProgressTracker
  ): Promise<ServiceInfo[]> {
    
    progress.updateStep('Initializing services', 'running');
    
    const dockerComposePath = path.join(projectPath, 'docker-compose.yml');
    if (!(await fs.pathExists(dockerComposePath))) {
      progress.updateStep('No services to initialize', 'completed');
      return [];
    }
    
    // Start services using docker-compose
    const result = await this.executeCommand('docker-compose up -d', {
      cwd: projectPath,
      onProgress: (data) => {
        progress.updateStep(`Starting services: ${data}`, 'running');
      }
    });
    
    if (result.exitCode !== 0) {
      throw new ServiceInitializationError(result.stderr);
    }
    
    // Wait for services to be healthy
    const services = await this.waitForServicesHealthy(projectPath, progress);
    
    progress.updateStep('Services initialized', 'completed');
    return services;
  }

  private async startDevelopmentServer(
    projectPath: string,
    progress: ProgressTracker
  ): Promise<DevServerInfo | null> {
    
    progress.updateStep('Starting development server', 'running');
    
    const devCommand = await this.detectDevelopmentCommand(projectPath);
    if (!devCommand) {
      progress.updateStep('No development server configured', 'completed');
      return null;
    }
    
    const port = await this.allocatePort();
    const envVars = { ...process.env, PORT: port.toString() };
    
    // Start development server in background
    const serverProcess = this.executeCommandBackground(devCommand, {
      cwd: projectPath,
      env: envVars,
      onOutput: (data) => {
        // Parse for "Server started" or similar messages
        if (this.isServerReadyMessage(data)) {
          progress.updateStep('Development server ready', 'completed');
        }
      }
    });
    
    // Wait for server to be ready (with timeout)
    await this.waitForServerReady(`http://localhost:${port}`, 30000);
    
    return {
      port: port,
      url: `http://localhost:${port}`,
      command: devCommand,
      processId: serverProcess.pid
    };
  }
}
```

### Progress Tracking and UI
```typescript
const ProjectInitializationModal: React.FC<{
  isOpen: boolean;
  request: ProjectInitializationRequest;
  onComplete: (result: ProjectInitializationResult) => void;
  onCancel: () => void;
}> = ({ isOpen, request, onComplete, onCancel }) => {
  
  const [progress, setProgress] = useState<InitializationProgress[]>([]);
  const [currentStep, setCurrentStep] = useState<string>('');
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const steps = [
    'Validating template and inputs',
    'Generating project structure',
    'Installing dependencies',
    'Initializing services',
    'Starting development server',
    'Setting up IDE configuration',
    'Initializing version control'
  ];

  useEffect(() => {
    if (isOpen) {
      startInitialization();
    }
  }, [isOpen]);

  const startInitialization = async () => {
    try {
      const result = await initializationService.initializeProject(request);
      setIsComplete(true);
      onComplete(result);
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onCancel} closable={false}>
      <div className="project-initialization">
        <h2>Creating Project: {request.projectName}</h2>
        
        <div className="initialization-progress">
          {steps.map((step, index) => (
            <ProgressStep
              key={step}
              step={step}
              status={getStepStatus(step, progress)}
              isActive={currentStep === step}
            />
          ))}
        </div>
        
        <div className="current-activity">
          {currentStep && (
            <div className="activity-indicator">
              <Spinner />
              <span>{currentStep}</span>
            </div>
          )}
        </div>
        
        {error && (
          <div className="error-panel">
            <h3>Initialization Failed</h3>
            <p>{error}</p>
            <button onClick={onCancel}>Close</button>
          </div>
        )}
        
        {isComplete && (
          <div className="success-panel">
            <h3>Project Ready!</h3>
            <p>Your project has been successfully created and is ready for development.</p>
            <div className="project-actions">
              <button 
                className="primary-button"
                onClick={() => openProject(result.projectPath)}
              >
                Open Project
              </button>
              <button onClick={() => viewAccessUrls(result.accessUrls)}>
                View URLs
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

const QuickStartButton: React.FC<{
  template: TemplateMetadata;
  onInitialize: (request: ProjectInitializationRequest) => void;
}> = ({ template, onInitialize }) => {
  
  const [showQuickForm, setShowQuickForm] = useState(false);
  const [projectName, setProjectName] = useState('');
  
  const handleQuickStart = () => {
    if (template.variables?.length > 0) {
      // Template has variables, show form
      setShowQuickForm(true);
    } else {
      // No variables needed, start immediately
      onInitialize({
        templateId: template.id,
        projectName: projectName || `new-${template.name}-project`,
        variables: {},
        autoStart: true
      });
    }
  };

  return (
    <>
      <button 
        className="quick-start-button"
        onClick={handleQuickStart}
        title="Create project with default settings"
      >
        <Zap /> Quick Start
      </button>
      
      {showQuickForm && (
        <QuickStartForm
          template={template}
          initialProjectName={projectName}
          onSubmit={(request) => {
            setShowQuickForm(false);
            onInitialize(request);
          }}
          onCancel={() => setShowQuickForm(false)}
        />
      )}
    </>
  );
};
```

### API Integration
```typescript
// API endpoints for one-click initialization
POST /api/projects/initialize    // Start project initialization
GET  /api/projects/initialize/:id/progress  // Get initialization progress
POST /api/projects/initialize/:id/cancel    // Cancel initialization
GET  /api/projects/:id/access-urls          // Get project access URLs
POST /api/projects/:id/restart-services     // Restart project services
```

## Dependencies

### Prerequisites
- Stories 7.1-7.4 (Template engine, library, creation UI, marketplace) - **REQUIRED**
- Project management and workspace isolation systems
- Docker integration for service management
- Port allocation system

### External Libraries
- `execa` - Process execution with progress tracking
- `listr2` - Task list management with progress indicators
- `fs-extra` - Enhanced file system operations
- `detect-package-manager` - Package manager detection utilities

## Testing Strategy

### Unit Tests
- Template processing and project generation
- Dependency installation logic for different package managers
- Service initialization and health checking
- Progress tracking and error handling
- Rollback mechanisms for failed initialization

### Integration Tests
- Complete one-click initialization workflows for different template types
- Multi-step initialization with service dependencies
- Error recovery and rollback scenarios
- Cross-platform initialization testing
- Performance testing for initialization speed

### User Experience Tests
- Initialization time measurement for different template complexities
- Progress indication accuracy and user feedback
- Error message clarity and actionability
- Success confirmation and next steps guidance

## Definition of Done

- [ ] One-click project initialization from any template
- [ ] Automatic dependency installation for all supported package managers
- [ ] Service initialization and health checking
- [ ] Development server auto-start with hot reloading
- [ ] IDE workspace configuration generation
- [ ] Git repository initialization with initial commit
- [ ] Real-time progress tracking with detailed status
- [ ] Error handling with rollback and recovery options
- [ ] Project access URL generation and display
- [ ] Performance optimization for <30 second initialization
- [ ] Cross-platform compatibility (Windows, macOS, Linux)
- [ ] Comprehensive test suite (>85% coverage)
- [ ] User documentation for troubleshooting

## Performance Requirements

### Initialization Performance
- Simple templates (static sites): <15 seconds
- Full-stack templates: <30 seconds
- Complex microservice templates: <60 seconds
- Dependency installation progress: Real-time updates

### Resource Efficiency
- Minimal memory overhead during initialization
- Efficient parallel processing of independent steps
- Optimized Docker image pulling and container startup
- Background service management without blocking UI

## Story Sizing Justification (5 Points)

This is a **medium complexity** story requiring:
- Integration of multiple existing systems (template engine, project management, services)
- Process orchestration with progress tracking and error handling
- Cross-platform compatibility for different package managers and environments
- UI components for progress tracking and user feedback
- Performance optimization for fast project initialization
- Comprehensive error handling and recovery mechanisms

The 5-point estimate reflects the focused scope of orchestrating existing functionality into a streamlined user experience, with well-defined requirements and clear success criteria.

---

*This story delivers the ultimate developer experience by eliminating all friction between template selection and productive development work.*