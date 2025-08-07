# Story Breakdown Subtask

## Purpose
Decompose epics into commit-level stories with clear acceptance criteria.

## Input
- Individual epic details
- Feature requirements
- Technical constraints
- Team capacity guidelines

## Processing Steps
1. Analyze epic scope and complexity
2. Identify logical work boundaries
3. Create atomic, committable stories
4. Define acceptance criteria for each story
5. Estimate relative complexity
6. Identify dependencies between stories

## Output Format
```yaml
stories:
  - id: "STORY-001"
    epic_id: "EPIC-001"
    title: "Implement JWT token generation service"
    description: "Create service to generate and sign JWT tokens"
    type: "backend"
    acceptance_criteria:
      - "Service generates valid JWT tokens"
      - "Tokens include user ID and expiration"
      - "Tokens are signed with RS256 algorithm"
      - "Unit tests achieve 90% coverage"
    technical_notes:
      - "Use jsonwebtoken library"
      - "Store keys in environment variables"
    estimate_points: 5
    dependencies: []
    tags: ["security", "authentication", "backend"]
    commit_ready: true
```

## Story Sizing Guidelines
- 1-2 points: Simple changes, configuration
- 3-5 points: Standard feature implementation
- 8 points: Complex feature with integration
- 13 points: Should be split further

## Quality Checks
- Each story is independently deployable
- Acceptance criteria are measurable
- Story size is appropriate (≤8 points)
- Dependencies are clearly documented