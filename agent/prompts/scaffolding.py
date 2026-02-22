"""
Prompts: Scaffolding

Service scaffolding, Kubernetes, Docker Compose, and README generation prompts.
"""

SCAFFOLDING_PROMPT = """\
You are a **Senior DevOps & Backend Engineer** generating scaffold skeleton files.

## Project: {project_name}
## Architecture Style: {architecture_style}

## Service to scaffold:
- **Name**: {service_name}
- **Language**: {service_language}
- **Framework**: {service_framework}
- **Responsibility**: {service_responsibility}
- **Communication**: {service_communication}
- **Port**: {service_port}

## Your Task:
Generate SKELETON scaffold files for this service. These are NOT full implementations —
just the minimal project structure showing how the service is organized, what its
entry point looks like, and what dependencies it needs.

All paths should be under `services/{service_name}/`.

Respond with a JSON array of file objects:

[
  {{
    "path": "services/{service_name}/filename.ext",
    "content": "file content as a string",
    "description": "what this file does"
  }}
]

Generate ONLY these files:
1. **Dockerfile** — Multi-stage build skeleton with proper base image for {service_language}, EXPOSE {service_port}
2. **Main entry point** — Minimal stub (e.g. main.go, app.py, index.ts) that sets up the framework, registers a `/health` endpoint, and has TODO comments showing where to add business logic for "{service_responsibility}"
3. **Dependencies** — Package manifest (requirements.txt, package.json, go.mod, etc.) with the framework dependency listed
4. **README.md** — 10-15 line service README: name, responsibility, port, communication protocol, how to run
5. **.env.example** — Key environment variables this service would need

CRITICAL RULES:
- Keep files SHORT and skeletal. This is a scaffold, not a full implementation.
- The entry point should be ~20-30 lines max with TODO placeholders, NOT full business logic.
- Do NOT write tests, CI configs, or detailed implementations.
- Respond ONLY with valid JSON array, no markdown fences.
"""

KUBERNETES_PROMPT = """\
You are a **Senior DevOps Engineer** generating Kubernetes manifests.

## Project: {project_name}
## Services:
{services_json}

## Your Task:
Generate Kubernetes manifests for ALL services. All paths under `k8s/`.

Respond with a JSON array:

[
  {{
    "path": "k8s/filename.yaml",
    "content": "full YAML content",
    "description": "what this manifest does"
  }}
]

Generate for each service:
1. **Deployment** — Resource limits, health checks, rolling update strategy
2. **Service** — ClusterIP exposing the correct port

Also generate:
3. **Namespace** — Project namespace
4. **Ingress** — Ingress rules for all services (nginx ingress controller)

Use best practices: resource limits, readiness/liveness probes, labels, annotations.
Respond ONLY with valid JSON array, no markdown fences.
"""

DOCKER_COMPOSE_PROMPT = """\
You are a **Senior DevOps Engineer** generating a Docker Compose file.

## Project: {project_name}
## Services:
{services_json}

## Databases:
{databases_json}

## Your Task:
Generate a comprehensive docker-compose.yml for local development:
- All application services with build contexts pointing to `./services/<name>`
- All database services with volume mounts and health checks
- A shared network
- Environment variables
- Depends-on relationships
- Correct port mappings matching each service's port

Respond with a JSON array:
[
  {{
    "path": "docker-compose.yml",
    "content": "full docker-compose.yml content",
    "description": "Docker Compose for local development"
  }}
]

CRITICAL RULES:
- Use the ACTUAL service names and ports from the services JSON above.
- Include ALL databases from the databases JSON.
- Respond ONLY with valid JSON array, no markdown fences.
"""

PROJECT_README_PROMPT = """\
You are a **Senior Technical Writer** generating a project-level README.

## Project: {project_name}
## Summary: {project_summary}
## Architecture Style: {architecture_style}

## Services:
{services_json}

## Databases:
{databases_json}

## Tech Stack Rationale:
{tech_stack_rationale}

## Your Task:
Generate a comprehensive project-level README.md for "{project_name}". Include:

1. **Project title "{project_name}"** and badges
2. **Overview** — What THIS project does based on the summary above, in 3-4 sentences
3. **Architecture** — Brief description of the {architecture_style} architecture with a link to `docs/BLUEPRINT.md`
4. **Tech Stack** — Table of technologies ACTUALLY used by the services listed above
5. **Project Structure** — Directory tree showing the ACTUAL service directories
6. **Quick Start** — `docker compose up` with actual service names and ports
7. **Services** — One-liner per service: name, responsibility, port
8. **API Overview** — Key endpoints per service
9. **Deployment** — Brief K8s deployment instructions
10. **License** — MIT

CRITICAL RULES:
- The README MUST be about "{project_name}": {project_summary}
- Use ACTUAL service names, ports, and technologies from the JSON.
- Do NOT use generic placeholders like "service-a", "your-org/project".
- Keep it concise — this is a scaffold README, not a full user manual.

Respond with a JSON array:
[
  {{
    "path": "README.md",
    "content": "full README.md content",
    "description": "Project-level README for {project_name}"
  }}
]

Respond ONLY with valid JSON array, no markdown fences.
"""
