#!/usr/bin/env bats

load "helpers/setup-and-teardown"

setup_file() {
  clear_cache
  reset_redis

  bitcoind_init
  start_trigger
  start_exporter
  start_server

  initialize_user_from_onchain "$ALICE_TOKEN_NAME" "$ALICE_PHONE" "$CODE"
  user_update_username "$ALICE_TOKEN_NAME"
  login_user "$BOB_TOKEN_NAME" "$BOB_PHONE" "$CODE"
}

teardown_file() {
  stop_trigger
  stop_server
  stop_exporter
}

teardown() {
  if [[ "$(balance_for_check)" != 0 ]]; then
    fail "Error: balance_for_check failed"
  fi
}

@test "intraledger-send: settle intraledger, from BTC wallet, with contacts check" {
  local from_token_name="$ALICE_TOKEN_NAME"
  local from_wallet_name="$from_token_name.btc_wallet_id"

  local to_token_name="user_$RANDOM"
  to_phone="$(random_phone)"
  login_user \
    "$to_token_name" \
    "$to_phone"  \
    "$CODE"
  user_update_username "$to_token_name"
  local wallet_name_btc="$to_token_name.btc_wallet_id"
  local wallet_name_usd="$to_token_name.usd_wallet_id"
  local amount=1000

  # Check is not contact before send
  run is_contact "$from_token_name" "$to_token_name"
  [[ "$status" -ne "0" ]] || exit 1
  run is_contact "$to_token_name" "$from_token_name"
  [[ "$status" -ne "0" ]] || exit 1

  # To btc wallet
  variables=$(
    jq -n \
    --arg wallet_id "$(read_value $from_wallet_name)" \
    --arg recipient_wallet_id "$(read_value $wallet_name_btc)" \
    --arg amount "$amount" \
    '{input: {walletId: $wallet_id, recipientWalletId: $recipient_wallet_id, amount: $amount}}'
  )
  exec_graphql "$from_token_name" 'intraledger-payment-send' "$variables"
  send_status="$(graphql_output '.data.intraLedgerPaymentSend.status')"
  [[ "${send_status}" = "SUCCESS" ]]

  # To usd wallet
  variables=$(
    jq -n \
    --arg wallet_id "$(read_value $from_wallet_name)" \
    --arg recipient_wallet_id "$(read_value $wallet_name_usd)" \
    --arg amount "$amount" \
    '{input: {walletId: $wallet_id, recipientWalletId: $recipient_wallet_id, amount: $amount}}'
  )
  exec_graphql "$from_token_name" 'intraledger-payment-send' "$variables"
  send_status="$(graphql_output '.data.intraLedgerPaymentSend.status')"
  [[ "${send_status}" = "SUCCESS" ]]

  # Check is contact after sends
  run is_contact "$from_token_name" "$to_token_name"
  [[ "$status" == "0" ]] || exit 1
  run is_contact "$to_token_name" "$from_token_name"
  [[ "$status" == "0" ]] || exit 1

}

@test "intraledger-send: settle intraledger, from USD wallet" {
  local from_token_name="$ALICE_TOKEN_NAME"
  local from_wallet_name="$from_token_name.usd_wallet_id"

  local to_token_name="$BOB_TOKEN_NAME"
  local wallet_name_btc="$to_token_name.btc_wallet_id"
  local wallet_name_usd="$to_token_name.usd_wallet_id"
  local amount=20

  # To btc wallet
  variables=$(
    jq -n \
    --arg wallet_id "$(read_value $from_wallet_name)" \
    --arg recipient_wallet_id "$(read_value $wallet_name_btc)" \
    --arg amount "$amount" \
    '{input: {walletId: $wallet_id, recipientWalletId: $recipient_wallet_id, amount: $amount}}'
  )
  exec_graphql "$from_token_name" 'intraledger-usd-payment-send' "$variables"
  send_status="$(graphql_output '.data.intraLedgerUsdPaymentSend.status')"
  [[ "${send_status}" = "SUCCESS" ]]

  # To usd wallet
  variables=$(
    jq -n \
    --arg wallet_id "$(read_value $from_wallet_name)" \
    --arg recipient_wallet_id "$(read_value $wallet_name_usd)" \
    --arg amount "$amount" \
    '{input: {walletId: $wallet_id, recipientWalletId: $recipient_wallet_id, amount: $amount}}'
  )
  exec_graphql "$from_token_name" 'intraledger-usd-payment-send' "$variables"
  send_status="$(graphql_output '.data.intraLedgerUsdPaymentSend.status')"
  [[ "${send_status}" = "SUCCESS" ]]
}

@test "intraledger-send: settle trade intra-account, from BTC wallet" {
  local from_token_name="$ALICE_TOKEN_NAME"
  local from_wallet_name="$from_token_name.btc_wallet_id"
  local to_token_name="$from_token_name"
  local to_wallet_name="$to_token_name.usd_wallet_id"

  local amount=1000

  variables=$(
    jq -n \
    --arg wallet_id "$(read_value $from_wallet_name)" \
    --arg recipient_wallet_id "$(read_value $to_wallet_name)" \
    --arg amount "$amount" \
    '{input: {walletId: $wallet_id, recipientWalletId: $recipient_wallet_id, amount: $amount}}'
  )
  exec_graphql "$from_token_name" 'intraledger-payment-send' "$variables"
  send_status="$(graphql_output '.data.intraLedgerPaymentSend.status')"
  [[ "${send_status}" = "SUCCESS" ]]
}

@test "intraledger-send: settle trade intra-account, from USD wallet" {
  local from_token_name="$ALICE_TOKEN_NAME"
  local from_wallet_name="$from_token_name.usd_wallet_id"
  local to_token_name="$from_token_name"
  local to_wallet_name="$to_token_name.btc_wallet_id"

  local amount=20

  variables=$(
    jq -n \
    --arg wallet_id "$(read_value $from_wallet_name)" \
    --arg recipient_wallet_id "$(read_value $to_wallet_name)" \
    --arg amount "$amount" \
    '{input: {walletId: $wallet_id, recipientWalletId: $recipient_wallet_id, amount: $amount}}'
  )
  exec_graphql "$from_token_name" 'intraledger-usd-payment-send' "$variables"
  send_status="$(graphql_output '.data.intraLedgerUsdPaymentSend.status')"
  [[ "${send_status}" = "SUCCESS" ]]
}
