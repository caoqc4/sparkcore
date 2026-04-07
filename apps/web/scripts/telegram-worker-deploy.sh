#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
REPO_ROOT="$(cd "${APP_ROOT}/../.." && pwd)"
APP_NAME="${APP_NAME:-sparkcore-telegram}"
FLY_CONFIG="${FLY_CONFIG:-${APP_ROOT}/deploy/fly.telegram.toml}"
DOCKERFILE_PATH="${DOCKERFILE_PATH:-${APP_ROOT}/deploy/Dockerfile.telegram}"
IGNOREFILE_PATH="${IGNOREFILE_PATH:-${APP_ROOT}/deploy/.dockerignore.telegram}"

echo "==> Deploying Fly app ${APP_NAME}"
(
  cd "${REPO_ROOT}"
  fly deploy . \
    --local-only \
    -c "${FLY_CONFIG}" \
    --dockerfile "${DOCKERFILE_PATH}" \
    --ignorefile "${IGNOREFILE_PATH}"
)

echo "==> Running post-deploy check for ${APP_NAME}"
pnpm -C "${APP_ROOT}" telegram:worker:post-deploy-check -- --app "${APP_NAME}"
