# Debug Host MCP Server

A powerful Model Context Protocol (MCP) server for monitoring and debugging development servers with real-time dashboard capabilities.

## Features

- 🔍 **Real-time Process Monitoring** - Automatically detects and monitors running development servers
- 🌐 **Web Dashboard** - Interactive dashboard at http://localhost:8080
- 🔧 **Multi-Framework Support** - Works with Node.js, Python, PHP, and more
- 📊 **Live Metrics** - Performance monitoring, logging, and process management
- 🤖 **Claude Code Integration** - Seamless MCP protocol communication
- 🎯 **Intelligent Interception** - Automatically captures development server commands
- 🔄 **Session Persistence** - Maintains server state across Claude Code sessions

## Installation

### Prerequisites

- Node.js 18+ (tested with v22.16.0)
- npm or yarn package manager
- ~50MB disk space

### Quick Install

```bash
# Clone the repository
git clone https://github.com/your-org/DebugHostMCP.git
cd DebugHostMCP

# Install dependencies
npm install

# Run installation script
./install-mcp-host.sh
```

### Manual Installation

1. **Install to home directory:**
```bash
# Copy to standard location
cp -r . ~/.apm-debug-host

# Install dependencies
cd ~/.apm-debug-host
npm install

# Generate configuration
node scripts/config-setup.js
```

2. **Configure Claude Code:**

Add to your Claude Code configuration (`.mcp.json` or `~/.claude.json`):

```json
{
  "mcpServers": {
    "apm-debug-host": {
      "type": "stdio",
      "command": "node",
      "args": ["/home/your-user/.apm-debug-host/src/index.js"],
      "env": {
        "CONFIG_PATH": "/home/your-user/.apm-debug-host/config.json",
        "PORT": "8080"
      }
    }
  }
}
```

3. **Start the service:**

Linux (systemd):
```bash
sudo systemctl start apm-debug-host
sudo systemctl enable apm-debug-host
```

macOS (launchd):
```bash
launchctl load ~/Library/LaunchAgents/com.apm.debug-host.plist
```

## Usage

### Dashboard Access

Open your browser to: **http://localhost:8080**

The dashboard provides:
- Active development servers list
- Real-time console output
- Process control (stop/restart)
- Performance metrics
- Log viewer

### Claude Code Commands

Once integrated, use these commands in Claude Code:

```
"Show me running development servers"
"Start the React development server"
"Stop the Django server on port 8000"
"Display server logs"
"Check server health status"
```

### Supported Frameworks

The Debug Host MCP automatically detects and manages:

- **Node.js**: Express, Next.js, React, Vue, Angular, Nest.js
- **Python**: Django, Flask, FastAPI, Streamlit
- **PHP**: Laravel, Symfony, WordPress
- **Ruby**: Rails, Sinatra
- **Others**: Custom servers with configurable adapters

## Configuration

### Main Configuration (`config.json`)

```json
{
  "server": {
    "port": 8080,
    "host": "localhost"
  },
  "dashboard": {
    "enabled": true,
    "authRequired": false
  },
  "monitoring": {
    "interval": 5000,
    "maxLogs": 1000
  }
}
```

### Environment Variables

Create a `.env` file:

```bash
PORT=8080
NODE_ENV=production
LOG_LEVEL=info
DASHBOARD_ENABLED=true
API_KEY=your-secure-api-key
```

## API Documentation

### MCP Tools

The server exposes the following MCP tools:

#### `server:list`
Lists all active development servers

#### `server:start`
Starts a development server
- Parameters: `command`, `cwd`, `sessionName`

#### `server:stop`
Stops a running server
- Parameters: `sessionId`

#### `server:logs`
Retrieves server logs
- Parameters: `sessionId`, `lines`

#### `server:health`
Checks server health status

### REST API Endpoints

- `GET /api/health` - Health check
- `GET /api/sessions` - List all sessions
- `POST /api/sessions` - Create new session
- `DELETE /api/sessions/:id` - Stop session
- `GET /api/logs/:sessionId` - Get session logs
- `WS /ws` - WebSocket connection for real-time updates

## Development

### Project Structure

```
DebugHostMCP/
├── src/
│   ├── index.js              # Main MCP server entry
│   ├── process-manager.js    # Process lifecycle management
│   ├── log-store.js         # Log storage and retrieval
│   ├── mcp-tools.js         # MCP protocol implementation
│   ├── adapters/            # Framework-specific adapters
│   └── dashboard/           # Web dashboard
├── tests/                   # Test suite
├── docs/                    # Documentation
└── scripts/                 # Utility scripts
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test suite
npm run test:unit
npm run test:integration
npm run test:e2e

# Coverage report
npm run test:coverage
```

### Building

```bash
# Development build
npm run dev

# Production build
npm run build

# Start with watch mode
npm run watch
```

## Troubleshooting

### Common Issues

**Port Already in Use**
```bash
# Find process using port 8080
lsof -i :8080

# Kill the process
kill -9 <PID>
```

**Service Not Starting**
```bash
# Check service status
systemctl status apm-debug-host

# View logs
journalctl -u apm-debug-host -f
```

**WebSocket Connection Failed**
- Check firewall settings
- Ensure port 8080 is accessible
- Verify Claude Code has network access

### Debug Mode

Enable debug logging:
```bash
LOG_LEVEL=debug node src/index.js
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

See [CONTRIBUTING.md](docs/CONTRIBUTING.md) for details.

## License

MIT License - see [LICENSE](LICENSE) file

## Support

- Documentation: [docs/](docs/)
- Issues: [GitHub Issues](https://github.com/your-org/DebugHostMCP/issues)
- Discussions: [GitHub Discussions](https://github.com/your-org/DebugHostMCP/discussions)

## Acknowledgments

Originally developed as part of the APM (Agentic Persona Mapping) Framework.

---

**Version**: 1.0.0  
**Status**: Production Ready  
**Last Updated**: 2025-01-03