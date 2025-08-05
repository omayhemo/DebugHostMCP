# Claude Slash Commands for MCP Debug Host

This directory contains Claude slash commands for managing the MCP Debug Host deployment.

## Available Commands

### `/deploy-to-global`
Deploys the MCP Debug Host from your development codebase to the global installation used by all Claude Code instances.

**Aliases:** `/deploy`, `/publish`, `/deploy-mcp`

**What it does:**
1. Stops the current global service
2. Creates a backup of the existing installation
3. Copies all files from development to global
4. Verifies port configuration (2601)
5. Installs dependencies
6. Starts the service
7. Verifies deployment success

**Usage:**
```bash
# In Claude Code, simply type:
/deploy-to-global
```

### `/rollback-deployment`
Restores the previous version of MCP Debug Host from the most recent backup.

**What it does:**
1. Finds the most recent backup
2. Stops the current service
3. Saves the current (failed) version for analysis
4. Restores from backup
5. Starts the restored service
6. Verifies the rollback

**Usage:**
```bash
# In Claude Code, if deployment fails:
/rollback-deployment
```

## Manual Execution

If Claude slash commands aren't working, you can run these scripts manually:

```bash
# Deploy to global
bash /mnt/c/Code/MCPServers/DebugHostMCP/.claude/slash-commands/deploy-to-global.sh

# Rollback deployment
bash /mnt/c/Code/MCPServers/DebugHostMCP/.claude/slash-commands/rollback-deployment.sh
```

## Quick Deployment (For Experienced Users)

For those comfortable with the process, here's a one-liner:

```bash
# Kill service, copy files, verify health
pkill -f 'apm-debug-host/src/index.js' && \
cp -r /mnt/c/Code/MCPServers/DebugHostMCP/{src,adapter}/* ~/.apm-debug-host/ && \
sleep 3 && \
curl -s http://localhost:2601/api/health | jq '.'
```

## Important Paths

| Path | Description |
|------|-------------|
| `/mnt/c/Code/MCPServers/DebugHostMCP/` | Development codebase (where you make changes) |
| `~/.apm-debug-host/` | Global installation (production version) |
| `~/.config/claude/mcp.json` | MCP configuration for Claude Code |
| Port `2601` | Default port for the global service |

## Deployment Workflow

1. **Development Phase**
   - Make changes in `/mnt/c/Code/MCPServers/DebugHostMCP/`
   - Test locally if needed
   - Commit changes to git

2. **Deployment Phase**
   - Run `/deploy-to-global`
   - Verify deployment succeeded
   - Test functionality

3. **If Issues Occur**
   - Run `/rollback-deployment` to restore previous version
   - Fix issues in development
   - Re-deploy when ready

## Troubleshooting

### Service Won't Start
```bash
# Check syntax errors
node -c ~/.apm-debug-host/src/index.js

# Check logs
tail -50 ~/.apm-debug-host/service.log
```

### Port Already in Use
```bash
# Find what's using port 2601
lsof -i :2601

# Kill old process
pkill -f 'apm-debug-host'
```

### MCP Not Connecting
```bash
# Verify MCP configuration
cat ~/.config/claude/mcp.json | jq '.mcpServers["apm-debug-host"]'

# Check PORT environment variable
grep PORT ~/.config/claude/mcp.json
```

## Best Practices

1. **Always backup before deploying** - The script does this automatically
2. **Test after deployment** - Use the dashboard at http://localhost:2601
3. **Monitor logs initially** - Watch for errors in the first few minutes
4. **Keep dev and prod in sync** - Don't forget to commit your deployed changes

## Files in This Directory

- `deploy-to-global.md` - Detailed deployment documentation
- `deploy-to-global.sh` - Automated deployment script
- `rollback-deployment.sh` - Rollback script for failed deployments
- `commands.json` - Claude slash command configuration
- `README.md` - This file

## Adding New Commands

To add a new slash command:

1. Create a new `.sh` script in this directory
2. Make it executable: `chmod +x your-script.sh`
3. Add documentation in a `.md` file
4. Register it in `commands.json`

## Support

For issues with these commands:
1. Check the detailed documentation in `deploy-to-global.md`
2. Review recent logs: `tail -50 ~/.apm-debug-host/service.log`
3. Verify paths and permissions
4. Ensure Node.js is available in PATH