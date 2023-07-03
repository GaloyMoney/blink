#!/usr/bin/env bats

load "helpers"

setup_file() {
  start_server
}

teardown_file() {
  stop_server
}

@test "onchain payments" {
  exec_graphql 'anon' 'user-login' '{"input": {"phone":"+16505554328","code":"321321"}}'
  auth_token="$(graphql_output '.data.userLogin.authToken')"
  [ "${auth_token}" != "null" ]
  cache_value 'alice' "$auth_token"

  exec_graphql 'alice' 'btc-wallet-id'
  wallet0="$(graphql_output '.data.me.defaultAccount.wallets[0].id')"
  wallet1="$(graphql_output '.data.me.defaultAccount.wallets[1].id')"
  alice_btc_wallet_id="$wallet0"
  if [ $alice_btc_wallet_id = "null" ]; then alice_btc_wallet_id="$wallet1"; fi
  [ "${alice_btc_wallet_id}" != "null" ]
  cache_value 'alice_btc_wallet_id' "$alice_btc_wallet_id"
}
