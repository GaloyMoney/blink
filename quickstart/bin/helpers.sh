#!/bin/bash

set -e

COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME:-quickstart}"
# default is oathkeeper endpoint
GALOY_ENDPOINT=${GALOY_ENDPOINT:-localhost:4455}

if [ -n "$HOST_PROJECT_PATH" ]; then
  GALOY_DIR="./vendor/galoy-quickstart"
else
  GALOY_DIR="."
fi
export GALOY_DIR

CACHE_DIR=$GALOY_DIR/tmp/quickstart-cache
mkdir -p $CACHE_DIR

cache_value() {
  echo $2 >${CACHE_DIR}/$1
}

read_value() {
  cat ${CACHE_DIR}/$1
}

bitcoin_cli() {
  docker exec "${COMPOSE_PROJECT_NAME}-bitcoind-1" bitcoin-cli $@
}

lnd_cli() {
  docker exec "${COMPOSE_PROJECT_NAME}-lnd1-1" \
    lncli \
      --macaroonpath /root/.lnd/data/chain/bitcoin/regtest/admin.macaroon \
      --tlscertpath /root/.lnd/tls.cert \
      $@
}

lnd_outside_cli() {
  docker exec "${COMPOSE_PROJECT_NAME}-lnd-outside-1-1" \
    lncli \
      --macaroonpath /root/.lnd/data/chain/bitcoin/regtest/admin.macaroon \
      --tlscertpath /root/.lnd/tls.cert \
      $@
}

init_lnd_channel() {
  lnd_cli closeallchannels || true

  local amount="1"
  local address="$(lnd_outside_cli newaddress p2wkh | jq -r '.address')"
  local local_amount="10000000"
  bitcoin_cli sendtoaddress "$address" "$amount"
  bitcoin_cli -generate 3

  # Open balanced channel from lnd1 to lndoutside1
  lnd_local_pubkey="$(lnd_cli getinfo | jq -r '.identity_pubkey')"
  lnd_outside_cli connect "${lnd_local_pubkey}@${COMPOSE_PROJECT_NAME}-lnd1-1:9735" || true
  for i in {1..10}; do
  lnd_outside_cli openchannel \
    --node_key "$lnd_local_pubkey" \
    --local_amt "$local_amount" && break
  done

  for i in {1..10}; do
    local txid="$(bitcoin_cli getrawmempool | jq -r '.[0]')"
    [[ "$txid" != "null" ]] && break
    sleep 1
  done

  bitcoin_cli -generate 3

}

bria_cli() {
  docker exec "${COMPOSE_PROJECT_NAME}-bria-1" bria $@
}

bitcoin_signer_cli() {
  docker exec "${COMPOSE_PROJECT_NAME}-bitcoind-signer-1" bitcoin-cli $@
}

gql_file() {
  echo "$GALOY_DIR/graphql/gql/$1.gql"
}

gql_query() {
  cat "$(gql_file $1)" | tr '\n' ' ' | sed 's/"/\\"/g'
}

graphql_output() {
  echo $output | jq -r "$@"
}

exec_graphql() {
  local token_name=$1
  local query_name=$2
  local variables=${3:-"{}"}

  if [[ ${token_name} == "anon" ]]; then
    AUTH_HEADER=""
  else
    AUTH_HEADER="Authorization: Bearer $(read_value ${token_name})"
  fi

  gql_route="graphql"

  output=$(curl -s \
    -X POST \
    ${AUTH_HEADER:+ -H "$AUTH_HEADER"} \
    -H "Content-Type: application/json" \
    -d "{\"query\": \"$(gql_query $query_name)\", \"variables\": $variables}" \
    "${GALOY_ENDPOINT}/${gql_route}")
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

  exec_graphql "$token_name" 'wallets-for-account'

  account_id="$(graphql_output '.data.me.defaultAccount.id')"
  [[ "${account_id}" != "null" ]]
  cache_value "$token_name.account_id" "$account_id"

  btc_wallet_id="$(graphql_output '.data.me.defaultAccount.wallets[] | select(.walletCurrency == "BTC") .id')"
  [[ "${btc_wallet_id}" != "null" ]]
  cache_value "$token_name.btc_wallet_id" "$btc_wallet_id"

  usd_wallet_id="$(graphql_output '.data.me.defaultAccount.wallets[] | select(.walletCurrency == "USD") .id')"
  [[ "${usd_wallet_id}" != "null" ]]
  cache_value "$token_name.usd_wallet_id" "$usd_wallet_id"
}

receive_onchain() {
 token_name="alice"
 btc_wallet_name="$token_name.btc_wallet_id"
 amount="0.01"

  variables=$(
    jq -n \
    --arg wallet_id "$(read_value $btc_wallet_name)" \
    '{input: {walletId: $wallet_id}}'
  )

  exec_graphql "$token_name" 'on-chain-address-create' "$variables"
  address="$(graphql_output '.data.onChainAddressCreate.address')"

  bitcoin_cli sendtoaddress "$address" "$amount"
  bitcoin_cli -generate 4

  variables=$(
  jq -n \
  --argjson first "1" \
  '{"first": $first}'
  )
  for i in {1..60}; do
    exec_graphql "$token_name" 'transactions' "$variables"

    jq_query='.data.me.defaultAccount.transactions.edges[] | select(.node.initiationVia.address == $address) .node'
    settled_status=$(echo $output \
      | jq -r --arg address "$address" "$jq_query" \
      | jq -r ".status")
    [[ "${settled_status}" = "SUCCESS" ]] && break
    sleep 1
  done
}

receive_lightning() {
  token_name="alice"
  btc_wallet_name="$token_name.btc_wallet_id"
  btc_amount=1000

  variables=$(
    jq -n \
    --arg wallet_id "$(read_value $btc_wallet_name)" \
    --arg amount "$btc_amount" \
    '{input: {walletId: $wallet_id, amount: $amount}}'
  )
  exec_graphql "$token_name" 'ln-invoice-create' "$variables"
  payment_request="$(echo $invoice | jq -r '.paymentRequest')"
  lnd_outside_cli payinvoice -f \
    --pay_req "$payment_request"

  for i in {1..20}; do
    jq_query='.data.me.defaultAccount.transactions.edges[] | select(.node.initiationVia.paymentHash == $payment_hash) .node'
    echo $output \
      | jq -r --arg payment_hash "$1" "$jq_query" \
      | jq -r ".status"
    [[ "${settled_status}" = "SUCCESS" ]] && break
    sleep 1
  done
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
  bitcoin_cli -generate 5
}

initialize_user_from_onchain() {
  local token_name="$1"
  local phone="$2"
  local code="$3"

  local btc_amount_in_btc="1"

  login_user "$token_name" "$phone" "$code"

  fund_wallet_from_onchain \
    "$token_name" \
    "$token_name.btc_wallet_id" \
    "$btc_amount_in_btc"
}

