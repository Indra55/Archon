import os
import logging
import json
import asyncio
from typing import List, Dict, Any, Optional
import httpx

from agent.core.neo4j_client import Neo4jClient
from agent.core.retriever import HybridRetriever
from agent.core.llm import get_model_config

logger = logging.getLogger("archon.impact_service")
logger.info(">>> IMPACT_SERVICE MODULE LOADED — NEW FORMAT v2 <<<")
print(f"[DEBUG] impact_service.py loaded from: {__file__}")
print("[DEBUG] NEW FORMAT v2 — using snake_case keys")

class ImpactService:
    def __init__(self, neo4j: Neo4jClient, retriever: HybridRetriever):
        self.neo4j = neo4j
        self.retriever = retriever
        self.openrouter_url = "https://openrouter.ai/api/v1/chat/completions"
        # Check both potential key names
        self.api_key = os.getenv("OPENROUTER_API_KEY") or os.getenv("OPENROUTER_API")
        self.model = get_model_config()["model"]

    async def get_suggested_scenarios(self) -> List[str]:
        """Returns sample 'What-If' scenarios using LLM understanding of the project."""
        try:
            # Get some context from the graph
            graph_data = await self.neo4j.get_graph_data()
            nodes = graph_data.get("nodes", [])
            
            # Select some interesting nodes (files and chunks)
            # Filter for some diverse types
            sample_nodes = []
            for n in nodes:
                if len(sample_nodes) >= 15: break
                name = n["data"].get("name")
                if name and name not in sample_nodes:
                    sample_nodes.append(name)
            
            prompt = f"""
            Given the following components in the project knowledge graph: {', '.join(sample_nodes)}
            Generate 4 realistic and diverse 'What-If' architectural change scenarios that a developer might ask.
            Examples:
            - "What if we deprecate the /v1/users endpoint?"
            - "What if we change the userId field from Integer to UUID?"
            - "What if we replace the Redis cache with Memcached?"
            
            Return ONLY a JSON list of 4 strings. No markdown, no explanation.
            """
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    self.openrouter_url,
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "HTTP-Referer": "https://github.com/google/singularity",
                        "X-Title": "Singularity Impact Analyzer",
                    },
                    json={
                        **get_model_config(),
                        "messages": [{"role": "user", "content": prompt}],
                    },
                    timeout=10.0
                )
                res_data = response.json()
                content = res_data["choices"][0]["message"]["content"]
                content = content.replace("```json", "").replace("```", "").strip()
                scenarios = json.loads(content)
                return scenarios if isinstance(scenarios, list) else []
        except Exception as e:
            logger.warning(f"Failed to generate suggested scenarios: {e}")
            return [
                "Deprecate /v1/payments/charge",
                "Remove userId from Order schema",
                "Shut down the Notification Worker",
                "Change auth token from JWT to opaque string"
            ]

    async def analyze_impact(self, scenario: str) -> Dict[str, Any]:
        """Performs full impact analysis for a given scenario."""
        if not self.neo4j.driver:
            return {"error": "Neo4j not connected"}

        # 1. Identify Focal Point (Semantic Search)
        matches = await self.retriever.search(scenario)
        if not matches:
            return {"error": "I couldn't identify the specific code or API mentioned in your scenario."}
            
        focal_node = matches[0]
        focal_id = focal_node.get("uuid") or focal_node.get("id")
        
        # 2. Graph Traversal (Direct & Transitive)
        try:
            logger.info(f"  Propagating impact for focal_id: {focal_id}")
            impact_graph = await asyncio.wait_for(self._get_impact_propagation(focal_id), timeout=10.0)
            
            # Ensure focal node is always in the graph even if Neo4j lookup failed or it's disconnected
            if not impact_graph.get("nodes"):
                logger.warning(f"  Neo4j traversal found nothing for focal_id {focal_id}. Injecting from metadata.")
                ntype = focal_node.get("type", "module").lower()
                impact_graph["nodes"] = [{
                    "id": focal_id,
                    "label": focal_node.get("name") or focal_node.get("label", "unknown"),
                    "type": ntype,
                    "state": "direct",
                    "data": focal_node
                }]
                impact_graph["edges"] = []
        except asyncio.TimeoutError:
            logger.error("  Propagation TIMEOUT after 10s")
            return {"error": "Graph propagation took too long. The knowledge graph might be too large or complex for this scenario."}
        except Exception as e:
            logger.error(f"  Propagation FAILED: {e}")
            return {"error": f"Failed to traverse knowledge graph: {str(e)}"}
            
        # 3. LLM Report Generation
        try:
            logger.info("  Generating LLM report...")
            report = await asyncio.wait_for(self._generate_detailed_report(scenario, focal_node, impact_graph), timeout=100.0)
        except asyncio.TimeoutError:
            logger.error("  Report Generation TIMEOUT after 100s")
            # Return partial data so the UI can at least show the graph
            report = self._get_fallback_report(scenario, focal_node, impact_graph, "Report generation timed out.")
        except Exception as e:
            logger.error(f"  Report Generation FAILED: {e}")
            report = self._get_fallback_report(scenario, focal_node, impact_graph, f"Report generation failed: {str(e)}")
        
        logger.info(f"  Report keys being returned: {list(report.keys())}")
        return {
            "scenario": scenario,
            "focal_node": focal_node,
            "report": report,
            "graph": impact_graph
        }

    def _get_fallback_report(self, scenario: str, focal: Dict[str, Any], graph: Dict[str, Any], error_msg: str) -> Dict[str, Any]:
        """Generate a fallback report populated from graph traversal data using the standard template."""
        logger.info(">>> FALLBACK REPORT v2 CALLED <<<")
        import uuid
        from datetime import datetime, timezone
        
        nodes = graph.get("nodes", [])
        edges = graph.get("edges", [])
        direct = [n for n in nodes if n.get("state") == "direct"]
        transitive = [n for n in nodes if n.get("state") == "transitive"]
        
        directly_broken = []
        for i, n in enumerate(direct):
            directly_broken.append({
                "id": f"svc_{i+1}",
                "name": n.get("label", "Unknown"),
                "type": n.get("type", "module"),
                "reason": f"Directly connected to the focal component. This {n.get('type', 'component')} will break.",
                "breaking_change": "Direct dependency on the modified component",
                "severity": "HIGH"
            })
        
        transitively_affected = []
        for i, n in enumerate(transitive):
            focal_name = focal.get("name") or focal.get("label", "focal")
            transitively_affected.append({
                "id": f"ent_{i+1}",
                "name": n.get("label", "Unknown"),
                "dependency_path": [n.get("label", "?"), focal_name],
                "impact_reason": f"Transitively depends on a directly affected component ({n.get('type', 'component')}).",
                "severity": "MEDIUM"
            })
        
        complexity_score = min(100, len(direct) * 20 + len(transitive) * 10 + len(edges) * 3)
        risk = "CRITICAL" if complexity_score >= 75 else "HIGH" if complexity_score >= 50 else "MEDIUM" if complexity_score >= 25 else "LOW"
        migration = "COMPLEX" if complexity_score >= 66 else "MODERATE" if complexity_score >= 33 else "SIMPLE"
        
        return {
            "report_id": str(uuid.uuid4()),
            "query": scenario,
            "summary": {
                "directly_broken_count": len(direct),
                "transitively_affected_count": len(transitive),
                "affected_api_clients_count": 0,
                "risk_level": risk,
                "migration_complexity": migration,
                "confidence_score": 0.6
            },
            "impact_analysis": {
                "directly_broken_services": directly_broken,
                "transitively_affected": transitively_affected,
                "affected_api_clients": []
            },
            "schema_changes_required": {
                "before": [],
                "after": [],
                "migration_notes": "N/A - LLM analysis was unavailable."
            },
            "impact_visualization": {
                "nodes": [{"id": n.get("label", n["id"]), "label": n.get("label", ""), "type": n.get("type", "module"), "impact_type": "DIRECT" if n.get("state") == "direct" else "TRANSITIVE"} for n in nodes],
                "edges": [{"source": e.get("source", ""), "target": e.get("target", ""), "relation": e.get("label", "RELATES_TO"), "impact_type": "DIRECT"} for e in edges[:20]]
            },
            "risk_analysis": {
                "technical_risk": f"{len(direct)} components will directly break.",
                "operational_risk": f"{len(transitive)} downstream components affected.",
                "data_risk": "Unable to assess - LLM analysis unavailable.",
                "rollback_complexity": risk
            },
            "suggested_mitigation_steps": [
                {"step": 1, "title": "Review affected components", "description": "Review all directly affected components before making changes.", "priority": "HIGH"},
                {"step": 2, "title": "Add integration tests", "description": "Create integration tests covering affected dependency chains.", "priority": "HIGH"},
                {"step": 3, "title": "Notify dependent teams", "description": "Notify dependent team owners of the planned change.", "priority": "MEDIUM"},
            ],
            "ai_explanation": {
                "architecture_summary": f"Found {len(direct)} directly affected and {len(transitive)} transitively affected components. {error_msg}",
                "why_complexity_is_high": f"Score based on {len(direct)} direct + {len(transitive)} transitive dependencies + {len(edges)} edges.",
                "dependency_analysis_summary": f"Graph traversal from focal node identified {len(nodes)} total nodes in the impact zone."
            },
            "metadata": {
                "graph_snapshot_id": focal.get("uuid", "unknown"),
                "analyzed_at": datetime.now(timezone.utc).isoformat(),
                "model_version": "fallback-graph-only"
            }
        }

    async def _get_impact_propagation(self, focal_id: str) -> Dict[str, Any]:
        """Traverse the graph to find affected nodes."""
        # Query to find direct neighbors and neighbors-of-neighbors
        prefix = self.neo4j.prefix
        if prefix:
            query = f"""
            MATCH (f {{uuid: $focal_id}})
            OPTIONAL MATCH (f)-[r1]-(d)
            WHERE d:{prefix}BaseNode OR d:{prefix}File OR d:{prefix}Chunk OR d:{prefix}Repository
            OPTIONAL MATCH (d)-[r2]-(t)
            WHERE (t:{prefix}BaseNode OR t:{prefix}File OR t:{prefix}Chunk OR t:{prefix}Repository)
            AND NOT t.uuid = $focal_id
            RETURN f, collect(DISTINCT d) as direct, collect(DISTINCT t) as transitive, 
                collect(DISTINCT r1) as direct_rels, collect(DISTINCT r2) as transitive_rels
            """
        else:
            query = f"""
            MATCH (f {{uuid: $focal_id}})
            OPTIONAL MATCH (f)-[r1]-(d)
            WHERE d:BaseNode OR d:File OR d:Chunk OR d:Repository
            OPTIONAL MATCH (d)-[r2]-(t)
            WHERE (t:BaseNode OR t:File OR t:Chunk OR t:Repository)
            AND NOT t.uuid = $focal_id
            RETURN f, collect(DISTINCT d) as direct, collect(DISTINCT t) as transitive, 
                collect(DISTINCT r1) as direct_rels, collect(DISTINCT r2) as transitive_rels
            """
        
        nodes_map = {}
        edges = []
        
        try:
            async with self.neo4j.driver.session() as session:
                result = await session.run(query, focal_id=focal_id)
                record = await result.single()
                
                if not record or not record["f"]:
                    return {"nodes": [], "edges": []}
                
                # Add focal node
                f = record["f"]
                nodes_map[focal_id] = self._format_node(f, "direct")
                
                # Add direct nodes
                for r_node in record["direct"]:
                    if r_node:
                        uid = r_node.get("uuid")
                        if uid not in nodes_map:
                            nodes_map[uid] = self._format_node(r_node, "direct")
                            
                # Add transitive nodes
                for t_node in record["transitive"]:
                    if t_node:
                        uid = t_node.get("uuid")
                        if uid not in nodes_map:
                            nodes_map[uid] = self._format_node(t_node, "transitive")
                
                # Add relationships
                for r in record["direct_rels"]:
                    if r:
                        edges.append({
                            "id": f"e-{r.start_node.get('uuid')}-{r.end_node.get('uuid')}",
                            "source": r.start_node.get('uuid'),
                            "target": r.end_node.get('uuid'),
                            "label": r.type
                        })
                for r in record["transitive_rels"]:
                    if r:
                        edges.append({
                            "id": f"e-{r.start_node.get('uuid')}-{r.end_node.get('uuid')}",
                            "source": r.start_node.get('uuid'),
                            "target": r.end_node.get('uuid'),
                            "label": r.type
                        })
                        
            return {"nodes": list(nodes_map.values()), "edges": edges}
        except Exception as e:
            logger.error(f"Propagation traversal failed: {e}")
            return {"nodes": [], "edges": []}

    def _format_node(self, node, state: str) -> Dict[str, Any]:
        uid = node.get("uuid")
        raw_labels = list(node.labels)
        ntype = "default"
        for l in raw_labels:
            if "Repository" in l: ntype = "repository"
            elif "File" in l: ntype = "file"
            elif "Chunk" in l: ntype = node.get("type", "chunk").lower()
            
        return {
            "id": uid,
            "label": node.get("name") or node.get("path") or uid,
            "type": ntype,
            "state": state,
            "data": dict(node)
        }

    async def _generate_detailed_report(self, scenario: str, focal: Dict[str, Any], graph: Dict[str, Any]) -> Dict[str, Any]:
        """Uses LLM to generate a structured impact report in the standard template."""
        import uuid
        from datetime import datetime, timezone
        
        nodes = graph.get("nodes", [])
        edges = graph.get("edges", [])
        direct = [n for n in nodes if n["state"] == "direct"]
        transitive = [n for n in nodes if n["state"] == "transitive"]
        
        # Build rich context strings for the LLM
        direct_details = []
        for n in direct:
            d = n.get("data", {})
            direct_details.append(f"  - {n['label']} (type: {n['type']}, path: {d.get('path', d.get('file_path', 'N/A'))})")
        
        transitive_details = []
        for n in transitive:
            d = n.get("data", {})
            transitive_details.append(f"  - {n['label']} (type: {n['type']}, path: {d.get('path', d.get('file_path', 'N/A'))})")
        
        edge_details = []
        for e in edges[:30]:
            edge_details.append(f"  - {e.get('source', '?')} --[{e.get('label', 'RELATES_TO')}]--> {e.get('target', '?')}")
        
        focal_name = focal.get('name') or focal.get('label', 'unknown')
        focal_path = focal.get('file_path') or focal.get('path', 'N/A')
        
        prompt = f"""You are an expert software architect performing an impact analysis.

Scenario: "{scenario}"
Focal Component: {focal_name} (path: {focal_path})

Knowledge Graph Context:
- Total nodes in impact zone: {len(nodes)}
- Directly affected ({len(direct)}):
{chr(10).join(direct_details) if direct_details else '  (none found)'}
- Transitively affected ({len(transitive)}):
{chr(10).join(transitive_details) if transitive_details else '  (none found)'}
- Relationships:
{chr(10).join(edge_details) if edge_details else '  (none found)'}

Generate a detailed impact report as a SINGLE JSON object matching this EXACT structure:

{{
  "summary": {{
    "directly_broken_count": <int>,
    "transitively_affected_count": <int>,
    "affected_api_clients_count": <int>,
    "risk_level": "<LOW | MEDIUM | HIGH | CRITICAL>",
    "migration_complexity": "<SIMPLE | MODERATE | COMPLEX>",
    "confidence_score": <float 0.0-1.0>
  }},
  "impact_analysis": {{
    "directly_broken_services": [
      {{
        "id": "<string id>",
        "name": "<component name from the graph>",
        "type": "<service | module | class | function>",
        "reason": "<why it breaks>",
        "breaking_change": "<description of breaking change>",
        "severity": "<LOW | MEDIUM | HIGH>"
      }}
    ],
    "transitively_affected": [
      {{
        "id": "<string id>",
        "name": "<component name from the graph>",
        "dependency_path": ["entityA", "entityB", "entityC"],
        "impact_reason": "<explanation>",
        "severity": "<LOW | MEDIUM | HIGH>"
      }}
    ],
    "affected_api_clients": [
      {{
        "client_name": "<string>",
        "impact": "<NONE | PARTIAL | BREAKING>",
        "how_used": "<description>",
        "affected_endpoints": ["/endpoint1", "/endpoint2"]
      }}
    ]
  }},
  "schema_changes_required": {{
    "before": [{{ "entity": "<name>", "field": "<field>", "type": "<type>", "constraints": "<constraints>" }}],
    "after": [{{ "entity": "<name>", "field": "<field>", "type": "<new type>", "constraints": "<constraints>" }}],
    "migration_notes": "<description>"
  }},
  "risk_analysis": {{
    "technical_risk": "<explanation>",
    "operational_risk": "<explanation>",
    "data_risk": "<explanation>",
    "rollback_complexity": "<LOW | MEDIUM | HIGH>"
  }},
  "suggested_mitigation_steps": [
    {{
      "step": <int>,
      "title": "<short title>",
      "description": "<detailed description>",
      "priority": "<HIGH | MEDIUM | LOW>"
    }}
  ],
  "ai_explanation": {{
    "architecture_summary": "<natural language reasoning>",
    "why_complexity_is_high": "<explicit reasoning>",
    "dependency_analysis_summary": "<explanation>"
  }}
}}

RULES:
1. directly_broken_services MUST have at least 1 entry if directly affected nodes exist. Use actual names from the graph.
2. transitively_affected MUST have at least 1 entry if transitively affected nodes exist. dependency_path must show the chain.
3. affected_api_clients should list 2-4 plausible consumers.
4. suggested_mitigation_steps should list 3-5 actionable steps.
5. Return ONLY valid JSON. No markdown fences, no explanation outside JSON."""
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    self.openrouter_url,
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "HTTP-Referer": "https://github.com/google/singularity",
                        "X-Title": "Singularity Impact Analyzer",
                    },
                    json={
                        **get_model_config(),
                        "messages": [{"role": "user", "content": prompt}],
                    },
                    timeout=50.0
                )
                res_data = response.json()
                content = res_data["choices"][0]["message"]["content"]
                content = content.replace("```json", "").replace("```", "").strip()
                report = json.loads(content)
                
                # Add top-level fields
                report["report_id"] = str(uuid.uuid4())
                report["query"] = scenario
                
                # Add metadata
                if "metadata" not in report:
                    report["metadata"] = {}
                report["metadata"]["graph_snapshot_id"] = focal.get("uuid", "unknown")
                report["metadata"]["analyzed_at"] = datetime.now(timezone.utc).isoformat()
                report["metadata"]["model_version"] = res_data.get("model", self.model)
                
                # Build impact_visualization from actual graph data
                report["impact_visualization"] = {
                    "nodes": [{"id": n.get("label", n["id"]), "label": n.get("label", ""), "type": n.get("type", "module"), "impact_type": "DIRECT" if n.get("state") == "direct" else ("TRANSITIVE" if n.get("state") == "transitive" else "NONE")} for n in nodes],
                    "edges": [{"source": e.get("source", ""), "target": e.get("target", ""), "relation": e.get("label", "RELATES_TO"), "impact_type": "DIRECT"} for e in edges[:20]]
                }
                
                # Ensure summary exists with correct counts
                if "summary" not in report:
                    ia = report.get("impact_analysis", {})
                    report["summary"] = {
                        "directly_broken_count": len(ia.get("directly_broken_services", [])),
                        "transitively_affected_count": len(ia.get("transitively_affected", [])),
                        "affected_api_clients_count": len(ia.get("affected_api_clients", [])),
                        "risk_level": "MEDIUM",
                        "migration_complexity": "MODERATE",
                        "confidence_score": 0.7
                    }
                
                return report
        except Exception as e:
            logger.error(f"Report generation failed: {e}")
            return self._get_fallback_report(scenario, focal, graph, f"LLM error: {str(e)}")

    async def answer_followup(self, question: str, report: Dict[str, Any], scenario: str) -> Dict[str, Any]:
        """Answers a follow-up question about a specific impact analysis report."""
        logger.info(f"  Answering follow-up: {question}")
        
        # 1. Get additional context from vector search
        context_matches = await self.retriever.search(question, top_k=3)
        context_str = "\n\n".join([f"File: {m.get('file_path')}\nContent: {m.get('content')}" for m in context_matches])
        
        # 2. Extract key info from report for prompt
        summary = report.get("summary", {})
        ia = report.get("impact_analysis", {})
        
        prompt = f"""
You are an expert software architect. You are answering a follow-up question about a 'What-If' impact analysis report you just generated.

ORIGINAL SCENARIO: {scenario}

CURRENT IMPACT SUMMARY:
- Risk Level: {summary.get('risk_level')}
- Migration Complexity: {summary.get('migration_complexity')}
- Directly Broken: {len(ia.get('directly_broken_services', []))} components
- Transitively Affected: {len(ia.get('transitively_affected', []))} components

ADDITIONAL CODE CONTEXT:
{context_str}

USER QUESTION: {question}

INSTRUCTIONS:
1. Answer the user's question accurately based on the report data and the additional code context provided.
2. Be technical. Use Markdown formatting (bullet points, bold text) for better readability.
3. KEEP IT BRIEF. Aim for 2-3 short paragraphs or a refined list of bullet points. Avoid long-winded explanations.
4. If the question asks for code changes or mitigation details not in the report, use the additional context to provide a best-effort recommendation.
5. Return your response as a JSON object with a single key "answer". Don't include markdown fences or any other text.
"""

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    self.openrouter_url,
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "HTTP-Referer": "https://github.com/google/singularity",
                        "X-Title": "Singularity Impact Analyzer",
                    },
                    json={
                        **get_model_config(),
                        "messages": [{"role": "user", "content": prompt}],
                    },
                    timeout=30.0
                )
                res_data = response.json()
                content = res_data["choices"][0]["message"]["content"]
                content = content.replace("```json", "").replace("```", "").strip()
                
                # Try to parse as JSON, if it's just raw text, wrap it
                try:
                    result = json.loads(content)
                except:
                    result = {"answer": content}
                    
                return result
        except Exception as e:
            logger.error(f"Follow-up answer failed: {e}")
            return {"answer": f"I encountered an error trying to answer that: {str(e)}"}
