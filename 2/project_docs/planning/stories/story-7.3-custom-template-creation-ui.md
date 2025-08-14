# Story 7.3: Custom Template Creation UI

**Story ID**: 7.3  
**Epic**: Project Templates & Development Accelerators (Epic 6)  
**Sprint**: 7  
**Story Points**: 8  
**Priority**: High  
**Created**: August 8, 2025  

## User Story

**As a** team lead or experienced developer  
**I want** a user-friendly interface for creating and managing custom project templates  
**So that** I can codify team-specific project patterns and share standardized setups with my team  

## Business Value

- **Team Standardization**: Enables consistent project structures across team members
- **Knowledge Transfer**: Captures institutional knowledge in reusable templates
- **Productivity Multiplier**: Allows teams to create specialized templates for their domain
- **Quality Assurance**: Ensures team-specific best practices are automatically applied

## Acceptance Criteria

### Template Creation Wizard
1. **GIVEN** a user wants to create a new template  
   **WHEN** they start the template creation process  
   **THEN** a guided wizard walks them through template definition steps  

2. **GIVEN** the template creation wizard is active  
   **WHEN** users define template metadata  
   **THEN** they can specify name, description, category, tags, and requirements  

3. **GIVEN** template metadata is being configured  
   **WHEN** users input template information  
   **THEN** real-time validation ensures proper format and completeness  

### File Structure Definition Interface
4. **GIVEN** a user is defining template structure  
   **WHEN** they use the visual structure editor  
   **THEN** they can drag and drop to create directories and files hierarchically  

5. **GIVEN** files are being added to the template structure  
   **WHEN** users specify file types  
   **THEN** they can choose between template files, static files, and binary assets  

6. **GIVEN** template files are being configured  
   **WHEN** users edit file content  
   **THEN** syntax highlighting and variable suggestion are provided  

### Variable and Configuration Management
7. **GIVEN** a template requires user inputs  
   **WHEN** defining template variables  
   **THEN** a form builder allows specification of variable types, validation, and defaults  

8. **GIVEN** variables are being configured  
   **WHEN** setting up variable dependencies  
   **THEN** conditional variable display based on other variable values is supported  

9. **GIVEN** template variables need validation  
   **WHEN** configuring validation rules  
   **THEN** regex patterns, choice lists, and custom validation can be defined  

### Template Preview and Testing
10. **GIVEN** a template is being developed  
    **WHEN** users want to preview the template  
    **THEN** a preview mode shows the generated project structure without creating files  

11. **GIVEN** a template has variables defined  
    **WHEN** testing the template  
    **THEN** users can input test values and see how they affect the generated output  

12. **GIVEN** template testing is performed  
    **WHEN** validation occurs  
    **THEN** comprehensive error reporting identifies issues with template definition  

### Template Management Dashboard
13. **GIVEN** users have created multiple templates  
    **WHEN** accessing their template dashboard  
    **THEN** all personal and team templates are listed with management options  

14. **GIVEN** templates need updates or modifications  
    **WHEN** editing existing templates  
    **THEN** version control tracks changes and allows rollback to previous versions  

15. **GIVEN** templates are ready for sharing  
    **WHEN** publishing templates to team or community  
    **THEN** templates can be shared with appropriate access controls  

### Template Import and Export
16. **GIVEN** users have existing project structures  
    **WHEN** they want to create templates from existing projects  
    **THEN** an import wizard can scaffold templates from existing directory structures  

17. **GIVEN** templates need to be shared or backed up  
    **WHEN** exporting templates  
    **THEN** templates can be exported as portable packages  

## Technical Requirements

