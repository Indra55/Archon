"""
KA-CHOW Architecture Agent — CLI Entry Point

Usage:
    python -m agent.main "Build a real-time chat app with auth, notifications..."
    python -m agent.main   (interactive mode)
"""

from __future__ import annotations

import asyncio
import logging
import os
import sys
from pathlib import Path

from dotenv import load_dotenv

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from agent.pipelines.architecture_pipeline import compile_architecture_pipeline
from agent.output import write_output

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(name)-20s | %(levelname)-7s | %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("kachow")


def print_banner():
    banner = r"""
    ╔══════════════════════════════════════════════════════════════╗
    ║                                                              ║
    ║   ██╗  ██╗ █████╗        ██████╗██╗  ██╗ ██████╗ ██╗    ██╗  ║
    ║   ██║ ██╔╝██╔══██╗      ██╔════╝██║  ██║██╔═══██╗██║    ██║  ║
    ║   █████╔╝ ███████║█████╗██║     ███████║██║   ██║██║ █╗ ██║  ║
    ║   ██╔═██╗ ██╔══██║╚════╝██║     ██╔══██║██║   ██║██║███╗██║  ║
    ║   ██║  ██╗██║  ██║      ╚██████╗██║  ██║╚██████╔╝╚███╔███╔╝  ║
    ║   ╚═╝  ╚═╝╚═╝  ╚═╝       ╚═════╝╚═╝  ╚═╝ ╚═════╝  ╚══╝╚══╝   ║
    ║                                                              ║
    ║        The Autonomous Engineering Brain                      ║
    ║        Feature 1: Architecture & Scaffolding                 ║
    ║                                                              ║
    ╚══════════════════════════════════════════════════════════════╝
    """
    print(banner)


def print_phase(phase: str, desc: str):
    icons = {
        "requirements_analysis": "📋",
        "architecture_design": "🏗️ ",
        "blueprint_generation": "📐",
        "scaffolding": "🔨",
        "pr_creation": "🔀",
        "complete": "✅",
    }
    print(f"\n{'─' * 60}")
    print(f"  {icons.get(phase, '⚙️')}  {desc}")
    print(f"{'─' * 60}\n")


async def run_agent(requirements: str, output_dir: str = "./output") -> dict:
    """Run the full architecture pipeline."""
    print_banner()
    print_phase("requirements_analysis", "Phase 1: Analyzing Requirements")

    pipeline = compile_architecture_pipeline()

    initial_state = {
        "user_requirements": requirements,
        "current_phase": "requirements_analysis",
        "errors": [],
        "services": [],
        "databases": [],
        "api_endpoints": [],
        "decisions": [],
        "scaffolded_files": [],
        "functional_requirements": [],
        "non_functional_requirements": [],
        "constraints": [],
    }

    final_state = {**initial_state}

    async for event in pipeline.astream(initial_state):
        for node_name, node_output in event.items():
            # Display progress
            if node_name == "analyze_requirements":
                print_phase("architecture_design", "Phase 2: Designing Architecture")
                print(f"  Project: {node_output.get('project_name', 'N/A')}")
                print(f"  Summary: {node_output.get('project_summary', 'N/A')[:120]}...")
                print(f"  Scale:   {node_output.get('target_scale', 'N/A')}")

            elif node_name == "design_architecture":
                print_phase("blueprint_generation", "Phase 3: Generating Blueprint")
                svcs = node_output.get("services", [])
                print(f"  Architecture: {node_output.get('architecture_style', 'N/A')}")
                print(f"  Services: {len(svcs)}")
                for s in svcs:
                    n = s.name if hasattr(s, "name") else s.get("name", "?")
                    l = s.language if hasattr(s, "language") else s.get("language", "?")
                    f = s.framework if hasattr(s, "framework") else s.get("framework", "?")
                    print(f"    • {n} ({l}/{f})")

            elif node_name == "generate_blueprint":
                print_phase("scaffolding", "Phase 4: Scaffolding Infrastructure")
                bp = node_output.get("blueprint_markdown", "")
                print(f"  Blueprint: {len(bp)} characters")

            elif node_name == "scaffold_infrastructure":
                files = node_output.get("scaffolded_files", [])
                print(f"  Files scaffolded: {len(files)}")
                if os.getenv("GITHUB_TOKEN") and os.getenv("GITHUB_REPO"):
                    print_phase("pr_creation", "Phase 5: Creating GitHub PR")
                else:
                    print_phase("complete", "Pipeline Complete (PR skipped — set GITHUB_TOKEN & GITHUB_REPO to enable)")

            elif node_name == "create_pr":
                print_phase("complete", "Pipeline Complete!")
                pr_url = node_output.get("pr_url", "")
                if pr_url:
                    print(f"  🔗 Pull Request: {pr_url}")

            # Error check
            errors = node_output.get("errors", [])
            if errors:
                print(f"\n  ❌ Errors in {node_name}:")
                for err in errors:
                    print(f"     • {err}")
                return {**final_state, **node_output}

            final_state.update(node_output)

    # Write to disk
    print(f"\n{'─' * 60}")
    print(f"  📁  Writing files to: {os.path.abspath(output_dir)}")
    print(f"{'─' * 60}\n")

    result = write_output(final_state, output_dir)
    print(f"\n  {result}")

    return final_state


def main():
    load_dotenv()

    if not os.getenv("OPENROUTER_API"):
        print("❌ OPENROUTER_API not set. Copy .env.example → .env and add your key.")
        sys.exit(1)

    if len(sys.argv) > 1:
        requirements = " ".join(sys.argv[1:])
    else:
        print_banner()
        print("Enter your project requirements (press Enter twice to submit):\n")
        lines = []
        while True:
            try:
                line = input()
                if line == "" and lines and lines[-1] == "":
                    break
                lines.append(line)
            except EOFError:
                break
        requirements = "\n".join(lines).strip()

    if not requirements:
        print("❌ No requirements provided.")
        sys.exit(1)

    output_dir = os.getenv("OUTPUT_DIR", "./output")
    asyncio.run(run_agent(requirements, output_dir))


if __name__ == "__main__":
    main()
