# Integration Points Analysis Subtask

## Purpose
Map system dependencies and integration requirements from documentation and architecture.

## Input
- API documentation
- System architecture diagrams
- Third-party service docs
- Data flow diagrams
- Integration specifications

## Processing Steps
1. Identify all external system touchpoints
2. Map API contracts and data formats
3. Analyze authentication/authorization flows
4. Document rate limits and SLAs
5. Identify integration risks
6. Define monitoring requirements

## Output Format
```yaml
integration_analysis:
  total_integrations: 12
  external_services: 8
  internal_apis: 4
  
  integrations:
    - id: "INT-001"
      name: "Payment Gateway"
      type: "external"
      provider: "Stripe"
      criticality: "HIGH"
      api_version: "2023-10-16"
      authentication: "API Key"
      data_flow: "bidirectional"
      
      endpoints_used:
        - method: "POST"
          path: "/v1/charges"
          purpose: "Process payments"
          rate_limit: "100/minute"
          
        - method: "GET"
          path: "/v1/customers"
          purpose: "Customer data"
          rate_limit: "100/minute"
          
      requirements:
        - "PCI compliance required"
        - "Webhook endpoint needed"
        - "Idempotency key implementation"
        
      risks:
        - description: "API version deprecation"
          likelihood: "medium"
          impact: "high"
          mitigation: "Version monitoring"
          
    - id: "INT-002"
      name: "Email Service"
      type: "external"
      provider: "SendGrid"
      criticality: "MEDIUM"
      api_version: "v3"
      authentication: "Bearer Token"
      data_flow: "outbound"
      
  dependency_map:
    payment_flow:
      - "Frontend -> Backend API"
      - "Backend API -> Stripe API"
      - "Stripe Webhook -> Backend API"
      - "Backend API -> Database"
      
  sla_requirements:
    - service: "Payment Gateway"
      availability: "99.9%"
      response_time: "<2s"
      
  monitoring_needs:
    - "API response times"
    - "Error rates by endpoint"
    - "Rate limit consumption"
    - "Webhook delivery success"
```

## Quality Checks
- All external dependencies documented
- API versions are current
- Authentication methods secure
- Rate limits won't bottleneck
- Monitoring covers critical paths