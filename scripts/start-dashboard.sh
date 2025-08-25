#!/bin/bash
# MCP Debug Host Dashboard Startup Script

set -e

echo "🚀 Starting MCP Debug Host Dashboard"
echo "======================================"

# Check if we're in the correct directory
if [ ! -f "dashboard/package.json" ]; then
    echo "❌ Error: Must be run from the project root directory"
    echo "Current directory: $(pwd)"
    echo "Expected: Should contain dashboard/package.json"
    exit 1
fi

# Navigate to dashboard directory
cd dashboard

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed"
    echo "Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | sed 's/v//')
MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1)

if [ "$MAJOR_VERSION" -lt "18" ]; then
    echo "❌ Error: Node.js version $NODE_VERSION is not supported"
    echo "Required: Node.js 18+"
    exit 1
fi

echo "✅ Node.js version: $NODE_VERSION"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
else
    echo "✅ Dependencies already installed"
fi

# Run type checking
echo "🔍 Checking TypeScript..."
npm run type-check

# Start development server
echo "🌟 Starting development server..."
echo "Dashboard will be available at: http://localhost:5173"
echo "Press Ctrl+C to stop the server"
echo ""

npm run dev