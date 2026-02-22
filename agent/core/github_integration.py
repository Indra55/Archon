"""
KA-CHOW Core — GitHub Integration

Reusable GitHub PR creation used by ANY pipeline.
Any pipeline that produces scaffolded_files + blueprint can call this.
"""

from __future__ import annotations

import logging
import os
from datetime import datetime
from typing import Any

from github import Github, GithubException

logger = logging.getLogger("kachow.github")


async def create_pull_request(state: dict[str, Any]) -> dict[str, Any]:
    """
    Reusable agent node: Create a GitHub PR with all scaffolded files.

    Expected state keys:
      - project_name (str)
      - project_summary (str)
      - blueprint_markdown (str)
      - scaffolded_files (list of ScaffoldedFile or dicts)
      - scaffold_summary (str)
      - architecture_style (str, optional)
      - services (list, optional)
      - databases (list, optional)
      - decisions (list, optional)
      - tech_stack_rationale (str, optional)

    Required env vars:
      - GITHUB_TOKEN
      - GITHUB_REPO (owner/repo format)
    """
    logger.info("🔀 Creating GitHub Pull Request...")

    repo_name = os.getenv("GITHUB_REPO")
    if not repo_name:
        return {"errors": ["GITHUB_REPO not set (format: owner/repo)"]}

    token = os.getenv("GITHUB_TOKEN")
    if not token:
        return {"errors": ["GITHUB_TOKEN not set"]}

    project_name = state.get("project_name", "project")
    project_summary = state.get("project_summary", "")
    blueprint = state.get("blueprint_markdown", "")
    scaffolded_files = state.get("scaffolded_files", [])
    scaffold_summary = state.get("scaffold_summary", "")
    architecture_style = state.get("architecture_style", "")
    services = state.get("services", [])
    databases = state.get("databases", [])
    decisions = state.get("decisions", [])
    tech_stack_rationale = state.get("tech_stack_rationale", "")

    if not scaffolded_files and not blueprint:
        return {"errors": ["No scaffolded files or blueprint to commit"]}

    try:
        gh = Github(token)
        repo = gh.get_repo(repo_name)

        # 1. Create branch from default
        default_branch = repo.default_branch
        source = repo.get_branch(default_branch)
        timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
        branch_name = f"kachow/scaffold-{project_name}-{timestamp}"

        repo.create_git_ref(
            ref=f"refs/heads/{branch_name}",
            sha=source.commit.sha,
        )
        logger.info(f"  Created branch: {branch_name}")

        # 2. Commit all scaffolded files
        files_committed = []
        for sf in scaffolded_files:
            file_path = sf.path if hasattr(sf, "path") else sf.get("path", "")
            content = sf.content if hasattr(sf, "content") else sf.get("content", "")
            desc = sf.description if hasattr(sf, "description") else sf.get("description", "")

            if not file_path or not content:
                continue

            try:
                existing = repo.get_contents(file_path, ref=branch_name)
                repo.update_file(
                    path=file_path,
                    message=f"chore(scaffold): update {file_path}\n\n{desc}",
                    content=content, sha=existing.sha, branch=branch_name,
                )
            except GithubException:
                repo.create_file(
                    path=file_path,
                    message=f"chore(scaffold): add {file_path}\n\n{desc}",
                    content=content, branch=branch_name,
                )
            files_committed.append(file_path)
            logger.info(f"  Committed: {file_path}")

        # 3. Commit blueprint
        if blueprint:
            bp_path = "docs/BLUEPRINT.md"
            try:
                existing = repo.get_contents(bp_path, ref=branch_name)
                repo.update_file(bp_path, "docs: update blueprint", blueprint,
                                 existing.sha, branch=branch_name)
            except GithubException:
                repo.create_file(bp_path, "docs: add blueprint", blueprint,
                                 branch=branch_name)
            files_committed.append(bp_path)

        # 4. Build rich PR body
        pr_body = _build_pr_body(
            project_name=project_name,
            project_summary=project_summary,
            architecture_style=architecture_style,
            services=services,
            databases=databases,
            decisions=decisions,
            tech_stack_rationale=tech_stack_rationale,
            scaffold_summary=scaffold_summary,
            files_committed=files_committed,
        )

        # 5. Create PR
        pr = repo.create_pull(
            title=f"🏗️ [{project_name}] Architecture Scaffold — {architecture_style}",
            body=pr_body,
            head=branch_name,
            base=default_branch,
        )

        try:
            pr.add_to_labels("kachow", "architecture", "scaffold")
        except GithubException:
            pass

        logger.info(f"  ✅ PR created: {pr.html_url}")

        return {
            "pr_url": pr.html_url,
            "pr_number": pr.number,
            "branch_name": branch_name,
            "files_committed": files_committed,
            "current_phase": "complete",
        }

    except Exception as e:
        logger.error(f"PR creation failed: {e}")
        return {"errors": [f"PR creation failed: {str(e)}"]}


