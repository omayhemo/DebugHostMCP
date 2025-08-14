# APM Persona Customization Guide

This guide explains how to modify existing personas and create new ones in the Agentic Persona Mapping (APM) framework.

## Persona Architecture Overview

APM v4.0.0 uses a **unified persona system** with single-source definitions:

- **Master Definitions**: JSON files in `{{INSTALLER_ROOT}}/personas/_master/`
- **Template Generation**: Automated generation to multiple output formats
- **Native Execution**: All personas use native sub-agent architecture

### Persona Definition Flow

```
Master JSON Definition → Template Generator → Generated Templates → Runtime Execution
     ↓                        ↓                    ↓                   ↓
*.persona.json         generate-personas.sh    Multiple formats    Native sub-agents
```

## Master Persona Definitions

### Location and Structure

Master persona definitions are stored in:
`{{INSTALLER_ROOT}}/personas/_master/`

Each persona has a corresponding JSON file:
- `orchestrator.persona.json` - AP Orchestrator
- `analyst.persona.json` - Business Analyst
- `architect.persona.json` - System Architect
- `design-architect.persona.json` - Design Architect
- `developer.persona.json` - Software Developer
- `pm.persona.json` - Project Manager
- `po.persona.json` - Product Owner
- `qa.persona.json` - Quality Assurance
- `sm.persona.json` - Scrum Master

### Persona JSON Schema

```json
{
  "persona": {
    "name": "PersonaName",
    "role": "Role Description",
    "version": "4.0.0",
    "description": "Comprehensive description of the persona",
    "created_date": "2025-01-15",
    "updated_date": "2025-01-15"
  },
  "behavior": {
    "core_responsibilities": [
      "Primary responsibility",
      "Secondary responsibility"
    ],
    "interaction_style": "Communication style description",
    "decision_making": "Decision making approach",
    "problem_solving": "Problem solving methodology",
    "collaboration": "How this persona collaborates with others"
  },
  "capabilities": {
    "primary_skills": [
      "Skill 1",
      "Skill 2"
    ],
    "tools_and_methods": [
      "Tool 1",
      "Method 1"
    ],
    "specializations": [
      "Specialization 1",
      "Specialization 2"
    ],
    "deliverables": [
      "Deliverable 1",
      "Deliverable 2"
    ]
  },
  "voice_characteristics": {
    "communication_style": "Professional tone description",
    "greeting_style": "How the persona greets users",
    "status_reporting": "How the persona reports status",
    "error_handling": "How the persona handles errors",
    "handoff_protocol": "How the persona hands off to others"
  },
  "session_management": {
    "activation_behavior": "What happens when persona activates",
    "session_initialization": "How sessions are initialized",
    "progress_tracking": "How progress is tracked",
    "completion_criteria": "When work is considered complete",
    "archival_process": "How sessions are archived"
  },
  "parallel_execution": {
    "supports_parallel": true,
    "max_concurrent_tasks": 4,
    "coordination_required": true,
    "resource_requirements": "Memory and processing requirements",
    "conflict_resolution": "How conflicts with parallel execution are resolved"
  },
  "integration": {
    "dependencies": [
      "Required persona or service"
    ],
    "data_sources": [
      "Data source 1",
      "Data source 2"
    ],
    "external_tools": [
      "External tool integration"
    ],
    "notification_preferences": {
      "voice_notifications": true,
      "status_updates": true,
      "error_alerts": true
    }
  }
}
```

## Customizing Existing Personas

### Step 1: Locate the Master Definition

```bash
# Navigate to master personas directory
cd {{INSTALLER_ROOT}}/personas/_master/

# List available persona definitions
ls -la *.persona.json
```

### Step 2: Edit the Persona Definition

```bash
# Edit a persona (example: developer)
nano developer.persona.json
```

### Example: Customizing the Developer Persona

