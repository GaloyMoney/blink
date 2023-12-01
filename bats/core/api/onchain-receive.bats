#!/usr/bin/env bats

load "../../helpers/cli.bash"
load "../../helpers/user.bash"
load "../../helpers/onchain.bash"
load "../../helpers/ln.bash"
load "../../helpers/wallet.bash"
load "../../helpers/ledger.bash"

setup_file() {
  create_user 'alice'
  user_update_username 'alice'
  fund_user_onchain 'alice' 'btc_wallet'
  fund_user_onchain 'alice' 'usd_wallet'

  create_user 'bob'
  user_update_username 'bob'
  fund_user_onchain 'bob' 'btc_wallet'
  fund_user_onchain 'bob' 'usd_wallet'
}

teardown() {
   if [[ "$(balance_for_check)" != 0 ]]; then
     fail "Error: balance_for_check failed"
   fi
}

@test "onchain-receive: btc wallet, can create new address if current one is unused" {
  btc_wallet_name="alice.btc_wallet_id"

  variables=$(
    jq -n \
    --arg wallet_id "$(read_value $btc_wallet_name)" \
    '{input: {walletId: $wallet_id}}'
  )

  # Create address
  exec_graphql 'alice' 'on-chain-address-create' "$variables"
  on_chain_address_created="$(graphql_output '.data.onChainAddressCreate.address')"
  [[ "${on_chain_address_created}" != "null" ]] || exit 1

  # Fetch current address
  exec_graphql 'alice' 'on-chain-address-current' "$variables"
  on_chain_address_current="$(graphql_output '.data.onChainAddressCurrent.address')"
  [[ "${on_chain_address_current}" != "null" ]] || exit 1
  [[ "${on_chain_address_created}" == "${on_chain_address_current}" ]] || exit 1

  # Create new address
  exec_graphql 'alice' 'on-chain-address-create' "$variables"
  retry_on_chain_address_created="$(graphql_output '.data.onChainAddressCreate.address')"
  [[ "${retry_on_chain_address_created}" != "null" ]] || exit 1
  [[ "${on_chain_address_created}" != "${retry_on_chain_address_created}" ]] || exit 1

  # Fetch new current address
  exec_graphql 'alice' 'on-chain-address-current' "$variables"
  retry_on_chain_address_current="$(graphql_output '.data.onChainAddressCurrent.address')"
  [[ "${retry_on_chain_address_current}" != "null" ]] || exit 1
  [[ "${retry_on_chain_address_created}" == "${retry_on_chain_address_current}" ]] || exit 1
}

