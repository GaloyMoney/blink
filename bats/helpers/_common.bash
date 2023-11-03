export REPO_ROOT=$(git rev-parse --show-toplevel)

CACHE_DIR=${BATS_TMPDIR:-tmp/bats}/galoy-bats-cache
mkdir -p "$CACHE_DIR"

OATHKEEPER_PROXY=${OATHKEEPER_PROXY:-localhost:4455}

SERVICES_PID_FILE=$REPO_ROOT/bats/.services_pid

start_services() {
  stop_services > /dev/null 2>&1 || true
  background buck2 run //dev:up -- "$@" > "${REPO_ROOT}/bats/.e2e-services.log"
  echo $! > "$SERVICES_PID_FILE"
}

await_api_is_up() {
  server_is_up() {
    exec_graphql 'anon' 'globals'
    network="$(graphql_output '.data.globals.network')"
    [[ "${network}" = "regtest" ]] || exit 1
  }

  retry 300 1 server_is_up
}

stop_services() {
  [[ -f "$SERVICES_PID_FILE" ]] && kill -9 "$(cat "$SERVICES_PID_FILE")" > /dev/null || true
  buck2 run //dev:down
}

if ! type fail &>/dev/null; then
  fail() {
    echo "$1"
    exit 1
  }
fi

# Run the given command in the background. Useful for starting a
# node and then moving on with commands that exercise it for the
# test.
#
# Ensures that BATS' handling of file handles is taken into account;
# see
# https://github.com/bats-core/bats-core#printing-to-the-terminal
# https://github.com/sstephenson/bats/issues/80#issuecomment-174101686
# for details.
background() {
  "$@" 3>- &
  echo $!
}

# Taken from https://github.com/docker/swarm/blob/master/test/integration/helpers.bash
# Retry a command $1 times until it succeeds. Wait $2 seconds between retries.
retry() {
  local attempts=$1
  shift
  local delay=$1
  shift
  local i

  for ((i = 0; i < attempts; i++)); do
    if [[ "${BATS_TEST_DIRNAME}" = "" ]]; then
      "$@"
    else
      run "$@"
    fi

    if [[ "$status" -eq 0 ]]; then
      return 0
    fi
    sleep "$delay"
  done

  echo "Command \"$*\" failed $attempts times. Output: $output"
  false
}

gql_query() {
  cat "$(gql_file "$1")" | tr '\n' ' ' | sed 's/"/\\"/g'
}

gql_file() {
  echo "${REPO_ROOT}/bats/gql/$1.gql"
}

new_idempotency_key() {
  random_uuid
}

exec_graphql() {
  local token_name=$1
  local query_name=$2
  local variables=${3:-"{}"}
  echo "GQL query -  user: ${token_name} -  query: ${query_name} -  vars: ${variables}"
  echo "{\"query\": \"$(gql_query "$query_name")\", \"variables\": $variables}"

  if [[ ${token_name} == "anon" ]]; then
    AUTH_HEADER=""
  elif [[ ${token_name} == api-key* ]]; then
    AUTH_HEADER="X-API-KEY: $(read_value "$token_name")"
  else
    AUTH_HEADER="Authorization: Bearer $(read_value "$token_name")"
  fi

  if [[ "${BATS_TEST_DIRNAME}" != "" ]]; then
    run_cmd="run"
  else
    run_cmd=""
  fi

  gql_route="graphql"

  ${run_cmd} curl -s \
    -X POST \
    ${AUTH_HEADER:+ -H "$AUTH_HEADER"} \
    -H "Content-Type: application/json" \
    -H "X-Idempotency-Key: $(new_idempotency_key)" \
    -d "{\"query\": \"$(gql_query "$query_name")\", \"variables\": $variables}" \
    "${OATHKEEPER_PROXY}/${gql_route}"

  echo "GQL output: '$output'"
}

graphql_output() {
  echo "$output" | jq -r "$@"
}

random_uuid() {
  if [[ -e /proc/sys/kernel/random/uuid ]]; then
    cat /proc/sys/kernel/random/uuid
  else
    uuidgen
  fi
}

cache_value() {
  echo $2 >${CACHE_DIR}/$1
}

read_value() {
  cat ${CACHE_DIR}/$1
}
