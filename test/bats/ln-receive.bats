#!/usr/bin/env bats

load "helpers/setup-and-teardown"
load "helpers/ln"

setup_file() {
  clear_cache

  bitcoind_init
  start_trigger
  start_ws_server
  start_server
  start_exporter
  start_callback

  lnds_init

  login_user "$ALICE_TOKEN_NAME" "$ALICE_PHONE" "$CODE"
  add_callback "$ALICE_TOKEN_NAME"
  initialize_user_from_onchain "$ALICE_TOKEN_NAME" "$ALICE_PHONE" "$CODE"

  subscribe_to "$ALICE_TOKEN_NAME" my-updates-sub
  sleep 3
}

teardown_file() {
  remove_callbacks "$ALICE_TOKEN_NAME"

  stop_trigger
  stop_server
  stop_ws_server
  stop_exporter
  stop_subscriber
  stop_callback
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

@test "ln-receive: settle via ln for BTC wallet, invoice with amount" {
  token_name="$ALICE_TOKEN_NAME"
  btc_wallet_name="$token_name.btc_wallet_id"

  # Check callback events before
  exec_graphql "$token_name" 'account-details'
  account_id="$(graphql_output '.data.me.defaultAccount.id')"
  [[ "$account_id" != "null" ]] || exit 1

  num_callback_events_before=$(cat .e2e-callback.log | grep "$account_id" | wc -l)

  # Generate invoice
  variables=$(
    jq -n \
    --arg wallet_id "$(read_value $btc_wallet_name)" \
    --arg amount "$btc_amount" \
    '{input: {walletId: $wallet_id, amount: $amount}}'
  )
  exec_graphql "$token_name" 'ln-invoice-create' "$variables"
  invoice="$(graphql_output '.data.lnInvoiceCreate.invoice')"

  payment_request="$(echo $invoice | jq -r '.paymentRequest')"
  [[ "${payment_request}" != "null" ]] || exit 1
  payment_hash="$(echo $invoice | jq -r '.paymentHash')"
  [[ "${payment_hash}" != "null" ]] || exit 1

  # Receive payment
  lnd_outside_cli payinvoice -f \
    --pay_req "$payment_request"

  # Check for settled
  retry 15 1 check_for_ln_initiated_settled "$token_name" "$payment_hash"

  # Check for subscriber event
  check_for_ln_update "$payment_hash" || exit 1

  # Check for callback
  num_callback_events_after=$(cat .e2e-callback.log | grep "$account_id" | wc -l)
  [[ "$num_callback_events_after" -gt "$num_callback_events_before" ]] || exit 1
}

@test "ln-receive: settle via ln for USD wallet, invoice with amount" {
  # Generate invoice
  token_name="$ALICE_TOKEN_NAME"
  usd_wallet_name="$token_name.usd_wallet_id"

  variables=$(
    jq -n \
    --arg wallet_id "$(read_value $usd_wallet_name)" \
    --arg amount "$usd_amount" \
    '{input: {walletId: $wallet_id, amount: $amount}}'
  )
  exec_graphql "$token_name" 'ln-usd-invoice-create' "$variables"
  invoice="$(graphql_output '.data.lnUsdInvoiceCreate.invoice')"

  payment_request="$(echo $invoice | jq -r '.paymentRequest')"
  [[ "${payment_request}" != "null" ]] || exit 1
  payment_hash="$(echo $invoice | jq -r '.paymentHash')"
  [[ "${payment_hash}" != "null" ]] || exit 1

  # Receive payment
  lnd_outside_cli payinvoice -f \
    --pay_req "$payment_request"

  # Check for settled
  retry 15 1 check_for_ln_initiated_settled "$token_name" "$payment_hash"

  # Check for subscriber event
  check_for_ln_update "$payment_hash" || exit 1
}

@test "ln-receive: settle via ln for BTC wallet, amountless invoice" {
  token_name="$ALICE_TOKEN_NAME"
  btc_wallet_name="$token_name.btc_wallet_id"

  # Generate invoice
  variables=$(
    jq -n \
    --arg wallet_id "$(read_value $btc_wallet_name)" \
    '{input: {walletId: $wallet_id}}'
  )
  exec_graphql "$token_name" 'ln-no-amount-invoice-create' "$variables"
  invoice="$(graphql_output '.data.lnNoAmountInvoiceCreate.invoice')"

  payment_request="$(echo $invoice | jq -r '.paymentRequest')"
  [[ "${payment_request}" != "null" ]] || exit 1
  payment_hash="$(echo $invoice | jq -r '.paymentHash')"
  [[ "${payment_hash}" != "null" ]] || exit 1

  # Receive payment
  lnd_outside_cli payinvoice -f \
    --pay_req "$payment_request" \
    --amt "$btc_amount"

  # Check for settled
  retry 15 1 check_for_ln_initiated_settled "$token_name" "$payment_hash"

  # Check for subscriber event
  check_for_ln_update "$payment_hash" || exit 1
}

@test "ln-receive: handle less-than-1-sat ln payment for BTC wallet" {
  token_name="$ALICE_TOKEN_NAME"
  btc_wallet_name="$token_name.btc_wallet_id"

  # Generate amountless invoice
  invoice_variables=$(
    jq -n \
    --arg wallet_id "$(read_value $btc_wallet_name)" \
    '{input: {walletId: $wallet_id}}'
  )
  exec_graphql "$token_name" 'ln-no-amount-invoice-create' "$invoice_variables"
  invoice="$(graphql_output '.data.lnNoAmountInvoiceCreate.invoice')"

  payment_request="$(echo $invoice | jq -r '.paymentRequest')"
  [[ "${payment_request}" != "null" ]] || exit 1
  payment_hash="$(echo $invoice | jq -r '.paymentHash')"
  [[ "${payment_hash}" != "null" ]] || exit 1

  # Check that invoice is retrievable from lnd1
  invoice_from_lnd=$(lnd_cli lookupinvoice "$payment_hash")
  [[ -n $invoice_from_lnd ]] || exit 1

  # Receive less-than-1-sat payment
  pay_variables=$(
    jq -n \
    --arg payment_request "$payment_request" \
    --arg amt_msat "995" \
    --arg timeout_seconds "5" \
    '{payment_request: $payment_request, amt_msat: $amt_msat, timeout_seconds: $timeout_seconds}'\
    | tr -d '[:space:]')
  lnd_outside_rest "v2/router/send" "$pay_variables"

  # Check that payment fails
  response=$(tail -n 1 "$LNDS_REST_LOG")
  [[ -n $response ]] || exit 1
  pay_status=$(echo $response | jq -r '.result.status')
  [[ "$pay_status" == "FAILED" ]] || exit 1
  failure_reason=$(echo $response | jq -r '.result.failure_reason')
  [[ "$failure_reason" == "FAILURE_REASON_INCORRECT_PAYMENT_DETAILS" ]] || exit 1

  # Check that invoice is removed from lnd1
  invoice_from_lnd=$(lnd_cli lookupinvoice "$payment_hash") || true
  [[ -z $invoice_from_lnd ]] || exit 1
}

@test "ln-receive: settle via ln for USD wallet, amountless invoice" {
  # Generate invoice
  token_name="$ALICE_TOKEN_NAME"
  usd_wallet_name="$token_name.usd_wallet_id"

  variables=$(
    jq -n \
    --arg wallet_id "$(read_value $usd_wallet_name)" \
    '{input: {walletId: $wallet_id}}'
  )
  exec_graphql "$token_name" 'ln-no-amount-invoice-create' "$variables"
  invoice="$(graphql_output '.data.lnNoAmountInvoiceCreate.invoice')"

  payment_request="$(echo $invoice | jq -r '.paymentRequest')"
  [[ "${payment_request}" != "null" ]] || exit 1
  payment_hash="$(echo $invoice | jq -r '.paymentHash')"
  [[ "${payment_hash}" != "null" ]] || exit 1

  # Receive payment
  lnd_outside_cli payinvoice -f \
    --pay_req "$payment_request" \
    --amt "$btc_amount"

  # Check for settled
  retry 15 1 check_for_ln_initiated_settled "$token_name" "$payment_hash"

  # Check for subscriber event
  check_for_ln_update "$payment_hash" || exit 1
}
