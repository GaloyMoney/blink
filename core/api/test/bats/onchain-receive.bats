#!/usr/bin/env bats

load "helpers/setup-and-teardown"
load "helpers/onchain"
load "helpers/ln"

setup_file() {
  clear_cache
  reset_redis

  bitcoind_init
  start_trigger
  start_exporter
  start_server

  login_user "$ALICE_TOKEN_NAME" "$ALICE_PHONE" "$CODE"
  login_user "$BOB_TOKEN_NAME" "$BOB_PHONE" "$CODE"
}

teardown_file() {
  stop_trigger
  stop_server
  stop_exporter
}

teardown() {
  if [[ "$(balance_for_check)" != 0 ]]; then
    fail "Error: balance_for_check failed"
  fi
}



