#!/usr/bin/env bats

load "../../helpers/_common.bash"
load "../../helpers/cli.bash"
load "../../helpers/ledger.bash"
load "../../helpers/onchain.bash"
load "../../helpers/user.bash"

ALICE='alice'
BOB='bob'

setup_file() {
  clear_cache

  create_user "$ALICE"
  user_update_username "$ALICE"
  fund_user_onchain "$ALICE" 'btc_wallet'
  fund_user_onchain "$ALICE" 'usd_wallet'

  create_user "$BOB"
}

teardown() {
  balance="$(balance_for_check)"
  if [[ "$balance" != 0 ]]; then
    fail "Error: balance_for_check failed ($balance)"
  fi
}

@test "intraledger-send: settle intraledger, from BTC wallet, with contacts check" {
  local from_token_name="$ALICE"
  local from_wallet_name="$from_token_name.btc_wallet_id"

  local to_token_name="user"
  create_user "$to_token_name"
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
  local from_token_name="$ALICE"
  local from_wallet_name="$from_token_name.usd_wallet_id"

  local to_token_name="$BOB"
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
  local from_token_name="$ALICE"
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
  local from_token_name="$ALICE"
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

@test "intraledger-send: (usd) wallet can send and recover sats to unregistered phone user" {
  local from_token_name="$ALICE"
  local from_wallet_name="$from_token_name.btc_wallet_id"

  local phone="$(random_phone)"
  local amount=$(( RANDOM % 1000 + 1 ))  # (1–1000) sats

  # Send sats to the phone number (auto-create account)
  variables=$(
    jq -n \
    --arg wallet_id "$(read_value $from_wallet_name)" \
    --arg recipient_wallet_id "$phone" \
    --arg amount "$amount" \
    '{input: {walletId: $wallet_id, recipientWalletId: $recipient_wallet_id, amount: $amount}}'
  )
  exec_graphql "$from_token_name" 'intraledger-payment-send' "$variables"
  send_status="$(graphql_output '.data.intraLedgerPaymentSend.status')"
  [[ "$send_status" == "SUCCESS" ]] || exit 1

  # Login to the new account to verify BTC balance
  login_user 'recipient' "$phone"

  exec_graphql 'recipient' 'wallets-for-account'
  btc_balance=$(graphql_output '.data.me.defaultAccount.wallets[] | select(.walletCurrency == "BTC") .balance')
  [[ "$btc_balance" == "$amount" ]] || exit 1

  # Validate that BTC funds received via phone number can be transferred
  variables=$(
    jq -n \
    --arg wallet_id "$btc_wallet_id" \
    --arg recipient_wallet_id "$(read_value $from_wallet_name)" \
    --arg amount "$amount" \
    '{input: {walletId: $wallet_id, recipientWalletId: $recipient_wallet_id, amount: $amount}}'
  )
  exec_graphql 'recipient' 'intraledger-payment-send' "$variables"
  send_back_status="$(graphql_output '.data.intraLedgerPaymentSend.status')"
  [[ "$send_back_status" == "SUCCESS" ]] || exit 1

  # Confirm balance btc is restored
  final_balance="$(balance_for_check)"
  [[ "$final_balance" == "0" ]] || fail "Balance not restored. Remaining: $final_balance"
}

@test "intraledger-send: (usd) wallet can send and recover sats to unregistered phone user" {
  local from_token_name="$ALICE"
  local from_wallet_name="$from_token_name.usd_wallet_id"

  local phone="$(random_phone)"
  local amount=$(( RANDOM % 100 + 1 ))  # (1–100) sats

  # Send sats to the phone number (auto-create account)
  variables=$(
    jq -n \
    --arg wallet_id "$(read_value $from_wallet_name)" \
    --arg recipient_wallet_id "$phone" \
    --arg amount "$amount" \
    '{input: {walletId: $wallet_id, recipientWalletId: $recipient_wallet_id, amount: $amount}}'
  )
  exec_graphql "$from_token_name" 'intraledger-usd-payment-send' "$variables"
  send_status="$(graphql_output '.data.intraLedgerUsdPaymentSend.status')"
  [[ "$send_status" == "SUCCESS" ]] || exit 1

  # Login to the new account to verify USD balance
  login_user 'recipient' "$phone"

  exec_graphql 'recipient' 'wallets-for-account'
  usd_balance=$(graphql_output '.data.me.defaultAccount.wallets[] | select(.walletCurrency == "USD") .balance')
  [[ "$usd_balance" == "$amount" ]] || exit 1

  # Validate that USD funds received via phone number can be transferred
  variables=$(
    jq -n \
    --arg wallet_id "$usd_wallet_id" \
    --arg recipient_wallet_id "$(read_value $from_wallet_name)" \
    --arg amount "$amount" \
    '{input: {walletId: $wallet_id, recipientWalletId: $recipient_wallet_id, amount: $amount}}'
  )
  exec_graphql 'recipient' 'intraledger-usd-payment-send' "$variables"
  send_back_status="$(graphql_output '.data.intraLedgerUsdPaymentSend.status')"
  [[ "$send_back_status" == "SUCCESS" ]] || exit 1

  # Confirm balance usd is restored
  final_balance="$(balance_for_check)"
  [[ "$final_balance" == "0" ]] || fail "Balance not restored. Remaining: $final_balance"
}
