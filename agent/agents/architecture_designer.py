"""
Agent: Architecture Designer

Designs system architecture from analyzed requirements.
Produces services, databases, APIs, gateway config, and ADRs.
"""

from __future__ import annotations

import json
import logging
from typing import Any

from agent.core.llm import invoke_llm_json
from agent.core.state import (
    ServiceDefinition, DatabaseDesign, APIEndpoint, ArchitectureDecision,
)
from agent.prompts.architecture import ARCHITECTURE_DESIGN_PROMPT

logger = logging.getLogger("kachow.agents.architect")


async def design_architecture(state: dict[str, Any]) -> dict[str, Any]:
    """
    Design system architecture based on analyzed requirements.

    Reads:  project_summary, functional_requirements,
            non_functional_requirements, constraints, target_scale
    Writes: architecture_style, services, databases, api_endpoints,
            api_gateway, tech_stack_rationale, decisions
    """
    logger.info("🏗️  Designing architecture...")

    prompt = ARCHITECTURE_DESIGN_PROMPT.format(
        project_summary=state.get("project_summary", ""),
        functional_requirements=json.dumps(state.get("functional_requirements", []), indent=2),
        non_functional_requirements=json.dumps(state.get("non_functional_requirements", []), indent=2),
        constraints=json.dumps(state.get("constraints", []), indent=2),
        target_scale=state.get("target_scale", "medium"),
    )

    try:
        parsed = await invoke_llm_json(prompt, temperature=0.3)

        return_data = {
            "architecture_style": parsed.get("architecture_style", "microservices"),
            "services": [ServiceDefinition(**s) for s in parsed.get("services", [])],
            "databases": [DatabaseDesign(**d) for d in parsed.get("databases", [])],
            "api_endpoints": [APIEndpoint(**e) for e in parsed.get("api_endpoints", [])],
            "api_gateway": parsed.get("api_gateway", {}),
            "tech_stack_rationale": parsed.get("tech_stack_rationale", ""),
            "decisions": [ArchitectureDecision(**a) for a in parsed.get("decisions", [])],
            "current_phase": "blueprint_generation",
        }

        # Validate: architecture MUST have at least one service
        if not return_data["services"]:
            logger.error("❌ Architecture design returned 0 services! LLM failed to design services.")
            return {"errors": ["Architecture design returned 0 services. The LLM failed to design proper services for this project."]}

        logger.info(f"✅ Designed {len(return_data['services'])} services, "
                     f"{len(return_data['databases'])} databases, "
                     f"{len(return_data['api_endpoints'])} endpoints")
        return return_data
    except Exception as e:
        logger.error(f"Architecture design failed: {e}")
        return {"errors": [f"Architecture design failed: {str(e)}"]}
