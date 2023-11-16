#!/usr/bin/env bats

load "helpers/setup-and-teardown"
load "helpers/onchain"
load "helpers/ln"

setup_file() {
  clear_cache
  reset_redis

  bitcoind_init
  start_trigger
  start_exporter
  start_server

  login_user "$ALICE_TOKEN_NAME" "$ALICE_PHONE" "$CODE"
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

create_new_lnd_onchain_address() {
  local wallet_name=$1
  local wallet_id=$(read_value $wallet_name)

  insert_lnd1_address() {
    local wallet_id=$1
    local address=$2
    pubkey=$(lnd_cli getinfo | jq -r '.identity_pubkey')

    mongo_command=$(echo "db.wallets.updateOne(
      { id: \"$wallet_id\" },
      {
        \$push: {
          onchain: {
            address: \"$address\",
            pubkey: \"$pubkey\"
          }
        }
      }
    );" | tr -d '[:space:]')

    mongo_cli "$mongo_command"
  }

  address=$(lnd_cli newaddress p2wkh | jq -r '.address')
  insert_lnd1_address "$wallet_id" "$address" > /dev/null

  echo $address
}

@test "onchain-receive: process received batch transaction" {
  alice_token_name="$ALICE_TOKEN_NAME"
  alice_btc_wallet_name="$alice_token_name.btc_wallet_id"
  bob_token_name="$BOB_TOKEN_NAME"
  bob_usd_wallet_name="$bob_token_name.usd_wallet_id"
  amount="0.01"

  # Create Alice addresses
  alice_variables=$(
    jq -n \
    --arg wallet_id "$(read_value $alice_btc_wallet_name)" \
    '{input: {walletId: $wallet_id}}'
  )

  exec_graphql "$alice_token_name" 'on-chain-address-create' "$alice_variables"
  alice_address_1="$(graphql_output '.data.onChainAddressCreate.address')"
  [[ "${alice_address_1}" != "null" ]] || exit 1

  exec_graphql "$alice_token_name" 'on-chain-address-create' "$alice_variables"
  alice_address_2="$(graphql_output '.data.onChainAddressCreate.address')"
  [[ "${alice_address_2}" != "null" ]] || exit 1

  # Create Bob addresses
  bob_variables=$(
    jq -n \
    --arg wallet_id "$(read_value $bob_usd_wallet_name)" \
    '{input: {walletId: $wallet_id}}'
  )

  exec_graphql "$bob_token_name" 'on-chain-address-create' "$bob_variables"
  bob_address_1="$(graphql_output '.data.onChainAddressCreate.address')"
  [[ "${bob_address_1}" != "null" ]] || exit 1

  # Create psbt & broadcast transaction
  psbt_outputs=$(
    jq -c -n \
    --arg alice_address_1 "$alice_address_1" \
    --arg alice_address_2 "$alice_address_2" \
    --arg bob_address_1 "$bob_address_1" \
    --argjson amount "$amount" \
    '{
      ($alice_address_1): $amount,
      ($alice_address_2): $amount,
      ($bob_address_1): $amount
    }'
  )
  unsigned_psbt=$(bitcoin_cli walletcreatefundedpsbt '[]' $psbt_outputs | jq -r '.psbt')
  signed_psbt=$(bitcoin_cli walletprocesspsbt "$unsigned_psbt" | jq -r '.psbt')
  tx_hex=$(bitcoin_cli finalizepsbt "$signed_psbt" | jq -r '.hex')
  txid=$(bitcoin_cli sendrawtransaction "$tx_hex")

  retry 15 1 check_for_broadcast "$alice_token_name" "$alice_address_1" 2
  retry 3 1 check_for_broadcast "$alice_token_name" "$alice_address_2" 2
  retry 3 1 check_for_broadcast "$bob_token_name" "$bob_address_1" 1

  # Check 'pendingIncomingBalance' query
  exec_graphql "$alice_token_name" 'wallets-for-account'
  alice_btc_pending_incoming=$(graphql_output '
    .data.me.defaultAccount.wallets[]
    | select(.walletCurrency == "BTC")
    .pendingIncomingBalance
  ')
  [[ "$alice_btc_pending_incoming" -gt 0 ]] || exit 1

  exec_graphql "$bob_token_name" 'wallets-for-account'
  bob_usd_pending_incoming=$(graphql_output '
    .data.me.defaultAccount.wallets[]
    | select(.walletCurrency == "USD")
    .pendingIncomingBalance
  ')
  [[ "$bob_usd_pending_incoming" -gt 0 ]] || exit 1

  # Mine transactions
  bitcoin_cli -generate 2
  retry 15 1 check_for_onchain_initiated_settled "$alice_token_name" "$alice_address_1" 2
  retry 3 1 check_for_onchain_initiated_settled "$alice_token_name" "$alice_address_2" 2
  retry 3 1 check_for_onchain_initiated_settled "$bob_token_name" "$bob_address_1" 1
}

@test "onchain-receive: process received batch transaction via legacy lnd" {
  alice_token_name="$ALICE_TOKEN_NAME"
  alice_btc_wallet_name="$alice_token_name.btc_wallet_id"
  alice_usd_wallet_name="$alice_token_name.usd_wallet_id"

  bob_token_name="$BOB_TOKEN_NAME"
  bob_btc_wallet_name="$bob_token_name.btc_wallet_id"

  amount="0.01"

  # Get initial balances
  lnd1_initial_balance=$(lnd_cli walletbalance | jq -r '.confirmed_balance')
  bria_initial_balance=$( bria_cli wallet-balance -w dev-wallet | jq -r '.effectiveSettled')

  # Create Alice addresses
  alice_btc_address="$(create_new_lnd_onchain_address $alice_btc_wallet_name)"
  current_btc_address_variables=$(
    jq -n \
    --arg wallet_id "$(read_value $alice_btc_wallet_name)" \
    '{input: {walletId: $wallet_id}}'
  )
  exec_graphql "$alice_token_name" 'on-chain-address-current' "$current_btc_address_variables"
  on_chain_address_current="$(graphql_output '.data.onChainAddressCurrent.address')"
  [[ "${on_chain_address_current}" != "null" ]] || exit 1
  [[ "${alice_btc_address}" == "${on_chain_address_current}" ]] || exit 1

  alice_usd_address="$(create_new_lnd_onchain_address $alice_usd_wallet_name)"
  current_usd_address_variables=$(
    jq -n \
    --arg wallet_id "$(read_value $alice_usd_wallet_name)" \
    '{input: {walletId: $wallet_id}}'
  )
  exec_graphql "$alice_token_name" 'on-chain-address-current' "$current_usd_address_variables"
  on_chain_address_current="$(graphql_output '.data.onChainAddressCurrent.address')"
  [[ "${on_chain_address_current}" != "null" ]] || exit 1
  [[ "${alice_usd_address}" == "${on_chain_address_current}" ]] || exit 1

  # Create Bob addresses
  bob_btc_address="$(create_new_lnd_onchain_address $bob_btc_wallet_name)"
  current_btc_address_variables=$(
    jq -n \
    --arg wallet_id "$(read_value $bob_btc_wallet_name)" \
    '{input: {walletId: $wallet_id}}'
  )
  exec_graphql "$bob_token_name" 'on-chain-address-current' "$current_btc_address_variables"
  on_chain_address_current="$(graphql_output '.data.onChainAddressCurrent.address')"
  [[ "${on_chain_address_current}" != "null" ]] || exit 1
  [[ "${bob_btc_address}" == "${on_chain_address_current}" ]] || exit 1

  # Create psbt & broadcast transaction
  psbt_outputs=$(
    jq -c -n \
    --arg alice_btc_address "$alice_btc_address" \
    --arg alice_usd_address "$alice_usd_address" \
    --arg bob_btc_address "$bob_btc_address" \
    --argjson amount "$amount" \
    '{
      ($alice_btc_address): $amount,
      ($alice_usd_address): $amount,
      ($bob_btc_address): $amount
    }'
  )
  unsigned_psbt=$(bitcoin_cli walletcreatefundedpsbt '[]' $psbt_outputs | jq -r '.psbt')
  signed_psbt=$(bitcoin_cli walletprocesspsbt "$unsigned_psbt" | jq -r '.psbt')
  tx_hex=$(bitcoin_cli finalizepsbt "$signed_psbt" | jq -r '.hex')
  txid=$(bitcoin_cli sendrawtransaction "$tx_hex")

  retry 15 1 check_for_broadcast "$alice_token_name" "$alice_btc_address" 10
  retry 3 1 check_for_broadcast "$alice_token_name" "$alice_usd_address" 10
  retry 3 1 check_for_broadcast "$bob_token_name" "$bob_btc_address" 10

  # Mine transactions
  # Note: subscription event operates in a delayed way from lnd1 state
  bitcoin_cli -generate 2
  sleep 1
  bitcoin_cli -generate 2
  sleep 1
  bitcoin_cli -generate 2

  retry 15 1 check_for_onchain_initiated_settled "$alice_token_name" "$alice_btc_address" 10
  retry 3 1 check_for_onchain_initiated_settled "$alice_token_name" "$alice_usd_address" 10
  retry 3 1 check_for_onchain_initiated_settled "$bob_token_name" "$bob_btc_address" 10

  # Check final balances
  lnd1_final_balance=$(lnd_cli walletbalance | jq -r '.confirmed_balance')
  [[ "$lnd1_final_balance" -gt "$lnd1_initial_balance" ]] || exit 1
  bria_final_balance=$( bria_cli wallet-balance -w dev-wallet | jq -r '.effectiveSettled')
  [[ "$bria_final_balance" == "$bria_initial_balance" ]] || exit 1
}
