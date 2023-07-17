#!/usr/bin/env bats

load "helpers/setup-and-teardown"

setup_file() {
  start_ws_server
  start_server
}

teardown_file() {
  stop_server
  stop_ws_server
}

@test "public: can query globals" {
  exec_graphql 'anon' 'globals'
  network="$(graphql_output '.data.globals.network')"
  [[ "${network}" = "regtest" ]] || exit 1
}

@test "public: can subscribe to price" {
  subscribe_to price-sub
  retry 10 1 grep 'Data:' .e2e-subscriber.log
  stop_subscriber
}