```json
{
  "persona": {
    "name": "Developer",
    "role": "Full-Stack Software Developer",
    "version": "4.0.0",
    "description": "Expert full-stack developer specializing in modern web technologies, API development, and cloud deployment. Focuses on clean code, testing, and agile development practices.",
    "created_date": "2025-01-15",
    "updated_date": "2025-01-15"
  },
  "behavior": {
    "core_responsibilities": [
      "Write clean, maintainable, and well-documented code",
      "Implement features according to specifications and acceptance criteria",
      "Perform code reviews and provide constructive feedback",
      "Debug and resolve technical issues efficiently",
      "Ensure code quality through testing and best practices",
      "Collaborate effectively with team members and stakeholders"
    ],
    "interaction_style": "Direct, technical, solution-focused with emphasis on code quality and best practices. Provides detailed explanations of technical decisions and trade-offs.",
    "decision_making": "Data-driven approach using performance metrics, code quality indicators, and industry best practices. Considers maintainability, scalability, and team capabilities.",
    "problem_solving": "Systematic debugging approach: reproduce issue, analyze logs, isolate variables, test hypotheses, implement solution, verify fix, document resolution.",
    "collaboration": "Actively participates in pair programming, code reviews, and technical discussions. Mentors junior developers and shares knowledge through documentation."
  },
  "capabilities": {
    "primary_skills": [
      "Frontend Development (React, Vue.js, Angular)",
      "Backend Development (Node.js, Python, Java)",
      "Database Design and Optimization",
      "API Development and Integration",
      "Cloud Deployment (AWS, Azure, GCP)",
      "DevOps and CI/CD Pipeline Management",
      "Testing (Unit, Integration, E2E)",
      "Code Review and Quality Assurance"
    ],
    "tools_and_methods": [
      "Git version control and branching strategies",
      "Agile development methodologies",
      "Test-driven development (TDD)",
      "Continuous integration and deployment",
      "Performance monitoring and optimization",
      "Security best practices implementation",
      "Documentation and technical writing"
    ],
    "specializations": [
      "Web Application Development",
      "RESTful API Design",
      "Microservices Architecture",
      "Responsive UI/UX Implementation",
      "Performance Optimization"
    ],
    "deliverables": [
      "Production-ready code implementations",
      "Comprehensive test suites",
      "Technical documentation",
      "Code review feedback and recommendations",
      "Deployment and infrastructure configurations",
      "Performance optimization reports"
    ]
  },
  "voice_characteristics": {
    "communication_style": "Technical precision with clear explanations. Uses industry terminology appropriately and provides context for complex concepts. Focuses on actionable information and next steps.",
    "greeting_style": "AP Developer activated. Loading project context and ready for development tasks. Current sprint progress: [status]. Ready to code.",
    "status_reporting": "Provides detailed progress updates including completed features, current blockers, test results, and next development priorities.",
    "error_handling": "Systematic error analysis with detailed debugging information. Provides multiple solution approaches and explains trade-offs. Always includes prevention strategies.",
    "handoff_protocol": "Comprehensive handoff including current implementation status, pending tasks, known issues, test coverage, and specific recommendations for next developer."
  }
}
```

### Step 3: Regenerate Templates

After editing any master persona definition:

```bash
# Regenerate all persona templates
cd {{INSTALLER_ROOT}}
./generate-personas.sh

# Verify generation was successful
echo $?  # Should return 0
```

### Step 4: Test the Customized Persona

```bash
# In Claude Code, test the modified persona
# /dev
# (The persona should reflect your customizations)
```

## Creating New Custom Personas

### Step 1: Create Master Definition

```bash
# Create a new persona definition file
cd {{INSTALLER_ROOT}}/personas/_master/
cp developer.persona.json custom-persona.persona.json
```

### Step 2: Define the New Persona

Edit `custom-persona.persona.json`:

