import logging
from typing import Dict, Any
from agent.core.neo4j_client import Neo4jClient

logger = logging.getLogger("kachow.core.health")

class HealthService:
    def __init__(self):
        self.neo4j = Neo4jClient()

    async def get_system_health(self) -> Dict[str, Any]:
        """
        Calculates the Knowledge Graph health:
        1. Total Repos, Files, Chunks
        2. Documentation Coverage (% of chunks with a non-empty summary)
        3. Drift Candidates (Chunks where code is large but summary is extremely short/missing)
        """
        if not self.neo4j.driver:
            logger.warning("No Neo4j connection. Health check unavailable.")
            return {"error": "Neo4j connection required"}

        stats = {
            "total_repositories": 0,
            "total_files": 0,
            "total_chunks": 0,
            "documentation_coverage_percent": 0.0,
            "drift_candidates": []
        }

        query_counts = f"""
        MATCH (r:{self.neo4j.prefix}Repository) WITH count(r) AS repos
        MATCH (f:{self.neo4j.prefix}File) WITH repos, count(f) AS files
        MATCH (c:{self.neo4j.prefix}Chunk) RETURN repos, files, count(c) AS chunks
        """
        
        query_coverage = f"""
        MATCH (c:{self.neo4j.prefix}Chunk)
        WITH count(c) as total, sum(CASE WHEN c.summary <> '' AND c.summary IS NOT NULL THEN 1 ELSE 0 END) as documented
        RETURN total, documented
        """
        
        query_drift = f"""
        MATCH (c:{self.neo4j.prefix}Chunk)-[:PART_OF]->(f:{self.neo4j.prefix}File)
        WHERE (c.summary = '' OR c.summary IS NULL OR size(c.summary) < 15) AND (c.end_line - c.start_line > 10)
        RETURN c.id AS id, c.name AS name, f.path AS file_path, (c.end_line - c.start_line) AS lines_of_code
        ORDER BY lines_of_code DESC LIMIT 10
        """

        async with self.neo4j.driver.session() as session:
            try:
                # 1. Counts
                result_counts = await session.run(query_counts)
                record_counts = await result_counts.single()
                if record_counts:
                    stats["total_repositories"] = record_counts["repos"]
                    stats["total_files"] = record_counts["files"]
                    stats["total_chunks"] = record_counts["chunks"]

                # 2. Coverage
                result_cov = await session.run(query_coverage)
                record_cov = await result_cov.single()
                if record_cov and record_cov["total"] > 0:
                    stats["documentation_coverage_percent"] = round((record_cov["documented"] / record_cov["total"]) * 100, 2)

                # 3. Drift
                result_drift = await session.run(query_drift)
                records_drift = await result_drift.values()
                stats["drift_candidates"] = [
                    {"id": r[0], "name": r[1], "file_path": r[2], "lines": r[3]} for r in records_drift
                ]
            except Exception as e:
                logger.error(f"Failed to calculate health metrics: {e}")

        return stats

if __name__ == "__main__":
    import asyncio
    async def test():
        hs = HealthService()
        metrics = await hs.get_system_health()
        print("--- System Health ---")
        for k, v in metrics.items():
            print(f"{k}: {v}")
    
    logging.basicConfig(level=logging.INFO)
    asyncio.run(test())
