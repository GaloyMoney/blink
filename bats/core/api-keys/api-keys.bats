#!/usr/bin/env bats

load "../../helpers/setup-and-teardown.bash"

setup_file() {
  start_services "api-keys"
  await_api_is_up
}

teardown_file() {
  stop_services
}

random_uuid() {
  if [[ -e /proc/sys/kernel/random/uuid ]]; then
    cat /proc/sys/kernel/random/uuid
  else
    uuidgen
  fi
}

new_key_name() {
  random_uuid
}

@test "api-keys: create new key" {
  login_user 'alice' '+16505554350'

  key_name="$(new_key_name)"

  variables="{\"input\":{\"name\":\"${key_name}\"}}"

  exec_graphql 'alice' 'api-key-create' "$variables"
  key="$(graphql_output '.data.apiKeyCreate.apiKey')"
  secret="$(graphql_output '.data.apiKeyCreate.apiKeySecret')"

  cache_value "api-key-secret" "$secret"

  name=$(echo "$key" | jq -r '.name')
  [[ "${name}" = "${key_name}" ]] || exit 1
}

@test "api-keys: can authenticate with api key" {
  exec_graphql 'api-key-secret' 'api-keys'

  keyName="$(graphql_output '.data.me.apiKeys[0].name')"

  [[ "${keyName}" = "api-key" ]] || exit 1
}
