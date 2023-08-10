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

  login_user "$ALICE_TOKEN_NAME" "$ALICE_PHONE" "$CODE"
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

@test "onchain-receive: settle onchain for BTC wallet" {
  token_name="$ALICE_TOKEN_NAME"
  btc_wallet_name="$token_name.btc_wallet_id"
  amount="0.01"

    # Create address
  variables=$(
    jq -n \
    --arg wallet_id "$(read_value $btc_wallet_name)" \
    '{input: {walletId: $wallet_id}}'
  )

  exec_graphql "$token_name" 'on-chain-address-create' "$variables"
  on_chain_address_created="$(graphql_output '.data.onChainAddressCreate.address')"
  [[ "${on_chain_address_created}" != "null" ]] || exit 1

  exec_graphql "$token_name" 'on-chain-address-current' "$variables"
  on_chain_address_current="$(graphql_output '.data.onChainAddressCurrent.address')"
  [[ "${on_chain_address_current}" != "null" ]] || exit 1

  [[ "${on_chain_address_created}" == "${on_chain_address_current}" ]] || exit 1

  # Execute onchain send and check for transaction
  bitcoin_cli sendtoaddress "$on_chain_address_created" "$amount"
  retry 15 1 check_for_broadcast "$token_name" "$on_chain_address_created" 1
  bitcoin_cli -generate 2
  retry 15 1 check_for_onchain_initiated_settled "$token_name" "$on_chain_address_created" 1
}

@test "onchain-receive: settle onchain for USD wallet" {
  token_name="$ALICE_TOKEN_NAME"
  usd_wallet_name="$token_name.usd_wallet_id"
  amount="0.01"

    # Create address
  variables=$(
    jq -n \
    --arg wallet_id "$(read_value $usd_wallet_name)" \
    '{input: {walletId: $wallet_id}}'
  )

  exec_graphql "$token_name" 'on-chain-address-create' "$variables"
  on_chain_address_created="$(graphql_output '.data.onChainAddressCreate.address')"
  [[ "${on_chain_address_created}" != "null" ]] || exit 1

  exec_graphql "$token_name" 'on-chain-address-current' "$variables"
  on_chain_address_current="$(graphql_output '.data.onChainAddressCurrent.address')"
  [[ "${on_chain_address_current}" != "null" ]] || exit 1

  [[ "${on_chain_address_created}" == "${on_chain_address_current}" ]] || exit 1

  # Execute onchain send and check for transaction
  bitcoin_cli sendtoaddress "$on_chain_address_created" "$amount"
  retry 15 1 check_for_broadcast "$token_name" "$on_chain_address_created" 1
  bitcoin_cli -generate 2
  retry 15 1 check_for_onchain_initiated_settled "$token_name" "$on_chain_address_created" 1
}
