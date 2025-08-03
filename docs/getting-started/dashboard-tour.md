# Dashboard Tour

Welcome to the MCP Debug Host Server dashboard! This comprehensive tour will guide you through every feature of the web interface, helping you master process management and monitoring.

## 🌟 Dashboard Overview

The dashboard is your command center for managing development servers. Access it at **http://localhost:8080** after installation.

### First Impression
When you first open the dashboard, you'll see:
- **🎨 Clean, Modern Interface** - Intuitive design that's easy on the eyes
- **📊 Status Overview** - Quick health check of all services
- **🔍 Search & Filter** - Powerful tools to find what you need
- **⚡ Real-time Updates** - Live data streaming via WebSocket

## 🎨 User Interface Layout

### Header Section
```
┌─────────────────────────────────────────────────┐
│ 🏠 MCP Debug Host     🟢 Online    ⚙️ Settings   │
│ Status: Ready • Sessions: 0 • Uptime: 2h 14m    │
└─────────────────────────────────────────────────┘
```

**Key Elements:**
- **🏠 Home Button** - Returns to main dashboard
- **🟢 Status Indicator** - Green (online), Yellow (warning), Red (error)
- **⚙️ Settings** - Configure dashboard preferences
- **📊 Quick Stats** - Sessions count, uptime, system status

### Main Content Area

The main area adapts based on current state:

**Empty State (No Sessions):**
```
┌─────────────────────────────────────────────────┐
│             🚀 Ready to Launch                  │
│                                                 │
│  No active development servers                  │
│  Ask an AI agent to start your project!        │
│                                                 │
│  [🔍 Supported Frameworks] [📖 Quick Start]     │
└─────────────────────────────────────────────────┘
```

**Active Sessions View:**
```
┌─────────────────────────────────────────────────┐
│ 📊 Active Sessions (3)              [🔄 Refresh] │
├─────────────────────────────────────────────────┤
│ 🟢 React App      :3000    [⏸️ Stop] [📋 Logs]   │
│ 🟡 Django API     :8000    [⏸️ Stop] [📋 Logs]   │
│ 🟢 PostgreSQL     :5432    [⏸️ Stop] [📋 Logs]   │
└─────────────────────────────────────────────────┘
```

### Footer Section
```
┌─────────────────────────────────────────────────┐
│ 📡 WebSocket: Connected • Last Update: 2s ago   │
│ 💾 Memory: 234MB • 🖥️ CPU: 12% • 📊 Processes: 3 │
└─────────────────────────────────────────────────┘
```

## 📊 Session Management

### Session Overview Cards

Each active session displays as a card with rich information:

```
┌─────────────────────────────────────────────────┐
│ 🟢 My React App                    [⚙️ Settings] │
│ Framework: React • Port: 3000 • PID: 12345      │
│ Started: 2h 14m ago • CPU: 8% • Memory: 45MB    │
│                                                 │
│ 📈 Status: Running • Build: Success             │
│ 🔗 http://localhost:3000                        │
│                                                 │
│ [⏸️ Stop] [🔄 Restart] [📋 Logs] [📊 Metrics]    │
└─────────────────────────────────────────────────┘
```

**Status Indicators:**
- **🟢 Green** - Running normally
- **🟡 Yellow** - Warning (high CPU/memory)
- **🔴 Red** - Error or stopped
- **⚫ Gray** - Starting up
- **🔵 Blue** - Restarting

### Quick Actions

**Session Controls:**
- **⏸️ Stop** - Gracefully stop the process
- **🔄 Restart** - Stop and restart the process
- **📋 Logs** - Open log viewer
- **📊 Metrics** - Show performance graphs
- **⚙️ Settings** - Configure session options

**Bulk Operations:**
- **🛑 Stop All** - Stop all running sessions
- **🔄 Restart All** - Restart all sessions
- **📋 Export Logs** - Download all logs as ZIP
- **🧹 Clear Logs** - Remove old log entries

## 📋 Log Viewer

The log viewer is one of the most powerful features:

### Log Interface
```
┌─────────────────────────────────────────────────┐
│ 📋 Logs: My React App              [❌ Close]    │
├─────────────────────────────────────────────────┤
│ [🔍 Search] [📅 Filter] [⬇️ Download] [🧹 Clear] │
├─────────────────────────────────────────────────┤
│ [14:32:15] INFO  Webpack compiled successfully   │
│ [14:32:16] WARN  Source map size is large        │
│ [14:32:17] INFO  Hot reload connected            │
│ [14:32:18] ERROR Failed to load ./component.js   │
│ [14:32:19] INFO  Fixed compilation error          │
│ ⋮                                                │
│ [14:35:22] INFO  New build starting...           │
│ [▼ Live Updates] [🔄 Auto-scroll] [📊 1,247 lines] │
└─────────────────────────────────────────────────┘
```

### Log Features

**🔍 Advanced Search:**
- **Text Search** - Find specific messages
- **Regex Support** - Use patterns like `/error.*timeout/`
- **Case Sensitivity** - Toggle case-sensitive search
- **Highlight Matches** - Visual highlighting of results

