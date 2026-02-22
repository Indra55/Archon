
import asyncio
import os
import hashlib
from agent.core.neo4j_client import Neo4jClient

async def test_manual_upsert():
    client = Neo4jClient()
    if not client.driver:
        print("Driver not initialized")
        return
        
    repo_name = "test_framework_repo"
    file_path = "src/auth/jwt_manager.py"
    chunk_data = {
        "uuid": hashlib.sha256("manual_chunk_test".encode()).hexdigest(),
        "name": "manual_test_func",
        "type": "function",
        "start_line": 1,
        "end_line": 5,
        "summary": "Manual test chunk",
        "content": "def manual_test_func(): pass"
    }
    
    file_uuid = hashlib.sha256(f"file_{repo_name}_{file_path}".encode()).hexdigest()
    print(f"File UUID: {file_uuid}")
    print(f"Chunk UUID: {chunk_data['uuid']}")
    
    # Check if file exists first
    async with client.driver.session() as session:
        res = await session.run(f"MATCH (f:{client.prefix}File {{uuid: $uuid}}) RETURN f", uuid=file_uuid)
        if await res.single():
            print("Confirmed: File node exists")
        else:
            print("Error: File node DOES NOT exist. Re-creating...")
            await client.upsert_repository_and_file(repo_name, file_path)
    
    print("Upserting chunk...")
    await client.upsert_code_chunk(repo_name, file_path, chunk_data)
    
    # Verify
    async with client.driver.session() as session:
        res = await session.run(f"MATCH (c:{client.prefix}Chunk {{uuid: $uuid}}) RETURN c", uuid=chunk_data['uuid'])
        if await res.single():
            print("SUCCESS: Chunk node created!")
        else:
            print("FAILURE: Chunk node NOT created.")
            
    await client.close()

if __name__ == "__main__":
    import sys
    import selectors
    if sys.platform == 'win32':
        loop_factory = lambda: asyncio.SelectorEventLoop(selectors.SelectSelector())
        asyncio.run(test_manual_upsert(), loop_factory=loop_factory)
    else:
        asyncio.run(test_manual_upsert())
