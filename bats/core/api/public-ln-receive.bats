#!/usr/bin/env bats

load "../../helpers/_common.bash"
load "../../helpers/cli.bash"
load "../../helpers/ledger.bash"
load "../../helpers/ln.bash"
load "../../helpers/subscriber.bash"
load "../../helpers/user.bash"

ALICE='alice'

setup_file() {
  clear_cache

  create_user "$ALICE"
  user_update_username "$ALICE"
}

teardown() {
  if [[ "$(balance_for_check)" != 0 ]]; then
    fail "Error: balance_for_check failed"
  fi
}

btc_amount=1000
usd_amount=50

@test "public-ln-receive: account details - can fetch with btc default wallet-id from username" {
  token_name=$ALICE
  btc_wallet_name="$token_name.btc_wallet_id"
  usd_wallet_name="$token_name.usd_wallet_id"
  local username="$(read_value $token_name.username)"

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
    --arg username "$username" \
    '{username: $username}'
  )
  exec_graphql 'anon' 'account-default-wallet' "$variables"
  receiver_wallet_id="$(graphql_output '.data.accountDefaultWallet.id')"
  [[ "$receiver_wallet_id" == "$(read_value $btc_wallet_name)" ]] || exit 1

  # Fetch usd-wallet-id from username
  variables=$(
    jq -n \
    --arg username "$username" \
    '{username: $username, walletCurrency: "USD"}'
  )
  exec_graphql 'anon' 'account-default-wallet' "$variables"
  receiver_wallet_id="$(graphql_output '.data.accountDefaultWallet.id')"
  [[ "$receiver_wallet_id" == "$(read_value $usd_wallet_name)" ]] || exit 1
}

@test "public-ln-receive: account details - can fetch with usd default wallet-id from username" {
  token_name=$ALICE
  btc_wallet_name="$token_name.btc_wallet_id"
  usd_wallet_name="$token_name.usd_wallet_id"
  local username="$(read_value $token_name.username)"

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
    --arg username "$username" \
    '{username: $username}'
  )
  exec_graphql 'anon' 'account-default-wallet' "$variables"
  receiver_wallet_id="$(graphql_output '.data.accountDefaultWallet.id')"
  [[ "$receiver_wallet_id" == "$(read_value $usd_wallet_name)" ]] || exit 1

  # Fetch btc-wallet-id from username
  variables=$(
    jq -n \
    --arg username "$username" \
    '{username: $username, walletCurrency: "BTC"}'
  )
  exec_graphql 'anon' 'account-default-wallet' "$variables"
  receiver_wallet_id="$(graphql_output '.data.accountDefaultWallet.id')"
  [[ "$receiver_wallet_id" == "$(read_value $btc_wallet_name)" ]] || exit 1
}

@test "public-ln-receive: account details - return error for invalid username" {
  exec_graphql 'anon' 'account-default-wallet' '{"username": "incorrectly-formatted"}'
  error_msg="$(graphql_output '.errors[0].message')"
  [[ "$error_msg" == "Invalid value for Username" ]] || exit 1

  exec_graphql 'anon' 'account-default-wallet' '{"username": "idontexist"}'
  error_msg="$(graphql_output '.errors[0].message')"
  [[ "$error_msg" == "Account does not exist for username idontexist" ]] || exit 1
}

@test "public-ln-receive: receive via invoice - can receive on btc invoice, with subscription" {
  token_name="$ALICE"
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
  '{input: {paymentRequest: $payment_request}}'
  )
  subscribe_to 'anon' 'ln-invoice-payment-status-sub' "$variables"
  sleep 3
  retry 10 1 grep "Data.*lnInvoicePaymentStatus.*PENDING" "$SUBSCRIBER_LOG_FILE"

  # Receive payment
  lnd_outside_cli payinvoice -f \
    --pay_req "$payment_request" \

  # Check for settled with subscription
  retry 10 1 grep "Data.*lnInvoicePaymentStatus.*PAID" "$SUBSCRIBER_LOG_FILE"
  stop_subscriber
}

@test "public-ln-receive: receive via invoice - can receive on usd invoice" {
  token_name="$ALICE"
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

  # Check for settled with query
  retry 15 1 check_ln_payment_settled "$payment_request"
}
