#!/bin/bash

set -e

DEV_DIR="$(dirname "$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")")"
source "${DEV_DIR}/helpers/cli.sh"

hydra_client_name="${1}"
grant_type="${2}"
redirect_uri="${3}"

HYDRA_CLIENT_JSON="${DEV_DIR}/.${hydra_client_name}-hydra-client.json"
HYDRA_CLIENT_ENV="${DEV_DIR}/.${hydra_client_name}-hydra-client.env"
HYDRA_ADMIN_API="http://localhost:4445"
HYDRA_PUBLIC_API="http://localhost:4444"

hydra_cli create client \
    --endpoint "${HYDRA_ADMIN_API}" \
    --grant-type "$grant_type" \
    --response-type code,id_token \
    --format json \
    --scope read --scope write \
    --redirect-uri "$redirect_uri" > "${HYDRA_CLIENT_JSON}" \
    --name "${hydra_client_name}" \
    --skip-consent

CLIENT_ID=$(jq -r '.client_id' < "${HYDRA_CLIENT_JSON}")
CLIENT_SECRET=$(jq -r '.client_secret' < "${HYDRA_CLIENT_JSON}")

AUTHORIZATION_URL="${HYDRA_PUBLIC_API}/oauth2/auth?client_id=$CLIENT_ID&scope=read&response_type=code&redirect_uri=$redirect_uri&state=kfISr3GhH0rqheByU6A6hqIG_f14pCGkZLSCUTHnvlI"

echo "export CLIENT_ID=$CLIENT_ID" > "${HYDRA_CLIENT_ENV}"
echo "export CLIENT_SECRET=$CLIENT_SECRET" >> "${HYDRA_CLIENT_ENV}"
echo "export AUTHORIZATION_URL=$AUTHORIZATION_URL" >> "${HYDRA_CLIENT_ENV}"

mkdir -p "${DEV_DIR}/.envs"
cp "${HYDRA_CLIENT_ENV}" "${DEV_DIR}/.envs/${hydra_client_name}.env"
