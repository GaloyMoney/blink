load "../../helpers/_common.bash"
load "../../helpers/cli.bash"
load "../../helpers/user.bash"

DEVICE_NAME="device-user"

GALOY_ENDPOINT="localhost:4455"
url="http://${GALOY_ENDPOINT}/auth/create/device-account"

# gen-test-jwt.ts
jwt="eyJhbGciOiJSUzI1NiIsImtpZCI6IjFiOTdiMjIxLWNhMDgtNGViMi05ZDA5LWE1NzcwZmNjZWIzNyJ9.eyJzdWIiOiIxOjcyMjc5Mjk3MzY2OmFuZHJvaWQ6VEVTVEUyRUFDQ09VTlQ1YWE3NWFmNyIsImF1ZCI6WyJwcm9qZWN0cy83MjI3OTI5NzM2NiIsInByb2plY3RzL2dhbG95YXBwIl0sInByb3ZpZGVyIjoiZGVidWciLCJpc3MiOiJodHRwczovL2ZpcmViYXNlYXBwY2hlY2suZ29vZ2xlYXBpcy5jb20vNzIyNzkyOTczNjYiLCJleHAiOjI2MzkwMDAwNjksImp0aSI6IlJDZ3dtTmxtYlpkRXdkWXo0ODZYa0QyeGtMVGtXR3BpQ1hCeFhXMVJRQ2sifQ.EXzPtD7sirft9LO38edCsO9FyloRiWvJ8k0hC86MP17qRFZYlEkvGmHZdycTwBbSctw1NAlE3Q1wCVJI7hDpipt1VmCAT2Hyj_8nkWVsAEWCYLU48Hhfb5pHALgQadwLntQVkwazOI3aC3DeTYz_J0nWPjeTVPskqegxyXUgy6P2LZqLDRMQ0vCoGcgbxAKe0PMIQhcIOB_YtgRIYw1Z2chkVX59XFwi--tT4an-Mg5EBQ3IAOgDea9YSsN7D22qZIkWpdepAoNxj7m08Er8ni_OmlRtNQCs2UDCmipKKAoArwhkdlMmBrmLM59WOOR5t_qlyk3JFR5wu4bW3o3yRQ"

@test "device-account: create" {
  token_name="$DEVICE_NAME"

  username="$(random_uuid)"
  password="$(random_uuid)"

  basic_token="$(echo -n $username:$password | base64 -w 0)"

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
  echo "'$refetched_account_id' '$account_id'" >> output.log
  [[ "$refetched_account_id" == "$account_id" ]] || exit 1
}

@test "device-account: upgrade" {
  token_name="$DEVICE_NAME"
  code="000000"
  phone="$(random_phone)"
  cache_value "$token_name.phone" "$phone"

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
