#!/usr/bin/env bash

set -euo pipefail

PROJECT_ID="${PROJECT_ID:?Set PROJECT_ID first.}"
REGION="${REGION:?Set REGION first.}"
SERVICE_NAME="${SERVICE_NAME:-sparkcore-web}"
IMAGE_URI="${IMAGE_URI:-gcr.io/${PROJECT_ID}/${SERVICE_NAME}}"
ALLOW_UNAUTHENTICATED="${ALLOW_UNAUTHENTICATED:-true}"
ENV_VARS_FILE="${ENV_VARS_FILE:-}"

echo "==> Building image ${IMAGE_URI}"
gcloud builds submit \
  --project "${PROJECT_ID}" \
  --config apps/web/deploy/cloudbuild.web.yaml \
  --substitutions "_IMAGE_URI=${IMAGE_URI}" \
  --suppress-logs \
  .

DEPLOY_ARGS=(
  "${SERVICE_NAME}"
  "--project=${PROJECT_ID}"
  "--region=${REGION}"
  "--image=${IMAGE_URI}"
  "--port=3000"
)

if [[ "${ALLOW_UNAUTHENTICATED}" == "true" ]]; then
  DEPLOY_ARGS+=("--allow-unauthenticated")
fi

if [[ -n "${ENV_VARS_FILE}" ]]; then
  DEPLOY_ARGS+=("--env-vars-file=${ENV_VARS_FILE}")
fi

echo "==> Deploying Cloud Run service ${SERVICE_NAME}"
gcloud run deploy "${DEPLOY_ARGS[@]}"
