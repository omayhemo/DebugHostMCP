#!/bin/bash
# AP Mapping Installer - Python Environment Setup
# Sets up Python virtual environment for installer scripts

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV_DIR="$SCRIPT_DIR/venv"

echo -e "${GREEN}AP Mapping Installer - Python Setup${NC}"
echo "================================================"

# Check Python installation
echo -n "Checking Python installation... "
if ! command -v python3 &>/dev/null; then
    echo -e "${RED}Not found${NC}"
    echo "Python 3 is required. Please install Python 3.8 or later."
    exit 1
fi

PYTHON_VERSION=$(python3 --version 2>&1 | cut -d' ' -f2)
echo -e "${GREEN}Found Python $PYTHON_VERSION${NC}"

# Check if virtual environment already exists
if [ -d "$VENV_DIR" ]; then
    echo -e "${YELLOW}Virtual environment already exists at: $VENV_DIR${NC}"
    read -p "Do you want to recreate it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Using existing virtual environment."
    else
        echo "Removing existing virtual environment..."
        rm -rf "$VENV_DIR"
    fi
fi

# Create virtual environment if it doesn't exist
if [ ! -d "$VENV_DIR" ]; then
    echo "Creating virtual environment..."
    python3 -m venv "$VENV_DIR"
    echo -e "${GREEN}Virtual environment created successfully${NC}"
fi

# Activate virtual environment
echo "Activating virtual environment..."
source "$VENV_DIR/bin/activate"

# Upgrade pip
echo "Upgrading pip..."
pip install --upgrade pip >/dev/null 2>&1

# Install requirements if file exists
if [ -f "$SCRIPT_DIR/requirements.txt" ]; then
    echo "Installing requirements..."
    pip install -r "$SCRIPT_DIR/requirements.txt"
    echo -e "${GREEN}Requirements installed successfully${NC}"
else
    echo -e "${YELLOW}No requirements.txt found - skipping package installation${NC}"
fi

# Create activation helper script
cat > "$SCRIPT_DIR/activate-python.sh" << 'EOF'
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
EOF

chmod +x "$SCRIPT_DIR/activate-python.sh"

# Note: We don't modify Python script shebangs
# Hooks and scripts should use system Python by default
# The virtual environment is for additional packages if needed
echo "Note: Python scripts will use system Python by default."
echo "      Use the virtual environment for additional packages."

echo
echo -e "${GREEN}Python environment setup complete!${NC}"
echo
echo "To use the Python environment:"
echo "  - Run: source $SCRIPT_DIR/activate-python.sh"
echo "  - Or: source $VENV_DIR/bin/activate"
echo
echo "The installer will automatically use this environment for Python scripts."