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
RUN echo '#!/bin/bash\n\
set -e\n\
\n\
# Function to find and run dev server\n\
run_dev_server() {\n\
    # Check if node_modules exists, if not install dependencies\n\
    if [ ! -d "node_modules" ]; then\n\
        echo "Installing dependencies..."\n\
        if [ -f "pnpm-lock.yaml" ]; then\n\
            pnpm install\n\
        elif [ -f "yarn.lock" ]; then\n\
            yarn install\n\
        elif [ -f "package-lock.json" ]; then\n\
            npm ci\n\
        else\n\
            npm install\n\
        fi\n\
    fi\n\
    \n\
    # Check for dev script in package.json\n\
    if [ -f "package.json" ]; then\n\
        if grep -q "\"dev\"" package.json; then\n\
            echo "Starting Vite dev server with npm run dev..."\n\
            npm run dev -- --host 0.0.0.0 --port ${PORT:-5173}\n\
        elif grep -q "\"start\"" package.json; then\n\
            echo "Starting with npm start..."\n\
            npm start -- --host 0.0.0.0 --port ${PORT:-5173}\n\
        elif [ -f "vite.config.js" ] || [ -f "vite.config.ts" ]; then\n\
            echo "Starting Vite directly..."\n\
            npx vite --host 0.0.0.0 --port ${PORT:-5173}\n\
        else\n\
            echo "No Vite configuration found. Please ensure your project has a vite.config file."\n\
            exit 1\n\
        fi\n\
    else\n\
        echo "No package.json found in /app"\n\
        exit 1\n\
    fi\n\
}\n\
\n\
# Run the dev server\n\
run_dev_server\n\
' > /usr/local/bin/vite-starter.sh && \
    chmod +x /usr/local/bin/vite-starter.sh

# Expose common Vite ports
EXPOSE 3000 3001 4173 5173 5174 8080

# Environment variables for Vite
ENV NODE_ENV=development
ENV VITE_HOST=0.0.0.0

# Default command
CMD ["/usr/local/bin/vite-starter.sh"]