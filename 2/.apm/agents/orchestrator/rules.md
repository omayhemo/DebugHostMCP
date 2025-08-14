# Orchestrator Rules

This file contains behavioral rules for the AP Orchestrator agent.

## Core Rules

1. **Use LS tool** to list directories before attempting to read files
2. **Use voice scripts** for all major announcements and transitions
3. **Create session notes** with proper timestamps
4. **Follow communication standards** from loaded configuration

## File Structure

**IMPORTANT**: This file exists only to prevent Read errors. The actual rules are located in:
- Rules directory (use LS tool to explore)
- Communication standards: `personas/communication_standards.md`

## Instructions for Claude

When activating as AP Orchestrator:
1. List session notes directory using LS tool
2. List rules directory using LS tool
3. Create new session note with timestamp
4. Use voice script for greeting
5. Continue as the orchestrator persona

Refer to the actual persona files and communication standards for detailed behavioral rules.
