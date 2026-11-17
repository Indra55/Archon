"""
Archon: The Autonomous Engineering Brain

Modular agent platform with reusable agents and feature-specific pipelines.

Structure:
  agent/core/       — Shared LLM, state models, GitHub integration
  agent/agents/     — Reusable agent nodes (mix & match into any pipeline)
  agent/prompts/    — LLM prompts organized by domain
  agent/pipelines/  — One LangGraph per feature
"""

from .pipelines.architecture_pipeline import compile_architecture_pipeline

__all__ = ["compile_architecture_pipeline"]
