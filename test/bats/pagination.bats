#!/usr/bin/env bats

load "helpers/setup-and-teardown"
load "helpers/ln"

setup_file() {
  clear_cache

  bitcoind_init
  start_trigger
  start_server
  start_exporter

  initialize_user_from_onchain "$ALICE_TOKEN_NAME" "$ALICE_PHONE" "$CODE"
}

teardown_file() {
  stop_trigger
  stop_server
  stop_exporter
}

setup() {
  reset_redis
}

teardown() {
  [[ "$(balance_for_check)" == 0 ]] || exit 1
}

btc_amount=1000
usd_amount=50

@test "pagination: seeding bob transactions" {
  login_user \
    "$BOB_TOKEN_NAME" \
    "$BOB_PHONE"  \
    "$CODE"

  username="bob"

  variables=$(
      jq -n \
      --arg username "$username" \
      '{input: {username: $username}}'
  )

  exec_graphql "$BOB_TOKEN_NAME" 'user-update-username' "$variables"

  token_name="$ALICE_TOKEN_NAME"
  btc_wallet_name="$token_name.btc_wallet_id"

  to_token_name="$BOB_TOKEN_NAME"

  for i in {1..100}; do
    send_btc_intraledger \
      "$token_name" \
      "$token_name.btc_wallet_id" \
      "$to_token_name.btc_wallet_id" \
      $i
  done

  account_transactions_query='.data.me.defaultAccount.transactions.edges[]'

  exec_graphql "$token_name" 'transactions' '{"first": 100}'

  echo $output \
    | jq -r "$account_transactions_query" \
    | jq -s "length"

  exit 1
}
