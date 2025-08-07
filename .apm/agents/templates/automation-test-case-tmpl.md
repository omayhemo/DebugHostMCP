==================== START: automation-test-case-tmpl ====================

# Automation Test Case Template

## Test Case Header

### Basic Information

- **Test Case ID:** {ATC-Component-Number}
- **Test Case Name:** {Descriptive name of what's being tested}
- **Feature/Epic:** {Feature or epic this test belongs to}
- **User Story:** {Related user story ID and description}
- **Created By:** {Test automation engineer name}
- **Created Date:** {Date test was created}
- **Last Modified:** {Date of last update}

### Test Classification

- **Test Type:** {Unit/Integration/UI/API/Performance/Security}
- **Test Category:** {Smoke/Regression/Critical Path/Edge Case}
- **Priority:** {P0/P1/P2/P3}
- **Automation Framework:** {Playwright/Cypress/Jest/RestAssured/etc.}
- **Execution Environment:** {Local/CI/CD/Staging/Production}

## Test Objective & Scope

### Test Objective

{Clear description of what this test validates - should align with acceptance criteria}

### Scope

- **Components Under Test:** {List specific components, services, or features}
- **Integration Points:** {External services, APIs, or databases involved}
- **User Personas:** {Which user roles this test covers}
- **Business Rules:** {Specific business logic being validated}

### Prerequisites

- **System State:** {Required system configuration or state}
- **Test Data:** {Specific data that must exist}
- **User Permissions:** {Required user roles or permissions}
- **Environment Setup:** {Any special environment configuration}

## Test Implementation Details

### Test Framework & Tools

- **Primary Framework:** {e.g., Playwright with TypeScript}
- **Assertion Library:** {e.g., Expect, Jest assertions}
- **Test Runner:** {e.g., Jest, Mocha, TestNG}
- **Reporting Tool:** {e.g., Allure, HTML Reporter}
- **CI/CD Integration:** {e.g., GitHub Actions, Jenkins}

### Test Data Strategy

- **Data Source:** {Static/Generated/Database/API}
- **Data Management:** {How test data is created and cleaned up}
- **Data Dependencies:** {Any relationships between test data}
- **Data Privacy:** {How sensitive data is handled}

```javascript
// Example test data structure
const testData = {
  user: {
    email: 'test.user@example.com',
    password: 'SecurePass123!',
    firstName: 'Test',
    lastName: 'User'
  },
  product: {
    id: 'PROD-001',
    name: 'Test Product',
    price: 29.99
  }
};
```

## Test Steps & Implementation

### High-Level Test Flow

1. {Step 1: Setup and preconditions}
2. {Step 2: Execute primary action}
3. {Step 3: Verify expected results}
4. {Step 4: Cleanup and teardown}

### Detailed Test Implementation

```javascript
// Example test implementation structure
describe('User Registration Flow', () => {
  let page;
  let testUser;

  beforeAll(async () => {
    // Global setup
    page = await browser.newPage();
    testUser = generateTestUser();
  });

  beforeEach(async () => {
    // Test-specific setup
    await page.goto('/registration');
    await clearDatabase();
  });

  test('should successfully register new user with valid data', async () => {
    // Test steps
    await page.fill('[data-testid="firstName"]', testUser.firstName);
    await page.fill('[data-testid="lastName"]', testUser.lastName);
    await page.fill('[data-testid="email"]', testUser.email);
    await page.fill('[data-testid="password"]', testUser.password);
    
    await page.click('[data-testid="register-button"]');
    
    // Assertions
    await expect(page.locator('[data-testid="success-message"]'))
      .toContainText('Registration successful');
    await expect(page).toHaveURL('/welcome');
    
    // Verify in database
    const user = await getUserByEmail(testUser.email);
    expect(user).toBeTruthy();
    expect(user.email).toBe(testUser.email);
  });

  afterEach(async () => {
    // Test cleanup
    await cleanupTestUser(testUser.email);
  });

  afterAll(async () => {
    // Global cleanup
    await page.close();
  });
});
```

### Page Object Model (for UI tests)

```javascript
// Example Page Object structure
class RegistrationPage {
  constructor(page) {
    this.page = page;
    this.firstNameInput = '[data-testid="firstName"]';
    this.lastNameInput = '[data-testid="lastName"]';
    this.emailInput = '[data-testid="email"]';
    this.passwordInput = '[data-testid="password"]';
    this.registerButton = '[data-testid="register-button"]';
    this.successMessage = '[data-testid="success-message"]';
  }

  async fillRegistrationForm(userData) {
    await this.page.fill(this.firstNameInput, userData.firstName);
    await this.page.fill(this.lastNameInput, userData.lastName);
    await this.page.fill(this.emailInput, userData.email);
    await this.page.fill(this.passwordInput, userData.password);
  }

  async submitRegistration() {
    await this.page.click(this.registerButton);
  }

  async getSuccessMessage() {
    return await this.page.textContent(this.successMessage);
  }
}
```

## Test Scenarios & Variations

### Primary Test Scenario

**Scenario:** {Main happy path scenario}

- **Given:** {Initial conditions}
- **When:** {Actions performed}
- **Then:** {Expected outcomes}

### Alternative Scenarios

**Scenario 1:** {Edge case or alternative path}

- **Given:** {Different initial conditions}
- **When:** {Different actions}
- **Then:** {Different expected outcomes}

**Scenario 2:** {Error scenario}

- **Given:** {Error conditions}
- **When:** {Actions that trigger error}
- **Then:** {Expected error handling}

### Data-Driven Test Cases

```javascript
// Example of parameterized test data
const invalidEmailTestData = [
  { email: 'invalid-email', expectedError: 'Please enter a valid email' },
  { email: 'test@', expectedError: 'Please enter a valid email' },
  { email: '@example.com', expectedError: 'Please enter a valid email' },
  { email: '', expectedError: 'Email is required' }
];

test.each(invalidEmailTestData)(
  'should show error for invalid email: $email',
  async ({ email, expectedError }) => {
    await registrationPage.fillEmail(email);
    await registrationPage.submitForm();
    
    const errorMessage = await registrationPage.getEmailError();
    expect(errorMessage).toBe(expectedError);
  }
);
```

## Assertions & Verification Points

### Functional Assertions

- **UI State Verification:** {What UI elements should be visible/hidden}
- **Data Validation:** {Database or API response validation}
- **Business Logic:** {Specific business rules being verified}
- **Integration Points:** {External service interactions}

### Non-Functional Assertions

- **Performance:** {Response time expectations}
- **Security:** {Access control and data protection}
- **Accessibility:** {WCAG compliance checks}
- **Reliability:** {Error handling and recovery}

```javascript
// Example assertion patterns
// UI Assertions
await expect(page.locator('[data-testid="element"]')).toBeVisible();
await expect(page).toHaveTitle('Expected Title');
await expect(page).toHaveURL('/expected-path');

// Data Assertions
expect(response.status()).toBe(200);
expect(response.data.id).toBeTruthy();
expect(response.data.email).toBe(testUser.email);

// Performance Assertions
const startTime = Date.now();
await performAction();
const duration = Date.now() - startTime;
expect(duration).toBeLessThan(3000); // 3 second limit
```

## Error Handling & Recovery

### Expected Errors

- **Validation Errors:** {How validation errors are handled}
- **Network Errors:** {Timeout and connectivity handling}
- **Authentication Errors:** {Unauthorized access scenarios}
- **Business Logic Errors:** {Domain-specific error conditions}

### Test Recovery Strategies

- **Retry Logic:** {When and how tests retry on failure}
- **Fallback Scenarios:** {Alternative test paths}
- **Cleanup Procedures:** {How to clean up after test failures}
- **State Reset:** {How to reset system state between tests}

```javascript
// Example error handling in tests
test('should handle network timeout gracefully', async () => {
  // Simulate network delay
  await page.route('**/api/register', route => {
    setTimeout(() => route.continue(), 5000);
  });
  
  await registrationPage.submitForm();
  
  // Verify timeout handling
  await expect(page.locator('[data-testid="loading-spinner"]'))
    .toBeVisible();
  await expect(page.locator('[data-testid="timeout-message"]'))
    .toBeVisible({ timeout: 10000 });
});
```

## Test Maintenance & Updates

### Maintenance Guidelines

- **Selector Strategy:** {How to maintain stable element selectors}
- **Test Data Updates:** {When and how to update test data}
- **Framework Updates:** {Process for updating automation framework}
- **Code Review Process:** {Review requirements for test code changes}

### Update Triggers

- **UI Changes:** {When UI updates require test modifications}
- **API Changes:** {When backend changes affect tests}
- **Business Logic Changes:** {When requirements change}
- **Framework Updates:** {When test framework versions change}

### Versioning & Documentation

- **Test Version:** {How test versions align with application versions}
- **Change Log:** {Track significant changes to test implementation}
- **Dependencies:** {Document external dependencies and versions}

## Performance & Optimization

### Execution Performance

- **Target Execution Time:** {Maximum acceptable test duration}
- **Parallel Execution:** {Can this test run in parallel with others}
- **Resource Usage:** {Memory, CPU, network requirements}
- **Optimization Opportunities:** {Areas for performance improvement}

### CI/CD Integration

```yaml
# Example CI/CD configuration
name: Automated Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '16'
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npm run test:automation
      - name: Upload test reports
        uses: actions/upload-artifact@v2
        with:
          name: test-reports
          path: test-results/
```

## Reporting & Analytics

### Test Reporting

- **Execution Results:** {Pass/fail status and execution time}
- **Screenshots/Videos:** {Visual evidence of test execution}
- **Logs:** {Detailed execution logs and debug information}
- **Trends:** {Historical test performance and reliability}

### Metrics Collection

- **Execution Time Trends:** {Track test performance over time}
- **Flakiness Detection:** {Identify unstable tests}
- **Coverage Mapping:** {Link tests to requirements}
- **Failure Analysis:** {Common failure patterns and root causes}

## Documentation & Knowledge Transfer

### Test Documentation

- **Purpose:** {Why this test exists and what it protects}
- **Assumptions:** {What assumptions the test makes}
- **Limitations:** {What the test doesn't cover}
- **Dependencies:** {External systems or data required}

### Knowledge Transfer

- **Onboarding Guide:** {How new team members can understand this test}
- **Troubleshooting:** {Common issues and their solutions}
- **Contact Information:** {Who to contact for test-related questions}
- **Related Resources:** {Links to additional documentation}

---

**Template Usage Guidelines:**

- Adapt sections based on test type (UI/API/Performance)
- Include actual code examples relevant to your framework
- Update test data and selectors to match your application
- Maintain version control for test documentation
- Regular review and updates as application evolves

==================== END: automation-test-case-tmpl ====================
