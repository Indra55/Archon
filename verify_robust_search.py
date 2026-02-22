import asyncio
import os
from agent.core.retriever import HybridRetriever
from dotenv import load_dotenv
import logging

load_dotenv('agent/.env')
logging.basicConfig(level=logging.INFO)

async def verify_robust_search():
    # Setup windows fix
    import sys
    import selectors
    if sys.platform == 'win32':
        loop = asyncio.SelectorEventLoop(selectors.SelectSelector())
        asyncio.set_event_loop(loop)
    
    retriever = HybridRetriever()
    
    # Test query that should hit the non-prefixed nodes if robust
    query = "payments" # My check_labels showed nodes like 'Repository', 'File', 'Chunk'
    print(f"Searching for: {query}")
    
    results = await retriever.search(query)
    print(f"Results found: {len(results)}")
    for r in results:
        print(f" - {r.get('name')} (Labels: {r.get('type')})")

if __name__ == "__main__":
    if os.name == 'nt':
        import selectors
        loop_factory = lambda: asyncio.SelectorEventLoop(selectors.SelectSelector())
        asyncio.run(verify_robust_search(), loop_factory=loop_factory)
    else:
        asyncio.run(verify_robust_search())
