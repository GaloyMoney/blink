export REPO_ROOT=$(git rev-parse --show-toplevel)

export BATS_ROOT_DIR="${REPO_ROOT}/bats"
CACHE_DIR=${BATS_TMPDIR:-tmp/bats}/galoy-bats-cache
mkdir -p "$CACHE_DIR"

TILT_LOG_FILE="${REPO_ROOT}/bats/.e2e-tilt.log"

OATHKEEPER_PROXY=${OATHKEEPER_PROXY:-localhost:4455}

if ! type fail &>/dev/null; then
  fail() {
    echo "$1"
    exit 1
  }
fi

is_number() {
  if ! [[ $1 =~ ^-?[0-9]+$ ]]; then
    echo "Error: $2 input is not a number: $1"
    exit 1
  fi
}

abs() {
  is_number $1 || return 1

  if [[ $1 -lt 0 ]]; then
    echo "$((- $1))"
  else
    echo "$1"
  fi
}

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

gql_admin_query() {
  cat "$(gql_admin_file $1)" | tr '\n' ' ' | sed 's/"/\\"/g'
}

gql_admin_file() {
  echo "${REPO_ROOT}/bats/admin-gql/$1.gql"
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

exec_admin_graphql() {
  local token=$1
  local query_name=$2
  local variables=${3:-"{}"}
  echo "GQL query -  token: ${token} -  query: ${query_name} -  vars: ${variables}"
  echo "{\"query\": \"$(gql_admin_query $query_name)\", \"variables\": $variables}"

  if [[ "${BATS_TEST_DIRNAME}" != "" ]]; then
    run_cmd="run"
  else
    run_cmd=""
  fi

  gql_route="admin/graphql"

  ${run_cmd} curl -s \
    -X POST \
    -H "Oauth2-Token: $token" \
    -H "Content-Type: application/json" \
    -d "{\"query\": \"$(gql_admin_query $query_name)\", \"variables\": $variables}" \
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

clear_cache() {
  rm -r ${CACHE_DIR}
  mkdir -p ${CACHE_DIR}
}

curl_request() {
  local url="$1"
  local data="${2:-""}"
  shift 2
  local headers=("$@")

  echo "Curl request - url: ${url} - data: ${data} - headers:"
  for header in "${headers[@]}"; do
    echo "  $header"
  done

  local run_cmd=""
  if [[ "${BATS_TEST_DIRNAME}" != "" ]]; then
    run_cmd="run"
  fi

  cmd=(${run_cmd} curl -s -X POST -H "Content-Type: application/json")

  for header in "${headers[@]}"; do
    cmd+=(-H "${header}")
  done

  if [[ -n "$data" ]]; then
    cmd+=(-d "${data}")
  fi

  cmd+=("${url}")
  echo "Curl input: '${cmd[*]}'"

  "${cmd[@]}"

  echo "Curl output: '$output'"
}

curl_output() {
  echo $output | jq -r "$@"
}

grpcurl_request() {
  local proto_file="$1"
  local address="$2"
  local service_method="$3"
  local data="${4:-""}"

  echo "gRPCurl request - proto: ${proto_file} - address: ${address} - service/method: ${service_method} - data: ${data}"

  local run_cmd=""
  if [[ "${BATS_TEST_DIRNAME}" != "" ]]; then
    run_cmd="run"
  fi

  cmd=(${run_cmd} grpcurl -plaintext -proto "${proto_file}")

  if [[ -n "$data" ]]; then
    cmd+=(-d "${data}")
  fi

  cmd+=("${address}" "${service_method}")
  echo "gRPCurl input: '${cmd[*]}'"

  "${cmd[@]}"

  echo "Grpcurl output: '$output'"
}
