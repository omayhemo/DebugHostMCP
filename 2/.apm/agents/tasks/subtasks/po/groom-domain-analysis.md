# Domain Analysis Subtask

## Purpose
Analyze documentation by domain/component to extract domain models, entities, and boundaries.

## Input
- Documentation subset filtered by domain
- Architecture diagrams
- Entity relationship documents

## Processing Steps
1. Identify domain boundaries and contexts
2. Extract entity definitions and relationships
3. Map domain events and flows
4. Identify aggregate roots and value objects
5. Document bounded contexts

## Output Format
```yaml
domain:
  name: "Authentication"
  entities:
    - name: "User"
      type: "aggregate_root"
      properties: ["id", "email", "passwordHash"]
    - name: "Session"
      type: "entity"
      properties: ["token", "userId", "expiresAt"]
  boundaries:
    - "User Management"
    - "Session Management"
  events:
    - "UserRegistered"
    - "UserLoggedIn"
    - "SessionExpired"
```

## Quality Checks
- All entities have clear boundaries
- No circular dependencies between domains
- Events follow naming conventions