import asyncio
import os
from neo4j import AsyncGraphDatabase
from dotenv import load_dotenv

load_dotenv('agent/.env')

async def check_data():
    uri = os.getenv('NEO4J_URI')
    user = os.getenv('NEO4J_USERNAME')
    pwd = os.getenv('NEO4J_PASSWORD')
    driver = AsyncGraphDatabase.driver(uri, auth=(user, pwd))
    async with driver.session() as session:
        res = await session.run('MATCH (n) RETURN n.name as name, labels(n) as labels LIMIT 50')
        async for record in res:
            print(f"{record['name']} | {record['labels']}")
    await driver.close()

if __name__ == "__main__":
    asyncio.run(check_data())
