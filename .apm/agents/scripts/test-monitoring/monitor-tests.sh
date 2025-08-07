#!/bin/bash
# APM Framework Test Monitoring Script
# Template Version: {{VERSION}}
# Description: Real-time test monitoring for QA operations

# Configuration
PROJECT_ROOT="/mnt/c/Code/MCPServers/DebugHostMCP"
APM_ROOT="/mnt/c/Code/MCPServers/DebugHostMCP/.apm"
QA_REPORTS_DIR="/mnt/c/Code/MCPServers/DebugHostMCP/project_docs/qa"
TEST_OUTPUT_DIR="workspace/tests"
REFRESH_INTERVAL="${APM_TEST_MONITOR_INTERVAL:-5}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to display header
show_header() {
    clear
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}   APM Framework Test Monitor v{{VERSION}}${NC}"
    echo -e "${BLUE}   $(date)${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
}

# Function to check active test processes
check_active_tests() {
    echo -e "${YELLOW}Active Test Processes:${NC}"
    local test_processes=$(ps aux | grep -E "(jest|npm.*test|pytest|mocha|karma|vitest)" | grep -v grep)
    
    if [ -n "$test_processes" ]; then
        echo "$test_processes" | while read -r line; do
            echo -e "${GREEN}  ✓ $line${NC}"
        done
    else
        echo -e "${RED}  ✗ No active test processes${NC}"
    fi
    echo ""
}

# Function to check test file changes
check_recent_test_files() {
    echo -e "${YELLOW}Recent Test File Changes (last hour):${NC}"
    
    local recent_files=$(find "$PROJECT_ROOT" -name "*test*" -type f -mmin -60 2>/dev/null)
    
    if [ -n "$recent_files" ]; then
        echo "$recent_files" | head -5 | while read -r file; do
            local mod_time=$(stat -c %y "$file" 2>/dev/null)
            echo -e "${GREEN}  ✓ $file (${mod_time})${NC}"
        done
    else
        echo -e "${RED}  ✗ No recent test file changes${NC}"
    fi
    echo ""
}

# Function to check QA reports
check_qa_reports() {
    echo -e "${YELLOW}QA Reports Status:${NC}"
    
    if [ -d "$QA_REPORTS_DIR" ]; then
        local report_count=$(find "$QA_REPORTS_DIR" -name "*.md" -o -name "*.json" | wc -l)
        echo -e "${GREEN}  ✓ $report_count QA reports available${NC}"
        
        # Show most recent reports
        find "$QA_REPORTS_DIR" -name "*.md" -type f -mtime -1 2>/dev/null | head -3 | while read -r file; do
            echo -e "    📄 $(basename "$file")"
        done
    else
        echo -e "${RED}  ✗ QA reports directory not found${NC}"
    fi
    echo ""
}

# Function to check test coverage
check_test_coverage() {
    echo -e "${YELLOW}Test Coverage Status:${NC}"
    
    # Look for coverage reports
    local coverage_files=$(find "$PROJECT_ROOT" -name "coverage" -type d -o -name "*.coverage" -type f 2>/dev/null)
    
    if [ -n "$coverage_files" ]; then
        echo "$coverage_files" | while read -r file; do
            echo -e "${GREEN}  ✓ Coverage data: $file${NC}"
        done
    else
        echo -e "${RED}  ✗ No coverage data found${NC}"
    fi
    echo ""
}

# Function to check test logs
check_test_logs() {
    echo -e "${YELLOW}Recent Test Logs:${NC}"
    
    # Check for test logs in common locations
    local log_files=$(find "$PROJECT_ROOT" -name "*test*.log" -o -name "test-results*" -type f -mtime -1 2>/dev/null)
    
    if [ -n "$log_files" ]; then
        echo "$log_files" | head -3 | while read -r file; do
            local size=$(du -h "$file" 2>/dev/null | cut -f1)
            echo -e "${GREEN}  ✓ $file ($size)${NC}"
        done
    else
        echo -e "${RED}  ✗ No recent test logs found${NC}"
    fi
    echo ""
}

