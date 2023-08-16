BASH_SOURCE=${BASH_SOURCE:-test/bats/helpers/.}
source $(dirname "$BASH_SOURCE")/_common.bash

LND_FUNDING_TOKEN_NAME="lnd_funding"
LND_FUNDING_PHONE="+16505554351"

mempool_not_empty() {
  local txid="$(bitcoin_cli getrawmempool | jq -r ".[0]")"
  [[ "$txid" != "null" ]] || exit 1
}

run_with_lnd() {
  local func_name="$1"
  shift  # This will shift away the function name, so $1 becomes the next argument

  if [[ "$func_name" == "lnd_cli" ]]; then
    lnd_cli "$@"
  elif [[ "$func_name" == "lnd2_cli" ]]; then
    lnd2_cli "$@"
  else
    echo "Invalid function name passed!" && exit 1
  fi
}

close_partner_initiated_channels_with_external() {
  lnd1_pubkey=$(lnd_cli getinfo | jq -r '.identity_pubkey')
  lnd2_pubkey=$(lnd2_cli getinfo | jq -r '.identity_pubkey')

  partner_initiated_external_channel_filter='
  .channels[]?
    | select(.initiator != true)
    | select(.remote_pubkey != $lnd1_pubkey)
    | select(.remote_pubkey != $lnd2_pubkey)
    | .channel_point
  '

  lnd_cli listchannels \
    | jq -r \
      --arg lnd1_pubkey "$lnd1_pubkey" \
      --arg lnd2_pubkey "$lnd2_pubkey" \
      "$partner_initiated_external_channel_filter" \
    | while read -r channel_point; do
        funding_txid="${channel_point%%:*}"
        lnd_cli closechannel "$funding_txid"
      done

  lnd2_cli listchannels \
    | jq -r \
      --arg lnd1_pubkey "$lnd1_pubkey" \
      --arg lnd2_pubkey "$lnd2_pubkey" \
      "$partner_initiated_external_channel_filter" \
    | while read -r channel_point; do
        funding_txid="${channel_point%%:*}"
        lnd2_cli closechannel "$funding_txid"
      done

}

lnds_init() {
  # Clean up any existing channels
  close_partner_initiated_channels_with_external || true

  # Mine onchain balance
  local amount="1"
  local address="$(lnd_outside_cli newaddress p2wkh | jq -r '.address')"
  local local_amount="10000000"
  local push_amount="5000000"
  bitcoin_cli sendtoaddress "$address" "$amount"
  bitcoin_cli -generate 3

  # Open channel from lnd1 to lndoutside1
  lnd_local_pubkey="$(lnd_cli getinfo | jq -r '.identity_pubkey')"
  lnd_outside_cli connect "${lnd_local_pubkey}@${COMPOSE_PROJECT_NAME}-lnd1-1:9735" || true
  lnd_outside_cli openchannel \
    --node_key "$lnd_local_pubkey" \
    --local_amt "$local_amount" \

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
    "$CODE"

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

lnd2_cli() {
  docker exec "${COMPOSE_PROJECT_NAME}-lnd2-1" \
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

check_for_ln_update() {
  payment_hash=$1

  retry 10 1 \
    grep "Data.*LnUpdate.*$payment_hash" .e2e-subscriber.log \
    | awk '{print $2}' \
    | jq -r --arg hash "$payment_hash" 'select(.data.myUpdates.update.paymentHash == $hash)'

  paid_status=$( \
    grep 'Data.*LnUpdate' .e2e-subscriber.log \
    | awk '{print $2}' \
    | jq -r --arg hash "$payment_hash" 'select(.data.myUpdates.update.paymentHash == $hash) .data.myUpdates.update.status'
  )

  [[ "$paid_status" == "PAID" ]] || exit 1
}
