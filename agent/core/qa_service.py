import logging
import json
import asyncio
from typing import List, Dict, Any

from agent.core.neo4j_client import Neo4jClient
from agent.core.retriever import HybridRetriever
from agent.core.llm import invoke_llm

logger = logging.getLogger("kachow.qa_service")

QA_SYSTEM_PROMPT = """
You are an expert codebase answering agent. You will be provided with a user's question, 
and context gathered from the codebase knowledge graph. This context includes specific code chunks,
their file paths, and their relationships to other components.

Based ONLY on this provided context, answer the user's question.

Rules:
1. ALWAYS cite the file path(s) where code lives, e.g. `src/auth/jwt_manager.py`.
2. When the question asks about code or implementation, you MUST include the relevant code blocks in fenced markdown (e.g. ```python) directly in your answer.
3. If the context contains the code but it's long, only show the most relevant parts, but don't omit crucial logic.
4. Reference exact class names, function names, and line numbers when available in the context.
5. Provide a clear, technical, and concise explanation alongside the code blocks.
6. If the context does not contain enough information to answer definitively, say so clearly and mention which files were searched.

Format your answer in clear Markdown. Use headers and bold text for readability.
"""

class QAService:
    def __init__(self, neo4j: Neo4jClient, retriever: HybridRetriever):
        self.neo4j = neo4j
        self.retriever = retriever

    async def answer_question(self, question: str, history: List[Dict[str, str]] = None) -> Dict[str, Any]:
        """
        1. Find relevant focal nodes using vector search.
        2. Expand 1-2 hops in the graph to get relational context.
        3. Synthesize an answer using LLM, respecting conversation history.
        4. Save the Q&A pair back to the knowledge graph.
        """
        logger.info(f"Answering codebase question: {question}")
        history = history or []
        
        # 1. Semantic Search for Focal Nodes
        matches = await self.retriever.search(question, top_k=5)
        if not matches:
            return {
                "answer": "I couldn't find relevant code in the knowledge graph to answer your question.",
                "references": [],
                "source_files": []
            }

        # Collect the UUIDs of the starting nodes
        focal_uuids = [m.get("uuid") or m.get("id") for m in matches if m.get("uuid") or m.get("id")]
        
        # 2. Graph Traversal Context Extraction (1 hop for code context and relationships)
        graph_context_text = await self._gather_graph_context(focal_uuids, matches)

        # 3. Build Conversation Context
        history_text = ""
        if history:
            history_text = "\nCONVERSATION HISTORY:\n"
            for msg in history:
                role = msg.get("role", "user").upper()
                content = msg.get("content", "")
                history_text += f"{role}: {content}\n"

        # 4. Synthesize Answer
        prompt = f"""
{QA_SYSTEM_PROMPT}
{history_text}
CONEXT GATHERED FROM GRAPH:
{graph_context_text}

USER QUESTION:
{question}
"""
        
        try:
            answer = await invoke_llm(prompt, temperature=0.2)
        except Exception as e:
            logger.error(f"LLM failed to generate answer: {e}")
            answer = "Sorry, I encountered an error while trying to formulate an answer."
        
        # 4. Save to Knowledge Base (Learning Loop)
        if focal_uuids and "Sorry" not in answer:
             await self.neo4j.upsert_question_answer(question, answer, focal_uuids)

        # Build structured source_files for the frontend
        source_files = self._build_source_files(matches)

        return {
            "answer": answer,
            "references": matches,
            "source_files": source_files
        }

    def _build_source_files(self, matches: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Build a deduplicated list of source files with their code chunks."""
        files_map = {}
        for m in matches:
            fp = m.get("file_path", "unknown")
            if fp not in files_map:
                files_map[fp] = {"file_path": fp, "chunks": []}
            files_map[fp]["chunks"].append({
                "name": m.get("name", "unknown"),
                "type": m.get("type", "unknown"),
                "summary": m.get("summary", ""),
                "code_snippet": (m.get("code_content", "") or "")[:500]  # Truncate for API response
            })
        return list(files_map.values())

    async def _gather_graph_context(self, uuids: List[str], retriever_matches: List[Dict[str, Any]] = None) -> str:
        """
        Fetch the full code content of the given UUIDs and any directly related components
        up to 1 hop away (e.g. DEPENDS_ON, EXPOSES). Also fetch related past Questions.
        Uses code_content from retriever matches as the primary source of code.
        """
        if not self.neo4j.driver or not uuids:
            return "No graph context available."
        
        # Build a lookup of code_content from retriever matches
        code_lookup = {}
        if retriever_matches:
            for m in retriever_matches:
                uid = m.get("uuid") or m.get("id")
                if uid:
                    code_lookup[uid] = {
                        "code_content": m.get("code_content", ""),
                        "file_path": m.get("file_path", ""),
                        "summary": m.get("summary", ""),
                    }
            
        query = f"""
        UNWIND $uuids AS start_id
        MATCH (n:{self.neo4j.prefix}BaseNode {{uuid: start_id}})
        OPTIONAL MATCH (n)-[r]-(m:{self.neo4j.prefix}BaseNode)
        RETURN n, collect({{rel: type(r), desc: r.description, target: m.name, target_type: labels(m)[0]}}) as rels
        """
        
        context_parts = []
        try:
            async with self.neo4j.driver.session() as session:
                result = await session.run(query, uuids=uuids)
                async for record in result:
                    node = record["n"]
                    rels = record["rels"]
                    
                    if not node: continue
                    
                    node_uuid = node.get("uuid", "")
                    node_name = node.get("name", "Unknown")
                    node_labels = list(node.labels)
                    
                    # Handle previous question nodes that act as prior knowledge
                    if "Question" in "".join(node_labels):
                        past_q = node.get("question", "")
                        past_a = node.get("answer", "")
                        part = f"PREVIOUS KNOWLEDGE:\nQuestion: {past_q}\nAnswer: {past_a}\n"
                    else:
                        # Determine file_path
                        file_path = node.get("path", "") if node.get("type") == "file" else node.get("file_path", "")
                        # Fall back to retriever match data
                        if not file_path and node_uuid in code_lookup:
                            file_path = code_lookup[node_uuid].get("file_path", "")
                        
                        # Get code content: prioritize retriever match (from PGVector code_store),
                        # then Neo4j content property
                        code_content = ""
                        if node_uuid in code_lookup and code_lookup[node_uuid].get("code_content"):
                            code_content = code_lookup[node_uuid]["code_content"]
                        elif node.get("content"):
                            code_content = node.get("content")
                        
                        summary = node.get("summary", "")
                        if not summary and node_uuid in code_lookup:
                            summary = code_lookup[node_uuid].get("summary", "")
                        
                        part = f"COMPONENT: {node_name} ({node.get('type', 'unknown')})"
                        if file_path:
                            part += f"\nFILE: {file_path}"
                        if summary:
                            part += f"\nSUMMARY: {summary}"
                        if code_content:
                            part += f"\nCODE:\n```\n{code_content}\n```"
                        else:
                            # If this is a File or non-Chunk node, fetch its child Chunks
                            is_file = any("File" in lbl for lbl in node_labels)
                            is_chunk = any("Chunk" in lbl for lbl in node_labels)
                            
                            if is_file and not is_chunk:
                                child_query = f"""
                                MATCH (c:{self.neo4j.prefix}Chunk)-[:PART_OF]->(f:{self.neo4j.prefix}File {{uuid: $file_uuid}})
                                RETURN c.name as name, c.type as type, c.content as code, c.summary as summary
                                """
                                child_result = await session.run(child_query, file_uuid=node_uuid)
                                child_parts = []
                                async for child in child_result:
                                    child_code = child["code"] or ""
                                    child_name = child["name"] or "unknown"
                                    child_type = child["type"] or "unknown"
                                    if child_code:
                                        child_parts.append(f"  # {child_name} ({child_type})\n```\n{child_code}\n```")
                                    elif child["summary"]:
                                        child_parts.append(f"  # {child_name} ({child_type}): {child['summary']}")
                                
                                if child_parts:
                                    part += "\nCODE CHUNKS:\n" + "\n".join(child_parts)
                                else:
                                    part += "\nCODE: (not available)"
                            else:
                                part += "\nCODE: (not available)"
                        part += "\n"
                    
                    if rels and rels[0].get('target'):
                        part += "RELATIONSHIPS:\n"
                        for r in rels:
                            if r.get("target"):
                                desc = f" - {r.get('desc')}" if r.get('desc') else ""
                                part += f"- {r.get('rel')} -> {r.get('target')} ({r.get('target_type')}){desc}\n"
                    
                    context_parts.append(part)
                    
        except Exception as e:
            logger.error(f"Failed to gather graph context: {e}")
            return "Error gathering graph context."
            
        return "\n---\n".join(context_parts)
