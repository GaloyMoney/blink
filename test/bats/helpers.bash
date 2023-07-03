REPO_ROOT=$(git rev-parse --show-toplevel)
COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME:-${REPO_ROOT##*/}}"

GALOY_ENDPOINT=localhost:4002

function start_server() {
	node lib/servers/graphql-main-server.js
}

function stop_server() {
  echo "start server"
}

gql_query() {
  cat "${BATS_TEST_DIRNAME:-${REPO_ROOT}/test/bats}/gql/$1.gql" | tr '\n' ' ' | sed 's/"/\\"/g'
}

exec_graphql() {
  token_name=$1
  query_name=$2
  variables=${3:-"{}"}
  echo "GQL query -  user: ${token_name} -  query: ${query_name} -  vars: ${variables}"
  echo  "{\"query\": \"$(gql_query $query_name)\", \"variables\": $variables}"

  if [[ ${token_name} == "anon" ]]; then
       auth=""
  else
       auth="-H \"authorization: Bearer $(read_value ${token_name})\""
  fi

  if [[ "${BATS_TEST_DIRNAME}" != "" ]]; then
    run_cmd="run"
  else
    run_cmd=""
  fi

  ${run_cmd} curl -s \
    -vvv \
       -X POST \
       -H "Content-Type: application/json" \
       ${auth} \
       -d "{\"query\": \"$(gql_query $query_name)\", \"variables\": $variables}" \
       ${GALOY_ENDPOINT}/graphql

  echo "GQL output: '$output'"
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

  for ((i=0; i < attempts; i++)); do
    run "$@"
    if [[ "$status" -eq 0 ]] ; then
      return 0
    fi
    sleep "$delay"
  done

  echo "Command \"$*\" failed $attempts times. Output: $output"
  false
}
