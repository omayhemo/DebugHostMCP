# Create Next Story Task

> **Note: Story validation and prerequisite checking are now automated by Claude Code hooks.** The hooks automatically validate story sequences, check prerequisites, and ensure proper formatting. This task now focuses on story content creation while automation handles validation.

## Automated Support
This task benefits from automated:
- ✅ Story sequence validation
- ✅ Prerequisite checking
- ✅ Epic alignment verification
- ✅ Format compliance validation
- ✅ Automatic handoff generation
- ✅ Story draft checklist validation

## Purpose

To identify the next logical story based on project progress and epic definitions, and then to prepare a comprehensive, self-contained, and actionable story file using the `Story Template`. This task ensures the story is enriched with all necessary technical context, requirements, and acceptance criteria, making it ready for efficient implementation by a Developer Agent with minimal need for additional research.

## Inputs for this Task

- Access to the project's documentation repository, specifically:
  - `/mnt/c/Code/MCPServers/DebugHostMCP/project_docs/index.md` (hereafter "Index Doc")
  - `/mnt/c/Code/MCPServers/DebugHostMCP/project_docs/epics/epic-orchestration-guid.md` To Fully understand the epic structure and story identification process.
  - All Epic files (e.g., `/mnt/c/Code/MCPServers/DebugHostMCP/project_docs/epics/epic-{n}.md` - hereafter "Epic Files")
  - Existing story files in `/mnt/c/Code/MCPServers/DebugHostMCP/project_docs/stories/`
  - Main PRD (hereafter "PRD Doc")
  - Main Architecture Document (hereafter "Main Arch Doc")
  - Frontend Architecture Document (hereafter "Frontend Arch Doc," if relevant)
  - Project Structure Guide (`/mnt/c/Code/MCPServers/DebugHostMCP/project_docs/base/project_structure.md`)
  - Operational Guidelines Document (`/mnt/c/Code/MCPServers/DebugHostMCP/project_docs/base/development_workflow.md`)
  - Technology Stack Document (`/mnt/c/Code/MCPServers/DebugHostMCP/project_docs/base/tech_stack.md`)
  - Data Models Document (as referenced in Index Doc)
  - API Reference Document (as referenced in Index Doc)
  - UI/UX Specifications, Style Guides, Component Guides (if relevant, as referenced in Index Doc)
- The `/story-tmpl.md` (hereafter "Story Template")
- The `/story-draft-checklist.md` (hereafter "Story Draft Checklist")
- User confirmation to proceed with story identification and, if needed, to override warnings about incomplete prerequisite stories.

## Task Execution Instructions

### 1. Identify Next Story for Preparation (Automated)

**The task-pre-hook automatically:**
- Scans `/mnt/c/Code/MCPServers/DebugHostMCP/project_docs/stories/` for the highest-numbered story
- Validates previous story completion status
- Checks epic files for the next story in sequence
- Verifies all prerequisites are met
- Alerts you to any blocking issues

**If automation detects issues:**
- You'll see warnings in the console (e.g., "Previous story incomplete" or "Prerequisites not met")
- Discuss with the user whether to proceed
- The user can choose to override and continue

**If all validations pass:**
- The system announces: "Identified next story for preparation: {epicNum}.{storyNum} - {Story Title}"
- Proceed directly to gathering requirements

**Manual fallback (if needed):**
- Use the traditional sequence checking only if hooks are disabled
- Follow epic orchestration guide for complex scenarios

### 2. Gather Core Story Requirements (from Epic File)

- For the identified story, open its parent Epic File.
- Extract: Exact Title, full Goal/User Story statement, initial list of Requirements, all Acceptance Criteria (ACs), and any predefined high-level Tasks.
- Keep a record of this original epic-defined scope for later deviation analysis.

### 3. Gather & Synthesize In-Depth Technical Context for Dev Agent

- <critical_rule>Systematically use the Index Doc (`/mnt/c/Code/MCPServers/DebugHostMCP/project_docs/index.md`) as your primary guide to discover paths to ALL detailed documentation relevant to the current story's implementation needs.</critical_rule>
- Thoroughly review the PRD Doc, Main Arch Doc, and Frontend Arch Doc (if a UI story).
- Guided by the Index Doc and the story's needs, locate, analyze, and synthesize specific, relevant information from sources such as:
  - Data Models Doc (structure, validation rules).
  - API Reference Doc (endpoints, request/response schemas, auth).
  - Applicable architectural patterns or component designs from Arch Docs.
  - UI/UX Specs, Style Guides, Component Guides (for UI stories).
  - Specifics from Tech Stack Doc if versions or configurations are key for this story.
  - Relevant sections of the Operational Guidelines Doc (e.g., story-specific error handling nuances, security considerations for data handled in this story).
