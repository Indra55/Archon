import asyncio
import os
from typing import List, Dict, Any, Optional
from agent.core.neo4j_client import Neo4jClient
from dotenv import load_dotenv

async def verify():
    load_dotenv()
    neo4j = Neo4jClient()
    
    print(f"Connecting to Neo4j: {os.getenv('NEO4J_URI')}")
    
    query = """
    MATCH (r:Repository)
    OPTIONAL MATCH (r)-[:CONTAINS]->(f:File)
    OPTIONAL MATCH (f)<-[:PART_OF]-(c:Chunk)
    RETURN r.name as repo, count(DISTINCT f) as file_count, count(DISTINCT c) as chunk_count
    """
    
    try:
        async with neo4j.driver.session() as session:
            result = await session.run(query)
            records = await result.data()
            print(f"✅ Knowledge Graph Full Discovery:")
            if not records:
                print("   - (No nodes found at all)")
            for r in records:
                print(f"   - Labels: {r['labels']}, Count: {r['count']}")
                
    except Exception as e:
        print(f"❌ Error querying Neo4j: {e}")
    finally:
        await neo4j.close()

if __name__ == "__main__":
    import sys
    import selectors
    if sys.platform == 'win32':
        loop_factory = lambda: asyncio.SelectorEventLoop(selectors.SelectSelector())
        asyncio.run(verify(), loop_factory=loop_factory)
    else:
        asyncio.run(verify())