**📅 Filtering Options:**
- **Log Level** - INFO, WARN, ERROR, DEBUG
- **Time Range** - Last hour, day, week, custom
- **Source Filter** - Specific modules or components
- **Pattern Matching** - Include/exclude patterns

**⚡ Real-time Features:**
- **Live Updates** - New logs appear automatically
- **Auto-scroll** - Follow latest messages
- **Pause Updates** - Stop streaming to read
- **Buffer Management** - Configurable line limits

**💾 Export Options:**
- **Download Logs** - Save as .txt, .csv, or .json
- **Date Range Export** - Export specific time periods
- **Filtered Export** - Export only matching entries
- **Share Links** - Generate shareable log URLs

### Log Formatting

**Syntax Highlighting:**
- **Timestamps** - Gray, consistent format
- **Log Levels** - Color-coded (ERROR=red, WARN=yellow, INFO=blue)
- **File Paths** - Clickable, underlined
- **URLs** - Clickable links
- **JSON** - Pretty-printed with syntax highlighting

**Smart Parsing:**
- **Stack Traces** - Collapsible, formatted
- **SQL Queries** - Syntax highlighted
- **HTTP Requests** - Method/status color coding
- **Performance Metrics** - Chart integration

## 📊 Performance Monitoring

### System Metrics Dashboard

```
┌─────────────────────────────────────────────────┐
│ 📊 System Performance              [📅 24h View] │
├─────────────────────────────────────────────────┤
│ 💾 Memory Usage                                 │
│ ████████░░ 80% (1.2GB / 1.5GB)                 │
│                                                 │
│ 🖥️ CPU Usage                                    │
│ ███░░░░░░░ 30% (avg over 5min)                  │
│                                                 │
│ 🌐 Network I/O                                  │
│ ↗️ Up: 2.3MB/s  ↘️ Down: 1.8MB/s                │
│                                                 │
│ 💿 Disk Usage                                   │
│ ██░░░░░░░░ 20% (45GB / 200GB)                   │
└─────────────────────────────────────────────────┘
```

### Process-Specific Metrics

Each session shows detailed performance data:

**Resource Usage:**
- **Memory** - Current/peak usage, memory leaks detection
- **CPU** - Current/average usage, CPU spikes
- **File Handles** - Open files, file system activity
- **Network** - Connections, bandwidth usage

**Performance Graphs:**
- **Real-time Charts** - Live updating graphs
- **Historical Data** - 24h/7d/30d views
- **Comparative Analysis** - Compare multiple sessions
- **Alerting** - Visual warnings for high usage

### Health Monitoring

**Automatic Health Checks:**
- **Process Lifecycle** - Start/stop success rates
- **Response Times** - HTTP endpoint monitoring
- **Error Rates** - Exception tracking
- **Resource Limits** - Memory/CPU threshold alerts

## ⚙️ Configuration Settings

### Dashboard Preferences

Access via the **⚙️ Settings** button:

```
┌─────────────────────────────────────────────────┐
│ ⚙️ Dashboard Settings                           │
├─────────────────────────────────────────────────┤
│ 🎨 Theme                                        │
│ ○ Light  ● Dark  ○ Auto                         │
│                                                 │
│ 🔄 Refresh Rate                                 │
│ [1000ms ▼] (How often to update)               │
│                                                 │
│ 📋 Log Display                                  │
│ Max lines: [1000 ▼]                            │
│ Auto-scroll: [✓]                               │
│ Show timestamps: [✓]                           │
│                                                 │
│ 🔔 Notifications                                │
│ Browser notifications: [✓]                     │
│ Sound alerts: [✓]                              │
│ Error notifications: [✓]                       │
│                                                 │
│ [💾 Save] [🔄 Reset] [❌ Cancel]                 │
└─────────────────────────────────────────────────┘
```

### Process Configuration

Configure individual processes:

**Startup Options:**
- **Environment Variables** - Set custom env vars
- **Command Arguments** - Override default args
- **Working Directory** - Change execution directory
- **Port Assignment** - Use specific ports

**Runtime Settings:**
- **Auto-restart** - Restart on crash
- **Resource Limits** - Memory/CPU caps
- **Timeout Settings** - Startup/health check timeouts
- **Log Level** - Process-specific logging

## 🔍 Advanced Features

### Multi-Project Management

Run multiple projects simultaneously:

```
┌─────────────────────────────────────────────────┐
│ 📁 Project: E-commerce Platform                 │
├─────────────────────────────────────────────────┤
│ 🟢 Frontend (React)     :3000    [📋 Logs]      │
│ 🟢 Backend API (Django) :8000    [📋 Logs]      │
│ 🟢 Database (Postgres)  :5432    [📋 Logs]      │
│ 🟢 Redis Cache         :6379    [📋 Logs]      │
│ 🟡 Nginx Proxy         :80      [📋 Logs]      │
└─────────────────────────────────────────────────┘
```

**Project Features:**
- **Grouped Sessions** - Organize related processes
- **Batch Operations** - Start/stop entire projects
- **Dependency Management** - Control startup order
- **Health Checks** - Monitor project health

