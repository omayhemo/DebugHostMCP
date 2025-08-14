# AP Mapping - Agentic Persona Mapping Framework

Version: 1.1.0-alpha.2

## What is AP Mapping?

The AP (Agentic Persona) Mapping is a project-agnostic approach to orchestrating AI agents for software development. It provides specialized agent personas, each with specific expertise and responsibilities for planning and executing software projects.

## Quick Installation

### Download and Install (One Command)

**For Linux/WSL:**
```bash
wget https://github.com/omayhemo/agentic-persona-mapping/releases/download/v1.1.0-alpha.2/ap-method-v1.1.0-alpha.2.tar.gz && tar -xzf ap-method-v1.1.0-alpha.2.tar.gz && installer/install.sh
```

**For macOS:**
```bash
curl -L https://github.com/omayhemo/agentic-persona-mapping/releases/download/v1.1.0-alpha.2/ap-method-v1.1.0-alpha.2.tar.gz -o ap-method-v1.1.0-alpha.2.tar.gz && tar -xzf ap-method-v1.1.0-alpha.2.tar.gz && installer/install.sh
```

### Installation Options

**Option 1: Interactive Installation (Recommended)**
Add nothing - the installer will prompt for all configuration options

**Option 2: Install with Defaults (Skip prompts)**
```bash
# Linux/WSL
wget https://github.com/omayhemo/agentic-persona-mapping/releases/download/v1.1.0-alpha.2/ap-method-v1.1.0-alpha.2.tar.gz && tar -xzf ap-method-v1.1.0-alpha.2.tar.gz && installer/install.sh --defaults

# macOS
curl -L https://github.com/omayhemo/agentic-persona-mapping/releases/download/v1.1.0-alpha.2/ap-method-v1.1.0-alpha.2.tar.gz -o ap-method-v1.1.0-alpha.2.tar.gz && tar -xzf ap-method-v1.1.0-alpha.2.tar.gz && installer/install.sh --defaults
```

**Option 3: Install to Specific Directory**
```bash
# Linux/WSL
wget https://github.com/omayhemo/agentic-persona-mapping/releases/download/v1.1.0-alpha.2/ap-method-v1.1.0-alpha.2.tar.gz && tar -xzf ap-method-v1.1.0-alpha.2.tar.gz && installer/install.sh /path/to/your/project

# macOS
curl -L https://github.com/omayhemo/agentic-persona-mapping/releases/download/v1.1.0-alpha.2/ap-method-v1.1.0-alpha.2.tar.gz -o ap-method-v1.1.0-alpha.2.tar.gz && tar -xzf ap-method-v1.1.0-alpha.2.tar.gz && installer/install.sh /path/to/your/project
```

**Option 4: Install with Piper TTS Voice Support**
```bash
# Linux/WSL
wget https://github.com/omayhemo/agentic-persona-mapping/releases/download/v1.1.0-alpha.2/ap-method-v1.1.0-alpha.2.tar.gz && tar -xzf ap-method-v1.1.0-alpha.2.tar.gz && installer/install.sh --with-tts

# macOS
curl -L https://github.com/omayhemo/agentic-persona-mapping/releases/download/v1.1.0-alpha.2/ap-method-v1.1.0-alpha.2.tar.gz -o ap-method-v1.1.0-alpha.2.tar.gz && tar -xzf ap-method-v1.1.0-alpha.2.tar.gz && installer/install.sh --with-tts
```

## Key Features

- **9 Specialized Agents**: Each agent has specific expertise (PM, Architect, Developer, QA, etc.)
- **Structured Workflow**: From project briefs to implementation
- **Session Management**: Automatic session notes with archival
- **Voice Notifications**: Multiple TTS providers for audio feedback
- **Project Agnostic**: Works with any project type or technology stack
- **Parallel Execution**: 
  - Developer: `/parallel-review` for simultaneous code analysis
  - QA: `/parallel-test` for concurrent test execution
  - PO: `/groom` for parallel backlog analysis
  - 80%+ time reduction on complex tasks

## What Gets Installed

The installation creates the following structure in your project:

