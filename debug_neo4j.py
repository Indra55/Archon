
import asyncio
import os
from agent.core.neo4j_client import Neo4jClient

async def debug_neo4j():
    client = Neo4jClient()
    if not client.driver:
        print("Driver not initialized")
        return
        
    async with client.driver.session() as session:
        print(f"Prefix: {client.prefix}")
        
        # 1. Total nodes with any label
        res = await session.run("MATCH (n) RETURN labels(n) as labels, n.uuid as uuid, n.name as name, n.path as path, n.type as type")
        print("\nAll nodes in DB:")
        async for r in res:
            print(f"Labels: {r['labels']}, UUID: {r['uuid']}, Name: {r['name']}, Path: {r['path']}, Type: {r['type']}")
            
        # 2. Check for the specific file we ingested
        import hashlib
        repo_name = "test_framework_repo"
        file_path = "src/auth/jwt_manager.py"
        file_uuid = hashlib.sha256(f"file_{repo_name}_{file_path}".encode()).hexdigest()
        print(f"\nSearching for file_uuid: {file_uuid}")
        
        res = await session.run("MATCH (f {uuid: $uuid}) RETURN labels(f) as labels, f", uuid=file_uuid)
        record = await res.single()
        if record:
            print(f"Found node with uuid {file_uuid}: Labels={record['labels']}")
        else:
            print(f"No node found with uuid {file_uuid}")
            
    await client.close()

if __name__ == "__main__":
    import sys
    import selectors
    if sys.platform == 'win32':
        loop_factory = lambda: asyncio.SelectorEventLoop(selectors.SelectSelector())
        asyncio.run(debug_neo4j(), loop_factory=loop_factory)
    else:
        asyncio.run(debug_neo4j())
