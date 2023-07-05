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
  [ "$(balance_for_check)" = 0 ]
}

@test "onchain payments: setup user" {
  input=$(
    jq -n \
    --arg phone "$ALICE_PHONE" \
    --arg code "$ALICE_CODE" \
    '{input: {phone: $phone, code: $code}}'
  )
  exec_graphql 'anon' 'user-login' "$input"
  auth_token="$(graphql_output '.data.userLogin.authToken')"
  [ "${auth_token}" != "null" ]
  cache_value 'alice' "$auth_token"

  exec_graphql 'alice' 'btc-wallet-id'
  wallet0="$(graphql_output '.data.me.defaultAccount.wallets[0].id')"
  wallet1="$(graphql_output '.data.me.defaultAccount.wallets[1].id')"
  alice_btc_wallet_id="$wallet0"
  if [ $alice_btc_wallet_id = "null" ]; then alice_btc_wallet_id="$wallet1"; fi
  [ "${alice_btc_wallet_id}" != "null" ]
  cache_value 'alice_btc_wallet_id' "$alice_btc_wallet_id"

  retry 10 1 balance_for_check
}

@test "onchain payments: receive" {
  input=$(
    jq -n \
    --arg wallet_id "$(read_value 'alice_btc_wallet_id')" \
    '{input: {walletId: $wallet_id}}'
  )
  exec_graphql 'alice' 'on-chain-address-create' "$input"
  address="$(graphql_output '.data.onChainAddressCreate.address')"
  [ "${address}" != "null" ]

  bitcoin_cli sendtoaddress "$address" 0.01
  bitcoin_cli -generate 2

  check_for_settled() {
    exec_graphql 'alice' 'transactions' '{"first":1}'
    settled_status="$(get_from_transaction_by_address $address '.status')"
    [ "${settled_status}" = "SUCCESS" ]
  }
  retry 15 1 check_for_settled
}

@test "onchain payments: send" {
  outside_address=$(bitcoin_cli getnewaddress)
  [ "${outside_address}" != "null" ]

  input=$(
    jq -n \
    --arg wallet_id "$(read_value 'alice_btc_wallet_id')" \
    --arg address "$outside_address" \
    --arg amount 12345 \
    '{input: {walletId: $wallet_id, address: $address, amount: $amount}}'
  )
  exec_graphql 'alice' 'on-chain-payment-send' "$input"
  send_status="$(graphql_output '.data.onChainPaymentSend.status')"
  [ "${send_status}" = "SUCCESS" ]

  check_for_broadcast() {
    exec_graphql 'alice' 'transactions' '{"first":1}'
    txid="$(get_from_transaction_by_address $outside_address '.settlementVia.transactionHash')"
    [ "${txid}" != "null" ]
  }
  retry 15 1 check_for_broadcast

  bitcoin_cli -generate 2

  check_for_settled() {
    exec_graphql 'alice' 'transactions' '{"first":1}'
    settled_status="$(get_from_transaction_by_address $outside_address '.status')"
    [ "${settled_status}" = "SUCCESS" ]
  }
  retry 15 1 check_for_settled
}
