"""
Archon Core — Onboarding Service

Generates personalized learning paths and starter tasks for new team members
by leveraging the Neo4j knowledge graph and LLM.
"""

import logging
import json
import uuid
import os
from typing import List, Dict, Any, Optional

from agent.core.neo4j_client import Neo4jClient
from agent.core.retriever import HybridRetriever
from agent.core.llm import invoke_llm, invoke_llm_json
from agent.prompts.onboarding import LEARNING_PATH_PROMPT, STARTER_TASK_PROMPT

logger = logging.getLogger("archon.core.onboarding")

# Role-specific search queries for building graph context
ROLE_QUERIES = {
    "backend_engineer": [
        "API routes and controllers",
        "database models and schema",
        "middleware and authentication",
        "server configuration and deployment",
        "core business logic services",
    ],
    "frontend_developer": [
        "React components and pages",
        "UI state management and hooks",
        "API client and data fetching",
        "styling and design system",
        "routing and navigation",
    ],
    "sre": [
        "deployment configuration and Docker",
        "monitoring and health checks",
        "database configuration and migrations",
        "environment variables and secrets",
        "error handling and logging",
    ],
    "fullstack_engineer": [
        "API routes and controllers",
        "React components and pages",
        "database models and schema",
        "authentication flow end to end",
        "core business logic services",
    ],
    "devops_engineer": [
        "CI/CD pipeline configuration",
        "Docker and containerization",
        "environment configuration",
        "deployment scripts and automation",
        "monitoring and observability",
    ],
}

DEFAULT_QUERIES = [
    "project architecture overview",
    "main entry points and configuration",
    "core services and business logic",
    "database schema and models",
    "key integrations and external dependencies",
]


