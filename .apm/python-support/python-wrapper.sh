#!/bin/bash
# Python wrapper script for AP Mapping installer
# Ensures Python scripts run in the virtual environment if available

# Get the directory of this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV_DIR="$SCRIPT_DIR/venv"

# Check if virtual environment exists and activate it
if [ -d "$VENV_DIR" ] && [ -f "$VENV_DIR/bin/activate" ]; then
    source "$VENV_DIR/bin/activate"
fi

# Get the Python script to run
PYTHON_SCRIPT="$1"
shift

# Run the Python script with remaining arguments
if [ -f "$PYTHON_SCRIPT" ]; then
    python3 "$PYTHON_SCRIPT" "$@"
else
    echo "Error: Python script not found: $PYTHON_SCRIPT" >&2
    exit 1
fi