#!/usr/bin/env bats

load "../../helpers/setup-and-teardown.bash"

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

  exec_graphql 'alice' 'api-keys'
  initial_length="$(graphql_output '.data.me.apiKeys | length')"

  key_name="$(new_key_name)"
  cache_value 'key_name' $key_name

  variables="{\"input\":{\"name\":\"${key_name}\"}}"

  exec_graphql 'alice' 'api-key-create' "$variables"
  key="$(graphql_output '.data.apiKeyCreate.apiKey')"
  secret="$(graphql_output '.data.apiKeyCreate.apiKeySecret')"

  cache_value "api-key-secret" "$secret"

  name=$(echo "$key" | jq -r '.name')
  [[ "${name}" = "${key_name}" ]] || exit 1

  readOnly=$(echo "$key" | jq -r '.readOnly')
  [[ "${readOnly}" = "false" ]] || exit 1

  key_id=$(echo "$key" | jq -r '.id')
  cache_value "api-key-id" "$key_id"

  exec_graphql 'alice' 'api-keys'
  post_creation_length="$(graphql_output '.data.me.apiKeys | length')"

  # Check that the length has incremented by 1
  [[ "$((post_creation_length))" -eq "$((initial_length + 1))" ]] || exit 1
}

@test "api-keys: can authenticate with api key and list keys" {
  exec_graphql 'api-key-secret' 'api-keys'

  keyName="$(graphql_output '.data.me.apiKeys[-1].name')"
  [[ "${keyName}" = "$(read_value 'key_name')" ]] || exit 1
}

@test "api-keys: can revoke key" {
  key_id=$(read_value "api-key-id")
  variables="{\"input\":{\"id\":\"${key_id}\"}}"

  exec_graphql 'alice' 'revoke-api-key' "$variables"
  revoked_from_response=$(graphql_output '.data.apiKeyRevoke.apiKey.revoked')
  [[ "${revoked_from_response}" = "true" ]] || exit 1

  exec_graphql 'alice' 'api-keys'
  revoked="$(graphql_output '.data.me.apiKeys[-1].revoked')"
  [[ "${revoked}" = "true" ]] || exit 1

  exec_graphql 'api-key-secret' 'api-keys'

  error="$(graphql_output '.error.code')"
  [[ "${error}" = "401" ]] || exit 1
}

@test "api-keys: can create read-only" {
  key_name="$(new_key_name)"

  variables="{\"input\":{\"name\":\"${key_name}\",\"readOnly\": true}}"

  exec_graphql 'alice' 'api-key-create' "$variables"
  key="$(graphql_output '.data.apiKeyCreate.apiKey')"
  secret="$(graphql_output '.data.apiKeyCreate.apiKeySecret')"
  cache_value "api-key-secret" "$secret"

  readOnly=$(echo "$key" | jq -r '.readOnly')
  [[ "${readOnly}" = "true" ]] || exit 1

  key_id=$(echo "$key" | jq -r '.id')
  cache_value "api-key-id" "$key_id"

  exec_graphql 'api-key-secret' 'api-keys'

  name="$(graphql_output '.data.me.apiKeys[-1].name')"
  [[ "${name}" = "${key_name}" ]] || exit 1
}

@test "api-keys: read-only key cannot mutate" {
  key_name="$(new_key_name)"

  variables="{\"input\":{\"name\":\"${key_name}\"}}"
  exec_graphql 'api-key-secret' 'api-key-create' "$variables"
  errors="$(graphql_output '.errors | length')"
  [[ "${errors}" = "1" ]] || exit 1

  variables="{\"input\":{\"currency\":\"USD\"}}"
  exec_graphql 'api-key-secret' 'update-display-currency' "$variables"
  errors="$(graphql_output '.errors | length')"
  [[ "${errors}" = "1" ]] || exit 1

  # Sanity check that it works with alice
  exec_graphql 'alice' 'update-display-currency' "$variables"
  errors="$(graphql_output '.errors | length')"
  [[ "${errors}" = "0" ]] || exit 1
}