- The goal is to collect all necessary details the Dev Agent would need, to avoid them having to search extensively. Note any discrepancies between the epic and these details for "Deviation Analysis."

### 4. Verify Project Structure Alignment

- Cross-reference the story's requirements and anticipated file manipulations with the Project Structure Guide (and frontend structure if applicable).
- Ensure any file paths, component locations, or module names implied by the story align with defined structures.
- Document any structural conflicts, necessary clarifications, or undefined components/paths in a "Project Structure Notes" section within the story draft.

### 5. Populate Story Template with Full Context

## 📁 FILE OUTPUT REQUIREMENTS
- **Primary Location**: `/mnt/c/Code/MCPServers/DebugHostMCP/project_docs/stories/`
- **Secondary Location**: `/mnt/c/Code/MCPServers/DebugHostMCP/project_docs/stories/archive/`
- **Naming Convention**: `{epicNum}.{storyNum}.story.md`
- **Supporting Files**: All story-related documentation in same directory

## 🚨 CRITICAL PATH VALIDATION
Before any file operation:
1. Verify path starts with `/mnt/c/Code/MCPServers/DebugHostMCP/project_docs/stories/` or `/mnt/c/Code/MCPServers/DebugHostMCP/project_docs/stories/archive/`
2. Verify path does NOT target root directory or APM infrastructure
3. Focus ONLY on project deliverables, never APM infrastructure

- Create a new story file: `/mnt/c/Code/MCPServers/DebugHostMCP/project_docs/stories/{epicNum}.{storyNum}.story.md`.
- Use the Story Template to structure the file.
- Fill in:
  - Story `{EpicNum}.{StoryNum}: {Short Title Copied from Epic File}`
  - `Status: Draft`
  - `Story` (User Story statement from Epic)
  - `Acceptance Criteria (ACs)` (from Epic, to be refined if needed based on context)
- **`Dev Technical Guidance` section (CRITICAL):**
  - Based on all context gathered (Step 3 & 4), embed concise but critical snippets of information, specific data structures, API endpoint details, precise references to _specific sections_ in other documents (e.g., "See `Data Models Doc#User-Schema-ValidationRules` for details"), or brief explanations of how architectural patterns apply to _this story_.
  - If UI story, provide specific references to Component/Style Guides relevant to _this story's elements_.
  - The aim is to make this section the Dev Agent's primary source for _story-specific_ technical context.
- **`Tasks / Subtasks` section:**
  - Generate a detailed, sequential list of technical tasks and subtasks the Dev Agent must perform to complete the story, informed by the gathered context.
  - Link tasks to ACs where applicable (e.g., `Task 1 (AC: 1, 3)`).
- Add notes on project structure alignment or discrepancies found in Step 4.
- Prepare content for the "Deviation Analysis" based on discrepancies noted in Step 3.

### 6. Quality Validation (Automated)

**Upon saving the story file, the task-post-hook automatically:**
- Validates story format (As a... I want... So that...)
- Checks all required sections are present
- Runs the story-draft-checklist validation
- Verifies acceptance criteria format
- Ensures technical requirements are documented
- Generates a validation report

**You'll receive:**
- Immediate feedback on any validation issues
- A comprehensive validation report in the task workspace
- Automatic handoff document for the Developer agent

### 7. Review and Finalize

- Review any validation warnings from the automated checks
- Address critical issues if any
- Confirm the story is ready for development
- The system will automatically:
  - Update the story index
  - Create developer handoff documentation
  - Track the story creation in session logs

## Post-Creation Notes

The automated hooks ensure:
- Story numbering remains consistent
- All prerequisites are properly tracked
- Quality standards are maintained
- Smooth handoff to development

Focus your expertise on:
- Crafting clear, actionable acceptance criteria
- Providing comprehensive technical guidance
- Ensuring the story aligns with project goals
- Making the story self-contained for efficient implementation
