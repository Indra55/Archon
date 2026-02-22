"""
KA-CHOW Architecture Agent — Flask Backend API

Endpoints:
  POST /api/v1/architect     — Full pipeline (streaming SSE)
  POST /api/v1/analyze       — Requirements analysis only
  POST /api/v1/design        — Requirements + architecture design
  GET  /api/v1/health        — Health check

Run:
  cd agent/
  source .venv/bin/activate
  python server.py
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
import sys
import traceback
from pathlib import Path
from typing import Any
import selectors
import threading

# ── Ensure the parent dir is on sys.path so `agent.*` imports resolve ────────
# This allows `from agent.pipelines...` to work whether you run:
#   python server.py            (from inside agent/)
#   python -m agent.server      (from parent dir)
_AGENT_DIR = Path(__file__).resolve().parent
_PROJECT_ROOT = _AGENT_DIR.parent
if str(_PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(_PROJECT_ROOT))
if str(_AGENT_DIR) not in sys.path:
    sys.path.insert(0, str(_AGENT_DIR))

from dotenv import load_dotenv
from flask import Flask, request as flask_request, jsonify, Response
from flask_cors import CORS

from agent.pipelines.architecture_pipeline import compile_architecture_pipeline
from agent.agents import analyze_requirements, design_architecture
from agent.output import write_output
from agent.core.neo4j_client import Neo4jClient
from agent.core.health_service import HealthService
from agent.core.knowledge_service import KnowledgeService
from agent.core.retriever import HybridRetriever
from agent.core.impact_service import ImpactService
from agent.core.qa_service import QAService
from agent.core.pr_review_service import PRReviewService
from agent.core.push_service import PushService
from agent.core.onboarding_service import OnboardingService

load_dotenv(dotenv_path=_AGENT_DIR / ".env")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(name)-20s | %(levelname)-7s | %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("kachow.server")

# ── Windows Asyncio Fix ───────────────────────────────────────────────────────
if sys.platform == 'win32':
    # Psycopg (v3) async requires SelectorEventLoop on Windows.
    # We set this globally for the process.
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())


# ── App ───────────────────────────────────────────────────────────────────────

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# ── Services (Lazily Initialized) ─────────────────────────────────────────────
_neo4j_client = None
_health_service = None
_knowledge_service = None
_impact_service = None
_qa_service = None
_retriever = None
_pr_review_service = None
_push_service = None
_onboarding_service = None

def get_retriever():
    global _retriever
    if _retriever is None:
        _retriever = HybridRetriever()
    return _retriever

def get_impact_service():
    global _impact_service
    if _impact_service is None:
        _impact_service = ImpactService(get_neo4j(), get_retriever())
    return _impact_service

def get_neo4j():
    global _neo4j_client
    if _neo4j_client is None:
        _neo4j_client = Neo4jClient()
    return _neo4j_client

def get_health_service():
    global _health_service
    if _health_service is None:
        _health_service = HealthService()
    return _health_service

def get_knowledge_service():
    global _knowledge_service
    if _knowledge_service is None:
        _knowledge_service = KnowledgeService()
    return _knowledge_service

def get_qa_service():
    global _qa_service
    if _qa_service is None:
        _qa_service = QAService(get_neo4j(), get_retriever())
    return _qa_service

def get_pr_review_service():
    global _pr_review_service
    if _pr_review_service is None:
        _pr_review_service = PRReviewService(get_neo4j(), get_retriever())
    return _pr_review_service

def get_push_service():
    global _push_service
    if _push_service is None:
        _push_service = PushService()
    return _push_service

def get_onboarding_service():
    global _onboarding_service
    if _onboarding_service is None:
        _onboarding_service = OnboardingService(get_neo4j(), get_retriever())
    return _onboarding_service

# ── Helpers ───────────────────────────────────────────────────────────────────

# ── Background Loop Management ────────────────────────────────────────────────
_LOOP = None
_THREAD = None

def _start_background_loop(loop):
    asyncio.set_event_loop(loop)
    logger.info("Background asyncio loop started.")
    loop.run_forever()

def get_loop():
    """Returns the dedicated background event loop, starting it if necessary."""
    global _LOOP, _THREAD
    if _LOOP is None:
        if sys.platform == 'win32':
            _LOOP = asyncio.SelectorEventLoop(selectors.SelectSelector())
        else:
            _LOOP = asyncio.new_event_loop()
        _THREAD = threading.Thread(target=_start_background_loop, args=(_LOOP,), daemon=True)
        _THREAD.start()
    return _LOOP


def _run_async(coro):
    """Run an async coroutine thread-safely in the background loop."""
    loop = get_loop()
    # Schedule the coroutine and wait for result
    future = asyncio.run_coroutine_threadsafe(coro, loop)
    # We set a generous timeout for concurrent LLM generations (600s / 10 mins)
    return future.result(timeout=600.0)


def _validate_request():
    """Validate that required fields and env vars are present.
    Returns None on success, or a (response, status_code) tuple on failure."""
    if not os.getenv("OPENROUTER_API"):
        return jsonify({"error": "OPENROUTER_API not configured on server"}), 500

    data = flask_request.get_json(silent=True)
    if not data or not data.get("requirements"):
        return jsonify({"error": "Missing 'requirements' field in request body (min 10 chars)"}), 400

    if len(data["requirements"].strip()) < 10:
        return jsonify({"error": "'requirements' must be at least 10 characters"}), 400

    return None  # validation passed


def _dump_pydantic(items):
    """Serialize a list of Pydantic models or dicts to plain dicts."""
    return [i.model_dump() if hasattr(i, "model_dump") else i for i in items]


def _safe_serialize(obj: Any) -> Any:
    """Recursively serialize an object for JSON, handling Pydantic models."""
    if hasattr(obj, "model_dump"):
        return obj.model_dump()
    if isinstance(obj, list):
        return [_safe_serialize(x) for x in obj]
    if isinstance(obj, dict):
        return {k: _safe_serialize(v) for k, v in obj.items()}
    return obj


# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.route("/api/v1/health", methods=["GET"])
def health_check():
    """Health check endpoint."""
    return jsonify({
        "status": "healthy",
        "service": "kachow-architecture-agent",
        "version": "1.0.0",
        "openrouter_configured": bool(os.getenv("OPENROUTER_API")),
        "github_configured": bool(os.getenv("GITHUB_TOKEN") and os.getenv("GITHUB_REPO")),
        "test_mode": os.getenv("TEST_MODE", "false").lower() == "true",
    })

@app.before_request
def log_request_info():
    logger.info(f"Incoming request: {flask_request.method} {flask_request.url}")

@app.route("/health2", methods=["GET"])
def health2():
    return jsonify({"status": "ok", "message": "Health2 is up"})


@app.route("/api/v1/knowledge/graph", methods=["GET"])
def get_knowledge_graph():
    """Returns the knowledge graph structure for frontend visualization."""
    try:
        client = get_neo4j()
        result = _run_async(client.get_graph_data())
        return jsonify(result)
    except Exception as e:
        logger.error(f"Graph endpoint failed: {e}\n{traceback.format_exc()}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/v1/knowledge/health", methods=["GET"])
def get_knowledge_health():
    """Returns the knowledge graph health metrics."""
    try:
        service = get_health_service()
        result = _run_async(service.get_system_health())
        return jsonify(result)
    except Exception as e:
        logger.error(f"Health endpoint failed: {e}\n{traceback.format_exc()}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/v1/knowledge/ingest", methods=["POST"])
def ingest_file():
    """
    Ingests a file into the knowledge graph.
    Request body: { "repo": "...", "file_path": "...", "content": "..." }
    """
    data = flask_request.get_json()
    if not data or not all(k in data for k in ["repo", "file_path", "content"]):
        return jsonify({"error": "Missing repo, file_path or content"}), 400
    
    try:
        service = get_knowledge_service()
        result = _run_async(service.process_file(
            data["repo"], data["file_path"], data["content"]
        ))
        return jsonify({"status": "success", "chunks_processed": len(result)})
    except Exception as e:
        logger.error(f"Ingest endpoint failed: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/v1/knowledge/ask", methods=["POST"])
def ask_knowledge_base():
    """
    Asks a natural language question answered using the Knowledge Graph.
    Request body: { "question": "..." }
    """
    data = flask_request.get_json()
    if not data or not data.get("question"):
        return jsonify({"error": "Missing 'question' in request body"}), 400
        
    try:
        service = get_qa_service()
        history = data.get("history", [])
        result = _run_async(service.answer_question(data["question"], history=history))
        return jsonify(result)
    except Exception as e:
        logger.error(f"QA endpoint failed: {e}\n{traceback.format_exc()}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/v1/knowledge/questions", methods=["GET"])
def get_sample_questions():
    """Returns dynamic sample questions for the codebase."""
    questions = [
        {"query": "How is the impact analysis scoring calculated?", "tag": "Logic"},
        {"query": "Where are the Neo4j connection settings defined?", "tag": "Config"},
        {"query": "Which services are involved in the 'What-If' flow?", "tag": "Architecture"},
        {"query": "How does the search retriever combine vector and graph data?", "tag": "Core"}
    ]
    return jsonify(questions)


@app.route("/api/v1/knowledge/impact/scenarios", methods=["GET"])
def get_impact_scenarios():
    """Returns suggested What-If scenarios."""
    try:
        service = get_impact_service()
        scenarios = _run_async(service.get_suggested_scenarios())
        return jsonify(scenarios)
    except Exception as e:
        logger.error(f"Scenarios endpoint failed: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/v1/knowledge/impact/analyze", methods=["POST"])
def analyze_impact():
    """Performs architectural impact analysis."""
    data = flask_request.get_json()
    if not data or not data.get("scenario"):
        logger.warning("Impact Analysis: Missing scenario in request")
        return jsonify({"error": "Missing 'scenario' in request body"}), 400
    
    logger.info(f"Impact Analysis: Received request for scenario: {data['scenario']}")
    try:
        service = get_impact_service()
        logger.info("Impact Analysis: Calling ImpactService.analyze_impact...")
        result = _run_async(service.analyze_impact(data["scenario"]))
        
        if result and "error" in result:
            logger.error(f"Impact Analysis: Service returned error: {result['error']}")
        else:
            logger.info("Impact Analysis: Successfully completed analysis and report generation.")
            
        return jsonify(result)
    except Exception as e:
        logger.error(f"Impact Analysis endpoint failed: {e}\n{traceback.format_exc()}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/v1/webhook/github", methods=["POST"])
def github_webhook():
    """
    Receives GitHub webhook payloads for PR events.
    Triggers the PR review pipeline on 'opened' or 'synchronize' actions.
    """
    # Verify webhook signature if secret is configured
    webhook_secret = os.getenv("GITHUB_WEBHOOK_SECRET")
    if webhook_secret:
        import hmac as _hmac
        import hashlib as _hashlib
        signature = flask_request.headers.get("X-Hub-Signature-256", "")
        body = flask_request.get_data()
        expected = "sha256=" + _hmac.new(
            webhook_secret.encode(), body, _hashlib.sha256
        ).hexdigest()
        if not _hmac.compare_digest(signature, expected):
            logger.warning("⚠️ Webhook signature verification failed")
            return jsonify({"error": "Invalid signature"}), 403

    event_type = flask_request.headers.get("X-GitHub-Event", "")
    data = flask_request.get_json(silent=True)

    if not data:
        return jsonify({"error": "No payload"}), 400

    # Handle push events
    if event_type == "push":
        logger.info("🔔 Webhook: Received 'push' event. Triggering PushService...")
        try:
            push_service = get_push_service()
            result = _run_async(push_service.process_push_event(data))
            return jsonify(result), 200
        except Exception as e:
            logger.error(f"Push processing failed: {e}\n{traceback.format_exc()}")
            return jsonify({"error": str(e)}), 500

    # Only process pull_request events from this point forward
    if event_type != "pull_request":
        logger.info(f"Ignoring webhook event: {event_type}")
        return jsonify({"status": "ignored", "event": event_type}), 200

    action = data.get("action", "")
    if action not in ["opened", "synchronize", "reopened"]:
        logger.info(f"Ignoring PR action: {action}")
        return jsonify({"status": "ignored", "action": action}), 200

    pr_number = data.get("number")
    pr_title = data.get("pull_request", {}).get("title", "unknown")
    logger.info(f"🔔 Webhook: PR #{pr_number} '{pr_title}' — action: {action}")

    # Run the review pipeline
    try:
        service = get_pr_review_service()
        result = _run_async(service.review_pr(pr_number))
        return jsonify({"status": "reviewed", "result": result}), 200
    except Exception as e:
        logger.error(f"PR review failed: {e}\n{traceback.format_exc()}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/v1/review/pr", methods=["POST"])
def manual_pr_review():
    """
    Manually trigger a PR review.
    Request body: { "pr_number": 123 }
    """
    data = flask_request.get_json()
    if not data or not data.get("pr_number"):
        return jsonify({"error": "Missing 'pr_number' in request body"}), 400

    try:
        service = get_pr_review_service()
        result = _run_async(service.review_pr(int(data["pr_number"])))
        return jsonify(result)
    except Exception as e:
        logger.error(f"Manual PR review failed: {e}\n{traceback.format_exc()}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/v1/knowledge/impact/followup", methods=["POST"])
def impact_followup():
    """Answers a follow-up question about an impact report."""
    data = flask_request.get_json()
    if not data or not all(k in data for k in ["question", "report", "scenario"]):
        return jsonify({"error": "Missing question, report or scenario"}), 400
    
    try:
        service = get_impact_service()
        result = _run_async(service.answer_followup(
            data["question"], data["report"], data["scenario"]
        ))
        return jsonify(result)
    except Exception as e:
        logger.error(f"Follow-up endpoint failed: {e}\n{traceback.format_exc()}")
        return jsonify({"error": str(e)}), 500


# ── Onboarding & Learning Path Endpoints ──────────────────────────────────────

@app.route("/api/v1/onboarding/generate", methods=["POST"])
def generate_onboarding_path():
    """Generate a learning path for a given role, tailored to a specific repo.
    Request body: { "role": "backend_engineer", "repo_name": "owner/repo", "repo_description": "..." }
    """
    data = flask_request.get_json()
    if not data or not data.get("role"):
        return jsonify({"error": "Missing 'role' in request body"}), 400

    role = data["role"].strip().lower().replace(" ", "_")
    repo_name = data.get("repo_name")
    repo_description = data.get("repo_description", "")

    try:
        service = get_onboarding_service()
        
        async def generate_concurrently():
            # Generate path and tasks concurrently to halve the total time.
            # Starter tasks don't strictly need the generated path to be useful.
            path_task = asyncio.create_task(service.generate_learning_path(role, repo_name=repo_name))
            tasks_task = asyncio.create_task(service.generate_starter_tasks(
                {}, role,
                repo_name=repo_name,
                repo_description=repo_description,
            ))
            return await asyncio.gather(path_task, tasks_task)
            
        learning_path, starter_tasks = _run_async(generate_concurrently())
        
        return jsonify({
            "learning_path": learning_path,
            "starter_tasks": starter_tasks,
        })
    except Exception as e:
        logger.error(f"Onboarding generate failed: {e}\n{traceback.format_exc()}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/v1/onboarding/paths/<path_id>", methods=["GET"])
def get_onboarding_path(path_id):
    """Get a specific learning path by ID (returned from generate or DB)."""
    # This endpoint is primarily served by the Node.js layer (PostgreSQL).
    # The agent layer can expand module content on demand.
    return jsonify({"error": "Use Node.js /api/v1/onboarding/paths/:id endpoint"}), 404


@app.route("/api/v1/onboarding/paths/<path_id>/module/<module_id>", methods=["GET"])
def get_onboarding_module(path_id, module_id):
    """Get expanded content for a specific module.
    Fetches linked knowledge graph nodes and enriches the module.
    """
    # Module data is passed as query param (base64 JSON) or fetched from DB
    module_json = flask_request.args.get("module_data")
    if not module_json:
        return jsonify({"error": "Missing 'module_data' query parameter"}), 400

    try:
        import base64
        module = json.loads(base64.b64decode(module_json))
        service = get_onboarding_service()
        expanded = _run_async(service.get_module_content(module))
        return jsonify(expanded)
    except Exception as e:
        logger.error(f"Module expand failed: {e}\n{traceback.format_exc()}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/v1/onboarding/roles", methods=["GET"])
def get_available_roles():
    """Return the list of available roles for onboarding."""
    from agent.core.onboarding_service import ROLE_QUERIES
    roles = [
        {"value": key, "label": key.replace("_", " ").title()}
        for key in ROLE_QUERIES.keys()
    ]
    return jsonify(roles)
@app.route("/api/v1/analyze", methods=["POST", "OPTIONS"])
def analyze_only():
    """Run requirements analysis only.

    Request body:
        { "requirements": "Build a real-time chat app with ..." }

    Response:
        { "project_name", "project_summary", "functional_requirements",
          "non_functional_requirements", "constraints", "target_scale" }
    """
    if flask_request.method == "OPTIONS":
        return jsonify({}), 200

    validation_error = _validate_request()
    if validation_error:
        return validation_error

    data = flask_request.get_json()

    try:
        result = _run_async(
            analyze_requirements({"user_requirements": data["requirements"]})
        )

        if result.get("errors"):
            return jsonify({"error": result["errors"]}), 500

        return jsonify({
            "project_name": result.get("project_name", ""),
            "project_summary": result.get("project_summary", ""),
            "functional_requirements": result.get("functional_requirements", []),
            "non_functional_requirements": result.get("non_functional_requirements", []),
            "constraints": result.get("constraints", []),
            "target_scale": result.get("target_scale", "medium"),
        })

    except Exception as e:
        logger.error(f"Analysis endpoint failed: {e}\n{traceback.format_exc()}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/v1/design", methods=["POST", "OPTIONS"])
def analyze_and_design():
    """Run requirements analysis + architecture design.

    Request body:
        { "requirements": "Build a real-time chat app with ..." }

    Response:
        { "analysis": {...}, "architecture_style", "services", "databases",
          "api_endpoints", "api_gateway", "tech_stack_rationale", "decisions" }
    """
    if flask_request.method == "OPTIONS":
        return jsonify({}), 200

    validation_error = _validate_request()
    if validation_error:
        return validation_error

    data = flask_request.get_json()

    try:
        # Phase 1: Analyze requirements
        state = {"user_requirements": data["requirements"]}
        analysis = _run_async(analyze_requirements(state))
        if analysis.get("errors"):
            return jsonify({"error": analysis["errors"], "phase": "analysis"}), 500

        # Phase 2: Design architecture
        state.update(analysis)
        design = _run_async(design_architecture(state))
        if design.get("errors"):
            return jsonify({"error": design["errors"], "phase": "design"}), 500

        return jsonify({
            "analysis": {
                "project_name": analysis.get("project_name", ""),
                "project_summary": analysis.get("project_summary", ""),
                "functional_requirements": analysis.get("functional_requirements", []),
                "non_functional_requirements": analysis.get("non_functional_requirements", []),
                "constraints": analysis.get("constraints", []),
                "target_scale": analysis.get("target_scale", "medium"),
            },
            "architecture_style": design.get("architecture_style", ""),
            "services": _dump_pydantic(design.get("services", [])),
            "databases": _dump_pydantic(design.get("databases", [])),
            "api_endpoints": _dump_pydantic(design.get("api_endpoints", [])),
            "api_gateway": design.get("api_gateway", {}),
            "tech_stack_rationale": design.get("tech_stack_rationale", ""),
            "decisions": _dump_pydantic(design.get("decisions", [])),
        })

    except Exception as e:
        logger.error(f"Design endpoint failed: {e}\n{traceback.format_exc()}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/v1/architect", methods=["POST", "OPTIONS"])
def run_full_pipeline():
    """Full architecture pipeline with Server-Sent Events (SSE) streaming.

    Request body:
        { "requirements": "Build a ...",
          "output_dir": "./output" (optional),
          "github_token": "github_pat_..." (optional, per-project),
          "github_repo": "owner/repo" (optional, per-project) }

    Response: text/event-stream with JSON events:
        data: {"type": "progress", "node": "analyze_requirements", "data": {...}}
        data: {"type": "progress", "node": "design_architecture", "data": {...}}
        ...
        data: {"type": "complete", "state": {...}}
    """
    if flask_request.method == "OPTIONS":
        return jsonify({}), 200

    validation_error = _validate_request()
    if validation_error:
        return validation_error

    data = flask_request.get_json()
    requirements = data["requirements"]
    output_dir = data.get("output_dir", "./output")

    # Per-project GitHub overrides (from project PAT)
    github_token = data.get("github_token") or os.getenv("GITHUB_TOKEN")
    github_repo = data.get("github_repo") or os.getenv("GITHUB_REPO")
    if github_token:
        os.environ["GITHUB_TOKEN"] = github_token
    if github_repo:
        os.environ["GITHUB_REPO"] = github_repo

    def event_stream():
        """Generator that yields SSE events from the async pipeline."""
        import queue
        import threading

        q: queue.Queue = queue.Queue()

        def _run_in_thread():
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                pipeline = compile_architecture_pipeline()
                initial_state = {
                    "user_requirements": requirements,
                    "current_phase": "requirements_analysis",
                    "errors": [],
                    "services": [],
                    "databases": [],
                    "api_endpoints": [],
                    "decisions": [],
                    "scaffolded_files": [],
                    "functional_requirements": [],
                    "non_functional_requirements": [],
                    "constraints": [],
                }
                final_state = {**initial_state}

                async def _run_pipeline():
                    nonlocal final_state
                    async for event in pipeline.astream(initial_state):
                        for node_name, node_output in event.items():
                            errors = node_output.get("errors", [])
                            if errors:
                                q.put(json.dumps({
                                    "type": "error",
                                    "node": node_name,
                                    "errors": errors,
                                }))
                                return

                            serializable = _safe_serialize(node_output)
                            final_state.update(serializable)

                            progress = {"type": "progress", "node": node_name}

                            if node_name == "analyze_requirements":
                                progress["data"] = {
                                    "project_name": serializable.get("project_name", ""),
                                    "project_summary": serializable.get("project_summary", ""),
                                    "functional_requirements": serializable.get("functional_requirements", []),
                                    "non_functional_requirements": serializable.get("non_functional_requirements", []),
                                    "constraints": serializable.get("constraints", []),
                                    "target_scale": serializable.get("target_scale", "medium"),
                                }
                            elif node_name == "design_architecture":
                                progress["data"] = {
                                    "architecture_style": serializable.get("architecture_style", ""),
                                    "num_services": len(serializable.get("services", [])),
                                    "services": serializable.get("services", []),
                                    "databases": serializable.get("databases", []),
                                    "api_endpoints": serializable.get("api_endpoints", []),
                                    "api_gateway": serializable.get("api_gateway", {}),
                                    "tech_stack_rationale": serializable.get("tech_stack_rationale", ""),
                                    "decisions": serializable.get("decisions", []),
                                }
                            elif node_name == "generate_blueprint":
                                progress["data"] = {
                                    "blueprint_length": len(serializable.get("blueprint_markdown", "")),
                                }
                            elif node_name == "scaffold_infrastructure":
                                progress["data"] = {
                                    "num_files": len(serializable.get("scaffolded_files", [])),
                                    "summary": serializable.get("scaffold_summary", ""),
                                    "files": [
                                        {"path": f.get("path", ""), "description": f.get("description", "")}
                                        for f in serializable.get("scaffolded_files", [])
                                        if isinstance(f, dict)
                                    ],
                                }
                            elif node_name == "create_pr":
                                progress["data"] = {
                                    "pr_url": serializable.get("pr_url", ""),
                                    "pr_number": serializable.get("pr_number", 0),
                                    "branch_name": serializable.get("branch_name", ""),
                                    "files_committed": serializable.get("files_committed", []),
                                }

                            q.put(json.dumps(progress))

                    # Write output to disk
                    try:
                        write_output(final_state, output_dir)
                        safe_final = _safe_serialize(final_state)
                        q.put(json.dumps({"type": "complete", "state": safe_final}))
                    except Exception as e:
                        logger.error(f"Output write failed: {e}")
                        q.put(json.dumps({"type": "error", "errors": [f"Output write failed: {str(e)}"]}))

                loop.run_until_complete(_run_pipeline())

            except Exception as e:
                logger.error(f"Pipeline stream failed: {e}\n{traceback.format_exc()}")
                q.put(json.dumps({"type": "error", "errors": [str(e)]}))
            finally:
                loop.close()
                q.put(None)  # sentinel to signal end

        # Start pipeline in a background thread
        thread = threading.Thread(target=_run_in_thread, daemon=True)
        thread.start()

        # Yield SSE events as they arrive in the queue
        while True:
            item = q.get()
            if item is None:
                break
            yield f"data: {item}\n\n"

    return Response(
        event_stream(),
        mimetype="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


# ── Non-streaming full pipeline (alternative) ────────────────────────────────

@app.route("/api/v1/architect/sync", methods=["POST", "OPTIONS"])
def run_full_pipeline_sync():
    """Full pipeline — non-streaming, returns entire result when done.

    Request body:
        { "requirements": "Build a ...",
          "output_dir": "./output" (optional),
          "github_token": "github_pat_..." (optional, per-project),
          "github_repo": "owner/repo" (optional, per-project) }

    Response:
        { "project_name", "architecture_style", "services", "databases",
          "api_endpoints", "blueprint_markdown", "scaffolded_files", ... }
    """
    if flask_request.method == "OPTIONS":
        return jsonify({}), 200

    validation_error = _validate_request()
    if validation_error:
        return validation_error

    data = flask_request.get_json()
    requirements = data["requirements"]
    output_dir = data.get("output_dir", "./output")

    # Per-project GitHub overrides (from project PAT)
    github_token = data.get("github_token") or os.getenv("GITHUB_TOKEN")
    github_repo = data.get("github_repo") or os.getenv("GITHUB_REPO")
    if github_token:
        os.environ["GITHUB_TOKEN"] = github_token
    if github_repo:
        os.environ["GITHUB_REPO"] = github_repo

    try:
        pipeline = compile_architecture_pipeline()
        initial_state = {
            "user_requirements": requirements,
            "current_phase": "requirements_analysis",
            "errors": [],
            "services": [],
            "databases": [],
            "api_endpoints": [],
            "decisions": [],
            "scaffolded_files": [],
            "functional_requirements": [],
            "non_functional_requirements": [],
            "constraints": [],
        }

        async def _execute():
            final_state = {**initial_state}
            async for event in pipeline.astream(initial_state):
                for node_name, node_output in event.items():
                    errors = node_output.get("errors", [])
                    if errors:
                        return {"errors": errors, "failed_node": node_name}
                    final_state.update(node_output)
            return final_state

        result = _run_async(_execute())

        if result.get("errors"):
            return jsonify({
                "error": result["errors"],
                "failed_node": result.get("failed_node", "unknown"),
            }), 500

        # Write output files
        try:
            write_output(result, output_dir)
        except Exception as e:
            logger.warning(f"Output write failed (non-fatal): {e}")

        # Serialize everything
        safe_result = _safe_serialize(result)

        return jsonify(safe_result)

    except Exception as e:
        logger.error(f"Sync pipeline failed: {e}\n{traceback.format_exc()}")
        return jsonify({"error": str(e)}), 500


# ── Error handlers ────────────────────────────────────────────────────────────

@app.errorhandler(404)
def not_found(e):
    return jsonify({
        "error": "Endpoint not found",
        "available_endpoints": [
            "GET  /api/v1/health",
            "GET  /api/v1/knowledge/graph",
            "GET  /api/v1/knowledge/health",
            "POST /api/v1/knowledge/ingest",
            "POST /api/v1/knowledge/ask",
            "GET  /api/v1/knowledge/impact/scenarios",
            "POST /api/v1/knowledge/impact/analyze",
            "POST /api/v1/webhook/github",
            "POST /api/v1/review/pr",
            "POST /api/v1/knowledge/impact/followup",
            "POST /api/v1/onboarding/generate",
            "GET  /api/v1/onboarding/roles",
            "GET  /api/v1/onboarding/paths/<id>/module/<mod_id>",
            "POST /api/v1/analyze",
            "POST /api/v1/design",
            "POST /api/v1/architect      (SSE streaming)",
            "POST /api/v1/architect/sync  (blocking)",
        ],
    }), 404


@app.errorhandler(405)
def method_not_allowed(e):
    return jsonify({"error": "Method not allowed"}), 405


@app.errorhandler(500)
def internal_error(e):
    return jsonify({"error": "Internal server error", "details": str(e)}), 500


# ── Main ──────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    debug = os.getenv("FLASK_DEBUG", "false").lower() == "true"
    logger.info(f"🚀 KA-CHOW Flask API starting on http://0.0.0.0:{port}")
    logger.info(f"   Endpoints:")
    logger.info(f"     GET  /api/v1/health")
    logger.info(f"     GET  /api/v1/knowledge/graph")
    logger.info(f"     GET  /api/v1/knowledge/health")
    logger.info(f"     POST /api/v1/knowledge/ingest")
    logger.info(f"     POST /api/v1/knowledge/ask")
    logger.info(f"     GET  /api/v1/knowledge/impact/scenarios")
    logger.info(f"     POST /api/v1/knowledge/impact/analyze")
    logger.info(f"     POST /api/v1/webhook/github      (webhook)")
    logger.info(f"     POST /api/v1/review/pr            (manual)")
    logger.info(f"     POST /api/v1/knowledge/impact/followup")
    logger.info(f"     POST /api/v1/analyze")
    logger.info(f"     POST /api/v1/design")
    logger.info(f"     POST /api/v1/architect       (SSE streaming)")
    logger.info(f"     POST /api/v1/architect/sync   (blocking)")
    app.run(host="0.0.0.0", port=port, debug=debug)
