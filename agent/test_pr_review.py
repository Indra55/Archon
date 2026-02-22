"""
Mock test for PR Review Service.

Simulates a PR with changed files and runs the full review pipeline
without needing a real GitHub PR. Tests:
  1. Code parsing (tree-sitter)
  2. Knowledge graph querying
  3. LLM review analysis
  4. Neo4j node status updates
  5. Review comment formatting
"""

import asyncio
import logging
import os
import sys

# Add parent dir so imports work
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))

from agent.core.parser import CoreParser
from agent.core.neo4j_client import Neo4jClient
from agent.core.retriever import HybridRetriever
from agent.core.knowledge_service import KnowledgeService
from agent.core.llm import invoke_llm, parse_json_response
from agent.prompts.pr_review import PR_REVIEW_PROMPT, PR_REVIEW_SYSTEM_PROMPT, DOC_UPDATE_PROMPT, DOC_UPDATE_SYSTEM_PROMPT

logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(name)-20s | %(levelname)-7s | %(message)s")
logger = logging.getLogger("test.pr_review")

# ── Mock README (simulates the repo's current README) ─────────────────────────

MOCK_README = """# Aegis

A backend service for order management.

## Features

- Order processing
- Database integration with PostgreSQL

## Installation

```bash
pip install -r requirements.txt
```

## API Endpoints

### POST /api/orders
Create a new order.

### GET /api/orders/:id
Get order by ID.

## Tech Stack

- Python 3.11
- Flask
- PostgreSQL
"""

# ── Mock PR Data ──────────────────────────────────────────────────────────────

MOCK_PR = {
    "number": 42,
    "title": "feat: Add user authentication with JWT",
    "author": "test-dev",
    "files": [
        {
            "filename": "src/auth/jwt_manager.py",
            "status": "added",
            "patch": """@@ -0,0 +1,35 @@
+import jwt
+import datetime
+from typing import Optional
+
+class JWTManager:
+    def __init__(self, secret_key: str):
+        self.secret_key = secret_key
+    
+    def generate_token(self, user_id: str, expires_in: int = 3600) -> str:
+        payload = {
+            "user_id": user_id,
+            "exp": datetime.datetime.utcnow() + datetime.timedelta(seconds=expires_in),
+            "iat": datetime.datetime.utcnow()
+        }
+        return jwt.encode(payload, self.secret_key, algorithm="HS256")
+    
+    def verify_token(self, token: str) -> Optional[dict]:
+        try:
+            return jwt.decode(token, self.secret_key, algorithms=["HS256"])
+        except jwt.ExpiredSignatureError:
+            return None
+        except jwt.InvalidTokenError:
+            return None""",
            "content": '''import jwt
import datetime
from typing import Optional

class JWTManager:
    def __init__(self, secret_key: str):
        self.secret_key = secret_key
    
    def generate_token(self, user_id: str, expires_in: int = 3600) -> str:
        payload = {
            "user_id": user_id,
            "exp": datetime.datetime.utcnow() + datetime.timedelta(seconds=expires_in),
            "iat": datetime.datetime.utcnow()
        }
        return jwt.encode(payload, self.secret_key, algorithm="HS256")
    
    def verify_token(self, token: str) -> Optional[dict]:
        try:
            return jwt.decode(token, self.secret_key, algorithms=["HS256"])
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None
'''
        },
        {
            "filename": "src/auth/middleware.py",
            "status": "added",
            "patch": """@@ -0,0 +1,20 @@
+from functools import wraps
+from flask import request, jsonify
+
+def require_auth(jwt_manager):
+    def decorator(f):
+        @wraps(f)
+        def wrapper(*args, **kwargs):
+            token = request.headers.get("Authorization", "").replace("Bearer ", "")
+            if not token:
+                return jsonify({"error": "No token provided"}), 401
+            payload = jwt_manager.verify_token(token)
+            if not payload:
+                return jsonify({"error": "Invalid token"}), 401
+            return f(*args, **kwargs)
+        return wrapper
+    return decorator""",
            "content": '''from functools import wraps
from flask import request, jsonify

def require_auth(jwt_manager):
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            token = request.headers.get("Authorization", "").replace("Bearer ", "")
            if not token:
                return jsonify({"error": "No token provided"}), 401
            payload = jwt_manager.verify_token(token)
            if not payload:
                return jsonify({"error": "Invalid token"}), 401
            return f(*args, **kwargs)
        return wrapper
    return decorator
'''
        },
        {
            "filename": "README.md",
            "status": "modified",
            "patch": """@@ -10,3 +10,5 @@
 ## Features
 
 - Order processing
+- JWT Authentication
+- Auth middleware""",
            "content": None  # Non-code file, won't be parsed
        }
    ]
}


