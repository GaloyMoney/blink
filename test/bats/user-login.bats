#!/usr/bin/env bats

load "helpers/setup-and-teardown"

setup_file() {
  clear_cache

  start_server
}

teardown_file() {
  stop_server
}

@test "user-login: login user" {
  local token_name="$ALICE_TOKEN_NAME"
  local phone="$ALICE_PHONE"
  local code="$ALICE_CODE"

  local variables=$(
    jq -n \
    --arg phone "$phone" \
    --arg code "$code" \
    '{input: {phone: $phone, code: $code}}'
  )

  exec_graphql 'anon' 'user-login' "$variables"
  auth_token="$(graphql_output '.data.userLogin.authToken')"
  [[ -n "${auth_token}" && "${auth_token}" != "null" ]]
  cache_value "$token_name" "$auth_token"
}

@test "user-login: fetch logged in user wallet ids" {
  local token_name="$ALICE_TOKEN_NAME"

  exec_graphql "$token_name" 'wallet-ids-for-account'

  btc_wallet_id="$(graphql_output '.data.me.defaultAccount.wallets[] | select(.walletCurrency == "BTC") .id')"
  [[ "${btc_wallet_id}" != "null" ]]

  usd_wallet_id="$(graphql_output '.data.me.defaultAccount.wallets[] | select(.walletCurrency == "USD") .id')"
  [[ "${usd_wallet_id}" != "null" ]]
}
