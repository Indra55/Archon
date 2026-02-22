import asyncio
import os
from agent.core.vector_store import TwinVectorStore
from dotenv import load_dotenv
import logging

load_dotenv('agent/.env')
logging.basicConfig(level=logging.INFO)

async def check_vectors():
    # Setup windows fix for diagnostic script
    import sys
    import selectors
    if sys.platform == 'win32':
        loop = asyncio.SelectorEventLoop(selectors.SelectSelector())
        asyncio.set_event_loop(loop)
    
    vs = TwinVectorStore()
    # Search for anything to see if we get hits
    results = await vs.search("auth", store_type="code")
    print(f"Code search results: {len(results)}")
    for r in results:
        print(f" - {r.metadata.get('name')} ({r.metadata.get('file_path')})")
        
    results = await vs.search("auth", store_type="summary")
    print(f"Summary search results: {len(results)}")
    for r in results:
        print(f" - {r.metadata.get('name')} ({r.metadata.get('file_path')})")

if __name__ == "__main__":
    if os.name == 'nt':
        import selectors
        loop_factory = lambda: asyncio.SelectorEventLoop(selectors.SelectSelector())
        asyncio.run(check_vectors(), loop_factory=loop_factory)
    else:
        asyncio.run(check_vectors())
