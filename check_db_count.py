
import asyncio
import os
from agent.core.neo4j_client import Neo4jClient
from agent.core.vector_store import TwinVectorStore

async def check_db():
    neo4j = Neo4jClient()
    vs = TwinVectorStore()
    
    print("Checking Neo4j...")
    if neo4j.driver:
        query = f"MATCH (n:{neo4j.prefix}BaseNode) RETURN count(n) as count"
        async with neo4j.driver.session() as session:
            result = await session.run(query)
            record = await result.single()
            print(f"Neo4j {neo4j.prefix}BaseNode count: {record['count']}")
    else:
        print("Neo4j driver not initialized.")
        
    print("\nChecking Postgres VectorStore...")
    if vs.connection_string:
        await vs._ensure_initialized()
        if vs.is_initialized:
            # We can't easily count directly from TwinVectorStore without direct SQL
            # but we can try a broad search
            try:
                from sqlalchemy import text
                async with vs.pg_engine._pool.connect() as conn:
                    res = await conn.execute(text(f"SELECT count(*) FROM {vs.code_table}"))
                    count = res.scalar()
                    print(f"Postgres {vs.code_table} count: {count}")
                    
                    res = await conn.execute(text(f"SELECT count(*) FROM {vs.summary_table}"))
                    count = res.scalar()
                    print(f"Postgres {vs.summary_table} count: {count}")
            except Exception as e:
                print(f"Failed to count Postgres rows: {e}")
        else:
            print("VectorStore not initialized.")
    else:
        print("Postgres connection string missing.")
    
    await neo4j.close()

if __name__ == "__main__":
    import sys
    import selectors
    if sys.platform == 'win32':
        loop_factory = lambda: asyncio.SelectorEventLoop(selectors.SelectSelector())
        asyncio.run(check_db(), loop_factory=loop_factory)
    else:
        asyncio.run(check_db())
