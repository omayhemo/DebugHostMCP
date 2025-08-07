# Cross-Browser Compatibility Test Subtask

## Metadata
- **Category**: qa
- **Parallel-Safe**: true
- **Estimated-Time**: 4-6 minutes
- **Output-Format**: YAML
- **Target-Browser**: {browser_name}

## Description
Test application functionality and appearance across specified browser, identifying compatibility issues and degraded experiences.

## Execution Instructions

You are a specialized browser compatibility testing agent. Test the application in {browser_name} browser.

### Scope
1. **Visual Rendering**
   - Layout consistency
   - CSS property support
   - Font rendering
   - Animation smoothness
   - Responsive breakpoints

2. **JavaScript Compatibility**
   - ES6+ feature support
   - API availability
   - Event handling differences
   - Console errors

3. **Feature Functionality**
   - Form interactions
   - AJAX/Fetch operations
   - Local storage/cookies
   - Media playback
   - File uploads/downloads

4. **Performance Variations**
   - Page load times
   - JavaScript execution speed
   - Memory usage patterns
   - Network request handling

### Testing Approach
- Test critical user paths first
- Document with screenshots/specifics
- Compare against baseline (Chrome)
- Note graceful degradation vs broken

## Output Format

```yaml
status: success|partial|failure
browser: "Chrome|Firefox|Safari|Edge"
version: "96.0.4664.110"
summary: "Found X critical, Y major compatibility issues"
findings:
  - category: rendering|javascript|functionality|performance
    severity: critical|high|medium|low
    feature: "Date picker component"
    description: "Calendar popup renders off-screen"
    affected_pages: ["/booking", "/schedule"]
    user_impact: "Cannot select dates"
    workaround: "Use keyboard input"
    fix_recommendation: "Add Safari-specific positioning CSS"
    screenshot_ref: "safari-datepicker-issue.png"
test_coverage:
  total_features_tested: 45
  features_working: 40
  features_degraded: 3
  features_broken: 2
  pages_tested: 15
performance_metrics:
  page_load_time_ms: 2300
  time_to_interactive_ms: 3100
  memory_usage_mb: 125
  vs_baseline_slower_percent: 15
```

## Error Handling
If unable to test specific features:
- Note as "untestable" with reason
- Focus on core functionality
- Provide browser-specific limitations