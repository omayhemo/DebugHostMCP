# Node.js Base Image for Debug Host
FROM node:22-slim

# Set environment variables
ENV NODE_ENV=development
ENV NPM_CONFIG_UPDATE_NOTIFIER=false
ENV NPM_CONFIG_FUND=false

# Install system dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        git \
        curl \
        ca-certificates && \
    rm -rf /var/lib/apt/lists/* && \
    apt-get clean

# Install global Node.js development tools
RUN npm install -g \
    nodemon@3.0.2 \
    pm2@5.3.0 \
    tsx@4.6.2 \
    ts-node@10.9.2 \
    typescript@5.3.3 && \
    npm cache clean --force

# Set working directory
WORKDIR /app

# Create non-root user
RUN groupadd -g 1001 nodeuser && \
    useradd -r -u 1001 -g nodeuser nodeuser && \
    chown -R nodeuser:nodeuser /app

# Configure nodemon to watch all relevant files and ignore node_modules
RUN echo '{ \
  "watch": ["."], \
  "ext": "js,mjs,json,ts,tsx,jsx", \
  "ignore": ["node_modules/*", ".git/*", "*.log", "dist/*", "build/*"], \
  "delay": "1000", \
  "restartable": "rs", \
  "verbose": true \
}' > /app/nodemon.json

USER nodeuser

# Default command uses nodemon for auto-restart
CMD ["nodemon", "--config", "/app/nodemon.json", "index.js"]