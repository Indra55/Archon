import logging
import os
import hashlib
import uuid
from typing import Dict, Any, List
from neo4j import AsyncGraphDatabase
from dotenv import load_dotenv

env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
load_dotenv(env_path)

logger = logging.getLogger("archon.core.neo4j")

class Neo4jClient:
    def __init__(self):
        uri = os.getenv("NEO4J_URI", "bolt://localhost:7687")
        user = os.getenv("NEO4J_USERNAME", "neo4j")
        password = os.getenv("NEO4J_PASSWORD", "password")
        self.test_mode = os.getenv("TEST_MODE", "false").lower() == "true"
        self.prefix = "Test_" if self.test_mode else ""
        self._schema_initialized = False
        
        try:
            self.driver = AsyncGraphDatabase.driver(uri, auth=(user, password))
        except Exception as e:
            logger.warning(f"Failed to initialize Neo4j driver: {e}")
            self.driver = None

    async def close(self):
        if self.driver:
            await self.driver.close()

    async def init_schema(self):
        """Standardized schema constraints with universal BaseNode label."""
        if not self.driver: return
        query_constraints = [
            f"CREATE CONSTRAINT base_node_uuid IF NOT EXISTS FOR (n:{self.prefix}BaseNode) REQUIRE n.uuid IS UNIQUE",
            f"CREATE INDEX IF NOT EXISTS FOR (n:{self.prefix}BaseNode) ON (n.name)",
        ]
        try:
            async with self.driver.session() as session:
                for q in query_constraints:
                    await session.run(q)
                self._schema_initialized = True
        except Exception as e:
            logger.warning(f"Neo4j init schema failed: {e}")

    async def upsert_repository_and_file(self, repo_name: str, file_path: str):
        """Standardized upsert with temporal properties and status."""
        if not self.driver: return
        if not self._schema_initialized:
            await self.init_schema()
        
        # Use deterministic UUID5 for Postgres UUID type compatibility
        namespace = uuid.NAMESPACE_DNS
        repo_uuid = str(uuid.uuid5(namespace, f"repo_{repo_name}"))
        file_uuid = str(uuid.uuid5(namespace, f"file_{repo_name}_{file_path}"))
        
        query = f"""
        MERGE (r:{self.prefix}Repository:{self.prefix}BaseNode {{uuid: $repo_uuid}})
        SET r.name = $repo_name,
            r.type = 'repository',
            r.status = 'active',
            r.created_at = coalesce(r.created_at, timestamp()),
            r.updated_at = timestamp(),
            r.valid_from = coalesce(r.valid_from, timestamp())
        
        MERGE (f:{self.prefix}File:{self.prefix}BaseNode {{uuid: $file_uuid}})
        SET f.path = $file_path,
            f.name = $file_path,
            f.type = 'file',
            f.status = 'active',
            f.created_at = coalesce(f.created_at, timestamp()),
            f.updated_at = timestamp(),
            f.valid_from = coalesce(f.valid_from, timestamp())
        
        MERGE (f)-[:PART_OF]->(r)
        """
        try:
            async with self.driver.session() as session:
                res = await session.run(
                    query,
                    repo_uuid=repo_uuid,
                    file_uuid=file_uuid,
                    repo_name=repo_name,
                    file_path=file_path
                )
                summary = await res.consume()
                logger.info(f"  [Neo4j] Upserted Repository/File: nodes created: {summary.counters.nodes_created}, labels added: {summary.counters.labels_added}")
        except Exception as e:
            logger.warning(f"Neo4j UPSERT repo/file failed: {e}")

    async def upsert_code_chunk(self, repo_name: str, file_path: str, chunk_data: Dict[str, Any]):
        """
        Standardized CodeChunk upsert with uuid, timestamps, and status.
        """
        if not self.driver: return
        if not self._schema_initialized:
            await self.init_schema()
        
        # Extract file_uuid for proper matching (consistency)
        namespace = uuid.NAMESPACE_DNS
        file_uuid = str(uuid.uuid5(namespace, f"file_{repo_name}_{file_path}"))
        
        query = f"""
        MATCH (f:{self.prefix}File {{uuid: $file_uuid}})
        MERGE (c:{self.prefix}Chunk:{self.prefix}BaseNode {{uuid: $uuid}})
        SET c.name = $name,
            c.repo = $repo,
            c.type = $type,
            c.status = 'active',
            c.start_line = $start_line,
            c.end_line = $end_line,
            c.summary = $summary,
            c.content = $content,
            c.created_at = coalesce(c.created_at, timestamp()),
            c.updated_at = timestamp(),
            c.valid_from = coalesce(c.valid_from, timestamp())
        
        MERGE (c)-[:PART_OF]->(f)
        """
        try:
            async with self.driver.session() as session:
                res = await session.run(
                    query,
                    file_uuid=file_uuid,
                    uuid=chunk_data["uuid"], 
                    repo=repo_name,
                    name=chunk_data["name"],
                    type=chunk_data["type"],
                    start_line=chunk_data.get("start_line", 0),
                    end_line=chunk_data.get("end_line", 0),
                    summary=chunk_data.get("summary", ""),
                    content=chunk_data.get("content", ""),
                )
                summary = await res.consume()
                logger.info(f"  [Neo4j] Upserted Chunk {chunk_data['name']}: nodes created: {summary.counters.nodes_created}, properties set: {summary.counters.properties_set}")
        except Exception as e:
            logger.warning(f"Neo4j Standardized UPSERT chunk failed: {e}")

    async def upsert_relationships(self, chunk_uuid: str, relationships: List[Dict[str, str]]):
        """
        Create relationships from a source chunk to various targets extracted by LLM.
        Creates generic Concept nodes for targets if they don't exist.
        """
        if not self.driver or not relationships: return
        
        for rel in relationships:
            rel_type = rel.get("type")
            target_name = rel.get("target")
            description = rel.get("description", "")
            
            if not rel_type or not target_name: continue
            
            # Clean up relation type to be valid property name
            rel_type = rel_type.replace(" ", "_").upper()
            
            namespace = uuid.NAMESPACE_DNS
            target_uuid = str(uuid.uuid5(namespace, f"concept_{target_name}"))
            
            # Create a Concept node for the target, then relate the chunk to it
            query = f"""
            MATCH (source:{self.prefix}Chunk {{uuid: $chunk_uuid}})
            MERGE (target:{self.prefix}Concept:{self.prefix}BaseNode {{uuid: $target_uuid}})
            ON CREATE SET target.name = $target_name,
                          target.type = 'concept',
                          target.status = 'active',
                          target.created_at = timestamp(),
                          target.valid_from = timestamp()
            MERGE (source)-[r:{rel_type}]->(target)
            SET r.description = $description,
                r.updated_at = timestamp()
            """
            try:
                async with self.driver.session() as session:
                    await session.run(
                        query,
                        chunk_uuid=chunk_uuid,
                        target_uuid=target_uuid,
                        target_name=target_name,
                        description=description
                    )
            except Exception as e:
                logger.warning(f"Neo4j relationship upsert failed: {e}")

    async def upsert_question_answer(self, question: str, answer: str, chunk_uuids: List[str]):
        """
        Saves a user question and our answer into the graph, linking to context chunks.
        """
        if not self.driver: return
        
        namespace = uuid.NAMESPACE_DNS
        q_uuid = str(uuid.uuid5(namespace, f"question_{question}"))
        
        query = f"""
        MERGE (q:{self.prefix}Question:{self.prefix}BaseNode {{uuid: $q_uuid}})
        SET q.name = $question_short,
            q.question = $question,
            q.answer = $answer,
            q.type = 'question',
            q.status = 'active',
            q.created_at = coalesce(q.created_at, timestamp()),
            q.updated_at = timestamp()
        
        WITH q
        UNWIND $chunk_uuids AS chunk_id
        MATCH (c:{self.prefix}Chunk {{uuid: chunk_id}})
        MERGE (q)-[:RELATED_TO]->(c)
        """
        try:
            async with self.driver.session() as session:
                await session.run(
                    query,
                    q_uuid=q_uuid,
                    question=question,
                    question_short=question[:50] + ("..." if len(question) > 50 else ""),
                    answer=answer,
                    chunk_uuids=chunk_uuids
                )
        except Exception as e:
            logger.warning(f"Neo4j question/answer upsert failed: {e}")

    async def get_graph_data(self) -> Dict[str, Any]:
        """
        Retrieves the entire graph structure in a format compatible with React Flow / GraphCanvas.tsx.
        """
        if not self.driver: return {"nodes": [], "edges": []}
        
        node_query = f"""
        MATCH (n:{self.prefix}BaseNode)
        WHERE (n:{self.prefix}Repository OR n:{self.prefix}File OR n:{self.prefix}Chunk)
        RETURN n
        """
        
        edge_query = f"""
        MATCH (n:{self.prefix}BaseNode)-[r]->(m:{self.prefix}BaseNode)
        WHERE (n:{self.prefix}Repository OR n:{self.prefix}File OR n:{self.prefix}Chunk)
          AND (m:{self.prefix}Repository OR m:{self.prefix}File OR m:{self.prefix}Chunk)
        RETURN n.uuid AS source_id, m.uuid AS target_id, type(r) AS rel_type
        """
        
        nodes_map = {}
        edges_list = []
        
        try:
            async with self.driver.session() as session:
                # 1. Fetch all nodes
                result = await session.run(node_query)
                async for record in result:
                    n = record["n"]
                    n_id = n.get("uuid")
                    if not n_id or n_id in nodes_map:
                        continue
                    
                    label = n.get("name") or n.get("path") or n_id
                    raw_labels = list(n.labels)
                    raw_labels = [l for l in raw_labels if l != f"{self.prefix}BaseNode"]
                    raw_label = raw_labels[0].replace(self.prefix, "").lower() if raw_labels else "default"
                    
                    final_type = "default"
                    if raw_label == "repository":
                        final_type = "repository"
                    elif raw_label == "file":
                        final_type = "file"
                    elif raw_label == "chunk":
                        final_type = n.get("type", "chunk").lower()
                    
                    nodes_map[n_id] = {
                        "id": n_id,
                        "type": final_type,
                        "position": {"x": 0, "y": 0}, 
                        "data": {
                            "label": label,
                            "name": n.get("name", label),
                            "summary": n.get("summary", ""),
                            "path": n.get("path", ""),
                            "type": final_type,
                            "start_line": n.get("start_line"),
                            "end_line": n.get("end_line"),
                            "uuid": n_id,
                            "status": n.get("status"),
                            "created_at": n.get("created_at"),
                            "updated_at": n.get("updated_at"),
                            "valid_from": n.get("valid_from"),
                            "valid_to": n.get("valid_to")
                        }
                    }

                # 2. Fetch all edges
                result = await session.run(edge_query)
                async for record in result:
                    src = record["source_id"]
                    tgt = record["target_id"]
                    rel = record["rel_type"]
                    if src and tgt:
                        edge_id = f"e-{src}-{tgt}"
                        edges_list.append({
                            "id": edge_id,
                            "source": src,
                            "target": tgt,
                            "label": rel
                        })
                        
            return {
                "nodes": list(nodes_map.values()),
                "edges": edges_list
            }
        except Exception as e:
            logger.error(f"Failed to fetch graph data: {e}")
            return {"nodes": [], "edges": []}

if __name__ == "__main__":
    import asyncio
    
    async def test():
        client = Neo4jClient()
        logger.info("Initializing Neo4j schemas...")
        await client.init_schema()
        logger.info("Upserting repo and file...")
        await client.upsert_repository_and_file("test_repo", "src/main.py")
        
        chunk = {
            "id": "12345abcdef",
            "name": "init_system",
            "type": "function",
            "start_line": 10,
            "end_line": 20,
            "summary": "Initializes the system"
        }
        await client.upsert_code_chunk("test_repo", "src/main.py", chunk)
        logger.info("Graph upsert successful.")
        await client.close()

    logging.basicConfig(level=logging.INFO)
    asyncio.run(test())