# Function to check APM QA Framework status
check_apm_qa_framework() {
    echo -e "${YELLOW}APM QA Framework Status:${NC}"
    
    # Check if QA framework is available
    if [ -f "$APM_ROOT/agents/personas/qa.md" ]; then
        echo -e "${GREEN}  ✓ QA Agent available${NC}"
    else
        echo -e "${RED}  ✗ QA Agent not found${NC}"
    fi
    
    # Check for QA framework files
    local qa_framework_files=$(find "$APM_ROOT" -name "*qa-framework*" -type f 2>/dev/null | wc -l)
    echo -e "${GREEN}  ✓ $qa_framework_files QA framework files${NC}"
    
    echo ""
}

# Function to show monitoring commands
show_monitoring_commands() {
    echo -e "${YELLOW}Available Monitoring Commands:${NC}"
    echo -e "${BLUE}  /qa-framework analytics${NC}          - View test analytics"
    echo -e "${BLUE}  /qa-framework test-execute${NC}       - Run comprehensive tests"
    echo -e "${BLUE}  /parallel-qa-framework${NC}           - Parallel test execution"
    echo -e "${BLUE}  /qa-predict${NC}                      - ML test failure prediction"
    echo -e "${BLUE}  /qa-anomaly${NC}                      - Quality anomaly detection"
    echo ""
}

# Function to show quick stats
show_quick_stats() {
    echo -e "${YELLOW}Quick Statistics:${NC}"
    
    local total_test_files=$(find "$PROJECT_ROOT" -name "*test*" -type f 2>/dev/null | wc -l)
    local total_qa_reports=$(find "$QA_REPORTS_DIR" -name "*.md" -o -name "*.json" 2>/dev/null | wc -l)
    local running_processes=$(ps aux | grep -E "(jest|npm.*test|pytest)" | grep -v grep | wc -l)
    
    echo -e "  📁 Test Files: ${GREEN}$total_test_files${NC}"
    echo -e "  📊 QA Reports: ${GREEN}$total_qa_reports${NC}"
    echo -e "  🔄 Running Tests: ${GREEN}$running_processes${NC}"
    echo ""
}

# Main monitoring loop
main_monitor() {
    echo -e "${GREEN}Starting APM Test Monitor...${NC}"
    echo -e "${YELLOW}Press Ctrl+C to stop monitoring${NC}"
    echo ""
    
    while true; do
        show_header
        check_active_tests
        check_recent_test_files
        check_qa_reports
        check_test_coverage
        check_test_logs
        check_apm_qa_framework
        show_quick_stats
        show_monitoring_commands
        
        echo -e "${BLUE}Refreshing in $REFRESH_INTERVAL seconds...${NC}"
        sleep "$REFRESH_INTERVAL"
    done
}

# Function to show help
show_help() {
    echo "APM Framework Test Monitor v{{VERSION}}"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "OPTIONS:"
    echo "  --help, -h         Show this help message"
    echo "  --once, -o         Run once and exit (no continuous monitoring)"
    echo "  --interval, -i N   Set refresh interval in seconds (default: 5)"
    echo "  --reports, -r      Show only QA reports"
    echo "  --processes, -p    Show only running test processes"
    echo ""
    echo "Environment Variables:"
    echo "  APM_TEST_MONITOR_INTERVAL    Refresh interval (default: 5)"
    echo ""
    echo "Examples:"
    echo "  $0                    # Start continuous monitoring"
    echo "  $0 --once            # Run once and exit"
    echo "  $0 --interval 10     # Monitor with 10-second refresh"
    echo ""
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --help|-h)
            show_help
            exit 0
            ;;
        --once|-o)
            ONCE_MODE=true
            shift
            ;;
        --interval|-i)
            REFRESH_INTERVAL="$2"
            shift 2
            ;;
        --reports|-r)
            REPORTS_ONLY=true
            shift
            ;;
        --processes|-p)
            PROCESSES_ONLY=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Validate refresh interval
if ! [[ "$REFRESH_INTERVAL" =~ ^[0-9]+$ ]] || [ "$REFRESH_INTERVAL" -lt 1 ]; then
    echo "Error: Invalid refresh interval. Must be a positive integer."
    exit 1
fi

# Execute based on mode
if [ "$REPORTS_ONLY" = true ]; then
    show_header
    check_qa_reports
elif [ "$PROCESSES_ONLY" = true ]; then
    show_header
    check_active_tests
elif [ "$ONCE_MODE" = true ]; then
    show_header
    check_active_tests
    check_recent_test_files
    check_qa_reports
    check_test_coverage
    check_test_logs
    check_apm_qa_framework
    show_quick_stats
    show_monitoring_commands
else
    main_monitor
fi