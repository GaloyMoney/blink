#!/usr/bin/env bats

load "helpers/setup-and-teardown"

setup_file() {
  clear_cache
  reset_redis

  bitcoind_init
  start_trigger
  start_server

  login_user "${ALICE_TOKEN_NAME}" "${ALICE_PHONE}" "${ALICE_CODE}"
  fund_wallet_from_onchain "${ALICE_TOKEN_NAME}" "${ALICE_TOKEN_NAME}.btc_wallet_id" "0.001"
  login_user "${BOB_TOKEN_NAME}" "${BOB_PHONE}" "${BOB_CODE}"
}

teardown_file() {
  stop_trigger
  stop_server
}

@test "circles: alice sends bob money" {
  fund_wallet_intraledger "${ALICE_TOKEN_NAME}" "${ALICE_TOKEN_NAME}.btc_wallet_id" "${BOB_TOKEN_NAME}.btc_wallet_id" "75000"

  exec_graphql "anon" "initiation-leaders"

  // run cron job

  n_leaders="$(graphql_output '.data.leaders | length')"
  [[ "${n_leaders}" -eq 0 ]] || exit 1
}
