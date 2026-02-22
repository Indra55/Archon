import os
import asyncio
import logging
from typing import List, Optional
from github import Github, GithubException
from dotenv import load_dotenv

import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from agent.core.knowledge_service import KnowledgeService
from agent.core.parser import CoreParser

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(name)-20s | %(levelname)-7s | %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("kachow.scripts.ingest")

load_dotenv()

async def ingest_repo():
    token = os.getenv("GITHUB_TOKEN")
    repo_name = os.getenv("GITHUB_REPO")
    branch = os.getenv("GITHUB_BRANCH", "main") # Default to main

    if not token or not repo_name:
        logger.error("❌ GITHUB_TOKEN or GITHUB_REPO not set in .env")
        return

    print(f"🚀 Starting full repository ingestion for: {repo_name} (branch: {branch})", flush=True)
    
    gh = Github(token)
    knowledge = KnowledgeService()
    parser = CoreParser()

    try:
        repo = await asyncio.to_thread(gh.get_repo, repo_name)
    except Exception as e:
        print(f"❌ Failed to access repository: {e}", flush=True)
        return

    # Recursive traversal
    files_to_process = []
    
    print("📂 Crawling repository tree...", flush=True)
    try:
        contents = await asyncio.to_thread(repo.get_contents, "", ref=branch)
        stack = contents if isinstance(contents, list) else [contents]
        
        while stack:
            content_file = stack.pop()
            if content_file.type == "dir":
                # Get directory contents
                dir_contents = await asyncio.to_thread(repo.get_contents, content_file.path, ref=branch)
                stack.extend(dir_contents)
            else:
                # Check if it's a supported source file
                if parser.get_language(content_file.path):
                    files_to_process.append(content_file.path)
                    
    except Exception as e:
        print(f"❌ Error during repository traversal: {e}", flush=True)
        return

    print(f"📊 Found {len(files_to_process)} source files to ingest.", flush=True)

    processed_count = 0
    error_count = 0
    
    for i, file_path in enumerate(files_to_process):
        print(f"[{i+1}/{len(files_to_process)}] Processing: {file_path}", flush=True)
        try:
            content_file = await asyncio.to_thread(repo.get_contents, file_path, ref=branch)
            file_content = content_file.decoded_content.decode("utf-8")
            
            await knowledge.process_file(repo_name, file_path, file_content)
            processed_count += 1
            
        except Exception as e:
            logger.error(f"  ❌ Failed to ingest {file_path}: {e}")
            error_count += 1
            
    logger.info(f"""
✅ Ingestion Finished!
   - Total files found: {len(files_to_process)}
   - Successfully processed: {processed_count}
   - Errors encountered: {error_count}
""")

if __name__ == "__main__":
    asyncio.run(ingest_repo())