### Template Creation UI Components
```typescript
// React components for template creation
interface TemplateCreationState {
  metadata: TemplateMetadata;
  variables: TemplateVariable[];
  structure: FileStructureNode[];
  services: ServiceDefinition[];
  postCreateHooks: PostCreateHook[];
  currentStep: 'metadata' | 'variables' | 'structure' | 'services' | 'hooks' | 'review';
}

const TemplateCreationWizard: React.FC = () => {
  const [templateState, setTemplateState] = useState<TemplateCreationState>({
    metadata: {},
    variables: [],
    structure: [],
    services: [],
    postCreateHooks: [],
    currentStep: 'metadata'
  });

  const steps = [
    { key: 'metadata', label: 'Basic Information', component: MetadataStep },
    { key: 'variables', label: 'Variables & Inputs', component: VariablesStep },
    { key: 'structure', label: 'File Structure', component: StructureStep },
    { key: 'services', label: 'Services & Dependencies', component: ServicesStep },
    { key: 'hooks', label: 'Post-Creation Hooks', component: HooksStep },
    { key: 'review', label: 'Review & Test', component: ReviewStep }
  ];

  return (
    <div className="template-creation-wizard">
      <WizardProgress steps={steps} currentStep={templateState.currentStep} />
      <StepContent 
        templateState={templateState} 
        onUpdate={setTemplateState}
        onNext={handleNext}
        onPrevious={handlePrevious}
      />
    </div>
  );
};
```

### Visual File Structure Editor
```typescript
const FileStructureEditor: React.FC<{
  structure: FileStructureNode[];
  onUpdate: (structure: FileStructureNode[]) => void;
}> = ({ structure, onUpdate }) => {
  
  const [draggedItem, setDraggedItem] = useState<FileStructureNode | null>(null);
  
  return (
    <div className="file-structure-editor">
      <div className="toolbar">
        <button onClick={() => addDirectory()}>
          <FolderPlus /> Add Directory
        </button>
        <button onClick={() => addFile()}>
          <FilePlus /> Add File
        </button>
        <button onClick={() => addTemplate()}>
          <FileCode /> Add Template File
        </button>
      </div>
      
      <div className="structure-tree">
        <Tree
          data={structure}
          onDrop={handleDrop}
          onEdit={handleEdit}
          onDelete={handleDelete}
          renderNode={renderStructureNode}
        />
      </div>
      
      <FileEditModal
        isOpen={editingFile !== null}
        file={editingFile}
        onSave={handleFileSave}
        onClose={() => setEditingFile(null)}
      />
    </div>
  );
  
  function renderStructureNode(node: FileStructureNode) {
    return (
      <div className={`structure-node ${node.type}`}>
        <div className="node-header">
          <Icon type={node.type} />
          <span className="node-name">{node.path}</span>
          <div className="node-actions">
            <button onClick={() => editNode(node)}>
              <Edit />
            </button>
            <button onClick={() => deleteNode(node)}>
              <Trash />
            </button>
          </div>
        </div>
        
        {node.type === 'file' && (
          <div className="node-details">
            <span className="template-indicator">
              {node.template ? `Template: ${node.template}` : 'Static file'}
            </span>
            {node.condition && (
              <span className="condition-indicator">
                Condition: {node.condition}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }
};
```

