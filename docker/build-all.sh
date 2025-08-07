#!/bin/bash
# docker/build-all.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
IMAGES_DIR="$SCRIPT_DIR/images"

echo "Building Debug Host base images..."
echo "Images directory: $IMAGES_DIR"

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo "Error: Docker is not running. Please start Docker and try again."
    exit 1
fi

# Array of image types to build
TYPES=("node" "python" "php" "static")

# Build each image
for type in "${TYPES[@]}"; do
    echo "----------------------------------------"
    echo "Building $type image..."
    echo "----------------------------------------"
    
    DOCKERFILE_PATH="$IMAGES_DIR/$type/Dockerfile"
    
    if [ ! -f "$DOCKERFILE_PATH" ]; then
        echo "Error: Dockerfile not found at $DOCKERFILE_PATH"
        exit 1
    fi
    
    # Build the image with build context set to images directory
    docker build \
        -t "debug-host/$type:latest" \
        -f "$DOCKERFILE_PATH" \
        "$IMAGES_DIR" || {
        echo "Error: Failed to build $type image"
        exit 1
    }
    
    echo "✓ Successfully built debug-host/$type:latest"
done

echo "----------------------------------------"
echo "Cleaning up dangling images..."
echo "----------------------------------------"
docker image prune -f

echo "----------------------------------------"
echo "Build complete. Images built:"
echo "----------------------------------------"
docker images | grep debug-host

echo "----------------------------------------"
echo "Image sizes:"
echo "----------------------------------------"
for type in "${TYPES[@]}"; do
    SIZE=$(docker images --format "table {{.Repository}}:{{.Tag}}\t{{.Size}}" | grep "debug-host/$type:latest" | awk '{print $2}')
    echo "debug-host/$type:latest - $SIZE"
    
    # Check if image is under 500MB (convert to MB for comparison)
    SIZE_MB=$(docker inspect "debug-host/$type:latest" --format='{{.Size}}' | awk '{print int($1/1024/1024)}')
    if [ "$SIZE_MB" -gt 500 ]; then
        echo "⚠️  Warning: debug-host/$type:latest ($SIZE_MB MB) exceeds 500MB limit"
    else
        echo "✓ debug-host/$type:latest ($SIZE_MB MB) is under 500MB limit"
    fi
done

echo "----------------------------------------"
echo "All images built successfully!"
echo "----------------------------------------"