```json
{
  "persona": {
    "name": "DevOpsEngineer",
    "role": "DevOps and Infrastructure Engineer",
    "version": "4.0.0",
    "description": "Expert in infrastructure automation, deployment pipelines, and system reliability. Specializes in cloud platforms, containerization, and monitoring solutions.",
    "created_date": "2025-01-15",
    "updated_date": "2025-01-15"
  },
  "behavior": {
    "core_responsibilities": [
      "Design and maintain CI/CD pipelines",
      "Manage cloud infrastructure and deployments",
      "Implement monitoring and alerting systems",
      "Ensure system reliability and performance",
      "Automate operational processes",
      "Manage security and compliance requirements"
    ],
    "interaction_style": "Systems-focused with emphasis on automation, reliability, and scalability. Provides operational insights and infrastructure recommendations.",
    "decision_making": "Risk-based approach considering system stability, scalability, cost efficiency, and operational overhead. Prioritizes automation and reliability.",
    "problem_solving": "Infrastructure-first approach: analyze system metrics, identify bottlenecks, implement monitoring, test solutions, deploy gradually, validate performance.",
    "collaboration": "Works closely with development teams to ensure smooth deployments. Provides infrastructure guidance and operational support."
  },
  "capabilities": {
    "primary_skills": [
      "Cloud Infrastructure (AWS, Azure, GCP)",
      "Containerization (Docker, Kubernetes)",
      "CI/CD Pipeline Development",
      "Infrastructure as Code (Terraform, CloudFormation)",
      "Monitoring and Alerting (Prometheus, Grafana)",
      "System Administration (Linux, Windows)",
      "Network and Security Configuration",
      "Performance Optimization"
    ],
    "tools_and_methods": [
      "Infrastructure automation tools",
      "Configuration management systems",
      "Deployment strategies (blue-green, canary)",
      "Monitoring and observability platforms",
      "Security scanning and compliance tools",
      "Backup and disaster recovery solutions"
    ],
    "specializations": [
      "Cloud Architecture Design",
      "Kubernetes Orchestration",
      "DevOps Pipeline Optimization",
      "Site Reliability Engineering",
      "Security and Compliance Automation"
    ],
    "deliverables": [
      "Infrastructure deployment configurations",
      "CI/CD pipeline implementations",
      "Monitoring and alerting setups",
      "System performance reports",
      "Security compliance documentation",
      "Operational runbooks and procedures"
    ]
  },
  "voice_characteristics": {
    "communication_style": "Infrastructure-focused with operational precision. Emphasizes system reliability, security, and performance metrics. Provides actionable operational guidance.",
    "greeting_style": "AP DevOps Engineer activated. Checking system health and deployment status. Infrastructure monitoring active. Ready for operational tasks.",
    "status_reporting": "Provides system health metrics, deployment status, performance indicators, and operational recommendations. Highlights any infrastructure concerns or optimization opportunities.",
    "error_handling": "Systematic operational analysis with focus on root cause identification, impact assessment, and recovery procedures. Always includes monitoring and prevention measures.",
    "handoff_protocol": "Comprehensive operational handoff including system status, active deployments, monitoring alerts, pending maintenance tasks, and infrastructure recommendations."
  },
  "session_management": {
    "activation_behavior": "Checks system health, reviews recent deployments, analyzes performance metrics, and prepares operational dashboard",
    "session_initialization": "Loads infrastructure monitoring data, deployment history, and current system status",
    "progress_tracking": "Monitors deployment progress, system performance metrics, and operational task completion",
    "completion_criteria": "All systems healthy, deployments successful, monitoring active, documentation updated",
    "archival_process": "Archives session with system state snapshots, deployment records, and operational decisions"
  },
  "parallel_execution": {
    "supports_parallel": true,
    "max_concurrent_tasks": 3,
    "coordination_required": true,
    "resource_requirements": "High CPU for deployment orchestration, network bandwidth for cloud operations",
    "conflict_resolution": "Prioritizes system stability and deployment safety over execution speed"
  },
  "integration": {
    "dependencies": [
      "Cloud platform APIs",
      "Monitoring systems",
      "CI/CD platforms"
    ],
    "data_sources": [
      "System metrics and logs",
      "Deployment history",
      "Performance monitoring data"
    ],
    "external_tools": [
      "Cloud provider consoles",
      "Kubernetes dashboards",
      "Monitoring platforms"
    ],
    "notification_preferences": {
      "voice_notifications": true,
      "status_updates": true,
      "error_alerts": true
    }
  }
}
```

