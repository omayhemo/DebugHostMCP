#!/bin/bash

# Build all Debug Host Docker images

echo "Building Debug Host Docker images..."

# Build Node.js image
echo "Building Node.js image..."
docker build -t debug-host/node:latest ./images/node/

# Build Vite image
echo "Building Vite image..."
docker build -t debug-host/vite:latest ./images/vite/

# Build Python image
echo "Building Python image..."
docker build -t debug-host/python:latest ./images/python/

# Build PHP image
echo "Building PHP image..."
docker build -t debug-host/php:latest ./images/php/

# Build Static image
echo "Building Static image..."
docker build -t debug-host/static:latest ./images/static/

echo ""
echo "All images built successfully!"
echo ""
echo "Available images:"
docker images | grep debug-host