### Smart Notifications

**Browser Notifications:**
- **Process Events** - Start/stop/crash alerts
- **Error Detection** - Automatic error notifications
- **Performance Alerts** - High resource usage warnings
- **Build Status** - Compilation success/failure

**Visual Indicators:**
- **Favicon Changes** - Shows status in browser tab
- **Browser Title** - Displays active session count
- **Status Colors** - Entire interface reflects health

### Keyboard Shortcuts

**Global Shortcuts:**
- `Ctrl/Cmd + R` - Refresh dashboard
- `Ctrl/Cmd + F` - Focus search box
- `Ctrl/Cmd + K` - Open command palette
- `Esc` - Close modals/overlays

**Session Shortcuts:**
- `S` - Stop selected session
- `R` - Restart selected session
- `L` - Open logs for selected session
- `M` - Show metrics for selected session

### Command Palette

Press `Ctrl/Cmd + K` for quick actions:

```
┌─────────────────────────────────────────────────┐
│ 🔍 Type a command...                            │
├─────────────────────────────────────────────────┤
│ 🚀 Start new session                            │
│ ⏸️ Stop all sessions                            │
│ 📋 Open logs for My React App                   │
│ 📊 Show system metrics                          │
│ ⚙️ Open settings                                │
│ 📱 Toggle mobile view                           │
│ 🌙 Switch to dark theme                         │
│ 📤 Export all logs                              │
└─────────────────────────────────────────────────┘
```

## 📱 Mobile Responsiveness

The dashboard is fully responsive and works great on mobile:

**Mobile Features:**
- **Touch Navigation** - Swipe gestures for navigation
- **Responsive Design** - Adapts to screen size
- **Optimized Touch Targets** - Large, easy-to-tap buttons
- **Simplified Interface** - Essential features prioritized

**Mobile-Specific Views:**
- **Session Cards** - Stack vertically
- **Simplified Logs** - Condensed log view
- **Gesture Controls** - Swipe to refresh/navigate
- **Offline Support** - Basic functionality when offline

## 🔧 Troubleshooting Dashboard Issues

### Dashboard Won't Load

**Check Connection:**
```bash
# Test if server is running
curl http://localhost:8080

# Check if port is accessible
telnet localhost 8080
```

**Common Solutions:**
1. **Clear Browser Cache** - Hard refresh with `Ctrl+Shift+R`
2. **Check Console Errors** - Open DevTools and check for errors
3. **Verify Service Status** - Ensure MCP server is running
4. **Try Different Browser** - Test with another browser

### WebSocket Connection Issues

**Symptoms:**
- No real-time updates
- "Disconnected" status in footer
- Logs not streaming

**Solutions:**
1. **Check Network** - Verify WebSocket isn't blocked
2. **Proxy Settings** - Configure WebSocket proxy if needed
3. **Firewall Rules** - Ensure WebSocket traffic allowed
4. **Restart Service** - Restart MCP Debug Host server

### Performance Issues

**Slow Dashboard:**
1. **Reduce Refresh Rate** - Increase interval in settings
2. **Limit Log Lines** - Decrease max log display
3. **Close Unused Tabs** - Free up browser resources
4. **Clear Old Logs** - Remove accumulated log data

### Browser Compatibility

**Supported Browsers:**
- ✅ Chrome 90+
- ✅ Firefox 85+
- ✅ Safari 14+
- ✅ Edge 90+

**Feature Compatibility:**
- **WebSockets** - Required for real-time updates
- **Local Storage** - Required for settings persistence
- **ES6 Modules** - Required for modern JavaScript features

## 💡 Pro Tips & Best Practices

### Optimization Tips

**Performance:**
- **Use Filters** - Reduce log noise with smart filtering
- **Close Unused Sessions** - Stop processes you're not actively using
- **Regular Cleanup** - Clear old logs periodically
- **Monitor Resources** - Keep an eye on system usage

**Workflow:**
- **Bookmark Dashboard** - Keep it easily accessible
- **Use Keyboard Shortcuts** - Speed up common operations
- **Organize Sessions** - Use descriptive names for sessions
- **Set Up Notifications** - Get alerted to important events

### Expert Features

**Power User Shortcuts:**
- **URL Parameters** - `?session=123&view=logs` for direct links
- **API Integration** - Use REST API for automation
- **Custom Themes** - Create CSS overrides for personalization
- **Scripting** - Automate actions with browser scripting

**Advanced Monitoring:**
- **Log Aggregation** - Combine logs from multiple sessions
- **Pattern Detection** - Set up alerts for specific log patterns
- **Performance Baselines** - Track performance trends over time
- **Custom Dashboards** - Create project-specific views

---

**🎉 Dashboard Mastery Complete!** You now know how to leverage every feature of the MCP Debug Host Server dashboard for maximum productivity.

**Next Steps:**
- 🔧 [API Reference](../api/README.md) - Learn advanced MCP tools
- 🚀 [Best Practices](../training/best-practices.md) - Optimize your workflow
- 👨‍💻 [Developer Guide](../developer/README.md) - Extend and customize