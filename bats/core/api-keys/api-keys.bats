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

@test "api-keys: returns empty list for no api-keys" {
  login_user 'alice' '+16505554350'

  exec_graphql 'alice' 'api-keys'
  length="$(graphql_output '.data.me.apiKeys | length')"
  [[ "$length" == "0" ]] || exit 1
}

@test "api-keys: create new key" {
  key_name="$(new_key_name)"
  cache_value 'key_name' $key_name

  variables="{\"input\":{\"name\":\"${key_name}\"}}"

  exec_graphql 'alice' 'api-key-create' "$variables"
  key="$(graphql_output '.data.apiKeyCreate.apiKey')"
  secret="$(graphql_output '.data.apiKeyCreate.apiKeySecret')"

  cache_value "api-key-secret" "$secret"

  name=$(echo "$key" | jq -r '.name')
  [[ "${name}" = "${key_name}" ]] || exit 1
}

@test "api-keys: can authenticate with api key and list keys" {
  exec_graphql 'api-key-secret' 'api-keys'

  keyName="$(graphql_output '.data.me.apiKeys[-1].name')"
  [[ "${keyName}" = "$(read_value 'key_name')" ]] || exit 1
}
