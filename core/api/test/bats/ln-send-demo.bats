#!/usr/bin/env bats

load "helpers/setup-and-teardown"
load "helpers/ln"

setup_file() {
  clear_cache

  bitcoind_init
  start_trigger
  start_server
  start_exporter

  lnds_init
  initialize_user_from_onchain "$ALICE_TOKEN_NAME" "$ALICE_PHONE" "$CODE"
  user_update_username "$ALICE_TOKEN_NAME"
  initialize_user_from_onchain "$BOB_TOKEN_NAME" "$BOB_PHONE" "$CODE"
}

teardown_file() {
  stop_trigger
  stop_server
  stop_exporter
}

setup() {
  reset_redis
}

teardown() {
  if [[ "$(balance_for_check)" != 0 ]]; then
    fail "Error: balance_for_check failed"
  fi
}

amount_sent_for_ln_txn_by_hash() {
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
      | select(.node.direction == "SEND")
    ]
      | first .node.settlementAmount
  '
  local amount=$(echo $output \
    | jq -r \
      --arg payment_hash "$payment_hash" \
      "$jq_query"
  )
  abs $amount
}

btc_amount=1000
usd_amount=50

@test "ln-send: lightning settled - lnInvoicePaymentSend from btc, no fee probe" {
  token_name="$ALICE_TOKEN_NAME"
  btc_wallet_name="$token_name.btc_wallet_id"

  initial_lnd1_balance=$(lnd_cli channelbalance | jq -r '.balance')

  invoice_response="$(lnd_outside_cli addinvoice --amt $btc_amount)"
  payment_request="$(echo $invoice_response | jq -r '.payment_request')"
  payment_hash=$(echo $invoice_response | jq -r '.r_hash')
  [[ "${payment_request}" != "null" ]] || exit 1

  echo "Reimbursement demo" > .demo.log
  echo "===" >> .demo.log
  echo "Hash: ${payment_hash}" >> .demo.log
  echo "WalletId: $(read_value $btc_wallet_name)" >> .demo.log
  echo "Query mongo with: {hash: \"${payment_hash}\", account_path: \"$(read_value $btc_wallet_name)\"}" >> .demo.log
  echo "> sort by: {datetime: -1}" >> .demo.log
  echo >> .demo.log

  variables=$(
    jq -n \
    --arg wallet_id "$(read_value $btc_wallet_name)" \
    --arg payment_request "$payment_request" \
    '{input: {walletId: $wallet_id, paymentRequest: $payment_request}}'
  )

  exec_graphql "$token_name" 'ln-invoice-payment-send' "$variables"
  send_status="$(graphql_output '.data.lnInvoicePaymentSend.status')"
  [[ "${send_status}" = "SUCCESS" ]] || exit 1

  # Check for settled
  retry 15 1 check_for_ln_initiated_settled "$token_name" "$payment_hash"

  final_lnd1_balance=$(lnd_cli channelbalance | jq -r '.balance')
  lnd1_diff="$(( $initial_lnd1_balance - $final_lnd1_balance ))"
  [[ "$lnd1_diff" == "$btc_amount" ]] || exit 1
}

@test "ln-send: ln settled - settle failed and then pending-to-failed payment" {
  token_name="$ALICE_TOKEN_NAME"
  btc_wallet_name="$token_name.btc_wallet_id"

  threshold_amount=150000
  secret=$(xxd -l 32 -p /dev/urandom)
  payment_hash=$(echo -n $secret | xxd -r -p | sha256sum | cut -d ' ' -f1)
  invoice_response="$(lnd_outside_2_cli addholdinvoice $payment_hash --amt $threshold_amount)"
  payment_request="$(echo $invoice_response | jq -r '.payment_request')"
  [[ "${payment_request}" != "null" ]] || exit 1

  echo "Faileds demo" >> .demo.log
  echo "===" >> .demo.log
  echo "Hash: ${payment_hash}" >> .demo.log
  echo "WalletId: $(read_value $btc_wallet_name)" >> .demo.log
  echo "Query mongo with: {hash: \"${payment_hash}\", account_path: \"$(read_value $btc_wallet_name)\"}" >> .demo.log
  echo "> sort by: {datetime: -1}" >> .demo.log

  check_num_txns() {
    expected_num="$1"

    num_txns="$(num_txns_for_hash "$token_name" "$payment_hash")"
    [[ "$num_txns" == "$expected_num" ]] || exit 1
  }

  # Rebalance last hop so payment will fail
  rebalance_channel lnd_outside_cli lnd_outside_2_cli "$(( $threshold_amount - 1 ))"

  # Try payment and check for fail
  initial_balance="$(balance_for_wallet $token_name 'BTC')"

  variables=$(
    jq -n \
    --arg wallet_id "$(read_value $btc_wallet_name)" \
    --arg payment_request "$payment_request" \
    '{input: {walletId: $wallet_id, paymentRequest: $payment_request}}'
  )
  exec_graphql "$token_name" 'ln-invoice-payment-send' "$variables"
  send_status="$(graphql_output '.data.lnInvoicePaymentSend.status')"
  error_msg="$(graphql_output '.data.lnInvoicePaymentSend.errors[0].message')"
  [[ "${send_status}" = "FAILURE" ]] || exit 1
  [[ "${error_msg}" == "Unable to find a route for payment." ]] || exit 1

  # Check for txns
  retry 15 1 check_num_txns "2"
  balance_after_fail="$(balance_for_wallet $token_name 'BTC')"
  [[ "$initial_balance" == "$balance_after_fail" ]] || exit 1

  # Rebalance last hop so same payment will succeed
  rebalance_channel lnd_outside_cli lnd_outside_2_cli "$(( $threshold_amount * 2 ))"
  lnd_cli resetmc

  # Retry payment and check for pending
  exec_graphql "$token_name" 'ln-invoice-payment-send' "$variables"
  send_status="$(graphql_output '.data.lnInvoicePaymentSend.status')"
  [[ "${send_status}" = "PENDING" ]] || exit 1

  # Check for txns
  retry 15 1 check_num_txns "3"
  check_for_ln_initiated_pending "$token_name" "$payment_hash" "10" \
    || exit 1
  balance_while_pending="$(balance_for_wallet $token_name 'BTC')"
  [[ "$balance_while_pending" -lt "$initial_balance" ]] || exit 1

  # Cancel hodl invoice
  lnd_outside_2_cli cancelinvoice "$payment_hash"

  retry 15 1 check_num_txns "4"
  balance_after_pending_failed="$(balance_for_wallet $token_name 'BTC')"
  [[ "$balance_after_pending_failed" == "$initial_balance" ]] || exit 1

  run check_for_ln_initiated_pending "$token_name" "$payment_hash" "10"
  [[ "$status" -ne 0 ]] || exit 1

  # DEMO: Retry payment to get failed because paid
  exec_graphql "$token_name" 'ln-invoice-payment-send' "$variables"
  send_status="$(graphql_output '.data.lnInvoicePaymentSend.status')"
}
