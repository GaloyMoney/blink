BASH_SOURCE=${BASH_SOURCE:-test/bats/helpers/.}
source $(dirname "$BASH_SOURCE")/onchain-send.bash

SERVER_PID_FILE=$REPO_ROOT/test/bats/.galoy_server_pid
WS_SERVER_PID_FILE=$REPO_ROOT/test/bats/.galoy_ws_server_pid
TRIGGER_PID_FILE=$REPO_ROOT/test/bats/.galoy_trigger_pid
EXPORTER_PID_FILE=$REPO_ROOT/test/bats/.galoy_exporter_pid
SUBSCRIBER_PID_FILE=$REPO_ROOT/test/bats/.gql_subscriber_pid

METRICS_ENDPOINT="localhost:3000/metrics"

redis_cli() {
  docker exec "${COMPOSE_PROJECT_NAME}-redis-1" redis-cli $@
}

reset_redis() {
  redis_cli FLUSHALL
}

start_server() {
  background node lib/servers/graphql-main-server.js > .e2e-server.log
  echo $! > $SERVER_PID_FILE

  server_is_up() {
    exec_graphql 'anon' 'globals'
    network="$(graphql_output '.data.globals.network')"
    [[ "${network}" = "regtest" ]] || exit 1
  }

  retry 30 1 server_is_up
}

subscribe_to() {
  background ${REPO_ROOT}/node_modules/.bin/ts-node "${REPO_ROOT}/src/debug/gqlsubscribe.ts" "ws://${GALOY_ENDPOINT}/graphqlws" "$(gql_file $1)" > .e2e-subscriber.log
  echo $! > $SUBSCRIBER_PID_FILE
}

start_ws_server() {
  background node lib/servers/ws-server.js > .e2e-ws-server.log
  echo $! > $WS_SERVER_PID_FILE
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

stop_ws_server() {
  [[ -f "$WS_SERVER_PID_FILE" ]] && kill -9 $(cat $WS_SERVER_PID_FILE) > /dev/null || true
}

stop_trigger() {
  [[ -f "$TRIGGER_PID_FILE" ]] && kill -9 $(cat $TRIGGER_PID_FILE) > /dev/null || true
}

stop_exporter() {
  [[ -f "$EXPORTER_PID_FILE" ]] && kill -9 $(cat $EXPORTER_PID_FILE) > /dev/null || true
}

stop_subscriber() {
  [[ -f "$SUBSCRIBER_PID_FILE" ]] && kill -9 $(cat $SUBSCRIBER_PID_FILE) > /dev/null || true
}

clear_cache() {
  rm -r ${CACHE_DIR}
  mkdir -p ${CACHE_DIR}
}

balance_for_check() {
  get_metric() {
    metric_name=$1

    retry 10 1 curl -s "$METRICS_ENDPOINT"
    curl -s "$METRICS_ENDPOINT" \
      | awk "/^$metric_name/ { print \$2 }"
  }

  lnd_balance_sync=$(get_metric "galoy_lndBalanceSync")
  is_number "$lnd_balance_sync"
  abs_lnd_balance_sync=$(abs $lnd_balance_sync)

  assets_eq_liabilities=$(get_metric "galoy_assetsEqLiabilities")
  is_number "$assets_eq_liabilities"
  abs_assets_eq_liabilities=$(abs $assets_eq_liabilities)

  echo $(( $abs_lnd_balance_sync + $abs_assets_eq_liabilities ))
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
  [[ -n "${auth_token}" && "${auth_token}" != "null" ]]
  cache_value "$token_name" "$auth_token"

  exec_graphql "$token_name" 'wallet-ids-for-account'

  btc_wallet_id="$(graphql_output '.data.me.defaultAccount.wallets[] | select(.walletCurrency == "BTC") .id')"
  [[ "${btc_wallet_id}" != "null" ]]
  cache_value "$token_name.btc_wallet_id" "$btc_wallet_id"

  usd_wallet_id="$(graphql_output '.data.me.defaultAccount.wallets[] | select(.walletCurrency == "USD") .id')"
  [[ "${usd_wallet_id}" != "null" ]]
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
  [[ "${address}" != "null" ]]

  bitcoin_cli sendtoaddress "$address" "$amount"
  bitcoin_cli -generate 2
  retry 15 1 check_for_onchain_initiated_settled "$token_name" "$address"
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
  [[ "${send_status}" = "SUCCESS" ]]
}

initialize_user_from_onchain() {
  local token_name="$1"
  local phone="$2"
  local code="$3"
  local btc_amount_in_btc=${4:-"0.001"}
  local usd_amount_in_sats=${5:-"75000"}

  login_user "$token_name" "$phone" "$code"

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

