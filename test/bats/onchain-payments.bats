#!/usr/bin/env bats

load "helpers"

setup_file() {
  bitcoind_init
  # TODO: bootstrap admin accounts (see createMandatoryUsers function)
  start_server
  start_trigger
}

teardown_file() {
  stop_server
  stop_trigger
}

@test "onchain payments: setup user" {
  exec_graphql 'anon' 'user-login' '{"input": {"phone":"+16505554328","code":"321321"}}'
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
}

@test "onchain payments: receive" {
  exec_graphql 'alice' 'on-chain-address-create' "{\"input\":{\"walletId\":\"$alice_btc_wallet_id\"}}"
  address="$(graphql_output '.data.onChainAddressCreate.address')"
  [ "${address}" != "null" ]
  bitcoin_cli sendtoaddress "$address" 0.01
  bitcoin_cli -generate 2
  sleep 5
 
  # TODO: Get pending in coming to settle before sending
}

@test "onchain payments: send" {
  outside_address=$(bitcoin_cli getnewaddress)
  [ "${outside_address}" != "null" ]
  exec_graphql 'alice' 'on-chain-payment-send' "{\"input\":{\"walletId\":\"$alice_btc_wallet_id\",\"address\":\"$outside_address\",\"amount\":10000}}"
  echo $output > output.txt
}
