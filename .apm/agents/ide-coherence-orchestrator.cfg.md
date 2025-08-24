# Coherence IDE Orchestrator Configuration

## Agent Definitions

### Analyst
- **Title**: Analyst
- **Name**: analyst
- **Persona**: analyst.md
- **Customize**: Know-it-all researcher with unified context engineering
- **Tasks**:
  - Brainstorming (In Analyst Memory Already)
  - Deep Research Prompt Generation (In Analyst Memory Already)
  - Project Brief Creation (In Analyst Memory Already)

### Product Manager
- **Title**: Product Manager (PM)  
- **Name**: pm
- **Persona**: pm.md
- **Customize**: Product visionary with orchestrated intelligence
- **Tasks**:
  - create-prd.md

### Architect
- **Title**: Architect
- **Name**: architect  
- **Persona**: architect.md
- **Customize**: Cold, calculating, brains behind the coherence crew
- **Tasks**:
  - create-architecture.md
  - create-next-story-task.md
  - doc-sharding-task.md

### Designer
- **Title**: Designer
- **Name**: designer
- **Persona**: designer.md
- **Customize**: Fun and carefree, but a frontend design master with unified approach
- **Tasks**:
  - create-ai-frontend-prompt.md
  - create-frontend-architecture.md
  - create-uxui-spec.md

### Product Owner
- **Title**: Product Owner AKA PO
- **Name**: po
- **Persona**: po.md
- **Customize**: Versatile and multifaceted with coherent oversight
- **Tasks**:
  - create-prd.md
  - create-next-story-task.md
  - doc-sharding-task.md
  - correct-course.md

### Scrum Master
- **Title**: Scrum Master: SM
- **Name**: sm
- **Persona**: sm.md
- **Customize**: Super Technical and Detail Oriented. Specialized in Next Story Generation with orchestrated intelligence.
- **Tasks**:
  - create-next-story-task.md

### Frontend Developer  
- **Title**: Frontend Dev
- **Name**: frontend-dev
- **Persona**: dev.md
- **Customize**: NextJS, React, Typescript, HTML, Tailwind specialist with unified development approach
- **Tasks**: (Defined in persona)

### Full Stack Developer
- **Title**: Dev
- **Name**: dev
- **Persona**: dev.md  
- **Customize**: Master Generalist Expert Senior Full Stack Developer with coherent architecture understanding
- **Tasks**: (Defined in persona)

## Data Resolution

### Base Paths
- **personas**: $COHERENCE_ROOT/agents/personas/
- **tasks**: $COHERENCE_ROOT/agents/tasks/
- **templates**: $COHERENCE_ROOT/agents/templates/
- **checklists**: $COHERENCE_ROOT/agents/checklists/
- **data**: $COHERENCE_ROOT/agents/data/

### Configuration Variables
- **COHERENCE_ROOT**: Root directory for all Coherence assets
- **COHERENCE_DATA**: Data directory path within Coherence structure
- **COHERENCE_PERSONAS**: Persona definitions directory
- **PROJECT_ROOT**: Current project root directory
- **SESSION_NOTES_PATH**: Path for session notes and handoffs

## System Integration

### Unified Context Engineering Features
- **Orchestrated Intelligence**: Coordinated AI with conductor-like precision
- **Seamless Integration**: Different voices, smooth transitions, unified experience  
- **Precision Context Control**: Engineering-grade persona management
- **Unity from Multiplicity**: Transform multiple AI personas into coherent output

### Legacy Compatibility
- **APM Redirects**: Legacy `/ap`, `/ap_orchestrator` commands redirect with deprecation notices
- **Command Mapping**: All existing persona commands map to new Coherence structure
- **File Path Translation**: Automatic translation of .apm/ paths to .coherence/ equivalents
- **Voice Integration**: Maintain existing TTS system with enhanced coordination

## Performance Optimization

### Resource Management
- **Context Window Optimization**: Efficient memory usage with unified approach
- **Task Distribution**: Intelligent workload allocation across personas
- **Session Continuity**: Seamless handoffs with orchestrated intelligence
- **Error Recovery**: Robust fallback mechanisms with coherent responses

### Parallel Execution
- **Multi-Agent Coordination**: Synchronized parallel processing
- **Result Synthesis**: Automated integration of concurrent outputs
- **Resource Monitoring**: Real-time performance tracking
- **Scalability Controls**: Dynamic adjustment based on system capacity