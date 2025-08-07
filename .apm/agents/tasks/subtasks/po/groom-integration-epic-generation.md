# Integration Epic Generation Subtask

## Purpose
Create epics for system integrations, migrations, and third-party service implementations.

## Input
- Integration analysis results
- API documentation
- Migration requirements
- Partner specifications
- Data flow diagrams

## Processing Steps
1. Group integrations by business capability
2. Define integration objectives
3. Map data transformation needs
4. Establish testing strategies
5. Plan rollback procedures
6. Estimate integration complexity

## Output Format
```yaml
integration_epics:
  - id: "EPIC-I001"
    title: "Payment Provider Integration"
    integration_type: "third_party_api"
    business_capability: "Payment Processing"
    priority: "P0"
    
    description: |
      Integrate Stripe payment gateway for processing payments,
      managing subscriptions, and handling webhooks for payment
      events with full PCI compliance.
    
    integration_scope:
      - "Payment processing API"
      - "Subscription management"
      - "Webhook handling"
      - "Payment method vault"
      - "Dispute management"
    
    api_endpoints:
      outbound:
        - endpoint: "POST /v1/payment_intents"
          purpose: "Create payment intent"
          frequency: "~1000/day"
          
        - endpoint: "POST /v1/customers"
          purpose: "Create customer profile"
          frequency: "~100/day"
          
      inbound:
        - webhook: "payment_intent.succeeded"
          purpose: "Payment confirmation"
          handling: "Queue for processing"
          
        - webhook: "charge.dispute.created"
          purpose: "Dispute notification"
          handling: "Alert + manual review"
    
    data_mapping:
      customer:
        source_field: "user.email"
        target_field: "stripe.customer.email"
        
      payment:
        source_field: "order.amount"
        target_field: "stripe.payment_intent.amount"
        transform: "Convert to cents"
    
    security_requirements:
      - "PCI DSS compliance"
      - "Webhook signature verification"
      - "API key encryption"
      - "No card data storage"
    
    testing_strategy:
      - "Stripe test mode integration"
      - "Webhook testing with ngrok"
      - "Load testing payment flow"
      - "Failure scenario testing"
    
    rollback_plan:
      - "Feature flag for payment routing"
      - "Dual-write during transition"
      - "Queue replay capability"
      - "Manual payment fallback"
    
    monitoring_requirements:
      - "Payment success rate"
      - "API response times"
      - "Webhook delivery status"
      - "Error rate by type"
    
    phases:
      - phase: "Foundation"
        deliverables:
          - "Stripe SDK integration"
          - "Basic payment flow"
        duration: "1 sprint"
        
      - phase: "Webhooks"
        deliverables:
          - "Webhook endpoint"
          - "Event processing"
        duration: "1 sprint"
        
      - phase: "Advanced features"
        deliverables:
          - "Subscriptions"
          - "Saved payment methods"
        duration: "2 sprints"
    
    dependencies:
      - "User account system"
      - "Order management"
      - "Notification service"
    
    estimated_effort: "L"
    business_impact: "Enable revenue generation"
```

## Integration Categories
- Payment Processing
- Communication (Email, SMS)
- Analytics & Tracking
- Authentication Providers
- Storage & CDN
- Search Services
- AI/ML Services

## Quality Checks
- API contracts documented
- Error handling comprehensive
- Rollback strategy defined
- Monitoring covers all touchpoints
- Security requirements met