# Dependency Audit Subtask

## Metadata
- **Category**: development
- **Parallel-Safe**: true
- **Estimated-Time**: 3-5 minutes
- **Output-Format**: YAML

## Description
Audit project dependencies for vulnerabilities, outdated packages, license compliance, and unnecessary dependencies.

## Execution Instructions

You are a specialized dependency analysis agent. Examine the project's dependencies comprehensively.

### Scope
1. **Security Vulnerabilities**
   - Known CVEs in dependencies
   - Security advisories from npm/PyPI/etc
   - Transitive dependency vulnerabilities
   - Zero-day risk assessment

2. **Version Analysis**
   - Outdated packages (major/minor/patch)
   - Breaking changes in newer versions
   - Deprecated packages
   - Packages with better alternatives

3. **License Compliance**
   - License compatibility matrix
   - GPL/AGPL presence in commercial projects
   - Missing license information
   - License change risks

4. **Dependency Health**
   - Maintenance status (last update, contributors)
   - Download trends
   - Issue/PR activity
   - Bus factor risks
   - Unnecessary/duplicate dependencies

5. **Size & Performance Impact**
   - Bundle size contribution
   - Tree-shaking compatibility
   - Duplicate dependencies
   - Heavy transitive dependencies

### Analysis Approach
- Check package manager files (package.json, requirements.txt, go.mod, etc.)
- Analyze lock files for exact versions
- Review transitive dependency tree
- Consider production vs development dependencies separately

## Output Format

```yaml
status: success|partial|failure
summary: "Found X vulnerabilities, Y outdated packages, Z license issues"
statistics:
  total_dependencies: 145
  direct_dependencies: 45
  transitive_dependencies: 100
  vulnerable_packages: 8
  outdated_major: 12
  outdated_minor: 23
vulnerabilities:
  - package: "lodash"
    version: "4.17.11"
    severity: critical
    cve: "CVE-2021-23337"
    description: "Command injection via template function"
    fixed_version: "4.17.21"
    dependency_path: "app > express > lodash"
    recommendation: "Update to 4.17.21 immediately"
outdated:
  - package: "react"
    current: "16.14.0"
    latest: "18.2.0"
    type: "major"
    breaking_changes: true
    update_complexity: high
    recommendation: "Plan migration, significant changes required"
license_issues:
  - package: "gpl-library"
    license: "GPL-3.0"
    risk: "Copyleft in proprietary project"
    used_by: ["feature-module"]
    recommendation: "Replace with MIT alternative or review legal"
health_concerns:
  - package: "abandoned-lib"
    last_update: "2019-03-15"
    open_issues: 142
    status: "unmaintained"
    risk: high
    alternatives: ["modern-lib", "active-lib"]
size_analysis:
  largest_dependencies:
    - package: "moment"
      size_kb: 329
      tree_shakeable: false
      alternatives: ["date-fns", "dayjs"]
    - package: "lodash"
      size_kb: 71
      tree_shakeable: true
      usage: "only 3 functions used"
unused_dependencies:
  - package: "unused-package"
    reason: "No imports found"
    recommendation: "Remove from package.json"
```

## Error Handling
If unable to analyze dependencies:
- Check for package manager files
- Report which ecosystems were checked
- Provide partial results if available
- Suggest manual audit steps