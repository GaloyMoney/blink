#!/usr/bin/env bats

load "../../helpers/cli.bash"
load "../../helpers/user.bash"
load "../../helpers/onchain.bash"
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

generate_trigger_logs() {
  tilt_cli logs api-trigger > .e2e-trigger.log
}

grep_in_trigger_logs() {
  generate_trigger_logs
  grep $1 .e2e-trigger.log
}

wait_for_new_payout_id() {
  prior_id="$1"

  payout_id=$(
    grep_in_trigger_logs "sequence.*payout_submitted" \
    | tail -n 1 \
    | jq -r '.id'
  )

  if [[ "$payout_id" == "$prior_id" ]]; then
    return 1
  else
    return 0
  fi
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

  fund_user_onchain 'alice' 'usd_wallet' # bcoz depleted
}

@test "onchain-send: settle intraledger, with no contacts check" {
  alice_btc_wallet_name="alice.btc_wallet_id"
  alice_usd_wallet_name="alice.usd_wallet_id"

  bob_btc_wallet_name="bob.btc_wallet_id"

  # Check is not contact before send
  run is_contact 'alice' 'bob'
  [[ "$status" -ne "0" ]] || exit 1
  run is_contact 'bob' 'alice'
  [[ "$status" -ne "0" ]] || exit 1

  # mutation: onChainPaymentSend, alice btc -> bob btc
  variables=$(
    jq -n \
    --arg wallet_id "$(read_value $bob_btc_wallet_name)" \
    '{input: {walletId: $wallet_id}}'
  )
  exec_graphql 'bob' 'on-chain-address-create' "$variables"
  on_chain_payment_send_address="$(graphql_output '.data.onChainAddressCreate.address')"
  [[ "${on_chain_payment_send_address}" != "null" ]] || exit 1

  variables=$(
    jq -n \
    --arg wallet_id "$(read_value $alice_btc_wallet_name)" \
    --arg address "$on_chain_payment_send_address" \
    --arg amount 12345 \
    '{input: {walletId: $wallet_id, address: $address, amount: $amount}}'
  )
  exec_graphql 'alice' 'on-chain-payment-send' "$variables"
  send_status="$(graphql_output '.data.onChainPaymentSend.status')"
  [[ "${send_status}" = "SUCCESS" ]] || exit 1

  exec_graphql 'alice' 'transactions' '{"first": 1}'
  settled_status="$(get_from_transaction_by_address $on_chain_payment_send_address '.status')"
  [[ "${settled_status}" = "SUCCESS" ]] || exit 1

  # Check is not contact after send
  run is_contact 'alice' 'bob'
  [[ "$status" -ne "0" ]] || exit 1
  run is_contact 'bob' 'alice'
  [[ "$status" -ne "0" ]] || exit 1

  # mutation: onChainUsdPaymentSend, alice usd -> bob btc
  variables=$(
    jq -n \
    --arg wallet_id "$(read_value $bob_btc_wallet_name)" \
    '{input: {walletId: $wallet_id}}'
  )
  exec_graphql 'bob' 'on-chain-address-create' "$variables"
  on_chain_usd_payment_send_address="$(graphql_output '.data.onChainAddressCreate.address')"
  [[ "${on_chain_usd_payment_send_address}" != "null" ]] || exit 1

  variables=$(
    jq -n \
    --arg wallet_id "$(read_value $alice_usd_wallet_name)" \
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

  # mutation: onChainUsdPaymentSendAsBtcDenominated, alice usd -> bob btc
  variables=$(
    jq -n \
    --arg wallet_id "$(read_value $bob_btc_wallet_name)" \
    '{input: {walletId: $wallet_id}}'
  )
  exec_graphql 'bob' 'on-chain-address-create' "$variables"
  on_chain_usd_payment_send_as_btc_denominated_address="$(graphql_output '.data.onChainAddressCreate.address')"
  [[ "${on_chain_usd_payment_send_as_btc_denominated_address}" != "null" ]] || exit 1

  variables=$(
    jq -n \
    --arg wallet_id "$(read_value $alice_usd_wallet_name)" \
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

  # mutation: onChainPaymentSendAll, bob btc -> alice btc
  variables=$(
    jq -n \
    --arg wallet_id "$(read_value $alice_btc_wallet_name)" \
    '{input: {walletId: $wallet_id}}'
  )
  exec_graphql 'alice' 'on-chain-address-create' "$variables"
  on_chain_payment_send_all_address="$(graphql_output '.data.onChainAddressCreate.address')"
  [[ "${on_chain_payment_send_all_address}" != "null" ]] || exit 1

  variables=$(
    jq -n \
    --arg wallet_id "$(read_value $bob_btc_wallet_name)" \
    --arg address "$on_chain_payment_send_all_address" \
    '{input: {walletId: $wallet_id, address: $address}}'
  )
  exec_graphql 'bob' 'on-chain-payment-send-all' "$variables"
  send_status="$(graphql_output '.data.onChainPaymentSendAll.status')"
  [[ "${send_status}" = "SUCCESS" ]] || exit 1

  exec_graphql 'bob' 'transactions' '{"first": 1}'
  settled_status="$(get_from_transaction_by_address $on_chain_payment_send_all_address '.status')"
  [[ "${settled_status}" = "SUCCESS" ]] || exit 1

  fund_user_onchain 'bob' 'btc_wallet' # bcoz depleted
}

@test "onchain-send: settle onchain" {
  btc_wallet_name="alice.btc_wallet_id"
  usd_wallet_name="alice.usd_wallet_id"

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
  exec_graphql 'alice' 'on-chain-payment-send' "$variables"
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
  exec_graphql 'alice' 'on-chain-usd-payment-send' "$variables"
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
  exec_graphql 'alice' 'on-chain-usd-payment-send-as-btc-denominated' "$variables"
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
  exec_graphql 'alice' 'on-chain-payment-send-all' "$variables"
  send_status="$(graphql_output '.data.onChainPaymentSendAll.status')"
  [[ "${send_status}" = "SUCCESS" ]] || exit 1

  # CHECK FOR TRANSACTIONS IN DATABASE
  # ----------

  # Check for broadcast of last send
  retry 15 1 check_for_outgoing_broadcast 'alice' "$on_chain_payment_send_all_address" 4
  retry 3 1 check_for_outgoing_broadcast 'alice' "$on_chain_usd_payment_send_as_btc_denominated_address" 4
  retry 3 1 check_for_outgoing_broadcast 'alice' "$on_chain_usd_payment_send_address" 4
  retry 3 1 check_for_outgoing_broadcast 'alice' "$on_chain_payment_send_address" 4

  # Mine all
  bitcoin_cli -generate 2

  # Check for settled
  retry 15 1 check_for_onchain_initiated_settled 'alice' "$on_chain_payment_send_all_address" 4
  retry 3 1 check_for_onchain_initiated_settled 'alice' "$on_chain_usd_payment_send_as_btc_denominated_address" 4
  retry 3 1 check_for_onchain_initiated_settled 'alice' "$on_chain_usd_payment_send_address" 4
  retry 3 1 check_for_onchain_initiated_settled 'alice' "$on_chain_payment_send_address" 4
}

@test "onchain-send: get fee for external address" {
  btc_wallet_name="alice.btc_wallet_id"
  usd_wallet_name="alice.usd_wallet_id"

  # EXECUTE GQL FEE ESTIMATES
  # ----------

  address=$(bitcoin_cli getnewaddress)
  [[ "${address}" != "null" ]] || exit 1

  # mutation: onChainTxFee
  variables=$(
    jq -n \
    --arg wallet_id "$(read_value $btc_wallet_name)" \
    --arg address "$address" \
    --arg amount 12345 \
    '{walletId: $wallet_id, address: $address, amount: $amount}'
  )
  exec_graphql 'alice' 'on-chain-tx-fee' "$variables"
  amount="$(graphql_output '.data.onChainTxFee.amount')"
  [[ "${amount}" -gt 0 ]] || exit 1

  # mutation: onChainUsdTxFee
  variables=$(
    jq -n \
    --arg wallet_id "$(read_value $usd_wallet_name)" \
    --arg address "$address" \
    --arg amount 200 \
    '{walletId: $wallet_id, address: $address, amount: $amount}'
  )
  exec_graphql 'alice' 'on-chain-usd-tx-fee' "$variables"
  amount="$(graphql_output '.data.onChainUsdTxFee.amount')"
  [[ "${amount}" -gt 0 ]] || exit 1

  # mutation: onChainUsdTxFeeAsBtcDenominated
  variables=$(
    jq -n \
    --arg wallet_id "$(read_value $usd_wallet_name)" \
    --arg address "$address" \
    --arg amount 12345 \
    '{walletId: $wallet_id, address: $address, amount: $amount}'
  )
  exec_graphql 'alice' 'on-chain-usd-tx-fee-as-btc-denominated' "$variables"
  amount="$(graphql_output '.data.onChainUsdTxFeeAsBtcDenominated.amount')"
  [[ "${amount}" -gt 0 ]] || exit 1
}

@test "onchain-send: get fee for internal address" {
  btc_wallet_name="alice.btc_wallet_id"
  usd_wallet_name="alice.usd_wallet_id"

  btc_recipient_wallet_name="bob.btc_wallet_id"

  # EXECUTE GQL FEE ESTIMATES
  # ----------

  variables=$(
    jq -n \
    --arg wallet_id "$(read_value $btc_recipient_wallet_name)" \
    '{input: {walletId: $wallet_id}}'
  )
  exec_graphql 'bob' 'on-chain-address-create' "$variables"
  address="$(graphql_output '.data.onChainAddressCreate.address')"
  [[ "${address}" != "null" ]] || exit 1

  # mutation: onChainTxFee
  variables=$(
    jq -n \
    --arg wallet_id "$(read_value $btc_wallet_name)" \
    --arg address "$address" \
    --arg amount 12345 \
    '{walletId: $wallet_id, address: $address, amount: $amount}'
  )
  exec_graphql 'alice' 'on-chain-tx-fee' "$variables"
  amount="$(graphql_output '.data.onChainTxFee.amount')"
  [[ "${amount}" == 0 ]] || exit 1

  # mutation: onChainUsdTxFee
  variables=$(
    jq -n \
    --arg wallet_id "$(read_value $usd_wallet_name)" \
    --arg address "$address" \
    --arg amount 200 \
    '{walletId: $wallet_id, address: $address, amount: $amount}'
  )
  exec_graphql 'alice' 'on-chain-usd-tx-fee' "$variables"
  amount="$(graphql_output '.data.onChainUsdTxFee.amount')"
  [[ "${amount}" == 0 ]] || exit 1

  # mutation: onChainUsdTxFeeAsBtcDenominated
  variables=$(
    jq -n \
    --arg wallet_id "$(read_value $usd_wallet_name)" \
    --arg address "$address" \
    --arg amount 12345 \
    '{walletId: $wallet_id, address: $address, amount: $amount}'
  )
  exec_graphql 'alice' 'on-chain-usd-tx-fee-as-btc-denominated' "$variables"
  amount="$(graphql_output '.data.onChainUsdTxFeeAsBtcDenominated.amount')"
  [[ "${amount}" == 0 ]] || exit 1
}

@test "onchain-send: cancel external payout" {
  payout_id=$(bria_cli submit-payout \
    -w dev-wallet \
    -q dev-queue \
    -d bcrt1qs758ursh4q9z627kt3pp5yysm78ddny6txaqgw \
    -a 1000000000 \
    | jq -r '.id'
  )
  [[ "${payout_id}" != "null" ]] || exit 1

  retry 10 1 grep_in_trigger_logs "sequence.*payout_submitted.*${payout_id}"

  last_sequence=$(
    grep "sequence" .e2e-trigger.log \
    | tail -n 1 \
    | jq -r '.sequence'
  )
  [[ -n "${last_sequence}" ]] || exit 1

  bria_cli cancel-payout -i ${payout_id}
  retry 10 1 grep_in_trigger_logs "sequence.*payout_cancelled.*${payout_id}"
}

@test "onchain-send: cancel internal payout" {
  btc_wallet_name="alice.btc_wallet_id"
  usd_wallet_name="alice.usd_wallet_id"

  # Fetch prior payout_id
  prior_id=$(
    grep_in_trigger_logs "sequence.*payout_submitted" \
    | tail -n 1 \
    | jq -r '.id'
  )

  # Initiate internal payout
  on_chain_payment_send_address=$(bitcoin_cli getnewaddress)
  [[ "${on_chain_payment_send_address}" != "null" ]] || exit 1

  variables=$(
    jq -n \
    --arg wallet_id "$(read_value $btc_wallet_name)" \
    --arg address "$on_chain_payment_send_address" \
    --arg amount 12345 \
    '{input: {walletId: $wallet_id, address: $address, amount: $amount}}'
  )
  exec_graphql 'alice' 'on-chain-payment-send' "$variables"
  send_status="$(graphql_output '.data.onChainPaymentSend.status')"
  [[ "${send_status}" = "SUCCESS" ]] || exit 1

  # Parse payout_id value
  retry 10 1 wait_for_new_payout_id "$prior_id"
  payout_id=$(
    grep_in_trigger_logs "sequence.*payout_submitted" \
    | tail -n 1 \
    | jq -r '.id'
  )

  # Check for cancelled event
  bria_cli cancel-payout -i ${payout_id}
  retry 10 1 grep_in_trigger_logs "sequence.*payout_cancelled.*${payout_id}"
}
