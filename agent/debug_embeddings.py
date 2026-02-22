import os
import asyncio
import httpx
from dotenv import load_dotenv

load_dotenv("c:/Codings/Hackathons/SPITHACKS/Singularity/agent/.env")
api_key = os.getenv("OPENROUTER_API_KEY") or os.getenv("OPENROUTER_API")

async def test_embeddings():
    url = "https://openrouter.ai/api/v1/embeddings"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    data = {
        "model": "thenlper/gte-base",
        "input": "Testing embedding generation"
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(url, headers=headers, json=data)
        print(f"Status: {response.status_code}")
        print(f"Body: {response.text[:1000]}")

if __name__ == "__main__":
    asyncio.run(test_embeddings())
