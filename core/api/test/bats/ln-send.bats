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

btc_amount=1000
usd_amount=50

@test "ln-send: ln settled - settle failed and then pending-to-failed payment" {
  skip "missing xxd dep, failing on concourse"

  token_name="$ALICE_TOKEN_NAME"
  btc_wallet_name="$token_name.btc_wallet_id"

  threshold_amount=150000
  secret=$(xxd -l 32 -p /dev/urandom)
  payment_hash=$(echo -n $secret | xxd -r -p | sha256sum | cut -d ' ' -f1)
  invoice_response="$(lnd_outside_2_cli addholdinvoice $payment_hash --amt $threshold_amount)"
  payment_request="$(echo $invoice_response | jq -r '.payment_request')"
  [[ "${payment_request}" != "null" ]] || exit 1

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

  transaction_payment_hash="$(graphql_output '.data.lnInvoicePaymentSend.transaction.initiationVia.paymentHash')"
  [[ "${transaction_payment_hash}" == "${payment_hash}" ]] || exit 1

  transaction_payment_request="$(graphql_output '.data.lnInvoicePaymentSend.transaction.initiationVia.paymentRequest')"
  [[ "${transaction_payment_request}" == "${payment_request}" ]] || exit 1

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
}

@test "ln-send: ln settled - pending-to-failed usd payment" {
  skip "missing xxd dep, failing on concourse"

  token_name="$ALICE_TOKEN_NAME"
  btc_wallet_name="$token_name.btc_wallet_id"
  usd_wallet_name="$token_name.usd_wallet_id"

  threshold_amount=150000
  secret=$(xxd -l 32 -p /dev/urandom)
  payment_hash=$(echo -n $secret | xxd -r -p | sha256sum | cut -d ' ' -f1)
  invoice_response="$(lnd_outside_2_cli addholdinvoice $payment_hash --amt $threshold_amount)"
  payment_request="$(echo $invoice_response | jq -r '.payment_request')"
  [[ "${payment_request}" != "null" ]] || exit 1

  check_num_txns() {
    expected_num="$1"

    num_txns="$(num_txns_for_hash "$token_name" "$payment_hash")"
    [[ "$num_txns" == "$expected_num" ]] || exit 1
  }

  initial_btc_balance="$(balance_for_wallet $token_name 'BTC')"
  initial_usd_balance="$(balance_for_wallet $token_name 'USD')"

  # Rebalance last hop so payment will succeed
  rebalance_channel lnd_outside_cli lnd_outside_2_cli "$(( $threshold_amount * 2 ))"
  lnd_cli resetmc

  # Try payment and check for pending
  variables=$(
    jq -n \
    --arg wallet_id "$(read_value $usd_wallet_name)" \
    --arg payment_request "$payment_request" \
    '{input: {walletId: $wallet_id, paymentRequest: $payment_request}}'
  )
  exec_graphql "$token_name" 'ln-invoice-payment-send' "$variables"
  send_status="$(graphql_output '.data.lnInvoicePaymentSend.status')"
  [[ "${send_status}" = "PENDING" ]] || exit 1

  transaction_payment_hash="$(graphql_output '.data.lnInvoicePaymentSend.transaction.initiationVia.paymentHash')"
  [[ "${transaction_payment_hash}" == "${payment_hash}" ]] || exit 1

  transaction_payment_request="$(graphql_output '.data.lnInvoicePaymentSend.transaction.initiationVia.paymentRequest')"
  [[ "${transaction_payment_request}" == "${payment_request}" ]] || exit 1

  # Check for txns
  retry 15 1 check_num_txns "1"
  check_for_ln_initiated_pending "$token_name" "$payment_hash" "10" \
    || exit 1
  btc_balance_while_pending="$(balance_for_wallet $token_name 'BTC')"
  usd_balance_while_pending="$(balance_for_wallet $token_name 'USD')"
  [[ "$btc_balance_while_pending" == "$initial_btc_balance" ]] || exit 1
  [[ "$usd_balance_while_pending" -lt "$initial_usd_balance" ]] || exit 1

  # Cancel hodl invoice
  lnd_outside_2_cli cancelinvoice "$payment_hash"

  retry 15 1 check_num_txns "2"
  btc_balance_after_pending_failed="$(balance_for_wallet $token_name 'BTC')"
  usd_balance_after_pending_failed="$(balance_for_wallet $token_name 'USD')"
  [[ "$btc_balance_after_pending_failed" -gt "$btc_balance_while_pending" ]] || exit 1
  [[ "$usd_balance_after_pending_failed" == "$usd_balance_while_pending" ]] || exit 1

  run check_for_ln_initiated_pending "$token_name" "$payment_hash" "10"
  [[ "$status" -ne 0 ]] || exit 1
}
