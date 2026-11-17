import logging
import asyncio
import hashlib
import uuid
from typing import List, Dict, Any
from agent.core.parser import CoreParser, CodeChunk
from agent.core.llm import invoke_llm
from agent.prompts.knowledge import CHUNK_SUMMARY_PROMPT
from agent.core.neo4j_client import Neo4jClient
from agent.core.vector_store import TwinVectorStore

logger = logging.getLogger("archon.core.knowledge")

class KnowledgeService:
    def __init__(self):
        self.parser = CoreParser()
        self.neo4j = Neo4jClient()
        self.vector_store = TwinVectorStore()

    async def process_file(self, repo: str, file_path: str, content: str) -> List[Dict[str, Any]]:
        """
        Parses a file, generates summaries for each chunk, and returns them.
        """
        logger.info(f"🧠 Processing knowledge for: {file_path} in repo {repo}")
        chunks = self.parser.parse_file(file_path, content)
        
        # We process chunks concurrently for speed
        tasks = [self._enrich_chunk(repo, file_path, chunk) for chunk in chunks]
        processed_chunks = await asyncio.gather(*tasks)
        
        logger.info(f"✨ Parsed {len(chunks)} chunks, enriched {len(processed_chunks)} for {file_path}")
        
        # UPSERT knowledge into Neo4j and PGVector
        await self.neo4j.upsert_repository_and_file(repo, file_path)
        for r in processed_chunks:
            logger.info(f"  -> Upserting chunk {r['name']} to Neo4j...")
            await self.neo4j.upsert_code_chunk(repo, file_path, r)
            
            # Extract and upsert relationships found by LLM
            relationships = r.get("relationships", [])
            if relationships:
                await self.neo4j.upsert_relationships(r["uuid"], relationships)
            
            await self.vector_store.upsert_chunk(r)
        
        return processed_chunks

    async def _enrich_and_upsert(self, repo: str, file_path: str, chunk: CodeChunk) -> Dict[str, Any]:
        """Enrich a single chunk and upsert it into Neo4j and PGVector immediately."""
        await self.neo4j.upsert_repository_and_file(repo, file_path)
        processed = await self._enrich_chunk(repo, file_path, chunk)
        await self.neo4j.upsert_code_chunk(repo, file_path, processed)
        await self.vector_store.upsert_chunk(processed)
        return processed

    def _generate_id_for_chunk(self, repo: str, file_path: str, chunk: CodeChunk) -> str:
        class_context = chunk.breadcrumbs.replace(" > ", "_") if chunk.breadcrumbs else "global"
        raw_id = f"{repo}_{file_path}_{class_context}_{chunk.name}"
        # Use deterministic UUID5 for Postgres UUID type compatibility
        namespace = uuid.NAMESPACE_DNS
        return str(uuid.uuid5(namespace, raw_id))

    async def _enrich_chunk(self, repo: str, file_path: str, chunk: CodeChunk) -> Dict[str, Any]:
        """
        Generates a summary for a single code chunk.
        """
        prompt = CHUNK_SUMMARY_PROMPT.format(
            file_path=file_path,
            breadcrumbs=chunk.breadcrumbs,
            code=chunk.content
        )
        
        try:
            response = await invoke_llm(prompt, temperature=0.1)
            # Try to strip markdown code blocks if the LLM adds them
            cleaned = response.replace("```json", "").replace("```", "").strip()
            
            import json
            data = json.loads(cleaned)
            summary = data.get("summary", "").replace("\n", " ").strip()
            relationships = data.get("relationships", [])
        except Exception as e:
            logger.error(f"Failed to summarize chunk {chunk.name}: {e}")
            summary = ""
            relationships = []

        chunk_id = self._generate_id_for_chunk(repo, file_path, chunk)

        return {
            "uuid": chunk_id,
            "repo": repo,
            "name": chunk.name,
            "type": chunk.type,
            "content": chunk.content,
            "start_line": chunk.start_line,
            "end_line": chunk.end_line,
            "signature": chunk.signature,
            "breadcrumbs": chunk.breadcrumbs,
            "file_path": file_path,
            "summary": summary,
            "relationships": relationships
        }

if __name__ == "__main__":
    # Test harness
    async def test():
        service = KnowledgeService()
        code = """
def add_user(username, email):
    # This adds a user to the database
    db.session.add(User(username=username, email=email))
    db.session.commit()
"""
        results = await service.process_file("test_repo", "user_service.py", code)
        for r in results:
            print(f"[{r['type']}] {r['name']} (ID: {r['id'][:8]}...): {r['summary']}")

    asyncio.run(test())
