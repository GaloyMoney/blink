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
}
