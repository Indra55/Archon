import logging
import asyncio
import os
import re
from typing import List, Dict, Any, Optional

from agent.core.vector_store import TwinVectorStore
from agent.core.neo4j_client import Neo4jClient

logger = logging.getLogger("kachow.core.retriever")

class HybridRetriever:
    def __init__(self):
        self.vector_store = TwinVectorStore()
        self.neo4j = Neo4jClient()

    async def search(self, query: str, top_k: int = 5, repo: Optional[str] = None) -> List[Dict[str, Any]]:
        if repo is None:
            repo = os.getenv("GITHUB_REPO")
            
        logger.info(f"🔎 STARTING SEARCH: '{query}' (repo: {repo or 'ALL'})")
        
        # Step 1: Vector Search on both Code and Summary twin embeddings
        summary_docs, code_docs = [], []
        try:
            logger.info("  Vector Store: Searching...")
            summary_results_task = self.vector_store.search(query, store_type="summary", top_k=top_k, repo=repo)
            code_results_task = self.vector_store.search(query, store_type="code", top_k=top_k, repo=repo)
            
            # 15 second timeout for vector search
            summary_docs, code_docs = await asyncio.wait_for(
                asyncio.gather(summary_results_task, code_results_task),
                timeout=15.0
            )
            logger.info(f"📊 Vector search results — Summary: {len(summary_docs)}, Code: {len(code_docs)}")
        except asyncio.TimeoutError:
            logger.error("  Vector Store: TIMEOUT after 15s")
        except Exception as e:
            logger.error(f"  Vector Store: FAILED: {e}")

        # Step 2: Combine, deduplicate, and score
        combined_chunks = {}
        for doc in summary_docs:
            cid = doc.metadata.get("uuid") or doc.metadata.get("id")
            if cid and cid not in combined_chunks:
                combined_chunks[cid] = doc.metadata
                combined_chunks[cid]["summary"] = doc.page_content  # Summary text
                combined_chunks[cid]["content"] = doc.page_content  # Legacy alias for impact_service
                combined_chunks[cid]["code_content"] = ""  # Will be filled by code_docs or Neo4j
                combined_chunks[cid]["score"] = 1.0
                
        for doc in code_docs:
            cid = doc.metadata.get("uuid") or doc.metadata.get("id")
            if cid and cid not in combined_chunks:
                combined_chunks[cid] = doc.metadata
                combined_chunks[cid]["code_content"] = doc.page_content  # Raw source code
                combined_chunks[cid]["content"] = doc.page_content  # Legacy alias
                combined_chunks[cid]["summary"] = doc.metadata.get("summary", "")
                combined_chunks[cid]["score"] = 0.8
            elif cid:
                # Found in both stores — boost score and fill in code if missing
                combined_chunks[cid]["score"] += 0.5
                if not combined_chunks[cid].get("code_content"):
                    combined_chunks[cid]["code_content"] = doc.page_content

        sorted_chunks = sorted(combined_chunks.values(), key=lambda x: x["score"], reverse=True)[:top_k]
        logger.info(f"📊 Initial candidates count: {len(sorted_chunks)}")

        # Step 2.5: Keyword Fallback
        if not sorted_chunks and self.neo4j.driver:
            logger.info("  ⚠️ Vector results empty. Falling back to Keyword Search in Neo4j...")
            try:
                words = re.findall(r'[A-Z]?[a-z0-9]+|[A-Z]+(?=[A-Z][a-z0-9]|\b)', query)
                # Filter out common stop words and very short fragments
                stop_words = {"what", "if", "we", "change", "the", "a", "an", "is", "of", "to", "in", "it", "that", "this", "replace", "remove", "deprecate", "update", "does", "how", "where", "which", "when", "can", "has", "have", "for", "with", "code", "function", "field", "method", "class"}
                keywords = [w.lower() for w in words if w.lower() not in stop_words and len(w) >= 3]
                
                logger.info(f"  Extracted Keywords for Fallback: {keywords}")
                
                if keywords:
                    # Phase 1: Find Chunk nodes matching keywords
                    chunk_query = f"""
                    MATCH (c:{self.neo4j.prefix}Chunk)
                    WHERE (c.repo = $repo OR $repo IS NULL) AND
                          any(k in $keywords WHERE 
                            toLower(c.name) CONTAINS k OR 
                            toLower(coalesce(c.summary, "")) CONTAINS k
                          )
                    OPTIONAL MATCH (c)-[:PART_OF]->(f:{self.neo4j.prefix}File)
                    RETURN c.uuid as uuid, c.name as name, c.type as type, 
                           c.summary as summary, c.content as code_content, 
                           f.path as file_path
                    LIMIT 5
                    """
                    
                    # Phase 2: Find File nodes matching keywords, then get their child Chunks
                    file_chunk_query = f"""
                    MATCH (f:{self.neo4j.prefix}File)
                    WHERE (f.repo = $repo OR $repo IS NULL) AND
                          any(k in $keywords WHERE 
                            toLower(f.name) CONTAINS k OR 
                            toLower(coalesce(f.path, "")) CONTAINS k
                          )
                    MATCH (c:{self.neo4j.prefix}Chunk)-[:PART_OF]->(f)
                    RETURN c.uuid as uuid, c.name as name, c.type as type,
                           c.summary as summary, c.content as code_content,
                           f.path as file_path
                    LIMIT 5
                    """
                    
                    seen_uuids = set()
                    async with self.neo4j.driver.session() as session:
                        # Phase 1: Direct chunk matches
                        result = await session.run(chunk_query, keywords=keywords, repo=repo)
                        async for record in result:
                            uid = record["uuid"]
                            if uid and uid not in seen_uuids:
                                seen_uuids.add(uid)
                                sorted_chunks.append({
                                    "uuid": uid,
                                    "name": record["name"],
                                    "type": record["type"],
                                    "summary": record["summary"] or "",
                                    "code_content": record["code_content"] or "",
                                    "content": record["code_content"] or record["summary"] or "", # Alias
                                    "file_path": record["file_path"],
                                    "score": 0.6
                                })
                        
                        # Phase 2: Chunks from matching files
                        result = await session.run(file_chunk_query, keywords=keywords, repo=repo)
                        async for record in result:
                            uid = record["uuid"]
                            if uid and uid not in seen_uuids:
                                seen_uuids.add(uid)
                                sorted_chunks.append({
                                    "uuid": uid,
                                    "name": record["name"],
                                    "type": record["type"],
                                    "summary": record["summary"] or "",
                                    "code_content": record["code_content"] or "",
                                    "content": record["code_content"] or record["summary"] or "", # Alias
                                    "file_path": record["file_path"],
                                    "score": 0.5
                                })
                    
                    if sorted_chunks:
                        logger.info(f"✅ Keyword fallback found {len(sorted_chunks)} chunks: {[c['name'] for c in sorted_chunks]}")
                    else:
                        logger.warning("❌ Keyword fallback found NO matches.")
                else:
                    logger.warning("  No valid keywords extracted from query")
            except Exception as e:
                logger.error(f"  Keyword fallback FAILED: {e}")

        # Step 3: Graph Expansion
        # For each top chunk, find the file it belongs to in Neo4j to give context.
        expanded_results = []
        
        if self.neo4j.driver:
            async with self.neo4j.driver.session() as session:
                for chunk in sorted_chunks:
                    try:
                        # Fetch file path, summary, AND code content from Neo4j
                        query_graph = f"""
                        MATCH (c:{self.neo4j.prefix}Chunk {{uuid: $chunk_id}})
                        OPTIONAL MATCH (c)-[:PART_OF]->(f:{self.neo4j.prefix}File)
                        RETURN f.path AS file_path, c.summary AS summary, c.content AS code_content, c.name AS name, c.type AS type
                        """
                        result = await session.run(query_graph, chunk_id=chunk.get("uuid") or chunk.get("id"))
                        record = await result.single()
                        
                        chunk_copy = dict(chunk)
                        if record:
                            chunk_copy["file_path"] = record["file_path"] or chunk.get("file_path", "unknown")
                            chunk_copy["summary"] = record["summary"] or chunk.get("summary", "")
                            # Fill in code_content from Neo4j if vector search didn't provide it
                            if not chunk_copy.get("code_content") and record["code_content"]:
                                chunk_copy["code_content"] = record["code_content"]
                        else:
                            chunk_copy["file_path"] = chunk.get("file_path", "unknown")
                            chunk_copy["summary"] = chunk.get("summary", "")
                            
                        # Final check for 'content' alias
                        if "content" not in chunk_copy:
                           chunk_copy["content"] = chunk_copy.get("code_content") or chunk_copy.get("summary") or ""
                            
                        expanded_results.append(chunk_copy)
                    except Exception as e:
                        logger.warning(f"Graph expansion failed for chunk {chunk.get('id', chunk.get('uuid'))}: {e}")
                        expanded_results.append(chunk)
        else:
            expanded_results = sorted_chunks

        logger.info(f"✅ Returned {len(expanded_results)} hybrid results.")
        return expanded_results

if __name__ == "__main__":
    async def test():
        retriever = HybridRetriever()
        results = await retriever.search("How is user authentication implemented?")
        for r in results:
            print(f"- [{r.get('score')}]: {r.get('name')} in {r.get('file_path')}")

    logging.basicConfig(level=logging.INFO)
    
    import sys
    import selectors
    if sys.platform == 'win32':
        # Psycopg3 async requires SelectorEventLoop on Windows
        loop_factory = lambda: asyncio.SelectorEventLoop(selectors.SelectSelector())
        asyncio.run(test(), loop_factory=loop_factory)
    else:
        asyncio.run(test())
