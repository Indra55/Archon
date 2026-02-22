"""
Agent: Blueprint Generator

Creates a comprehensive Markdown system blueprint document
from architecture design state.
"""

from __future__ import annotations

import json
import logging
from typing import Any

from agent.core.llm import invoke_llm
from agent.prompts.architecture import BLUEPRINT_GENERATION_PROMPT

logger = logging.getLogger("kachow.agents.blueprint")


def _dump(items: list) -> str:
    """Serialize a list of Pydantic models or dicts to JSON string."""
    return json.dumps(
        [i.model_dump() if hasattr(i, "model_dump") else i for i in items],
        indent=2,
    )


async def generate_blueprint(state: dict[str, Any]) -> dict[str, Any]:
    """
    Generate comprehensive system blueprint in Markdown.

    Reads:  project_name, project_summary, architecture_style,
            services, databases, api_endpoints, api_gateway,
            decisions, tech_stack_rationale
    Writes: blueprint_markdown
    """
    logger.info("📐 Generating blueprint...")

    prompt = BLUEPRINT_GENERATION_PROMPT.format(
        project_name=state.get("project_name", ""),
        project_summary=state.get("project_summary", ""),
        architecture_style=state.get("architecture_style", ""),
        services_json=_dump(state.get("services", [])),
        databases_json=_dump(state.get("databases", [])),
        endpoints_json=_dump(state.get("api_endpoints", [])),
        gateway_json=json.dumps(state.get("api_gateway", {}), indent=2),
        decisions_json=_dump(state.get("decisions", [])),
        tech_stack_rationale=state.get("tech_stack_rationale", ""),
    )

    try:
        response = await invoke_llm(prompt, temperature=0.4)
        return {
            "blueprint_markdown": response,
            "current_phase": "scaffolding",
        }
    except Exception as e:
        logger.error(f"Blueprint generation failed: {e}")
        return {"errors": [f"Blueprint generation failed: {str(e)}"]}
