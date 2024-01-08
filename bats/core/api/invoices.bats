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
