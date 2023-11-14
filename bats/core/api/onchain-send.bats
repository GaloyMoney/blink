#!/usr/bin/env bats

load "../../helpers/auth.bash"
load "../../helpers/funding/onchain.bash"

setup_file() {
  create_user 'alice'
  fund_user_onchain 'alice' 'btc_wallet'
  # fund_user_onchain 'alice' 'usd_wallet'

  # create_user 'bob'
  # fund_user_onchain 'bob' 'btc_wallet'
  # fund_user_onchain 'bob' 'usd_wallet'
}

@test "onchain-send: settle trade intraccount" {
  btc_wallet_name="alice.btc_wallet_id"
  usd_wallet_name="alice.usd_wallet_id"

  # mutation: onChainPaymentSend, from BTC to USD wallet
  variables=$(
    jq -n \
    --arg wallet_id "$(read_value $usd_wallet_name)" \
    '{input: {walletId: $wallet_id}}'
  )
  exec_graphql 'alice' 'on-chain-address-create' "$variables"
  on_chain_btc_payment_send_address="$(graphql_output '.data.onChainAddressCreate.address')"
  [[ "${on_chain_btc_payment_send_address}" != "null" ]] || exit 1

  variables=$(
    jq -n \
    --arg wallet_id "$(read_value $btc_wallet_name)" \
    --arg address "$on_chain_btc_payment_send_address" \
    --arg amount 200 \
    '{input: {walletId: $wallet_id, address: $address, amount: $amount}}'
  )
  exec_graphql 'alice' 'on-chain-payment-send' "$variables"
  send_status="$(graphql_output '.data.onChainPaymentSend.status')"
  [[ "${send_status}" = "SUCCESS" ]] || exit 1

  exec_graphql 'alice' 'transactions' '{"first": 1}'
  settled_status="$(get_from_transaction_by_address $on_chain_btc_payment_send_address '.status')"
  [[ "${settled_status}" = "SUCCESS" ]] || exit 1

  # mutation: onChainUsdPaymentSend, from USD to BTC wallet
  variables=$(
    jq -n \
    --arg wallet_id "$(read_value $btc_wallet_name)" \
    '{input: {walletId: $wallet_id}}'
  )
  exec_graphql 'alice' 'on-chain-address-create' "$variables"
  on_chain_usd_payment_send_address="$(graphql_output '.data.onChainAddressCreate.address')"
  [[ "${on_chain_usd_payment_send_address}" != "null" ]] || exit 1

  variables=$(
    jq -n \
    --arg wallet_id "$(read_value $usd_wallet_name)" \
    --arg address "$on_chain_usd_payment_send_address" \
    --arg amount 200 \
    '{input: {walletId: $wallet_id, address: $address, amount: $amount}}'
  )
  exec_graphql 'alice' 'on-chain-usd-payment-send' "$variables"
  send_status="$(graphql_output '.data.onChainUsdPaymentSend.status')"
  [[ "${send_status}" = "SUCCESS" ]] || exit 1

  exec_graphql 'alice' 'transactions' '{"first": 1}'
  settled_status="$(get_from_transaction_by_address $on_chain_usd_payment_send_address '.status')"
  [[ "${settled_status}" = "SUCCESS" ]] || exit 1

  # mutation: onChainUsdPaymentSendAsBtcDenominated, from USD to BTC wallet
  variables=$(
    jq -n \
    --arg wallet_id "$(read_value $btc_wallet_name)" \
    '{input: {walletId: $wallet_id}}'
  )
  exec_graphql 'alice' 'on-chain-address-create' "$variables"
  on_chain_usd_payment_send_as_btc_denominated_address="$(graphql_output '.data.onChainAddressCreate.address')"
  [[ "${on_chain_usd_payment_send_as_btc_denominated_address}" != "null" ]] || exit 1

  variables=$(
    jq -n \
    --arg wallet_id "$(read_value $usd_wallet_name)" \
    --arg address "$on_chain_usd_payment_send_as_btc_denominated_address" \
    --arg amount 12345 \
    '{input: {walletId: $wallet_id, address: $address, amount: $amount}}'
  )
  exec_graphql 'alice' 'on-chain-usd-payment-send-as-btc-denominated' "$variables"
  send_status="$(graphql_output '.data.onChainUsdPaymentSendAsBtcDenominated.status')"
  [[ "${send_status}" = "SUCCESS" ]] || exit 1

  exec_graphql 'alice' 'transactions' '{"first": 1}'
  settled_status="$(get_from_transaction_by_address $on_chain_usd_payment_send_as_btc_denominated_address '.status')"
  [[ "${settled_status}" = "SUCCESS" ]] || exit 1

  # mutation: onChainPaymentSendAll, from USD to BTC wallet
  variables=$(
    jq -n \
    --arg wallet_id "$(read_value $btc_wallet_name)" \
    '{input: {walletId: $wallet_id}}'
  )
  exec_graphql 'alice' 'on-chain-address-create' "$variables"
  on_chain_payment_send_all_address="$(graphql_output '.data.onChainAddressCreate.address')"
  [[ "${on_chain_payment_send_all_address}" != "null" ]] || exit 1

  variables=$(
    jq -n \
    --arg wallet_id "$(read_value $usd_wallet_name)" \
    --arg address "$on_chain_payment_send_all_address" \
    '{input: {walletId: $wallet_id, address: $address}}'
  )
  exec_graphql 'alice' 'on-chain-payment-send-all' "$variables"
  send_status="$(graphql_output '.data.onChainPaymentSendAll.status')"
  [[ "${send_status}" = "SUCCESS" ]] || exit 1

  exec_graphql 'alice' 'transactions' '{"first": 1}'
  settled_status="$(get_from_transaction_by_address $on_chain_payment_send_all_address '.status')"
  [[ "${settled_status}" = "SUCCESS" ]] || exit 1
  exit 1
}