@test "onchain-receive: settle onchain for BTC wallet, query by address" {
  btc_wallet_name="alice.btc_wallet_id"
  amount="0.01"

  # Create address and broadcast transaction 1
  variables=$(
    jq -n \
    --arg wallet_id "$(read_value $btc_wallet_name)" \
    '{input: {walletId: $wallet_id}}'
  )

  exec_graphql 'alice' 'on-chain-address-create' "$variables"
  on_chain_address_created_1="$(graphql_output '.data.onChainAddressCreate.address')"
  [[ "${on_chain_address_created_1}" != "null" ]] || exit 1

  bitcoin_cli sendtoaddress "$on_chain_address_created_1" "$amount"
  retry 15 1 check_for_incoming_broadcast 'alice' "$on_chain_address_created_1"

  # Create address and broadcast transaction 2
  exec_graphql 'alice' 'on-chain-address-create' "$variables"
  on_chain_address_created_2="$(graphql_output '.data.onChainAddressCreate.address')"
  [[ "${on_chain_address_created_2}" != "null" ]] || exit 1

  bitcoin_cli sendtoaddress "$on_chain_address_created_2" "$amount"
  retry 15 1 check_for_incoming_broadcast 'alice' "$on_chain_address_created_2"

  # Check pending transactions for address 1
  address_1_pending_txns_variables=$(
  jq -n \
  --arg address "$on_chain_address_created_1" \
  '{"address": $address}'
  )
  exec_graphql 'alice' 'pending-incoming-transactions-by-address' "$address_1_pending_txns_variables"
  pending_txns_for_address_1=$(
    graphql_output '
      .data.me.defaultAccount.wallets[]
      | select(.__typename == "BTCWallet")
      .pendingIncomingTransactionsByAddress'
  )
  pending_txns_for_address_1_length="$(echo $pending_txns_for_address_1 | jq -r 'length')"
  [[ "$pending_txns_for_address_1_length" == "1" ]] || exit 1
  address_1_from_pending_txns="$(echo $pending_txns_for_address_1 | jq -r '.[0].initiationVia.address')"
  [[ "$address_1_from_pending_txns" == "$on_chain_address_created_1" ]]

  # Check pending transactions for address 2
  address_2_pending_txns_variables=$(
  jq -n \
  --arg address "$on_chain_address_created_2" \
  '{"address": $address}'
  )
  exec_graphql 'alice' 'pending-incoming-transactions-by-address' "$address_2_pending_txns_variables"
  pending_txns_for_address_2=$(
    graphql_output '
      .data.me.defaultAccount.wallets[]
      | select(.__typename == "BTCWallet")
      .pendingIncomingTransactionsByAddress'
  )
  pending_txns_for_address_2_length="$(echo $pending_txns_for_address_2 | jq -r 'length')"
  [[ "$pending_txns_for_address_2_length" == "1" ]] || exit 1
  address_2_from_pending_txns="$(echo $pending_txns_for_address_2 | jq -r '.[0].initiationVia.address')"
  [[ "$address_2_from_pending_txns" == "$on_chain_address_created_2" ]]

  # Check pending transactions for account
  exec_graphql 'alice' 'pending-incoming-transactions'
  pending_txns_for_account=$(
    graphql_output '
      .data.me.defaultAccount.pendingIncomingTransactions'
  )
  pending_txns_for_account_length="$(echo $pending_txns_for_account | jq -r 'length')"
  [[ "$pending_txns_for_account_length" == "2" ]] || exit 1
  
  # Mine transactions
  bitcoin_cli -generate 2
  retry 30 1 check_for_onchain_initiated_settled 'alice' "$on_chain_address_created_1" 2
  retry 3 1 check_for_onchain_initiated_settled 'alice' "$on_chain_address_created_2" 2

  # Check transactions for address 1
  address_1_variables=$(
  jq -n \
  --argjson first "10" \
  --arg address "$on_chain_address_created_1" \
  '{"first": $first, "address": $address}'
  )
  exec_graphql 'alice' 'transactions-by-address' "$address_1_variables"
  txns_for_address_1=$(
    graphql_output '
      .data.me.defaultAccount.wallets[]
      | select(.__typename == "BTCWallet")
      .transactionsByAddress.edges'
  )
  txns_for_address_1_length="$(echo $txns_for_address_1 | jq -r 'length')"
  [[ "$txns_for_address_1_length" == "1" ]] || exit 1
  address_1_from_txns="$(echo $txns_for_address_1 | jq -r '.[0].node.initiationVia.address')"
  [[ "$address_1_from_txns" == "$on_chain_address_created_1" ]]

  # Check transactions for address 2
  address_2_variables=$(
  jq -n \
  --argjson first "10" \
  --arg address "$on_chain_address_created_2" \
  '{"first": $first, "address": $address}'
  )
  exec_graphql 'alice' 'transactions-by-address' "$address_2_variables"
  txns_for_address_2=$(
    graphql_output '
      .data.me.defaultAccount.wallets[]
      | select(.__typename == "BTCWallet")
      .transactionsByAddress.edges'
  )
  txns_for_address_2_length="$(echo $txns_for_address_2 | jq -r 'length')"
  [[ "$txns_for_address_2_length" == "1" ]] || exit 1
  address_2_from_txns="$(echo $txns_for_address_2 | jq -r '.[0].node.initiationVia.address')"
  [[ "$address_2_from_txns" == "$on_chain_address_created_2" ]]

  # Ensure no pending transactions for account
  exec_graphql 'alice' 'pending-transactions'
  pending_txns_for_account=$(
    graphql_output '
      .data.me.defaultAccount.pendingIncomingTransactions'
  )
  pending_txns_for_account_length="$(echo $pending_txns_for_account | jq -r 'length')"
  [[ "$pending_txns_for_account_length" == "0" ]] || exit 1
}

