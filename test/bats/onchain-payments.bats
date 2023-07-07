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

  exec_graphql 'alice' 'wallet-ids-for-account'

  alice_btc_wallet_id="$(graphql_output '.data.me.defaultAccount.wallets[] | select(.walletCurrency == "BTC") .id')"
  [[ "${alice_btc_wallet_id}" != "null" ]] || exit 1
  cache_value 'alice_btc_wallet_id' "$alice_btc_wallet_id"

  alice_usd_wallet_id="$(graphql_output '.data.me.defaultAccount.wallets[] | select(.walletCurrency == "USD") .id')"
  [[ "${alice_usd_wallet_id}" != "null" ]] || exit 1
  cache_value 'alice_usd_wallet_id' "$alice_usd_wallet_id"

  retry 10 1 balance_for_check
}

@test "onchain payments: receive" {
  # Fund BTC wallet
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

  # Fund USD wallet from BTC wallet
  variables=$(
    jq -n \
    --arg wallet_id "$(read_value 'alice_btc_wallet_id')" \
    --arg recipient_wallet_id "$(read_value 'alice_usd_wallet_id')" \
    --arg amount "50000" \
    '{input: {walletId: $wallet_id, recipientWalletId: $recipient_wallet_id, amount: $amount}}'
  )
  exec_graphql 'alice' 'intraledger-payment-send' "$variables"
  send_status="$(graphql_output '.data.intraLedgerPaymentSend.status')"
  [[ "${send_status}" = "SUCCESS" ]] || exit 1
}

@test "onchain payments: settle trade intraccount" {
  # Fund BTC wallet
  variables=$(
    jq -n \
    --arg wallet_id "$(read_value 'alice_btc_wallet_id')" \
    '{input: {walletId: $wallet_id}}'
  )
  exec_graphql 'alice' 'on-chain-address-create' "$variables"
  btc_wallet_address="$(graphql_output '.data.onChainAddressCreate.address')"
  [[ "${btc_wallet_address}" != "null" ]] || exit 1

  # Send payment from BTC to USD wallet
  variables=$(
    jq -n \
    --arg wallet_id "$(read_value 'alice_usd_wallet_id')" \
    --arg address "$btc_wallet_address" \
    --arg amount 100 \
    '{input: {walletId: $wallet_id, address: $address, amount: $amount}}'
  )
  exec_graphql 'alice' 'on-chain-usd-payment-send' "$variables"
  send_status="$(graphql_output '.data.onChainUsdPaymentSend.status')"
  [[ "${send_status}" = "SUCCESS" ]] || exit 1

  # Check transaction
  exec_graphql 'alice' 'transactions' '{"first": 1}'
  settled_status="$(get_from_transaction_by_address $btc_wallet_address '.status')"
  [[ "${settled_status}" = "SUCCESS" ]] || exit 1
}

@test "onchain payments: settle onchain" {
  # EXECUTE GQL SENDS
  # ----------

  # mutation: onChainPaymentSend
  outside_address_1=$(bitcoin_cli getnewaddress)
  [[ "${outside_address_1}" != "null" ]] || exit 1

  variables=$(
    jq -n \
    --arg wallet_id "$(read_value 'alice_btc_wallet_id')" \
    --arg address "$outside_address_1" \
    --arg amount 12345 \
    '{input: {walletId: $wallet_id, address: $address, amount: $amount}}'
  )
  exec_graphql 'alice' 'on-chain-payment-send' "$variables"
  send_status="$(graphql_output '.data.onChainPaymentSend.status')"
  [[ "${send_status}" = "SUCCESS" ]] || exit 1

  # mutation: onChainUsdPaymentSend
  outside_address_2=$(bitcoin_cli getnewaddress)
  [[ "${outside_address_2}" != "null" ]] || exit 1

  variables=$(
    jq -n \
    --arg wallet_id "$(read_value 'alice_usd_wallet_id')" \
    --arg address "$outside_address_2" \
    --arg amount 200 \
    '{input: {walletId: $wallet_id, address: $address, amount: $amount}}'
  )
  exec_graphql 'alice' 'on-chain-usd-payment-send' "$variables"
  send_status="$(graphql_output '.data.onChainUsdPaymentSend.status')"
  [[ "${send_status}" = "SUCCESS" ]] || exit 1

  # mutation: onChainUsdPaymentSendAsBtcDenominated
  outside_address_3=$(bitcoin_cli getnewaddress)
  [[ "${outside_address_3}" != "null" ]] || exit 1

  variables=$(
    jq -n \
    --arg wallet_id "$(read_value 'alice_usd_wallet_id')" \
    --arg address "$outside_address_3" \
    --arg amount 12345 \
    '{input: {walletId: $wallet_id, address: $address, amount: $amount}}'
  )
  exec_graphql 'alice' 'on-chain-usd-payment-send-as-btc-denominated' "$variables"
  send_status="$(graphql_output '.data.onChainUsdPaymentSendAsBtcDenominated.status')"
  [[ "${send_status}" = "SUCCESS" ]] || exit 1

  # mutation: onChainPaymentSendAll
  outside_address_4=$(bitcoin_cli getnewaddress)
  [[ "${outside_address_4}" != "null" ]] || exit 1

  variables=$(
    jq -n \
    --arg wallet_id "$(read_value 'alice_usd_wallet_id')" \
    --arg address "$outside_address_4" \
    '{input: {walletId: $wallet_id, address: $address}}'
  )
  exec_graphql 'alice' 'on-chain-payment-send-all' "$variables"
  send_status="$(graphql_output '.data.onChainPaymentSendAll.status')"
  [[ "${send_status}" = "SUCCESS" ]] || exit 1

  # CHECK FOR TRANSACTIONS IN DATABASE
  # ----------

  # Check for broadcast of last send
  retry 15 1 check_for_broadcast "alice" "$outside_address_4" 4
  retry 3 1 check_for_broadcast "alice" "$outside_address_3" 4
  retry 3 1 check_for_broadcast "alice" "$outside_address_2" 4
  retry 3 1 check_for_broadcast "alice" "$outside_address_1" 4

  # Mine all
  bitcoin_cli -generate 2

  # Check for settled
  retry 15 1 check_for_settled "alice" "$outside_address_4" 4
  retry 3 1 check_for_settled "alice" "$outside_address_3" 4
  retry 3 1 check_for_settled "alice" "$outside_address_2" 4
  retry 3 1 check_for_settled "alice" "$outside_address_1" 4
}
