# Vite Development Container
# Optimized for Vite-based frontend projects with hot-reload support

FROM node:20-alpine

# Install necessary packages
RUN apk add --no-cache \
    git \
    bash \
    curl \
    && npm install -g \
    npm@latest \
    pnpm@latest

# Set up working directory
WORKDIR /app

# Create a startup script that detects and runs the appropriate dev command
RUN cat > /usr/local/bin/vite-starter.sh << 'EOF' && chmod +x /usr/local/bin/vite-starter.sh
#!/bin/bash
set -e

# Function to find and run dev server
run_dev_server() {
    # Check if node_modules exists, if not install dependencies
    if [ ! -d "node_modules" ]; then
        echo "Installing dependencies..."
        if [ -f "pnpm-lock.yaml" ]; then
            pnpm install
        elif [ -f "yarn.lock" ]; then
            yarn install
        elif [ -f "package-lock.json" ]; then
            npm ci
        else
            npm install
        fi
    fi
    
    # Check for dev script in package.json
    if [ -f "package.json" ]; then
        if grep -q "\"dev\"" package.json; then
            echo "Starting Vite dev server with npm run dev..."
            npm run dev -- --host 0.0.0.0 --port ${PORT:-5173}
        elif grep -q "\"start\"" package.json; then
            echo "Starting with npm start..."
            npm start -- --host 0.0.0.0 --port ${PORT:-5173}
        elif [ -f "vite.config.js" ] || [ -f "vite.config.ts" ]; then
            echo "Starting Vite directly..."
            npx vite --host 0.0.0.0 --port ${PORT:-5173}
        else
            echo "No Vite configuration found. Please ensure your project has a vite.config file."
            exit 1
        fi
    else
        echo "No package.json found in /app"
        exit 1
    fi
}

# Run the dev server
run_dev_server
EOF

# Expose common Vite ports
EXPOSE 3000 3001 4173 5173 5174 8080

# Environment variables for Vite
ENV NODE_ENV=development
ENV VITE_HOST=0.0.0.0

# Default command
CMD ["/usr/local/bin/vite-starter.sh"]