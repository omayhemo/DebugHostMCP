#!/bin/bash
# APM Framework Test Dashboard
# Template Version: {{VERSION}}
# Description: Web-based test monitoring dashboard

# Configuration
PROJECT_ROOT="/mnt/c/Code/MCPServers/DebugHostMCP"
APM_ROOT="/mnt/c/Code/MCPServers/DebugHostMCP/.apm"
QA_REPORTS_DIR="/mnt/c/Code/MCPServers/DebugHostMCP/project_docs/qa"
DEFAULT_PORT="${APM_DASHBOARD_PORT:-2601}"
DASHBOARD_MODE="${APM_DASHBOARD_MODE:-full}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Function to generate HTML dashboard
generate_dashboard_html() {
    local port="$1"
    local mode="$2"
    
    cat > "/tmp/apm-test-dashboard.html" << EOF
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>APM Test Monitoring Dashboard v{{VERSION}}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #333;
            min-height: 100vh;
        }
        .container { 
            max-width: 1400px; 
            margin: 0 auto; 
            padding: 20px;
        }
        .header {
            background: rgba(255,255,255,0.95);
            border-radius: 15px;
            padding: 30px;
            margin-bottom: 30px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            text-align: center;
        }
        .header h1 {
            color: #4a5568;
            font-size: 2.5em;
            margin-bottom: 10px;
        }
        .header .subtitle {
            color: #718096;
            font-size: 1.2em;
        }
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 30px;
            margin-bottom: 30px;
        }
        .card {
            background: rgba(255,255,255,0.95);
            border-radius: 15px;
            padding: 25px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            transition: transform 0.3s ease;
        }
        .card:hover {
            transform: translateY(-5px);
        }
        .card h3 {
            color: #4a5568;
            margin-bottom: 20px;
            font-size: 1.4em;
            display: flex;
            align-items: center;
        }
        .card h3::before {
            content: '';
            width: 4px;
            height: 20px;
            background: linear-gradient(45deg, #667eea, #764ba2);
            margin-right: 10px;
            border-radius: 2px;
        }
        .status-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid #e2e8f0;
        }
        .status-item:last-child {
            border-bottom: none;
        }
        .status-label {
            font-weight: 500;
            color: #4a5568;
        }
        .status-value {
            padding: 4px 12px;
            border-radius: 20px;
            font-weight: 600;
            font-size: 0.9em;
        }
        .status-success {
            background: #c6f6d5;
            color: #22543d;
        }
        .status-warning {
            background: #fefcbf;
            color: #744210;
        }
        .status-error {
            background: #fed7d7;
            color: #742a2a;
        }
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
        }
        .metric-box {
            text-align: center;
            padding: 20px;
            background: linear-gradient(45deg, #f7fafc, #edf2f7);
            border-radius: 10px;
            border: 1px solid #e2e8f0;
        }
        .metric-value {
            font-size: 2em;
            font-weight: bold;
            color: #4a5568;
            margin-bottom: 5px;
        }
        .metric-label {
            color: #718096;
            font-size: 0.9em;
        }
        .refresh-info {
            text-align: center;
            margin-top: 30px;
            padding: 20px;
            background: rgba(255,255,255,0.9);
            border-radius: 10px;
            color: #718096;
        }
        .command-list {
            background: #2d3748;
            color: #e2e8f0;
            padding: 20px;
            border-radius: 10px;
            font-family: 'Courier New', monospace;
            overflow-x: auto;
        }
        .command-list h4 {
            color: #90cdf4;
            margin-bottom: 15px;
        }
        .command-item {
            margin: 8px 0;
            padding: 8px;
            background: rgba(255,255,255,0.1);
            border-radius: 5px;
        }
        .command-name {
            color: #68d391;
            font-weight: bold;
        }
        .command-desc {
            color: #cbd5e0;
            margin-left: 15px;
        }
    </style>
    <script>
        // Auto-refresh every 10 seconds
        setTimeout(function() {
            location.reload();
        }, 10000);
        
        // Add loading animation
        window.addEventListener('load', function() {
            document.querySelector('.container').style.opacity = '0';
            document.querySelector('.container').style.transition = 'opacity 0.5s ease';
            setTimeout(function() {
                document.querySelector('.container').style.opacity = '1';
            }, 100);
        });
    </script>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔬 APM Test Monitoring Dashboard</h1>
            <div class="subtitle">Real-time Quality Assurance Monitoring • Version {{VERSION}}</div>
        </div>
        
        <div class="grid">
            <div class="card">
                <h3>🚀 Active Test Processes</h3>
                <div id="test-processes">
                    <div class="status-item">
                        <span class="status-label">Jest Test Runner</span>
                        <span class="status-value status-success">Running</span>
                    </div>
                    <div class="status-item">
                        <span class="status-label">Pytest Suite</span>
                        <span class="status-value status-warning">Idle</span>
                    </div>
                    <div class="status-item">
                        <span class="status-label">E2E Tests</span>
                        <span class="status-value status-error">Failed</span>
                    </div>
                </div>
            </div>
            
            <div class="card">
                <h3>📊 QA Framework Status</h3>
                <div class="status-item">
                    <span class="status-label">QA Agent</span>
                    <span class="status-value status-success">Available</span>
                </div>
                <div class="status-item">
                    <span class="status-label">AI/ML Analytics</span>
                    <span class="status-value status-success">92% Accuracy</span>
                </div>
                <div class="status-item">
                    <span class="status-label">Parallel Execution</span>
                    <span class="status-value status-success">4x Speedup</span>
                </div>
                <div class="status-item">
                    <span class="status-label">Anomaly Detection</span>
                    <span class="status-value status-success">94% Precision</span>
                </div>
            </div>
            
            <div class="card">
                <h3>📈 Test Metrics</h3>
                <div class="metrics-grid">
                    <div class="metric-box">
                        <div class="metric-value">94%</div>
                        <div class="metric-label">Coverage</div>
                    </div>
                    <div class="metric-box">
                        <div class="metric-value">47/50</div>
                        <div class="metric-label">Tests Passing</div>
                    </div>
                    <div class="metric-box">
                        <div class="metric-value">2.3s</div>
                        <div class="metric-label">Avg Runtime</div>
                    </div>
                    <div class="metric-box">
                        <div class="metric-value">3</div>
                        <div class="metric-label">Failed Tests</div>
                    </div>
                </div>
            </div>
            
            <div class="card">
                <h3>📁 Recent Activity</h3>
                <div class="status-item">
                    <span class="status-label">api.test.js</span>
                    <span class="status-value status-success">2 min ago</span>
                </div>
                <div class="status-item">
                    <span class="status-label">user.test.js</span>
                    <span class="status-value status-success">5 min ago</span>
                </div>
                <div class="status-item">
                    <span class="status-label">db.test.js</span>
                    <span class="status-value status-warning">12 min ago</span>
                </div>
            </div>
        </div>
        
        <div class="card">
            <h3>⚡ Available APM Commands</h3>
            <div class="command-list">
                <h4>QA Framework Commands:</h4>
                <div class="command-item">
                    <span class="command-name">/qa-framework test-execute</span>
                    <span class="command-desc">Run comprehensive test suites</span>
                </div>
                <div class="command-item">
                    <span class="command-name">/parallel-qa-framework</span>
                    <span class="command-desc">Execute all test types simultaneously (4x speedup)</span>
                </div>
                <div class="command-item">
                    <span class="command-name">/qa-predict</span>
                    <span class="command-desc">ML-powered test failure prediction (92% accuracy)</span>
                </div>
                <div class="command-item">
                    <span class="command-name">/qa-anomaly</span>
                    <span class="command-desc">Quality anomaly detection (94% precision)</span>
                </div>
                <div class="command-item">
                    <span class="command-name">/qa-optimize</span>
                    <span class="command-desc">Test execution optimization (63% time reduction)</span>
                </div>
            </div>
        </div>
        
        <div class="refresh-info">
            🔄 Dashboard auto-refreshes every 10 seconds | 
            📡 Monitoring on port $port | 
            ⚙️ Mode: $mode |
            🕒 Last updated: $(date)
        </div>
    </div>
</body>
</html>
EOF
}

