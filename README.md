# Archon

Engineering dashboard with repository indexing, a code knowledge graph, codebase Q&A, and architecture generation. Runs a Next.js frontend, Express API, Python agent, PostgreSQL with pgvector, and Neo4j.

## Local setup

Requires Node.js 20+, Python 3.12, uv, and Docker Compose.

```sh
npm run setup:env
npm install --prefix server
npm install --prefix client
uv venv --python 3.12 agent/.venv
uv pip install --python agent/.venv/bin/python -r agent/requirements.txt
npm run db:up
npm run dev
```

Open http://localhost:3000/setup. Database schemas and pgvector initialize automatically on the first database start. Data persists under the ignored `.local/` directory on the project partition; `npm run db:stop` stops databases while retaining data. The local database passwords in the examples are for local development.

## Credentials you supply

1. Register a [GitHub OAuth app](https://github.com/settings/applications/new): homepage `http://localhost:3000`, callback `http://localhost:5555/auth/github/callback`. Set `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` in `server/.env`.
2. Create an [OpenRouter key](https://openrouter.ai/settings/keys), set `OPENROUTER_API` in `agent/.env`, and ensure the account can access the configured chat model and `thenlper/gte-base` embeddings. Change `OPENROUTER_MODEL` if that chat model is unavailable.
3. On the setup page, enter a GitHub repository URL and a personal access token with access to it. Read-only indexing needs repository contents read permission. PR creation and webhook installation additionally need the corresponding write permissions. Alternatively, set `GITHUB_TOKEN` and `GITHUB_REPO=owner/repo` in `agent/.env` for command-line ingestion and agent automation.

Restart `npm run dev` after editing environment files. `setup:env` generates JWT/encryption secrets and never overwrites existing files. Keep those secrets stable so saved tokens remain decryptable. Environment files are ignored by Git.

Chat requests default to `nvidia/nemotron-3.5-super-vl:free`, with free Ling, Gemma, and `openrouter/free` fallbacks. Both the architecture pipeline and impact analyzer share this configuration. `OPENROUTER_FALLBACK_MODELS` accepts a comma-separated fallback list; `OPENROUTER_MAX_TOKENS` sets the output limit per request (default 16,384). Routing caps prompt and completion prices at zero. Free-model availability and account request quotas still apply; fallbacks do not increase daily quotas. These settings cover chat generation, not the separate embedding service.

## Index a repository for codebase Q&A

Set `GITHUB_TOKEN`, `GITHUB_REPO=owner/repo`, and `GITHUB_BRANCH` in `agent/.env`, then run:

```sh
agent/.venv/bin/python agent/scripts/ingest_repo.py
```

This parses supported source files, generates summaries and embeddings through OpenRouter, and writes the code graph to Neo4j and vectors to PostgreSQL. Start with a small repository because each file can make multiple AI requests. Organization setup alone does not index source code. The knowledge-source sync screen stores documents separately.

## Service addresses

| Service | Address |
| --- | --- |
| Frontend | http://localhost:3000 |
| Express API health | http://localhost:5555/health |
| Agent health/configuration | http://localhost:8000/api/v1/health |
| Neo4j browser | http://localhost:7474 |
| PostgreSQL | localhost:5433 |

GitHub webhook delivery needs a public HTTPS endpoint and a shared `GITHUB_WEBHOOK_SECRET` in both server and agent configuration. Basic local setup does not require a tunnel. Some dashboard features still use mock data; starting the app does not make those integrations live.

The existing Next.js configuration skips TypeScript validation during builds. A separate `client/node_modules/.bin/tsc --noEmit -p client/tsconfig.json` currently reports errors in legacy documentation components and several UI types. A successful build is not a clean type check or proof of external integrations.

## Architecture workflow

Design Architecture generates a design and blueprint first. Select a component in the diagram to inspect its responsibility, or expand the canvas for a larger view. Modify Architecture focuses the change input and preserves the selected design as context. Scaffold This Project generates files from that exact design; Download Scaffold returns a ZIP with the real source and blueprint. Export Blueprint downloads the architecture document as Markdown. The web workflow does not automatically publish a GitHub PR.
