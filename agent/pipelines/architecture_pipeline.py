"""
Pipeline: Architecture Design & Infrastructure Scaffolding (Feature 1)

LangGraph that composes reusable agents into the full architecture pipeline:

  analyze_requirements → design_architecture → generate_blueprint
       → scaffold_infrastructure → create_pr → END

Each node is a reusable agent from agents/.
"""

from __future__ import annotations

import logging
import os
from typing import Any

from langgraph.graph import StateGraph, END

from agent.agents import (
    analyze_requirements,
    design_architecture,
    generate_blueprint,
    scaffold_infrastructure,
    create_pr,
)
from agent.core.state import ArchitecturePipelineState

logger = logging.getLogger("kachow.pipelines.architecture")


# ─── Routing functions ────────────────────────────────────────────────────────

def should_continue(state: dict[str, Any]) -> str:
    """Route to next node or end on error."""
    if state.get("errors"):
        return "error"
    return "continue"


def should_create_pr(state: dict[str, Any]) -> str:
    """Only create PR if GITHUB_TOKEN and GITHUB_REPO are configured."""
    if state.get("errors"):
        return "error"
    if os.getenv("GITHUB_TOKEN") and os.getenv("GITHUB_REPO"):
        return "create_pr"
    return "skip_pr"


# ─── Graph builder ────────────────────────────────────────────────────────────

def build_architecture_graph() -> StateGraph:
    """
    Build the Feature 1 pipeline graph.

    ┌──────────────────────┐
    │ analyze_requirements │
    └──────────┬───────────┘
               │
    ┌──────────▼───────────┐
    │ design_architecture  │
    └──────────┬───────────┘
               │
    ┌──────────▼───────────┐
    │ generate_blueprint   │
    └──────────┬───────────┘
               │
    ┌──────────▼───────────┐
    │scaffold_infrastructure│
    └──────────┬───────────┘
               │
        ┌──────▼──────┐
        │ create_pr?  │──skip──→ END
        └──────┬──────┘
               │ yes
        ┌──────▼──────┐
        │  create_pr  │
        └──────┬──────┘
               │
              END
    """
    # Use ArchitecturePipelineState (TypedDict) instead of plain dict
    # so LangGraph properly MERGES node outputs (preserving keys from
    # previous nodes) instead of replacing the entire state.
    graph = StateGraph(ArchitecturePipelineState)

    # Add reusable agent nodes
    graph.add_node("analyze_requirements", analyze_requirements)
    graph.add_node("design_architecture", design_architecture)
    graph.add_node("generate_blueprint", generate_blueprint)
    graph.add_node("scaffold_infrastructure", scaffold_infrastructure)
    graph.add_node("create_pr", create_pr)

    # Entry point
    graph.set_entry_point("analyze_requirements")

    # Edges with error checking
    graph.add_conditional_edges(
        "analyze_requirements", should_continue,
        {"continue": "design_architecture", "error": END},
    )
    graph.add_conditional_edges(
        "design_architecture", should_continue,
        {"continue": "generate_blueprint", "error": END},
    )
    graph.add_conditional_edges(
        "generate_blueprint", should_continue,
        {"continue": "scaffold_infrastructure", "error": END},
    )

    # After scaffolding: optionally create PR
    graph.add_conditional_edges(
        "scaffold_infrastructure", should_create_pr,
        {"create_pr": "create_pr", "skip_pr": END, "error": END},
    )

    graph.add_edge("create_pr", END)

    return graph


def compile_architecture_pipeline():
    """Build and compile the architecture pipeline."""
    return build_architecture_graph().compile()
