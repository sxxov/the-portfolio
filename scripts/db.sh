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

function pull() {
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