```
your-project/
├── agents/                    # AP Mapping framework
│   ├── personas/             # 10 agent persona definitions
│   ├── tasks/                # 28 reusable task definitions
│   │   └── subtasks/         # Parallel execution templates
│   │       ├── development/  # 9 developer analysis templates
│   │       ├── qa/           # 6 QA testing templates
│   │       └── synthesis/    # 10 result aggregation patterns
│   ├── templates/            # 19 document templates
│   ├── checklists/           # 17 quality checklists
│   ├── scripts/              # Utility and automation scripts
│   ├── voice/                # 10 voice notification scripts
│   ├── data/                 # Knowledge base and preferences
│   └── [configuration files]
├── .claude/                  # Claude AI configuration
│   ├── settings.json         # Project settings
│   └── commands/             # Custom commands (/ap, /handoff, etc.)
└── /    # Created for your project docs
    ├── base/                 # Core project documents
    ├── epics/                # Epic documentation
    ├── stories/              # User story files
    └── qa/                   # Quality assurance docs
```

## Agent Personas

- **AP Orchestrator**: Central coordinator and method expert
- **Analyst**: Research, requirements gathering, project briefs
- **PM**: Product Requirements Documents, epics, planning
- **Architect**: System design, technical architecture
- **Design Architect**: UI/UX, frontend architecture
- **PO**: Backlog management, story validation
- **SM**: Story generation, sprint planning
- **Developer**: Code implementation
- **QA**: Quality assurance, testing strategies

## Installation Process

The installer will:

1. **Check for existing installations** - Offers to backup if found
2. **Copy AP Mapping files** - Installs the complete framework
3. **Configure your project** - Interactive prompts for:
   - Project name
   - Documentation paths
   - Session notes configuration (Obsidian MCP or local markdown)
   - Voice notification preferences
4. **Create Claude commands** - Sets up `/ap`, `/handoff`, `/switch`, `/wrap`
5. **Update .gitignore** - Excludes session notes from version control
6. **Generate CLAUDE.md** - Project instructions for Claude AI

## Commands

### Core Commands
- `/ap` - Launch AP Orchestrator
- `/handoff <agent>` - Direct transition to another agent
- `/switch <agent>` - Compact session and switch agent
- `/wrap` - Archive session and create summary
- `/session-note-setup` - Initialize session structure

### Parallel Execution Commands
- `/parallel-review` - Developer: Simultaneous code analysis (security, performance, test coverage)
- `/parallel-test` - QA: Concurrent test execution (cross-browser, accessibility, load tests)
- `/groom` - PO: Parallel backlog grooming (analyze docs, generate epics/stories, optimize sprints)

### Management Commands
- `$AP_ROOT/scripts/ap-manager.sh update` - Check for updates
- `$AP_ROOT/scripts/ap-manager.sh verify` - Verify installation integrity
- `$AP_ROOT/scripts/ap-manager.sh version` - Show current version

## First Steps After Installation

1. Open your project in Claude Code
2. Run `/ap` to activate the AP Orchestrator
3. Let the Orchestrator guide you through setting up your project

## Installation Notes

- **Clean Installation**: The installer automatically cleans up distribution files after installation
- **Preserved Installer**: The installer is preserved in `agents/.installer/` for future updates
- **Session Notes**: Choose between Obsidian MCP integration or local markdown files
- **TTS Configuration**: Voice support is optional and can be configured post-installation
- **Python Support**: Optional Python virtual environment for hooks (recommended)

## Version Management

The installer includes comprehensive version and update management:

- **Version Tracking**: Automatically creates `agents/version.txt` during installation
- **Update Checking**: Uses GitHub Releases API to check for new versions  
- **In-Place Updates**: Updates can be applied without losing your work
- **Automatic Backups**: Creates backups before updates and uninstalls
- **Installer Preservation**: Installer saved to `agents/.installer/` for future use