@test "onchain-receive: usd wallet, can create new address if current one is unused" {
  usd_wallet_name="alice.usd_wallet_id"

  variables=$(
    jq -n \
    --arg wallet_id "$(read_value $usd_wallet_name)" \
    '{input: {walletId: $wallet_id}}'
  )

  # Create address
  exec_graphql 'alice' 'on-chain-address-create' "$variables"
  on_chain_address_created="$(graphql_output '.data.onChainAddressCreate.address')"
  [[ "${on_chain_address_created}" != "null" ]] || exit 1

  # Fetch current address
  exec_graphql 'alice' 'on-chain-address-current' "$variables"
  on_chain_address_current="$(graphql_output '.data.onChainAddressCurrent.address')"
  [[ "${on_chain_address_current}" != "null" ]] || exit 1
  [[ "${on_chain_address_created}" == "${on_chain_address_current}" ]] || exit 1

  # Create new address
  exec_graphql 'alice' 'on-chain-address-create' "$variables"
  retry_on_chain_address_created="$(graphql_output '.data.onChainAddressCreate.address')"
  [[ "${retry_on_chain_address_created}" != "null" ]] || exit 1
  [[ "${on_chain_address_created}" != "${retry_on_chain_address_created}" ]] || exit 1

  # Fetch new current address
  exec_graphql 'alice' 'on-chain-address-current' "$variables"
  retry_on_chain_address_current="$(graphql_output '.data.onChainAddressCurrent.address')"
  [[ "${retry_on_chain_address_current}" != "null" ]] || exit 1
  [[ "${retry_on_chain_address_created}" == "${retry_on_chain_address_current}" ]] || exit 1
}

@test "onchain-receive: settle onchain for USD wallet" {
  usd_wallet_name="alice.usd_wallet_id"
  amount="0.01"

  # Create address
  variables=$(
    jq -n \
    --arg wallet_id "$(read_value $usd_wallet_name)" \
    '{input: {walletId: $wallet_id}}'
  )
  exec_graphql 'alice' 'on-chain-address-create' "$variables"
  on_chain_address_created="$(graphql_output '.data.onChainAddressCreate.address')"
  [[ "${on_chain_address_created}" != "null" ]] || exit 1

  # Execute onchain send and check for transaction
  bitcoin_cli sendtoaddress "$on_chain_address_created" "$amount"
  retry 15 1 check_for_incoming_broadcast 'alice' "$on_chain_address_created"

  # Check pending transactions for address
  address_pending_txns_variables=$(
  jq -n \
  --arg address "$on_chain_address_created" \
  '{"address": $address}'
  )
  exec_graphql 'alice' 'pending-incoming-transactions-by-address' "$address_pending_txns_variables"
  pending_txns_for_address=$(
    graphql_output '
      .data.me.defaultAccount.wallets[]
      | select(.__typename == "UsdWallet")
      .pendingIncomingTransactionsByAddress'
  )
  pending_txns_for_address_length="$(echo $pending_txns_for_address | jq -r 'length')"
  [[ "$pending_txns_for_address_length" == "1" ]] || exit 1
  address_from_pending_txns="$(echo $pending_txns_for_address | jq -r '.[0].initiationVia.address')"
  [[ "$address_from_pending_txns" == "$on_chain_address_created" ]]

  # Check pending transactions for account
  exec_graphql 'alice' 'pending-incoming-transactions'
  pending_txns_for_account=$(
    graphql_output '
      .data.me.defaultAccount.pendingIncomingTransactions'
  )
  pending_txns_for_account_length="$(echo $pending_txns_for_account | jq -r 'length')"
  [[ "$pending_txns_for_account_length" == "1" ]] || exit 1

  bitcoin_cli -generate 2
  retry 30 1 check_for_onchain_initiated_settled 'alice' "$on_chain_address_created" 1

  # Ensure no pending transactions for account
  exec_graphql 'alice' 'pending-incoming-transactions'
  pending_txns_for_account=$(
    graphql_output '
      .data.me.defaultAccount.pendingIncomingTransactions'
  )
  pending_txns_for_account_length="$(echo $pending_txns_for_account | jq -r 'length')"
  [[ "$pending_txns_for_account_length" == "0" ]] || exit 1  
}

