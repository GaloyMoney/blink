load "../../helpers/_common.bash"
load "../../helpers/onchain.bash"
load "../../helpers/user.bash"

setup_file() {
  clear_cache

  create_user_with_metadata 'alice'
  fund_user_onchain 'alice' 'btc_wallet'
  fund_user_onchain 'alice' 'usd_wallet'

  create_user 'bob'
}

@test "account: sets username" {
  suffix="$RANDOM"
  username_to_set=$"alice_$suffix"
  username_to_set_upper=$"Alice_$suffix"

  # Sets a username
  local variables=$(
    jq -n \
    --arg username "$username_to_set" \
    '{input: {username: $username}}'
  )
  exec_graphql 'alice' 'user-update-username' "$variables"
  num_errors="$(graphql_output '.data.userUpdateUsername.errors | length')"
  [[ "$num_errors" == "0" ]] || exit 1
}

@test "account: convert limits" {
  # Check initial limits
  exec_graphql 'alice' 'account-limits'
  initial_remaining_limit=$(graphql_output '.data.me.defaultAccount.limits.convert[0].remainingLimit')
  initial_total_limit=$(graphql_output '.data.me.defaultAccount.limits.convert[0].totalLimit')
  [[ "$initial_remaining_limit" == "$initial_total_limit" ]] || exit 1

  # Check limits after btc conversion
  local btc_amount=5000
  variables=$(
    jq -n \
    --arg wallet_id "$(read_value 'alice.btc_wallet_id')" \
    --arg recipient_wallet_id "$(read_value 'alice.usd_wallet_id')" \
    --arg amount "$btc_amount" \
    '{input: {walletId: $wallet_id, recipientWalletId: $recipient_wallet_id, amount: $amount}}'
  )
  exec_graphql 'alice' 'intraledger-payment-send' "$variables"
  send_status="$(graphql_output '.data.intraLedgerPaymentSend.status')"
  [[ "${send_status}" = "SUCCESS" ]]

  exec_graphql 'alice' 'account-limits'
  remaining_limit=$(graphql_output '.data.me.defaultAccount.limits.convert[0].remainingLimit')
  total_limit=$(graphql_output '.data.me.defaultAccount.limits.convert[0].totalLimit')
  [[ "$initial_total_limit" == "$total_limit" ]] || exit 1
  [[ "$remaining_limit" -lt "$total_limit" ]] || exit 1
  prior_remaining_limit=$remaining_limit

  # Check limits after usd conversion
  local usd_amount=20
  variables=$(
    jq -n \
    --arg wallet_id "$(read_value 'alice.usd_wallet_id')" \
    --arg recipient_wallet_id "$(read_value 'alice.btc_wallet_id')" \
    --arg amount "$usd_amount" \
    '{input: {walletId: $wallet_id, recipientWalletId: $recipient_wallet_id, amount: $amount}}'
  )
  exec_graphql 'alice' 'intraledger-usd-payment-send' "$variables"
  send_status="$(graphql_output '.data.intraLedgerUsdPaymentSend.status')"
  [[ "${send_status}" = "SUCCESS" ]]

  exec_graphql 'alice' 'account-limits'
  remaining_limit=$(graphql_output '.data.me.defaultAccount.limits.convert[0].remainingLimit')
  total_limit=$(graphql_output '.data.me.defaultAccount.limits.convert[0].totalLimit')
  [[ "$remaining_limit" -lt "$prior_remaining_limit" ]] || exit 1
}

@test "account: intraledger limits" {
  # Check initial limits
  exec_graphql 'alice' 'account-limits'
  initial_remaining_limit=$(graphql_output '.data.me.defaultAccount.limits.internalSend[0].remainingLimit')
  initial_total_limit=$(graphql_output '.data.me.defaultAccount.limits.internalSend[0].totalLimit')
  [[ "$initial_remaining_limit" == "$initial_total_limit" ]] || exit 1

  # Check limits after btc send
  local btc_amount=5000
  variables=$(
    jq -n \
    --arg wallet_id "$(read_value 'alice.btc_wallet_id')" \
    --arg recipient_wallet_id "$(read_value 'bob.btc_wallet_id')" \
    --arg amount "$btc_amount" \
    '{input: {walletId: $wallet_id, recipientWalletId: $recipient_wallet_id, amount: $amount}}'
  )
  exec_graphql 'alice' 'intraledger-payment-send' "$variables"
  send_status="$(graphql_output '.data.intraLedgerPaymentSend.status')"
  [[ "${send_status}" = "SUCCESS" ]]

  exec_graphql 'alice' 'account-limits'
  remaining_limit=$(graphql_output '.data.me.defaultAccount.limits.internalSend[0].remainingLimit')
  total_limit=$(graphql_output '.data.me.defaultAccount.limits.internalSend[0].totalLimit')
  [[ "$initial_total_limit" == "$total_limit" ]] || exit 1
  [[ "$remaining_limit" -lt "$total_limit" ]] || exit 1
  prior_remaining_limit=$remaining_limit

  # Check limits after usd conversion
  local usd_amount=20
  variables=$(
    jq -n \
    --arg wallet_id "$(read_value 'alice.usd_wallet_id')" \
    --arg recipient_wallet_id "$(read_value 'bob.btc_wallet_id')" \
    --arg amount "$usd_amount" \
    '{input: {walletId: $wallet_id, recipientWalletId: $recipient_wallet_id, amount: $amount}}'
  )
  exec_graphql 'alice' 'intraledger-usd-payment-send' "$variables"
  send_status="$(graphql_output '.data.intraLedgerUsdPaymentSend.status')"
  [[ "${send_status}" = "SUCCESS" ]]

  exec_graphql 'alice' 'account-limits'
  remaining_limit=$(graphql_output '.data.me.defaultAccount.limits.internalSend[0].remainingLimit')
  total_limit=$(graphql_output '.data.me.defaultAccount.limits.internalSend[0].totalLimit')
  [[ "$remaining_limit" -lt "$prior_remaining_limit" ]] || exit 1
}
