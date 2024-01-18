#!/bin/bash

GQL_DIR="$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")/gql"
HELPERS_DIR="$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")"
source "${HELPERS_DIR}/cli.sh"

GALOY_ENDPOINT="http://localhost:4455/graphql"

register_email_to_user() {
  local token=$1
  local email=$2

  variables="{\"input\": {\"email\": \"$email\"}}"
  registration_id=$(exec_graphql $token 'user-email-registration-initiate' "${variables}" '.data.userEmailRegistrationInitiate.emailRegistrationId')

  email_code_response=$(kratos_pg -c "SELECT body FROM courier_messages WHERE recipient='$email' ORDER BY created_at DESC LIMIT 1;")
  email_code=$(echo "$email_code_response" | grep -oP '\d{6}')

  variables="{\"input\": {\"code\": \"$email_code\", \"emailRegistrationId\": \"$registration_id\"}}"
  exec_graphql $token 'user-email-registration-validate' "${variables}"
}

gql_file() {
  echo "${GQL_DIR}/$1.gql"
}

gql_query() {
  cat "$(gql_file $1)" | tr '\n' ' ' | sed 's/"/\\"/g'
}

exec_graphql() {
  local token=$1
  local query_name=$2
  local variables=${3:-"{}"}
  local output=${4:-"."}

  if [[ ${token} == "anon" ]]; then
    AUTH_HEADER=""
  else
    AUTH_HEADER="Authorization: Bearer ${token}"
  fi

  curl -s \
    -X POST \
    ${AUTH_HEADER:+ -H "$AUTH_HEADER"} \
    -H "Content-Type: application/json" \
    -H "X-Idempotency-Key: $(random_uuid)" \
    -d "{\"query\": \"$(gql_query $query_name)\", \"variables\": $variables}" \
    "${GALOY_ENDPOINT}" | jq -r "${output}"
}

random_uuid() {
  if [[ -e /proc/sys/kernel/random/uuid ]]; then
    cat /proc/sys/kernel/random/uuid
  else
    uuidgen
  fi
}
