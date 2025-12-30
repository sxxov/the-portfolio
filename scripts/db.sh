#!/usr/bin/env bash
set -euo pipefail

function usage() {
    echo "Usage: $0 pull|push" >&2
    exit 1
}

function error() {
    echo "Error: $*" >&2
    exit 1
}

function require_env() {
    local var_name="$1"
    if [ -z "${!var_name:-}" ]; then
        error "Required environment variable '$var_name' is not set."
    fi
}

if [ "$#" -ne 1 ]; then
    usage
fi

set -a; [ -f ".env" ] && source ".env"; set +a

for var in DEPLOY_USER DEPLOY_HOST DB_USER DB_PASSWORD DB_NAME SITE_HOST; do
	require_env $var
done

NAME=$(jq -r '.name' ./package.json 2>/dev/null)
if [ -z "$NAME" ]; then
	error "Unable to read 'name' from package.json"
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="${SCRIPT_DIR}/db.backups"

function make_backup_path() {
	local host="$1"
	local timestamp
	local safe_host
	timestamp="$(date +"%Y%m%d-%H%M%S")"
	safe_host="$(printf '%s' "$host" | tr -c 'A-Za-z0-9._-' '_')"
	echo "$BACKUP_DIR/${safe_host}-${timestamp}.sql"
}

function backup_remote_db() {
	local backup_path
	backup_path="$(make_backup_path "$DEPLOY_HOST")"
	mkdir -p "$BACKUP_DIR"
	local remote_script="$(cat <<-EOS
		cd ~/$NAME || (echo 'App not found on server'; exit 1)
		set -a; [ -f ".env" ] && source ".env"; set +a
		docker compose exec -T db \
			mariadb-dump \
				-u \$DB_USER \
				-p\$DB_PASSWORD \
				\$DB_NAME \
				--single-transaction \
				--routines \
				--triggers
		EOS
	)"
	ssh "$DEPLOY_USER@$DEPLOY_HOST" "$remote_script" > "$backup_path"
}

function backup_local_db() {
	local backup_path
	backup_path="$(make_backup_path "$SITE_HOST")"
	mkdir -p "$BACKUP_DIR"
	docker compose exec -T db \
		mariadb-dump \
			-u $DB_USER \
			-p$DB_PASSWORD \
			$DB_NAME \
			--single-transaction \
			--routines \
			--triggers > "$backup_path"
}

function pull() {
	backup_local_db
	local remote_script="$(cat <<-EOS
		cd ~/$NAME || (echo 'App not found on server'; exit 1)
		set -a; [ -f ".env" ] && source ".env"; set +a
		docker compose exec -T db \
			mariadb-dump \
				-u \$DB_USER \
				-p\$DB_PASSWORD \
				\$DB_NAME \
				--single-transaction \
				--routines \
				--triggers \
		| sed \
			"s/\/\/\$SITE_HOST/\/\/$SITE_HOST/"
		EOS
	)"
	local local_script="$(cat <<-EOS
		docker compose exec -T db \
			mariadb \
				-u $DB_USER \
				-p$DB_PASSWORD \
				$DB_NAME
		EOS
	)"
	ssh "$DEPLOY_USER@$DEPLOY_HOST" "$remote_script" | $local_script
}

function push() {
	backup_remote_db
	local local_script="$(cat <<-EOS
		docker compose exec -T db \
			mariadb-dump \
				-u $DB_USER \
				-p$DB_PASSWORD \
				$DB_NAME \
				--single-transaction \
				--routines \
				--triggers
		EOS
	)"
	local remote_script="$(cat <<-EOS
		cd ~/$NAME || (echo 'App not found on server'; exit 1)
		set -a; [ -f ".env" ] && source ".env"; set +a
		sed \
			"s/\/\/$SITE_HOST/\/\/\$SITE_HOST/" \
		| docker compose exec -T db \
			mariadb \
				-u \$DB_USER \
				-p\$DB_PASSWORD \
				\$DB_NAME
		EOS
	)"
	$local_script | ssh "$DEPLOY_USER@$DEPLOY_HOST" "$remote_script"
}

case "$1" in
    pull)
		pull
		;;
    push)
		push
		;;
	*)
		usage
		;;
esac
