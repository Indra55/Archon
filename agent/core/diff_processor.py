import os
import logging
import asyncio
from typing import Dict, List, Any
from github import Github, GithubException
from dotenv import load_dotenv
from agent.core.parser import CoreParser
from agent.core.knowledge_service import KnowledgeService
from agent.core.neo4j_client import Neo4jClient

env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
load_dotenv(env_path)

logger = logging.getLogger("kachow.core.diff")

class DiffProcessor:
    def __init__(self):
        token = os.getenv("GITHUB_TOKEN")
        self.repo_name = os.getenv("GITHUB_REPO")
        
        if not token or not self.repo_name:
            logger.warning("GITHUB_TOKEN or GITHUB_REPO not set. DiffProcessor requires GitHub access.")
            self.gh = None
        else:
            self.gh = Github(token)
            
        self.parser = CoreParser()
        self.knowledge = KnowledgeService()

    async def _fetch_file_content(self, repo, sha: str, file_path: str) -> str:
        """Fetch raw file content at a specific commit SHA."""
        try:
            # We must use run_in_executor if we're calling synchronous PyGithub methods
            # but for simplicity in this synchronous SDK we'll just await a wrapper or block briefly.
            # PyGithub is synchronous, so in a real async high-throughput app, wrap with asyncio.to_thread.
            content = await asyncio.to_thread(repo.get_contents, file_path, ref=sha)
            return content.decoded_content.decode('utf-8')
        except GithubException as e:
            if e.status == 404:
                return "" # File didn't exist in that commit (e.g., newly created)
            logger.error(f"Failed to fetch {file_path} at {sha}: {e}")
            return ""

    async def process_commit(self, commit_sha: str):
        """
        Process a specific commit: identify changed files, compare ASTs, and update Neo4j/Embeddings.
        """
        if not self.gh:
            return
            
        try:
            repo = await asyncio.to_thread(self.gh.get_repo, self.repo_name)
            commit = await asyncio.to_thread(repo.get_commit, commit_sha)
            if not commit.parents:
                logger.warning(f"Commit {commit_sha} has no parents, treating all files as added.")
                parent_sha = None
            else:
                parent_sha = commit.parents[0].sha
        except Exception as e:
            logger.error(f"Failed to retrieve commit {commit_sha} from {self.repo_name}: {e}")
            return

        logger.info(f"🔍 Analyzing commit {commit_sha} ({len(commit.files)} files changed)")
        
        for file in commit.files:
            file_path = file.filename
            
            # Skip non-code files (configurable based on what CoreParser supports)
            if not self.parser.get_language(file_path):
                continue
                
            status = file.status
            logger.info(f"File {file_path} was {status}")
            
            old_chunks = {}
            new_chunks = {}
            
            if status in ["modified", "removed"] and parent_sha:
                old_content = await self._fetch_file_content(repo, parent_sha, file_path)
                if old_content:
                    parsed = self.parser.parse_file(file_path, old_content)
                    for c in parsed:
                        cid = self.knowledge._generate_id_for_chunk(self.repo_name, file_path, c)
                        old_chunks[cid] = c
                        
            if status in ["added", "modified"]:
                new_content = await self._fetch_file_content(repo, commit_sha, file_path)
                if new_content:
                    parsed = self.parser.parse_file(file_path, new_content)
                    for c in parsed:
                        cid = self.knowledge._generate_id_for_chunk(self.repo_name, file_path, c)
                        new_chunks[cid] = c
            
            # 1. Deleted Chunks
            deleted_ids = set(old_chunks.keys()) - set(new_chunks.keys())
            for did in deleted_ids:
                logger.info(f"🗑️ Function deleted: {old_chunks[did].name}")
                # TODO: Implement soft-delete in Neo4j and PGVector
                
            # 2. Added Chunks
            added_ids = set(new_chunks.keys()) - set(old_chunks.keys())
            for aid in added_ids:
                logger.info(f"✨ Function added: {new_chunks[aid].name}")
                await self.knowledge._enrich_and_upsert(self.repo_name, file_path, new_chunks[aid])
                
            # 3. Modified Chunks
            common_ids = set(old_chunks.keys()).intersection(set(new_chunks.keys()))
            for cid in common_ids:
                if old_chunks[cid].content != new_chunks[cid].content:
                    logger.info(f"🔄 Function modified: {new_chunks[cid].name}")
                    await self.knowledge._enrich_and_upsert(self.repo_name, file_path, new_chunks[cid])
                else:
                    logger.debug(f"⏭️ Function unmodified: {new_chunks[cid].name}")

if __name__ == "__main__":
    async def test():
        # Requires a valid commit SHA from your repository to test
        processor = DiffProcessor()
        # Find a commit SHA from your GITHUB_REPO. We'll use a dummy output here.
        # await processor.process_commit("YOUR_COMMIT_SHA")
        logger.info("DiffProcessor ready.")

    logging.basicConfig(level=logging.INFO)
    asyncio.run(test())
