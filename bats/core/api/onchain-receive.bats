#!/usr/bin/env bats

load "../../helpers/cli.bash"
load "../../helpers/user.bash"
load "../../helpers/funding/onchain.bash"
load "../../helpers/funding/wallet.bash"

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
  retry 15 1 check_for_broadcast 'alice' "$on_chain_address_created_1" 1

  # Create address and broadcast transaction 2
  exec_graphql 'alice' 'on-chain-address-create' "$variables"
  on_chain_address_created_2="$(graphql_output '.data.onChainAddressCreate.address')"
  [[ "${on_chain_address_created_2}" != "null" ]] || exit 1

  bitcoin_cli sendtoaddress "$on_chain_address_created_2" "$amount"
  retry 15 1 check_for_broadcast 'alice' "$on_chain_address_created_2" 1

  # Check pending transactions for address 1
  address_1_pending_txns_variables=$(
  jq -n \
  --arg address "$on_chain_address_created_1" \
  '{"address": $address}'
  )
  exec_graphql 'alice' 'pending-transactions-by-address' "$address_1_pending_txns_variables"
  pending_txns_for_address_1=$(
    graphql_output '
      .data.me.defaultAccount.wallets[]
      | select(.__typename == "BTCWallet")
      .pendingTransactionsByAddress'
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
  exec_graphql 'alice' 'pending-transactions-by-address' "$address_2_pending_txns_variables"
  pending_txns_for_address_2=$(
    graphql_output '
      .data.me.defaultAccount.wallets[]
      | select(.__typename == "BTCWallet")
      .pendingTransactionsByAddress'
  )
  pending_txns_for_address_2_length="$(echo $pending_txns_for_address_2 | jq -r 'length')"
  [[ "$pending_txns_for_address_2_length" == "1" ]] || exit 1
  address_2_from_pending_txns="$(echo $pending_txns_for_address_2 | jq -r '.[0].initiationVia.address')"
  [[ "$address_2_from_pending_txns" == "$on_chain_address_created_2" ]]

  # Check pending transactions for account
  exec_graphql 'alice' 'pending-transactions'
  pending_txns_for_account=$(
    graphql_output '
      .data.me.defaultAccount.pendingTransactions'
  )
  pending_txns_for_account_length="$(echo $pending_txns_for_account | jq -r 'length')"
  [[ "$pending_txns_for_account_length" == "2" ]] || exit 1
  
  # Mine transactions
  bitcoin_cli -generate 2
  retry 15 1 check_for_onchain_initiated_settled 'alice' "$on_chain_address_created_1" 2
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
      .data.me.defaultAccount.pendingTransactions'
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
  retry 15 1 check_for_broadcast 'alice' "$on_chain_address_created" 1

  # Check pending transactions for address
  address_pending_txns_variables=$(
  jq -n \
  --arg address "$on_chain_address_created" \
  '{"address": $address}'
  )
  exec_graphql 'alice' 'pending-transactions-by-address' "$address_pending_txns_variables"
  pending_txns_for_address=$(
    graphql_output '
      .data.me.defaultAccount.wallets[]
      | select(.__typename == "UsdWallet")
      .pendingTransactionsByAddress'
  )
  pending_txns_for_address_length="$(echo $pending_txns_for_address | jq -r 'length')"
  [[ "$pending_txns_for_address_length" == "1" ]] || exit 1
  address_from_pending_txns="$(echo $pending_txns_for_address | jq -r '.[0].initiationVia.address')"
  [[ "$address_from_pending_txns" == "$on_chain_address_created" ]]

  # Check pending transactions for account
  exec_graphql 'alice' 'pending-transactions'
  pending_txns_for_account=$(
    graphql_output '
      .data.me.defaultAccount.pendingTransactions'
  )
  pending_txns_for_account_length="$(echo $pending_txns_for_account | jq -r 'length')"
  [[ "$pending_txns_for_account_length" == "1" ]] || exit 1

  bitcoin_cli -generate 2
  retry 15 1 check_for_onchain_initiated_settled 'alice' "$on_chain_address_created" 1

  # Ensure no pending transactions for account
  exec_graphql 'alice' 'pending-transactions'
  pending_txns_for_account=$(
    graphql_output '
      .data.me.defaultAccount.pendingTransactions'
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

  retry 15 1 check_for_broadcast 'alice' "$alice_address_1" 2
  retry 3 1 check_for_broadcast 'alice' "$alice_address_2" 2
  retry 3 1 check_for_broadcast 'bob' "$bob_address_1" 1

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