See the [AP Manager Documentation](..//ap-manager.md) for detailed information.

## Optional Features

### Parallel Subtask System

The AP Mapping includes a powerful parallel execution system for Developer and QA agents:

#### Developer Parallel Reviews (`/parallel-review`)
Execute multiple code analysis tasks simultaneously:
- **Security Scan**: Vulnerability detection and OWASP compliance
- **Performance Check**: Bottleneck identification and optimization
- **Test Coverage**: Code coverage analysis and gaps
- **Code Complexity**: Cyclomatic complexity and maintainability
- **Dependency Audit**: Security vulnerabilities in dependencies
- **Memory Profiling**: Memory leaks and optimization
- **Database Optimization**: Query performance and indexing
- **API Design Review**: REST/GraphQL best practices
- **Architecture Compliance**: Pattern adherence and structure

#### QA Parallel Testing (`/parallel-test`)
Run comprehensive test suites in parallel:
- **Cross-Browser Testing**: Chrome, Firefox, Safari, Edge compatibility
- **Accessibility Audit**: WCAG compliance and screen reader support
- **API Contract Testing**: Schema validation and breaking changes
- **Load Testing**: Performance under stress and scalability
- **Mobile Responsive Testing**: Device compatibility and touch interactions
- **E2E User Journey**: Critical path validation

#### Performance Benefits
- **Sequential Execution**: 25-35 minutes for comprehensive review
- **Parallel Execution**: 5-7 minutes (80% time reduction)
- **Automatic Synthesis**: Results aggregated with priority rankings

### Text-to-Speech (TTS) System

The AP Mapping includes a modular TTS system that supports multiple providers:

#### Available TTS Providers:

1. **Piper** (Default)
   - Local, offline text-to-speech
   - ~100MB download for binary and voice models
   - 9 different voices (5 women, 4 men)
   - No internet connection required

2. **ElevenLabs**
   - High-quality cloud-based voices
   - Requires API key (free tier available)
   - Natural-sounding AI voices
   - Automatic response caching

3. **System TTS**
   - Uses your OS built-in TTS
   - macOS: `say` command
   - Linux: `espeak`, `festival`, or `spd-say`
   - No additional downloads required

4. **Discord**
   - Send notifications to Discord channel
   - Optional TTS in Discord voice channels
   - Requires webhook URL

5. **None**
   - Silent mode - no audio output
   - For environments without audio support

#### TTS Configuration:

During installation, you'll be prompted to select a TTS provider. You can also configure TTS later:

```bash
# Configure TTS after installation
/ap-manager.sh configure-tts

# Or use the configuration utility directly
/configure-tts.sh
```

#### Managing TTS:

```bash
# Test current TTS provider
/tts-manager.sh test

# List available providers
/tts-manager.sh list

# Clear audio cache
/tts-manager.sh clear-cache

# Configure specific provider
/tts-manager.sh configure elevenlabs
```

### Obsidian MCP Integration

For cross-session memory using Obsidian:
1. Install Obsidian MCP server
2. Configure during setup with your vault path
3. Session notes will sync automatically

### Python Support

The installer can optionally set up Python support for hooks and scripts:
- Creates a virtual environment for package isolation
- Provides wrapper scripts for Python execution
- Manages dependencies via requirements.txt
- Install during setup or later with `agents/python-support/setup-python.sh`

Note: Hooks work with system Python by default. The virtual environment is only needed if you want to add Python packages.

## Troubleshooting

### Permission Denied

If you get permission errors:
```bash
chmod +x install.sh
```

### Existing Installation

The installer detects existing installations and offers options:
- Create a backup (recommended)
- Overwrite existing files
- Cancel installation

### Claude Commands Not Working

Ensure you're using Claude Code (claude.ai/code) and that:
1. `.claude/commands/` directory exists
2. Commands have proper permissions
3. You're in the project root directory

## Building from Source

To create your own distribution:

```bash
# From the repository root
./build-distribution.sh

# Creates dist/ap-method-v*.tar.gz
```

## What's Next?

After installation:
1. Review `/agents/README.md` for AP Mapping overview
2. Use `/ap` command to start the AP Orchestrator
3. Begin with the Analyst agent to create a project brief
4. Follow the AP workflow through each phase

## Managing Your Installation

The AP Mapping includes `ap-manager.sh` for ongoing management:

```bash
# Check for updates
/ap-manager.sh update

# Verify installation integrity
/ap-manager.sh verify

# Show current version
/ap-manager.sh version

# Uninstall AP Mapping
/ap-manager.sh uninstall
```

Updates are checked against the official GitHub releases and can be applied in-place without losing your project work.

## Documentation

After installation, see:
- `CLAUDE.md` - Main instructions for Claude Code
- `/` - Your project-specific documentation
- `agents/README.md` - Detailed agent information
- `/` - AP Mapping guides and references

## Troubleshooting

- **Permission Issues**: Run `chmod +x installer/install.sh` if needed
- **Missing Dependencies**: The installer will notify you of any missing tools
- **Voice Not Working**: Check TTS configuration with `$AP_ROOT/scripts/configure-tts.sh`
- **Session Notes**: Verify Obsidian MCP is installed if using Obsidian integration

## Support

For issues or questions:
- GitHub: https://github.com/chrisgscott/agentic-persona
- Documentation: See agents/README.md
- Version: This is an Alpha release - feedback welcome!

## License

This project is licensed under the MIT License.