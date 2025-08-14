# AP Manager Documentation

## Overview

`ap-manager.sh` is the lifecycle management tool for AP Mapping installations. It provides update, verification, backup, and uninstall capabilities for maintaining your AP Mapping installation over time.

## Location

After installation, ap-manager is located at:
```
$AP_ROOT/scripts/ap-manager.sh
```

Typically: `your-project//ap-manager.sh`

## Commands

### `update` - Check and Install Updates

Checks for new releases on GitHub and updates your installation:

```bash
/ap-manager.sh update
```

Features:
- Checks GitHub releases API for the latest version
- Compares with your current version (.apm/VERSION)
- Downloads and applies updates in-place
- Creates automatic backup before updating
- Preserves your project work and customizations
- Runs integrity check before and after update

### `verify` - Verify Installation

Checks the integrity of your AP Mapping installation:

```bash
/ap-manager.sh verify
```

Checks for:
- Critical files (personas, scripts, VERSION)
- Required directories (personas, tasks, templates, scripts)
- File permissions
- Installation completeness

### `version` - Show Version Information

Displays the current installed version:

```bash
/ap-manager.sh version
```

Output includes:
- Current version number
- Installation date (if available)

### `uninstall` - Remove AP Mapping

Safely removes AP Mapping from your project:

```bash
# Standard uninstall
/ap-manager.sh uninstall

# Keep settings and configuration
/ap-manager.sh uninstall --keep-settings
```

Features:
- Creates final backup before removal
- Optionally preserves `.claude/settings.json`
- Prompts before removing project documentation
- Cleans up .gitignore entries
- Leaves backups available for recovery

### `rollback` - Restore Previous Version

Restore from a backup (manual process currently):

```bash
/ap-manager.sh rollback
```

Shows available backups in `agents/.backups/`

### `help` - Show Help

Display usage information:

```bash
/ap-manager.sh help
```

## Update Process

When you run `update`, ap-manager:

1. **Checks Current Version**
   - Reads .apm/VERSION file
   - Defaults to "unknown" if not found

2. **Queries GitHub API**
   - Endpoint: `https://api.github.com/repos/omayhemo/agentic-persona-mapping/releases/latest`
   - Extracts latest version and download URL

3. **Compares Versions**
   - If already up-to-date, exits
   - If update available, prompts for confirmation

4. **Creates Backup**
   - Saves current installation to `agents/.backups/`
   - Names backup with timestamp

5. **Downloads Update**
   - Downloads new release tarball
   - Extracts to temporary directory

6. **Applies Update**
   - Updates templates files in `.templates/`
   - Updates agents directory (preserves customizations)
   - Updates VERSION file

7. **Verifies Update**
   - Runs integrity check
   - Confirms successful update

## Backup System

Backups are automatically created:
- Before updates
- Before uninstall
- On demand with `create_backup` function

Location: `agents/.backups/`
Format: `backup-YYYYMMDD-HHMMSS.tar.gz`
Retention: Last 5 backups are kept

## Templates Preservation

The templates are preserved in `agents/.templates/` containing:
- All installer scripts and utilities
- Templates for future installations
- Tools for integrity checking and rollback

This enables:
- Updates without re-downloading the full package
- Access to management tools
- Recovery capabilities

## Troubleshooting

### "Cannot determine AP_ROOT"
- Ensure you're running from within your project
- Set `AP_ROOT` environment variable manually

### "Failed to check for updates"
- Check internet connection
- Verify GitHub API is accessible
- Check for rate limiting (60 requests/hour unauthenticated)

### "Update failed"
- Check disk space
- Verify write permissions
- Restore from automatic backup if needed

### Version shows "unknown"
- Run `verify` to check installation
- Check if VERSION file exists in .apm directory

## Environment Variables

- `AP_ROOT` - Path to agents directory (auto-detected or set manually)
- Standard AP Mapping variables from `.claude/settings.json`

## Security Considerations

- Updates are downloaded over HTTPS
- Backups are created before any destructive operation
- User confirmation required for updates and uninstall
- No automatic updates - user initiated only

## Future Enhancements

Planned features for future versions:
- Authenticated GitHub API access for higher rate limits
- Differential updates (only changed files)
- Rollback with version selection
- Update scheduling/notifications
- Integrity repair functionality
- Custom update channels (beta, stable)