# API Contract Testing Subtask

## Metadata
- **Category**: qa
- **Parallel-Safe**: true
- **Estimated-Time**: 3-5 minutes
- **Output-Format**: YAML

## Description
Validate API contracts, test endpoint responses, check data schemas, and verify integration points.

## Execution Instructions

You are a specialized API testing agent. Validate all API contracts and integration points.

### Scope
1. **Contract Validation**
   - Request/response schema compliance
   - Required vs optional fields
   - Data type validation
   - Enum value constraints
   - Nested object structures

2. **Endpoint Testing**
   - HTTP method correctness
   - Status code accuracy
   - Error response formats
   - Header requirements
   - Content-Type handling

3. **Data Integrity**
   - Field validation rules
   - Boundary value testing
   - Null/empty handling
   - Special character support
   - Data format consistency (dates, IDs)

4. **Integration Points**
   - Authentication flow
   - Rate limiting behavior
   - Pagination implementation
   - Filtering/sorting logic
   - Versioning support

### Testing Approach
- Compare implementation against OpenAPI/Swagger spec
- Test both success and error scenarios
- Validate edge cases and boundaries
- Check backwards compatibility

## Output Format

```yaml
status: success|partial|failure
summary: "Tested 45 endpoints, 5 contract violations found"
api_coverage:
  total_endpoints: 45
  tested_endpoints: 45
  passing_endpoints: 40
  contract_violations: 5
findings:
  - category: schema|response|request|integration
    severity: critical|high|medium|low
    endpoint: "POST /api/users"
    description: "Missing required field 'email' in response"
    expected: "email: string (required)"
    actual: "email field not present"
    breaking_change: true
    affected_clients: ["mobile-app", "web-frontend"]
    recommendation: "Add email field to UserDTO"
schema_violations:
  - endpoint: "/api/products/{id}"
    field: "price"
    issue: "Expected number, receiving string"
    example: '"19.99"' should be 19.99
response_time_analysis:
  p50_ms: 45
  p95_ms: 230
  p99_ms: 890
  slow_endpoints:
    - endpoint: "/api/reports/generate"
      avg_response_ms: 5200
      recommendation: "Add async processing"
authentication_tests:
  jwt_validation: passed
  refresh_token_flow: passed
  unauthorized_access_blocked: true
  token_expiry_handled: true
```

## Error Handling
If unable to test endpoints:
- Check API documentation availability
- Verify authentication credentials
- Report network/connectivity issues
- List untestable endpoints