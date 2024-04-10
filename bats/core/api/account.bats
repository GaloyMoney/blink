load "../../helpers/_common.bash"
load "../../helpers/ln.bash"
load "../../helpers/onchain.bash"
load "../../helpers/user.bash"

setup_file() {
  clear_cache

  create_user_with_metadata 'alice'
  fund_user_onchain 'alice' 'btc_wallet'
  fund_user_onchain 'alice' 'usd_wallet'

  lnd1_balance=$(lnd_cli channelbalance | jq -r '.balance')
  if [[ $lnd1_balance -lt "1000000" ]]; then
    create_user 'lnd_funding'
    fund_user_lightning 'lnd_funding' 'lnd_funding.btc_wallet_id' '5000000'
  fi

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
  local btc_amount=1000
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
  local btc_amount=1000
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

  # Check limits after usd send
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

@test "account: withdrawal limits" {
  # Check initial limits
  exec_graphql 'alice' 'account-limits'
  initial_remaining_limit=$(graphql_output '.data.me.defaultAccount.limits.withdrawal[0].remainingLimit')
  initial_total_limit=$(graphql_output '.data.me.defaultAccount.limits.withdrawal[0].totalLimit')
  [[ "$initial_remaining_limit" == "$initial_total_limit" ]] || exit 1

  # Check limits after btc send
  local btc_amount=1000
  invoice_response="$(lnd_outside_cli addinvoice --amt $btc_amount)"
  payment_request="$(echo $invoice_response | jq -r '.payment_request')"
  [[ "${payment_request}" != "null" ]] || exit 1
  variables=$(
    jq -n \
    --arg wallet_id "$(read_value 'alice.btc_wallet_id')" \
    --arg payment_request "$payment_request" \
    '{input: {walletId: $wallet_id, paymentRequest: $payment_request}}'
  )

  exec_graphql 'alice' 'ln-invoice-payment-send' "$variables"
  send_status="$(graphql_output '.data.lnInvoicePaymentSend.status')"
  [[ "${send_status}" = "SUCCESS" ]] || exit 1

  exec_graphql 'alice' 'account-limits'
  remaining_limit=$(graphql_output '.data.me.defaultAccount.limits.withdrawal[0].remainingLimit')
  total_limit=$(graphql_output '.data.me.defaultAccount.limits.withdrawal[0].totalLimit')
  [[ "$initial_total_limit" == "$total_limit" ]] || exit 1
  [[ "$remaining_limit" -lt "$total_limit" ]] || exit 1
  prior_remaining_limit=$remaining_limit

  # Check limits after usd send
  invoice_response="$(lnd_outside_cli addinvoice --amt $btc_amount)"
  payment_request="$(echo $invoice_response | jq -r '.payment_request')"
  [[ "${payment_request}" != "null" ]] || exit 1
  variables=$(
    jq -n \
    --arg wallet_id "$(read_value 'alice.usd_wallet_id')" \
    --arg payment_request "$payment_request" \
    '{input: {walletId: $wallet_id, paymentRequest: $payment_request}}'
  )

  exec_graphql 'alice' 'ln-invoice-payment-send' "$variables"
  send_status="$(graphql_output '.data.lnInvoicePaymentSend.status')"
  [[ "${send_status}" = "SUCCESS" ]] || exit 1

  exec_graphql 'alice' 'account-limits'
  remaining_limit=$(graphql_output '.data.me.defaultAccount.limits.withdrawal[0].remainingLimit')
  total_limit=$(graphql_output '.data.me.defaultAccount.limits.withdrawal[0].totalLimit')
  [[ "$remaining_limit" -lt "$prior_remaining_limit" ]] || exit 1
}

@test "account: deletion limits" {
  local token_name="bob_to_delete"
  local phone=$(random_phone)

  # create account and delete it
  login_user "$token_name" "$phone"
  exec_graphql "$token_name" 'account-delete'
  delete_success="$(graphql_output '.data.accountDelete.success')"
  [[ "$delete_success" == "true" ]] || exit 1

  # re-create account and delete it a second time
  login_user "$token_name" "$phone"
  exec_graphql "$token_name" 'account-delete'
  delete_success="$(graphql_output '.data.accountDelete.success')"
  [[ "$delete_success" == "true" ]] || exit 1

  # re-create account and fail to delete it
  login_user "$token_name" "$phone"
  exec_graphql "$token_name" 'account-delete'
  delete_success="$(graphql_output '.data.accountDelete.success')"
  error_code="$(graphql_output '.data.accountDelete.errors[0].code')"
  error_msg="$(graphql_output '.data.accountDelete.errors[0].message')"
  [[ "$delete_success" == "false" ]] || exit 1
  [[ "${error_code}" == "OPERATION_RESTRICTED" ]] || exit 1
  [[ "${error_msg}" == *"we're unable to delete your account automatically"* ]] || exit 1
}
