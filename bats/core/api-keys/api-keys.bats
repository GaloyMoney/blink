#!/usr/bin/env bats

load "../../helpers/setup-and-teardown.bash"

setup_file() {
  start_services "api-keys"
  await_api_is_up
}

teardown_file() {
  stop_services
}

@test "api-keys: create new key" {
sleep 30
  login_user 'alice' '+16505554350'

  variables="{\"input\":{\"name\":\"api-key\"}}"

  exec_graphql 'alice' 'api-key-create' "$variables"
  result="$(graphql_output '.data.apiKeyCreate.apiKey')"

  key_id="$(echo "$result" | jq -r '.id')"
  [[ "${key_id}" = "123" ]] || exit 1

  name=$(echo "$result" | jq -r '.name')
  [[ "${name}" = "GeneratedApiKey" ]] || exit 1
}
