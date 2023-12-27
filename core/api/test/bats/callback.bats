#!/usr/bin/env bats

load "helpers/setup-and-teardown"
load "helpers/ln"

SVIX_CALLBACK_URL="http://bats-tests:8080/webhook/"

setup_file() {
  clear_cache

  bitcoind_init
  start_trigger
  start_ws_server
  start_server
  start_exporter
  start_callback

  lnds_init
}

teardown_file() {
  stop_trigger
  stop_server
  stop_ws_server
  stop_exporter
  stop_subscriber
  stop_callback
}

setup() {
  reset_redis
}

teardown() {
  if [[ "$(balance_for_check)" != 0 ]]; then
    fail "Error: balance_for_check failed"
  fi

}

@test "callback: setup callback endpoints" {
  token_name="$ALICE_TOKEN_NAME"

  login_user "$ALICE_TOKEN_NAME" "$ALICE_PHONE" "$CODE"

  exec_graphql "$token_name" 'callback-endpoints-list'
  result0="$(graphql_output '.data.me.defaultAccount.callbackEndpoints')"
  [[ "$result0" == "[]" ]] || exit 1

  variables=$(
    jq -n \
    --arg url "$SVIX_CALLBACK_URL" \
    '{input: {url: $url}}'
  )

  exec_graphql "$token_name" 'callback-endpoint-add' "$variables"
  result1="$(graphql_output '.data.callbackEndpointAdd.id')"
  [[ "$result1" != "null" ]] || exit 1

  exec_graphql "$token_name" 'callback-endpoints-list'
  result2="$(graphql_output '.data.me.defaultAccount.callbackEndpoints[0].id')"
  [[ "$result2" != "null" ]] || exit 1
  [[ "$result2" == "$result1" ]] || exit 1

  variables=$(
    jq -n \
    --arg id "$result2" \
    '{input: {id: $id}}'
  )

  exec_graphql "$token_name" 'callback-endpoint-delete' "$variables"
  result3="$(graphql_output '.data.callbackEndpointDelete.success')"
  [[ "$result3" == "true" ]] || exit 1

  exec_graphql "$token_name" 'callback-endpoints-list'
  result4="$(graphql_output '.data.me.defaultAccount.callbackEndpoints')"
  [[ "$result4" == "[]" ]] || exit 1
}
