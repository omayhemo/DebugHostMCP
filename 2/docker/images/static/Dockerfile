# Static Content Base Image for Debug Host
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

# Install global static serving tools
RUN npm install -g \
    serve@14.2.1 \
    http-server@14.1.1 \
    vite@5.0.10 \
    live-server@1.2.2 \
    browser-sync@2.29.3 && \
    npm cache clean --force

# Set working directory
WORKDIR /app

# Create non-root user
RUN groupadd -g 1001 staticuser && \
    useradd -r -u 1001 -g staticuser staticuser && \
    chown -R staticuser:staticuser /app

# Create a basic vite config for static serving
RUN echo 'import { defineConfig } from "vite"\n\
\n\
export default defineConfig({\n\
  root: "/app",\n\
  server: {\n\
    host: "0.0.0.0",\n\
    port: 3000,\n\
    watch: {\n\
      usePolling: true,\n\
      interval: 1000\n\
    }\n\
  },\n\
  build: {\n\
    outDir: "dist",\n\
    emptyOutDir: true\n\
  }\n\
})' > /app/vite.config.js

# Create browser-sync config for live reload
RUN echo 'module.exports = {\n\
  server: "/app",\n\
  port: 3000,\n\
  host: "0.0.0.0",\n\
  files: ["**/*.html", "**/*.css", "**/*.js", "**/*.json"],\n\
  ignore: ["node_modules", ".git", "*.log"],\n\
  reloadDelay: 1000,\n\
  ui: false,\n\
  open: false,\n\
  notify: false\n\
}' > /usr/local/etc/bs-config.js

USER staticuser

# Default command serves static files with hot reload using browser-sync
CMD ["browser-sync", "start", "--config", "/usr/local/etc/bs-config.js"]