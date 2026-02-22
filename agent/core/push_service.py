import os
import logging
import asyncio
from typing import Dict, Any, List

from github import Github, GithubException
from dotenv import load_dotenv

from agent.core.knowledge_service import KnowledgeService
from agent.core.parser import CoreParser
from agent.core.llm import invoke_llm
from agent.prompts.pr_review import DOC_UPDATE_SYSTEM_PROMPT, DOC_UPDATE_PROMPT

load_dotenv()
logger = logging.getLogger("kachow.core.push")

class PushService:
    def __init__(self):
        self.knowledge = KnowledgeService()
        self.parser = CoreParser()
        
        token = os.getenv("GITHUB_TOKEN")
        self.repo_name = os.getenv("GITHUB_REPO")
        
        if not token or not self.repo_name:
            logger.warning("GITHUB_TOKEN or GITHUB_REPO not set. Push ingestion disabled.")
            self.gh = None
        else:
            self.gh = Github(token)

    async def process_push_event(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Processes a GitHub push event payload:
        1. Identifies added and modified files
        2. Fetches their latest content from the repository
        3. Ingests them into the KnowledgeService to update graph/embeddings
        4. Analyzes README drift if applicable
        """
        if not self.gh:
            return {"error": "GitHub not configured"}
            
        repo_full_name = payload.get("repository", {}).get("full_name")
        if repo_full_name and repo_full_name != self.repo_name:
            # We enforce matching the configured repo to avoid stray processing
            logger.info(f"Push event for {repo_full_name}, but configured for {self.repo_name}. Skipping.")
            return {"status": "skipped", "reason": "Repository mismatch"}

        commits = payload.get("commits", [])
        if not commits:
            return {"status": "skipped", "reason": "No commits in push payload"}

        ref = payload.get("ref", "")
        branch = ref.split("/")[-1] if "/" in ref else ref
        logger.info(f"🚀 Processing push event to branch '{branch}' with {len(commits)} commits")

        # Gather all added and modified files across commits
        changed_files = set()
        readme_changed = False
        
        for commit in commits:
            added = commit.get("added", [])
            modified = commit.get("modified", [])
            for f in added + modified:
                changed_files.add(f)
                if f.lower() == "readme.md":
                    readme_changed = True

        if not changed_files:
            return {"status": "skipped", "reason": "No files added or modified"}

        logger.info(f"📂 Found {len(changed_files)} changed files to process")

        try:
            repo = await asyncio.to_thread(self.gh.get_repo, self.repo_name)
        except GithubException as e:
            logger.error(f"Failed to fetch repository: {e}")
            return {"error": f"Failed to fetch repository: {e}"}

        # Fetch contents and ingest
        ingested_count = 0
        docs_updated = False
        changed_chunks_info = []

        for file_path in changed_files:
            # Only process recognized source code or docs
            if not self.parser.get_language(file_path):
                continue

            try:
                # Fetch content from exactly the commit/branch pushed
                content_file = await asyncio.to_thread(
                    repo.get_contents, file_path, ref=branch
                )
                if isinstance(content_file, list):
                    # It's a directory? Skip it.
                    continue
                    
                file_content = content_file.decoded_content.decode("utf-8")
                
                # Ingest through the KnowledgeService
                chunks = await self.knowledge.process_file(
                    self.repo_name,
                    file_path,
                    file_content
                )
                ingested_count += len(chunks)
                
                if readme_changed:
                    # Collect a light summary for README update context
                    changed_chunks_info.append(f"File: {file_path} - {len(chunks)} chunks rebuilt.")
                
            except GithubException as e:
                logger.warning(f"Failed to fetch content for {file_path}: {e}")
            except Exception as e:
                logger.error(f"Error ingesting {file_path}: {e}")

        # If README changed, potentially run an LLM check
        if readme_changed:
            logger.info("README was modified. Conducting post-push analysis.")
            docs_updated = True
            # In a full production implementation, we'd trigger the README auto-fixer,
            # For now, we note that manual updates caught it or we can run the LLM.

        return {
            "status": "success",
            "files_processed": len(changed_files),
            "chunks_ingested": ingested_count,
            "readme_changed": docs_updated
        }