@test "onchain-receive: process received batch transaction" {
  alice_btc_wallet_name="alice.btc_wallet_id"
  bob_usd_wallet_name="bob.usd_wallet_id"
  amount="0.01"

  # Create Alice addresses
  alice_variables=$(
    jq -n \
    --arg wallet_id "$(read_value $alice_btc_wallet_name)" \
    '{input: {walletId: $wallet_id}}'
  )

  exec_graphql 'alice' 'on-chain-address-create' "$alice_variables"
  alice_address_1="$(graphql_output '.data.onChainAddressCreate.address')"
  [[ "${alice_address_1}" != "null" ]] || exit 1

  exec_graphql 'alice' 'on-chain-address-create' "$alice_variables"
  alice_address_2="$(graphql_output '.data.onChainAddressCreate.address')"
  [[ "${alice_address_2}" != "null" ]] || exit 1

  # Create Bob addresses
  bob_variables=$(
    jq -n \
    --arg wallet_id "$(read_value $bob_usd_wallet_name)" \
    '{input: {walletId: $wallet_id}}'
  )

  exec_graphql 'bob' 'on-chain-address-create' "$bob_variables"
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

  retry 15 1 check_for_incoming_broadcast 'alice' "$alice_address_1"
  retry 3 1 check_for_incoming_broadcast 'alice' "$alice_address_2"
  retry 3 1 check_for_incoming_broadcast 'bob' "$bob_address_1"

  # Check 'pendingIncomingBalance' query
  exec_graphql 'alice' 'wallets-for-account'
  alice_btc_pending_incoming=$(graphql_output '
    .data.me.defaultAccount.wallets[]
    | select(.walletCurrency == "BTC")
    .pendingIncomingBalance
  ')
  [[ "$alice_btc_pending_incoming" -gt 0 ]] || exit 1

  exec_graphql 'bob' 'wallets-for-account'
  bob_usd_pending_incoming=$(graphql_output '
    .data.me.defaultAccount.wallets[]
    | select(.walletCurrency == "USD")
    .pendingIncomingBalance
  ')
  [[ "$bob_usd_pending_incoming" -gt 0 ]] || exit 1

  # Mine transactions
  bitcoin_cli -generate 2
  retry 15 1 check_for_onchain_initiated_settled 'alice' "$alice_address_1" 2
  retry 3 1 check_for_onchain_initiated_settled 'alice' "$alice_address_2" 2
  retry 3 1 check_for_onchain_initiated_settled 'bob' "$bob_address_1" 1
}

@test "onchain-receive: process received batch transaction via legacy lnd" {
  alice_btc_wallet_name="alice.btc_wallet_id"
  alice_usd_wallet_name="alice.usd_wallet_id"
  bob_btc_wallet_name="bob.btc_wallet_id"
  amount="0.01"

  # Get initial balances
  lnd1_initial_balance=$(lnd_cli walletbalance | jq -r '.confirmed_balance')
  bria_initial_balance=$(bria_cli wallet-balance -w dev-wallet | jq -r '.effectiveSettled')

  # Create Alice addresses
  alice_btc_address="$(create_new_lnd_onchain_address $alice_btc_wallet_name)"
  current_btc_address_variables=$(
    jq -n \
    --arg wallet_id "$(read_value $alice_btc_wallet_name)" \
    '{input: {walletId: $wallet_id}}'
  )
  exec_graphql 'alice' 'on-chain-address-current' "$current_btc_address_variables"
  on_chain_address_current="$(graphql_output '.data.onChainAddressCurrent.address')"
  [[ "${on_chain_address_current}" != "null" ]] || exit 1
  [[ "${alice_btc_address}" == "${on_chain_address_current}" ]] || exit 1

  alice_usd_address="$(create_new_lnd_onchain_address $alice_usd_wallet_name)"
  current_usd_address_variables=$(
    jq -n \
    --arg wallet_id "$(read_value $alice_usd_wallet_name)" \
    '{input: {walletId: $wallet_id}}'
  )
  exec_graphql 'alice' 'on-chain-address-current' "$current_usd_address_variables"
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
  exec_graphql 'bob' 'on-chain-address-current' "$current_btc_address_variables"
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

  retry 45 1 check_for_incoming_broadcast 'alice' "$alice_btc_address"
  retry 3 1 check_for_incoming_broadcast 'alice' "$alice_usd_address"
  retry 3 1 check_for_incoming_broadcast 'bob' "$bob_btc_address"

  # Mine transactions
  # Note: subscription event operates in a delayed way from lnd1 state
  bitcoin_cli -generate 2
  sleep 1
  bitcoin_cli -generate 2
  sleep 1
  bitcoin_cli -generate 2

  retry 15 1 check_for_onchain_initiated_settled 'alice' "$alice_btc_address" 10
  retry 3 1 check_for_onchain_initiated_settled 'alice' "$alice_usd_address" 10
  retry 3 1 check_for_onchain_initiated_settled 'bob' "$bob_btc_address" 10

  # Check final balances
  lnd1_final_balance=$(lnd_cli walletbalance | jq -r '.confirmed_balance')
  [[ "$lnd1_final_balance" -gt "$lnd1_initial_balance" ]] || exit 1
  bria_final_balance=$( bria_cli wallet-balance -w dev-wallet | jq -r '.effectiveSettled')
  [[ "$bria_final_balance" == "$bria_initial_balance" ]] || exit 1
}
