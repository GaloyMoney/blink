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
  login_user 'alice' '+16505554350'

  variables="{\"input\":{\"name\":\"api-key\"}}"

  exec_graphql 'alice' 'api-key-create' "$variables"
  key="$(graphql_output '.data.apiKeyCreate.apiKey')"
  secret="$(graphql_output '.data.apiKeyCreate.apiKeySecret')"

  cache_value "api-key-secret" "$secret"

  key_id="$(echo "$key" | jq -r '.id')"
  [[ "${key_id}" = "123" ]] || exit 1

  name=$(echo "$key" | jq -r '.name')
  [[ "${name}" = "GeneratedApiKey" ]] || exit 1
}

@test "api-keys: can authenticate with api key" {
  exec_graphql 'alice' 'api-keys'

  keyName="$(graphql_output '.data.me.apiKeys[0].name')"

  [[ "${keyName}" = "api-key" ]] || exit 1
}
