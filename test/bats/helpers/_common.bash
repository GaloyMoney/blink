REPO_ROOT=$(git rev-parse --show-toplevel)
COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME:-${REPO_ROOT##*/}}"

CACHE_DIR=${BATS_TMPDIR:-tmp/bats}/galoy-bats-cache
mkdir -p $CACHE_DIR

GALOY_ENDPOINT=localhost:4002

ALICE_TOKEN_NAME="alice"
ALICE_PHONE="+16505554328"
ALICE_CODE="321321"

BOB_TOKEN_NAME="bob"
BOB_PHONE="+16505554350"
BOB_CODE="321321"

bitcoin_cli() {
  docker exec "${COMPOSE_PROJECT_NAME}-bitcoind-1" bitcoin-cli $@
}

cache_value() {
  echo $2 >${CACHE_DIR}/$1
}

read_value() {
  cat ${CACHE_DIR}/$1
}

is_number() {
  if ! [[ $1 =~ ^-?[0-9]+$ ]]; then
    echo "Error: Input is not a number"
    exit 1
  fi
}

abs() {
  is_number $1 || exit 1

  if [[ $1 -lt 0 ]]; then
    echo "$((-$1))"
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
  cat "$(gql_file $1)" | tr '\n' ' ' | sed 's/"/\\"/g'
}

gql_file() {
  echo "${BATS_TEST_DIRNAME:-${REPO_ROOT}/test/bats}/gql/$1.gql"
}

exec_graphql() {
  local token_name=$1
  local query_name=$2
  local variables=${3:-"{}"}
  echo "GQL query -  user: ${token_name} -  query: ${query_name} -  vars: ${variables}"
  echo "{\"query\": \"$(gql_query $query_name)\", \"variables\": $variables}"

  if [[ ${token_name} == "anon" ]]; then
    AUTH_HEADER=""
  else
    AUTH_HEADER="Authorization: Bearer $(read_value ${token_name})"
  fi

  if [[ "${BATS_TEST_DIRNAME}" != "" ]]; then
    run_cmd="run"
  else
    run_cmd=""
  fi

  ${run_cmd} curl -s \
    -X POST \
    ${AUTH_HEADER:+ -H "$AUTH_HEADER"} \
    -H "Content-Type: application/json" \
    -d "{\"query\": \"$(gql_query $query_name)\", \"variables\": $variables}" \
    ${GALOY_ENDPOINT}/graphql

  echo "GQL output: '$output'"
}

graphql_output() {
  echo $output | jq -r "$@"
}

curl_request() {
  local url=$1
  local data=${2:-""}

  echo "Curl request -  url: ${url} -  data: ${data}"

  if [[ "${BATS_TEST_DIRNAME}" != "" ]]; then
    run_cmd="run"
  else
    run_cmd=""
  fi

  ${run_cmd} curl -s \
    -X POST \
    -H "Content-Type: application/json" \
    -d "${data}" \
    "${url}"

  echo "Curl output: '$output'"
}

curl_output() {
  echo $output | jq -r "$@"
}
