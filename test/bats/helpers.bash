REPO_ROOT=$(git rev-parse --show-toplevel)
COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME:-${REPO_ROOT##*/}}"

GALOY_ENDPOINT="${GALOY_ENDPOINT:-localhost:4002}"
SERVER_PID_FILE=$REPO_ROOT/test/bats/.galoy_server_pid
TRIGGER_PID_FILE=$REPO_ROOT/test/bats/.galoy_trigger_pid
EXPORTER_PID_FILE=$REPO_ROOT/test/bats/.galoy_exporter_pid

METRICS_ENDPOINT="localhost:3000/metrics"

ALICE_PHONE="+16505554328"
ALICE_CODE="321321"

BOB_PHONE="+198765432113"
BOB_CODE="321321"

bitcoind_init() {
  bitcoin_cli createwallet "outside" || true
  bitcoin_cli -generate 200

  bitcoin_signer_cli createwallet "dev" || true
  bitcoin_signer_cli -rpcwallet=dev importdescriptors "$(cat ${REPO_ROOT}/test/bats/bitcoind_signer_descriptors.json)"
}

bitcoin_cli() {
  docker exec "${COMPOSE_PROJECT_NAME}-bitcoind-1" bitcoin-cli $@
}

bitcoin_signer_cli() {
  docker exec "${COMPOSE_PROJECT_NAME}-bitcoind-signer-1" bitcoin-cli $@
}

start_server() {
  background node lib/servers/graphql-main-server.js > .e2e-server.log
  echo $! > $SERVER_PID_FILE
  sleep 8
}

start_trigger() {
  background node lib/servers/trigger.js > .e2e-trigger.log
  echo $! > $TRIGGER_PID_FILE
}

start_exporter() {
  background node lib/servers/exporter.js > .e2e-exporter.log
  echo $! > $EXPORTER_PID_FILE
}

stop_server() {
  [ -f $SERVER_PID_FILE ] && kill -9 $(cat $SERVER_PID_FILE) > /dev/null || true
}

stop_trigger() {
  [ -f $TRIGGER_PID_FILE ] && kill -9 $(cat $TRIGGER_PID_FILE) > /dev/null || true
}

stop_exporter() {
  [ -f $EXPORTER_PID_FILE ] && kill -9 $(cat $EXPORTER_PID_FILE) > /dev/null || true
}

cache_value() {
  echo $2 > ${BATS_TMPDIR}/$1
}

read_value() {
  cat ${BATS_TMPDIR}/$1
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

check_is_balanced() {
  galoy_lndBalanceSync=$(curl -s "$METRICS_ENDPOINT" | awk '/^galoy_lndBalanceSync/ { print $2 }')
  [ "${galoy_lndBalanceSync}" = 0 ]

  galoy_assetsEqLiabilities=$(curl -s "$METRICS_ENDPOINT" | awk '/^galoy_assetsEqLiabilities/ { print $2 }')
  [ "${galoy_assetsEqLiabilities}" = 0 ]
}

graphql_output() {
  echo $output | jq -r "$@"
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
