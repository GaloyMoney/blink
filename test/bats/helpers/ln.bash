BASH_SOURCE=${BASH_SOURCE:-test/bats/helpers/.}
source $(dirname "$BASH_SOURCE")/_common.bash

LND_FUNDING_TOKEN_NAME="lnd_funding"
LND_FUNDING_PHONE="+16505554351"
LND_FUNDING_CODE="321321"

lnds_init() {
  # Clean up any existing channels
  lnd_cli closeallchannels || true

  # Mine onchain balance
  local amount="1"
  local address="$(lnd_outside_cli newaddress p2wkh | jq -r '.address')"
  local local_amount="10000000"
  local push_amount="5000000"
  bitcoin_cli sendtoaddress "$address" "$amount"
  bitcoin_cli -generate 3

  # Open balanced channel from lnd1 to lndoutside1
  lnd_local_pubkey="$(lnd_cli getinfo | jq -r '.identity_pubkey')"
  lnd_outside_cli connect "${lnd_local_pubkey}@${COMPOSE_PROJECT_NAME}-lnd1-1:9735" || true
  lnd_outside_cli openchannel \
    --node_key "$lnd_local_pubkey" \
    --local_amt "$local_amount" \

  mempool_not_empty() {
    local txid= [[ "$(bitcoin_cli getrawmempool | jq -r ".[0]")" != "null" ]]
    [[ "$txid" != "null" ]] || exit 1
  }

  no_pending_channels() {
    pending_channel="$(lnd_outside_cli pendingchannels | jq -r '.pending_open_channels[0]')"
    if [[ "$pending_channel" != "null" ]]; then
      bitcoin_cli -generate 3
      exit 1
    fi
  }

  retry 10 1 mempool_not_empty
  retry 10 1 no_pending_channels

  # Fund lnd1 node via funding user
  login_user \
    "$LND_FUNDING_TOKEN_NAME" \
    "$LND_FUNDING_PHONE" \
    "$LND_FUNDING_CODE"

  fund_wallet_from_lightning \
    "$LND_FUNDING_TOKEN_NAME" \
    "$LND_FUNDING_TOKEN_NAME.btc_wallet_id" \
    "$push_amount"
}

lnd_cli() {
  docker exec "${COMPOSE_PROJECT_NAME}-lnd1-1" \
    lncli \
      --macaroonpath /root/.lnd/admin.macaroon \
      --tlscertpath /root/.lnd/tls.cert \
      $@
}

lnd_outside_cli() {
  docker exec "${COMPOSE_PROJECT_NAME}-lnd-outside-1-1" \
    lncli \
      --macaroonpath /root/.lnd/admin.macaroon \
      --tlscertpath /root/.lnd/tls.cert \
      $@
}

fund_wallet_from_lightning() {
  local token_name=$1
  local wallet_id_name=$2
  local amount=$3

  variables=$(
    jq -n \
    --arg wallet_id "$(read_value $wallet_id_name)" \
    '{input: {walletId: $wallet_id}}'
  )
  exec_graphql "$token_name" 'ln-no-amount-invoice-create' "$variables"
  invoice="$(graphql_output '.data.lnNoAmountInvoiceCreate.invoice')"

  payment_request="$(echo $invoice | jq -r '.paymentRequest')"
  [[ "${payment_request}" != "null" ]]
  payment_hash="$(echo $invoice | jq -r '.paymentHash')"
  [[ "${payment_hash}" != "null" ]]

  lnd_outside_cli payinvoice -f \
    --pay_req "$payment_request" \
    --amt "$amount"

  retry 15 1 check_for_ln_initiated_settled "$token_name" "$payment_hash"
}

check_for_ln_initiated_settled() {
  local token_name=$1
  local payment_hash=$2
  local first=${3:-"2"}

  variables=$(
  jq -n \
  --argjson first "$first" \
  '{"first": $first}'
  )
  exec_graphql "$token_name" 'transactions' "$variables"

  settled_status="$(get_from_transaction_by_ln_hash $payment_hash '.status')"
  [[ "${settled_status}" = "SUCCESS" ]]
}

check_ln_payment_settled() {
  local payment_request=$1

  variables=$(
  jq -n \
  --arg payment_request "$payment_request" \
  '{"input": {"paymentRequest": $payment_request}}'
  )
  exec_graphql 'anon' 'ln-invoice-payment-status' "$variables"
  payment_status="$(graphql_output '.data.lnInvoicePaymentStatus.status')"
  [[ "${payment_status}" = "PAID" ]]
}

get_from_transaction_by_ln_hash() {
  property_query=$2

  jq_query='.data.me.defaultAccount.transactions.edges[] | select(.node.initiationVia.paymentHash == $payment_hash) .node'
  echo $output \
    | jq -r --arg payment_hash "$1" "$jq_query" \
    | jq -r "$property_query"
}
