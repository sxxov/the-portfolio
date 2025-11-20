#!/usr/bin/env bash
set -euo pipefail

function usage() {
    echo "Usage: $0 install" >&2
    exit 1
}

function install() {
	if [ ! -d 'wp-includes' ]; then
		curl -LO https://wordpress.org/latest.tar.gz
		tar --keep-old-files -xzf latest.tar.gz --strip-components=1
		rm latest.tar.gz
	else 
		echo 'WordPress already exists, skipping download'
	fi
}

case "$1" in
	install)
		install
		;;
	*)
		usage
		;;
esac


