REPO_ROOT=$(git rev-parse --show-toplevel)
COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME:-${REPO_ROOT##*/}}"

CACHE_DIR=${BATS_TMPDIR}/galoy-bats-cache
mkdir -p $CACHE_DIR

GALOY_ENDPOINT=localhost:4002
SERVER_PID_FILE=$REPO_ROOT/test/bats/.galoy_server_pid
TRIGGER_PID_FILE=$REPO_ROOT/test/bats/.galoy_trigger_pid
EXPORTER_PID_FILE=$REPO_ROOT/test/bats/.galoy_exporter_pid

METRICS_ENDPOINT="localhost:3000/metrics"

ALICE_TOKEN_NAME="alice"
ALICE_PHONE="+16505554328"
ALICE_CODE="321321"

BOB_TOKEN_NAME="bob"
BOB_PHONE="+16505554350"
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

redis_cli() {
  docker exec "${COMPOSE_PROJECT_NAME}-redis-1" redis-cli $@
}

reset_redis() {
  redis_cli FLUSHALL
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
  [[ -f "$SERVER_PID_FILE" ]] && kill -9 $(cat $SERVER_PID_FILE) > /dev/null || true
}

stop_trigger() {
  [[ -f "$TRIGGER_PID_FILE" ]] && kill -9 $(cat $TRIGGER_PID_FILE) > /dev/null || true
}

stop_exporter() {
  [[ -f "$EXPORTER_PID_FILE" ]] && kill -9 $(cat $EXPORTER_PID_FILE) > /dev/null || true
}

clear_cache() {
  rm -r ${CACHE_DIR}
  mkdir -p ${CACHE_DIR}
}

cache_value() {
  echo $2 > ${CACHE_DIR}/$1
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

gql_query() {
  cat "${BATS_TEST_DIRNAME:-${REPO_ROOT}/test/bats}/gql/$1.gql" | tr '\n' ' ' | sed 's/"/\\"/g'
}

exec_graphql() {
  local token_name=$1
  local query_name=$2
  local variables=${3:-"{}"}
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

get_metric() {
  metric_name=$1

  retry 10 1 curl -s "$METRICS_ENDPOINT"
  curl -s "$METRICS_ENDPOINT" \
    | awk "/^$metric_name/ { print \$2 }"
}

login_user() {
  local token_name=$1
  local phone=$2
  local code=$3

  local variables=$(
    jq -n \
    --arg phone "$phone" \
    --arg code "$code" \
    '{input: {phone: $phone, code: $code}}'
  )
  exec_graphql 'anon' 'user-login' "$variables"
  auth_token="$(graphql_output '.data.userLogin.authToken')"
  [[ "${auth_token}" != "null" ]] || exit 1
  cache_value "$token_name" "$auth_token"

  exec_graphql "$token_name" 'wallet-ids-for-account'

  btc_wallet_id="$(graphql_output '.data.me.defaultAccount.wallets[] | select(.walletCurrency == "BTC") .id')"
  [[ "${btc_wallet_id}" != "null" ]] || exit 1
  cache_value "$token_name.btc_wallet_id" "$btc_wallet_id"

  usd_wallet_id="$(graphql_output '.data.me.defaultAccount.wallets[] | select(.walletCurrency == "USD") .id')"
  [[ "${usd_wallet_id}" != "null" ]] || exit 1
  cache_value "$token_name.usd_wallet_id" "$usd_wallet_id"
}

fund_wallet_from_onchain() {
  local token_name=$1
  local wallet_id_name="$2"
  local amount=$3

  variables=$(
    jq -n \
    --arg wallet_id "$(read_value $wallet_id_name)" \
    '{input: {walletId: $wallet_id}}'
  )
  exec_graphql "$token_name" 'on-chain-address-create' "$variables"
  address="$(graphql_output '.data.onChainAddressCreate.address')"
  [[ "${address}" != "null" ]] || exit 1

  bitcoin_cli sendtoaddress "$address" "$amount"
  bitcoin_cli -generate 2
  retry 15 1 check_for_settled "$token_name" "$address"
}

fund_wallet_intraledger() {
  local from_token_name=$1
  local from_wallet_name=$2
  local wallet_name=$3
  local amount=$4

  variables=$(
    jq -n \
    --arg wallet_id "$(read_value $from_wallet_name)" \
    --arg recipient_wallet_id "$(read_value $wallet_name)" \
    --arg amount "$amount" \
    '{input: {walletId: $wallet_id, recipientWalletId: $recipient_wallet_id, amount: $amount}}'
  )
  exec_graphql "$from_token_name" 'intraledger-payment-send' "$variables"
  send_status="$(graphql_output '.data.intraLedgerPaymentSend.status')"
  [[ "${send_status}" = "SUCCESS" ]] || exit 1
}

initialize_user() {
  local token_name="$1"
  local phone="$2"
  local code="$3"
  local btc_amount_in_btc=${4:-"0.001"}
  local usd_amount_in_sats=${5:-"75000"}

  check_user_creds_cached "$token_name" \
    || login_user "$token_name" "$phone" "$code" \
    || exit 1

  fund_wallet_from_onchain \
    "$token_name" \
    "$token_name.btc_wallet_id" \
    "$btc_amount_in_btc"

  fund_wallet_intraledger \
    "$token_name" \
    "$token_name.btc_wallet_id" \
    "$token_name.usd_wallet_id" \
    "$usd_amount_in_sats"
}

get_from_transaction_by_address() {
  property_query=$2

  jq_query='.data.me.defaultAccount.transactions.edges[] | select(.node.initiationVia.address == $address) .node'
  echo $output \
    | jq -r --arg address "$1" "$jq_query" \
    | jq -r "$property_query"
}

check_for_broadcast() {
  local token_name=$1
  local address=$2
  local first=${3:-"1"}

  variables=$(
  jq -n \
  --argjson first "$first" \
  '{"first": $first}'
  )
  exec_graphql "$token_name" 'transactions' "$variables"

  txid="$(get_from_transaction_by_address "$address" '.settlementVia.transactionHash')"
  [[ "${txid}" != "null" ]] || exit 1

  bitcoin_cli gettransaction "$txid" || exit 1
}

check_for_settled() {
  local token_name=$1
  local address=$2
  local first=${3:-"1"}

  echo "first: $first"
  variables=$(
  jq -n \
  --argjson first "$first" \
  '{"first": $first}'
  )
  exec_graphql "$token_name" 'transactions' "$variables"

  settled_status="$(get_from_transaction_by_address $address '.status')"
  [[ "${settled_status}" = "SUCCESS" ]] || exit 1
}

balance_for_check() {
  lnd_balance_sync=$(get_metric "galoy_lndBalanceSync")
  is_number "$lnd_balance_sync" || exit 1
  abs_lnd_balance_sync=$(abs $lnd_balance_sync)

  assets_eq_liabilities=$(get_metric "galoy_assetsEqLiabilities")
  is_number "$assets_eq_liabilities" || exit 1
  abs_assets_eq_liabilities=$(abs $assets_eq_liabilities)

  echo $(( $abs_lnd_balance_sync + $abs_assets_eq_liabilities ))
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
