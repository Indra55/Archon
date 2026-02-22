"""
Agent: Infrastructure Scaffolder

Generates production-ready scaffold files:
  - Service boilerplate (main app, config, deps)
  - Dockerfiles (multi-stage)
  - docker-compose.yml
  - README docs
"""

from __future__ import annotations

import asyncio
import json
import logging
from typing import Any

from agent.core.llm import invoke_llm_json
from agent.core.state import ScaffoldedFile
from agent.prompts.scaffolding import (
    SCAFFOLDING_PROMPT,
    DOCKER_COMPOSE_PROMPT,
    PROJECT_README_PROMPT,
)

logger = logging.getLogger("kachow.agents.scaffolder")


def _dump(items: list) -> str:
    return json.dumps(
        [i.model_dump() if hasattr(i, "model_dump") else i for i in items],
        indent=2,
    )


async def _safe_llm_json(prompt: str, label: str, temperature: float = 0.2) -> list:
    """Call invoke_llm_json and return parsed list, or empty list on failure."""
    try:
        parsed = await invoke_llm_json(prompt, temperature=temperature)
        if isinstance(parsed, dict):
            for key in ("files", "manifests", "data", "result"):
                if key in parsed and isinstance(parsed[key], list):
                    logger.info(f"  ℹ️  {label}: unwrapped JSON array from key '{key}'")
                    return parsed[key]
            if "path" in parsed and "content" in parsed:
                logger.info(f"  ℹ️  {label}: single file object, wrapping in list")
                return [parsed]
            logger.warning(f"  ⚠️  {label}: got dict but couldn't extract file list. Keys: {list(parsed.keys())}")
            return []
        if isinstance(parsed, list):
            return parsed
        logger.warning(f"  ⚠️  {label}: unexpected type {type(parsed)}")
        return []
    except Exception as e:
        logger.error(f"  ❌ {label} failed: {e}")
        return []


async def _scaffold_service(
    project_name: str,
    architecture_style: str,
    svc: Any,
) -> list[ScaffoldedFile]:
    """Scaffold a single service — can be run concurrently."""
    svc_data = svc.model_dump() if hasattr(svc, "model_dump") else svc
    svc_name = svc_data.get("name", "unknown")
    logger.info(f"  📦 Scaffolding service: {svc_name}")

    prompt = SCAFFOLDING_PROMPT.format(
        project_name=project_name,
        architecture_style=architecture_style,
        service_name=svc_data["name"],
        service_language=svc_data["language"],
        service_framework=svc_data["framework"],
        service_responsibility=svc_data["responsibility"],
        service_communication=", ".join(svc_data.get("communication", [])),
        service_port=svc_data.get("port", 8000),
    )

    files = await _safe_llm_json(prompt, f"scaffold-{svc_name}", temperature=0.2)
    result = []
    for f in files:
        if isinstance(f, dict) and f.get("path") and f.get("content"):
            result.append(ScaffoldedFile(
                path=f["path"], content=f["content"],
                description=f.get("description", ""),
            ))
    logger.info(f"  {'✅' if result else '❌'} {svc_name}: {len(result)} files")
    return result


async def scaffold_infrastructure(state: dict[str, Any]) -> dict[str, Any]:
    """
    Generate all scaffold files for the designed architecture.

    Reads:  project_name, architecture_style, services, databases
    Writes: scaffolded_files, scaffold_summary
    """
    logger.info("🔨 Scaffolding infrastructure...")

    project_name = state.get("project_name", "project")
    architecture_style = state.get("architecture_style", "microservices")
    services = state.get("services", [])
    databases = state.get("databases", [])

    all_files: list[ScaffoldedFile] = []

    # 1. Scaffold ALL services in parallel
    service_tasks = [
        _scaffold_service(project_name, architecture_style, svc)
        for svc in services
    ]

    # Also run docker-compose + README in parallel with service scaffolds
    services_json = _dump(services)
    databases_json = _dump(databases)

    async def _compose():
        logger.info("  📦 Generating docker-compose.yml...")
        return await _safe_llm_json(
            DOCKER_COMPOSE_PROMPT.format(
                project_name=project_name,
                services_json=services_json,
                databases_json=databases_json,
            ),
            "docker-compose",
            temperature=0.1,
        )

    async def _readme():
        logger.info("  📦 Generating project README...")
        return await _safe_llm_json(
            PROJECT_README_PROMPT.format(
                project_name=project_name,
                project_summary=state.get("project_summary", ""),
                architecture_style=architecture_style,
                services_json=services_json,
                databases_json=databases_json,
                tech_stack_rationale=state.get("tech_stack_rationale", ""),
            ),
            "readme",
            temperature=0.3,
        )

    # Run everything concurrently
    results = await asyncio.gather(
        *service_tasks,
        _compose(),
        _readme(),
        return_exceptions=True,
    )

    # Process service results (first N items)
    for i, result in enumerate(results[:-2]):
        if isinstance(result, Exception):
            logger.error(f"  ❌ Service scaffold failed: {result}")
            continue
        all_files.extend(result)

    # Process docker-compose
    compose_result = results[-2]
    if isinstance(compose_result, Exception):
        logger.error(f"  ❌ docker-compose failed: {compose_result}")
    else:
        for f in compose_result:
            if isinstance(f, dict) and f.get("path") and f.get("content"):
                all_files.append(ScaffoldedFile(
                    path=f["path"], content=f["content"],
                    description=f.get("description", ""),
                ))
        logger.info(f"  {'✅' if compose_result else '❌'} docker-compose: {len(compose_result)} files")

    # Process README
    readme_result = results[-1]
    if isinstance(readme_result, Exception):
        logger.error(f"  ❌ README failed: {readme_result}")
    else:
        for f in readme_result:
            if isinstance(f, dict) and f.get("path") and f.get("content"):
                all_files.append(ScaffoldedFile(
                    path=f["path"], content=f["content"],
                    description=f.get("description", ""),
                ))
        logger.info(f"  {'✅' if readme_result else '❌'} README: {len(readme_result)} files")

    # Summary
    svc_names = [
        s.name if hasattr(s, "name") else s.get("name", "?") for s in services
    ]
    summary = (
        f"Scaffolded {len(all_files)} files for '{project_name}'.\n"
        f"Services: {', '.join(svc_names)}\n"
        f"Includes: service code, Dockerfiles, docker-compose, README"
    )

    logger.info(f"✅ Scaffolding complete: {len(all_files)} total files")

    return {
        "scaffolded_files": all_files,
        "scaffold_summary": summary,
        "current_phase": "pr_creation",
    }
