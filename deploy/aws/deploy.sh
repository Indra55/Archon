#!/usr/bin/env bash
set -euo pipefail
umask 077

directory=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
repo=$(cd "$directory/../.." && pwd)
app=$(<"$directory/app-name")
# shellcheck source=config.sh
source "$directory/config.sh"

usage() {
    cat <<'HELP'
Usage: deploy/aws/deploy.sh ACTION CONFIG [OPTION]

  plan                          Prepare an AWS change set without executing it.
  prepare [--worktree]          Provision, transfer the release, and verify HTTPS at the EC2 IP.
  dns-plan                      Show the current and proposed DNS records.
  publish [--replace-dns]       Verify the origin, publish DNS, and verify public HTTPS.
  verify                        Check public HTTPS, OAuth routing and webhook signature rejection.
  ssh                           Connect to the EC2 origin.

Prepare uses a clean git archive of HEAD. Use --worktree to transfer tracked working-tree
files and the scripts under deploy/aws before committing. Never put credentials in tracked files.
HELP
}

if [[ ${1:-} == --help ]]; then usage; exit 0; fi
(( $# >= 2 && $# <= 3 )) || { usage >&2; exit 2; }
action=$1
config=$(realpath "$2")
option=${3:-}
case "$action:$option" in
    plan:|prepare:|prepare:--worktree|dns-plan:|publish:|publish:--replace-dns|verify:|ssh:) ;;
    *) usage >&2; exit 2 ;;
esac
load_config "$config"
validate_app_config "$app"
[[ ${AWS_REGION:-} =~ ^[a-z]{2}(-[a-z0-9]+)+-[0-9]+$ ]] || fail 'Set AWS_REGION.'
[[ ${STACK_NAME:-} =~ ^[a-zA-Z][a-zA-Z0-9-]{0,127}$ ]] || fail 'Set STACK_NAME.'
command -v aws >/dev/null || fail 'Install AWS CLI v2 and sign in first.'
export AWS_PAGER=
aws=(aws --region "$AWS_REGION")

stack_ip() {
    public_ip=$("${aws[@]}" cloudformation describe-stacks --stack-name "$STACK_NAME" \
        --query "Stacks[0].Outputs[?OutputKey=='PublicIp'].OutputValue | [0]" --output text)
    [[ $public_ip =~ ^[0-9]+(\.[0-9]+){3}$ ]] || fail 'The CloudFormation stack has no Elastic IP output.'
}

provision() {
    [[ -n ${SSH_KEY_NAME:-} && -n ${ADMIN_CIDR:-} ]] || fail 'Set SSH_KEY_NAME and ADMIN_CIDR.'
    bash "$directory/provision.sh" "$1" "$app" "$STACK_NAME" "$AWS_REGION" \
        "$SSH_KEY_NAME" "$ADMIN_CIDR" "${INSTANCE_TYPE:-t3.medium}" "${DISK_GIB:-60}"
}

ssh_options() {
    [[ -f ${SSH_PRIVATE_KEY:-} ]] || fail 'Set SSH_PRIVATE_KEY to your absolute local key path.'
    ssh_args=(-i "$SSH_PRIVATE_KEY" -o IdentitiesOnly=yes -o BatchMode=yes
        -o ConnectTimeout=8 -o StrictHostKeyChecking=accept-new)
    ssh_target=ubuntu@$public_ip
}

cloudflare() {
    CLOUDFLARE_API_TOKEN=$CLOUDFLARE_API_TOKEN python3 "$directory/dns.py" "$@"
}

network_checks() {
    bash "$directory/verify.sh" "$config" "$@"
}

prepare() (
    [[ -f ${SSH_PRIVATE_KEY:-} ]] || fail 'Set SSH_PRIVATE_KEY before provisioning.'
    cloudflare zone "$DNS_ZONE"
    local staging bundle remote=
    staging=$(mktemp -d)
    # shellcheck disable=SC2329 # Invoked by the EXIT trap.
    cleanup() {
        if [[ $remote =~ ^/tmp/app-release\.[a-zA-Z0-9]+$ ]]; then
            # shellcheck disable=SC2029
            ssh "${ssh_args[@]}" "$ssh_target" "rm -rf -- '$remote'" || true
        fi
        rm -rf -- "$staging"
    }
    trap cleanup EXIT
    bundle=$staging/release.tar.gz
    if [[ $option == --worktree ]]; then
        git -C "$repo" ls-files -z --cached --others --exclude-standard -- deploy/aws > "$staging/deploy-files"
        git -C "$repo" ls-files -z --cached -- . ':!deploy/aws' > "$staging/app-files"
        cat "$staging/app-files" "$staging/deploy-files" |
            tar --directory "$repo" --null -T - -czf "$bundle"
    else
        git -C "$repo" cat-file -e HEAD:deploy/aws/install.sh 2>/dev/null ||
            fail 'Commit the deployment files first or run prepare with --worktree.'
        git -C "$repo" archive --format=tar.gz HEAD > "$bundle"
    fi
    provision apply
    stack_ip
    ssh_options
    remote=
    for _ in {1..30}; do
        if remote=$(ssh "${ssh_args[@]}" "$ssh_target" 'mktemp -d /tmp/app-release.XXXXXXXX'); then
            break
        fi
        sleep 4
    done
    [[ $remote =~ ^/tmp/app-release\.[a-zA-Z0-9]+$ ]] || fail 'Could not create the remote release directory.'
    scp "${ssh_args[@]}" "$bundle" "$ssh_target:$remote/release.tar.gz"
    # Copy only the application settings. The EC2 instance receives no AWS credentials or SSH private key.
    sed -E '/^(AWS_REGION|STACK_NAME|SSH_KEY_NAME|SSH_PRIVATE_KEY|ADMIN_CIDR|INSTANCE_TYPE|DISK_GIB)=/d' \
        "$config" > "$staging/config"
    scp "${ssh_args[@]}" "$staging/config" "$ssh_target:$remote/config"
    # shellcheck disable=SC2029
    ssh "${ssh_args[@]}" "$ssh_target" "set -eu; trap 'rm -rf -- $remote' EXIT; \
        mkdir '$remote/source'; tar -xzf '$remote/release.tar.gz' -C '$remote/source'; \
        sudo -n bash '$remote/source/deploy/aws/install.sh' '$remote/config'"
    remote=
    network_checks "$public_ip"
    printf 'Origin verified. Run %s dns-plan %s and then publish when ready.\n' "$0" "$config"
)

names=("$APP_HOST")
if [[ $app == holonet ]]; then names+=("*.$APPS_DOMAIN"); fi
case $action in
    plan) provision plan ;;
    prepare) prepare ;;
    ssh) stack_ip; ssh_options; exec ssh "${ssh_args[@]}" "$ssh_target" ;;
    verify) stack_ip; network_checks "" "$public_ip" ;;
    dns-plan)
        stack_ip
        cloudflare plan "$DNS_ZONE" "$public_ip" "${names[@]}"
        ;;
    publish)
        stack_ip
        network_checks "$public_ip"
        flags=()
        if [[ $option == --replace-dns ]]; then
            flags=(--replace-dns --backup "$(dirname "$config")/$app-dns-before-$(date -u +%Y%m%dT%H%M%SZ).json")
        fi
        cloudflare publish "$DNS_ZONE" "$public_ip" "${names[@]}" "${flags[@]}"
        for _ in {1..30}; do
            if network_checks "" "$public_ip"; then exit 0; fi
            sleep 5
        done
        fail 'DNS was published, but public verification has not passed. Retry deploy.sh verify.'
        ;;
esac
