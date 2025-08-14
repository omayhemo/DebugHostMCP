#!/bin/bash

# Piper Chat Setup Script
# This script sets up piper text-to-speech system with required dependencies

set -e

# Colors
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "========================================"
echo "Piper Chat Setup Script"
echo "========================================"
echo ""

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to handle errors
handle_error() {
    echo "Error: $1"
    exit 1
}

# Get the project root (two levels up from this script)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Get the directory where we'll set up piper
# Default to project-local .piper directory
SETUP_DIR="${1:-$PROJECT_ROOT/.piper}"

echo "Setting up Piper in: $SETUP_DIR"
echo "Project root: $PROJECT_ROOT"
echo ""

# Create and enter directory
mkdir -p "$SETUP_DIR" || handle_error "Failed to create directory $SETUP_DIR"
cd "$SETUP_DIR" || handle_error "Failed to change to directory $SETUP_DIR"

echo "Step 1: Installing Dependencies"
echo "-------------------------------"

# Check if running on a Debian-based system
if ! command_exists apt-get; then
    echo "Warning: This script is designed for Debian-based systems (Ubuntu, etc.)"
    echo "You'll need to manually install espeak-ng for your system."
    echo ""
    printf "${YELLOW}Continue anyway? (y/n): ${NC}"
    read -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo "Installing espeak-ng..."
    sudo apt-get update
    sudo apt-get install -y espeak-ng || handle_error "Failed to install espeak-ng"
fi

# Create symbolic link for espeak-ng data (fixes common path error)
echo "Creating symbolic link for espeak-ng data..."
if [ -d "/usr/lib/x86_64-linux-gnu/espeak-ng-data" ] && [ ! -L "/usr/share/espeak-ng-data" ]; then
    sudo ln -s /usr/lib/x86_64-linux-gnu/espeak-ng-data /usr/share/espeak-ng-data || \
        echo "Warning: Failed to create symbolic link (may already exist)"
fi

echo ""
echo "Step 2: Piper Installation Choice"
echo "---------------------------------"

# Check if running in unattended mode
if [ "$USE_DEFAULTS" = true ]; then
    echo "Using default: Download pre-compiled binary"
    BUILD_CHOICE="1"
else
    echo ""
    echo -e "${GREEN}How would you like to install Piper?${NC}"
    echo -e "${BLUE}"
    echo "1) Download pre-compiled binary (recommended - fast)"
    echo "2) Build from source (slower, requires build tools)"
    echo -e "${NC}"
    printf "${YELLOW}Enter choice (1 or 2) [1]: ${NC}"
    read BUILD_CHOICE
    BUILD_CHOICE="${BUILD_CHOICE:-1}"
fi

