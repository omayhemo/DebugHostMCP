# Organize Documentation Command

## Command: `/organize-docs`

A comprehensive documentation organization system that ensures all project documentation is properly structured, linked, and accessible.

## Overview

The `/organize-docs` command provides intelligent documentation management capabilities:
- Detects orphaned documents and broken links
- Creates comprehensive cross-references
- Ensures all docs connect to index.md
- Generates visual documentation graphs
- Safely reorganizes documentation structure

## Usage

```bash
/organize-docs [subcommand] [options]
```

## Subcommands

### Analysis Commands

#### `scan`
Performs comprehensive documentation structure analysis.
```bash
/organize-docs scan [--verbose] [--check-links] [--fix]
```
- `--verbose`: Show detailed analysis
- `--check-links`: Validate all internal/external links
- `--fix`: Automatically fix simple issues

#### `validate`
Validates documentation against defined rules and standards.
```bash
/organize-docs validate [--rules <file>] [--strict] [--fix-warnings]
```
- `--rules`: Custom rules file (default: doc-standards.yaml)
- `--strict`: Fail on warnings
- `--fix-warnings`: Auto-fix warning-level issues

#### `graph`
Generates visual representation of documentation relationships.
```bash
/organize-docs graph [--format <type>] [--output <file>] [--depth <n>]
```
- `--format`: Output format (png, svg, dot, mermaid)
- `--output`: Output file path
- `--depth`: Maximum graph depth

#### `orphans`
Finds documents with no incoming links.
```bash
/organize-docs orphans [--suggest-links] [--add-to-index]
```
- `--suggest-links`: Suggest parent documents
- `--add-to-index`: Automatically add to nearest index

### Organization Commands

#### `restructure`
Reorganizes documentation based on specified strategy.
```bash
/organize-docs restructure --strategy <type> [--dry-run] [--backup <dir>]
```
Strategies:
- `topic-based`: Group by subject matter
- `audience-based`: Organize by user type
- `lifecycle-based`: Arrange by document status
- `flat`: Minimize directory depth

#### `link`
Manages document cross-references.
```bash
/organize-docs link [--create-bidirectional] [--fix-broken] [--add-breadcrumbs]
```
- `--create-bidirectional`: Ensure parent↔child links
- `--fix-broken`: Repair broken internal links
- `--add-breadcrumbs`: Add navigation breadcrumbs

#### `index`
Creates or updates documentation indexes.
```bash
/organize-docs index [--create-missing] [--update-all] [--template <file>]
```
- `--create-missing`: Generate missing index files
- `--update-all`: Refresh all existing indexes
- `--template`: Custom index template

#### `migrate`
Migrates documentation between formats or structures.
```bash
/organize-docs migrate --from <format> --to <format> [--preserve-history]
```
- Supports: markdown, restructuredtext, asciidoc
- `--preserve-history`: Keep git history

### Report Commands

#### `summary`
Generates comprehensive documentation summary.
```bash
/organize-docs summary [--format <type>] [--export <file>]
```
- `--format`: Output format (markdown, json, html)
- `--export`: Save report to file

#### `health`
Performs documentation health check.
```bash
/organize-docs health [--score] [--fix-critical] [--mode <type>]
```
- `--score`: Show numeric health score
- `--fix-critical`: Auto-fix critical issues
- `--mode`: Check mode (quick, standard, thorough)

#### `recommendations`
Provides AI-powered improvement suggestions.
```bash
/organize-docs recommendations [--limit <n>] [--effort <level>]
```
- `--limit`: Maximum recommendations
- `--effort`: Filter by effort (quick-wins, moderate, major)

## Configuration

Configuration file location: `/mnt/c/Code/MCPServers/DebugHostMCP/.apm/config/organize-docs.yaml`

```yaml
organize_docs:
  paths:
    project_docs: "./project_docs"
    index_file: "index.md"
    ignore_patterns:
      - "*.tmp"
      - ".draft*"
      - "archive/**"
  
  rules:
    enforce_index_connectivity: true
    max_orphan_percentage: 0
    require_bidirectional_links: true
    
  automation:
    weekly_health_check: true
    auto_fix_broken_links: true
    generate_missing_indexes: true
```

## Examples

### Quick Documentation Health Check
```bash
/organize-docs health --score
```

### Find and Fix Common Issues
```bash
/organize-docs scan --check-links --fix
/organize-docs orphans --add-to-index
```

### Weekly Maintenance Workflow
```bash
/organize-docs health --mode batch --fix-critical
/organize-docs orphans --suggest-links
/organize-docs summary --export weekly-report.md
```

### Major Documentation Reorganization
```bash
# Preview changes
/organize-docs restructure --strategy topic-based --dry-run

# Create backup and apply
/organize-docs restructure --strategy topic-based --backup ./doc-backup

# Validate results
/organize-docs validate --strict
/organize-docs graph --format png --output new-structure.png
```

## Integration with APM

This command integrates seamlessly with the APM Analyst persona:
- Automatically activates for complex analysis tasks
- Uses APM voice notifications for status updates
- Can generate tasks for PM handoff
- Leverages parallel processing for large documentation sets

## Best Practices

1. **Run weekly health checks** to maintain documentation quality
2. **Always use --dry-run** before major reorganizations
3. **Create backups** before structural changes
4. **Review AI recommendations** before applying
5. **Maintain index.md** as your documentation hub
6. **Use relative links** for portability
7. **Document your organization strategy** in the config

## Troubleshooting

### Common Issues

**"Too many orphaned documents"**
- Run `/organize-docs orphans --suggest-links` to get recommendations
- Use `/organize-docs index --create-missing` to generate indexes

**"Broken links detected"**
- Run `/organize-docs link --fix-broken` for automatic fixes
- Check `/organize-docs scan --verbose` for detailed issues

**"Documentation structure unclear"**
- Generate a graph: `/organize-docs graph --format png`
- Review recommendations: `/organize-docs recommendations`

## Related Commands

- `/parallel-requirements` - Gather requirements for documentation
- `/generate-index` - Create specific index pages
- `/validate-links` - Quick link validation