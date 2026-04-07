#!/usr/bin/env bash

set -euo pipefail

APP_NAME="${APP_NAME:-sparkcore-telegram}"
FLY_CONFIG="${FLY_CONFIG:-apps/web/deploy/fly.telegram.toml}"

echo "==> Deploying Fly app ${APP_NAME}"
fly deploy -c "${FLY_CONFIG}"

echo "==> Running post-deploy check for ${APP_NAME}"
pnpm -C apps/web telegram:worker:post-deploy-check -- --app "${APP_NAME}"
