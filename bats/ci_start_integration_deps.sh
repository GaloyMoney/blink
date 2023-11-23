#!/bin/bash

export REPO_ROOT=$(git rev-parse --show-toplevel)

setup_deps() {
  echo "Starting dev dependencies"
  buck2 run //dev:up > "${REPO_ROOT}/bats/.e2e-tilt.log" 2>&1 &

  echo "Waiting for api server..."
  await_api_is_up

  echo "Waiting for api-keys server..."
  await_api_keys_is_up
}

await_api_is_up() {
  exec_globals() {
    raw_query="query Globals {
      globals {
        network
        nodesIds
      }
    }"
    query=$(echo $raw_query | tr '\n' ' ' | sed 's/"/\\"/g')

    OATHKEEPER_PROXY="localhost:4455"
    gql_route="graphql"

    curl -s \
      -X POST \
      -H "Content-Type: application/json" \
      -d "{\"query\": \"$query\"}" \
      "${OATHKEEPER_PROXY}/${gql_route}"
  }

  server_is_up() {
    network="$(exec_globals | jq -r '.data.globals.network')"
    [[ "${network}" = "regtest" ]] || return 1
  }

  retry 150 1 server_is_up || exit 1
}

await_api_keys_is_up() {
  api_keys_is_up() {
    curl localhost:5397/auth/check > /dev/null 2>&1 || return 1
  }

  retry 150 1 api_keys_is_up
}

retry() {
  local attempts=$1
  shift
  local delay=$1
  shift
  local i

  echo "Running: $@"
  for ((i = 0; i < attempts; i++)); do
    "$@"
    run_status="$?"
    echo "Attempt #: $i"

    if [[ "$run_status" -eq 0 ]]; then
      echo "Success"
      return 0
    fi
    sleep "$delay"
  done

  echo "Command \"$*\" failed $attempts times."
  exit 1
}

setup_deps
