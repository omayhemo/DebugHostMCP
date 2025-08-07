# AP Knowledge Base

## INDEX OF TOPICS

- [AP Knowledge Base](#ap-knowledge-base)
  - [INDEX OF TOPICS](#index-of-topics)
  - [AP MAPPING - CORE PHILOSOPHY](#ap-mapping---core-philosophy)
  - [AP MAPPING - AGILE METHODOLOGIES OVERVIEW](#ap-mapping---agile-methodologies-overview)
    - [CORE PRINCIPLES OF AGILE](#core-principles-of-agile)
    - [KEY PRACTICES IN AGILE](#key-practices-in-agile)
    - [BENEFITS OF AGILE](#benefits-of-agile)
  - [AP MAPPING - ANALOGIES WITH AGILE PRINCIPLES](#ap-method---analogies-with-agile-principles)
  - [AP MAPPING - TOOLING AND RESOURCE LOCATIONS](#ap-method---tooling-and-resource-locations)
    - [Licensing](#licensing)
  - [AP MAPPING - ETHOS \& BEST PRACTICES](#ap-method---ethos--best-practices)
  - [AGENT ROLES AND RESPONSIBILITIES](#agent-roles-and-responsibilities)
  - [NAVIGATING THE AP WORKFLOW - INITIAL GUIDANCE](#navigating-the-ap-workflow---initial-guidance)
    - [STARTING YOUR PROJECT - ANALYST OR PM?](#starting-your-project---analyst-or-pm)
    - [UNDERSTANDING EPICS - SINGLE OR MULTIPLE?](#understanding-epics---single-or-multiple)
  - [GETTING STARTED WITH AP](#getting-started-with-ap)
    - [Initial Project Setup](#initial-project-setup)
    - [Document Sharding](#document-sharding)
    - [Utilizing Dedicated IDE Agents (SM and Dev)](#utilizing-dedicated-ide-agents-sm-and-dev)
    - [When to Use the AP IDE Orchestrator](#when-to-use-the-ap-ide-orchestrator)
  - [SUGGESTED ORDER OF AGENT ENGAGEMENT (TYPICAL FLOW)](#suggested-order-of-agent-engagement-typical-flow)
  - [HANDLING MAJOR CHANGES](#handling-major-changes)
  - [IDE USAGE - GENERAL RECOMMENDATIONS](#ide-usage---general-recommendations)
    - [PLANNING AND TECHNICAL DESIGN](#planning-and-technical-design)
    - [DOCUMENTATION MANAGEMENT \& IMPLEMENTATION PHASES](#documentation-management--implementation-phases)
    - [AP MAPPING FILES](#ap-method-files)
  - [LEVERAGING IDE TASKS FOR EFFICIENCY](#leveraging-ide-tasks-for-efficiency)
    - [PURPOSE OF IDE TASKS](#purpose-of-ide-tasks)
    - [EXAMPLES OF TASK FUNCTIONALITY](#examples-of-task-functionality)

## AP MAPPING - CORE PHILOSOPHY

**STATEMENT:** "Context Engineering" is about embracing the chaos, thinking like a CTO with unlimited resources and a singular vision, and leveraging AI as your high-powered team to achieve ambitious goals rapidly. The AP Mapping (Agentic Persona Mapping), with the integrated "AP Agent", elevates "Context Coding" to advanced project planning, providing a structured yet flexible framework to plan, execute, and manage software projects using a team of specialized AI agents.

**DETAILS:**

- Focus on ambitious goals and rapid iteration.
- Utilize AI as a force multiplier.
- Adapt and overcome obstacles with a proactive mindset.

## AP MAPPING - AGILE METHODOLOGIES OVERVIEW

### CORE PRINCIPLES OF AGILE

- Individuals and interactions over processes and tools.
- Working software over comprehensive documentation.
- Customer collaboration over contract negotiation.
- Responding to change over following a plan.

### KEY PRACTICES IN AGILE

- Iterative Development: Building in short cycles (sprints).
- Incremental Delivery: Releasing functional pieces of the product.
- Daily Stand-ups: Short team meetings for synchronization.
- Retrospectives: Regular reviews to improve processes.
- Continuous Feedback: Ongoing input from stakeholders.

### BENEFITS OF AGILE

- Increased Flexibility: Ability to adapt to changing requirements.
- Faster Time to Market: Quicker delivery of valuable features.
- Improved Quality: Continuous testing and feedback loops.
- Enhanced Stakeholder Engagement: Close collaboration with users/clients.
- Higher Team Morale: Empowered and self-organizing teams.

## AP MAPPING - ANALOGIES WITH AGILE PRINCIPLES

The AP Mapping, while distinct in its "Context Engineering" approach with AI, shares foundational parallels with Agile methodologies:

- **Individuals and Interactions over Processes and Tools (Agile) vs. Context Engineering & AI Team (AP):**

  - **Agile:** Emphasizes the importance of skilled individuals and effective communication.
  - **AP:** The "Context Engineer" (you) actively directs and interacts with AI agents, treating them as a high-powered team. The quality of this interaction and clear instruction ("CLEAR_INSTRUCTIONS", "KNOW_YOUR_AGENTS") is paramount, echoing Agile's focus on human elements.

- **Working Software over Comprehensive Documentation (Agile) vs. Rapid Iteration & Quality Outputs (AP):**

  - **Agile:** Prioritizes delivering functional software quickly.
  - **AP:** Stresses "START_SMALL_SCALE_FAST" and "ITERATIVE_REFINEMENT." While "DOCUMENTATION_IS_KEY" for good inputs (briefs, PRDs), the goal is to leverage AI for rapid generation of working components or solutions. The focus is on achieving ambitious goals rapidly.

- **Customer Collaboration over Contract Negotiation (Agile) vs. Context Engineer as Ultimate Arbiter (AP):**

  - **Agile:** Involves continuous feedback from the customer.
  - **AP:** The "Context Engineer" acts as the primary stakeholder and quality control ("QUALITY_CONTROL," "STRATEGIC_OVERSIGHT"), constantly reviewing and refining AI outputs, much like a highly engaged customer.

- **Responding to Change over Following a Plan (Agile) vs. Embrace Chaos & Adapt (AP):**

  - **Agile:** Values adaptability and responsiveness to new requirements.
  - **AP:** Explicitly encourages to "EMBRACE_THE_CHAOS," "ADAPT & EXPERIMENT," and acknowledges that "ITERATIVE_REFINEMENT" means it's "not a linear process." This directly mirrors Agile's flexibility.

- **Iterative Development & Incremental Delivery (Agile) vs. Story-based Implementation & Phased Value (AP):**

  - **Agile:** Work is broken down into sprints, delivering value incrementally.
  - **AP:** Projects are broken into Epics and Stories, with "Developer Agents" implementing stories one at a time. Epics represent "significant, deployable increments of value," aligning with incremental delivery.

- **Continuous Feedback & Retrospectives (Agile) vs. Iterative Refinement & Quality Control (AP):**
  - **Agile:** Teams regularly reflect and adjust processes.
  - **AP:** The "Context Engineer" continuously reviews outputs ("QUALITY_CONTROL") and directs "ITERATIVE_REFINEMENT," serving a similar function to feedback loops and process improvement.

## AP MAPPING - TOOLING AND RESOURCE LOCATIONS

Effective use of the AP Mapping relies on understanding where key tools, configurations, and informational resources are located and how they are used. The method is designed to be tool-agnostic in principle, with agent instructions and workflows adaptable to various AI platforms and IDEs.

- **AP Knowledge Base:** This document (`/ap-kb.md`) serves as the central repository for understanding the AP method, its principles, agent roles, and workflows.
- **Orchestrator Agents:** A key feature is the Orchestrator agent (AKA "AP"), a master agent capable of embodying any specialized agent role.
  - **IDE Agent Orchestrator (`ide-ap-orchestrator.md`):**
    - **Setup:** Works without a build step, dynamically loading its configuration.
    - **Configuration (`ide-ap-orchestrator.cfg.md`):** Contains a `Data Resolution` section (defining base paths for assets like personas, tasks) and `Agent Definitions` (Title, Name, Customize, Persona file, Tasks).
    - **Operation:** Loads its config, lists available personas, and upon user request, embodies the chosen agent by loading its persona file and applying customizations.
    - The `ide-ap-orchestrator` file contents can be used as the instructions for a custom agent mode. The agent supports a `/help` command that can help guide the user. The agent relies on the existence in the agents folder being at the root of the project.
    - The `ide-ap-orchestrator` is not recommended for generating stories or doing development. While it CAN become those agents, its HIGHLY recommended to instead use the dedicated $AP_ROOT/agents/personas/mnt/c/Code/MCPServers/DebugHostMCP/.apm/agents/personas/sm.md as individual dedicated agents. The will use up less context overhead and are going to be used the most frequently.
- **Standalone IDE Agents:**
  - Optimized for IDE environments (e.g., Windsurf, Cursor), often under 6K characters (e.g., optimized versions of `$AP_ROOT/agents/personas/mnt/c/Code/MCPServers/DebugHostMCP/.apm/agents/personas/sm.md`).
  - Can directly reference and execute tasks.
- **Agent Configuration Files:**
  - `ide-ap-orchestrator.cfg.md`: Configures the IDE Orchestrator, defining `Data Resolution` paths (e.g., `$AP_ROOT/agents/personas`) and agent definitions with persona file names (e.g., `analyst.md`) and task file names (e.g., `create-prd.md`).
  - `ide-ap-orchestrator.md`: Main prompt/definition of the IDE Orchestrator agent.
- **Task Files:**
  - Located in `/` (and sometimes `/` for checklist-like tasks).
  - Self-contained instruction sets for specific jobs (e.g., `create-prd.md`, `checklist-run-task.md`).
  - Reduce agent bloat and provide on-demand functionality for any capable agent.
- **Core Agent Definitions (Personas):**
  - Files (typically `.md`) defining core personalities and instructions for different agents.
  - Located in `/` (e.g., `analyst.md`, `pm.md`).
- **Project Documentation (Outputs):**
- **Project Briefs:** Generated by the Analyst agent.
- **Product Requirements Documents (PRDs):** Produced by the PM agent, containing epics and stories.
- **UX/UI Specifications & Architecture Documents:** Created by Design Architect and Architect agents.
- The **POSM agent** is crucial for organizing and managing these documents.
- **Templates:** Standardized formats for briefs, PRDs, checklists, etc., likely stored in `/`.
- **Data Directory (`/`):** Stores persistent data, knowledge bases (like this one), and other key information for the agents.


### Licensing

The AP Mapping and its associated documentation and software are distributed under the **MIT License**.

Copyright (c) 2025 Doug Beard AKA AP Mappingology AKA AP Code

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## AP MAPPING - ETHOS & BEST PRACTICES

- **CORE_ETHOS:** You are the "Context Engineer." Think like a CTO with unlimited resources and a singular vision. Your AI agents are your high-powered team. Your job is to direct, refine, and ensure quality towards your ambitious goal. The method elevates "Context Coding" to advanced project planning.
- **MAXIMIZE_AI_LEVERAGE:** Push the AI. Ask for more. Challenge its outputs. Iterate.
- **QUALITY_CONTROL:** You are the ultimate arbiter of quality. Review all outputs.
- **STRATEGIC_OVERSIGHT:** Maintain the high-level vision. Ensure agent outputs align.
- **ITERATIVE_REFINEMENT:** Expect to revisit steps. This is not a linear process.
- **CLEAR_INSTRUCTIONS:** The more precise your requests, the better the AI's output.
- **DOCUMENTATION_IS_KEY:** Good inputs (briefs, PRDs) lead to good outputs. The POSM agent is crucial for organizing this.
- **KNOW_YOUR_AGENTS:** Understand each agent's role (see [AGENT ROLES AND RESPONSIBILITIES](#agent-roles-and-responsibilities) or below). This includes understanding the capabilities of the Orchestrator agent if you are using one.
- **START_SMALL_SCALE_FAST:** Test concepts, then expand.
- **EMBRACE_THE_CHAOS:** Pioneering new methods is messy. Adapt and overcome.
- **ADAPT & EXPERIMENT:** The AP Mapping provides a structure, but feel free to adapt its principles, agent order, or templates to fit your specific project needs and working style. Experiment to find what works best for you. **Define agile the AP way - or your way!** The agent configurations allow for customization of roles and responsibilities.

## AGENT ROLES AND RESPONSIBILITIES

Understanding the distinct roles and responsibilities of each agent is key to effectively navigating the AP workflow. While the "Context Engineer" provides overall direction, each agent specializes in different aspects of the project lifecycle. V3 introduces Orchestrator agents that can embody these roles, with configurations specified in `ide-ap-orchestrator.cfg.md` for IDE environments.

- **Orchestrator Agent (AP):**

  - **Function:** The primary orchestrator, initially "AP." It can embody various specialized agent personas. It handles general AP queries, provides oversight, and is the go-to when unsure which specialist is needed.
  - **Persona Reference:** Implicitly the core of `ide-ap-orchestrator.md` (IDE).
  - **IDE Orchestrator:** Operates directly in IDEs like Cursor or Windsurf without a build step, loading persona and task files dynamically based on its configuration (`ide-ap-orchestrator.cfg.md`). The orchestrator itself is defined in `ide-ap-orchestrator.md`.
  - **Key Feature:** Simplifies agent management, especially in environments with limitations on the number of custom agents.

- **Analyst:**

  - **Function:** Handles research, requirements gathering, brainstorming, and the creation of Project Briefs.
  - **IDE Persona:** `Analyst` with persona `analyst.md`. Similar "know-it-all" customization. Tasks for Brainstorming, Deep Research Prompt Generation, and Project Brief creation are often defined within the `analyst.md` persona itself ("In Analyst Memory Already").
  - **Output:** `Project Brief`.

- **Product Manager (PM):**

  - **Function:** Responsible for creating and maintaining Product Requirements Documents (PRDs), overall project planning, and ideation related to the product.
  - **IDE Persona:** `Product Manager (PM)` with persona `pm.md`. Focused on producing/maintaining the PRD (`create-prd.md` task) and product ideation/planning.
  - **Output:** `Product Requirements Document (PRD)`.

- **Architect:**

  - **Function:** Designs system architecture, handles technical design, and ensures technical feasibility.
  - **IDE Persona:** `Architect` with persona `architect.md`. Customized to be "Cold, Calculating, Brains behind the agent crew." Generates architecture (`create-architecture.md` task), helps plan stories (`create-next-story-task.md`), and can update PO-level epics/stories (`doc-sharding-task.md`).
  - **Output:** `Architecture Document`.

- **Design Architect:**

  - **Function:** Focuses on UI/UX specifications, front-end technical architecture, and can generate prompts for AI UI generation services.
  - **IDE Persona:** `Design Architect` with persona `design-architect.md`. Customized to be "Fun and carefree, but a frontend design master." Helps design web apps, produces UI generation prompts (`create-ai-frontend-prompt.md` task), plans FE architecture (`create-frontend-architecture.md` task), and creates UX/UI specs (`create-uxui-spec.md` task).
  - **Output:** `UX/UI Specification`, `Front-end Architecture Plan`, AI UI generation prompts.

- **Product Owner (PO):**

  - **Function:** Agile Product Owner responsible for validating documents, ensuring development sequencing, managing the product backlog, running master checklists, handling mid-sprint re-planning, and drafting user stories.
  - **IDE Persona:** `Product Owner AKA PO` with persona `po.md`. Described as versatile and multifaceted. Tasks include `create-prd.md`, `create-next-story-task.md`, `doc-sharding-task.md`, and `correct-course.md`.
  - **Output:** User Stories, managed PRD/Backlog.

- **Scrum Master (SM):**

  - **Function:** A technical role focused on helping the team run the Scrum process, facilitating development, and often involved in story generation and refinement.
  - **IDE Persona:** `Scrum Master: SM` with persona `$AP_ROOT//sm.md`. Described as "Super Technical and Detail Oriented," specialized in "Next Story Generation" (likely leveraging the SM persona's capabilities).

- **Developer Agents (DEV):**
  - **Function:** Implement user stories one at a time. Can be generic or specialized.
  - **IDE Personas:** Multiple configurations can exist, using the `$AP_ROOT//dev.md` persona file (optimized for <6K characters for IDEs). Examples:
    - `Frontend Dev`: Specialized in NextJS, React, Typescript, HTML, Tailwind.
    - `Dev`: Master Generalist Expert Senior Full Stack Developer.
  - **Configuration:** Specialized agents can be configured in `ide-ap-orchestrator.cfg.md` for the IDE Orchestrator. Standalone IDE developer agents (e.g., `$AP_ROOT//dev.md`) are also available.
  - **When to Use:** During the implementation phase, typically working within an IDE.

## NAVIGATING THE AP WORKFLOW - INITIAL GUIDANCE

### STARTING YOUR PROJECT - ANALYST OR PM?

- Use Analyst if unsure about idea/market/feasibility or need deep exploration.
- Use PM if concept is clear or you have a Project Brief.
- Refer to [AGENT ROLES AND RESPONSIBILITIES](#agent-roles-and-responsibilities) (or section within this KB) for full details on Analyst and PM.

### UNDERSTANDING EPICS - SINGLE OR MULTIPLE?

- Epics represent significant, deployable increments of value.
- Multiple Epics are common for non-trivial projects or a new MVP (distinct functional areas, user journeys, phased rollout).
- Single Epic might suit very small MVPs, or post MVP / brownfield new features.
- The PM helps define and structure epics.

## GETTING STARTED WITH AP

This section provides guidance for new users on how to set up their project with the AP agent structure and manage artifacts.

### Initial Project Setup

To begin using the AP method and its associated agents in your project, you need to integrate the core agent files:

- **Copy `agents` Folder:** The entire `agents` folder should be copied into the root directory of your project. This folder contains all the necessary personas, tasks, templates, and configuration files for the AP agents to function correctly.


### Document Sharding

Large documents like PRDs or Architecture Documents can become unwieldy for AI agents to process efficiently, especially in environments with context window limitations. The `doc-sharding-task.md` is designed to break these down:

- **Purpose:** The sharding task splits a large document (e.g., PRD, Architecture, Front-End Architecture) into smaller, more granular sections or individual user stories. This makes it easier for subsequent agents, like the SM (Scrum Master) or Dev Agents, to work with specific parts of the document without needing to process the entire thing.
- **How to Use:**
  1. Ensure the large document you want to shard (e.g., `prd.md`, `architecture.md`) exists in your project's `project_documentation` folder.
  2. Instruct your active IDE agent (e.g., PO, SM, or the AP Orchestrator embodying one of these roles) to run the `doc-sharding-task.md`.
  3. You will typically specify the _source file_ to be sharded. For example: "Run the `doc-sharding-task.md` against `/mnt/c/Code/MCPServers/DebugHostMCP/project_docs/base/prd.md`."
  4. The task will guide the agent to break down the document. The output might be new smaller files or instructions on how the document is logically segmented.

### Utilizing Dedicated IDE Agents (SM and Dev)

While the AP IDE Orchestrator can embody any persona, for common and intensive tasks like story generation (SM) and code implementation (Dev), it's highly recommended to use dedicated, specialized agents:

- **Why Dedicated Agents?**
  - **Context Efficiency:** Dedicated agents (e.g., optimized versions of `$AP_ROOT/agents/personas/mnt/c/Code/MCPServers/DebugHostMCP/.apm/agents/personas/dev.md`) are leaner as their persona files are smaller and more focused. This is crucial in IDEs where context window limits can impact performance and output quality.
  - **Performance:** Less overhead means faster responses and more focused interactions.
- **Recommendation:**
  - Favor using `$AP_ROOT//sm.md` for Scrum Master tasks (like generating the next story).
  - Favor using `$AP_ROOT//dev.md` (or specialized versions) for development tasks.
- **Creating Your Own Dedicated Agents:**
  - If your IDE supports more than a few custom agent modes (unlike Cursor's typical limit of 5 without paying for more), you can easily create your own specialized agents.
  - Take the content of a base persona file (e.g., `$AP_ROOT//architect.md`).
  - Optionally, integrate the content of frequently used task files directly into this new persona file.
  - Save this combined content as a new agent mode in your IDE (e.g., `my-architect-optimized.md`). This approach mirrors how optimized agents can be structured.

### When to Use the AP IDE Orchestrator

The AP IDE Orchestrator (`ide-ap-orchestrator.md` configured by `ide-ap-orchestrator.cfg.md`) provides flexibility but might not always be the most efficient choice.

- **Useful Scenarios:**
  - **Cursor IDE with Agent Limits:** If you're using an IDE like Cursor and frequently need to switch between many different agent personalities (Analyst, PM, Architect, etc.) beyond the typical free limit for custom modes, the Orchestrator allows you to access all configured personas through a single agent slot.
  - **Unified Experience:** If you prefer to interact with the AP agent system in your IDE using the AP Orchestrator to call upon different specialists, and you are not concerned about context limits or potential costs associated with larger LLM models that can handle the Orchestrator's broader context.
  - **Access to all Personas:** You want quick access to any of the defined agent personas without setting them up as individual IDE modes.
- **Potentially Unnecessary / Less Optimal Scenarios:**
  - **Simple Projects / Feature Additions (Caution Advised):** For very simple projects or when adding a small feature to an existing codebase, you _might_ consider a streamlined flow using the Orchestrator to embody the PM, generate a PRD with epics/stories, and then directly move to development, potentially skipping detailed architecture.
    - In such cases, the PM persona might be prompted to ask more technical questions to ensure generated stories are sufficiently detailed for developers.
    - **This is generally NOT recommended** as it deviates from the robust AP process and is not yet a fully streamlined or validated path. It risks insufficient planning and lower quality outputs.
  - **Frequent SM/Dev Tasks:** As mentioned above, for regular story creation and development, dedicated SM and Dev agents are more efficient due to smaller context overhead.

Always consider the trade-offs between the Orchestrator's versatility and the efficiency of dedicated agents, especially concerning your IDE's capabilities and the complexity of your project.

## SUGGESTED ORDER OF AGENT ENGAGEMENT (TYPICAL FLOW)

**NOTE:** This is a general guideline. The AP method is iterative; phases/agents might be revisited.

1. **Analyst** - brainstorm and create a project brief.
2. **PM (Product Manager)** - use the brief to produce a PRD with high level epics and stories.
3. **Design Architect UX UI Spec for PRD (If project has a UI)** - create the front end UX/UI Specification.
4. **Architect** - create the architecture and ensure we can meet the prd requirements technically - with enough specification that the dev agents will work consistently.
5. **Design Architect (If project has a UI)** - create the front end architecture and ensure we can meet the prd requirements technically - with enough specification that the dev agents will work consistently.
6. **Design Architect (If project has a UI)** - Optionally create a prompt to generate a UI from AI services such as Lovable or V0 from Vercel.
7. **PO**: Validate documents are aligned, sequencing makes sense, runs a final master checklist. The PO can also help midstream development replan or course correct if major changes occur.
8. **PO or SM**: Generate Stories 1 at a time (or multiple but not recommended) - this is generally done in the IDE after each story is completed by the Developer Agents.
9. **Developer Agents**: Implement Stories 1 at a time. You can craft different specialized Developer Agents, or use a generic developer agent. It is recommended to create specialized developer agents and configure them in the `ide-ap-orchestrator.cfg`.

## HANDLING MAJOR CHANGES

Major changes are an inherent part of ambitious projects. The AP Mapping embraces this through its iterative nature and specific agent roles:

- **Iterative by Design:** The entire AP workflow is built on "ITERATIVE_REFINEMENT." Expect to revisit previous steps and agents as new information emerges or requirements evolve. It's "not a linear process."
- **Embrace and Adapt:** The core ethos includes "EMBRACE_THE_CHAOS" and "ADAPT & EXPERIMENT." Major changes are opportunities to refine the vision and approach.
- **PO's Role in Re-planning:** The **Product Owner (PO)** is key in managing the impact of significant changes. They can "help midstream development replan or course correct if major changes occur." This involves reassessing priorities, adjusting the backlog, and ensuring alignment with the overall project goals.
- **Strategic Oversight by Context Engineer:** As the "Context Engineer," your role is to maintain "STRATEGIC_OVERSIGHT." When major changes arise, you guide the necessary pivots, ensuring the project remains aligned with your singular vision.
- **Re-engage Agents as Needed:** Don't hesitate to re-engage earlier-phase agents (e.g., Analyst for re-evaluating market fit, PM for revising PRDs, Architect for assessing technical impact) if a change significantly alters the project's scope or foundations.

## IDE USAGE - GENERAL RECOMMENDATIONS

The AP method is orchestrated through IDE environments for both planning and development. The general recommendation is to use the appropriate agents for document generation including the brief, PRD, Architecture, Design Architecture, and UI Prompts. Also use the PO to run the full final checklist to ensure all documents are aligned with various changes. For example, did the architect discover something that requires an update to a epic or story sequence in the PRD? The PO will help you there. Save these into the project_documentation folder of your project.

### PLANNING AND TECHNICAL DESIGN

- **Interface:** Managed within the IDE using specialized agents or the IDE Orchestrator.
- **Agents Involved:**
  - **Analyst:** Brainstorming, research, and initial project brief creation.
  - **PM (Product Manager):** PRD development, epic and high-level story definition.
  - **Architect / Design Architect (UI):** Detailed technical design and specification.
  - **PO:** Checklist runner to make sure all of the documents are aligned.
- **Activities:** Defining the vision, initial requirements gathering, market analysis, high-level planning.

### DOCUMENTATION MANAGEMENT & IMPLEMENTATION PHASES

- **Interface:** Primarily within the Integrated Development Environment (IDE), leveraging specialized agents (standalone or via the **IDE Agent Orchestrator** configured with `ide-ap-orchestrator.cfg.md`).
- **Agents Involved:**
  - "**PO or SM or AP Agent:** Run the doc sharing task to split the large files that have been created (PRD, Architecture etc...) into smaller granular documents that are easier for the SM and Dev Agents to work with.
  - **SM (Scrum Master):** Detailed story generation, backlog refinement, often directly in the IDE or tools integrated with it.
  - **Developer Agents:** Code implementation for stories, working directly with the codebase in the IDE.
- **Activities:** Detailed architecture, front-end/back-end design, code development, testing, leveraging IDE tasks (see "LEVERAGING IDE TASKS FOR EFFICIENCY"), using configurations like `ide-ap-orchestrator.cfg.md`.

### AP MAPPING FILES

Understanding key files helps in navigating and customizing the AP process:

- **Knowledge & Configuration:**
  - `/ap-kb.md`: This central knowledge base.
  - `ide-ap-orchestrator.cfg.md`: Configuration for IDE developer agents.
  - `ide-ap-orchestrator.md`: Definition of the IDE orchestrator agent.
- **Task Definitions:**
  - Files in `/` or `/` (e.g., `checklist-run-task.md`): Reusable prompts for specific actions and also used by agents to keep agent persona files lean.
- **Agent Personas & Templates:**
  - Files in `/`: Define the core behaviors of different agents.
  - Files in `/`: Standard formats for documents like Project Briefs, PRDs that the agents will use to populate instances of these documents.
- **Project Artifacts (Outputs - locations vary based on project setup):**
  - Project Briefs
  - Product Requirements Documents (PRDs)
  - UX/UI Specifications
  - Architecture Documents
  - Codebase and related development files.

## LEVERAGING IDE TASKS FOR EFFICIENCY

### PURPOSE OF IDE TASKS

- **Reduce Agent Bloat:** Avoid adding numerous, rarely used instructions to primary IDE agent modes (Dev Agent, SM Agent) or even the Orchestrator's base prompt. Keeps agents lean, beneficial for IDEs with limits on custom agent complexity/numbers.
- **On-Demand Functionality:** Instruct an active IDE agent (standalone or an embodied persona within the IDE Orchestrator) to perform a task by providing the content of the relevant task file (e.g., from `/checklist-run-task.md`) as a prompt, or by referencing it if the agent is configured to find it (as with the IDE Orchestrator).
- **Versatility:** Any sufficiently capable agent can be asked to execute a task. Tasks can handle specific functions like running checklists, creating stories, sharding documents, indexing libraries, etc. They are self-contained instruction sets.

### EXAMPLES OF TASK FUNCTIONALITY

**CONCEPT:** Think of tasks as specialized, callable mini-agents or on-demand instruction sets that main IDE agents or the Orchestrator (when embodying a persona) can invoke, keeping primary agent definitions streamlined. They are particularly useful for operations not performed frequently.

Here are some examples of functionalities provided by tasks found in `/`:

- **`create-prd.md`:** Guides the generation of a Product Requirements Document.
- **`create-next-story-task.md`:** Helps in defining and creating the next user story for development.
- **`create-architecture.md`:** Assists in outlining the technical architecture for a project.
- **`create-frontend-architecture.md`:** Focuses specifically on designing the front-end architecture.
- **`create-uxui-spec.md`:** Facilitates the creation of a UX/UI Specification document.
- **`create-ai-frontend-prompt.md`:** Helps in drafting a prompt for an AI service to generate UI/frontend elements.
- **`doc-sharding-task.md`:** Provides a process for breaking down large documents into smaller, manageable parts.
- **`library-indexing-task.md`:** Assists in creating an index or overview of a code library.
- **`checklist-run-task.md`:** Executes a predefined checklist (likely using `checklist-mappings.yml`).
- **`correct-course.md`:** Provides guidance or steps for when a project needs to adjust its direction.
- **`create-deep-research-prompt.md`:** Helps formulate prompts for conducting in-depth research on a topic.

These tasks allow agents to perform complex, multi-step operations by following the detailed instructions within each task file, often leveraging templates and checklists as needed.