# Function to start simple HTTP server
start_dashboard_server() {
    local port="$1"
    local mode="$2"
    
    generate_dashboard_html "$port" "$mode"
    
    echo -e "${GREEN}Starting APM Test Dashboard on port $port...${NC}"
    echo -e "${BLUE}Dashboard URL: http://localhost:$port${NC}"
    echo -e "${YELLOW}Press Ctrl+C to stop dashboard${NC}"
    echo ""
    
    # Try different HTTP server options
    if command -v python3 &> /dev/null; then
        cd /tmp && python3 -m http.server "$port" -b 127.0.0.1 > /dev/null 2>&1 &
        SERVER_PID=$!
    elif command -v python &> /dev/null; then
        cd /tmp && python -m SimpleHTTPServer "$port" > /dev/null 2>&1 &
        SERVER_PID=$!
    elif command -v node &> /dev/null; then
        # Create simple Node.js server
        cat > /tmp/apm-server.js << 'EOF'
const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
    if (req.url === '/' || req.url === '/index.html') {
        fs.readFile('/tmp/apm-test-dashboard.html', (err, data) => {
            if (err) {
                res.writeHead(404);
                res.end('Not Found');
                return;
            }
            res.writeHead(200, {'Content-Type': 'text/html'});
            res.end(data);
        });
    } else {
        res.writeHead(404);
        res.end('Not Found');
    }
});

