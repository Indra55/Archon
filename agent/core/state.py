"""
KA-CHOW Core — Shared State Models

Base state and reusable sub-models used across multiple pipelines.
Feature-specific states extend BaseAgentState.
"""

from __future__ import annotations

from typing import Any, TypedDict
from pydantic import BaseModel, Field


# ─── Reusable sub-models (shared across features) ────────────────────────────

class ServiceDefinition(BaseModel):
    """A single microservice / module."""
    name: str = Field(description="Service name, e.g. 'user-service'")
    language: str = Field(description="Primary language, e.g. 'Python', 'Go'")
    framework: str = Field(description="Framework, e.g. 'FastAPI', 'Express'")
    responsibility: str = Field(description="What this service is responsible for")
    communication: list[str] = Field(default_factory=list)
    dependencies: list[str] = Field(default_factory=list)
    port: int | None = Field(default=None)


class DatabaseDesign(BaseModel):
    """Database layer design."""
    engine: str = Field(description="e.g. 'PostgreSQL', 'MongoDB'")
    purpose: str = Field(description="What data it stores")
    owned_by: str = Field(description="Which service owns this database")
    tables_or_collections: list[str] = Field(default_factory=list)


class APIEndpoint(BaseModel):
    """A single REST/gRPC endpoint."""
    method: str
    path: str
    service: str
    description: str


class ArchitectureDecision(BaseModel):
    """An Architecture Decision Record (ADR) entry."""
    title: str
    context: str
    decision: str
    rationale: str
    consequences: list[str] = Field(default_factory=list)


class ScaffoldedFile(BaseModel):
    """A file generated during scaffolding."""
    path: str = Field(description="Relative path from project root")
    content: str = Field(description="Full file content")
    description: str = Field(description="What this file does")


# ─── Architecture Pipeline State (TypedDict) ─────────────────────────────────
# Using TypedDict so LangGraph properly MERGES keys across nodes
# instead of replacing the entire state (which is what happens with plain dict).


class ArchitecturePipelineState(TypedDict, total=False):
    """
    Full state for the architecture pipeline.
    
    Using TypedDict with total=False means all keys are optional.
    LangGraph will MERGE node outputs into this state — only updating
    the keys that each node returns, while preserving all other keys.
    """
    # Input
    user_requirements: str

    # Control flow
    current_phase: str
    errors: list[str]

    # Requirements analysis output
    project_name: str
    project_summary: str
    functional_requirements: list[str]
    non_functional_requirements: list[str]
    constraints: list[str]
    target_scale: str

    # Architecture design output
    architecture_style: str
    services: list  # list[ServiceDefinition]
    databases: list  # list[DatabaseDesign]
    api_endpoints: list  # list[APIEndpoint]
    api_gateway: dict
    tech_stack_rationale: str
    decisions: list  # list[ArchitectureDecision]

    # Blueprint output
    blueprint_markdown: str

    # Scaffolding output
    scaffolded_files: list  # list[ScaffoldedFile]
    scaffold_summary: str

    # GitHub PR output
    pr_url: str
    pr_number: int
    branch_name: str
    files_committed: list[str]


# ─── Base Agent State (legacy, kept for compatibility) ────────────────────────

class BaseAgentState(BaseModel):
    """
    Base state shared across ALL pipelines.
    Feature-specific pipelines extend this with their own fields.
    """
    # Control flow
    current_phase: str = Field(default="init")
    errors: list[str] = Field(default_factory=list)

    # GitHub PR (shared — any pipeline can create a PR)
    pr_url: str = Field(default="")
    pr_number: int = Field(default=0)
    branch_name: str = Field(default="")
    files_committed: list[str] = Field(default_factory=list)

