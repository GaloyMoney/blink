#!/usr/bin/env bats

load "helpers"

setup_file() {
  clear_cache

  bitcoind_init
  start_trigger
  start_server
  start_exporter

  initialize_user "$ALICE_TOKEN_NAME" "$ALICE_PHONE" "$ALICE_CODE"
  initialize_user "$BOB_TOKEN_NAME" "$BOB_PHONE" "$BOB_CODE"
}

teardown_file() {
  stop_trigger
  stop_server
  stop_exporter
}

setup() {
  # Clear locks & limiters
  reset_redis
}

teardown() {
  [[ "$(balance_for_check)" = 0 ]] || exit 1
}

@test "onchain payments: settle trade intraccount" {
  # Fetch address
  variables=$(
    jq -n \
    --arg wallet_id "$(read_value 'alice.btc_wallet_id')" \
    '{input: {walletId: $wallet_id}}'
  )
  exec_graphql 'alice' 'on-chain-address-create' "$variables"
  btc_wallet_address="$(graphql_output '.data.onChainAddressCreate.address')"
  [[ "${btc_wallet_address}" != "null" ]] || exit 1

  # Send payment from BTC to USD wallet
  variables=$(
    jq -n \
    --arg wallet_id "$(read_value 'alice.usd_wallet_id')" \
    --arg address "$btc_wallet_address" \
    --arg amount 100 \
    '{input: {walletId: $wallet_id, address: $address, amount: $amount}}'
  )
  exec_graphql 'alice' 'on-chain-usd-payment-send' "$variables"
  send_status="$(graphql_output '.data.onChainUsdPaymentSend.status')"
  [[ "${send_status}" = "SUCCESS" ]] || exit 1

  # Check for settled
  exec_graphql 'alice' 'transactions' '{"first": 1}'
  settled_status="$(get_from_transaction_by_address $btc_wallet_address '.status')"
  [[ "${settled_status}" = "SUCCESS" ]] || exit 1
}

@test "onchain payments: settle onchain" {
  # EXECUTE GQL SENDS
  # ----------

  # mutation: onChainPaymentSend
  on_chain_payment_send_address=$(bitcoin_cli getnewaddress)
  [[ "${on_chain_payment_send_address}" != "null" ]] || exit 1

  variables=$(
    jq -n \
    --arg wallet_id "$(read_value 'alice.btc_wallet_id')" \
    --arg address "$on_chain_payment_send_address" \
    --arg amount 12345 \
    '{input: {walletId: $wallet_id, address: $address, amount: $amount}}'
  )
  exec_graphql 'alice' 'on-chain-payment-send' "$variables"
  send_status="$(graphql_output '.data.onChainPaymentSend.status')"
  [[ "${send_status}" = "SUCCESS" ]] || exit 1

  # mutation: onChainUsdPaymentSend
  on_chain_usd_payment_send_address=$(bitcoin_cli getnewaddress)
  [[ "${on_chain_usd_payment_send_address}" != "null" ]] || exit 1

  variables=$(
    jq -n \
    --arg wallet_id "$(read_value 'alice.usd_wallet_id')" \
    --arg address "$on_chain_usd_payment_send_address" \
    --arg amount 200 \
    '{input: {walletId: $wallet_id, address: $address, amount: $amount}}'
  )
  exec_graphql 'alice' 'on-chain-usd-payment-send' "$variables"
  send_status="$(graphql_output '.data.onChainUsdPaymentSend.status')"
  [[ "${send_status}" = "SUCCESS" ]] || exit 1

  # mutation: onChainUsdPaymentSendAsBtcDenominated
  on_chain_usd_payment_send_as_btc_denominated_address=$(bitcoin_cli getnewaddress)
  [[ "${on_chain_usd_payment_send_as_btc_denominated_address}" != "null" ]] || exit 1

  variables=$(
    jq -n \
    --arg wallet_id "$(read_value 'alice.usd_wallet_id')" \
    --arg address "$on_chain_usd_payment_send_as_btc_denominated_address" \
    --arg amount 12345 \
    '{input: {walletId: $wallet_id, address: $address, amount: $amount}}'
  )
  exec_graphql 'alice' 'on-chain-usd-payment-send-as-btc-denominated' "$variables"
  send_status="$(graphql_output '.data.onChainUsdPaymentSendAsBtcDenominated.status')"
  [[ "${send_status}" = "SUCCESS" ]] || exit 1

  # mutation: onChainPaymentSendAll
  on_chain_payment_send_all_address=$(bitcoin_cli getnewaddress)
  [[ "${on_chain_payment_send_all_address}" != "null" ]] || exit 1

  variables=$(
    jq -n \
    --arg wallet_id "$(read_value 'alice.usd_wallet_id')" \
    --arg address "$on_chain_payment_send_all_address" \
    '{input: {walletId: $wallet_id, address: $address}}'
  )
  exec_graphql 'alice' 'on-chain-payment-send-all' "$variables"
  send_status="$(graphql_output '.data.onChainPaymentSendAll.status')"
  [[ "${send_status}" = "SUCCESS" ]] || exit 1

  # CHECK FOR TRANSACTIONS IN DATABASE
  # ----------

  # Check for broadcast of last send
  retry 15 1 check_for_broadcast "alice" "$on_chain_payment_send_all_address" 4
  retry 3 1 check_for_broadcast "alice" "$on_chain_usd_payment_send_as_btc_denominated_address" 4
  retry 3 1 check_for_broadcast "alice" "$on_chain_usd_payment_send_address" 4
  retry 3 1 check_for_broadcast "alice" "$on_chain_payment_send_address" 4

  # Mine all
  bitcoin_cli -generate 2

  # Check for settled
  retry 15 1 check_for_settled "alice" "$on_chain_payment_send_all_address" 4
  retry 3 1 check_for_settled "alice" "$on_chain_usd_payment_send_as_btc_denominated_address" 4
  retry 3 1 check_for_settled "alice" "$on_chain_usd_payment_send_address" 4
  retry 3 1 check_for_settled "alice" "$on_chain_payment_send_address" 4
}
