import os
import logging
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv

from langchain_openai import OpenAIEmbeddings
from langchain_postgres.v2.async_vectorstore import AsyncPGVectorStore
from langchain_postgres.v2.engine import PGEngine
from langchain_core.documents import Document

env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
load_dotenv(env_path)

logger = logging.getLogger("kachow.core.vector_store")

from sqlalchemy.ext.asyncio import create_async_engine

import httpx
from langchain_core.embeddings import Embeddings

class OpenRouterEmbeddings(Embeddings):
    def __init__(self, api_key: str, model: str = "thenlper/gte-base"):
        self.api_key = api_key
        self.model = model
        self.url = "https://openrouter.ai/api/v1/embeddings"

    async def _embed(self, texts: List[str]) -> List[List[float]]:
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        data = {
            "model": self.model,
            "input": texts
        }
        async with httpx.AsyncClient() as client:
            response = await client.post(self.url, headers=headers, json=data, timeout=60.0)
            response.raise_for_status()
            res_json = response.json()
            return [item["embedding"] for item in res_json["data"]]

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        import requests
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        data = {
            "model": self.model,
            "input": texts
        }
        response = requests.post(self.url, headers=headers, json=data, timeout=60.0)
        response.raise_for_status()
        res_json = response.json()
        return [item["embedding"] for item in res_json["data"]]

    async def aembed_documents(self, texts: List[str]) -> List[List[float]]:
        return await self._embed(texts)

    def embed_query(self, text: str) -> List[float]:
        return self.embed_documents([text])[0]

    async def aembed_query(self, text: str) -> List[float]:
        res = await self._embed([text])
        return res[0]

