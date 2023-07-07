#!/usr/bin/env bats

load "helpers"

setup_file() {
  start_server
}

teardown_file() {
  stop_server
}

@test "globals: can query globals" {
  exec_graphql 'anon' 'globals'
  network="$(graphql_output '.data.globals.network')"
  [[ "${network}" = "regtest" ]] || exit 1
}
