# APM Keyboard Shortcuts & IDE Tips

## Claude Code CLI Shortcuts

### Essential Claude Code Commands
| Shortcut | Command | Purpose |
|----------|---------|---------|
| `Ctrl+C` | Interrupt | Stop current command |
| `Ctrl+D` | Exit | Close Claude Code session |
| `Ctrl+L` | Clear | Clear terminal screen |
| `↑/↓` | History | Navigate command history |
| `Tab` | Autocomplete | Complete file/command names |

### APM Quick Commands
| Input | Expands To | Purpose |
|-------|------------|---------|
| `ap` | `/ap_orchestrator` | Launch orchestrator |
| `dev` | `/developer` | Activate developer |
| `arch` | `/architect` | Activate architect |

---

## VS Code Integration

### File Navigation
| Shortcut | Action |
|----------|---------|
| `Ctrl+P` | Quick open file |
| `Ctrl+Shift+P` | Command palette |
| `Ctrl+Shift+E` | Explorer panel |
| `Ctrl+Shift+F` | Search across files |
| `Ctrl+G` | Go to line |

### APM-Specific Files
| Shortcut | File Access |
|----------|-------------|
| `Ctrl+P` → `.apm/CL` | Quick open `.apm/CLAUDE.md` |
| `Ctrl+P` → `backlog` | Quick open `backlog.md` |
| `Ctrl+P` → `session` | Find session notes |

### Terminal Integration
| Shortcut | Action |
|----------|---------|
| `Ctrl+`` ` | Toggle terminal |
| `Ctrl+Shift+`` ` | New terminal |
| `Ctrl+Shift+C` | Copy from terminal |
| `Ctrl+Shift+V` | Paste to terminal |

---

## File System Shortcuts

### APM Directory Navigation
```bash
# Quick aliases (add to ~/.bashrc or ~/.zshrc)
alias apm="cd /path/to/project/.apm"
alias sessions="cd /path/to/project/.apm/session_notes"  
alias rules="cd /path/to/project/.apm/rules"
alias backlog="code /path/to/project/project_docs/backlog.md"
```

### Bash Shortcuts
| Shortcut | Action |
|----------|---------|
| `Ctrl+A` | Go to line beginning |
| `Ctrl+E` | Go to line end |
| `Ctrl+U` | Clear line before cursor |
| `Ctrl+K` | Clear line after cursor |
| `Ctrl+R` | Search command history |
| `Alt+.` | Insert last argument |

---

## Text Editor Shortcuts

### Universal Text Editing
| Shortcut | Action |
|----------|---------|
| `Ctrl+A` | Select all |
| `Ctrl+F` | Find |
| `Ctrl+H` | Replace |
| `Ctrl+Z` | Undo |
| `Ctrl+Y` | Redo |
| `Ctrl+S` | Save |

### Markdown Editing (for session notes)
| Shortcut | Format |
|----------|---------|
| `Ctrl+B` | **Bold** |
| `Ctrl+I` | *Italic* |
| `Ctrl+K` | `Code` |
| `##` + Space | Heading |
| `-` + Space | Bullet point |
| `1.` + Space | Numbered list |

---

## APM-Specific Workflows

### Quick Session Note Creation
```bash
# Template for new session note filename
YYYY-MM-DD-HH-mm-ss-Description.md

# Example:
2025-01-15-14-30-00-Sprint-Planning.md
```

### Rapid Persona Switching
```bash
# Quick handoff pattern
/handoff dev    # → Development work
/handoff qa     # → Testing & validation  
/handoff pm     # → Project coordination
/wrap           # → End session
```

### Parallel Command Shortcuts
| Need | Quick Command | Benefit |
|------|---------------|---------|
| Fast development | `/parallel-sprint` | 4.6x speedup |
| Architecture review | `/parallel-architecture` | 4x speedup |
| Testing suite | `/parallel-qa-framework` | 4x speedup |

---

## Productivity Tips

### APM Session Efficiency
1. **Start with `/ap`** - Always begin with orchestrator
2. **Use parallel commands** - 4-8x performance improvement
3. **Keep session notes open** - Context preservation
4. **Quick persona switches** - Use `/handoff` liberally
5. **End cleanly** - Always `/wrap` sessions

### File Management
1. **Bookmark key files** in your IDE:
   - `.apm/CLAUDE.md`
   - `project_docs/backlog.md`
   - Current session note
2. **Use split screens** - Session notes + code
3. **Quick file switching** - `Ctrl+Tab` in most editors

### Command History
```bash
# Search for previous APM commands
Ctrl+R → /ap    # Find orchestrator activations
Ctrl+R → /dev   # Find developer activations  
Ctrl+R → /qa    # Find QA activations
```

---
*Customize these shortcuts for your specific IDE and operating system*