#!/usr/bin/env bats

load "helpers/setup-and-teardown"
load "helpers/onchain"

setup_file() {
  clear_cache
  reset_redis

  bitcoind_init
  start_trigger
  start_exporter
  start_server

  initialize_user_from_onchain "$ALICE_TOKEN_NAME" "$ALICE_PHONE" "$CODE"
  user_update_username "$ALICE_TOKEN_NAME"
  initialize_user_from_onchain "$BOB_TOKEN_NAME" "$BOB_PHONE" "$CODE"
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

@test "onchain-send: settle trade intraccount" {
  token_name="$BOB_TOKEN_NAME"
  btc_wallet_name="$token_name.btc_wallet_id"
  usd_wallet_name="$token_name.usd_wallet_id"

  # mutation: onChainPaymentSend, from BTC to USD wallet
  variables=$(
    jq -n \
    --arg wallet_id "$(read_value $usd_wallet_name)" \
    '{input: {walletId: $wallet_id}}'
  )
  exec_graphql "$token_name" 'on-chain-address-create' "$variables"
  on_chain_btc_payment_send_address="$(graphql_output '.data.onChainAddressCreate.address')"
  [[ "${on_chain_btc_payment_send_address}" != "null" ]] || exit 1

  variables=$(
    jq -n \
    --arg wallet_id "$(read_value $btc_wallet_name)" \
    --arg address "$on_chain_btc_payment_send_address" \
    --arg amount 200 \
    '{input: {walletId: $wallet_id, address: $address, amount: $amount}}'
  )
  exec_graphql "$token_name" 'on-chain-payment-send' "$variables"
  send_status="$(graphql_output '.data.onChainPaymentSend.status')"
  [[ "${send_status}" = "SUCCESS" ]] || exit 1

  exec_graphql "$token_name" 'transactions' '{"first": 1}'
  settled_status="$(get_from_transaction_by_address $on_chain_btc_payment_send_address '.status')"
  [[ "${settled_status}" = "SUCCESS" ]] || exit 1


  # mutation: onChainUsdPaymentSend, from USD to BTC wallet
  variables=$(
    jq -n \
    --arg wallet_id "$(read_value $btc_wallet_name)" \
    '{input: {walletId: $wallet_id}}'
  )
  exec_graphql "$token_name" 'on-chain-address-create' "$variables"
  on_chain_usd_payment_send_address="$(graphql_output '.data.onChainAddressCreate.address')"
  [[ "${on_chain_usd_payment_send_address}" != "null" ]] || exit 1

  variables=$(
    jq -n \
    --arg wallet_id "$(read_value $usd_wallet_name)" \
    --arg address "$on_chain_usd_payment_send_address" \
    --arg amount 200 \
    '{input: {walletId: $wallet_id, address: $address, amount: $amount}}'
  )
  exec_graphql "$token_name" 'on-chain-usd-payment-send' "$variables"
  send_status="$(graphql_output '.data.onChainUsdPaymentSend.status')"
  [[ "${send_status}" = "SUCCESS" ]] || exit 1

  exec_graphql "$token_name" 'transactions' '{"first": 1}'
  settled_status="$(get_from_transaction_by_address $on_chain_usd_payment_send_address '.status')"
  [[ "${settled_status}" = "SUCCESS" ]] || exit 1

  # mutation: onChainUsdPaymentSendAsBtcDenominated, from USD to BTC wallet
  variables=$(
    jq -n \
    --arg wallet_id "$(read_value $btc_wallet_name)" \
    '{input: {walletId: $wallet_id}}'
  )
  exec_graphql "$token_name" 'on-chain-address-create' "$variables"
  on_chain_usd_payment_send_as_btc_denominated_address="$(graphql_output '.data.onChainAddressCreate.address')"
  [[ "${on_chain_usd_payment_send_as_btc_denominated_address}" != "null" ]] || exit 1

  variables=$(
    jq -n \
    --arg wallet_id "$(read_value $usd_wallet_name)" \
    --arg address "$on_chain_usd_payment_send_as_btc_denominated_address" \
    --arg amount 12345 \
    '{input: {walletId: $wallet_id, address: $address, amount: $amount}}'
  )
  exec_graphql "$token_name" 'on-chain-usd-payment-send-as-btc-denominated' "$variables"
  send_status="$(graphql_output '.data.onChainUsdPaymentSendAsBtcDenominated.status')"
  [[ "${send_status}" = "SUCCESS" ]] || exit 1

  exec_graphql "$token_name" 'transactions' '{"first": 1}'
  settled_status="$(get_from_transaction_by_address $on_chain_usd_payment_send_as_btc_denominated_address '.status')"
  [[ "${settled_status}" = "SUCCESS" ]] || exit 1

  # mutation: onChainPaymentSendAll, from USD to BTC wallet
  variables=$(
    jq -n \
    --arg wallet_id "$(read_value $btc_wallet_name)" \
    '{input: {walletId: $wallet_id}}'
  )
  exec_graphql "$token_name" 'on-chain-address-create' "$variables"
  on_chain_payment_send_all_address="$(graphql_output '.data.onChainAddressCreate.address')"
  [[ "${on_chain_payment_send_all_address}" != "null" ]] || exit 1

  variables=$(
    jq -n \
    --arg wallet_id "$(read_value $usd_wallet_name)" \
    --arg address "$on_chain_payment_send_all_address" \
    '{input: {walletId: $wallet_id, address: $address}}'
  )
  exec_graphql "$token_name" 'on-chain-payment-send-all' "$variables"
  send_status="$(graphql_output '.data.onChainPaymentSendAll.status')"
  [[ "${send_status}" = "SUCCESS" ]] || exit 1

  exec_graphql "$token_name" 'transactions' '{"first": 1}'
  settled_status="$(get_from_transaction_by_address $on_chain_payment_send_all_address '.status')"
  [[ "${settled_status}" = "SUCCESS" ]] || exit 1
}

@test "onchain-send: settle intraledger, with no contacts check" {
  alice_token_name="$ALICE_TOKEN_NAME"
  alice_btc_wallet_name="$alice_token_name.btc_wallet_id"
  alice_usd_wallet_name="$alice_token_name.usd_wallet_id"

  recipient_token_name="user_$RANDOM"
  recipient_phone="$(random_phone)"
  login_user \
    "$recipient_token_name" \
    "$recipient_phone"  \
    "$CODE"
  user_update_username "$recipient_token_name"
  btc_recipient_wallet_name="$recipient_token_name.btc_wallet_id"

  # Check is not contact before send
  run is_contact "$alice_token_name" "$recipient_token_name"
  [[ "$status" -ne "0" ]] || exit 1
  run is_contact "$recipient_token_name" "$alice_token_name"
  [[ "$status" -ne "0" ]] || exit 1

  # mutation: onChainPaymentSend, alice btc -> bob btc
  variables=$(
    jq -n \
    --arg wallet_id "$(read_value $btc_recipient_wallet_name)" \
    '{input: {walletId: $wallet_id}}'
  )
  exec_graphql "$recipient_token_name" 'on-chain-address-create' "$variables"
  on_chain_payment_send_address="$(graphql_output '.data.onChainAddressCreate.address')"
  [[ "${on_chain_payment_send_address}" != "null" ]] || exit 1

  variables=$(
    jq -n \
    --arg wallet_id "$(read_value $alice_btc_wallet_name)" \
    --arg address "$on_chain_payment_send_address" \
    --arg amount 12345 \
    '{input: {walletId: $wallet_id, address: $address, amount: $amount}}'
  )
  exec_graphql "$alice_token_name" 'on-chain-payment-send' "$variables"
  send_status="$(graphql_output '.data.onChainPaymentSend.status')"
  [[ "${send_status}" = "SUCCESS" ]] || exit 1

  exec_graphql "$alice_token_name" 'transactions' '{"first": 1}'
  settled_status="$(get_from_transaction_by_address $on_chain_payment_send_address '.status')"
  [[ "${settled_status}" = "SUCCESS" ]] || exit 1

  # Check is not contact after send
  run is_contact "$alice_token_name" "$recipient_token_name"
  [[ "$status" -ne "0" ]] || exit 1
  run is_contact "$recipient_token_name" "$alice_token_name"
  [[ "$status" -ne "0" ]] || exit 1

  # mutation: onChainUsdPaymentSend, alice usd -> bob btc
  variables=$(
    jq -n \
    --arg wallet_id "$(read_value $btc_recipient_wallet_name)" \
    '{input: {walletId: $wallet_id}}'
  )
  exec_graphql "$recipient_token_name" 'on-chain-address-create' "$variables"
  on_chain_usd_payment_send_address="$(graphql_output '.data.onChainAddressCreate.address')"
  [[ "${on_chain_usd_payment_send_address}" != "null" ]] || exit 1

  variables=$(
    jq -n \
    --arg wallet_id "$(read_value $alice_usd_wallet_name)" \
    --arg address "$on_chain_usd_payment_send_address" \
    --arg amount 200 \
    '{input: {walletId: $wallet_id, address: $address, amount: $amount}}'
  )
  exec_graphql "$alice_token_name" 'on-chain-usd-payment-send' "$variables"
  send_status="$(graphql_output '.data.onChainUsdPaymentSend.status')"
  [[ "${send_status}" = "SUCCESS" ]] || exit 1

  exec_graphql "$alice_token_name" 'transactions' '{"first": 1}'
  settled_status="$(get_from_transaction_by_address $on_chain_usd_payment_send_address '.status')"
  [[ "${settled_status}" = "SUCCESS" ]] || exit 1

  # mutation: onChainUsdPaymentSendAsBtcDenominated, alice usd -> bob btc
  variables=$(
    jq -n \
    --arg wallet_id "$(read_value $btc_recipient_wallet_name)" \
    '{input: {walletId: $wallet_id}}'
  )
  exec_graphql "$recipient_token_name" 'on-chain-address-create' "$variables"
  on_chain_usd_payment_send_as_btc_denominated_address="$(graphql_output '.data.onChainAddressCreate.address')"
  [[ "${on_chain_usd_payment_send_as_btc_denominated_address}" != "null" ]] || exit 1

  variables=$(
    jq -n \
    --arg wallet_id "$(read_value $alice_usd_wallet_name)" \
    --arg address "$on_chain_usd_payment_send_as_btc_denominated_address" \
    --arg amount 12345 \
    '{input: {walletId: $wallet_id, address: $address, amount: $amount}}'
  )
  exec_graphql "$alice_token_name" 'on-chain-usd-payment-send-as-btc-denominated' "$variables"
  send_status="$(graphql_output '.data.onChainUsdPaymentSendAsBtcDenominated.status')"
  [[ "${send_status}" = "SUCCESS" ]] || exit 1

  exec_graphql "$alice_token_name" 'transactions' '{"first": 1}'
  settled_status="$(get_from_transaction_by_address $on_chain_usd_payment_send_as_btc_denominated_address '.status')"
  [[ "${settled_status}" = "SUCCESS" ]] || exit 1

  # mutation: onChainPaymentSendAll, bob btc -> alice btc
  variables=$(
    jq -n \
    --arg wallet_id "$(read_value $alice_btc_wallet_name)" \
    '{input: {walletId: $wallet_id}}'
  )
  exec_graphql "$alice_token_name" 'on-chain-address-create' "$variables"
  on_chain_payment_send_all_address="$(graphql_output '.data.onChainAddressCreate.address')"
  [[ "${on_chain_payment_send_all_address}" != "null" ]] || exit 1

  variables=$(
    jq -n \
    --arg wallet_id "$(read_value $btc_recipient_wallet_name)" \
    --arg address "$on_chain_payment_send_all_address" \
    '{input: {walletId: $wallet_id, address: $address}}'
  )
  exec_graphql "$recipient_token_name" 'on-chain-payment-send-all' "$variables"
  send_status="$(graphql_output '.data.onChainPaymentSendAll.status')"
  [[ "${send_status}" = "SUCCESS" ]] || exit 1

  exec_graphql "$recipient_token_name" 'transactions' '{"first": 1}'
  settled_status="$(get_from_transaction_by_address $on_chain_payment_send_all_address '.status')"
  [[ "${settled_status}" = "SUCCESS" ]] || exit 1
}

@test "onchain-send: settle onchain" {
  token_name="$ALICE_TOKEN_NAME"
  btc_wallet_name="$token_name.btc_wallet_id"
  usd_wallet_name="$token_name.usd_wallet_id"

  # EXECUTE GQL SENDS
  # ----------

  # mutation: onChainPaymentSend
  on_chain_payment_send_address=$(bitcoin_cli getnewaddress)
  [[ "${on_chain_payment_send_address}" != "null" ]] || exit 1

  variables=$(
    jq -n \
    --arg wallet_id "$(read_value $btc_wallet_name)" \
    --arg address "$on_chain_payment_send_address" \
    --arg amount 12345 \
    '{input: {walletId: $wallet_id, address: $address, amount: $amount}}'
  )
  exec_graphql "$token_name" 'on-chain-payment-send' "$variables"
  send_status="$(graphql_output '.data.onChainPaymentSend.status')"
  [[ "${send_status}" = "SUCCESS" ]] || exit 1

  # mutation: onChainUsdPaymentSend
  on_chain_usd_payment_send_address=$(bitcoin_cli getnewaddress)
  [[ "${on_chain_usd_payment_send_address}" != "null" ]] || exit 1

  variables=$(
    jq -n \
    --arg wallet_id "$(read_value $usd_wallet_name)" \
    --arg address "$on_chain_usd_payment_send_address" \
    --arg amount 200 \
    '{input: {walletId: $wallet_id, address: $address, amount: $amount}}'
  )
  exec_graphql "$token_name" 'on-chain-usd-payment-send' "$variables"
  send_status="$(graphql_output '.data.onChainUsdPaymentSend.status')"
  [[ "${send_status}" = "SUCCESS" ]] || exit 1

  # mutation: onChainUsdPaymentSendAsBtcDenominated
  on_chain_usd_payment_send_as_btc_denominated_address=$(bitcoin_cli getnewaddress)
  [[ "${on_chain_usd_payment_send_as_btc_denominated_address}" != "null" ]] || exit 1

  variables=$(
    jq -n \
    --arg wallet_id "$(read_value $usd_wallet_name)" \
    --arg address "$on_chain_usd_payment_send_as_btc_denominated_address" \
    --arg amount 12345 \
    '{input: {walletId: $wallet_id, address: $address, amount: $amount}}'
  )
  exec_graphql "$token_name" 'on-chain-usd-payment-send-as-btc-denominated' "$variables"
  send_status="$(graphql_output '.data.onChainUsdPaymentSendAsBtcDenominated.status')"
  [[ "${send_status}" = "SUCCESS" ]] || exit 1

  # mutation: onChainPaymentSendAll
  on_chain_payment_send_all_address=$(bitcoin_cli getnewaddress)
  [[ "${on_chain_payment_send_all_address}" != "null" ]] || exit 1

  variables=$(
    jq -n \
    --arg wallet_id "$(read_value $usd_wallet_name)" \
    --arg address "$on_chain_payment_send_all_address" \
    '{input: {walletId: $wallet_id, address: $address}}'
  )
  exec_graphql "$token_name" 'on-chain-payment-send-all' "$variables"
  send_status="$(graphql_output '.data.onChainPaymentSendAll.status')"
  [[ "${send_status}" = "SUCCESS" ]] || exit 1

  # CHECK FOR TRANSACTIONS IN DATABASE
  # ----------

  # Check for broadcast of last send
  retry 15 1 check_for_broadcast "$token_name" "$on_chain_payment_send_all_address" 4
  retry 3 1 check_for_broadcast "$token_name" "$on_chain_usd_payment_send_as_btc_denominated_address" 4
  retry 3 1 check_for_broadcast "$token_name" "$on_chain_usd_payment_send_address" 4
  retry 3 1 check_for_broadcast "$token_name" "$on_chain_payment_send_address" 4

  # Mine all
  bitcoin_cli -generate 2

  # Check for settled
  retry 15 1 check_for_onchain_initiated_settled "$token_name" "$on_chain_payment_send_all_address" 4
  retry 3 1 check_for_onchain_initiated_settled "$token_name" "$on_chain_usd_payment_send_as_btc_denominated_address" 4
  retry 3 1 check_for_onchain_initiated_settled "$token_name" "$on_chain_usd_payment_send_address" 4
  retry 3 1 check_for_onchain_initiated_settled "$token_name" "$on_chain_payment_send_address" 4
}