### Variable Configuration Builder
```typescript
const VariableConfigurationBuilder: React.FC<{
  variables: TemplateVariable[];
  onUpdate: (variables: TemplateVariable[]) => void;
}> = ({ variables, onUpdate }) => {
  
  const [editingVariable, setEditingVariable] = useState<TemplateVariable | null>(null);
  
  return (
    <div className="variable-builder">
      <div className="variables-list">
        <h3>Template Variables</h3>
        {variables.map((variable, index) => (
          <VariableCard 
            key={variable.name || index}
            variable={variable}
            onEdit={() => setEditingVariable(variable)}
            onDelete={() => deleteVariable(index)}
            onReorder={(newIndex) => reorderVariable(index, newIndex)}
          />
        ))}
        
        <button 
          className="add-variable-btn"
          onClick={() => setEditingVariable({} as TemplateVariable)}
        >
          <Plus /> Add Variable
        </button>
      </div>
      
      <VariableEditPanel
        variable={editingVariable}
        isOpen={editingVariable !== null}
        onSave={handleVariableSave}
        onCancel={() => setEditingVariable(null)}
        existingVariables={variables}
      />
    </div>
  );
};

const VariableEditPanel: React.FC<{
  variable: TemplateVariable | null;
  isOpen: boolean;
  onSave: (variable: TemplateVariable) => void;
  onCancel: () => void;
  existingVariables: TemplateVariable[];
}> = ({ variable, isOpen, onSave, onCancel, existingVariables }) => {
  
  if (!isOpen || !variable) return null;
  
  return (
    <Panel title="Configure Variable" onClose={onCancel}>
      <form onSubmit={handleSubmit}>
        <FormField label="Variable Name" required>
          <input 
            name="name"
            value={variable.name || ''}
            onChange={handleInputChange}
            pattern="^[a-z][a-z0-9_]*$"
            title="Must start with letter, lowercase, underscores allowed"
          />
        </FormField>
        
        <FormField label="Prompt Text" required>
          <input 
            name="prompt"
            value={variable.prompt || ''}
            onChange={handleInputChange}
            placeholder="What should users be asked?"
          />
        </FormField>
        
        <FormField label="Variable Type">
          <select name="type" value={variable.type || 'string'} onChange={handleInputChange}>
            <option value="string">Text</option>
            <option value="number">Number</option>
            <option value="boolean">Yes/No</option>
            <option value="choice">Multiple Choice</option>
            <option value="email">Email</option>
            <option value="url">URL</option>
          </select>
        </FormField>
        
        {variable.type === 'choice' && (
          <FormField label="Choices">
            <ChoiceEditor
              choices={variable.choices || []}
              onChange={(choices) => updateVariable({ ...variable, choices })}
            />
          </FormField>
        )}
        
        <FormField label="Default Value">
          <input 
            name="default"
            value={variable.default || ''}
            onChange={handleInputChange}
            placeholder="Optional default value"
          />
        </FormField>
        
        <FormField label="Required">
          <input 
            name="required"
            type="checkbox"
            checked={variable.required || false}
            onChange={handleCheckboxChange}
          />
        </FormField>
        
        <FormField label="Validation Pattern">
          <input 
            name="pattern"
            value={variable.pattern || ''}
            onChange={handleInputChange}
            placeholder="Optional regex pattern"
          />
        </FormField>
        
        <FormField label="Help Text">
          <textarea 
            name="description"
            value={variable.description || ''}
            onChange={handleInputChange}
            placeholder="Additional help text for users"
          />
        </FormField>
        
        <div className="form-actions">
          <button type="submit" className="primary">Save Variable</button>
          <button type="button" onClick={onCancel}>Cancel</button>
        </div>
      </form>
    </Panel>
  );
};
```

### Template Preview and Testing
```typescript
const TemplatePreview: React.FC<{
  templateDefinition: TemplateDefinition;
  testValues: Record<string, any>;
  onTestValuesChange: (values: Record<string, any>) => void;
}> = ({ templateDefinition, testValues, onTestValuesChange }) => {
  
  const [previewResult, setPreviewResult] = useState<TemplatePreviewResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const generatePreview = async () => {
    setIsGenerating(true);
    try {
      const result = await templateService.previewTemplate(templateDefinition, testValues);
      setPreviewResult(result);
    } catch (error) {
      setPreviewResult({ error: error.message, files: [] });
    } finally {
      setIsGenerating(false);
    }
  };
  
  return (
    <div className="template-preview">
      <div className="preview-controls">
        <h3>Test Template</h3>
        <div className="test-inputs">
          {templateDefinition.variables?.map(variable => (
            <VariableInput
              key={variable.name}
              variable={variable}
              value={testValues[variable.name]}
              onChange={(value) => onTestValuesChange({
                ...testValues,
                [variable.name]: value
              })}
            />
          ))}
        </div>
        
        <button 
          onClick={generatePreview} 
          disabled={isGenerating}
          className="generate-preview-btn"
        >
          {isGenerating ? 'Generating...' : 'Generate Preview'}
        </button>
      </div>
      
      <div className="preview-results">
        {previewResult?.error && (
          <ErrorPanel message={previewResult.error} />
        )}
        
        {previewResult?.files && (
          <FilePreview files={previewResult.files} />
        )}
      </div>
    </div>
  );
};
```

