#!/usr/bin/env bash
# shellcheck shell=bash
# Variables and helpers are initialized by install.sh.
# shellcheck disable=SC2154

cat > "$release/.deploy.env" <<EOF
PG_PASSWORD=$PG_PASSWORD
NEO4J_PASSWORD=$NEO4J_PASSWORD
PUBLIC_ORIGIN=https://$APP_HOST
EOF
cat > "$release/api.env" <<EOF
NODE_ENV=production
PORT=5555
FRONTEND_URL=https://$APP_HOST
GITHUB_CALLBACK_URL=https://$APP_HOST/backend/auth/github/callback
GITHUB_CLIENT_ID=$GITHUB_CLIENT_ID
GITHUB_CLIENT_SECRET=$GITHUB_CLIENT_SECRET
GITHUB_WEBHOOK_SECRET=$WEBHOOK_SECRET
NGROK_URL=https://$APP_HOST
DB_USER=archon
DB_PASSWORD=$PG_PASSWORD
DB_HOST=postgres
DB_PORT=5432
DB_DB=archon
DB_SSL=false
JWT_SECRET=$JWT_SECRET
ENCRYPTION_KEY=$ENCRYPTION_KEY
AGENT_URL=http://agent:8000
EOF
cat > "$release/agent.env" <<EOF
OPENROUTER_API=$OPENROUTER_API
OPENROUTER_MODEL=${OPENROUTER_MODEL:-}
POSTGRES_URL=postgresql://archon:$PG_PASSWORD@postgres:5432/archon
NEO4J_URI=bolt://neo4j:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=$NEO4J_PASSWORD
GITHUB_WEBHOOK_SECRET=$WEBHOOK_SECRET
GITHUB_TOKEN=${GITHUB_TOKEN:-}
GITHUB_REPO=${GITHUB_REPO:-}
GITHUB_BRANCH=${GITHUB_BRANCH:-main}
EOF

compose "$release" up --detach --wait --wait-timeout 240 postgres neo4j
init_database archon "$release/server/database/schema.sql" "$release/server/database/vector.sql"
if [[ -d $previous ]]; then
    for component in api agent web; do
        docker image tag "archon-$component" "archon-previous-$component"
    done
fi
compose "$release" build
if ! compose "$release" up --detach --no-build --wait --wait-timeout 180 ||
    ! (wait_http http://127.0.0.1:3100/ && wait_http http://127.0.0.1:5555/health &&
       wait_http http://127.0.0.1:8000/api/v1/knowledge/health); then
    if [[ -d $previous ]]; then
        # Image tags from the last release are recorded before rebuilding.
        for component in api agent web; do
            if docker image inspect "archon-previous-$component" >/dev/null 2>&1; then
                docker image tag "archon-previous-$component" "archon-$component"
            fi
        done
        compose "$previous" up --detach --no-build
    fi
    fail 'Archon startup failed. Check Docker Compose logs.'
fi
ln -sfnT "$release" "$app_dir/current"
