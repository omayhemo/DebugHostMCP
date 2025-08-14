# Architecture Compliance Check Subtask

## Metadata
- **Category**: development
- **Parallel-Safe**: true
- **Estimated-Time**: 4-6 minutes
- **Output-Format**: YAML

## Description
Verify codebase compliance with defined architecture patterns, principles, and constraints.

## Execution Instructions

You are a specialized architecture compliance agent. Evaluate whether the implementation follows the documented architecture and design principles.

### Scope
1. **Architectural Patterns**
   - Layering violations
   - Component boundaries
   - Dependency directions
   - Service separation
   - Module cohesion

2. **Design Principles**
   - SOLID compliance
   - DRY violations
   - YAGNI adherence
   - Separation of concerns
   - Single responsibility

3. **Architecture Decisions**
   - ADR compliance
   - Technology choices
   - Pattern implementations
   - Framework usage
   - Library selections

4. **Code Organization**
   - Project structure
   - Package organization
   - Naming conventions
   - File locations
   - Module boundaries

5. **Integration Patterns**
   - API contracts
   - Event schemas
   - Message formats
   - Service interfaces
   - Data flow patterns

### Analysis Approach
- Compare implementation against architecture docs
- Check dependency directions
- Validate pattern usage
- Verify principle adherence
- Assess boundary violations

## Output Format

```yaml
status: success|partial|failure
summary: "Found 8 architecture violations, 12 principle breaches"
architecture_style: "Microservices|Monolith|Modular Monolith|Serverless"
compliance_score: 72  # out of 100

layer_violations:
  - violation: "Controller accessing Repository directly"
    location: "src/controllers/userController.js"
    line: 145
    expected_flow: "Controller -> Service -> Repository"
    actual_flow: "Controller -> Repository"
    severity: high
    fix: "Route through UserService"
    
  - violation: "Domain layer depends on Infrastructure"
    location: "src/domain/order.js"
    imported: "src/infrastructure/database.js"
    severity: critical
    principle: "Dependency Inversion"
    fix: "Inject repository interface"

design_principle_violations:
  - principle: "Single Responsibility"
    location: "src/services/userService.js"
    issue: "Handles user CRUD, email, and notifications"
    responsibilities_count: 3
    recommendation: "Split into UserService, EmailService, NotificationService"
    
  - principle: "Open/Closed"
    location: "src/processors/paymentProcessor.js"
    issue: "Switch statement for payment types"
    fix: "Use strategy pattern for payment methods"
    
  - principle: "DRY"
    locations:
      - "src/api/auth.js:45-67"
      - "src/api/admin.js:23-45"
      - "src/api/user.js:89-111"
    duplicated_logic: "Token validation"
    fix: "Extract to middleware"

architecture_decision_violations:
  - adr: "ADR-003: Use PostgreSQL for persistence"
    violation: "MongoDB used in user service"
    location: "src/services/userPersistence.js"
    severity: high
    
  - adr: "ADR-007: REST APIs only"
    violation: "GraphQL endpoint added"
    location: "src/api/graphql/*"
    justification_found: false

boundary_violations:
  - type: "Bounded Context breach"
    from_context: "Orders"
    to_context: "Inventory"
    violation: "Direct database access"
    expected: "API call"
    location: "src/orders/orderService.js:234"
    
  - type: "Module encapsulation"
    module: "Authentication"
    exposed_internals: ["TokenGenerator", "HashValidator"]
    should_expose: ["AuthService", "AuthMiddleware"]

dependency_issues:
  - issue: "Circular dependency"
    components: ["UserService", "OrderService", "NotificationService"]
    cycle: "User -> Order -> Notification -> User"
    fix: "Introduce event bus for notifications"
    
  - issue: "Framework coupling"
    finding: "Business logic imports Express"
    locations: ["src/domain/validators.js"]
    fix: "Keep framework at edges"

naming_violations:
  - pattern: "Interface naming"
    expected: "IUserRepository"
    found: "UserRepo"
    count: 12
    
  - pattern: "Service suffix"
    expected: "UserService"
    found: "UserManager, UserHandler, Users"
    inconsistency: high

structure_issues:
  - issue: "Feature in wrong layer"
    feature: "Email templates"
    current_location: "src/domain/emails/"
    correct_location: "src/infrastructure/email/"
    
  - issue: "Test files mixed with source"
    found_in: ["src/services/", "src/domain/"]
    should_be: "Separate test directory"

integration_compliance:
  - pattern: "Event sourcing"
    compliant_services: 3
    non_compliant_services: 2
    issues:
      - "OrderService uses direct updates"
      - "PaymentService missing event store"
      
  - pattern: "API Gateway"
    violation: "Services expose direct endpoints"
    expected: "All traffic through gateway"
    bypass_endpoints: 8

recommendations:
  critical:
    - "Fix layer violations in controllers"
    - "Remove circular dependencies"
    - "Enforce bounded context boundaries"
    
  high:
    - "Align with ADR decisions"
    - "Apply SOLID principles consistently"
    - "Standardize naming conventions"
    
  medium:
    - "Reorganize project structure"
    - "Extract shared code properly"
    - "Document architecture exceptions"

architecture_debt:
  total_violations: 32
  estimated_effort_days: 12
  risk_level: "medium"
  recommendation: "Address critical items in next sprint"
```

## Error Handling
If unable to check compliance:
- Note missing architecture documentation
- Check what patterns are detectable
- Provide general compliance assessment
- Suggest architecture documentation needs