def _build_pr_body(
    project_name: str,
    project_summary: str,
    architecture_style: str,
    services: list,
    databases: list,
    decisions: list,
    tech_stack_rationale: str,
    scaffold_summary: str,
    files_committed: list[str],
) -> str:
    """Build a rich, well-documented PR body."""

    # Services table
    svc_rows = ""
    if services:
        for s in services:
            n = s.name if hasattr(s, "name") else s.get("name", "?")
            lang = s.language if hasattr(s, "language") else s.get("language", "?")
            fw = s.framework if hasattr(s, "framework") else s.get("framework", "?")
            resp = s.responsibility if hasattr(s, "responsibility") else s.get("responsibility", "?")
            port = s.port if hasattr(s, "port") else s.get("port", "?")
            svc_rows += f"| `{n}` | {lang} | {fw} | {resp} | {port} |\n"
    else:
        svc_rows = "| _(no services scaffolded)_ | — | — | — | — |\n"

    # Databases table
    db_rows = ""
    if databases:
        for d in databases:
            engine = d.engine if hasattr(d, "engine") else d.get("engine", "?")
            purpose = d.purpose if hasattr(d, "purpose") else d.get("purpose", "?")
            owner = d.owned_by if hasattr(d, "owned_by") else d.get("owned_by", "?")
            db_rows += f"| {engine} | {purpose} | `{owner}` |\n"

    # Decisions list
    decisions_md = ""
    if decisions:
        for dec in decisions:
            title = dec.title if hasattr(dec, "title") else dec.get("title", "?")
            decision = dec.decision if hasattr(dec, "decision") else dec.get("decision", "?")
            rationale = dec.rationale if hasattr(dec, "rationale") else dec.get("rationale", "?")
            decisions_md += f"- **{title}**: {decision}\n  - _Rationale_: {rationale}\n"

    # File tree organized by category
    service_files = sorted(f for f in files_committed if f.startswith("services/"))
    k8s_files = sorted(f for f in files_committed if f.startswith("k8s/"))
    doc_files = sorted(f for f in files_committed if f.startswith("docs/"))
    other_files = sorted(f for f in files_committed if f not in service_files + k8s_files + doc_files)

    file_tree = ""
    if service_files:
        file_tree += "**Service Code:**\n" + "\n".join(f"  - `{f}`" for f in service_files) + "\n\n"
    if k8s_files:
        file_tree += "**Kubernetes Manifests:**\n" + "\n".join(f"  - `{f}`" for f in k8s_files) + "\n\n"
    if doc_files:
        file_tree += "**Documentation:**\n" + "\n".join(f"  - `{f}`" for f in doc_files) + "\n\n"
    if other_files:
        file_tree += "**Infrastructure & Config:**\n" + "\n".join(f"  - `{f}`" for f in other_files) + "\n\n"

    pr_body = f"""## 🏗️ KA-CHOW: Architecture Scaffold for `{project_name}`

> Auto-generated by **KA-CHOW: The Autonomous Engineering Brain**

### 📋 Project Overview
{project_summary if project_summary else '_No summary available._'}

### 🏛️ Architecture: **{architecture_style or 'N/A'}**

### 🧩 Services
| Service | Language | Framework | Responsibility | Port |
|---------|----------|-----------|----------------|------|
{svc_rows}
"""

    if db_rows:
        pr_body += f"""### 🗄️ Databases
| Engine | Purpose | Owned By |
|--------|---------|----------|
{db_rows}
"""

    if tech_stack_rationale:
        # Truncate if very long
        rationale_display = tech_stack_rationale[:500]
        if len(tech_stack_rationale) > 500:
            rationale_display += "... _(see BLUEPRINT.md for full details)_"
        pr_body += f"""### 🔧 Tech Stack Rationale
{rationale_display}

"""

    if decisions_md:
        pr_body += f"""### 📝 Key Architecture Decisions
{decisions_md}
"""

    pr_body += f"""### 📁 Files ({len(files_committed)})
{file_tree}
### 📐 Blueprint
See [`docs/BLUEPRINT.md`](docs/BLUEPRINT.md) for the full architecture blueprint including:
- Detailed service catalog & data architecture
- API design with request/response contracts
- Communication patterns (sync vs async)
- Security architecture & observability strategy
- Getting started guide

### 📊 Scaffold Summary
```
{scaffold_summary}
```

### ✅ Merge Checklist
- [ ] Review architecture decisions in BLUEPRINT.md
- [ ] Verify service definitions and responsibilities
- [ ] Check Dockerfiles and build configurations
- [ ] Review K8s resource limits and health checks
- [ ] Verify API endpoint definitions
- [ ] Review database schema choices
- [ ] Test `docker compose up` locally

---
*Generated by KA-CHOW • The Autonomous Engineering Brain*
"""

    return pr_body
