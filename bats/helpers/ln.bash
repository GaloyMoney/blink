CURRENT_FILE=${BASH_SOURCE:-bats/helpers/.}
source "$(dirname "$CURRENT_FILE")/_common.bash"
source "$(dirname "$CURRENT_FILE")/cli.bash"
source "$(dirname "$CURRENT_FILE")/subscriber.bash"

fund_user_lightning() {
  local token_name=$1
  local wallet_id_name="$token_name.${2}_id" # btc_wallet or usd_wallet
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

  no_pending_channels() {
    pending_channel="$(lnd_outside_cli pendingchannels | jq -r '.pending_open_channels[0]')"
    if [[ "$pending_channel" != "null" ]]; then
      bitcoin_cli -generate 3
      exit 1
    fi
  }

  synced_to_graph() {
    is_synced="$(lnd_outside_cli getinfo | jq -r '.synced_to_graph')"
    [[ "$is_synced" == "true" ]] || exit 1
  }

  # Open channel from lndoutside1 -> lnd1
  pubkey="$(lnd_cli getinfo | jq -r '.identity_pubkey')"
  endpoint="${COMPOSE_PROJECT_NAME}-lnd1-1:9735"

  lnd_outside_cli connect "${pubkey}@${endpoint}" || true
  retry 10 1 synced_to_graph
  lnd_outside_cli openchannel \
    --node_key "$pubkey" \
    --local_amt "$local_amount"

  retry 10 1 mempool_not_empty
  retry 10 1 no_pending_channels

  # Open channel with push from lndoutside1 -> lndoutside2
  pubkey="$(lnd_outside_2_cli getinfo | jq -r '.identity_pubkey')"
  endpoint="${COMPOSE_PROJECT_NAME}-lnd-outside-2-1:9735"

  lnd_outside_cli connect "${pubkey}@${endpoint}" || true
  retry 10 1 synced_to_graph
  lnd_outside_cli openchannel \
    --node_key "$pubkey" \
    --local_amt "$local_amount" \
    --push_amt "$push_amount"

  retry 10 1 mempool_not_empty
  retry 10 1 no_pending_channels

  # FIXME: we may need some check on the graph or something else
  # NB: I get randomly a "no route" error otherwise
  sleep 10
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

# Status of LN Payment
check_for_ln_initiated_settled() {
  check_for_ln_initiated_status "SUCCESS" "$@"
}

check_for_ln_initiated_pending() {
  check_for_ln_initiated_status "PENDING" "$@"
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

mempool_not_empty() {
  local txid="$(bitcoin_cli getrawmempool | jq -r ".[0]")"
  [[ "$txid" != "null" ]] || exit 1
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

check_for_ln_update() {
  payment_hash=$1

  retry 10 1 \
    grep "Data.*LnUpdate.*$payment_hash" "$SUBSCRIBER_LOG_FILE" \
    | awk '{print $2}' \
    | jq -r --arg hash "$payment_hash" 'select(.data.myUpdates.update.paymentHash == $hash)'

  paid_status=$( \
    grep 'Data.*LnUpdate' "$SUBSCRIBER_LOG_FILE" \
    | awk '{print $2}' \
    | jq -r --arg hash "$payment_hash" 'select(.data.myUpdates.update.paymentHash == $hash) .data.myUpdates.update.status'
  )

  [[ "$paid_status" == "PAID" ]] || exit 1
}
