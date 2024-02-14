CURRENT_FILE=${BASH_SOURCE:-bats/helpers/.}
source "$(dirname "$CURRENT_FILE")/_common.bash"
source "$(dirname "$CURRENT_FILE")/cli.bash"

export SUBSCRIBER_LOG_FILE="${BATS_ROOT_DIR}/.e2e-subscriber.log"

create_new_lnd_onchain_address() {
  local wallet_name=$1
  local wallet_id=$(read_value $wallet_name)

  insert_lnd1_address() {
    local wallet_id=$1
    local address=$2
    pubkey=$(lnd_cli getinfo | jq -r '.identity_pubkey')

    mongo_command=$(echo "db.wallets.updateOne(
      { id: \"$wallet_id\" },
      {
        \$push: {
          onchain: {
            address: \"$address\",
            pubkey: \"$pubkey\"
          }
        }
      }
    );" | tr -d '[:space:]')

    mongo_cli "$mongo_command"
  }

  address=$(lnd_cli newaddress p2wkh | jq -r '.address')
  insert_lnd1_address "$wallet_id" "$address" > /dev/null

  echo $address
}

get_from_transaction_by_ln_hash_and_status() {
  payment_hash="$1"
  expected_status="$2"
  property_query="$3"

  jq_query='
    .data.me.defaultAccount.transactions.edges[]
    | select(.node.initiationVia.paymentHash == $payment_hash)
    | select(.node.status == $expected_status)
    .node'

  echo $output \
    | jq -r \
      --arg payment_hash "$payment_hash" \
      --arg expected_status "$expected_status" \
      "$jq_query" \
    | jq -r "$property_query" \
    | head -n 1
}

check_for_ln_initiated_status() {
  local expected_status=$1
  local token_name=$2
  local payment_hash=$3
  local first=${4:-"2"}

  variables=$(
  jq -n \
  --argjson first "$first" \
  '{"first": $first}'
  )
  exec_graphql "$token_name" 'transactions' "$variables"

  status="$(get_from_transaction_by_ln_hash_and_status $payment_hash $expected_status '.status')"
  [[ "${status}" == "${expected_status}" ]] || return 1
}

check_for_ln_initiated_settled() {
  check_for_ln_initiated_status "SUCCESS" "$@"
}

check_for_ln_initiated_pending() {
  check_for_ln_initiated_status "PENDING" "$@"
}

check_for_ln_update() {
  payment_hash=$1

  retry 10 1 \
    grep "Data.*LnUpdate.*$payment_hash" "$SUBSCRIBER_LOG_FILE" || exit 1

  paid_status=$( \
    grep 'Data.*LnUpdate' "$SUBSCRIBER_LOG_FILE" \
    | awk '{print $2}' \
    | jq -r --arg hash "$payment_hash" 'select(.data.myUpdates.update.paymentHash == $hash) .data.myUpdates.update.status'
  )

  [[ "$paid_status" == "PAID" ]] || exit 1
}

check_ln_payment_settled() {
  local payment_request=$1
  local payment_hash=$2

  variables=$(
  jq -n \
  --arg payment_request "$payment_request" \
  '{"input": {"paymentRequest": $payment_request}}'
  )
  exec_graphql 'anon' 'ln-invoice-payment-status-by-request' "$variables"
  payment_status="$(graphql_output '.data.lnInvoicePaymentStatusByRequest.status')"
  payment_request_resp="$(graphql_output '.data.lnInvoicePaymentStatusByRequest.paymentRequest')"
  payment_hash_resp="$(graphql_output '.data.lnInvoicePaymentStatusByRequest.paymentHash')"
  [[ "${payment_hash}" = "${payment_hash_resp}" ]] || exit 1
  [[ "${payment_request}" = "${payment_request_resp}" ]] || exit 1
  [[ "${payment_status}" = "PAID" ]]
}

check_ln_payment_settled_by_hash() {
  local payment_request=$1
  local payment_hash=$2

  variables=$(
  jq -n \
  --arg payment_hash "$payment_hash" \
  '{"input": {"paymentHash": $payment_hash}}'
  )
  exec_graphql 'anon' 'ln-invoice-payment-status-by-hash' "$variables"
  payment_status="$(graphql_output '.data.lnInvoicePaymentStatusByHash.status')"
  payment_request_resp="$(graphql_output '.data.lnInvoicePaymentStatusByHash.paymentRequest')"
  payment_hash_resp="$(graphql_output '.data.lnInvoicePaymentStatusByHash.paymentHash')"
  [[ "${payment_hash}" = "${payment_hash_resp}" ]] || exit 1
  [[ "${payment_request}" = "${payment_request_resp}" ]] || exit 1
  [[ "${payment_status}" = "PAID" ]]
}

fund_user_lightning() {
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

run_with_lnd() {
  local func_name="$1"
  shift  # This will shift away the function name, so $1 becomes the next argument

  if [[ "$func_name" == "lnd_cli" ]]; then
    lnd_cli "$@"
  elif [[ "$func_name" == "lnd2_cli" ]]; then
    lnd2_cli "$@"
  elif [[ "$func_name" == "lnd_outside_cli" ]]; then
    lnd_outside_cli "$@"
  elif [[ "$func_name" == "lnd_outside_2_cli" ]]; then
    lnd_outside_2_cli "$@"
  else
    echo "Invalid function name passed!" && return 1
  fi
}

close_partner_initiated_channels_with_external() {
  close_channels_with_external() {
    lnd_cli_value="$1"
    lnd1_pubkey=$(lnd_cli getinfo | jq -r '.identity_pubkey')
    lnd2_pubkey=$(lnd2_cli getinfo | jq -r '.identity_pubkey')

    partner_initiated_external_channel_filter='
    .channels[]?
      | select(.initiator != true)
      | select(.remote_pubkey != $lnd1_pubkey)
      | select(.remote_pubkey != $lnd2_pubkey)
      | .channel_point
    '

    run_with_lnd "$lnd_cli_value" listchannels \
      | jq -r \
        --arg lnd1_pubkey "$lnd1_pubkey" \
        --arg lnd2_pubkey "$lnd2_pubkey" \
        "$partner_initiated_external_channel_filter" \
      | while read -r channel_point; do
          funding_txid="${channel_point%%:*}"
          run_with_lnd "$lnd_cli_value" closechannel "$funding_txid"
        done
  }

  close_channels_with_external lnd_cli
  close_channels_with_external lnd2_cli
  close_channels_with_external lnd_outside_cli
  close_channels_with_external lnd_outside_2_cli
}

rebalance_channel() {
    lnd_cli_value="$1"
    lnd_partner_cli_value="$2"
    target_local_balance="$3"

    local_pubkey="$(run_with_lnd $lnd_cli_value getinfo | jq -r '.identity_pubkey')"
    remote_pubkey="$(run_with_lnd $lnd_partner_cli_value getinfo | jq -r '.identity_pubkey')"

    partner_channel_filter='
    [
      .channels[]?
      | select(.remote_pubkey == $remote_pubkey)
    ] | first
    '

    channel=$(
      run_with_lnd "$lnd_cli_value" listchannels \
        | jq -r \
          --arg remote_pubkey "$remote_pubkey" \
          "$partner_channel_filter"
    )
    [[ "$channel" != "null" ]]

    actual_local_balance=$(echo $channel | jq -r '.local_balance')
    diff="$(( $actual_local_balance - $target_local_balance ))"
    if [[ "$diff" -gt 0 ]]; then
      run_with_lnd "$lnd_cli_value" sendpayment --dest=$remote_pubkey --amt=$diff --keysend
    elif [[ "$diff" -lt 0 ]]; then
      run_with_lnd "$lnd_partner_cli_value" sendpayment --dest=$local_pubkey --amt="$(abs $diff)" --keysend
    fi
}

num_txns_for_hash() {
  token_name="$1"
  payment_hash="$2"

  first=20
  txn_variables=$(
  jq -n \
  --argjson first "$first" \
  '{"first": $first}'
  )
  exec_graphql "$token_name" 'transactions' "$txn_variables" > /dev/null

  jq_query='
    [
      .data.me.defaultAccount.transactions.edges[]
      | select(.node.initiationVia.paymentHash == $payment_hash)
    ]
      | length
  '
  echo $output \
    | jq -r \
      --arg payment_hash "$payment_hash" \
      "$jq_query"
}