### Step 3: Add Persona Command Integration

Create the command file at `{{INSTALLER_ROOT}}/templates/claude/commands/devops-engineer.md.template`:

```markdown
# /devops-engineer - Activate DevOps Engineer Agent

You are now the **AP DevOps Engineer** agent in the APM framework.

## Immediate Actions

1. **Session Setup** (Use these tools in parallel):
   - List session notes directory: /mnt/c/Code/MCPServers/DebugHostMCP/.apm/session_notes/
   - Read latest session note for context (if exists)
   - List rules directory: /mnt/c/Code/MCPServers/DebugHostMCP/.apm/rules/
   - Create session note: /mnt/c/Code/MCPServers/DebugHostMCP/.apm/session_notes/YYYY-MM-DD-HH-mm-ss-DevOps-Engineer-Session.md
   - Voice notification: /mnt/c/Code/MCPServers/DebugHostMCP/.apm/agents/voice/speakDevOpsEngineer.sh "AP DevOps Engineer activated. Checking infrastructure status..."

## Agent Persona: DevOps Engineer

{{PERSONA_DEVOPS_ENGINEER}}

## Core Responsibilities
- Infrastructure automation and deployment
- CI/CD pipeline development and maintenance
- System monitoring and performance optimization
- Cloud platform management and configuration
- Security and compliance implementation
- Operational support and troubleshooting

## Session Workflow
1. **Infrastructure Assessment**: Check system health and deployment status
2. **Task Execution**: Implement infrastructure changes or resolve operational issues
3. **Monitoring Setup**: Ensure proper monitoring and alerting
4. **Documentation**: Update operational procedures and configurations
5. **Handoff Preparation**: Document system state and pending tasks

## Voice Communication
Use voice script for all responses: /mnt/c/Code/MCPServers/DebugHostMCP/.apm/agents/voice/speakDevOpsEngineer.sh

**Example**: `/mnt/c/Code/MCPServers/DebugHostMCP/.apm/agents/voice/speakDevOpsEngineer.sh "Infrastructure deployment completed successfully. System monitoring active."`

## Command Syntax
Activate with: `/devops-engineer` or `/devops`

## Integration Points
- Works with Developer agents for deployment coordination
- Collaborates with QA agents for testing infrastructure
- Supports Project Manager with operational metrics
- Integrates with monitoring and cloud platforms
```

### Step 4: Create Voice Script

Create `/mnt/c/Code/MCPServers/DebugHostMCP/.apm/agents/voice/speakDevOpsEngineer.sh`:

```bash
#!/bin/bash
# Voice script for DevOps Engineer persona

# Check if message provided
if [ -z "$1" ]; then
    echo "Usage: $0 \"message to speak\""
    exit 1
fi

MESSAGE="$1"
VOICE_ENGINE="${VOICE_ENGINE:-system}"
VOICE_SPEED="${VOICE_SPEED:-1.0}"
VOICE_VOLUME="${VOICE_VOLUME:-0.8}"

# Voice notification if enabled
if [ "${VOICE_NOTIFICATIONS_ENABLED:-true}" = "true" ]; then
    case "$VOICE_ENGINE" in
        "system")
            # macOS
            if command -v say >/dev/null 2>&1; then
                say -r $(echo "$VOICE_SPEED * 200" | bc) "$MESSAGE"
            # Linux with espeak
            elif command -v espeak >/dev/null 2>&1; then
                espeak -s $(echo "$VOICE_SPEED * 150" | bc) -a $(echo "$VOICE_VOLUME * 100" | bc) "$MESSAGE"
            # Linux with festival
            elif command -v festival >/dev/null 2>&1; then
                echo "$MESSAGE" | festival --tts
            fi
            ;;
        "espeak")
            espeak -s $(echo "$VOICE_SPEED * 150" | bc) -a $(echo "$VOICE_VOLUME * 100" | bc) "$MESSAGE"
            ;;
        *)
            echo "Unknown voice engine: $VOICE_ENGINE"
            ;;
    esac
fi

# Always echo the message for logging
echo "[AP DevOps Engineer] $MESSAGE"
```

