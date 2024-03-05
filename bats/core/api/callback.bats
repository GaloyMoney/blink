#!/usr/bin/env bats

load "../../helpers/_common.bash"
load "../../helpers/callback.bash"
load "../../helpers/ledger.bash"
load "../../helpers/user.bash"


setup_file() {
  clear_cache
}

teardown() {
  balance="$(balance_for_check)"
  if [[ "$balance" != 0 ]]; then
    fail "Error: balance_for_check failed ($balance)"
  fi
}

@test "callback: setup callback endpoints" {
  token_name='alice'
  create_user "$token_name"

  exec_graphql "$token_name" 'callback-endpoints-list'
  result0="$(graphql_output '.data.me.defaultAccount.callbackEndpoints')"
  [[ "$result0" == "[]" ]] || exit 1

  variables=$(
    jq -n \
    --arg url "$SVIX_CALLBACK_URL" \
    '{input: {url: $url}}'
  )
  exec_graphql "$token_name" 'callback-endpoint-add' "$variables"
  added_callback_id="$(graphql_output '.data.callbackEndpointAdd.id')"
  [[ "$added_callback_id" != "null" ]] || exit 1

  exec_graphql "$token_name" 'callback-endpoints-list'
  fetched_callback_id="$(graphql_output '.data.me.defaultAccount.callbackEndpoints[0].id')"
  [[ "$fetched_callback_id" != "null" ]] || exit 1
  [[ "$fetched_callback_id" == "$added_callback_id" ]] || exit 1

  variables=$(
    jq -n \
    --arg id "$added_callback_id" \
    '{input: {id: $id}}'
  )
  exec_graphql "$token_name" 'callback-endpoint-delete' "$variables"
  deleted="$(graphql_output '.data.callbackEndpointDelete.success')"
  [[ "$deleted" == "true" ]] || exit 1

  exec_graphql "$token_name" 'callback-endpoints-list'
  endpoints="$(graphql_output '.data.me.defaultAccount.callbackEndpoints')"
  [[ "$endpoints" == "[]" ]] || exit 1
}
