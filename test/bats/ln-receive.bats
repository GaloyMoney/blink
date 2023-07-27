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
  initialize_user_from_onchain "$ALICE_TOKEN_NAME" "$ALICE_PHONE" "$ALICE_CODE"
  initialize_user_from_onchain "$BOB_TOKEN_NAME" "$BOB_PHONE" "$BOB_CODE"
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
  [[ "$(balance_for_check)" == 0 ]] || exit 1
}

btc_amount=1000
usd_amount=50

@test "ln-receive: settle via ln for BTC wallet" {
  # Generate invoice
  token_name="$ALICE_TOKEN_NAME"
  btc_wallet_name="$token_name.btc_wallet_id"

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
}

@test "ln-receive: settle via ln for USD wallet" {
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
}

@test "ln-receive: settle via ln for BTC wallet, amountless invoice" {
  # Generate invoice
  token_name="$ALICE_TOKEN_NAME"
  btc_wallet_name="$token_name.btc_wallet_id"

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
}

@test "ln-receive: public - can create btc invoice" {
  token_name="$ALICE_TOKEN_NAME"
  btc_wallet_name="$token_name.btc_wallet_id"

  variables=$(
    jq -n \
    --arg wallet_id "$(read_value $btc_wallet_name)" \
    --arg amount "$btc_amount" \
    '{input: {recipientWalletId: $wallet_id, amount: $amount}}'
  )
  exec_graphql 'anon' 'ln-invoice-create-on-behalf-of-recipient' "$variables"
  invoice="$(graphql_output '.data.lnInvoiceCreateOnBehalfOfRecipient.invoice')"

  payment_request="$(echo $invoice | jq -r '.paymentRequest')"
  [[ "${payment_request}" != "null" ]] || exit 1
  validate_invoice_for_lnd "$payment_request" || exit 1
}

@test "ln-receive: public - can create usd invoice" {
  token_name="$ALICE_TOKEN_NAME"
  usd_wallet_name="$token_name.usd_wallet_id"

  variables=$(
    jq -n \
    --arg wallet_id "$(read_value $usd_wallet_name)" \
    --arg amount "$usd_amount" \
    '{input: {recipientWalletId: $wallet_id, amount: $amount}}'
  )
  exec_graphql 'anon' 'ln-usd-invoice-create-on-behalf-of-recipient' "$variables"
  invoice="$(graphql_output '.data.lnUsdInvoiceCreateOnBehalfOfRecipient.invoice')"

  payment_request="$(echo $invoice | jq -r '.paymentRequest')"
  [[ "${payment_request}" != "null" ]] || exit 1
  validate_invoice_for_lnd "$payment_request" || exit 1
}

@test "ln-receive: public - can create btc amountless invoice" {
  token_name="$ALICE_TOKEN_NAME"
  btc_wallet_name="$token_name.btc_wallet_id"

  variables=$(
    jq -n \
    --arg wallet_id "$(read_value $btc_wallet_name)" \
    '{input: {recipientWalletId: $wallet_id}}'
  )
  exec_graphql 'anon' 'ln-no-amount-invoice-create-on-behalf-of-recipient' "$variables"
  invoice="$(graphql_output '.data.lnNoAmountInvoiceCreateOnBehalfOfRecipient.invoice')"

  payment_request="$(echo $invoice | jq -r '.paymentRequest')"
  [[ "${payment_request}" != "null" ]] || exit 1
  validate_invoice_for_lnd "$payment_request" || exit 1
}

@test "ln-receive: public - can create usd amountless invoice" {
  token_name="$ALICE_TOKEN_NAME"
  usd_wallet_name="$token_name.usd_wallet_id"

  variables=$(
    jq -n \
    --arg wallet_id "$(read_value $usd_wallet_name)" \
    '{input: {recipientWalletId: $wallet_id}}'
  )
  exec_graphql 'anon' 'ln-no-amount-invoice-create-on-behalf-of-recipient' "$variables"
  invoice="$(graphql_output '.data.lnNoAmountInvoiceCreateOnBehalfOfRecipient.invoice')"

  payment_request="$(echo $invoice | jq -r '.paymentRequest')"
  [[ "${payment_request}" != "null" ]] || exit 1
  validate_invoice_for_lnd "$payment_request" || exit 1
}