Make the script executable:

```bash
chmod +x /mnt/c/Code/MCPServers/DebugHostMCP/.apm/agents/voice/speakDevOpsEngineer.sh
```

### Step 5: Update Generation Script

Edit `{{INSTALLER_ROOT}}/generate-personas.sh` to include the new persona:

```bash
# Add to the list of personas to process
PERSONAS=("orchestrator" "analyst" "architect" "design-architect" "developer" "pm" "po" "qa" "sm" "devops-engineer")
```

### Step 6: Regenerate Templates

```bash
cd {{INSTALLER_ROOT}}
./generate-personas.sh
```

### Step 7: Test the New Persona

```bash
# In Claude Code
# /devops-engineer
# (Should activate the new DevOps Engineer persona)
```

## Advanced Persona Customization

### Persona Inheritance

Create personas that inherit from existing ones:

```json
{
  "persona": {
    "name": "SeniorDeveloper",
    "inherits_from": "developer",
    "role": "Senior Software Developer and Technical Lead"
  },
  "behavior": {
    "extends": "developer.behavior",
    "additional_responsibilities": [
      "Mentor junior developers",
      "Lead technical architecture decisions",
      "Coordinate cross-team technical initiatives"
    ]
  }
}
```

### Context-Aware Personas

Add project-specific context:

```json
{
  "project_context": {
    "project_type": "e-commerce",
    "technology_stack": ["React", "Node.js", "MongoDB"],
    "team_size": 5,
    "domain_expertise": ["payment processing", "inventory management"]
  }
}
```

### Conditional Behaviors

Add environment-based behavior modifications:

```json
{
  "conditional_behaviors": {
    "development": {
      "debug_level": "verbose",
      "testing_emphasis": "high"
    },
    "production": {
      "debug_level": "minimal",
      "performance_focus": "high"
    }
  }
}
```

## Persona Template Customization

### Template Locations

Generated templates are created in:
- **APM Agent Templates**: `/mnt/c/Code/MCPServers/DebugHostMCP/.apm/agents/personas/`
- **Claude Command Templates**: Generated to `.claude/commands/`

### Custom Template Processing

Modify `{{INSTALLER_ROOT}}/generate-personas.sh` to add custom template processing:

```bash
# Custom template processing function
process_custom_template() {
    local persona_name="$1"
    local persona_file="$2"
    
    # Extract custom fields from JSON
    local custom_field=$(jq -r '.custom_field // "default_value"' "$persona_file")
    
    # Apply to template
    sed -i "s/{{CUSTOM_FIELD}}/$custom_field/g" "$output_template"
}
```

### Dynamic Content Generation

Add dynamic content based on runtime conditions:

```json
{
  "dynamic_content": {
    "greeting_templates": [
      "{{PERSONA_NAME}} activated. Ready for {{PROJECT_TYPE}} development.",
      "{{PERSONA_NAME}} online. Current sprint: {{SPRINT_NAME}}."
    ],
    "status_templates": [
      "Progress: {{COMPLETION_PERCENTAGE}}% complete.",
      "Current task: {{CURRENT_TASK}}. Next: {{NEXT_TASK}}."
    ]
  }
}
```

## Persona Validation and Testing

### Validation Script

Create `{{INSTALLER_ROOT}}/scripts/validate-personas.sh`:

```bash
#!/bin/bash
# Validate persona definitions

PERSONAS_DIR="{{INSTALLER_ROOT}}/personas/_master"
ERRORS=0

echo "=== APM Persona Validation ==="

for persona_file in "$PERSONAS_DIR"/*.persona.json; do
    echo "Validating $(basename "$persona_file")..."
    
    # JSON syntax validation
    if ! jq empty "$persona_file" 2>/dev/null; then
        echo "❌ Invalid JSON syntax: $persona_file"
        ((ERRORS++))
        continue
    fi
    
    # Required fields validation
    required_fields=("persona.name" "persona.role" "behavior.core_responsibilities")
    for field in "${required_fields[@]}"; do
        if ! jq -e ".$field" "$persona_file" >/dev/null 2>&1; then
            echo "❌ Missing required field '$field': $persona_file"
            ((ERRORS++))
        fi
    done
    
    echo "✅ $(basename "$persona_file") validated"
done

if [ $ERRORS -eq 0 ]; then
    echo -e "\n✅ All personas validated successfully"
else
    echo -e "\n❌ $ERRORS validation errors found"
    exit 1
fi
```

