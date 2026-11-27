#!/usr/bin/env bash
# shellcheck shell=bash

fail() {
    printf 'Error: %s\n' "$*" >&2
    exit 1
}

load_config() {
    local file=$1 key line permissions
    [[ -f $file ]] || fail "Config file not found: $file"
    permissions=$(stat -c '%a' "$file")
    (( (8#$permissions & 077) == 0 )) || fail "Run chmod 600 on $file"
    while IFS= read -r line || [[ -n $line ]]; do
        line=${line%$'\r'}
        [[ -z $line || $line == \#* ]] && continue
        [[ $line == *=* ]] || fail "Expected NAME=value in $file"
        key=${line%%=*}
        case $key in
            AWS_REGION|STACK_NAME|SSH_KEY_NAME|SSH_PRIVATE_KEY|ADMIN_CIDR|INSTANCE_TYPE|DISK_GIB|\
            APP_HOST|APPS_DOMAIN|DNS_ZONE|ACME_EMAIL|CLOUDFLARE_API_TOKEN|OPERATOR_USER|OPERATOR_PASSWORD|\
            GITHUB_CLIENT_ID|GITHUB_CLIENT_SECRET|OPENROUTER_API|OPENROUTER_MODEL|GITHUB_TOKEN|GITHUB_REPO|GITHUB_BRANCH)
                printf -v "$key" '%s' "${line#*=}" ;;
            *) fail "Unrecognized config key: $key" ;;
        esac
    done < "$file"
}

valid_dns_name() {
    local label
    local -a labels
    [[ ${#1} -le 253 && $1 == *.* && $1 != .* && $1 != *. && $1 != *..* ]] || return 1
    IFS=. read -r -a labels <<< "$1"
    for label in "${labels[@]}"; do
        [[ $label =~ ^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$ ]] || return 1
    done
}

validate_app_config() {
    local app=$1 key value
    if ! valid_dns_name "${APP_HOST:-}" || ! valid_dns_name "${DNS_ZONE:-}"; then
        fail 'APP_HOST and DNS_ZONE must be lowercase DNS names.'
    fi
    [[ $APP_HOST == *."$DNS_ZONE" ]] || fail 'APP_HOST must be within DNS_ZONE.'
    if [[ $app == holonet ]]; then
        APPS_DOMAIN=${APPS_DOMAIN:-$APP_HOST}
        valid_dns_name "$APPS_DOMAIN" && [[ $APPS_DOMAIN == *."$DNS_ZONE" ]] ||
            fail 'APPS_DOMAIN must be a dedicated subdomain within DNS_ZONE.'
    fi
    [[ ${ACME_EMAIL:-} =~ ^[a-zA-Z0-9._+%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]] ||
        fail 'Set ACME_EMAIL to your certificate contact email.'
    [[ ${OPERATOR_USER:-} =~ ^[a-zA-Z0-9._-]+$ ]] || fail 'Set OPERATOR_USER.'
    [[ ${OPERATOR_PASSWORD:-} =~ ^[a-zA-Z0-9_.~@+-]{16,72}$ ]] ||
        fail 'Set OPERATOR_PASSWORD to 16–72 letters, digits, or ._~@+- characters.'
    for key in CLOUDFLARE_API_TOKEN GITHUB_CLIENT_ID GITHUB_CLIENT_SECRET; do
        value=${!key:-}
        [[ $value =~ ^[A-Za-z0-9_.~-]+$ ]] || fail "Set $key."
    done
    if [[ $app == archon ]]; then
        [[ ${OPENROUTER_API:-} =~ ^[a-zA-Z0-9_.~-]+$ ]] || fail 'Set OPENROUTER_API.'
        [[ ${OPENROUTER_MODEL:-} =~ ^[a-zA-Z0-9._:/-]*$ ]] || fail 'Invalid OPENROUTER_MODEL.'
        if [[ -n ${GITHUB_TOKEN:-} || -n ${GITHUB_REPO:-} ]]; then
            [[ ${GITHUB_TOKEN:-} =~ ^[a-zA-Z0-9_.~-]+$ && ${GITHUB_REPO:-} =~ ^[a-zA-Z0-9_.-]+/[a-zA-Z0-9_.-]+$ ]] ||
                fail 'Set GITHUB_TOKEN and GITHUB_REPO together.'
        fi
        [[ ${GITHUB_BRANCH:-main} =~ ^[a-zA-Z0-9._/-]+$ ]] || fail 'Invalid GITHUB_BRANCH.'
    fi
}
