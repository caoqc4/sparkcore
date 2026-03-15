#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$ROOT_DIR/apps/web/.env.local"
CONFIG_FILE="$ROOT_DIR/scripts/litellm/config.yaml"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE"
  exit 1
fi

set -a
source "$ENV_FILE"
set +a

if [[ -z "${REPLICATE_API_KEY:-}" ]]; then
  echo "Missing REPLICATE_API_KEY in $ENV_FILE"
  exit 1
fi

unset DEBUG

exec uv tool run --from 'litellm[proxy]' litellm --config "$CONFIG_FILE"
