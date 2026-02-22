"""
KA-CHOW Core — PR Review Service

Automatically reviews Pull Requests against the knowledge graph:
1. Fetches PR diff from GitHub
2. Parses changed files with tree-sitter
3. Queries Neo4j for affected architecture components
4. Uses LLM to analyze changes for drift, undocumented code, etc.
5. Updates Neo4j node statuses (deprecated, superseded, modified)
6. Posts a review comment on the PR via GitHub API
"""

import os
import logging
import asyncio
import json
import hashlib
from datetime import datetime
from typing import Dict, List, Any, Optional

from github import Github, GithubException
from dotenv import load_dotenv

from agent.core.parser import CoreParser
from agent.core.neo4j_client import Neo4jClient
from agent.core.retriever import HybridRetriever
from agent.core.knowledge_service import KnowledgeService
from agent.core.llm import invoke_llm, parse_json_response
from agent.prompts.pr_review import PR_REVIEW_PROMPT, PR_REVIEW_SYSTEM_PROMPT, DOC_UPDATE_PROMPT, DOC_UPDATE_SYSTEM_PROMPT

env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
load_dotenv(env_path)

logger = logging.getLogger("kachow.core.pr_review")


class PRReviewService:
    def __init__(self, neo4j: Neo4jClient, retriever: HybridRetriever):
        self.neo4j = neo4j
        self.retriever = retriever
        self.parser = CoreParser()
        self.knowledge = KnowledgeService()

        token = os.getenv("GITHUB_TOKEN")
        self.repo_name = os.getenv("GITHUB_REPO")

        if not token or not self.repo_name:
            logger.warning("GITHUB_TOKEN or GITHUB_REPO not set. PR Review disabled.")
            self.gh = None
        else:
            self.gh = Github(token)

    async def review_pr(self, pr_number: int) -> Dict[str, Any]:
        """
        Full PR review pipeline:
        1. Fetch PR metadata and diff
        2. Parse changed files
        3. Query knowledge graph for context
        4. LLM analysis
        5. Update affected Neo4j nodes
        6. Post review comment on PR
        """
        if not self.gh:
            return {"error": "GitHub not configured"}

        logger.info(f"🔍 Starting PR review for #{pr_number}")

        # Step 1: Fetch PR data
        try:
            repo = await asyncio.to_thread(self.gh.get_repo, self.repo_name)
            pr = await asyncio.to_thread(repo.get_pull, pr_number)
            pr_files = await asyncio.to_thread(pr.get_files)
            pr_files = list(pr_files)
        except GithubException as e:
            logger.error(f"Failed to fetch PR #{pr_number}: {e}")
            return {"error": f"Failed to fetch PR: {e}"}

        logger.info(f"📄 PR #{pr_number}: '{pr.title}' — {len(pr_files)} files changed")

        # Step 2: Parse changed files and build diff summary
        changed_chunks = []
        pr_diff_parts = []

        for pf in pr_files:
            file_path = pf.filename
            status = pf.status  # added, modified, removed, renamed

            # Build diff text
            patch = pf.patch or "(binary or empty)"
            pr_diff_parts.append(f"### {file_path} ({status})\n```diff\n{patch}\n```")

            # Only parse code files
            if not self.parser.get_language(file_path):
                continue

            if status in ["added", "modified"]:
                try:
                    # Fetch the new file content from the PR's head branch
                    content_file = await asyncio.to_thread(
                        repo.get_contents, file_path, ref=pr.head.sha
                    )
                    file_content = content_file.decoded_content.decode("utf-8")
                    chunks = self.parser.parse_file(file_path, file_content)

                    for chunk in chunks:
                        changed_chunks.append({
                            "file_path": file_path,
                            "name": chunk.name,
                            "type": chunk.type,
                            "signature": chunk.signature,
                            "content": chunk.content,
                            "status": status,
                            "start_line": chunk.start_line,
                            "end_line": chunk.end_line,
                        })
                except Exception as e:
                    logger.warning(f"Failed to parse {file_path}: {e}")

        # Step 3: Query knowledge graph for existing architecture context
        architecture_context = await self._get_architecture_context(changed_chunks)

        # Step 4: LLM review
        changed_chunks_text = self._format_changed_chunks(changed_chunks)
        pr_diff_text = "\n\n".join(pr_diff_parts)

        # Truncate diff if too long (LLM context limits)
        if len(pr_diff_text) > 8000:
            pr_diff_text = pr_diff_text[:8000] + "\n\n... (diff truncated)"

        prompt = PR_REVIEW_PROMPT.format(
            architecture_context=architecture_context,
            pr_diff=pr_diff_text,
            changed_chunks=changed_chunks_text,
        )

        try:
            raw_response = await invoke_llm(prompt, temperature=0.2, system_message=PR_REVIEW_SYSTEM_PROMPT)
            review = parse_json_response(raw_response)
        except Exception as e:
            logger.error(f"LLM review failed: {e}")
            review = {
                "verdict": "COMMENT",
                "summary": "Automated review encountered an error. Manual review recommended.",
                "issues": [],
                "undocumented_components": [],
                "architecture_drift": [],
                "affected_nodes": [],
            }

        # Step 5: Update affected Neo4j nodes
        affected_nodes = review.get("affected_nodes", [])
        if affected_nodes:
            await self._update_affected_nodes(affected_nodes)

        # Step 6: Ingest new/modified code into the knowledge graph
        await self._ingest_pr_changes(changed_chunks, pr_files)

        # Step 7: Post review comment on PR
        comment_body = self._format_review_comment(review, pr_number)
        try:
            await asyncio.to_thread(pr.create_issue_comment, comment_body)
            logger.info(f"✅ Posted review comment on PR #{pr_number}")
        except Exception as e:
            logger.error(f"Failed to post PR comment: {e}")

        # Step 8: Auto-update documentation (README)
        doc_update_result = await self._update_documentation(
            repo, pr, changed_chunks, review, architecture_context
        )

        return {
            "pr_number": pr_number,
            "title": pr.title,
            "verdict": review.get("verdict", "COMMENT"),
            "review": review,
            "files_analyzed": len(pr_files),
            "chunks_parsed": len(changed_chunks),
            "nodes_updated": len(affected_nodes),
            "doc_update": doc_update_result,
        }

    async def _get_architecture_context(self, changed_chunks: List[Dict]) -> str:
        """Query the knowledge graph for components related to the changed code."""
        if not self.neo4j.driver:
            return "No architecture context available (Neo4j not connected)."

        context_parts = []
        seen_uuids = set()

        for chunk in changed_chunks[:5]:  # Limit to avoid overwhelming the LLM
            # Search for existing components matching the changed chunk names
            results = await self.retriever.search(
                f"{chunk['name']} {chunk['file_path']}", top_k=3
            )

            for r in results:
                uid = r.get("uuid", "")
                if uid in seen_uuids:
                    continue
                seen_uuids.add(uid)

                part = f"KNOWN COMPONENT: {r.get('name')} ({r.get('type', 'unknown')})"
                part += f"\n  File: {r.get('file_path', 'unknown')}"
                part += f"\n  Summary: {r.get('summary', 'No summary')}"
                if r.get("code_content"):
                    part += f"\n  Existing Code:\n```\n{r['code_content'][:500]}\n```"
                context_parts.append(part)

        # Also fetch architecture decisions (Concept nodes)
        if self.neo4j.driver:
            try:
                concept_query = f"""
                MATCH (n:{self.neo4j.prefix}Concept)
                RETURN n.name as name, n.summary as summary
                LIMIT 10
                """
                async with self.neo4j.driver.session() as session:
                    result = await session.run(concept_query)
                    async for record in result:
                        part = f"ARCHITECTURE CONCEPT: {record['name']}"
                        if record["summary"]:
                            part += f"\n  {record['summary']}"
                        context_parts.append(part)
            except Exception as e:
                logger.warning(f"Failed to fetch architecture concepts: {e}")

        return "\n\n".join(context_parts) if context_parts else "No existing architecture context found in knowledge graph."

    async def _update_affected_nodes(self, affected_nodes: List[Dict]):
        """Update Neo4j node statuses based on PR review findings."""
        if not self.neo4j.driver:
            return

        for node_info in affected_nodes:
            name = node_info.get("name", "")
            impact = node_info.get("impact", "modified")
            reason = node_info.get("reason", "")

            if not name:
                continue

            try:
                # Map impact to status
                status_map = {
                    "modified": "active",         # Still active but updated
                    "deprecated": "deprecated",
                    "superseded": "superseded",
                }
                new_status = status_map.get(impact, "active")

                query = f"""
                MATCH (n:{self.neo4j.prefix}BaseNode)
                WHERE toLower(n.name) = toLower($name)
                SET n.status = $status,
                    n.updated_at = timestamp()
                """

                # If deprecated or superseded, set valid_to
                if impact in ["deprecated", "superseded"]:
                    query += ", n.valid_to = timestamp()"

                async with self.neo4j.driver.session() as session:
                    result = await session.run(query, name=name, status=new_status)
                    summary = await result.consume()
                    if summary.counters.properties_set > 0:
                        logger.info(f"📝 Updated node '{name}' → status: {new_status} (reason: {reason})")
                    else:
                        logger.info(f"⚠️ Node '{name}' not found in graph for status update")

            except Exception as e:
                logger.warning(f"Failed to update node '{name}': {e}")

    async def _ingest_pr_changes(self, changed_chunks: List[Dict], pr_files: list):
        """Ingest new/modified code from the PR into the knowledge graph."""
        for chunk in changed_chunks:
            if chunk["status"] in ["added", "modified"]:
                try:
                    await self.knowledge.process_file(
                        self.repo_name,
                        chunk["file_path"],
                        chunk["content"]
                    )
                except Exception as e:
                    logger.warning(f"Failed to ingest {chunk['file_path']}: {e}")

    def _format_changed_chunks(self, chunks: List[Dict]) -> str:
        """Format changed chunks for the LLM prompt."""
        if not chunks:
            return "No parseable code chunks found in the changed files."

        parts = []
        for c in chunks:
            part = f"[{c['status'].upper()}] {c['type']}: {c['name']}\n"
            part += f"  File: {c['file_path']} (lines {c['start_line']}-{c['end_line']})\n"
            part += f"  Signature: {c['signature']}\n"
            # Include the code (truncated)
            code = c['content'][:600]
            part += f"  Code:\n```\n{code}\n```"
            parts.append(part)

        return "\n\n".join(parts)

    def _format_review_comment(self, review: Dict, pr_number: int) -> str:
        """Format the LLM review into a GitHub PR comment."""
        verdict = review.get("verdict", "COMMENT")
        verdict_emoji = {
            "APPROVE": "✅",
            "REQUEST_CHANGES": "🔴",
            "COMMENT": "💬",
        }

        lines = []
        lines.append(f"## {verdict_emoji.get(verdict, '🔍')} KA-CHOW Architecture Review — `{verdict}`\n")
        lines.append(review.get("summary", "No summary available."))
        lines.append("")

        # Issues
        issues = review.get("issues", [])
        if issues:
            lines.append("### 🚨 Issues Found\n")
            for i, issue in enumerate(issues, 1):
                severity_badge = {"critical": "🔴", "warning": "🟡", "info": "🔵"}.get(issue.get("severity"), "⚪")
                lines.append(f"{i}. {severity_badge} **{issue.get('severity', 'info').upper()}** — `{issue.get('file', 'unknown')}`")
                lines.append(f"   - **Component:** `{issue.get('component', 'unknown')}`")
                lines.append(f"   - **Issue:** {issue.get('issue', '')}")
                lines.append(f"   - **Suggestion:** {issue.get('suggestion', '')}")
                lines.append("")

        # Undocumented components
        undoc = review.get("undocumented_components", [])
        if undoc:
            lines.append("### 📝 Undocumented Components\n")
            lines.append("| File | Component | Type | Reason |")
            lines.append("|------|-----------|------|--------|")
            for u in undoc:
                lines.append(f"| `{u.get('file', '')}` | `{u.get('name', '')}` | {u.get('type', '')} | {u.get('reason', '')} |")
            lines.append("")

        # Architecture drift
        drift = review.get("architecture_drift", [])
        if drift:
            lines.append("### ⚠️ Architecture Drift Detected\n")
            for d in drift:
                lines.append(f"- **Pattern:** {d.get('pattern', '')}")
                lines.append(f"  - Existing decision: {d.get('existing_decision', '')}")
                lines.append(f"  - Violation: {d.get('violation', '')}")
                lines.append(f"  - Recommendation: {d.get('recommendation', '')}")
                lines.append("")

        # Affected nodes
        affected = review.get("affected_nodes", [])
        if affected:
            lines.append("### 🔄 Knowledge Graph Updates\n")
            lines.append("| Component | Impact | Reason |")
            lines.append("|-----------|--------|--------|")
            for a in affected:
                lines.append(f"| `{a.get('name', '')}` | {a.get('impact', '')} | {a.get('reason', '')} |")
            lines.append("")

        lines.append("---")
        lines.append("*Automated review by KA-CHOW Architecture Agent*")

        return "\n".join(lines)

    # ── Auto Documentation Update ─────────────────────────────────────────────

    async def _update_documentation(
        self, repo, pr, changed_chunks: List[Dict],
        review: Dict, architecture_context: str
    ) -> Dict[str, Any]:
        """
        Auto-update documentation after PR review:
        1. Fetch current README from the PR's head branch
        2. Analyze it against code changes and review findings
        3. Generate updated README via LLM
        4. Commit updated README to the PR branch
        """
        logger.info("📄 Starting auto-documentation update...")

        # 1. Fetch current README
        current_readme = await self._fetch_current_readme(repo, pr.head.ref)
        if not current_readme:
            current_readme = "# Project\n\nNo README found. This is a new project."
            logger.info("No existing README found — will create one.")

        # 2. Build context for the LLM
        code_changes_text = self._format_changed_chunks(changed_chunks)

        review_findings = f"Verdict: {review.get('verdict', 'N/A')}\n"
        review_findings += f"Summary: {review.get('summary', 'N/A')}\n"

        undoc = review.get("undocumented_components", [])
        if undoc:
            review_findings += "\nUndocumented Components:\n"
            for u in undoc:
                review_findings += f"  - {u.get('name')} ({u.get('type')}) in {u.get('file')}\n"

        drift = review.get("architecture_drift", [])
        if drift:
            review_findings += "\nArchitecture Drift:\n"
            for d in drift:
                review_findings += f"  - {d.get('pattern')}: {d.get('violation')}\n"

        affected = review.get("affected_nodes", [])
        if affected:
            review_findings += "\nAffected Components:\n"
            for a in affected:
                review_findings += f"  - {a.get('name')} → {a.get('impact')}\n"

        # 3. Call LLM for doc update
        prompt = DOC_UPDATE_PROMPT.format(
            current_readme=current_readme[:6000],  # Truncate if very long
            code_changes=code_changes_text[:4000],
            review_findings=review_findings,
            knowledge_context=architecture_context[:3000],
        )

        try:
            raw = await invoke_llm(prompt, temperature=0.2, system_message=DOC_UPDATE_SYSTEM_PROMPT)
            doc_result = parse_json_response(raw)
        except Exception as e:
            logger.error(f"Doc update LLM failed: {e}")
            return {"status": "error", "error": str(e)}

        updated_readme = doc_result.get("updated_readme", "")
        outdated_sections = doc_result.get("outdated_sections", [])
        change_summary = doc_result.get("change_summary", "")

        if not updated_readme:
            logger.warning("LLM returned empty updated README")
            return {"status": "skipped", "reason": "LLM returned empty README"}

        # 4. Commit updated README to the PR branch
        commit_success = await self._commit_updated_readme(
            repo, pr.head.ref, updated_readme, change_summary
        )

        # 5. Post a comment about the doc update
        if commit_success and outdated_sections:
            doc_comment = self._format_doc_update_comment(outdated_sections, change_summary)
            try:
                await asyncio.to_thread(pr.create_issue_comment, doc_comment)
            except Exception as e:
                logger.warning(f"Failed to post doc update comment: {e}")

        result = {
            "status": "updated" if commit_success else "failed",
            "outdated_sections": outdated_sections,
            "change_summary": change_summary,
        }
        logger.info(f"📄 Documentation update: {result['status']} — {change_summary}")
        return result

    async def _fetch_current_readme(self, repo, branch: str) -> Optional[str]:
        """Fetch the current README.md from the given branch."""
        readme_paths = ["README.md", "readme.md", "Readme.md"]
        for path in readme_paths:
            try:
                content_file = await asyncio.to_thread(
                    repo.get_contents, path, ref=branch
                )
                return content_file.decoded_content.decode("utf-8")
            except GithubException:
                continue
        return None

    async def _commit_updated_readme(
        self, repo, branch: str, new_content: str, change_summary: str
    ) -> bool:
        """Commit the updated README.md to the PR branch."""
        try:
            # Try to get existing README to update it
            try:
                existing = await asyncio.to_thread(
                    repo.get_contents, "README.md", ref=branch
                )
                await asyncio.to_thread(
                    repo.update_file,
                    "README.md",
                    f"docs: auto-update README\n\n{change_summary}",
                    new_content,
                    existing.sha,
                    branch=branch,
                )
            except GithubException:
                # README doesn't exist yet — create it
                await asyncio.to_thread(
                    repo.create_file,
                    "README.md",
                    f"docs: create README\n\n{change_summary}",
                    new_content,
                    branch=branch,
                )

            logger.info(f"✅ Committed updated README.md to branch '{branch}'")
            return True
        except Exception as e:
            logger.error(f"Failed to commit README: {e}")
            return False

    def _format_doc_update_comment(
        self, outdated_sections: List[Dict], change_summary: str
    ) -> str:
        """Format a PR comment describing the documentation updates."""
        lines = []
        lines.append("## 📄 KA-CHOW Auto Documentation Update\n")
        lines.append(f"{change_summary}\n")

        if outdated_sections:
            lines.append("### Sections Updated\n")
            lines.append("| Section | Action | Reason |")
            lines.append("|---------|--------|--------|")
            for s in outdated_sections:
                action_emoji = {"updated": "🔄", "added": "✨", "removed": "🗑️"}.get(s.get("action"), "📝")
                lines.append(f"| {s.get('section', '')} | {action_emoji} {s.get('action', '')} | {s.get('reason', '')} |")
            lines.append("")

        lines.append("> The `README.md` has been automatically updated in this PR branch.")
        lines.append("")
        lines.append("---")
        lines.append("*Auto-documentation by KA-CHOW Architecture Agent*")

        return "\n".join(lines)
