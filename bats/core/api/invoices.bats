#!/usr/bin/env bats

load "../../helpers/_common.bash"
load "../../helpers/user.bash"

setup_file() {
  clear_cache

  create_user 'alice'
  seed_invoices
}

seed_invoices() {
  token_name='alice'

  # Generate btc invoice
  btc_wallet_name="$token_name.btc_wallet_id"
  btc_amount="1000"

  variables=$(
    jq -n \
    --arg wallet_id "$(read_value $btc_wallet_name)" \
    --arg amount "$btc_amount" \
    '{input: {walletId: $wallet_id, amount: $amount}}'
  )
  exec_graphql "$token_name" 'ln-invoice-create' "$variables"

  external_id="seed-$RANDOM"
  variables=$(
    jq -n \
    --arg wallet_id "$(read_value $btc_wallet_name)" \
    --arg amount "$btc_amount" \
    --arg external_id "$external_id" \
    '{input: {walletId: $wallet_id, amount: $amount, externalId: $external_id}}'
  )
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

@test "invoices: add multiple invoices with no external id" {
  token_name='alice'
  btc_wallet_name="$token_name.btc_wallet_id"
  btc_amount="1000"

  variables=$(
    jq -n \
    --arg wallet_id "$(read_value $btc_wallet_name)" \
    --arg amount "$btc_amount" \
    '{input: {walletId: $wallet_id, amount: $amount}}'
  )

  exec_graphql "$token_name" 'ln-invoice-create' "$variables"
  num_errors="$(graphql_output '.data.lnInvoiceCreate.errors | length')"
  [[ "$num_errors" == "0" ]] || exit 1

  exec_graphql "$token_name" 'ln-invoice-create' "$variables"
  num_errors="$(graphql_output '.data.lnInvoiceCreate.errors | length')"
  [[ "$num_errors" == "0" ]] || exit 1
}

@test "invoices: adding multiple invoices with same external id fails" {
  token_name='alice'
  btc_wallet_name="$token_name.btc_wallet_id"
  btc_amount="1000"
  external_id="external-id-$RANDOM"

  variables=$(
    jq -n \
    --arg wallet_id "$(read_value $btc_wallet_name)" \
    --arg amount "$btc_amount" \
    --arg external_id "$external_id" \
    '{input: {walletId: $wallet_id, amount: $amount, externalId: $external_id}}'
  )

  exec_graphql "$token_name" 'ln-invoice-create' "$variables"
  num_errors="$(graphql_output '.data.lnInvoiceCreate.errors | length')"
  [[ "$num_errors" == "0" ]] || exit 1

  exec_graphql "$token_name" 'ln-invoice-create' "$variables"
  invoice="$(graphql_output '.data.lnInvoiceCreate.invoice')"
  [[ "$invoice" == "null" ]] || exit 1
  error_msg="$(graphql_output '.data.lnInvoiceCreate.errors[0].message')"
  [[ "${error_msg}" =~ "already exists" ]] || exit 1
}

@test "invoices: get invoices for account" {
  token_name='alice'

  exec_graphql "$token_name" 'invoices' '{"first": 3}'

  invoice_count="$(graphql_output '.data.me.defaultAccount.invoices.edges | length')"
  [[ "$invoice_count" -eq "3" ]] || exit 1
}

@test "invoices: get invoices for wallet" {
  token_name='alice'
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

@test "invoices: get invoices for wallet by external id" {
  token_name='alice'
  btc_wallet_name="$token_name.btc_wallet_id"
  external_id="seed"

  variables=$(
    jq -n \
    --arg wallet_id "$(read_value $btc_wallet_name)" \
    --arg external_id "$external_id" \
    '{walletId: $wallet_id, externalId: $external_id}'
  )
  exec_graphql "$token_name" 'invoices-by-external-id' "$variables"

  invoice_count="$(graphql_output '.data.me.defaultAccount.walletById.invoicesByExternalId.edges | length')"
  [[ "$invoice_count" -eq "1" ]] || exit 1
}
