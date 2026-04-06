#!/usr/bin/env bash

set -euo pipefail

PROJECT_ID="${PROJECT_ID:?Set PROJECT_ID first.}"
REGION="${REGION:?Set REGION first.}"
SERVICE_NAME="${SERVICE_NAME:-sparkcore-web}"
IMAGE_URI="${IMAGE_URI:-gcr.io/${PROJECT_ID}/${SERVICE_NAME}}"
ALLOW_UNAUTHENTICATED="${ALLOW_UNAUTHENTICATED:-true}"
ENV_VARS_FILE="${ENV_VARS_FILE:-}"

echo "==> Building image ${IMAGE_URI}"
BUILD_ID="$(
  gcloud builds submit \
    --project "${PROJECT_ID}" \
    --config apps/web/deploy/cloudbuild.web.yaml \
    --substitutions "_IMAGE_URI=${IMAGE_URI}" \
    --async \
    --suppress-logs \
    --format='value(metadata.build.id)' \
    .
)"

if [[ -z "${BUILD_ID}" ]]; then
  echo "Failed to capture Cloud Build ID." >&2
  exit 1
fi

echo "==> Waiting for Cloud Build ${BUILD_ID}"
while true; do
  BUILD_STATUS="$(
    gcloud builds describe "${BUILD_ID}" \
      --project "${PROJECT_ID}" \
      --format='value(status)'
  )"

  case "${BUILD_STATUS}" in
    SUCCESS)
      break
      ;;
    FAILURE|INTERNAL_ERROR|TIMEOUT|CANCELLED|EXPIRED)
      echo "Cloud Build ${BUILD_ID} finished with status ${BUILD_STATUS}." >&2
      exit 1
      ;;
    *)
      sleep 5
      ;;
  esac
done

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
