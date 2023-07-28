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
  initialize_user_from_onchain "$ALICE_TOKEN_NAME" "$ALICE_PHONE" "$CODE"

  variables=$(
    jq -n \
    --arg username "$ALICE_TOKEN_NAME" \
    '{input: {username: $username}}'
  )
  exec_graphql "$ALICE_TOKEN_NAME" 'user-update-username' "$variables"
  username="$(graphql_output '.data.userUpdateUsername.user.username')"
  [[ "$ALICE_TOKEN_NAME" == "$username" ]]
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

teardown() {
  [[ "$(balance_for_check)" == 0 ]] || exit 1
}

btc_amount=1000
usd_amount=50

@test "public-ln-receive: can fetch with btc default wallet-id from username" {
  token_name=$ALICE_TOKEN_NAME
  btc_wallet_name="$token_name.btc_wallet_id"
  usd_wallet_name="$token_name.usd_wallet_id"

  # Change default wallet to btc
  variables=$(
    jq -n \
    --arg wallet_id "$(read_value $btc_wallet_name)" \
    '{input: {walletId: $wallet_id}}'
  )
  exec_graphql "$token_name" 'account-update-default-wallet-id' "$variables"
  updated_wallet_id="$(graphql_output '.data.accountUpdateDefaultWalletId.account.defaultWalletId')"
  [[ "$updated_wallet_id" == "$(read_value $btc_wallet_name)" ]] || exit 1

  # Fetch btc-wallet-id from username
  variables=$(
    jq -n \
    --arg username "$token_name" \
    '{username: $username}'
  )
  exec_graphql 'anon' 'account-default-wallet' "$variables"
  receiver_wallet_id="$(graphql_output '.data.accountDefaultWallet.id')"
  [[ "$receiver_wallet_id" == "$(read_value $btc_wallet_name)" ]] || exit 1

  # Fetch usd-wallet-id from username
  variables=$(
    jq -n \
    --arg username "$token_name" \
    '{username: $username, walletCurrency: "USD"}'
  )
  exec_graphql 'anon' 'account-default-wallet' "$variables"
  receiver_wallet_id="$(graphql_output '.data.accountDefaultWallet.id')"
  [[ "$receiver_wallet_id" == "$(read_value $usd_wallet_name)" ]] || exit 1
}

@test "public-ln-receive: can fetch with usd default wallet-id from username" {
  token_name=$ALICE_TOKEN_NAME
  btc_wallet_name="$token_name.btc_wallet_id"
  usd_wallet_name="$token_name.usd_wallet_id"

  # Change default wallet to usd
  variables=$(
    jq -n \
    --arg wallet_id "$(read_value $usd_wallet_name)" \
    '{input: {walletId: $wallet_id}}'
  )
  exec_graphql "$token_name" 'account-update-default-wallet-id' "$variables"
  updated_wallet_id="$(graphql_output '.data.accountUpdateDefaultWalletId.account.defaultWalletId')"
  [[ "$updated_wallet_id" == "$(read_value $usd_wallet_name)" ]] || exit 1

  # Fetch usd-wallet-id from username
  variables=$(
    jq -n \
    --arg username "$token_name" \
    '{username: $username}'
  )
  exec_graphql 'anon' 'account-default-wallet' "$variables"
  receiver_wallet_id="$(graphql_output '.data.accountDefaultWallet.id')"
  [[ "$receiver_wallet_id" == "$(read_value $usd_wallet_name)" ]] || exit 1

  # Fetch btc-wallet-id from username
  variables=$(
    jq -n \
    --arg username "$token_name" \
    '{username: $username, walletCurrency: "BTC"}'
  )
  exec_graphql 'anon' 'account-default-wallet' "$variables"
  receiver_wallet_id="$(graphql_output '.data.accountDefaultWallet.id')"
  [[ "$receiver_wallet_id" == "$(read_value $btc_wallet_name)" ]] || exit 1
}

@test "public-ln-receive: can receive on btc invoice, with subscription" {
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

  # Setup subscription
  variables=$(
  jq -n \
  --arg payment_request "$payment_request" \
  '{"input": {"paymentRequest": $payment_request}}'
  )
  subscribe_to 'anon' 'ln-invoice-payment-status-sub' "$variables"
  sleep 3
  retry 10 1 grep "Data.*lnInvoicePaymentStatus.*PENDING" .e2e-subscriber.log

  # Receive payment
  lnd_outside_cli payinvoice -f \
    --pay_req "$payment_request" \

  # Check for settled
  retry 15 1 check_ln_payment_settled "$payment_request"

  retry 10 1 grep "Data.*lnInvoicePaymentStatus.*PAID" .e2e-subscriber.log
  stop_subscriber
}

@test "public-ln-receive: can receive on usd invoice" {
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

  # Receive payment
  lnd_outside_cli payinvoice -f \
    --pay_req "$payment_request" \

  # Check for settled
  retry 15 1 check_ln_payment_settled "$payment_request"
}

@test "public-ln-receive: can receive on btc amountless invoice" {
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

  # Receive payment
  lnd_outside_cli payinvoice -f \
    --pay_req "$payment_request" \
    --amt "$btc_amount"

  # Check for settled
  retry 15 1 check_ln_payment_settled "$payment_request"
}

@test "public-ln-receive: can receive on usd amountless invoice" {
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

  # Receive payment
  lnd_outside_cli payinvoice -f \
    --pay_req "$payment_request" \
    --amt "$btc_amount"

  # Check for settled
  retry 15 1 check_ln_payment_settled "$payment_request"
}