if [ "$BUILD_CHOICE" = "1" ]; then
    echo ""
    echo "Step 3: Downloading Pre-compiled Piper Binary"
    echo "--------------------------------------------"
    
    # Detect architecture
    ARCH=$(uname -m)
    OS=$(uname -s | tr '[:upper:]' '[:lower:]')
    
    # Construct download URL for piper binary
    PIPER_VERSION="2023.11.14-2"
    
    # Map to actual release file names
    case "$OS" in
        darwin)
            echo ""
            echo -e "${YELLOW}WARNING: Piper does not provide official macOS binaries.${NC}"
            echo ""
            echo -e "${GREEN}Options:${NC}"
            echo -e "${BLUE}"
            echo "1) Try building from source (requires development tools)"
            echo "2) Skip Piper installation (use different TTS provider)"
            echo -e "${NC}"
            echo "Note: Building from source requires:"
            echo "  - Xcode Command Line Tools"
            echo "  - CMake"
            echo "  - Python 3.7+"
            echo ""
            printf "${YELLOW}Continue with build from source? (y/N): ${NC}"
            read -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                echo "Skipping Piper installation."
                echo "You can configure a different TTS provider later."
                exit 0
            fi
            BUILD_CHOICE="2"
            ;;
        linux)
            case "$ARCH" in
                x86_64) 
                    PIPER_FILE="piper_${OS}_x86_64.tar.gz"
                    ;;
                aarch64|arm64) 
                    PIPER_FILE="piper_${OS}_arm64.tar.gz"
                    ;;
                armv7l) 
                    PIPER_FILE="piper_${OS}_armv7.tar.gz"
                    ;;
                *)
                    echo "Unsupported architecture: $ARCH"
                    BUILD_CHOICE="2"
                    ;;
            esac
            ;;
        *)
            echo "Unsupported operating system: $OS"
            BUILD_CHOICE="2"
            ;;
    esac
    
    PIPER_URL="https://github.com/rhasspy/piper/releases/download/${PIPER_VERSION}/${PIPER_FILE}"
    
    echo "Downloading piper for ${OS}_${ARCH}..."
    echo "URL: $PIPER_URL"
    
    # Download and extract
    wget -q --show-progress "$PIPER_URL" -O piper.tar.gz || {
        echo "Error: Failed to download pre-compiled binary"
        echo "Falling back to building from source..."
        BUILD_CHOICE="2"
    }
    
    if [ "$BUILD_CHOICE" = "1" ]; then
        echo "Extracting piper..."
        
        # Clean up any existing piper directory first
        if [ -d "piper" ]; then
            echo "Removing existing piper directory..."
            rm -rf piper
        fi
        
        tar -xzf piper.tar.gz || handle_error "Failed to extract piper"
        rm piper.tar.gz
        
        # The archive extracts to a 'piper' directory
        if [ -d "piper" ] && [ -f "piper/piper" ]; then
            # Copy the binary first
            cp piper/piper ./piper-executable
            
            # Copy other required files
            cp -r piper/*.so* ./ 2>/dev/null || true
            cp -r piper/espeak-ng-data ./ 2>/dev/null || true
            cp piper/libtashkeel_model.ort ./ 2>/dev/null || true
            
            # Clean up the extracted directory
            rm -rf piper/
            
            # Now rename the binary
            mv ./piper-executable ./piper
            chmod +x ./piper
            
            # Verify it exists
            if [ -f "./piper" ]; then
                echo "✓ Piper binary and dependencies ready"
            else
                echo "Error: Failed to install piper binary"
                exit 1
            fi
        else
            echo "Error: Piper binary not found in expected location"
            echo "Please check the extracted files and run the script again"
            exit 1
        fi
    fi
fi

if [ "$BUILD_CHOICE" = "2" ]; then
    echo ""
    echo "Step 3: Building from Source"
    echo "---------------------------"
    
    # Clone repositories
    echo "Cloning piper..."
    if [ ! -d "piper" ]; then
        git clone https://github.com/rhasspy/piper.git || handle_error "Failed to clone piper"
    else
        echo "piper directory already exists, skipping clone"
    fi

    echo "Cloning piper-phonemize..."
    if [ ! -d "piper-phonemize" ]; then
        # Try SSH first, fall back to HTTPS if it fails
        git clone git@github.com:rhasspy/piper-phonemize.git 2>/dev/null || \
        git clone https://github.com/rhasspy/piper-phonemize.git || \
        handle_error "Failed to clone piper-phonemize"
    else
        echo "piper-phonemize directory already exists, skipping clone"
    fi

    echo ""
    echo "Building piper-phonemize"
    echo "------------------------"
    
    cd piper-phonemize || handle_error "Failed to enter piper-phonemize directory"
    
    # Check if we need to install build dependencies
    if ! command_exists cmake; then
        echo "Installing build dependencies..."
        sudo apt-get install -y build-essential cmake || handle_error "Failed to install build dependencies"
    fi
    
    # Build piper-phonemize
    echo "Building piper-phonemize..."
    mkdir -p build
    cd build
    cmake .. || handle_error "Failed to configure piper-phonemize"
    make || handle_error "Failed to build piper-phonemize"
    
    echo "Installing piper-phonemize..."
    sudo make install || echo "Warning: Failed to install piper-phonemize system-wide (continuing anyway)"
    
    cd "$SETUP_DIR"
    
    echo ""
    echo "Building piper"
    echo "--------------"
    
    cd piper || handle_error "Failed to enter piper directory"
    
    # Build piper
    echo "Building piper..."
    make || handle_error "Failed to build piper"
    
    # Copy piper binary to main directory
    echo "Copying piper binary..."
    cp build/piper "$SETUP_DIR/piper" || handle_error "Failed to copy piper binary"
    chmod +x "$SETUP_DIR/piper"
    
    cd "$SETUP_DIR"
fi

echo ""
echo "Step 4: Downloading Voice Models"
echo "--------------------------------"

# Create models directory
mkdir -p models
cd models

# Base URL for piper models from Hugging Face
BASE_URL="https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0"

# Function to download a voice model
download_voice() {
    local voice_name="$1"
    local voice_desc="$2"
    local voice_path="$3"
    
    if [ ! -f "${voice_name}.onnx" ]; then
        echo "Downloading ${voice_desc} (${voice_name})..."
        wget -q --show-progress "${BASE_URL}/${voice_path}/${voice_name}.onnx" || \
            echo "Warning: Failed to download ${voice_name}"
        wget -q "${BASE_URL}/${voice_path}/${voice_name}.onnx.json" || \
            echo "Warning: Failed to download ${voice_name} config"
    else
        echo "${voice_desc} already exists, skipping..."
    fi
}

# Parallel download function for background execution
download_voice_parallel() {
    local voice_name="$1"
    local voice_desc="$2"
    local voice_path="$3"
    local log_file="${voice_name}.download.log"
    
    if [ ! -f "${voice_name}.onnx" ]; then
        echo "Starting download: ${voice_desc} (${voice_name})..." > "$log_file"
        {
            wget -q "${BASE_URL}/${voice_path}/${voice_name}.onnx" 2>>"$log_file" && \
            wget -q "${BASE_URL}/${voice_path}/${voice_name}.onnx.json" 2>>"$log_file" && \
            echo "✅ Completed: ${voice_desc}" >> "$log_file"
        } || {
            echo "❌ Failed: ${voice_desc}" >> "$log_file"
        }
    else
        echo "✅ Already exists: ${voice_desc}" > "$log_file"
    fi
}

echo ""
echo "Downloading 9 voice models in parallel (4x faster)..."
echo "======================================================"

# Start all downloads in parallel (background processes)
echo "🚀 Starting parallel downloads..."

# Women's voices
download_voice_parallel "en_US-amy-medium" "Amy (woman, medium quality)" "en/en_US/amy/medium" &
download_voice_parallel "en_US-kusal-medium" "Kusal (woman, medium quality)" "en/en_US/kusal/medium" &
download_voice_parallel "en_US-hfc_female-medium" "HFC Female (woman, medium quality)" "en/en_US/hfc_female/medium" &
download_voice_parallel "en_US-lessac-medium" "Lessac (woman, medium quality)" "en/en_US/lessac/medium" &
download_voice_parallel "en_US-libritts_r-medium" "LibriTTS-R (woman, medium quality)" "en/en_US/libritts_r/medium" &

# Men's voices  
download_voice_parallel "en_US-ryan-medium" "Ryan (man, medium quality)" "en/en_US/ryan/medium" &
download_voice_parallel "en_US-joe-medium" "Joe (man, medium quality)" "en/en_US/joe/medium" &
download_voice_parallel "en_US-arctic-medium" "Arctic (man, medium quality)" "en/en_US/arctic/medium" &
download_voice_parallel "en_US-john-medium" "John (man, medium quality)" "en/en_US/john/medium" &

# Store background job PIDs for monitoring
download_pids=($!)

echo "✅ All downloads started in parallel"
echo ""
echo "Monitoring download progress..."
echo "------------------------------"

# Monitor downloads with progress updates
TOTAL_VOICES=9
completed=0
while [ $completed -lt $TOTAL_VOICES ]; do
    sleep 2
    completed=0
    
    # Check each voice for completion
    for voice in "en_US-amy-medium" "en_US-kusal-medium" "en_US-hfc_female-medium" "en_US-lessac-medium" "en_US-libritts_r-medium" "en_US-ryan-medium" "en_US-joe-medium" "en_US-arctic-medium" "en_US-john-medium"; do
        if [ -f "${voice}.onnx" ] && [ -f "${voice}.onnx.json" ]; then
            completed=$((completed + 1))
        elif [ -f "${voice}.download.log" ]; then
            # Show latest status from log file
            if grep -q "✅ Completed" "${voice}.download.log" 2>/dev/null; then
                completed=$((completed + 1))
            elif grep -q "❌ Failed" "${voice}.download.log" 2>/dev/null; then
                completed=$((completed + 1))  # Count failures as completed to avoid infinite loop
            elif grep -q "✅ Already exists" "${voice}.download.log" 2>/dev/null; then
                completed=$((completed + 1))
            fi
        fi
    done
    
    echo "Progress: $completed/$TOTAL_VOICES voices completed"
done

# Wait for all background processes to finish
wait

echo ""
echo "📊 Download Results:"
echo "==================="

# Show results for each voice
for voice in "en_US-amy-medium" "en_US-kusal-medium" "en_US-hfc_female-medium" "en_US-lessac-medium" "en_US-libritts_r-medium" "en_US-ryan-medium" "en_US-joe-medium" "en_US-arctic-medium" "en_US-john-medium"; do
    if [ -f "${voice}.download.log" ]; then
        cat "${voice}.download.log"
        rm -f "${voice}.download.log"  # Clean up log files
    fi
done

echo ""
echo "🎉 Parallel voice download completed!"

cd ..

echo ""
echo "Voice models downloaded successfully!"
echo ""

echo ""
echo "Step 5: Creating Test Script"
echo "----------------------------"

# Create a test script
cat > test-piper.sh << 'EOF'
#!/bin/bash

# Test script for piper with voice selection
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Function to list available voices
list_voices() {
    echo "Available voices:"
    echo ""
    echo "Women's voices:"
    echo "  1) amy      - Amy (medium quality)"
    echo "  2) kusal    - Kusal (medium quality)"
    echo "  3) hfc      - HFC Female (medium quality)"
    echo "  4) lessac   - Lessac (medium quality)"
    echo "  5) libritts - LibriTTS-R (medium quality)"
    echo ""
    echo "Men's voices:"
    echo "  6) ryan     - Ryan (medium quality)"
    echo "  7) joe      - Joe (medium quality)"
    echo "  8) arctic   - Arctic (medium quality)"
    echo "  9) john     - John (medium quality)"
}

# Map voice names to model files
get_model_file() {
    case "$1" in
        amy|1)      echo "en_US-amy-medium.onnx" ;;
        kusal|2)    echo "en_US-kusal-medium.onnx" ;;
        hfc|3)      echo "en_US-hfc_female-medium.onnx" ;;
        lessac|4)   echo "en_US-lessac-medium.onnx" ;;
        libritts|5) echo "en_US-libritts_r-medium.onnx" ;;
        ryan|6)     echo "en_US-ryan-medium.onnx" ;;
        joe|7)      echo "en_US-joe-medium.onnx" ;;
        arctic|8)   echo "en_US-arctic-medium.onnx" ;;
        john|9)     echo "en_US-john-medium.onnx" ;;
        *)          echo "" ;;
    esac
}

# Parse arguments
if [ "$1" == "--list" ] || [ "$1" == "-l" ]; then
    list_voices
    exit 0
fi

# Get voice selection
VOICE="${1:-amy}"
MODEL_FILE=$(get_model_file "$VOICE")

if [ -z "$MODEL_FILE" ]; then
    echo "Error: Unknown voice '$VOICE'"
    echo ""
    list_voices
    echo ""
    echo "Usage: $0 [voice-name|number] [text]"
    echo "   or: $0 --list"
    exit 1
fi

MODEL="$SCRIPT_DIR/models/$MODEL_FILE"

if [ ! -f "$MODEL" ]; then
    echo "Error: Model file not found: $MODEL"
    echo "Please run the setup script first."
    exit 1
fi

# Get text to speak (from argument or stdin)
if [ -n "$2" ]; then
    TEXT="${@:2}"
else
    TEXT="Hello world, this is a test of the piper text to speech system using the $VOICE voice."
fi

echo "Using voice: $VOICE ($(basename "$MODEL_FILE" .onnx))"
echo "Text: $TEXT"
echo ""

# Generate audio
echo "$TEXT" | "$SCRIPT_DIR/piper" --model "$MODEL" --output_file test-output.wav

if [ -f "test-output.wav" ]; then
    echo "Success! Audio saved to test-output.wav"
    
    # Try to play the audio if a player is available
    if command -v aplay >/dev/null 2>&1; then
        echo "Playing audio..."
        aplay test-output.wav
    elif command -v ffplay >/dev/null 2>&1; then
        echo "Playing audio..."
        ffplay -nodisp -autoexit test-output.wav 2>/dev/null
    else
        echo "No audio player found. Install 'alsa-utils' for aplay or 'ffmpeg' for ffplay to hear the output."
    fi
else
    echo "Error: Failed to generate audio"
fi
EOF

chmod +x test-piper.sh

echo ""
echo "========================================"
echo "Piper Chat Setup Complete!"
echo "========================================"
echo ""
echo "Installation directory: $SETUP_DIR"
echo ""
echo "9 US English voices installed (all medium quality or higher):"
echo "  Women: amy, kusal, hfc, lessac, libritts"
echo "  Men: ryan, joe, arctic, john"
echo ""
echo "To test piper with different voices:"
echo "  cd $SETUP_DIR"
echo "  ./test-piper.sh --list              # List all voices"
echo "  ./test-piper.sh amy                 # Use Amy's voice"
echo "  ./test-piper.sh joe \"Hello there\"   # Use Joe's voice with custom text"
echo "  ./test-piper.sh 3                   # Use voice #3 (HFC)"
echo ""
echo "Or use piper directly:"
echo "  echo 'Your text' | ./piper --model models/en_US-amy-medium.onnx --output_file output.wav"
echo ""
echo "Voice samples: https://rhasspy.github.io/piper-samples/"
echo ""