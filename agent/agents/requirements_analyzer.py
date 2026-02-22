"""
Agent: Requirements Analyzer

Parses natural language requirements into structured data.
Reusable — used by Architecture Pipeline, Knowledge Graph Pipeline, etc.
"""

from __future__ import annotations

import logging
from typing import Any

from agent.core.llm import invoke_llm_json
from agent.prompts.architecture import REQUIREMENTS_ANALYSIS_PROMPT

logger = logging.getLogger("kachow.agents.requirements")


async def analyze_requirements(state: dict[str, Any]) -> dict[str, Any]:
    """
    Parse natural language requirements into structured components.

    Reads:  user_requirements (str)
    Writes: project_name, project_summary, functional_requirements,
            non_functional_requirements, constraints, target_scale
    """
    logger.info("📋 Analyzing requirements...")

    user_requirements = state.get("user_requirements", "")
    if not user_requirements:
        return {"errors": ["No user requirements provided."]}

    prompt = REQUIREMENTS_ANALYSIS_PROMPT.format(
        user_requirements=user_requirements
    )

    try:
        parsed = await invoke_llm_json(prompt, temperature=0.1)

        result = {
            "project_name": parsed.get("project_name", "untitled-project"),
            "project_summary": parsed.get("project_summary", ""),
            "functional_requirements": parsed.get("functional_requirements", []),
            "non_functional_requirements": parsed.get("non_functional_requirements", []),
            "constraints": parsed.get("constraints", []),
            "target_scale": parsed.get("target_scale", "medium"),
            "current_phase": "architecture_design",
        }

        logger.info(f"✅ Requirements analyzed: project='{result['project_name']}', "
                     f"{len(result['functional_requirements'])} functional reqs")
        return result
    except Exception as e:
        logger.error(f"Requirements analysis failed: {e}")
        return {"errors": [f"Requirements analysis failed: {str(e)}"]}
