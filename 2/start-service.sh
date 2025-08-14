#!/bin/bash
# Start the APM Debug Host Global Service
# This runs the API server and dashboard

cd "$(dirname "$0")"

# Start the global service
node service/global-service.js