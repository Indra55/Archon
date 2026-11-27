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
expect "$(curl "${curl_args[@]}" "${origin[@]}" -o /dev/null -w '%{http_code}' "http://$APP_HOST/")" 301 'HTTP redirect'
expect "$(curl "${curl_args[@]}" "${origin[@]}" -D "$response" -o /dev/null -w '%{http_code}' "$host/")" 401 'Operator gate'
grep -iq '^www-authenticate: basic ' "$response" || fail 'Missing operator challenge.'
expect "$(authenticated -o /dev/null -w '%{http_code}' "$host/")" 200 'Operator UI'

if [[ $app == holonet ]]; then
    oauth=/api/auth/github
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
    webhook_code=403
    webhook=/api/v1/webhook/github
    authenticated --fail "$host/backend/health" | grep -q '"status":"ok"'
    authenticated --fail "$host/agent/api/v1/health" | grep -q '"openrouter_configured":true'
fi

expect "$(authenticated -D "$response" -o /dev/null -w '%{http_code}' "$host$oauth")" 302 'GitHub OAuth initiation'
grep -iq '^location: https://github.com/login/oauth/authorize' "$response" || fail 'Missing GitHub OAuth redirect.'
expect "$(curl "${curl_args[@]}" "${origin[@]}" -D "$response" -o /dev/null -w '%{http_code}' \
    -H 'Content-Type: application/json' -H 'X-GitHub-Event: ping' --data '{}' "$host$webhook")" "$webhook_code" 'Unsigned webhook'
if grep -iq '^www-authenticate:' "$response"; then fail 'Webhook is behind the operator gate.'; fi
printf '%s passed HTTPS, UI, health, OAuth initiation, and unsigned webhook checks (%s).\n' "$app" "${ip:-public DNS}"
