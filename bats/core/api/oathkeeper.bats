#!/usr/bin/env bats

load "../../helpers/_common.bash"
load "../../helpers/user.bash"

OATHKEEPER_ENDPOINT="http://localhost:4456/decisions/"

check_is_uuid() {
  uuid_string=$1

  uuid_regex='^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
  echo $uuid_string | grep -Eq "$uuid_regex"
}

decode_jwt() {
  local jwt="$1"
  local part="$2"

  # Split JWT into parts
  local header="$(echo "$jwt" | cut -d "." -f 1)"
  local payload="$(echo "$jwt" | cut -d "." -f 2)"
  local signature="$(echo "$jwt" | cut -d "." -f 3)"

  # Helper to decode Base64Url
  decode_base64url() {
    local data="$1"
    local len=${#data}

    # Add padding
    local mod=$((len % 4))
    if [[ $mod -eq 2 ]]; then data="${data}=="; fi
    if [[ $mod -eq 3 ]]; then data="${data}="; fi

    # Translate base64url to base64
    local url_decoded="$(echo "$data" | tr '_-' '/+')"

    echo "$url_decoded" | base64 --decode
  }

  case "$part" in
    header)
      decode_base64url "$header"
      ;;
    payload)
      decode_base64url "$payload"
      ;;
    signature)
      # Not decoding signature, just showing it
      echo "$signature"
      ;;
    *)
      echo "Invalid part. Choose header, payload, or signature."
      ;;
  esac
}

exec_oathkeeper() {
  local token_name=$1

  if [[ ${token_name} == "anon" ]]; then
    AUTH_HEADER=""
  else
    AUTH_HEADER="Authorization: Bearer $(read_value ${token_name})"
  fi

  if [[ "${BATS_TEST_DIRNAME}" != "" ]]; then
    run_cmd="run"
  else
    run_cmd=""
  fi

  ${run_cmd} curl -s -I \
    -X POST \
    ${AUTH_HEADER:+ -H "$AUTH_HEADER"} \
    -H "Content-Type: application/json" \
    "${OATHKEEPER_ENDPOINT}graphql"

  echo "GQL output: '$output'"
}

oathkeeper_jwt() {
  echo $output \
  | grep -o 'Authorization: Bearer [^ ]*' \
  | awk '{print $3}'
}

@test "oathkeeper: returns anon if no bearer assets" {
  exec_oathkeeper 'anon'
  jwt=$(oathkeeper_jwt)
  cache_value 'anon.oath' $jwt

  subject=$(decode_jwt "$jwt" 'payload' | jq -r '.sub')
  [[ "$subject" == "anon" ]] || exit 1
}

@test "oathkeeper: error for an invalid token" {
  invalid_jwt="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
  cache_value 'invalid.oath' $jwt

  exec_oathkeeper 'invalid.oath'
  echo $output | grep 'HTTP/1.1 401 Unauthorized' || exit 1
}

@test "oathkeeper: return userId if bearer assets is present" {
  create_user 'alice'

  exec_oathkeeper 'alice'
  jwt=$(oathkeeper_jwt)
  cache_value 'alice.oath' $jwt

  subject=$(decode_jwt "$jwt" 'payload' | jq -r '.sub')
  check_is_uuid "$subject" || exit 1
}
