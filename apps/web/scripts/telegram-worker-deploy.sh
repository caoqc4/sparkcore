#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
APP_NAME="${APP_NAME:-sparkcore-telegram}"
FLY_CONFIG="${FLY_CONFIG:-${APP_ROOT}/deploy/fly.telegram.toml}"

echo "==> Deploying Fly app ${APP_NAME}"
fly deploy -c "${FLY_CONFIG}"

echo "==> Running post-deploy check for ${APP_NAME}"
pnpm -C "${APP_ROOT}" telegram:worker:post-deploy-check -- --app "${APP_NAME}"
