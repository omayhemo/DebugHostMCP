# Mobile Responsiveness Testing Subtask

## Metadata
- **Category**: qa
- **Parallel-Safe**: true
- **Estimated-Time**: 4-6 minutes
- **Output-Format**: YAML
- **Device-Category**: {device_type}

## Description
Test application responsiveness and functionality across mobile devices, screen sizes, and orientations.

## Execution Instructions

You are a specialized mobile testing agent. Evaluate the application's mobile experience across various devices and conditions.

### Scope
1. **Device Coverage**
   - Smartphones (iOS/Android)
   - Tablets (iPad/Android tablets)
   - Screen sizes (320px to 768px+)
   - Pixel densities (1x, 2x, 3x)
   - Orientation (portrait/landscape)

2. **Visual Responsiveness**
   - Layout adaptability
   - Text readability
   - Image scaling
   - Touch target sizes (44x44px minimum)
   - Viewport meta tag effectiveness
   - Horizontal scrolling issues

3. **Interactive Elements**
   - Touch gesture support
   - Swipe functionality
   - Pinch-to-zoom behavior
   - Form input usability
   - Modal/popup behavior
   - Navigation drawer functionality

4. **Performance on Mobile**
   - Page load speed on 3G/4G
   - JavaScript execution time
   - Memory usage
   - Battery impact
   - Offline functionality

5. **Mobile-Specific Features**
   - Camera integration
   - GPS/location services
   - Push notifications
   - App-like features (PWA)
   - Deep linking support

### Testing Approach
- Test critical user journeys first
- Check both portrait and landscape
- Validate touch interactions
- Verify performance on slower connections
- Test with real device constraints

## Output Format

```yaml
status: success|partial|failure
device_category: "smartphone|tablet"
test_conditions:
  screen_sizes_tested: ["320px", "375px", "414px", "768px"]
  orientations: ["portrait", "landscape"]
  connection_speeds: ["3G", "4G", "WiFi"]
summary: "Found X critical, Y major mobile issues"

visual_issues:
  - severity: critical|high|medium|low
    screen_size: "320px"
    orientation: "portrait"
    issue: "Navigation menu overlaps content"
    affected_pages: ["/home", "/products"]
    screenshot_ref: "nav-overlap-320px.png"
    recommendation: "Use hamburger menu for small screens"
    
  - severity: high
    screen_size: "375px"
    orientation: "landscape"
    issue: "Form inputs too small to tap accurately"
    touch_target_size: "32x32px"
    required_size: "44x44px"
    recommendation: "Increase input field height"

interaction_problems:
  - gesture: "swipe"
    component: "image carousel"
    issue: "Swipe not recognized, falls back to buttons"
    impact: "Poor mobile UX"
    recommendation: "Implement touch gesture library"
    
  - element: "dropdown menu"
    issue: "Requires precise tap, no touch tolerance"
    failure_rate: "30% mistaps"
    recommendation: "Add padding to touch areas"

performance_metrics:
  page_load_3g:
    time_seconds: 8.5
    acceptable_threshold: 3.0
    status: "FAIL"
    
  javascript_execution:
    time_ms: 1200
    memory_mb: 85
    battery_impact: "high"
    
  offline_capability:
    supported: false
    recommendation: "Implement service worker for offline"

responsive_breakpoints:
  - breakpoint: "768px"
    transition_quality: "smooth"
    issues: []
    
  - breakpoint: "480px"
    transition_quality: "jarring"
    issues: ["Layout jump", "Content reflow"]

mobile_specific_features:
  camera_access:
    tested: true
    working: false
    issue: "Permission request fails"
    
  location_services:
    tested: true
    working: true
    accuracy: "good"
    
  pwa_readiness:
    score: 45
    missing: ["Service worker", "Manifest icons", "Offline page"]

critical_user_flows:
  - flow: "Product search and purchase"
    mobile_success_rate: 72%
    desktop_success_rate: 95%
    main_issues: ["Small buttons", "Form validation unclear"]
    
  - flow: "User registration"
    mobile_success_rate: 85%
    issues: ["Password field toggling broken"]

recommendations_priority:
  immediate:
    - "Fix navigation menu overlap on small screens"
    - "Increase touch targets to 44x44px minimum"
    - "Optimize images for mobile (currently 5MB homepage)"
    
  short_term:
    - "Implement responsive images with srcset"
    - "Add touch gesture support"
    - "Create mobile-optimized forms"
    
  long_term:
    - "Build Progressive Web App features"
    - "Implement adaptive loading strategies"
    - "Create native app wrapper"
```

## Error Handling
If unable to test specific features:
- Note device limitations
- Test on available screen sizes
- Provide emulation alternatives
- Suggest real device testing