if git rev-parse --is-inside-work-tree &> /dev/null; then
    REPO_ROOT=$(git rev-parse --show-toplevel)
    CORE_ROOT=${REPO_ROOT}/core/api
else
    REPO_ROOT=$(pwd)
    CORE_ROOT=$(pwd)
fi

COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME:-${CORE_ROOT##*/}}"

CACHE_DIR=${BATS_TMPDIR:-tmp/bats}/galoy-bats-cache
mkdir -p $CACHE_DIR

GALOY_ENDPOINT=${GALOY_ENDPOINT:-localhost:4455}

ALICE_TOKEN_NAME="alice"
ALICE_PHONE="+16505554328"

BOB_TOKEN_NAME="bob"
BOB_PHONE="+16505554350"

CODE="000000"

if ! type fail &>/dev/null; then
  fail() {
    echo "$1"
    exit 1
  }
fi


bitcoin_cli() {
  docker exec "${COMPOSE_PROJECT_NAME}-bitcoind-1" bitcoin-cli $@
}

bria_cli() {
  docker exec "${COMPOSE_PROJECT_NAME}-bria-1" bria $@
}

cache_value() {
  echo $2 >${CACHE_DIR}/$1
}

read_value() {
  cat ${CACHE_DIR}/$1
}

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
  cat "$(gql_file $1)" | tr '\n' ' ' | sed 's/"/\\"/g'
}

gql_file() {
  echo "${BATS_TEST_DIRNAME:-${CORE_ROOT}/test/bats}/gql/$1.gql"
}

new_idempotency_key() {
  random_uuid
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

  gql_route="graphql"

  ${run_cmd} curl -s \
    -X POST \
    ${AUTH_HEADER:+ -H "$AUTH_HEADER"} \
    -H "Content-Type: application/json" \
    -H "X-Idempotency-Key: $(new_idempotency_key)" \
    -d "{\"query\": \"$(gql_query $query_name)\", \"variables\": $variables}" \
    "${GALOY_ENDPOINT}/${gql_route}"

  echo "GQL output: '$output'"
}

graphql_output() {
  echo $output | jq -r "$@"
}

random_uuid() {
  if [[ -e /proc/sys/kernel/random/uuid ]]; then
    cat /proc/sys/kernel/random/uuid
  else
    uuidgen
  fi
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

is_contact() {
  local token_name="$1"
  local contact_username="$2"

  exec_graphql "$token_name" 'contacts'
  local fetched_username=$(
    graphql_output \
    --arg contact_username "$contact_username" \
    '.data.me.contacts[] | select(.username == $contact_username) .username'
  )
  [[ "$fetched_username" == "$contact_username" ]] || return 1
}
