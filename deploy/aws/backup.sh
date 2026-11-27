#!/usr/bin/env bash
set -euo pipefail
umask 077

directory=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
app=$(<"$directory/app-name")
[[ $EUID == 0 ]] || { echo 'Run this script with sudo on the origin.' >&2; exit 1; }
release=$(readlink -e "/opt/$app/current")
compose=(docker compose --project-name "$app" --env-file "$release/.deploy.env"
    -f "$release/deploy/aws/compose.yml")
exec 9>"/run/lock/$app-deploy.lock"
flock -n 9 || { echo 'Wait for the active deployment to finish.' >&2; exit 1; }

install -d -m 0700 "/var/backups/$app"
backup_dir=$(mktemp -d "/var/backups/$app/$(date -u +%Y%m%dT%H%M%SZ).XXXXXXXX")
printf 'Writing private backup to %s\n' "$backup_dir"
install -m 0600 "/etc/$app-deploy/secrets.env" "$backup_dir/secrets.env"
if [[ $app == archon ]]; then
    # Keep PostgreSQL and Neo4j consistent by pausing writers for both dumps.
    restart() { "${compose[@]}" up --detach --no-build --wait --wait-timeout 240; }
    trap restart EXIT
    "${compose[@]}" stop web api agent neo4j
fi
"${compose[@]}" exec -T postgres pg_dump -U "$app" -d "$app" -Fc > "$backup_dir/postgres.dump"
"${compose[@]}" exec -T postgres pg_restore --list < "$backup_dir/postgres.dump" > /dev/null

if [[ $app == archon ]]; then
    for database in neo4j system; do
        "${compose[@]}" run --rm --no-deps -T neo4j neo4j-admin database dump "$database" --to-stdout \
            > "$backup_dir/$database.dump"
        [[ -s $backup_dir/$database.dump ]]
    done
    restart
    trap - EXIT
fi
(
    cd "$backup_dir"
    sha256sum -- *.dump secrets.env > SHA256SUMS
)
printf 'Backup complete at %s\n' "$backup_dir"