### Database Schema for Custom Templates
```sql
CREATE TABLE custom_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  display_name VARCHAR(200),
  description TEXT,
  category VARCHAR(50),
  tags JSONB DEFAULT '[]',
  
  -- Template definition
  template_yaml TEXT NOT NULL,
  version VARCHAR(20) DEFAULT '1.0.0',
  
  -- Ownership and access
  created_by UUID REFERENCES users(id),
  team_id UUID REFERENCES teams(id), -- null for personal templates
  is_public BOOLEAN DEFAULT FALSE,
  
  -- Status and metadata
  status VARCHAR(20) DEFAULT 'draft', -- draft, published, archived
  usage_count INTEGER DEFAULT 0,
  rating NUMERIC(3,2) DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT unique_template_name_user UNIQUE(name, created_by)
);

CREATE TABLE template_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES custom_templates(id) ON DELETE CASCADE,
  version VARCHAR(20) NOT NULL,
  template_yaml TEXT NOT NULL,
  change_summary TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT unique_template_version UNIQUE(template_id, version)
);

CREATE TABLE template_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES custom_templates(id) ON DELETE CASCADE,
  used_by UUID REFERENCES users(id),
  project_name VARCHAR(100),
  generated_at TIMESTAMP DEFAULT NOW()
);
```

## Dependencies

### Prerequisites
- Story 7.1 (Template Engine Foundation & YAML Parser) - **REQUIRED**
- Enhanced dashboard UI framework
- File upload and management capabilities
- Real-time preview rendering system

### External Libraries
- `react-dnd` - Drag and drop functionality
- `monaco-editor` - Code editor for template files
- `yaml` - YAML parsing and validation
- `react-hook-form` - Form management
- `react-select` - Enhanced select components

## Testing Strategy

### Unit Tests
- Template creation wizard flow
- Variable configuration validation
- File structure editor functionality
- Template preview generation
- Import/export operations

### Integration Tests
- Complete template creation workflow
- Template testing and validation
- Generated project functionality
- Template sharing and access control
- Cross-browser UI compatibility

### User Experience Tests
- Usability testing with real users
- Template creation time measurement
- Error handling and user feedback
- Mobile responsiveness testing
- Accessibility compliance validation

## Definition of Done

- [ ] Template creation wizard with guided steps
- [ ] Visual file structure editor with drag-and-drop
- [ ] Variable configuration builder with validation
- [ ] Template preview and testing functionality
- [ ] Template management dashboard
- [ ] Import existing projects as templates
- [ ] Export and share template functionality
- [ ] Template versioning and change tracking
- [ ] Comprehensive form validation and error handling
- [ ] Mobile-responsive design
- [ ] Accessibility compliance (WCAG 2.1)
- [ ] Performance optimization for large templates
- [ ] Comprehensive test suite (>85% coverage)
- [ ] User documentation and help system

## Performance Requirements

### UI Performance
- Template creation UI load time: <3 seconds
- File structure editor responsiveness: <200ms for interactions
- Template preview generation: <10 seconds for complex templates
- Form validation feedback: <100ms response time

### Scalability Targets
- Support templates with 500+ files and directories
- Handle 100+ template variables efficiently
- Manage 1000+ custom templates per user/team
- Concurrent template creation by multiple users

## Story Sizing Justification (8 Points)

This is a **medium-high complexity** story requiring:
- Sophisticated React UI components with drag-and-drop functionality
- Complex form management with dynamic validation
- Real-time template preview system
- File structure visualization and editing
- Database schema for template management and versioning
- Import/export functionality for template portability
- Integration with existing template engine and authentication systems
- Comprehensive user experience design and testing

The 8-point estimate reflects the significant UI/UX development effort and the need for a polished, user-friendly interface while building on the existing template engine foundation.

---

*This story empowers teams to create and share their own standardized project templates, amplifying the value of the template system through customization and team-specific best practices.*