class OnboardingService:
    """Generates learning paths and starter tasks using the knowledge graph + LLM."""

    def __init__(self, neo4j: Neo4jClient, retriever: HybridRetriever):
        self.neo4j = neo4j
        self.retriever = retriever
        self.video_library = self._load_video_library()

    def _load_video_library(self) -> List[Dict[str, Any]]:
        """Load the pre-made video library from JSON."""
        try:
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            lib_path = os.path.join(base_dir, "data", "video_library.json")
            if os.path.exists(lib_path):
                with open(lib_path, "r") as f:
                    return json.load(f)
            return []
        except Exception as e:
            logger.error(f"Failed to load video library: {e}")
            return []

    def _get_library_context(self) -> str:
        """Format the video library for the LLM prompt."""
        if not self.video_library:
            return "No pre-made modules available."
        
        ctx = []
        for mod in self.video_library:
            ctx.append(f"- ID: {mod['id']} | Topic: {mod['topic']} | Type: {mod['type']}")
        return "\n".join(ctx)

    async def generate_learning_path(
        self, role: str, repo_name: str = None
    ) -> Dict[str, Any]:
        """
        Generate a personalized learning path for a given role.
        
        1. Query the knowledge graph with role-specific searches (scoped to repo if provided)
        2. Gather graph context (nodes, relationships, code)
        3. Call LLM to organize into structured learning modules
        """
        logger.info(f"🎓 Generating learning path for role: {role}, repo: {repo_name}")

        # Get role-specific search queries — add repo prefix for scoped search
        queries = ROLE_QUERIES.get(role, DEFAULT_QUERIES)
        if repo_name:
            queries = [f"{repo_name} {q}" for q in queries]

        # Gather context from knowledge graph
        graph_context = await self._gather_role_context(queries)
        code_context = await self._gather_code_context(queries)

        # Add repo-specific file structure from Neo4j
        if repo_name:
            repo_structure = await self._gather_repo_structure(repo_name)
            if repo_structure:
                code_context = f"### Repository File Structure ({repo_name}):\n{repo_structure}\n\n{code_context}"

        if not graph_context and not code_context:
            logger.warning("No knowledge graph data found; generating generic path")
            graph_context = "No knowledge graph data is available yet. Generate a generic onboarding path."
            code_context = "No code has been indexed yet."

        # Generate learning path via LLM
        prompt = LEARNING_PATH_PROMPT.format(
            role=role.replace("_", " ").title(),
            graph_context=graph_context,
            code_context=code_context,
            video_library=self._get_library_context(),
        )

        try:
            result = await invoke_llm_json(prompt, temperature=0.3)
        except Exception as e:
            logger.error(f"Failed to generate learning path: {e}")
            result = self._get_fallback_path(role)

        # Ensure each module has a unique ID and map library data
        if "modules" in result:
            for mod in result["modules"]:
                # 1. Map library data if library_id is present
                lib_id = mod.get("library_id")
                if lib_id:
                    lib_entry = next((m for m in self.video_library if m["id"] == lib_id), None)
                    if lib_entry:
                        # Merge verified data (videos, type, estimated_minutes)
                        mod["recommended_videos"] = lib_entry.get("recommended_videos", [])
                        mod["type"] = lib_entry.get("type", mod.get("type"))
                        mod["estimated_minutes"] = lib_entry.get("estimated_minutes", mod.get("estimated_minutes"))
                        # Prefer library title/description if LLM left them generic
                        if not mod.get("title") or mod.get("title").startswith("Module"):
                            mod["title"] = lib_entry.get("title")
                        if not mod.get("description"):
                            mod["description"] = lib_entry.get("description")

                # 2. Ensure a unique ID for the frontend
                if not mod.get("id"):
                    mod["id"] = str(uuid.uuid4())[:8]

        return result

    async def generate_starter_tasks(
        self, learning_path: Dict[str, Any], role: str,
        repo_name: str = None, repo_description: str = ""
    ) -> List[Dict[str, Any]]:
        """
        Generate practical starter tasks linked to knowledge graph nodes,
        dynamically tailored to the developer's assigned project/repo.
        """
        logger.info(f"📋 Generating starter tasks for role: {role}, repo: {repo_name}")

        # Get graph context — scope queries to repo
        queries = ROLE_QUERIES.get(role, DEFAULT_QUERIES)[:3]
        if repo_name:
            queries = [f"{repo_name} {q}" for q in queries]
        graph_context = await self._gather_role_context(queries)

        # Get the actual code context from the repo
        repo_code_context = ""
        if repo_name:
            repo_structure = await self._gather_repo_structure(repo_name)
            code_snippets = await self._gather_code_context(queries)
            repo_code_context = ""
            if repo_structure:
                repo_code_context += f"### File Structure:\n{repo_structure}\n\n"
            if code_snippets:
                repo_code_context += f"### Key Code Snippets:\n{code_snippets}"

        path_summary = json.dumps(
            {
                "title": learning_path.get("title", ""),
                "modules": [
                    {"title": m.get("title", ""), "type": m.get("type", "")}
                    for m in learning_path.get("modules", [])
                ],
            },
            indent=2,
        )

        prompt = STARTER_TASK_PROMPT.format(
            role=role.replace("_", " ").title(),
            repo_name=repo_name or "Unknown Repository",
            repo_description=f"Description: {repo_description}" if repo_description else "No description available.",
            learning_path=path_summary,
            graph_context=graph_context or "No graph context available.",
            repo_code_context=repo_code_context or "No code indexed for this repo yet.",
        )

        try:
            tasks = await invoke_llm_json(prompt, temperature=0.3)
            if not isinstance(tasks, list):
                tasks = tasks.get("tasks", [])
        except Exception as e:
            logger.error(f"Failed to generate starter tasks: {e}")
            tasks = self._get_fallback_tasks(role)

        return tasks

    async def get_module_content(
        self, module: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Expand module content by fetching linked knowledge graph nodes.
        """
        linked_nodes = module.get("linked_graph_nodes", [])
        if not linked_nodes:
            return module

        try:
            # Fetch related graph data for linked nodes
            graph_data = await self._expand_nodes(linked_nodes)
            module["expanded_context"] = graph_data
        except Exception as e:
            logger.error(f"Failed to expand module content: {e}")
            module["expanded_context"] = {"nodes": [], "relationships": []}

        return module

    async def _gather_role_context(self, queries: List[str]) -> str:
        """Search the knowledge graph using role-specific queries."""
        all_context = []

        for query in queries:
            try:
                matches = await self.retriever.search(query, top_k=3)
                for match in matches:
                    summary = match.get("summary", "")
                    name = match.get("name", "")
                    file_path = match.get("file_path", "")
                    node_type = match.get("type", "")
                    node_uuid = match.get("uuid", "")

                    if summary or name:
                        ctx = f"[{node_type}] {name} ({file_path})"
                        if summary:
                            ctx += f"\n  Summary: {summary}"
                        if node_uuid:
                            ctx += f"\n  UUID: {node_uuid}"
                        all_context.append(ctx)
            except Exception as e:
                logger.warning(f"Search failed for query '{query}': {e}")

        return "\n\n".join(all_context) if all_context else ""

    async def _gather_code_context(self, queries: List[str]) -> str:
        """Gather relevant code snippets from the knowledge graph."""
        code_snippets = []

        for query in queries[:3]:  # Limit to avoid token overflow
            try:
                matches = await self.retriever.search(query, top_k=2)
                for match in matches:
                    code = match.get("code_content", "") or match.get("content", "")
                    if code and len(code) > 50:
                        file_path = match.get("file_path", "unknown")
                        name = match.get("name", "")
                        snippet = f"### {name} ({file_path})\n```\n{code[:500]}\n```"
                        code_snippets.append(snippet)
            except Exception as e:
                logger.warning(f"Code search failed for query '{query}': {e}")

        return "\n\n".join(code_snippets) if code_snippets else ""

    async def _gather_repo_structure(self, repo_name: str) -> str:
        """Fetch the file tree for a specific repo from Neo4j."""
        if not self.neo4j.driver:
            return ""

        query = f"""
        MATCH (r:{self.neo4j.prefix}Repository {{name: $repo_name}})
              -[:CONTAINS_FILE]->(f:{self.neo4j.prefix}File)
        RETURN f.path AS path, f.name AS name
        ORDER BY f.path
        LIMIT 50
        """

        try:
            files = []
            async with self.neo4j.driver.session() as session:
                result = await session.run(query, repo_name=repo_name)
                async for record in result:
                    path = record.get("path", record.get("name", ""))
                    if path:
                        files.append(f"  - {path}")
            return "\n".join(files) if files else ""
        except Exception as e:
            logger.warning(f"Failed to fetch repo structure for {repo_name}: {e}")
            return ""

    async def _expand_nodes(self, node_uuids: List[str]) -> Dict[str, Any]:
        """Expand linked nodes by fetching their data and 1-hop relationships from Neo4j."""
        if not self.neo4j.driver:
            return {"nodes": [], "relationships": []}

        nodes = []
        relationships = []

        query = f"""
        MATCH (n:{self.neo4j.prefix}BaseNode)
        WHERE n.uuid IN $uuids
        OPTIONAL MATCH (n)-[r]->(m:{self.neo4j.prefix}BaseNode)
        RETURN n, r, m
        """

        try:
            async with self.neo4j.driver.session() as session:
                result = await session.run(query, uuids=node_uuids)
                async for record in result:
                    n = record["n"]
                    r = record["r"]
                    m = record["m"]

                    if n:
                        nodes.append({
                            "uuid": n.get("uuid"),
                            "name": n.get("name"),
                            "type": n.get("type"),
                            "summary": n.get("summary", ""),
                            "file_path": n.get("path", ""),
                        })

                    if r and m:
                        relationships.append({
                            "type": r.type,
                            "source": n.get("uuid"),
                            "target": m.get("uuid"),
                            "target_name": m.get("name"),
                        })
        except Exception as e:
            logger.error(f"Failed to expand nodes: {e}")

        return {"nodes": nodes, "relationships": relationships}

    def _get_fallback_path(self, role: str) -> Dict[str, Any]:
        """Return a generic learning path when LLM fails."""
        role_title = role.replace("_", " ").title()
        return {
            "title": f"Learning Path: {role_title} Onboarding",
            "description": f"A structured onboarding path for new {role_title}s",
            "estimated_total_minutes": 120,
            "modules": [
                {
                    "id": "arch-overview",
                    "title": "Architecture Overview",
                    "description": "Understand the high-level architecture of the system",
                    "type": "architecture",
                    "estimated_minutes": 20,
                    "content": "Start by exploring the project structure and understanding how the major components connect.",
                    "linked_graph_nodes": [],
                    "key_takeaways": ["Understand the 3-tier architecture", "Know the tech stack"],
                    "recommended_videos": [
                        {"title": "System Design Basics", "youtube_id": "kvz8P-AJCqQ"}
                    ]
                },
                {
                    "id": "core-services",
                    "title": "Core Services",
                    "description": "Learn about the main services and their responsibilities",
                    "type": "service",
                    "estimated_minutes": 30,
                    "content": "Explore the core services that power the application.",
                    "linked_graph_nodes": [],
                    "key_takeaways": ["Understand service boundaries", "Know the API contract"],
                    "recommended_videos": [
                        {"title": "Microservices vs Monoliths", "youtube_id": "3c-iBn73dDE"}
                    ]
                },
                {
                    "id": "code-patterns",
                    "title": "Code Patterns & Conventions",
                    "description": "Learn the coding patterns and conventions used in the project",
                    "type": "code",
                    "estimated_minutes": 25,
                    "content": "Review the common patterns used across the codebase.",
                    "linked_graph_nodes": [],
                    "key_takeaways": ["Follow established patterns", "Understand naming conventions"],
                    "recommended_videos": [
                        {"title": "Clean Code Principles", "youtube_id": "_C6C4cacC4Q"}
                    ]
                },
                {
                    "id": "setup-run",
                    "title": "Local Development Setup",
                    "description": "Get the project running locally and verify your environment",
                    "type": "operations",
                    "estimated_minutes": 25,
                    "content": "Set up your local development environment and run the project.",
                    "linked_graph_nodes": [],
                    "key_takeaways": ["Run the project locally", "Know the dev workflow"],
                    "recommended_videos": [
                        {"title": "Docker Crash Course", "youtube_id": "p_M_y-b2cEw"}
                    ]
                },
            ],
        }

    def _get_fallback_tasks(self, role: str) -> List[Dict[str, Any]]:
        """Return generic starter tasks when LLM fails."""
        return [
            {
                "title": "Explore the project structure",
                "description": "Navigate through the project directories and understand the organization of the codebase.",
                "difficulty": "easy",
                "linked_nodes": [],
                "hints": [
                    "Start with the root directory and note the main subdirectories",
                    "Look at package.json / requirements.txt for dependencies",
                    "Check for README files in each major directory",
                ],
                "learning_objectives": ["Understand the project layout"],
            },
            {
                "title": "Add a small code comment",
                "description": "Find a function or module that could benefit from better documentation and add a helpful comment.",
                "difficulty": "easy",
                "linked_nodes": [],
                "hints": [
                    "Look for complex functions without docstrings",
                    "Follow the existing documentation style",
                    "Submit it as a small PR for review",
                ],
                "learning_objectives": ["Learn the PR workflow", "Understand a code area deeply"],
            },
        ]
