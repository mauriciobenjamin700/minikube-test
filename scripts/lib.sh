#!/usr/bin/env bash
set -uo pipefail

APP_LABEL="app=mangalivre-app"

ts() { date +%H:%M:%S.%3N; }
now() { date +%s.%N; }
elapsed() { awk -v a="$1" -v b="$2" 'BEGIN { printf "%.2f", b - a }'; }
step() { printf '\n\033[1;36m[%s] %s\033[0m\n' "$(ts)" "$*"; }

