#!/bin/bash

set -e
set -x

DEV_DIR="$(dirname "$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")")"
echo "Sourcing helper files from ${DEV_DIR}"
source "${DEV_DIR}/helpers/auth.sh"
source "${DEV_DIR}/helpers/gql.sh"

user="+16505554310"
user_token=$(login_user "${user}")

create_api_key() {
  echo "Updating username for user: $2" >&2
  local auth_token="$1"
  local name="$2"
  local scopes="$3"

  local variables=$(jq -n \
                  --arg name "$name" \
                  --argjson scopes "$scopes" \
                  '{input: {name: $name, scopes: $scopes}}')

  local response=$(exec_graphql "$auth_token" "api-key-create" "$variables")
  echo "$response" | jq -r '.data.apiKeyCreate.apiKeySecret'
}

scopes_json='["READ","WRITE"]'
api_key_secret=$(create_api_key "$user_token" "my-api" "$scopes_json")
env_file="${DEV_DIR}/.envs/voucher.env"

if grep -q "export ESCROW_TOKEN" "$env_file"; then
  sed -i "s/^export ESCROW_TOKEN=.*/export ESCROW_TOKEN=$api_key_secret/" "$env_file"
else
  echo "export ESCROW_TOKEN=$api_key_secret" >> "$env_file"
fi

echo "DONE"
