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
authenticated() {
    curl "${curl_args[@]}" "${origin[@]}" --config \
        <(printf 'user = "%s:%s"\n' "$OPERATOR_USER" "$OPERATOR_PASSWORD") "$@"
}
anonymous() {
    curl "${curl_args[@]}" "${origin[@]}" "$@"
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
expect "$(anonymous -o /dev/null -w '%{http_code}' "http://$APP_HOST/")" 301 'HTTP redirect'
public_pages=(/ /docs /login)
if [[ $app == holonet ]]; then public_pages+=(/api/docs); else public_pages+=(/demo); fi
for page in "${public_pages[@]}"; do
    expect "$(anonymous -D "$response" -o /dev/null -w '%{http_code}' "$host$page")" 200 "Public page $page"
    if grep -iq '^www-authenticate:' "$response"; then fail "Public page $page asks for operator credentials."; fi
done

if [[ $app == holonet ]]; then
    oauth=/api/auth/github
    operator_action=/api/services/create_service
    webhook_code=401
    webhook=/api/webhooks/00000000-0000-0000-0000-000000000000
    authenticated --fail "$host/health" | grep -q '"status":"ok"'
    wildcard_host=deployment-probe-$(date +%s).$APPS_DOMAIN
    expect_dns "$wildcard_host"
    wildcard_origin=()
    if [[ -n $ip ]]; then wildcard_origin=(--resolve "$wildcard_host:443:$ip"); fi
    expect "$(curl "${curl_args[@]}" "${wildcard_origin[@]}" -o /dev/null -w '%{http_code}' \
        "https://$wildcard_host/")" 404 'Unassigned deployment hostname'
else
    oauth=/backend/auth/github
    operator_action=/api/org/status
    webhook_code=403
    webhook=/api/v1/webhook/github
    authenticated --fail "$host/backend/health" | grep -q '"status":"ok"'
    authenticated --fail "$host/agent/api/v1/health" | grep -q '"openrouter_configured":true'
fi

expect "$(anonymous -D "$response" -o /dev/null -w '%{http_code}' \
    -H 'Content-Type: application/json' --data '{}' "$host$operator_action")" 401 'Operator action'
grep -iq '^www-authenticate: basic ' "$response" || fail 'Missing operator challenge on protected action.'
expect "$(anonymous -D "$response" -o /dev/null -w '%{http_code}' "$host$oauth")" 302 'GitHub OAuth initiation'
grep -iq '^location: https://github.com/login/oauth/authorize' "$response" || fail 'Missing GitHub OAuth redirect.'
expect "$(curl "${curl_args[@]}" "${origin[@]}" -D "$response" -o /dev/null -w '%{http_code}' \
    -H 'Content-Type: application/json' -H 'X-GitHub-Event: ping' --data '{}' "$host$webhook")" "$webhook_code" 'Unsigned webhook'
if grep -iq '^www-authenticate:' "$response"; then fail 'Webhook is behind the operator gate.'; fi
printf '%s passed HTTPS, public UI, operator action, health, OAuth initiation, and unsigned webhook checks (%s).\n' "$app" "${ip:-public DNS}"
