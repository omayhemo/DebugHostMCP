#!/bin/bash

# AP Mapping Integrity Checker
# Verifies installation integrity, file checksums, and dependencies

set -e

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPT_NAME="$(basename "${BASH_SOURCE[0]}")"

# Source logging framework
source "$SCRIPT_DIR/logging-framework.sh"

# Initialize logging
init_logging "INTEGRITY" 

# Integrity checker configuration
CHECKER_VERSION="1.0.0"
PROJECT_ROOT=""
MANIFEST_FILE=""
CHECKSUM_ALGORITHM="sha256"
VERIFICATION_REPORT=""
ERRORS_FOUND=0
WARNINGS_FOUND=0
FILES_VERIFIED=0
FILES_MISSING=0
FILES_MODIFIED=0

# Checksum cache for performance
declare -A CHECKSUM_CACHE

# Initialize integrity checker
init_integrity_checker() {
    local project_root="${1:-$PWD}"
    local manifest_file="${2:-}"
    
    log_info "Initializing integrity checker v$CHECKER_VERSION" "INIT"
    start_timer "integrity_init"
    
    PROJECT_ROOT="$project_root"
    
    # Determine manifest file location
    if [ -n "$manifest_file" ]; then
        MANIFEST_FILE="$manifest_file"
    else
        # Look for latest manifest
        MANIFEST_FILE=$(find "$PROJECT_ROOT" -name "installation-manifest-*.json" -type f 2>/dev/null | sort -r | head -1)
        
        if [ -z "$MANIFEST_FILE" ]; then
            MANIFEST_FILE="$PROJECT_ROOT/.ap-install/manifest.json"
        fi
    fi
    
    log_debug "Project root: $PROJECT_ROOT" "INIT"
    log_debug "Manifest file: $MANIFEST_FILE" "INIT"
    
    # Initialize verification report
    VERIFICATION_REPORT="$PROJECT_ROOT/integrity-report-$(date +%Y%m%d-%H%M%S).txt"
    
    stop_timer "integrity_init"
    return 0
}

# Calculate file checksum
calculate_checksum() {
    local file_path="$1"
    local algorithm="${2:-$CHECKSUM_ALGORITHM}"
    
    log_trace "Calculating $algorithm checksum for: $file_path" "CHECKSUM"
    
    # Check cache first
    local cache_key="${file_path}:${algorithm}"
    if [ -n "${CHECKSUM_CACHE[$cache_key]}" ]; then
        echo "${CHECKSUM_CACHE[$cache_key]}"
        return 0
    fi
    
    local checksum=""
    
    if [ ! -f "$file_path" ]; then
        log_trace "File not found for checksum: $file_path" "CHECKSUM"
        echo "FILE_NOT_FOUND"
        return 1
    fi
    
    # Calculate checksum based on algorithm
    case "$algorithm" in
        sha256)
            if command -v sha256sum >/dev/null 2>&1; then
                checksum=$(sha256sum "$file_path" 2>/dev/null | awk '{print $1}')
            elif command -v shasum >/dev/null 2>&1; then
                checksum=$(shasum -a 256 "$file_path" 2>/dev/null | awk '{print $1}')
            else
                # Fallback to Python
                checksum=$(python3 -c "
import hashlib
with open('$file_path', 'rb') as f:
    print(hashlib.sha256(f.read()).hexdigest())
" 2>/dev/null)
            fi
            ;;
        md5)
            if command -v md5sum >/dev/null 2>&1; then
                checksum=$(md5sum "$file_path" 2>/dev/null | awk '{print $1}')
            elif command -v md5 >/dev/null 2>&1; then
                checksum=$(md5 -q "$file_path" 2>/dev/null)
            else
                # Fallback to Python
                checksum=$(python3 -c "
import hashlib
with open('$file_path', 'rb') as f:
    print(hashlib.md5(f.read()).hexdigest())
" 2>/dev/null)
            fi
            ;;
        *)
            log_error "Unsupported checksum algorithm: $algorithm" "CHECKSUM"
            return 1
            ;;
    esac
    
    if [ -n "$checksum" ]; then
        # Cache the result
        CHECKSUM_CACHE[$cache_key]="$checksum"
        echo "$checksum"
        return 0
    else
        log_error "Failed to calculate checksum for: $file_path" "CHECKSUM"
        return 1
    fi
}

