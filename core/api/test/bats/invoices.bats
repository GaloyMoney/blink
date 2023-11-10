#!/usr/bin/env bats

load "helpers/setup-and-teardown"
load "helpers/ln"

setup_file() {
  clear_cache

  bitcoind_init
  start_trigger
  start_server
  start_ws_server
  start_exporter

  lnds_init
  login_user "$ALICE_TOKEN_NAME" "$ALICE_PHONE" "$CODE"

  token_name="$ALICE_TOKEN_NAME"
  btc_wallet_name="$token_name.btc_wallet_id"
  btc_amount="1000"

  # Generate btc invoice
  variables=$(
    jq -n \
    --arg wallet_id "$(read_value $btc_wallet_name)" \
    --arg amount "$btc_amount" \
    '{input: {walletId: $wallet_id, amount: $amount}}'
  )
  exec_graphql "$token_name" 'ln-invoice-create' "$variables"
  exec_graphql "$token_name" 'ln-invoice-create' "$variables"

  # Generate usd invoice
  usd_wallet_name="$token_name.usd_wallet_id"
  usd_amount="100"

  variables=$(
      jq -n \
      --arg wallet_id "$(read_value $usd_wallet_name)" \
      --arg amount "$usd_amount" \
      '{input: {walletId: $wallet_id, amount: $amount}}'
  )
  exec_graphql "$token_name" 'ln-usd-invoice-create' "$variables"
}

teardown_file() {
  stop_trigger
  stop_server
  stop_ws_server
  stop_exporter
}

setup() {
  reset_redis
}

@test "invoices: get invoices for account" {
  token_name="$ALICE_TOKEN_NAME"

  exec_graphql "$token_name" 'invoices' '{"first": 3}'

  invoice_count="$(graphql_output '.data.me.defaultAccount.invoices.edges | length')"
  [[ "$invoice_count" -eq "3" ]] || exit 1
}

@test "invoices: get invoices for wallet" {
  token_name="$ALICE_TOKEN_NAME"
  btc_wallet_name="$token_name.btc_wallet_id"

  variables=$(
    jq -n \
    --arg wallet_id "$(read_value $btc_wallet_name)" \
    '{walletId: $wallet_id, first: 2}'
  )
  exec_graphql "$token_name" 'invoices-by-wallet' "$variables"

  invoice_count="$(graphql_output '.data.me.defaultAccount.walletById.invoices.edges | length')"
  [[ "$invoice_count" -eq "2" ]] || exit 1
}

@test "invoices: create invoices from alternate node" {
  lnd1_pubkey=$(lnd_cli getinfo | jq -r '.identity_pubkey')
  lnd2_pubkey=$(lnd2_cli getinfo | jq -r '.identity_pubkey')
  btc_amount=1000

  token_name="$ALICE_TOKEN_NAME"
  btc_wallet_name="$token_name.btc_wallet_id"

  # Generate invoice, it should be from lnd1
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

  destination_node="$(lnd_cli decodepayreq $payment_request | jq -r '.destination')"
  [[ "${destination_node}" == "${lnd1_pubkey}" ]] || exit 1

  # Generate invoice after lnd1 stop, it should be from lnd2
  lnd_stop
  exec_graphql "$token_name" 'ln-invoice-create' "$variables"
  invoice="$(graphql_output '.data.lnInvoiceCreate.invoice')"
  lnd_start

  payment_request="$(echo $invoice | jq -r '.paymentRequest')"
  [[ "${payment_request}" != "null" ]] || exit 1
  payment_hash="$(echo $invoice | jq -r '.paymentHash')"
  [[ "${payment_hash}" != "null" ]] || exit 1

  destination_node="$(lnd2_cli decodepayreq $payment_request | jq -r '.destination')"
  [[ "${destination_node}" == "${lnd2_pubkey}" ]] || exit 1
}
