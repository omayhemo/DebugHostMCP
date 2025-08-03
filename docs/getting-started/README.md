# Getting Started with MCP Debug Host Server

Welcome to the MCP Debug Host Server! This guide will have you up and running in just a few minutes, transforming how AI agents interact with your development servers.

## 🎯 What You'll Accomplish

By the end of this guide, you'll have:
- ✅ MCP Debug Host Server installed and running
- ✅ Your first development server managed by AI agents
- ✅ Real-time dashboard showing console output
- ✅ Understanding of key features and workflows

## 📋 Prerequisites

Before starting, ensure you have:
- **Node.js 18+** installed ([Download here](https://nodejs.org/))
- **Claude Code CLI** set up and working
- **Basic terminal/command line knowledge**
- **A development project** (React, Next.js, Django, etc.)

### Quick Environment Check
```bash
# Verify Node.js version
node --version  # Should show v18.0.0 or higher

# Verify npm is available
npm --version

# Check if Claude Code is working
claude --version
```

## 🚀 Installation Methods

### Method 1: Automatic Installation (Recommended)

The easiest way is through the APM Framework installer:

```bash
# Clone or navigate to APM Framework
cd /path/to/agentic-persona-mapping

# Run the installer
./installer/install.sh
```

**What happens during installation:**
1. 📦 Downloads and installs MCP Debug Host Server
2. ⚙️  Configures Claude Code MCP integration
3. 🚀 Sets up system service (Linux/macOS)
4. 📊 Initializes web dashboard
5. 🔧 Tests the installation

When prompted:
```
Install MCP Debug Host Server? [Y/n]: Y
Configure as system service? [Y/n]: Y
Start dashboard automatically? [Y/n]: Y
```

### Method 2: Manual Installation

For more control over the installation:

```bash
# Navigate to MCP host directory
cd installer/mcp-host

# Make installer executable
chmod +x install-mcp-host.sh

# Run installation
./install-mcp-host.sh
```

## ✅ Verify Installation

After installation, verify everything is working:

### 1. Check Service Status

**Linux (systemd):**
```bash
sudo systemctl status apm-debug-host
# Should show "active (running)"
```

**macOS (launchd):**
```bash
launchctl list | grep apm-debug-host
# Should show the service as loaded
```

### 2. Test Dashboard Access

Open your browser and visit: **http://localhost:8080**

You should see:
- 🌟 Clean, modern dashboard interface
- 📊 "No active sessions" message (normal for fresh install)
- 🟢 Green status indicator
- 🔄 "Ready to manage processes" status

### 3. Verify MCP Integration

```bash
# Check MCP configuration
cat ~/.mcp.json
# Should include apm-debug-host entry

# Test MCP server directly
echo '{}' | node ~/.apm-debug-host/src/index.js
# Should show MCP protocol handshake
```

## 🎮 Your First Server Setup

Let's walk through starting your first development server with AI assistance:

### Step 1: Prepare Your Project

Use any development project. For this example, we'll use a React app:

```bash
# Create a sample React project (optional)
npx create-react-app my-test-app
cd my-test-app
```

### Step 2: Start Claude Code Session

```bash
# Launch Claude Code in your project directory
claude code
```

### Step 3: Use MCP Tools Through AI

In your Claude Code session, ask:

```
"Please start the development server for this project and show me the dashboard"
```

**What happens behind the scenes:**
1. 🔍 Claude detects your project type (React/Next.js/Django/etc.)
2. 🚀 Starts appropriate development server via MCP
3. 📊 Server appears in dashboard with live logs
4. 🔗 Provides dashboard link for monitoring

### Step 4: Explore the Dashboard

Visit **http://localhost:8080** to see:

- **📈 Session Overview**: Your server's status and info
- **📝 Live Logs**: Real-time console output streaming
- **⚡ Process Control**: Start/stop/restart buttons
- **🔍 Log Filtering**: Search and filter capabilities
- **📊 Performance Metrics**: CPU/Memory usage

## 🌟 Key Features Walkthrough

### Automatic Tech Stack Detection
The server automatically recognizes:
- **React** (Create React App, Vite)
- **Next.js** (Pages Router, App Router)
- **Vue.js** (Vue CLI, Nuxt.js)
- **Django** (Development server)
- **Laravel** (Artisan serve)
- **Express.js**, **FastAPI**, **Rails**, and more!

### Smart Commands
Each framework gets optimized commands:
```bash
# React projects
npm start

# Next.js projects  
npm run dev

# Django projects
python manage.py runserver

# Laravel projects
php artisan serve
```

### Persistent Sessions
Servers continue running even if:
- 🔄 Claude Code session restarts
- 💻 Terminal windows close
- 🔀 You switch between projects

### Real-time Monitoring
Dashboard shows:
- **📊 Process Status**: Running/stopped/error states
- **📝 Live Logs**: Streaming console output
- **🔍 Log Search**: Find specific messages
- **📈 Performance**: Resource usage metrics
- **⏰ Timestamps**: When events occurred

## 🎯 Common Use Cases

### Use Case 1: Frontend Development
```bash
# AI agent starts React dev server
# You can immediately see:
# - Compilation status
# - Hot reload messages  
# - Build warnings/errors
# - Bundle analyzer output
```

### Use Case 2: Backend API Development
```bash
# AI agent starts Django/Flask/Express server
# Dashboard shows:
# - Request logs
# - Database queries
# - Error traces
# - Performance metrics
```

### Use Case 3: Full-Stack Development
```bash
# Run multiple servers simultaneously:
# - Frontend (React on :3000)  
# - Backend API (Django on :8000)
# - Database (PostgreSQL on :5432)
```

### Use Case 4: Testing & Debugging
```bash
# AI agent can:
# - Start test runners
# - Monitor test output
# - Capture error logs
# - Analyze performance
```

## 🔧 Basic Configuration

### Environment Variables
Edit `~/.apm-debug-host/.env`:

```env
# Dashboard port (default: 8080)
PORT=8080

# Logging level (debug, info, warn, error)
LOG_LEVEL=info

# Maximum concurrent processes
MAX_CONCURRENT_PROCESSES=10

# Auto-start common services
AUTO_START_SERVICES=false
```

### Custom Framework Detection
Add support for custom frameworks in `config.json`:

```json
{
  "customAdapters": [
    {
      "name": "My Framework",
      "patterns": ["my-framework.json"],
      "startCommand": "my-framework dev",
      "port": 4000
    }
  ]
}
```

## 🆘 Quick Troubleshooting

### Server Won't Start
```bash
# Check if port is in use
lsof -i :8080

# Check logs
tail -f ~/.apm-debug-host/logs/server.log

# Restart service
sudo systemctl restart apm-debug-host  # Linux
launchctl unload ~/Library/LaunchAgents/com.apm.debug-host.plist && launchctl load ~/Library/LaunchAgents/com.apm.debug-host.plist  # macOS
```

### Dashboard Not Loading
1. ✅ Verify server is running: `ps aux | grep apm-debug-host`
2. ✅ Check port isn't blocked: `curl http://localhost:8080`
3. ✅ Review browser console for errors
4. ✅ Try a different port in `.env` file

### MCP Not Connecting
```bash
# Verify MCP configuration
cat ~/.mcp.json

# Test MCP server manually
echo '{}' | node ~/.apm-debug-host/src/index.js

# Check Claude Code MCP status
claude mcp status
```

### Processes Not Starting
1. ✅ Check project directory exists and is readable
2. ✅ Verify framework dependencies are installed
3. ✅ Review process logs in dashboard
4. ✅ Test manual start command works

## 🎓 Next Steps

Now that you're up and running:

1. 📖 **Explore the [Dashboard Tour](dashboard-tour.md)** - Deep dive into web interface
2. 🔧 **Read [API Reference](../api/README.md)** - Learn advanced MCP tools
3. 🚀 **Check [Best Practices](../training/best-practices.md)** - Optimize your workflow
4. 🌟 **Try [Advanced Features](advanced-features.md)** - Custom adapters and automation

## 💡 Pro Tips

- 🔖 **Bookmark the dashboard** at http://localhost:8080
- 🔍 **Use log filtering** to find specific messages quickly
- 📊 **Monitor multiple projects** simultaneously
- 🚀 **Let AI agents manage** process lifecycle
- 💾 **Regular log cleanup** keeps things fast

---

**🎉 Congratulations!** You've successfully set up the MCP Debug Host Server. Your AI development workflow just got a major upgrade!

**Next:** [Dashboard Tour](dashboard-tour.md) - Explore everything the web interface has to offer.