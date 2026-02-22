"""
Prompts: Architecture Design

Requirements analysis, architecture design, and blueprint generation prompts.
"""

REQUIREMENTS_ANALYSIS_PROMPT = """\
You are a **Senior Staff Engineer** performing requirements analysis.

Given these natural language requirements from an engineer, extract structured information.

## Engineer's Requirements:
{user_requirements}

## Your Task:
Carefully read the engineer's requirements above. Think step-by-step about what SPECIFIC application they are asking for.

Then respond with a JSON object containing:

{{
  "project_name": "a concise kebab-case project name that reflects the SPECIFIC app described above",
  "project_summary": "a 2-3 sentence summary describing THIS SPECIFIC project, not a generic template",
  "functional_requirements": ["list of functional requirements DERIVED DIRECTLY from the engineer's description above"],
  "non_functional_requirements": ["list of non-functional requirements like performance, security, scalability"],
  "constraints": ["any explicit constraints mentioned (tech preferences, budget, team size, timeline)"],
  "target_scale": "small | medium | large | enterprise"
}}

CRITICAL RULES:
- You MUST base your analysis on the SPECIFIC requirements written above. Do NOT produce a generic template.
- The project_name and project_summary MUST describe the exact application the engineer asked for.
- Each functional_requirement MUST be traceable to something the engineer described or clearly implied.
- Be thorough. Infer reasonable non-functional requirements even if not explicitly stated.
- Respond ONLY with valid JSON, no markdown fences.
"""

ARCHITECTURE_DESIGN_PROMPT = """\
You are a **Principal Architect** designing a system architecture.

## Project Summary:
{project_summary}

## Functional Requirements:
{functional_requirements}

## Non-Functional Requirements:
{non_functional_requirements}

## Constraints:
{constraints}

## Target Scale: {target_scale}

## Your Task:
First, carefully re-read the project summary and functional requirements above.
Then design a system architecture SPECIFICALLY for THIS project.

Respond with a JSON object:

{{
  "architecture_style": "microservices | modular-monolith | monolith | serverless | event-driven",
  "services": [
    {{
      "name": "kebab-case-service-name",
      "language": "Python | Go | TypeScript | Java",
      "framework": "FastAPI | Express | Gin | Spring Boot | etc",
      "responsibility": "what this service does",
      "communication": ["REST", "gRPC", "Kafka", "RabbitMQ"],
      "dependencies": ["names of other services it depends on"],
      "port": 8001
    }}
  ],
  "databases": [
    {{
      "engine": "PostgreSQL | MongoDB | Redis | etc",
      "purpose": "what data it stores",
      "owned_by": "service-name",
      "tables_or_collections": ["user", "order", ...]
    }}
  ],
  "api_endpoints": [
    {{
      "method": "GET | POST | PUT | DELETE",
      "path": "/api/v1/resource",
      "service": "service-name",
      "description": "what this endpoint does"
    }}
  ],
  "api_gateway": {{
    "type": "Kong | Nginx | Traefik | custom",
    "features": ["rate-limiting", "auth", "load-balancing"],
    "routes": ["/api/v1/service-name -> service-name:port"]
  }},
  "tech_stack_rationale": "Detailed explanation of WHY you chose each technology for THIS SPECIFIC project.",
  "decisions": [
    {{
      "title": "ADR title",
      "context": "what led to this decision",
      "decision": "what was decided",
      "rationale": "why this decision was made",
      "consequences": ["positive and negative consequences"]
    }}
  ]
}}

CRITICAL RULES:
- Design a LEAN architecture. Use at most 3-4 services total. Merge related concerns into single services where possible (e.g. combine auth + user management, combine notifications + emails). Fewer, well-scoped services are better than many thin ones.
- Every service MUST directly support a functional requirement listed above. Do NOT invent services that are not needed.
- Service names, responsibilities, and endpoints MUST be specific to THIS project (e.g., for a chat app: "chat-service", "auth-service", "notification-service" — NOT generic "service-a", "service-b").
- The "services" array MUST contain at least 1 and at most 4 services. Do NOT return an empty array.
- tables_or_collections MUST reflect the actual data this specific project needs.
- Design for production readiness. Include health-check endpoints, observability hooks, and auth.
- Assign unique ports starting from 8001.
- Respond ONLY with valid JSON, no markdown fences.
"""

BLUEPRINT_GENERATION_PROMPT = """\
You are a **Technical Writer and Architect** creating a system blueprint document.

Generate a comprehensive Markdown blueprint document for this SPECIFIC architecture:

## Project: {project_name}
## Summary: {project_summary}
## Architecture Style: {architecture_style}

## Services:
{services_json}

## Databases:
{databases_json}

## API Endpoints:
{endpoints_json}

## API Gateway:
{gateway_json}

## Architecture Decisions:
{decisions_json}

## Tech Stack Rationale:
{tech_stack_rationale}

## Your Task:
Create a comprehensive **System Blueprint** in Markdown format that includes:

1. **Executive Summary** — Project overview and goals, specific to "{project_name}"
2. **Architecture Overview** — High-level architecture diagram in Mermaid showing the ACTUAL services listed above and their connections
3. **Service Catalog** — Detailed table of all services listed above with their responsibilities, tech stack, and ports
4. **Data Architecture** — Database designs from the data above, schemas overview, data flow
5. **API Design** — The ACTUAL endpoints listed above, with request/response contracts
6. **Communication Patterns** — How the services above communicate (sync vs async, protocols)
7. **Infrastructure** — Deployment strategy, containerization, orchestration
8. **Architecture Decision Records (ADRs)** — The decisions listed above with rationale
9. **Security Architecture** — Auth, authorization, secrets management approach
10. **Observability** — Logging, metrics, tracing strategy
11. **Getting Started** — How to run the scaffolded project locally

CRITICAL RULES:
- You MUST reference the ACTUAL services, databases, and endpoints from the JSON data above. Do NOT invent your own.
- The Mermaid diagram MUST show the real service names from the data, not placeholder names like "service-a".
- Do NOT generate a generic microservices template. Every section must be specific to "{project_name}".
- Make it detailed, professional, and immediately useful for an engineering team.
- Use Mermaid diagrams where possible.
"""