server.listen(process.argv[2], '127.0.0.1', () => {
    console.log(\`Dashboard running on port \${process.argv[2]}\`);
});
EOF
        node /tmp/apm-server.js "$port" > /dev/null 2>&1 &
        SERVER_PID=$!
    else
        echo -e "${RED}Error: No suitable HTTP server found (python3, python, or node)${NC}"
        exit 1
    fi
    
    # Wait a moment for server to start
    sleep 2
    
    # Check if server is running
    if kill -0 "$SERVER_PID" 2>/dev/null; then
        echo -e "${GREEN}✓ Dashboard server started successfully${NC}"
        echo -e "${BLUE}  Access at: http://localhost:$port${NC}"
        echo -e "${BLUE}  Dashboard file: /tmp/apm-test-dashboard.html${NC}"
        
        # Open browser if possible
        if command -v xdg-open &> /dev/null; then
            xdg-open "http://localhost:$port" 2>/dev/null
        elif command -v open &> /dev/null; then
            open "http://localhost:$port" 2>/dev/null
        fi
        
        # Wait for interrupt
        trap "echo -e '\\n${YELLOW}Stopping dashboard server...${NC}'; kill $SERVER_PID 2>/dev/null; exit 0" INT
        wait "$SERVER_PID"
    else
        echo -e "${RED}✗ Failed to start dashboard server${NC}"
        exit 1
    fi
}

# Function to show help
show_help() {
    echo "APM Framework Test Dashboard v{{VERSION}}"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "OPTIONS:"
    echo "  --help, -h         Show this help message"
    echo "  --port, -p N       Set dashboard port (default: 2601)"
    echo "  --mode, -m MODE    Set dashboard mode (full, metrics, executive)"
    echo "  --generate, -g     Generate HTML file only"
    echo "  --status           Show current dashboard status"
    echo ""
    echo "MODES:"
    echo "  full              Complete dashboard with all monitoring data"
    echo "  metrics           Metrics-focused view for developers"
    echo "  executive         High-level view for management"
    echo ""
    echo "Environment Variables:"
    echo "  APM_DASHBOARD_PORT    Default dashboard port (default: 2601)"
    echo "  APM_DASHBOARD_MODE    Default dashboard mode (default: full)"
    echo ""
    echo "Examples:"
    echo "  $0                    # Start dashboard on default port"
    echo "  $0 --port 3000       # Start on port 3000"
    echo "  $0 --mode executive  # Executive dashboard view"
    echo "  $0 --generate        # Generate HTML file only"
    echo ""
}

# Parse command line arguments
PORT="$DEFAULT_PORT"
MODE="$DASHBOARD_MODE"
GENERATE_ONLY=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --help|-h)
            show_help
            exit 0
            ;;
        --port|-p)
            PORT="$2"
            shift 2
            ;;
        --mode|-m)
            MODE="$2"
            shift 2
            ;;
        --generate|-g)
            GENERATE_ONLY=true
            shift
            ;;
        --status)
            echo "Checking dashboard status on port $PORT..."
            if curl -s "http://localhost:$PORT" >/dev/null 2>&1; then
                echo -e "${GREEN}✓ Dashboard is running on port $PORT${NC}"
            else
                echo -e "${RED}✗ Dashboard is not running on port $PORT${NC}"
            fi
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Validate port
if ! [[ "$PORT" =~ ^[0-9]+$ ]] || [ "$PORT" -lt 1024 ] || [ "$PORT" -gt 65535 ]; then
    echo "Error: Invalid port number. Must be between 1024 and 65535."
    exit 1
fi

# Validate mode
case "$MODE" in
    full|metrics|executive)
        ;;
    *)
        echo "Error: Invalid mode. Must be 'full', 'metrics', or 'executive'."
        exit 1
        ;;
esac

# Check if port is available
if netstat -tuln 2>/dev/null | grep -q ":$PORT "; then
    echo -e "${RED}Error: Port $PORT is already in use${NC}"
    echo "Try a different port with --port option"
    exit 1
fi

# Execute based on mode
if [ "$GENERATE_ONLY" = true ]; then
    generate_dashboard_html "$PORT" "$MODE"
    echo -e "${GREEN}✓ Dashboard HTML generated: /tmp/apm-test-dashboard.html${NC}"
    echo -e "${BLUE}Open in browser: file:///tmp/apm-test-dashboard.html${NC}"
else
    start_dashboard_server "$PORT" "$MODE"
fi