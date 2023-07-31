load "helpers/setup-and-teardown"

setup_file() {
  start_server
}

teardown_file() {
  stop_server
}

DEVICE_NAME="device-user"
DEVICE_PHONE="+16505554353"

url="http://${GALOY_ENDPOINT}/auth/create/device-account"

# dev/ory/gen-test-jwt.ts
jwt="eyJhbGciOiJSUzI1NiIsImtpZCI6IjFiOTdiMjIxLWNhMDgtNGViMi05ZDA5LWE1NzcwZmNjZWIzNyJ9.eyJzdWIiOiIxOjcyMjc5Mjk3MzY2OmFuZHJvaWQ6VEVTVEUyRUFDQ09VTlQ1YWE3NWFmNyIsImF1ZCI6WyJwcm9qZWN0cy83MjI3OTI5NzM2NiIsInByb2plY3RzL2dhbG95YXBwIl0sInByb3ZpZGVyIjoiZGVidWciLCJpc3MiOiJodHRwczovL2ZpcmViYXNlYXBwY2hlY2suZ29vZ2xlYXBpcy5jb20vNzIyNzkyOTczNjYifQ.onGs8nlWA1e1vkEwJhjDtNwCk1jLNezQign7HyCNBOuAxtr7kt0Id6eZtbROuDlVlS4KwO7xMrn3xxsQHZYftu_ihO61OKBw8IEIlLn548May3HGSMletWTANxMLnhwJIjph8ACpRTockFida3XIr2cgIHwPqNRigFh0Ib9HTG5cuzRpQUEkpgiXZ2dJ0hJppX5OX6Q2ywN5LD4mqqqbXV3VNqtGd9oCUI-t7Kfry4UpNBhkhkPzMc5pt_NRsIHFqGtyH1SRX7NJd8BZuPnVfS6zmoPHaOxOixEO4zhFgh_DRePg6_yT4ejRF29mx1gBhfKSz81R5_BVtjgD-LMUdg"

random_uuid() {
  if [[ -e /proc/sys/kernel/random/uuid ]]; then
    cat /proc/sys/kernel/random/uuid
  else
    uuidgen
  fi
}

@test "device-account: create" {
  token_name="$DEVICE_NAME"

  username="$(random_uuid)"
  password="$(random_uuid)"

  if [[ "$(uname)" == "Linux" ]]; then
      basic_token="$(echo -n $username:$password | base64 -w 0)"
  else
      basic_token="$(echo -n $username:$password | base64)"
  fi

  auth_header="Authorization: Basic $basic_token"

  appcheck_header="Appcheck: $jwt"

  # Create account
  curl_request "$url" "" "$auth_header" "$appcheck_header"
  auth_token="$(echo $output | jq -r '.result')"
  [[ "$auth_token" != "null" ]] || exit 1
  cache_value "$token_name" "$auth_token"

  # Account is valid
  exec_graphql "$token_name" 'account-details'
  account_id="$(graphql_output '.data.me.defaultAccount.id')"
  [[ "$account_id" != "null" ]] || exit 1
  account_level="$(graphql_output '.data.me.defaultAccount.level')"
  [[ "$account_level" == "ZERO" ]] || exit 1

  # Api is re-entrant
  curl_request "$url" "" "$auth_header" "$appcheck_header"
  refetched_token="$(echo $output | jq -r '.result')"
  [[ "$refetched_token" != "$auth_token" ]] || exit 1
  cache_value "$token_name" "$refetched_token"

  exec_graphql "$token_name" 'account-details'
  refetched_account_id="$(graphql_output '.data.me.defaultAccount.id')"
  [[ "$refetched_account_id" == "$account_id" ]] || exit 1
}

@test "device-account: upgrade" {
  token_name="$DEVICE_NAME"
  phone="$DEVICE_PHONE"
  code="$CODE"

  variables=$(
    jq -n \
    --arg phone "$phone" \
   --arg code "$code" \
    '{input: {phone: $phone, code: $code}}'
  )

  exec_graphql "$token_name" 'user-login-upgrade' "$variables"
  upgrade_success="$(graphql_output '.data.userLoginUpgrade.success')"
  [[ "$upgrade_success" == "true" ]] || exit 1

  # Existing phone accounts return an authToken
  upgrade_auth_token="$(graphql_output '.data.userLoginUpgrade.authToken')"
  [[ "$upgrade_auth_token" == "null" ]] || exit 1

  exec_graphql "$token_name" 'account-details'
  account_level="$(graphql_output '.data.me.defaultAccount.level')"
  [[ "$account_level" == "ONE" ]] || exit 1
}

@test "device-account: delete upgraded account" {
  token_name="$DEVICE_NAME"

  exec_graphql "$token_name" 'account-delete'
  delete_success="$(graphql_output '.data.accountDelete.success')"
  [[ "$delete_success" == "true" ]] || exit 1
}
