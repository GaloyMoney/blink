#!/usr/bin/env bats

load "helpers/ln"
load "helpers/setup-and-teardown"

setup_file() {
  start_ws_server
  start_server
}

teardown_file() {
  stop_server
  stop_ws_server
}

validate_invoice_for_lnd() {
  pay_req=$1

  node_pubkey="$(lnd_cli getinfo | jq -r '.identity_pubkey')"
  [[ -n "$node_pubkey" && "$node_pubkey" != "null" ]] || exit 1
  invoice_destination="$(lnd_cli decodepayreq $pay_req | jq -r '.destination')"
  [[ -n "$invoice_destination" && "$invoice_destination" != "null" ]] || exit 1

  [[ "$node_pubkey" == "$invoice_destination" ]] || exit 1
}

btc_amount=1000
usd_amount=50

@test "public: can query globals" {
  exec_graphql 'anon' 'globals'
  network="$(graphql_output '.data.globals.network')"
  [[ "${network}" = "regtest" ]] || exit 1
}

@test "public: can subscribe to price" {
  subscribe_to 'anon' price-sub
  retry 10 1 grep 'Data.*\bprice\b' .e2e-subscriber.log
  stop_subscriber
}

@test "public: can subscribe to realtime price" {
  subscribe_to 'anon' real-time-price-sub '{"currency": "EUR"}'
  retry 10 1 grep 'Data.*\brealtimePrice\b.*EUR' .e2e-subscriber.log
  stop_subscriber
}

@test "public: can create btc invoice" {
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

@test "public: can create usd invoice" {
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

@test "public: can create btc amountless invoice" {
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

@test "public: can create usd amountless invoice" {
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
