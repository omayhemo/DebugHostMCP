#!/bin/bash
# Helper script to activate Python virtual environment

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV_DIR="$SCRIPT_DIR/venv"

if [ -d "$VENV_DIR" ]; then
    source "$VENV_DIR/bin/activate"
    echo "Python virtual environment activated"
else
    echo "Virtual environment not found. Run setup-python.sh first."
    exit 1
fi
