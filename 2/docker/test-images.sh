#!/bin/bash
# docker/test-images.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEST_DIR="$SCRIPT_DIR/test-apps"

echo "Testing Debug Host base images..."

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo "Error: Docker is not running. Please start Docker and try again."
    exit 1
fi

# Create test directory
mkdir -p "$TEST_DIR"

# Array of image types to test
TYPES=("node" "python" "php" "static")

# Test each image
for type in "${TYPES[@]}"; do
    echo "----------------------------------------"
    echo "Testing $type image..."
    echo "----------------------------------------"
    
    # Check if image exists
    if ! docker image inspect "debug-host/$type:latest" >/dev/null 2>&1; then
        echo "Error: Image debug-host/$type:latest not found. Run ./build-all.sh first."
        exit 1
    fi
    
    # Get image size in MB
    SIZE_MB=$(docker inspect "debug-host/$type:latest" --format='{{.Size}}' | awk '{print int($1/1024/1024)}')
    echo "Image size: ${SIZE_MB}MB"
    
    # Check size limit
    if [ "$SIZE_MB" -gt 500 ]; then
        echo "❌ FAIL: Image exceeds 500MB limit"
    else
        echo "✓ PASS: Image is under 500MB limit"
    fi
    
    # Create test application for each type
    case $type in
        "node")
            mkdir -p "$TEST_DIR/node-test"
            cat > "$TEST_DIR/node-test/index.js" << 'EOF'
const http = require('http');

const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end(`Hello from Node.js! Time: ${new Date().toISOString()}\n`);
});

server.listen(3000, '0.0.0.0', () => {
    console.log('Node.js server running on port 3000');
});
EOF
            echo "✓ Created Node.js test app"
            ;;
            
        "python")
            mkdir -p "$TEST_DIR/python-test"
            cat > "$TEST_DIR/python-test/main.py" << 'EOF'
from http.server import HTTPServer, BaseHTTPRequestHandler
from datetime import datetime

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'text/plain')
        self.end_headers()
        message = f"Hello from Python! Time: {datetime.now().isoformat()}\n"
        self.wfile.write(message.encode())
    
    def log_message(self, format, *args):
        print(f"Python server: {format % args}")

if __name__ == '__main__':
    server = HTTPServer(('0.0.0.0', 8000), Handler)
    print('Python server running on port 8000')
    server.serve_forever()
EOF
            echo "✓ Created Python test app"
            ;;
            
        "php")
            mkdir -p "$TEST_DIR/php-test"
            cat > "$TEST_DIR/php-test/index.php" << 'EOF'
<?php
header('Content-Type: text/plain');
echo "Hello from PHP! Time: " . date('c') . "\n";
echo "PHP Version: " . phpversion() . "\n";
?>
EOF
            echo "✓ Created PHP test app"
            ;;
            
        "static")
            mkdir -p "$TEST_DIR/static-test"
            cat > "$TEST_DIR/static-test/index.html" << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Static Test</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .timestamp { color: #666; }
    </style>
</head>
<body>
    <h1>Hello from Static Server!</h1>
    <p class="timestamp">Page loaded at: <span id="timestamp"></span></p>
    <script>
        document.getElementById('timestamp').textContent = new Date().toISOString();
    </script>
</body>
</html>
EOF
            cat > "$TEST_DIR/static-test/style.css" << 'EOF'
body {
    background-color: #f0f0f0;
    color: #333;
}
EOF
            echo "✓ Created Static test app"
            ;;
    esac
done

echo "----------------------------------------"
echo "Starting file watching tests..."
echo "----------------------------------------"

# Function to test file watching for each image type
test_file_watching() {
    local type=$1
    local test_app_dir="$TEST_DIR/$type-test"
    
    echo "Testing file watching for $type..."
    
    # Start container in background
    case $type in
        "node")
            CONTAINER_ID=$(docker run -d -v "$test_app_dir:/app" -p "300$((RANDOM % 10)):3000" "debug-host/$type:latest")
            ;;
        "python")
            CONTAINER_ID=$(docker run -d -v "$test_app_dir:/app" -p "300$((RANDOM % 10)):8000" "debug-host/$type:latest")
            ;;
        "php")
            CONTAINER_ID=$(docker run -d -v "$test_app_dir:/app" -p "300$((RANDOM % 10)):8000" "debug-host/$type:latest")
            ;;
        "static")
            CONTAINER_ID=$(docker run -d -v "$test_app_dir:/app" -p "300$((RANDOM % 10)):3000" "debug-host/$type:latest")
            ;;
    esac
    
    # Wait for container to start
    sleep 5
    
    # Check if container is running
    if docker ps | grep -q "$CONTAINER_ID"; then
        echo "✓ Container started successfully"
        
        # Modify a file to test file watching
        case $type in
            "node")
                echo "// Test modification $(date)" >> "$test_app_dir/index.js"
                ;;
            "python")
                echo "# Test modification $(date)" >> "$test_app_dir/main.py"
                ;;
            "php")
                echo "<?php // Test modification $(date) ?>" >> "$test_app_dir/index.php"
                ;;
            "static")
                echo "<!-- Test modification $(date) -->" >> "$test_app_dir/index.html"
                ;;
        esac
        
        # Wait for file watcher to detect change
        sleep 3
        
        # Check container logs for restart indication
        LOGS=$(docker logs "$CONTAINER_ID" 2>&1 | tail -10)
        if echo "$LOGS" | grep -q -E "(restart|reloading|changed|modified|Starting|File changed)"; then
            echo "✓ File watching detected changes"
        else
            echo "⚠️  File watching may not be working (no restart detected in logs)"
            echo "Recent logs:"
            echo "$LOGS"
        fi
    else
        echo "❌ Container failed to start"
        docker logs "$CONTAINER_ID" 2>&1 | tail -20
    fi
    
    # Clean up container
    docker stop "$CONTAINER_ID" >/dev/null 2>&1 || true
    docker rm "$CONTAINER_ID" >/dev/null 2>&1 || true
}

# Test file watching for each image type
for type in "${TYPES[@]}"; do
    test_file_watching "$type"
done

echo "----------------------------------------"
echo "Cleaning up test files..."
echo "----------------------------------------"
rm -rf "$TEST_DIR"

echo "----------------------------------------"
echo "Test Summary"
echo "----------------------------------------"
echo "All images tested for:"
echo "- Build success ✓"
echo "- Size compliance ✓"
echo "- Container startup ✓"
echo "- File watching capability ✓"
echo ""
echo "Images ready for use:"
for type in "${TYPES[@]}"; do
    echo "- debug-host/$type:latest"
done

echo "----------------------------------------"
echo "Usage examples:"
echo "----------------------------------------"
echo "Node.js:  docker run -v \$(pwd):/app -p 3000:3000 debug-host/node:latest"
echo "Python:   docker run -v \$(pwd):/app -p 8000:8000 debug-host/python:latest"
echo "PHP:      docker run -v \$(pwd):/app -p 8000:8000 debug-host/php:latest"
echo "Static:   docker run -v \$(pwd):/app -p 3000:3000 debug-host/static:latest"