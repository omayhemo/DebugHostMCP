# Quick Start Guide - APM Framework

Welcome! This guide will have you productive with APM in just 5 minutes.

---

## ✅ Prerequisites

Before starting, ensure you have:
- Claude Code (Cursor, Windsurf, or similar AI IDE)
- The `.apm/` directory in your project (created by installer)
- This documentation (you're reading it!)

---

## 🚀 Your First 5 Minutes

### Minute 1: Verify Your Installation

Check that APM is properly installed:

```bash
# List the APM directory structure
ls -la .apm/

# You should see:
# - agents/       (persona definitions and tasks)
# - documentation/ (this documentation)
# - session_notes/ (work tracking)
# - rules/        (operational guidelines)
```

### Minute 2: Activate the AP Orchestrator

The AP Orchestrator is your central command center. Activate it:

```bash
ap
```

**What happens:**
- The Orchestrator initializes the APM system
- Loads all 9 agent personas
- Prepares parallel execution capabilities
- You'll hear a voice notification (if TTS is enabled)

**Expected response:**
```
✓ AP Orchestrator initialized with comprehensive APM system knowledge

Welcome to the Agentic Persona Mapping Framework v{{APM_VERSION}}!
I'm your AP Orchestrator, ready to coordinate your development workflow.
```

### Minute 3: Meet Your First Agent

Let's activate the Analyst to explore an idea:

```bash
/analyst
```

**Try this prompt:**
```
Help me brainstorm ideas for a task management application
```

The Analyst will:
- Guide you through structured brainstorming
- Ask clarifying questions
- Document ideas systematically
- Prepare findings for other agents

### Minute 4: Experience Parallel Execution

See the power of parallel commands:

```bash
/parallel-brainstorming
```

This runs multiple analysis tasks simultaneously:
- Market research
- User needs analysis
- Technical feasibility
- Competitive analysis

**Result:** 4x faster than sequential execution!

### Minute 5: Explore Available Commands

See what else you can do:

```bash
/help
```

**Key commands to try next:**
- `/pm` - Create a Product Requirements Document
- `/architect` - Design system architecture
- `/parallel-stories` - Generate user stories in batch
- `/qa` - Activate quality assurance

---

## 🎯 What Just Happened?

You've successfully:
1. ✅ Verified your APM installation
2. ✅ Activated the central Orchestrator
3. ✅ Used your first specialized agent
4. ✅ Experienced parallel execution
5. ✅ Discovered available commands

---

## 📚 Understanding the Basics

### What Are Agents?
Agents are specialized AI personas, each expert in their domain:
- **Analyst** - Research and discovery
- **PM** - Product management
- **Architect** - System design
- **Developer** - Code implementation
- And 5 more specialists!

### Why Use APM?
- **4-8x Faster Development** - Parallel execution
- **Higher Quality** - Specialized expertise
- **Better Organization** - Structured workflows
- **Reduced Errors** - AI-powered validation

### The APM Workflow
```
Idea → Analyst → PM → Architect → Developer → QA → Deployment
         ↓        ↓        ↓           ↓        ↓
     Research   PRD    Design      Code     Test
```

---

## 🎪 Your First Project - Complete Example

Let's build something real - a simple todo application:

### Step 1: Research & Planning (10 minutes)
```bash
# Activate the Analyst
/analyst

# Prompt:
"Help me plan a modern todo application with these features:
- Task creation and editing
- Categories and tags
- Due dates and reminders
- Simple and clean UI"
```

### Step 2: Create PRD (5 minutes)
```bash
# Switch to Product Manager
/pm

# Prompt:
"Based on our todo app discussion, create a comprehensive PRD"
```

### Step 3: Design Architecture (5 minutes)
```bash
# Switch to Architect
/architect

# Prompt:
"Design the system architecture for our todo application"
```

### Step 4: Generate Stories (2 minutes with parallel)
```bash
# Use parallel story generation
/parallel-stories

# The system will create multiple user stories simultaneously
```

### Step 5: Begin Development
```bash
# Activate Developer
/dev

# Prompt:
"Let's implement the first user story for task creation"
```

**Total Time:** ~25 minutes from idea to code!

---

## 💡 Pro Tips for New Users

### 1. Use the Right Agent
Each agent specializes in specific tasks:
- **Confused about requirements?** → Use `/analyst`
- **Need a PRD?** → Use `/pm`
- **Designing the system?** → Use `/architect`
- **Writing code?** → Use `/dev`

### 2. Leverage Parallel Commands
Parallel commands are 4-8x faster:
- `/parallel-prd` instead of `/pm` for faster PRD
- `/parallel-architecture` for rapid design
- `/parallel-qa-framework` for comprehensive testing

### 3. Maintain Context
APM maintains context between agents:
- Agents share session notes
- Work transfers seamlessly
- No need to repeat information

### 4. Trust the Process
Follow the APM workflow:
1. Research with Analyst
2. Plan with PM
3. Design with Architect
4. Build with Developer
5. Test with QA

---

## 🔧 Customization Basics

### Enable Voice Notifications
Voice announcements help track progress:
```bash
# Check settings.json for TTS configuration
# Set "audioEnabled": true
```

### Adjust Parallel Execution
Configure parallel task limits:
```bash
# In settings.json
"parallelTasks": 4  # Adjust based on your system
```

### Session Management
APM tracks your work automatically:
- Session notes in `.apm/session_notes/`
- Automatic context preservation
- Seamless agent handoffs

---

## 📊 What to Expect

### Performance Gains
- **Sequential Development:** 1 task at a time
- **APM Parallel:** 4-8 tasks simultaneously
- **Result:** 4-8x faster delivery

### Quality Improvements
- **Without APM:** Generic AI responses
- **With APM:** Specialized expert guidance
- **Result:** Professional-grade outputs

### Example Metrics
| Task | Traditional | With APM | Improvement |
|------|------------|----------|-------------|
| PRD Creation | 2 hours | 30 mins | 4x faster |
| Architecture Design | 4 hours | 1 hour | 4x faster |
| Story Generation | 1 hour | 15 mins | 4x faster |
| Complete Project | 2 weeks | 3 days | 4.6x faster |

---

## 🚨 Common Issues & Solutions

### "Command not recognized"
**Solution:** Make sure you're using the exact command:
- ✅ `/analyst` (correct)
- ❌ `analyst` (missing slash)

### "Agent not responding as expected"
**Solution:** Ensure proper activation:
1. First run `ap` to initialize
2. Then use agent commands

### "Parallel commands seem slow"
**Solution:** Check your configuration:
- Verify parallel execution is enabled
- Adjust parallelTasks in settings

---

## 📚 Next Steps

Now that you're up and running:

1. **Read** [`understanding-apm.md`](understanding-apm.md) - Deep dive into concepts
2. **Try** [`first-project-tutorial.md`](first-project-tutorial.md) - Complete walkthrough
3. **Explore** [`../02-personas/persona-selection-guide.md`](../02-personas/persona-selection-guide.md) - Choose the right agent
4. **Master** [`../03-workflows/parallel-development.md`](../03-workflows/parallel-development.md) - Maximum speed

---

## 🎯 Quick Command Reference

### Essential Commands
- `ap` - Start AP Orchestrator
- `/analyst` - Research & requirements
- `/pm` - Product management
- `/architect` - System design
- `/dev` - Development
- `/qa` - Quality assurance

### Parallel Commands (Faster)
- `/parallel-brainstorming` - 4x faster ideation
- `/parallel-prd` - 70% faster PRD
- `/parallel-architecture` - 75% faster design
- `/parallel-stories` - Batch story creation

### Session Commands
- `/handoff [agent]` - Switch agents
- `/status` - Current progress
- `/wrap` - End session

---

## 🆘 Getting Help

- **Quick Help:** Type `/help` or `/help [topic]`
- **Documentation:** You're in it! Browse [`../`](../) for more
- **Troubleshooting:** See [`../07-troubleshooting/common-issues.md`](../07-troubleshooting/common-issues.md)

---

## 🎉 Congratulations!

You're now ready to use APM for accelerated development. Remember:
- Start with `ap` to initialize
- Use the right agent for each task
- Leverage parallel commands for speed
- Follow the workflow for best results

**Happy building with APM!**

---

*Next: [`understanding-apm.md`](understanding-apm.md) - Learn the core concepts behind APM*