async def run_mock_review():
    print("=" * 70)
    print("🧪 MOCK PR REVIEW TEST")
    print(f"   PR #{MOCK_PR['number']}: {MOCK_PR['title']}")
    print("=" * 70)

    # ── Step 1: Parse mock files ──────────────────────────────────────────
    print("\n📌 Step 1: Parsing changed files with tree-sitter...")
    parser = CoreParser()
    changed_chunks = []

    for file_info in MOCK_PR["files"]:
        file_path = file_info["filename"]
        status = file_info["status"]

        if not parser.get_language(file_path) or not file_info.get("content"):
            print(f"   ⏭️  Skipping {file_path} (non-code or no content)")
            continue

        chunks = parser.parse_file(file_path, file_info["content"])
        print(f"   ✅ {file_path} ({status}) → {len(chunks)} chunks")

        for chunk in chunks:
            print(f"      - [{chunk.type}] {chunk.name} (lines {chunk.start_line}-{chunk.end_line})")
            changed_chunks.append({
                "file_path": file_path,
                "name": chunk.name,
                "type": chunk.type,
                "signature": chunk.signature,
                "content": chunk.content,
                "status": status,
                "start_line": chunk.start_line,
                "end_line": chunk.end_line,
            })

    print(f"\n   Total parsed chunks: {len(changed_chunks)}")

    # ── Step 2: Query Knowledge Graph ─────────────────────────────────────
    print("\n📌 Step 2: Querying Knowledge Graph for architecture context...")
    neo4j = Neo4jClient()
    retriever = HybridRetriever()

    context_parts = []
    seen_uuids = set()

    for chunk in changed_chunks[:5]:
        results = await retriever.search(f"{chunk['name']} {chunk['file_path']}", top_k=3)
        for r in results:
            uid = r.get("uuid", "")
            if uid in seen_uuids:
                continue
            seen_uuids.add(uid)

            part = f"KNOWN COMPONENT: {r.get('name')} ({r.get('type', 'unknown')})"
            part += f"\n  File: {r.get('file_path', 'unknown')}"
            part += f"\n  Summary: {r.get('summary', 'No summary')}"
            if r.get("code_content"):
                part += f"\n  Existing Code:\n```\n{r['code_content'][:300]}\n```"
            context_parts.append(part)
            print(f"   Found existing: {r.get('name')} in {r.get('file_path', '?')}")

    # Fetch architecture concepts
    if neo4j.driver:
        try:
            prefix = neo4j.prefix
            concept_query = f"""
            MATCH (n:{prefix}Concept)
            RETURN n.name as name, n.summary as summary
            LIMIT 10
            """
            async with neo4j.driver.session() as session:
                result = await session.run(concept_query)
                async for record in result:
                    part = f"ARCHITECTURE CONCEPT: {record['name']}"
                    if record["summary"]:
                        part += f"\n  {record['summary']}"
                    context_parts.append(part)
                    print(f"   Found concept: {record['name']}")
        except Exception as e:
            print(f"   ⚠️ Concept query error: {e}")

    architecture_context = "\n\n".join(context_parts) if context_parts else "No existing architecture context found."
    print(f"\n   Architecture context length: {len(architecture_context)} chars")

    # ── Step 3: Build the LLM prompt ──────────────────────────────────────
    print("\n📌 Step 3: Building LLM review prompt...")

    # Format changed chunks
    chunk_parts = []
    for c in changed_chunks:
        p = f"[{c['status'].upper()}] {c['type']}: {c['name']}\n"
        p += f"  File: {c['file_path']} (lines {c['start_line']}-{c['end_line']})\n"
        p += f"  Signature: {c['signature']}\n"
        p += f"  Code:\n```\n{c['content'][:600]}\n```"
        chunk_parts.append(p)
    changed_chunks_text = "\n\n".join(chunk_parts)

    # Format diff
    pr_diff_parts = []
    for f in MOCK_PR["files"]:
        pr_diff_parts.append(f"### {f['filename']} ({f['status']})\n```diff\n{f['patch']}\n```")
    pr_diff_text = "\n\n".join(pr_diff_parts)

    prompt = PR_REVIEW_PROMPT.format(
        architecture_context=architecture_context,
        pr_diff=pr_diff_text,
        changed_chunks=changed_chunks_text,
    )

    print(f"   Prompt length: {len(prompt)} chars")

    # ── Step 4: LLM Review ────────────────────────────────────────────────
    print("\n📌 Step 4: Sending to LLM for architecture review...")
    try:
        raw_response = await invoke_llm(prompt, temperature=0.2, system_message=PR_REVIEW_SYSTEM_PROMPT)
        review = parse_json_response(raw_response)
        print("   ✅ LLM review complete!")
    except Exception as e:
        print(f"   ❌ LLM review failed: {e}")
        review = {
            "verdict": "COMMENT",
            "summary": f"Review error: {e}",
            "issues": [],
            "undocumented_components": [],
            "architecture_drift": [],
            "affected_nodes": [],
        }

    # ── Step 5: Display Results ───────────────────────────────────────────
    print("\n" + "=" * 70)
    print("📋 REVIEW RESULTS")
    print("=" * 70)

    verdict = review.get("verdict", "UNKNOWN")
    emoji = {"APPROVE": "✅", "REQUEST_CHANGES": "🔴", "COMMENT": "💬"}.get(verdict, "❓")
    print(f"\n   Verdict: {emoji} {verdict}")
    print(f"\n   Summary: {review.get('summary', 'N/A')}")

    issues = review.get("issues", [])
    if issues:
        print(f"\n   🚨 Issues ({len(issues)}):")
        for i, issue in enumerate(issues, 1):
            sev = issue.get("severity", "info")
            print(f"     {i}. [{sev.upper()}] {issue.get('file', '?')}: {issue.get('issue', '?')}")
            print(f"        → {issue.get('suggestion', '')}")

    undoc = review.get("undocumented_components", [])
    if undoc:
        print(f"\n   📝 Undocumented Components ({len(undoc)}):")
        for u in undoc:
            print(f"     - {u.get('name', '?')} ({u.get('type', '?')}) in {u.get('file', '?')}")

    drift = review.get("architecture_drift", [])
    if drift:
        print(f"\n   ⚠️ Architecture Drift ({len(drift)}):")
        for d in drift:
            print(f"     - {d.get('pattern', '?')}")

    affected = review.get("affected_nodes", [])
    if affected:
        print(f"\n   🔄 Affected Nodes ({len(affected)}):")
        for a in affected:
            print(f"     - {a.get('name', '?')} → {a.get('impact', '?')}: {a.get('reason', '')}")

    # ── Step 6: Update Neo4j Nodes ────────────────────────────────────────
    if affected and neo4j.driver:
        print(f"\n📌 Step 6: Updating {len(affected)} Neo4j nodes...")
        prefix = neo4j.prefix
        for node_info in affected:
            name = node_info.get("name", "")
            impact = node_info.get("impact", "modified")
            if not name:
                continue

            status_map = {"modified": "active", "deprecated": "deprecated", "superseded": "superseded"}
            new_status = status_map.get(impact, "active")

            try:
                query = f"""
                MATCH (n:{prefix}BaseNode)
                WHERE toLower(n.name) = toLower($name)
                SET n.status = $status, n.updated_at = timestamp()
                """
                if impact in ["deprecated", "superseded"]:
                    query += ", n.valid_to = timestamp()"

                async with neo4j.driver.session() as session:
                    result = await session.run(query, name=name, status=new_status)
                    summary = await result.consume()
                    if summary.counters.properties_set > 0:
                        print(f"   ✅ Updated '{name}' → {new_status}")
                    else:
                        print(f"   ⚠️ '{name}' not found in graph")
            except Exception as e:
                print(f"   ❌ Failed to update '{name}': {e}")
    else:
        print("\n📌 Step 6: No nodes to update (or Neo4j not connected)")

    # ── Step 7: Format the PR comment ─────────────────────────────────────
    print("\n📌 Step 7: Formatted PR comment preview:")
    print("-" * 60)

    from agent.core.pr_review_service import PRReviewService
    temp_service = PRReviewService.__new__(PRReviewService)
    comment = temp_service._format_review_comment(review, MOCK_PR["number"])
    print(comment)
    print("-" * 60)

    # ── Step 8: Auto Documentation Update ─────────────────────────────────
    print("\n📌 Step 8: Auto-updating documentation (README)...")

    # Build review findings text
    review_findings = f"Verdict: {review.get('verdict', 'N/A')}\n"
    review_findings += f"Summary: {review.get('summary', 'N/A')}\n"
    if undoc:
        review_findings += "\nUndocumented Components:\n"
        for u in undoc:
            review_findings += f"  - {u.get('name')} ({u.get('type')}) in {u.get('file')}\n"
    if drift:
        review_findings += "\nArchitecture Drift:\n"
        for d in drift:
            review_findings += f"  - {d.get('pattern')}: {d.get('violation')}\n"
    if affected:
        review_findings += "\nAffected Components:\n"
        for a in affected:
            review_findings += f"  - {a.get('name')} → {a.get('impact')}\n"

    doc_prompt = DOC_UPDATE_PROMPT.format(
        current_readme=MOCK_README,
        code_changes=changed_chunks_text,
        review_findings=review_findings,
        knowledge_context=architecture_context,
    )

    print(f"   Doc update prompt length: {len(doc_prompt)} chars")

    try:
        raw_doc = await invoke_llm(doc_prompt, temperature=0.2, system_message=DOC_UPDATE_SYSTEM_PROMPT)
        doc_result = parse_json_response(raw_doc)
        print("   ✅ Doc update LLM complete!")
    except Exception as e:
        print(f"   ❌ Doc update LLM failed: {e}")
        doc_result = {"outdated_sections": [], "updated_readme": "", "change_summary": f"Error: {e}"}

    # Display outdated sections
    outdated = doc_result.get("outdated_sections", [])
    if outdated:
        print(f"\n   📋 Outdated Sections ({len(outdated)}):")
        for s in outdated:
            action_emoji = {"updated": "🔄", "added": "✨", "removed": "🗑️"}.get(s.get("action"), "📝")
            print(f"     {action_emoji} [{s.get('action', '?')}] {s.get('section', '?')}: {s.get('reason', '')}")

    # Display change summary
    change_summary = doc_result.get("change_summary", "")
    if change_summary:
        print(f"\n   📝 Change Summary: {change_summary}")

    # Display the updated README
    updated_readme = doc_result.get("updated_readme", "")
    if updated_readme:
        print("\n" + "=" * 70)
        print("📄 UPDATED README PREVIEW")
        print("=" * 70)
        print(updated_readme)
        print("=" * 70)
    else:
        print("\n   ⚠️ No updated README generated.")

    # Display doc update comment
    if outdated:
        doc_comment = temp_service._format_doc_update_comment(outdated, change_summary)
        print("\n📌 Doc Update PR Comment Preview:")
        print("-" * 60)
        print(doc_comment)
        print("-" * 60)

    # Cleanup
    if neo4j.driver:
        await neo4j.driver.close()

    print("\n✅ Mock PR review test complete (with doc update)!")
    return review


if __name__ == "__main__":
    asyncio.run(run_mock_review())