# Calculate checksums for directory
calculate_directory_checksums() {
    local directory="$1"
    local output_file="${2:-}"
    local exclude_patterns="${3:-}"
    
    log_info "Calculating checksums for directory: $directory" "DIR-CHECKSUM"
    start_timer "dir_checksums"
    
    local checksums_data=""
    local file_count=0
    
    # Build find command with exclusions
    local find_cmd="find \"$directory\" -type f"
    
    # Add standard exclusions
    find_cmd+=" -not -path '*/\\.git/*'"
    find_cmd+=" -not -path '*/\\.ap-backup/*'"
    find_cmd+=" -not -path '*/node_modules/*'"
    find_cmd+=" -not -path '*/__pycache__/*'"
    find_cmd+=" -not -name '*.pyc'"
    find_cmd+=" -not -name '*.log'"
    find_cmd+=" -not -name '*.tmp'"
    
    # Add custom exclusions
    if [ -n "$exclude_patterns" ]; then
        while IFS= read -r pattern; do
            find_cmd+=" -not -path '$pattern'"
        done <<< "$exclude_patterns"
    fi
    
    # Calculate checksums
    while IFS= read -r file; do
        local relative_path="${file#$directory/}"
        local checksum=$(calculate_checksum "$file")
        
        if [ "$checksum" != "FILE_NOT_FOUND" ] && [ -n "$checksum" ]; then
            checksums_data+="${checksum}  ${relative_path}"$'\n'
            ((file_count++))
            
            # Show progress every 100 files
            if [ $((file_count % 100)) -eq 0 ]; then
                log_debug "Processed $file_count files..." "DIR-CHECKSUM"
            fi
        fi
    done < <(eval "$find_cmd" | sort)
    
    # Save to file if specified
    if [ -n "$output_file" ]; then
        echo -n "$checksums_data" > "$output_file"
        log_info "Checksums saved to: $output_file" "DIR-CHECKSUM"
    fi
    
    stop_timer "dir_checksums"
    log_info "Calculated checksums for $file_count files" "DIR-CHECKSUM"
    
    echo -n "$checksums_data"
    return 0
}

# Verify file against expected checksum
verify_file_checksum() {
    local file_path="$1"
    local expected_checksum="$2"
    local algorithm="${3:-$CHECKSUM_ALGORITHM}"
    
    log_trace "Verifying checksum for: $file_path" "VERIFY-FILE"
    
    if [ ! -f "$file_path" ]; then
        log_error "File missing: $file_path" "VERIFY-FILE"
        ((FILES_MISSING++))
        return 1
    fi
    
    local actual_checksum=$(calculate_checksum "$file_path" "$algorithm")
    
    if [ "$actual_checksum" = "$expected_checksum" ]; then
        log_trace "Checksum verified: $file_path" "VERIFY-FILE"
        ((FILES_VERIFIED++))
        return 0
    else
        log_warn "Checksum mismatch for: $file_path" "VERIFY-FILE"
        log_debug "Expected: $expected_checksum" "VERIFY-FILE"
        log_debug "Actual: $actual_checksum" "VERIFY-FILE"
        ((FILES_MODIFIED++))
        return 1
    fi
}

