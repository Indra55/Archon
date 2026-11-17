"""
Agent: PR Creator

Thin wrapper around core.github_integration for use as a LangGraph node.
Reusable — any pipeline that has scaffolded_files can use this.
"""

from __future__ import annotations

import logging
from typing import Any

from agent.core.github_integration import create_pull_request

logger = logging.getLogger("archon.agents.pr_creator")


async def create_pr(state: dict[str, Any]) -> dict[str, Any]:
    """
    Create a GitHub PR with scaffolded files.
    Delegates to core.github_integration.create_pull_request.

    Reads:  project_name, blueprint_markdown, scaffolded_files, scaffold_summary,
            architecture_style, services, decisions
    Writes: pr_url, pr_number, branch_name, files_committed
    """
    logger.info("🔀 Creating GitHub PR...")
    return await create_pull_request(state)
