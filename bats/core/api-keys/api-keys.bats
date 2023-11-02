#!/usr/bin/env bats

load "../../helpers/setup-and-teardown.bash"

setup_file() {
  start_services "api"
  await_api_is_up
}

teardown_file() {
  stop_services
}

@test "api-keys: can query api-keys" {
  login_user 'alice' '+16505554350'

  exec_graphql 'alice' 'api-keys'
  apiKeys="$(graphql_output '.data.me.defaultAccount.apiKeys')"

  num_keys=$(echo $apiKeys | jq -r '. | length')
  [[ "${num_keys}" = "2" ]] || exit 1

  apiKey1=$(echo $apiKeys | jq -r '.[0]')

  id=$(echo $apiKey1 | jq -r '.id')
  [[ "${id}" = "1" ]] || exit 1

  name=$(echo $apiKey1 | jq -r '.name')
  [[ "${name}" = "KeyOne" ]] || exit 1

  created_at=$(echo $apiKey1 | jq -r '.createdAt')
  [[ "${created_at}" != "null" ]] || exit 1
  expiration=$(echo $apiKey1 | jq -r '.expiration')
  [[ "${expiration}" != "null" ]] || exit 1
  last_use=$(echo $apiKey1 | jq -r '.lastUse')
  [[ "${last_use}" != "null" ]] || exit 1
}
