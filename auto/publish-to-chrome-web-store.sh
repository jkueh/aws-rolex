#!/usr/bin/env bash

set -e
set -o pipefail

# REFRESH_TOKEN="${REFRESH_TOKEN?Not set.}"
# CLIENT_ID="${CLIENT_ID?Not set.}"
# CLIENT_SECRET="${CLIENT_SECRET?Not set.}"
# APP_ID="${APP_ID?Not set.}"
# FILE_NAME="${FILE_NAME?Not set.}"
# PUBLISH="${PUBLISH?Not set.}"

echo "Getting token"
TOKEN_RESPONSE="$(
  curl \
  --silent \
  --fail \
  -H "Content-Type: application/json" \
  -d '{ "refresh_token": "'${REFRESH_TOKEN}'", "client_id": "'${CLIENT_ID}'", "client_secret": "'${CLIENT_SECRET}'", "grant_type": "refresh_token" }' \
  -X POST \
  -v https://www.googleapis.com/oauth2/v4/token
)"
TOKEN="$(jq -r '.access_token' <<< "${TOKEN_RESPONSE}")"

echo

echo "Attempting to upload package"
curl \
--silent \
--show-error \
--fail \
-H "Authorization: Bearer ${TOKEN}" \
-H "x-goog-api-version: 2" \
-X PUT \
-T "${FILE_NAME}" \
-v "https://www.googleapis.com/upload/chromewebstore/v1.1/items/${APP_ID}?uploadType=media"

exit

STATUS="$(curl \
  --silent \
  --show-error \
  --fail \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "x-goog-api-version: 2" \
  -X PUT \
  -T "${FILE_NAME}" \
  -v "https://www.googleapis.com/upload/chromewebstore/v1.1/items/${APP_ID}?uploadType=media" \
  | jq -r '.uploadState'
)"

echo

if [ "${STATUS}" = "FAILURE" ]; then
  >&2 echo "Upload status: ${STATUS}"
  exit 1
fi

if [ "${PUBLISH}" == true ]; then
  PUBLISH="$(curl \
    --silent \
    --show-error \
    --fail \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "x-goog-api-version: 2" \
    -X POST \
    -v https://www.googleapis.com/chromewebstore/v1.1/items/${APP_ID}/publish \
    -d publishTarget=default \
    | jq -r '.publishState'
  )"
  
  echo
  
  if [ "${PUBLISH}" = "FAILURE" ]; then
    >&2 echo "Publish status: ${PUBLISH}"
    exit 1
  fi
fi

exit 0
