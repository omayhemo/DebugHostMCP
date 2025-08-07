# Story 1.1: Build Docker Base Images

**Status**: Draft  
**Priority**: High  
**Story Points**: 8  
**Sprint**: 1  

## User Story

**As a** Claude Code agent  
**I want** pre-built Docker base images for each supported language  
**So that** I can quickly start projects without build delays  

## Acceptance Criteria

1. **Given** the Docker build context **When** building the Node.js image **Then** it should include nodemon, pm2, tsx, and ts-node globally installed
2. **Given** the Docker build context **When** building the Python image **Then** it should include watchdog and python-dotenv packages
3. **Given** the Docker build context **When** building the PHP image **Then** it should include inotify-tools and Composer
4. **Given** the Docker build context **When** building the Static image **Then** it should include serve, http-server, and vite packages
5. **Given** any base image **When** a file changes in the mounted volume **Then** the application should automatically restart
6. **Given** all base images **When** built **Then** they should be tagged as debug-host/{type}:latest
7. **Given** the build process **When** complete **Then** all images should be under 500MB in size

## Technical Requirements

### Dependencies
- Docker Engine installed and running
- Access to Docker Hub for base image pulls
- Build scripts in `/docker/images/` directory

### Technical Notes
- Use multi-stage builds where possible to minimize image size
- Each image should have a php-watcher.sh script for PHP file watching (example below)
- Set WORKDIR to /app in all images
- Configure proper environment variables (NODE_ENV=development, PYTHONUNBUFFERED=1)

### PHP Watcher Script Example
```bash
#!/bin/bash
# docker/images/scripts/php-watcher.sh

WATCH_DIR="/app"
COMMAND="$@"

echo "Starting PHP with file watching..."
echo "Watching: $WATCH_DIR"
echo "Command: $COMMAND"

# Initial run
$COMMAND &
PID=$!

# Watch for changes
inotifywait -m -r -e modify,create,delete --format '%w%f' \
  --exclude '\.(git|svn|hg)|vendor/|\.swp$|\.tmp$' \
  "$WATCH_DIR" | while read file
do
  if [[ "$file" =~ \.php$ ]]; then
    echo "File changed: $file"
    echo "Restarting PHP..."
    kill $PID 2>/dev/null
    wait $PID 2>/dev/null
    $COMMAND &
    PID=$!
  fi
done
```

### File Structure
```
docker/
└── images/
    ├── node.dockerfile
    ├── python.dockerfile
    ├── php.dockerfile
    ├── static.dockerfile
    └── scripts/
        └── php-watcher.sh
```

## Definition of Done

- [ ] All 4 Dockerfiles created and tested
- [ ] Images successfully built with proper tags
- [ ] File watching verified for each language type
- [ ] Auto-restart functionality confirmed
- [ ] Image sizes optimized (< 500MB each)
- [ ] Build script created for easy rebuilding
- [ ] Documentation updated with build instructions

## Tasks

1. **Create Node.js Dockerfile**
   - Base from node:20-slim
   - Install global packages: nodemon, pm2, tsx, ts-node
   - Configure auto-restart with nodemon
   - Set development environment

2. **Create Python Dockerfile**
   - Base from python:3.11-slim
   - Install watchdog and python-dotenv
   - Configure auto-restart with watchdog
   - Set PYTHONUNBUFFERED=1

3. **Create PHP Dockerfile**
   - Base from php:8.2-cli
   - Install inotify-tools
   - Install Composer
   - Create php-watcher.sh script
   - Configure auto-restart

4. **Create Static Content Dockerfile**
   - Base from node:20-slim
   - Install serve, http-server, vite
   - Configure for static file serving
   - Enable hot reload

5. **Create Build Script**
   - Shell script to build all images
   - Include version tagging
   - Add cleanup of dangling images

6. **Test Auto-Restart Features**
   - Verify file watching works for each language
   - Test restart delays and patterns
   - Confirm graceful shutdown

## Test Scenarios

### Happy Path
- Build all images successfully
- Start a container from each image
- Modify a watched file and verify restart

### Edge Cases
- Large file changes triggering multiple restarts
- Binary file uploads not triggering restarts
- Hidden files and directories properly ignored

### Error Scenarios
- Build failures due to network issues
- Missing base images
- Insufficient disk space

## Notes & Discussion

### Implementation Notes
- Consider using Alpine-based images for smaller size, but ensure compatibility
- The php-watcher.sh script needs special attention as PHP doesn't have built-in file watching
- Nodemon configuration should ignore node_modules and .git directories

### Questions for Review
1. Should we support multiple Node.js versions (18, 20, 22)?
2. Do we need Python virtual environment support inside containers?
3. Should PHP image include common extensions (mysqli, pdo, etc.)?

## Story Progress

| Date | Developer | Status | Notes |
|------|-----------|--------|-------|
| TBD | - | Draft | Story created from architecture |

## Change Log

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-01-05 | SM Agent | Initial story creation |