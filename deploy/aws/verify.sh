#!/usr/bin/env bash
set -euo pipefail
directory=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
app=$(<"$directory/app-name")
# shellcheck source=config.sh
source "$directory/config.sh"
load_config "$1"
validate_app_config "$app"
ip=${2:-}
expected_ip=${3:-}
host=https://$APP_HOST
origin=()
if [[ -n $ip ]]; then origin=(--resolve "$APP_HOST:443:$ip" --resolve "$APP_HOST:80:$ip"); fi
response=$(mktemp)
trap 'rm -f -- "$response"' EXIT
curl_args=(--noproxy '*' --silent --show-error --connect-timeout 5 --max-time 12)
request() {
    curl "${curl_args[@]}" "${origin[@]}" -D "$response" "$@" || return
    if grep -iq '^www-authenticate:[[:space:]]*basic' "$response"; then
        fail 'Received an HTTP Basic authentication challenge.'
    fi
}
expect() {
    [[ $1 == "$2" ]] || fail "$3 returned HTTP $1 (expected $2)."
}

expect_dns() {
    [[ -n $expected_ip ]] || return 0
    python3 - "$1" "$expected_ip" <<'PYTHON'
import socket
import sys

try:
    addresses = {entry[4][0] for entry in socket.getaddrinfo(sys.argv[1], 443, socket.AF_INET)}
except OSError as error:
    sys.exit(str(error))
if addresses != {sys.argv[2]}:
    sys.exit(f"Waiting for {sys.argv[1]} to resolve to {sys.argv[2]}. Currently: {', '.join(sorted(addresses))}")
PYTHON
}
expect_dns "$APP_HOST"
expect "$(request -o /dev/null -w '%{http_code}' "http://$APP_HOST/")" 301 'HTTP redirect'
public_pages=(/ /docs /login)
if [[ $app == holonet ]]; then
    public_pages+=(/api/docs /services/new)
else
    public_pages+=(/demo /signup /setup /api/auth/session /api/org/status)
fi
for page in "${public_pages[@]}"; do
    expect "$(request -o /dev/null -w '%{http_code}' "$host$page")" 200 "Public route $page"
done

if [[ $app == holonet ]]; then
    oauth=/api/auth/github
    expect "$(request -o /dev/null -w '%{http_code}' -H 'Content-Type: application/json' \
        --data '{}' "$host/api/services/create_service")" 401 'Service creation without a Holonet session'
    webhook_code=401
    webhook=/api/webhooks/00000000-0000-0000-0000-000000000000
    request --fail "$host/health" | grep -q '"status":"ok"'
    wildcard_host=deployment-probe-$(date +%s).$APPS_DOMAIN
    expect_dns "$wildcard_host"
    wildcard_origin=()
    if [[ -n $ip ]]; then wildcard_origin=(--resolve "$wildcard_host:443:$ip"); fi
    expect "$(curl "${curl_args[@]}" "${wildcard_origin[@]}" -o /dev/null -w '%{http_code}' \
        "https://$wildcard_host/")" 404 'Unassigned deployment hostname'
else
    oauth=/backend/auth/github
    expect "$(request -o /dev/null -w '%{http_code}' -H 'Content-Type: application/json' \
        --data '{}' "$host/api/org/status")" 400 'Workspace setup validation'
    webhook_code=403
    webhook=/api/v1/webhook/github
    request --fail "$host/backend/health" | grep -q '"status":"ok"'
    request --fail "$host/agent/api/v1/health" | grep -q '"openrouter_configured":true'
fi

expect "$(request -o /dev/null -w '%{http_code}' "$host$oauth")" 302 'GitHub OAuth initiation'
grep -iq '^location: https://github.com/login/oauth/authorize' "$response" || fail 'Missing GitHub OAuth redirect.'
expect "$(request -o /dev/null -w '%{http_code}' \
    -H 'Content-Type: application/json' -H 'X-GitHub-Event: ping' --data '{}' "$host$webhook")" "$webhook_code" 'Unsigned webhook'
printf '%s passed HTTPS, public UI, app access, health, OAuth initiation, and unsigned webhook checks (%s).\n' "$app" "${ip:-public DNS}"