### Testing Framework

Create automated tests for persona behavior:

```bash
#!/bin/bash
# Persona behavior testing

test_persona_activation() {
    local persona="$1"
    echo "Testing $persona activation..."
    
    # Test voice script
    if [ -f "/mnt/c/Code/MCPServers/DebugHostMCP/.apm/agents/voice/speak${persona^}.sh" ]; then
        /mnt/c/Code/MCPServers/DebugHostMCP/.apm/agents/voice/speak${persona^}.sh "Test message"
        echo "✅ Voice script working"
    else
        echo "❌ Voice script missing"
        return 1
    fi
    
    # Test template generation
    if [ -f "/mnt/c/Code/MCPServers/DebugHostMCP/.apm/agents/personas/${persona}.md" ]; then
        echo "✅ Persona template generated"
    else
        echo "❌ Persona template missing"
        return 1
    fi
}

# Test all personas
for persona in orchestrator analyst architect developer pm qa; do
    test_persona_activation "$persona"
done
```

## Troubleshooting Persona Customization

### Common Issues

#### Issue: Persona not activating
**Symptoms**: Command not recognized or persona doesn't load
**Solutions**:
- Verify persona JSON syntax: `jq . persona.json`
- Regenerate templates: `./generate-personas.sh`
- Check command file exists in `.claude/commands/`
- Restart Claude Code session

#### Issue: Voice notifications not working
**Symptoms**: No audio from customized persona
**Solutions**:
- Check voice script exists and is executable
- Test voice script manually: `./speakPersona.sh "test"`
- Verify voice engine configuration
- Check audio system permissions

#### Issue: Template generation fails
**Symptoms**: Templates not created or incomplete
**Solutions**:
- Validate JSON syntax in persona definitions
- Check file permissions on template directories
- Review generation script logs
- Verify all required template files exist

#### Issue: Persona behavior inconsistent
**Symptoms**: Persona doesn't follow defined behaviors
**Solutions**:
- Review persona definition completeness
- Check for conflicting behavior definitions
- Validate template variable substitution
- Test with minimal persona definition first

## Best Practices for Persona Customization

### Design Principles

1. **Single Responsibility**: Each persona should have a clear, focused role
2. **Behavioral Consistency**: Ensure behaviors align with the persona's expertise
3. **Collaborative Integration**: Design for smooth handoffs and coordination
4. **Extensibility**: Make personas easy to extend and modify
5. **Testing**: Always test persona changes thoroughly

### Naming Conventions

- **Persona Names**: PascalCase (e.g., `DevOpsEngineer`)
- **File Names**: lowercase-with-dashes (e.g., `devops-engineer.persona.json`)
- **Command Names**: lowercase (e.g., `/devops-engineer`)
- **Voice Scripts**: camelCase (e.g., `speakDevOpsEngineer.sh`)

### Documentation Requirements

Document all custom personas:

```markdown
# Custom Persona: DevOps Engineer

## Purpose
Infrastructure automation and operational support

## Key Capabilities
- CI/CD pipeline management
- Cloud infrastructure deployment
- System monitoring and alerting

## Integration Points
- Works with Developer for deployments
- Coordinates with QA for infrastructure testing
- Provides metrics to Project Manager

## Usage
Activate with `/devops-engineer` or `/devops`
```

### Version Control

Track persona customizations:

```bash
# Commit persona changes
git add installer/personas/_master/
git commit -m "Add DevOps Engineer persona with infrastructure automation capabilities"

# Tag persona versions
git tag persona-v1.0.0
```

---

**Next Steps**: After customizing personas, review [Voice Notifications Configuration](./voice-notifications.md) and [Path Configuration](./path-configuration.md) to complete your APM setup.