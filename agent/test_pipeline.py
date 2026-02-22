import os
import sys
import asyncio
import logging

# Add the project root to the Python path so 'agent' module can be found
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from agent.core.knowledge_service import KnowledgeService
from agent.core.retriever import HybridRetriever
from agent.core.health_service import HealthService
from agent.core.health_service import HealthService

# Set up logging for visibility
logging.basicConfig(level=logging.INFO, format='%(levelname)s:%(name)s:%(message)s')

def setup_windows_asyncio():
    """Psycopg (v3) async requires SelectorEventLoop on Windows."""
    import sys
    if sys.platform == 'win32':
        import asyncio
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

setup_windows_asyncio()

async def main():
    print("Starting Living Knowledge Graph Test Pipeline\n")
    
    # 1. Initialize Services
    knowledge = KnowledgeService()
    retriever = HybridRetriever()
    health = HealthService()

    # 2. Ingest Sample Code
    repo_name = "test_framework_repo"
    file_path = "src/auth/jwt_manager.py"
    sample_code = """
import time

class JWTManager:
    def __init__(self, secret: str):
        self.secret = secret
        self.expiry_time = 3600

    def generate_token(self, user_id: int) -> str:
        '''Generates a JWT token for the user.'''
        # Dummy implementation representing token creation
        timestamp = time.time()
        return f"{user_id}.{self.secret}.{timestamp}"

    def verify_token(self, token: str) -> bool:
        '''Verifies an incoming JWT token.'''
        parts = token.split('.')
        if len(parts) != 3:
            return False
        return parts[1] == self.secret
"""
    print(f"1. Ingesting & Summarizing '{file_path}' into PgVector & Neo4j...")
    # This will parse the AST, summarize functions, hash an ID, and UPSERT Postgres + AuraDB
    await knowledge.process_file(repo=repo_name, file_path=file_path, content=sample_code)
    print("Ingestion Complete!\n")

    # 3. Hybrid Search
    print("2. Executing Hybrid Retrieval...")
    query = "How do I create a new user session string or token?"
    print(f"    Query: '{query}'")
    
    # This triggers the vector search and expands the file path across the AuraDB Graph
    results = await retriever.search(query, top_k=2)
    
    print("\n    Results Found:")
    for r in results:
        score_val = r.get('score', 0)
        file_ctx = r.get('graph_file_path', 'unknown')
        print(f"    - Score {score_val}: [Function: {r.get('name')}] in {file_ctx}")
        print(f"      Summary: {r.get('summary')}")
        
    # 4. Health Metrics
    print("\n3. Checking System Health (Drift & Coverage via AuraDB)...")
    metrics = await health.get_system_health()
    
    for metric, value in metrics.items():
        if metric == "drift_candidates":
            print(f"    - {metric}: {len(value)} candidates found.")
        else:
            print(f"    - {metric}: {value}")
            
    print("\nPipeline Test Finished!")

if __name__ == "__main__":
    import sys
    import selectors
    
    if sys.platform == 'win32':
        # Psycopg3 async requires SelectorEventLoop on Windows
        loop_factory = lambda: asyncio.SelectorEventLoop(selectors.SelectSelector())
        asyncio.run(main(), loop_factory=loop_factory)
    else:
        asyncio.run(main())