class TwinVectorStore:
    def __init__(self):
        # The user provided POSTGRES_URL in their .env
        self.connection_string = os.getenv("POSTGRES_URL")
        if self.connection_string and self.connection_string.startswith("postgresql://"):
            # Use the modern psycopg (v3) driver which handles async well
            self.connection_string = self.connection_string.replace("postgresql://", "postgresql+psycopg://", 1)
        
        # We need an embedding model. If they use OpenRouter, they might not have OpenAI.
        # Fallback to OPENROUTER_API just in case the user's .env uses that instead.
        openrouter_key = os.getenv("OPENROUTER_API_KEY") or os.getenv("OPENROUTER_API", "dummy")
        
        self.embeddings = OpenRouterEmbeddings(
            api_key=openrouter_key,
            model="thenlper/gte-base",
        )
        
        self.test_mode = os.getenv("TEST_MODE", "false").lower() == "true"
        self.code_table = "kachow_test_code_v2" if self.test_mode else "kachow_code_v2"
        self.summary_table = "kachow_test_summaries_v2" if self.test_mode else "kachow_summaries_v2"
        
        self.engine = None
        self.code_store = None
        self.summary_store = None
        self.is_initialized = False

        if self.connection_string:
            # Obfuscate password for logging
            obfuscated = self.connection_string
            if "@" in obfuscated:
                parts = obfuscated.split("@")
                if ":" in parts[0]:
                    subparts = parts[0].split(":")
                    obfuscated = subparts[0] + ":****@" + parts[1]
            logger.info(f"  [VectorStore] Initializing with connection: {obfuscated}")
        else:
            logger.warning("POSTGRES_URL is missing. VectorStore in crippled mode.")

    async def _ensure_initialized(self):
        """Lazy async initialization for v2 stores."""
        if self.is_initialized or not self.connection_string:
            return
            
        try:
            from sqlalchemy import text
            # PGEngine handles the connection pool
            self.pg_engine = PGEngine.from_connection_string(self.connection_string)
            
            # Check if tables exist first to avoid hanging on ainit_vectorstore_table
            async with self.pg_engine._pool.connect() as conn:
                res = await conn.execute(text(
                    "SELECT table_name FROM information_schema.tables "
                    "WHERE table_schema = 'public' AND table_name IN (:t1, :t2)"
                ), {"t1": self.code_table, "t2": self.summary_table})
                existing_tables = [r[0] for r in res.fetchall()]
            
            if len(existing_tables) < 2:
                logger.info(f"  [VectorStore] Initializing missing tables: {[t for t in [self.code_table, self.summary_table] if t not in existing_tables]}")
                # Use a timeout for initialization as it can hang on Windows
                try:
                    await asyncio.wait_for(
                        self.pg_engine.ainit_vectorstore_table(table_name=self.code_table, vector_size=768),
                        timeout=30.0
                    )
                    await asyncio.wait_for(
                        self.pg_engine.ainit_vectorstore_table(table_name=self.summary_table, vector_size=768),
                        timeout=30.0
                    )
                except asyncio.TimeoutError:
                    logger.warning("  [VectorStore] Table initialization TIMED OUT, but tables might have been created.")
            else:
                logger.info(f"  [VectorStore] Tables already exist: {existing_tables}")
            
            self.code_store = await AsyncPGVectorStore.create(
                engine=self.pg_engine,
                embedding_service=self.embeddings,
                table_name=self.code_table,
            )
            self.summary_store = await AsyncPGVectorStore.create(
                engine=self.pg_engine,
                embedding_service=self.embeddings,
                table_name=self.summary_table,
            )
            self.is_initialized = True
            logger.info("  [VectorStore] v2 VectorStores initialized successfully.")
        except Exception as e:
            logger.error(f"  [VectorStore] Failed to initialize v2 stores: {e}")
            self.is_initialized = False
        # The 'else' was incorrectly indented and logging warnings even on success

    async def init_tables(self):
        """LangChain PGVector auto-creates tables on first insert, but we can do setup here."""
        if not self.connection_string:
            return
        
        # We might want to execute pure SQL to create BM25 indexes later,
        # but for now we rely on PGVector's HNSW index creation.
        # self.code_store.create_hnsw_index(...) might be needed depending on the LC version.
        pass

    async def upsert_chunk(self, chunk_data: Dict[str, Any]):
        """
        Store the Twin Embeddings with standardized 'uuid'.
        """
        if not self.connection_string: return

        chunk_uuid = chunk_data["uuid"]
        metadata = {
            "uuid": chunk_uuid,
            "repo": chunk_data.get("repo", "unknown"),
            "name": chunk_data["name"],
            "type": chunk_data["type"],
            "file_path": chunk_data["file_path"],
            "breadcrumbs": chunk_data.get("breadcrumbs", ""),
            "summary": chunk_data.get("summary", "")
        }

        # 1. Raw Code Embedding
        code_doc = Document(
            page_content=chunk_data["content"],
            metadata=metadata
        )
        # 2. Summary Embedding
        summary_doc = Document(
            page_content=chunk_data.get("summary", ""),
            metadata=metadata
        )

        try:
            await self._ensure_initialized()
            if not self.is_initialized:
                logger.error("VectorStore not initialized, skipping upsert.")
                return

            # Show the user the embeddings being generated
            # (Mapping to v2: aadd_documents works, but we should use IDs)
            await self.code_store.aadd_documents([code_doc], ids=[chunk_uuid])
            await self.summary_store.aadd_documents([summary_doc], ids=[chunk_uuid])
            logger.info(f"✨ Successfully indexed twin embeddings for {chunk_uuid[:8]}")
        except Exception as e:
            logger.error(f"Failed to upsert to PGVector: {e}")

    async def search(self, query: str, store_type: str = "summary", top_k: int = 5, repo: Optional[str] = None) -> List[Document]:
        """Search either the summary space or the raw code space, with optional repo filtering."""
        if not self.connection_string: return []
        
        try:
            await self._ensure_initialized()
            if not self.is_initialized:
                return []
                
            store = self.summary_store if store_type == "summary" else self.code_store
            
            filter_dict = {}
            if repo:
                filter_dict["repo"] = repo
                
            results = await store.asimilarity_search(query, k=top_k, filter=filter_dict if filter_dict else None)
            return results
        except Exception as e:
            logger.error(f"Failed to search PGVector: {e}")
            return []

if __name__ == "__main__":
    import asyncio
    async def test():
        vs = TwinVectorStore()
        # Mock upsert
        chunk = {
            "id": "hash123",
            "name": "verify_login",
            "type": "function",
            "content": "def verify_login(user, pwd): return True",
            "summary": "This function verifies user credentials.",
            "file_path": "auth.py",
            "breadcrumbs": "global"
        }
        logger.info("Upserting Twin Embeddings...")
        # Note: This will fail if OpenAI API key is wrong unless we run a local model.
        # await vs.upsert_chunk(chunk)
        logger.info("Done.")
        
    logging.basicConfig(level=logging.INFO)
    asyncio.run(test())
