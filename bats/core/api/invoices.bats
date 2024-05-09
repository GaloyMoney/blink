#!/usr/bin/env bats

load "../../helpers/_common.bash"
load "../../helpers/user.bash"

setup_file() {
  clear_cache

  create_user 'alice'
  create_user 'bob'
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

@test "invoices: adding multiple invoices with same external id fails for same account" {
  external_id="external-id-$RANDOM"

  alice_btc_wallet_name="alice.btc_wallet_id"
  alice_usd_wallet_name="alice.usd_wallet_id"
  bob_btc_wallet_name="bob.btc_wallet_id"
  bob_usd_wallet_name="bob.usd_wallet_id"

  btc_amount="1000"
  usd_amount="20"

  variables=$(
    jq -n \
    --arg wallet_id "$(read_value $alice_btc_wallet_name)" \
    --arg amount "$btc_amount" \
    --arg external_id "$external_id" \
    '{input: {walletId: $wallet_id, amount: $amount, externalId: $external_id}}'
  )

  exec_graphql 'alice' 'ln-invoice-create' "$variables"
  num_errors="$(graphql_output '.data.lnInvoiceCreate.errors | length')"
  [[ "$num_errors" == "0" ]] || exit 1

  # Check 'alice' can't re-use externalId for same wallet
  exec_graphql 'alice' 'ln-invoice-create' "$variables"
  invoice="$(graphql_output '.data.lnInvoiceCreate.invoice')"
  [[ "$invoice" == "null" ]] || exit 1
  error_msg="$(graphql_output '.data.lnInvoiceCreate.errors[0].message')"
  [[ "${error_msg}" =~ "already exists" ]] || exit 1

  # Check 'alice' can't re-use externalId for different wallet
  variables=$(
    jq -n \
    --arg wallet_id "$(read_value $alice_usd_wallet_name)" \
    --arg amount "$usd_amount" \
    --arg external_id "$external_id" \
    '{input: {walletId: $wallet_id, amount: $amount, externalId: $external_id}}'
  )
  exec_graphql 'alice' 'ln-usd-invoice-create' "$variables"
  invoice="$(graphql_output '.data.lnUsdInvoiceCreate.invoice')"
  [[ "$invoice" == "null" ]] || exit 1
  error_msg="$(graphql_output '.data.lnUsdInvoiceCreate.errors[0].message')"
  [[ "${error_msg}" =~ "already exists" ]] || exit 1

  # Check 'bob' can re-use externalId once
  variables=$(
    jq -n \
    --arg wallet_id "$(read_value $bob_btc_wallet_name)" \
    --arg amount "$btc_amount" \
    --arg external_id "$external_id" \
    '{input: {walletId: $wallet_id, amount: $amount, externalId: $external_id}}'
  )
  exec_graphql 'bob' 'ln-invoice-create' "$variables"
  num_errors="$(graphql_output '.data.lnInvoiceCreate.errors | length')"
  [[ "$num_errors" == "0" ]] || exit 1

  # Check 'bob' cant re-use externalId again
  variables=$(
    jq -n \
    --arg wallet_id "$(read_value $bob_usd_wallet_name)" \
    --arg amount "$usd_amount" \
    --arg external_id "$external_id" \
    '{input: {walletId: $wallet_id, amount: $amount, externalId: $external_id}}'
  )
  exec_graphql 'bob' 'ln-usd-invoice-create' "$variables"
  invoice="$(graphql_output '.data.lnUsdInvoiceCreate.invoice')"
  [[ "$invoice" == "null" ]] || exit 1
  error_msg="$(graphql_output '.data.lnUsdInvoiceCreate.errors[0].message')"
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