# Verify against manifest
verify_manifest() {
    local manifest_file="${1:-$MANIFEST_FILE}"
    
    log_info "Verifying installation against manifest: $manifest_file" "VERIFY-MANIFEST"
    start_timer "verify_manifest"
    
    if [ ! -f "$manifest_file" ]; then
        log_error "Manifest file not found: $manifest_file" "VERIFY-MANIFEST"
        ((ERRORS_FOUND++))
        stop_timer "verify_manifest"
        return 1
    fi
    
    # Reset counters
    FILES_VERIFIED=0
    FILES_MISSING=0
    FILES_MODIFIED=0
    
    # Start verification report
    {
        echo "Integrity Verification Report"
        echo "============================"
        echo "Date: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
        echo "Manifest: $manifest_file"
        echo "Project: $PROJECT_ROOT"
        echo ""
        echo "Verification Results:"
        echo "-------------------"
    } > "$VERIFICATION_REPORT"
    
    # Parse manifest and verify files
    if command -v jq >/dev/null 2>&1; then
        # Use jq for JSON parsing
        while IFS= read -r entry; do
            local file_path=$(echo "$entry" | jq -r '.path')
            local checksum=$(echo "$entry" | jq -r '.checksum')
            local full_path="$PROJECT_ROOT/$file_path"
            
            if verify_file_checksum "$full_path" "$checksum"; then
                echo "✓ $file_path" >> "$VERIFICATION_REPORT"
            else
                if [ -f "$full_path" ]; then
                    echo "✗ $file_path (modified)" >> "$VERIFICATION_REPORT"
                    ((WARNINGS_FOUND++))
                else
                    echo "✗ $file_path (missing)" >> "$VERIFICATION_REPORT"
                    ((ERRORS_FOUND++))
                fi
            fi
        done < <(jq -c '.files[]' "$manifest_file" 2>/dev/null)
    else
        # Fallback to Python for JSON parsing
        python3 -c "
import json
with open('$manifest_file') as f:
    data = json.load(f)
    for file_entry in data.get('files', []):
        print(f\"{file_entry['path']}|{file_entry['checksum']}\")
" | while IFS='|' read -r file_path checksum; do
            local full_path="$PROJECT_ROOT/$file_path"
            
            if verify_file_checksum "$full_path" "$checksum"; then
                echo "✓ $file_path" >> "$VERIFICATION_REPORT"
            else
                if [ -f "$full_path" ]; then
                    echo "✗ $file_path (modified)" >> "$VERIFICATION_REPORT"
                    ((WARNINGS_FOUND++))
                else
                    echo "✗ $file_path (missing)" >> "$VERIFICATION_REPORT"
                    ((ERRORS_FOUND++))
                fi
            fi
        done
    fi
    
    # Add summary to report
    {
        echo ""
        echo "Summary:"
        echo "--------"
        echo "Files verified: $FILES_VERIFIED"
        echo "Files modified: $FILES_MODIFIED"
        echo "Files missing: $FILES_MISSING"
        echo "Total errors: $ERRORS_FOUND"
        echo "Total warnings: $WARNINGS_FOUND"
    } >> "$VERIFICATION_REPORT"
    
    stop_timer "verify_manifest"
    
    log_info "Verification complete: $FILES_VERIFIED verified, $FILES_MODIFIED modified, $FILES_MISSING missing" "VERIFY-MANIFEST"
    
    if [ $ERRORS_FOUND -gt 0 ]; then
        return 1
    else
        return 0
    fi
}

# Check system dependencies
check_dependencies() {
    log_info "Checking system dependencies" "DEPENDENCIES"
    start_timer "check_dependencies"
    
    local dep_errors=0
    local dep_warnings=0
    
    {
        echo ""
        echo "Dependency Check:"
        echo "----------------"
    } >> "$VERIFICATION_REPORT"
    
    # Required dependencies
    local required_deps=(
        "bash:4.0:Bash shell"
        "python3:3.6:Python interpreter"
        "sed::Stream editor"
        "grep::Pattern search"
        "find::File search"
    )
    
    for dep_spec in "${required_deps[@]}"; do
        IFS=':' read -r cmd min_version desc <<< "$dep_spec"
        
        if command -v "$cmd" >/dev/null 2>&1; then
            local version=""
            
            # Get version if needed
            case "$cmd" in
                bash)
                    version="${BASH_VERSION%%[^0-9.]*}"
                    ;;
                python3)
                    version=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
                    ;;
            esac
            
            # Check version if specified
            if [ -n "$min_version" ] && [ -n "$version" ]; then
                if version_compare "$version" "$min_version" "<"; then
                    echo "✗ $desc: v$version (requires >= v$min_version)" >> "$VERIFICATION_REPORT"
                    log_error "$desc version too old: $version < $min_version" "DEPENDENCIES"
                    ((dep_errors++))
                    ((ERRORS_FOUND++))
                else
                    echo "✓ $desc: v$version" >> "$VERIFICATION_REPORT"
                    log_info "$desc: v$version OK" "DEPENDENCIES"
                fi
            else
                echo "✓ $desc: found" >> "$VERIFICATION_REPORT"
                log_info "$desc: found" "DEPENDENCIES"
            fi
        else
            echo "✗ $desc: not found (REQUIRED)" >> "$VERIFICATION_REPORT"
            log_error "$desc not found" "DEPENDENCIES"
            ((dep_errors++))
            ((ERRORS_FOUND++))
        fi
    done
    
    # Optional dependencies
    local optional_deps=(
        "git::Version control"
        "jq::JSON processor"
        "tree::Directory tree"
        "curl::HTTP client"
    )
    
    {
        echo ""
        echo "Optional Dependencies:"
    } >> "$VERIFICATION_REPORT"
    
    for dep_spec in "${optional_deps[@]}"; do
        IFS=':' read -r cmd min_version desc <<< "$dep_spec"
        
        if command -v "$cmd" >/dev/null 2>&1; then
            echo "✓ $desc: found" >> "$VERIFICATION_REPORT"
            log_info "$desc: found" "DEPENDENCIES"
        else
            echo "⚠ $desc: not found (optional)" >> "$VERIFICATION_REPORT"
            log_warn "$desc not found (optional)" "DEPENDENCIES"
            ((dep_warnings++))
            ((WARNINGS_FOUND++))
        fi
    done
    
    stop_timer "check_dependencies"
    
    log_info "Dependency check complete: $dep_errors errors, $dep_warnings warnings" "DEPENDENCIES"
    
    if [ $dep_errors -gt 0 ]; then
        return 1
    else
        return 0
    fi
}

