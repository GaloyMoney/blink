#!/usr/bin/env bats

load "helpers"

setup_file() {
  bitcoind_init
  start_trigger
  start_server
  start_exporter
}

teardown_file() {
  stop_trigger
  stop_server
  stop_exporter
}

teardown() {
  [[ "$(balance_for_check)" = 0 ]] || exit 1
}

@test "onchain payments: setup user" {
  variables=$(
    jq -n \
    --arg phone "$ALICE_PHONE" \
    --arg code "$ALICE_CODE" \
    '{input: {phone: $phone, code: $code}}'
  )
  exec_graphql 'anon' 'user-login' "$variables"
  auth_token="$(graphql_output '.data.userLogin.authToken')"
  [[ "${auth_token}" != "null" ]] || exit 1
  cache_value 'alice' "$auth_token"

  exec_graphql 'alice' 'btc-wallet-id'
  alice_btc_wallet_id="$(graphql_output '.data.me.defaultAccount.wallets[] | select(.walletCurrency == "BTC") .id')"
  [[ "${alice_btc_wallet_id}" != "null" ]] || exit 1
  cache_value 'alice_btc_wallet_id' "$alice_btc_wallet_id"

  retry 10 1 balance_for_check
}

@test "onchain payments: receive" {
  variables=$(
    jq -n \
    --arg wallet_id "$(read_value 'alice_btc_wallet_id')" \
    '{input: {walletId: $wallet_id}}'
  )
  exec_graphql 'alice' 'on-chain-address-create' "$variables"
  address="$(graphql_output '.data.onChainAddressCreate.address')"
  [[ "${address}" != "null" ]] || exit 1

  bitcoin_cli sendtoaddress "$address" 0.01
  bitcoin_cli -generate 2
  retry 15 1 check_for_settled "alice" "$address"
}

@test "onchain payments: send" {
  outside_address=$(bitcoin_cli getnewaddress)
  [[ "${outside_address}" != "null" ]] || exit 1

  variables=$(
    jq -n \
    --arg wallet_id "$(read_value 'alice_btc_wallet_id')" \
    --arg address "$outside_address" \
    --arg amount 12345 \
    '{input: {walletId: $wallet_id, address: $address, amount: $amount}}'
  )
  exec_graphql 'alice' 'on-chain-payment-send' "$variables"
  send_status="$(graphql_output '.data.onChainPaymentSend.status')"
  [[ "${send_status}" = "SUCCESS" ]] || exit 1
  retry 15 1 check_for_broadcast "alice" "$outside_address"

  bitcoin_cli -generate 2
  retry 15 1 check_for_settled "alice" "$outside_address"
}
