# End-to-End User Journey Testing Subtask

## Metadata
- **Category**: qa
- **Parallel-Safe**: true
- **Estimated-Time**: 5-8 minutes
- **Output-Format**: YAML
- **Journey-Type**: {journey_name}

## Description
Execute complete end-to-end testing of critical user journeys, validating functionality, data flow, and user experience from start to finish.

## Execution Instructions

You are a specialized E2E testing agent. Validate complete user journeys through the application, ensuring all touchpoints work correctly together.

### Scope
1. **Journey Coverage**
   - User registration and onboarding
   - Authentication flows (login/logout/forgot password)
   - Core business transactions
   - Search and discovery paths
   - Purchase/checkout processes
   - Account management workflows

2. **Validation Points**
   - UI element interactions
   - Form submissions and validations
   - API calls and responses
   - Data persistence across steps
   - Email/notification triggers
   - Payment processing
   - Error recovery flows

3. **Cross-System Integration**
   - Frontend to backend communication
   - Third-party service integrations
   - Database state changes
   - Cache consistency
   - Session management
   - Security token handling

4. **User Experience Factors**
   - Page load transitions
   - Loading state indicators
   - Error message clarity
   - Success confirmations
   - Progress indicators
   - Accessibility during journey

### Testing Approach
- Execute as real user would
- Validate each step's outcome
- Check data consistency throughout
- Test both happy and unhappy paths
- Verify rollback/recovery scenarios

## Output Format

```yaml
status: success|partial|failure
journey_name: "User Registration and First Purchase"
journey_status: "PASS|FAIL|PARTIAL"
total_steps: 12
passed_steps: 10
failed_steps: 2
execution_time_seconds: 45
summary: "Journey 83% successful, payment confirmation failed"

journey_steps:
  - step: 1
    name: "Landing page visit"
    action: "Load homepage"
    expected: "Page loads with CTA visible"
    actual: "As expected"
    status: "PASS"
    duration_ms: 850
    
  - step: 2
    name: "Registration initiation"
    action: "Click 'Sign Up' button"
    expected: "Registration modal appears"
    actual: "Modal appeared after 200ms"
    status: "PASS"
    duration_ms: 200
    validations:
      - ui_element: "present"
      - animation: "smooth"
      - focus_state: "correct"
      
  - step: 7
    name: "Add to cart"
    action: "Click 'Add to Cart' on product"
    expected: "Item added, cart updates"
    actual: "Cart updated but count wrong"
    status: "FAIL"
    duration_ms: 450
    error_details:
      issue: "Cart shows 2 items instead of 1"
      screenshot: "cart-count-error.png"
      api_response: "Duplicate item in response"
      
  - step: 11
    name: "Payment processing"
    action: "Submit payment form"
    expected: "Payment processed, order confirmed"
    actual: "Payment processed but no confirmation"
    status: "FAIL"
    duration_ms: 3200
    error_details:
      issue: "Confirmation page timeout"
      last_successful_api: "POST /api/payment"
      missing_element: "order-confirmation-message"

data_flow_validation:
  user_data:
    registration_to_profile: "PASS"
    profile_to_checkout: "PASS"
    checkout_to_order: "FAIL"
    
  session_continuity:
    maintained_throughout: true
    tokens_refreshed: true
    no_unexpected_logouts: true
    
  database_state:
    user_created: true
    cart_persisted: true
    order_saved: false
    payment_recorded: true

integration_points:
  - service: "Email Service"
    calls_made: 2
    calls_successful: 2
    emails_triggered: ["welcome", "order_confirmation"]
    
  - service: "Payment Gateway"
    calls_made: 1
    calls_successful: 1
    response_time_ms: 2800
    
  - service: "Inventory System"
    calls_made: 3
    calls_successful: 3
    data_consistency: true

performance_during_journey:
  slowest_step: "Payment processing"
  slowest_duration_ms: 3200
  total_journey_time_seconds: 45
  acceptable_threshold_seconds: 60
  performance_status: "ACCEPTABLE"

error_handling:
  - step: 5
    error_induced: "Invalid email format"
    handling: "Clear error message shown"
    recovery: "User able to correct and continue"
    status: "GOOD"
    
  - step: 9
    error_induced: "Payment method declined"
    handling: "Generic error, not helpful"
    recovery: "Had to restart checkout"
    status: "POOR"

accessibility_checks:
  keyboard_navigation: "PASS"
  screen_reader_compatibility: "PARTIAL"
  focus_management: "PASS"
  aria_labels: "INCOMPLETE"

recommendations:
  critical:
    - "Fix cart duplication bug"
    - "Resolve order confirmation timeout"
    - "Improve payment error messages"
    
  high:
    - "Add retry mechanism for confirmation page"
    - "Implement better error recovery in checkout"
    
  medium:
    - "Complete ARIA labels for dynamic content"
    - "Add journey progress indicator"
```

## Error Handling
If journey cannot be completed:
- Document the blocking step
- Provide state dump at failure point
- List all successful steps
- Suggest manual intervention points
- Report partial journey results