# Validate configuration files
validate_configuration() {
    log_info "Validating configuration files" "CONFIG"
    start_timer "validate_config"
    
    local config_errors=0
    
    {
        echo ""
        echo "Configuration Validation:"
        echo "-----------------------"
    } >> "$VERIFICATION_REPORT"
    
    # Check settings.json
    local settings_file="$PROJECT_ROOT/.claude/settings.json"
    
    if [ -f "$settings_file" ]; then
        log_debug "Validating settings.json" "CONFIG"
        
        # Check JSON syntax
        if jq empty "$settings_file" 2>/dev/null || python3 -m json.tool "$settings_file" >/dev/null 2>&1; then
            echo "✓ settings.json: valid JSON" >> "$VERIFICATION_REPORT"
            
            # Check required fields
            local required_fields=("PROJECT_NAME" "PROJECT_ROOT" "AP_ROOT")
            
            for field in "${required_fields[@]}"; do
                local value=$(jq -r ".$field // empty" "$settings_file" 2>/dev/null || python3 -c "
import json
with open('$settings_file') as f:
    data = json.load(f)
    print(data.get('$field', ''))
" 2>/dev/null)
                
                if [ -n "$value" ]; then
                    echo "✓ $field: configured" >> "$VERIFICATION_REPORT"
                else
                    echo "✗ $field: missing" >> "$VERIFICATION_REPORT"
                    log_error "Required field missing: $field" "CONFIG"
                    ((config_errors++))
                    ((ERRORS_FOUND++))
                fi
            done
        else
            echo "✗ settings.json: invalid JSON syntax" >> "$VERIFICATION_REPORT"
            log_error "Invalid JSON in settings.json" "CONFIG"
            ((config_errors++))
            ((ERRORS_FOUND++))
        fi
    else
        echo "✗ settings.json: not found" >> "$VERIFICATION_REPORT"
        log_error "Settings file not found" "CONFIG"
        ((config_errors++))
        ((ERRORS_FOUND++))
    fi
    
    # Check variables.json
    local vars_file="$SCRIPT_DIR/variables.json"
    
    if [ -f "$vars_file" ]; then
        if jq empty "$vars_file" 2>/dev/null || python3 -m json.tool "$vars_file" >/dev/null 2>&1; then
            echo "✓ variables.json: valid JSON" >> "$VERIFICATION_REPORT"
        else
            echo "✗ variables.json: invalid JSON syntax" >> "$VERIFICATION_REPORT"
            log_error "Invalid JSON in variables.json" "CONFIG"
            ((config_errors++))
            ((ERRORS_FOUND++))
        fi
    fi
    
    stop_timer "validate_config"
    
    log_info "Configuration validation complete: $config_errors errors" "CONFIG"
    
    if [ $config_errors -gt 0 ]; then
        return 1
    else
        return 0
    fi
}

# Verify installation completeness
verify_installation() {
    log_info "Verifying installation completeness" "INSTALL-VERIFY"
    start_timer "verify_installation"
    
    {
        echo ""
        echo "Installation Completeness:"
        echo "------------------------"
    } >> "$VERIFICATION_REPORT"
    
    # Check critical directories
    local critical_dirs=(
        ".claude:Claude configuration directory"
        ".claude/commands:Commands directory"
        "docs:Documentation directory"
    )
    
    for dir_spec in "${critical_dirs[@]}"; do
        IFS=':' read -r dir_path desc <<< "$dir_spec"
        local full_path="$PROJECT_ROOT/$dir_path"
        
        if [ -d "$full_path" ]; then
            echo "✓ $desc exists" >> "$VERIFICATION_REPORT"
            log_info "$desc exists" "INSTALL-VERIFY"
        else
            echo "✗ $desc missing" >> "$VERIFICATION_REPORT"
            log_error "$desc missing: $full_path" "INSTALL-VERIFY"
            ((ERRORS_FOUND++))
        fi
    done
    
    # Check critical files
    local critical_files=(
        ".claude/settings.json:Settings file"
        "README.md:Project README"
    )
    
    for file_spec in "${critical_files[@]}"; do
        IFS=':' read -r file_path desc <<< "$file_spec"
        local full_path="$PROJECT_ROOT/$file_path"
        
        if [ -f "$full_path" ]; then
            echo "✓ $desc exists" >> "$VERIFICATION_REPORT"
            log_info "$desc exists" "INSTALL-VERIFY"
        else
            echo "⚠ $desc missing" >> "$VERIFICATION_REPORT"
            log_warn "$desc missing: $full_path" "INSTALL-VERIFY"
            ((WARNINGS_FOUND++))
        fi
    done
    
    stop_timer "verify_installation"
    
    log_info "Installation verification complete" "INSTALL-VERIFY"
    return 0
}

# Version comparison helper
version_compare() {
    local version1="$1"
    local version2="$2"
    local operator="$3"
    
    # Convert versions to comparable format
    local v1_parts=(${version1//./ })
    local v2_parts=(${version2//./ })
    
    # Pad with zeros
    while [ ${#v1_parts[@]} -lt ${#v2_parts[@]} ]; do
        v1_parts+=(0)
    done
    
    while [ ${#v2_parts[@]} -lt ${#v1_parts[@]} ]; do
        v2_parts+=(0)
    done
    
    # Compare each part
    for i in "${!v1_parts[@]}"; do
        if [ "${v1_parts[$i]}" -lt "${v2_parts[$i]}" ]; then
            [ "$operator" = "<" ] || [ "$operator" = "<=" ] || [ "$operator" = "!=" ]
            return $?
        elif [ "${v1_parts[$i]}" -gt "${v2_parts[$i]}" ]; then
            [ "$operator" = ">" ] || [ "$operator" = ">=" ] || [ "$operator" = "!=" ]
            return $?
        fi
    done
    
    # Versions are equal
    [ "$operator" = "=" ] || [ "$operator" = "<=" ] || [ "$operator" = ">=" ]
    return $?
}

# Generate repair suggestions
generate_repair_suggestions() {
    log_info "Generating repair suggestions" "REPAIR"
    
    {
        echo ""
        echo "Repair Suggestions:"
        echo "------------------"
        
        if [ $FILES_MISSING -gt 0 ]; then
            echo ""
            echo "Missing Files:"
            echo "- Re-run the installer to restore missing files"
            echo "- Check backup directory for previous versions"
            echo "- Use --rollback option if available"
        fi
        
        if [ $FILES_MODIFIED -gt 0 ]; then
            echo ""
            echo "Modified Files:"
            echo "- Review modifications to ensure they are intentional"
            echo "- Use 'git diff' if under version control"
            echo "- Consider regenerating from templates if needed"
        fi
        
        if [ $ERRORS_FOUND -gt 0 ]; then
            echo ""
            echo "Configuration Errors:"
            echo "- Check JSON syntax in configuration files"
            echo "- Ensure all required fields are present"
            echo "- Run variable manager to reconfigure"
        fi
        
        echo ""
        echo "To attempt automatic repair:"
        echo "  ./install-enhanced.sh --repair"
        echo ""
        echo "To verify specific components:"
        echo "  ./integrity-checker.sh --check-deps     # Dependencies only"
        echo "  ./integrity-checker.sh --check-config   # Configuration only"
        echo "  ./integrity-checker.sh --check-files    # Files only"
        
    } >> "$VERIFICATION_REPORT"
}

# Perform complete integrity check
perform_complete_check() {
    log_info "Performing complete integrity check" "COMPLETE-CHECK"
    start_timer "complete_check"
    
    # Reset global counters
    ERRORS_FOUND=0
    WARNINGS_FOUND=0
    
    echo "AP Mapping Integrity Check v$CHECKER_VERSION" > "$VERIFICATION_REPORT"
    echo "=========================================" >> "$VERIFICATION_REPORT"
    
    # Run all checks
    check_dependencies
    validate_configuration
    
    if [ -f "$MANIFEST_FILE" ]; then
        verify_manifest
    else
        log_warn "No manifest file found, skipping file verification" "COMPLETE-CHECK"
        echo "" >> "$VERIFICATION_REPORT"
        echo "File Verification: SKIPPED (no manifest)" >> "$VERIFICATION_REPORT"
    fi
    
    verify_installation
    
    # Generate suggestions if issues found
    if [ $ERRORS_FOUND -gt 0 ] || [ $WARNINGS_FOUND -gt 0 ]; then
        generate_repair_suggestions
    fi
    
    # Final summary
    {
        echo ""
        echo "========================================="
        echo "Final Status: $([ $ERRORS_FOUND -eq 0 ] && echo "PASSED" || echo "FAILED")"
        echo "Total Errors: $ERRORS_FOUND"
        echo "Total Warnings: $WARNINGS_FOUND"
        echo ""
        echo "Full report saved to: $VERIFICATION_REPORT"
    } >> "$VERIFICATION_REPORT"
    
    stop_timer "complete_check"
    
    # Display summary
    cat "$VERIFICATION_REPORT"
    
    if [ $ERRORS_FOUND -gt 0 ]; then
        return 1
    else
        return 0
    fi
}

# Create checksums for new installation
create_installation_checksums() {
    local install_dir="$1"
    local output_file="${2:-$install_dir/.ap-install/checksums.txt}"
    
    log_info "Creating installation checksums" "CREATE-CHECKSUMS"
    start_timer "create_checksums"
    
    # Ensure output directory exists
    mkdir -p "$(dirname "$output_file")"
    
    # Calculate checksums
    calculate_directory_checksums "$install_dir" "$output_file"
    
    stop_timer "create_checksums"
    
    log_info "Checksums created: $output_file" "CREATE-CHECKSUMS"
    return 0
}

# Export functions
export -f init_integrity_checker
export -f calculate_checksum
export -f calculate_directory_checksums
export -f verify_file_checksum
export -f verify_manifest
export -f check_dependencies
export -f validate_configuration
export -f verify_installation
export -f perform_complete_check
export -f create_installation_checksums

# Main execution (if run directly)
if [ "${BASH_SOURCE[0]}" == "${0}" ]; then
    # Parse command line arguments
    PROJECT_ROOT=""
    MANIFEST_FILE=""
    CHECK_TYPE="complete"
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --project-root)
                PROJECT_ROOT="$2"
                shift 2
                ;;
            --manifest)
                MANIFEST_FILE="$2"
                shift 2
                ;;
            --check-deps)
                CHECK_TYPE="deps"
                shift
                ;;
            --check-config)
                CHECK_TYPE="config"
                shift
                ;;
            --check-files)
                CHECK_TYPE="files"
                shift
                ;;
            --create-checksums)
                CHECK_TYPE="create"
                shift
                ;;
            -h|--help)
                echo "Usage: $0 [OPTIONS]"
                echo ""
                echo "Options:"
                echo "  --project-root DIR   Project root directory (default: current)"
                echo "  --manifest FILE      Manifest file to verify against"
                echo "  --check-deps         Check dependencies only"
                echo "  --check-config       Check configuration only"
                echo "  --check-files        Check files only"
                echo "  --create-checksums   Create checksums for installation"
                echo "  -h, --help          Show this help"
                exit 0
                ;;
            *)
                echo "Unknown option: $1"
                exit 1
                ;;
        esac
    done
    
    # Set defaults
    PROJECT_ROOT="${PROJECT_ROOT:-$PWD}"
    
    # Initialize
    init_integrity_checker "$PROJECT_ROOT" "$MANIFEST_FILE"
    
    # Perform requested check
    case "$CHECK_TYPE" in
        deps)
            check_dependencies
            ;;
        config)
            validate_configuration
            ;;
        files)
            if [ -n "$MANIFEST_FILE" ]; then
                verify_manifest
            else
                echo "Error: No manifest file specified"
                exit 1
            fi
            ;;
        create)
            create_installation_checksums "$PROJECT_ROOT"
            ;;
        complete)
            perform_complete_check
            ;;
    esac
fi