#!/usr/bin/env bash
set -euo pipefail
umask 077

directory=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
source_dir=$(cd "$directory/../.." && pwd)
app=$(<"$directory/app-name")
# shellcheck source=config.sh
source "$directory/config.sh"
[[ $EUID == 0 ]] || fail 'Run the installer with sudo on the Ubuntu EC2 origin.'
[[ $# == 1 ]] || fail 'Usage: sudo bash deploy/aws/install.sh /path/to/private-config'
load_config "$1"
validate_app_config "$app"
# shellcheck disable=SC1091
source /etc/os-release
[[ $ID == ubuntu && $VERSION_ID == 24.04 && $(uname -m) == x86_64 ]] ||
    fail 'This installer requires Ubuntu 24.04 on x86_64.'
exec 9>"/run/lock/$app-deploy.lock"
flock -n 9 || fail 'Another installation is running.'

state=/etc/$app-deploy
app_dir=/opt/$app
install -d -o root -g www-data -m 0710 "$state"
install -d -m 0755 "$app_dir" "$app_dir/releases"
identity="$APP_HOST${APPS_DOMAIN:+ $APPS_DOMAIN}"
if [[ -e $state/hostnames && $(<"$state/hostnames") != "$identity" ]]; then
    fail "The installed hostnames are recorded in $state/hostnames. Use a separate origin for different hostnames."
fi

if ! dpkg-query -W -f='${db:Status-Abbrev}\n' nginx certbot \
    python3-certbot-dns-cloudflare docker.io docker-compose-v2 ca-certificates curl git unzip 2>/dev/null |
    awk '$1 == "ii" {count++} END {exit count != 9}'; then
    export DEBIAN_FRONTEND=noninteractive
    apt-get update -o Acquire::Retries=3
    apt-get install -y -o DPkg::Lock::Timeout=120 -o Acquire::Retries=3 nginx certbot python3-certbot-dns-cloudflare \
        docker.io docker-compose-v2 ca-certificates curl git unzip
fi
systemctl enable --now docker nginx
docker compose version

# Store the installation's secrets once. A restored database must use its original keys.
if [[ ! -e $state/secrets.env ]]; then
    {
        printf 'PG_PASSWORD=%s\n' "$(openssl rand -hex 24)"
        printf 'NEO4J_PASSWORD=%s\n' "$(openssl rand -hex 24)"
        printf 'JWT_SECRET=%s\n' "$(openssl rand -hex 32)"
        printf 'SESSION_SECRET=%s\n' "$(openssl rand -hex 32)"
        printf 'ENCRYPTION_KEY=%s\n' "$(openssl rand -hex 16)"
        printf 'WEBHOOK_SECRET=%s\n' "$(openssl rand -hex 32)"
    } > "$state/secrets.new"
    mv -T "$state/secrets.new" "$state/secrets.env"
fi
# shellcheck disable=SC1091
source "$state/secrets.env"

printf 'dns_cloudflare_api_token = %s\n' "$CLOUDFLARE_API_TOKEN" > "$state/cloudflare.ini"
domains=(-d "$APP_HOST")
if [[ $app == holonet ]]; then domains+=(-d "*.$APPS_DOMAIN"); fi
certbot certonly --non-interactive --agree-tos --email "$ACME_EMAIL" \
    --cert-name "$app-production" --keep-until-expiring \
    --dns-cloudflare --dns-cloudflare-credentials "$state/cloudflare.ini" \
    --dns-cloudflare-propagation-seconds 45 "${domains[@]}"
install -m 0755 "$directory/reload-nginx.sh" "/etc/letsencrypt/renewal-hooks/deploy/50-$app-nginx"
systemctl enable --now certbot.timer

release=$(mktemp -d "$app_dir/releases/$(date -u +%Y%m%dT%H%M%SZ).XXXXXXXX")
previous=$(readlink -f "$app_dir/current" || true)
if [[ -d $source_dir/.git ]]; then
    git -C "$source_dir" -c safe.directory="$source_dir" archive HEAD | tar -x -C "$release"
else
    # The controller sends only repository files and keeps its private config outside this tree.
    tar -C "$source_dir" -cf - . |
        tar -xf - -C "$release"
fi

compose() {
    local release_dir=$1
    shift
    docker compose --project-name "$app" --env-file "$release_dir/.deploy.env" \
        -f "$release_dir/deploy/aws/compose.yml" "$@"
}

wait_http() {
    local url=$1
    for _ in {1..60}; do
        if curl --fail --silent --max-time 4 "$url" >/dev/null; then return; fi
        sleep 2
    done
    fail "Service did not become ready at $url"
}

init_database() {
    local user=$1
    shift
    local tables
    tables=$(compose "$release" exec -T postgres psql -XAt -v ON_ERROR_STOP=1 -U "$user" -d "$user" \
        -c "SELECT to_regclass('public.users') IS NOT NULL")
    if [[ $tables == f ]]; then
        cat "$@" | compose "$release" exec -T postgres psql -X1 -v ON_ERROR_STOP=1 -U "$user" -d "$user"
    else
        printf 'Using the existing %s database.\n' "$user"
    fi
}

chmod 0755 "$release"
# shellcheck source=install-app.sh
source "$directory/install-app.sh"

# Build/check the new nginx configuration before making it permanent.
nginx_site=/etc/nginx/sites-enabled/$app-aws.conf
nginx_backup=$state/nginx.previous
if [[ -f $nginx_site ]]; then cp "$nginx_site" "$nginx_backup"; fi
sed -e "s/@APP_HOST@/$APP_HOST/g" -e "s/@APPS_DOMAIN@/${APPS_DOMAIN:-}/g" \
    "$directory/nginx.conf" > "$nginx_site"
if ! nginx -t || ! systemctl reload nginx; then
    if [[ -f $nginx_backup ]]; then mv -T "$nginx_backup" "$nginx_site"; else rm -f "$nginx_site"; fi
    fail 'Nginx rejected the new configuration.'
fi
rm -f "$nginx_backup"
printf '%s\n' "$identity" > "$state/hostnames"
printf 'Installed %s in %s. Verify HTTPS before publishing DNS.\n' "$app" "$release"
