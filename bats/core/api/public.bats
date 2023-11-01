#!/usr/bin/env bats

load "../../helpers/_common.bash"

setup_file() {
  start_services "api"
  await_api_is_up
}

teardown_file() {
  stop_services
}

@test "public: can query globals" {
  exec_graphql 'anon' 'globals'
  network="$(graphql_output '.data.globals.network')"
  [[ "${network}" = "regtest" ]] || exit 1
}
