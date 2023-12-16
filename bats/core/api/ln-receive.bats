#!/usr/bin/env bats

ALICE='alice'

load "../../helpers/callback.bash"
load "../../helpers/ledger.bash"
load "../../helpers/ln.bash"
load "../../helpers/onchain.bash"
load "../../helpers/subscriber.bash"
load "../../helpers/user.bash"

setup_file() {
  create_user "$ALICE"
  add_callback "$ALICE"
  fund_user_onchain "$ALICE" 'btc_wallet'

  subscribe_to "$ALICE" my-updates-sub
  sleep 3
}

teardown_file() {
  stop_subscriber
}

teardown() {
  if [[ "$(balance_for_check)" != 0 ]]; then
    fail "Error: balance_for_check failed"
  fi
}

btc_amount=1000
usd_amount=50

@test "ln-receive: settle via ln for BTC wallet, invoice with amount" {
  token_name="$ALICE"
  btc_wallet_name="$token_name.btc_wallet_id"

  # Check callback events before
  exec_graphql "$token_name" 'default-account'
  account_id="$(graphql_output '.data.me.defaultAccount.id')"
  [[ "$account_id" != "null" ]] || exit 1

  num_callback_events_before=$(cat_callback | grep "$account_id" | wc -l)

  # Generate invoice
  variables=$(
    jq -n \
    --arg wallet_id "$(read_value $btc_wallet_name)" \
    --arg amount "$btc_amount" \
    '{input: {walletId: $wallet_id, amount: $amount}}'
  )
  exec_graphql "$token_name" 'ln-invoice-create' "$variables"
  invoice="$(graphql_output '.data.lnInvoiceCreate.invoice')"

  payment_request="$(echo $invoice | jq -r '.paymentRequest')"
  [[ "${payment_request}" != "null" ]] || exit 1
  payment_hash="$(echo $invoice | jq -r '.paymentHash')"
  [[ "${payment_hash}" != "null" ]] || exit 1

  # Get invoice by hash
  variables=$(
    jq -n \
    --arg wallet_id "$(read_value $btc_wallet_name)" \
    --arg payment_hash "$payment_hash" \
    '{walletId: $wallet_id, paymentHash: $payment_hash}'
  )
  exec_graphql "$token_name" 'invoice-for-wallet-by-payment-hash' "$variables"
  query_payment_hash="$(graphql_output '.data.me.defaultAccount.walletById.invoiceByPaymentHash.paymentHash')"
  invoice_status="$(graphql_output '.data.me.defaultAccount.walletById.invoiceByPaymentHash.paymentStatus')"
  [[ "${query_payment_hash}" == "${payment_hash}" ]] || exit 1
  [[ "${invoice_status}" == "PENDING" ]] || exit 1

  # Receive payment
  lnd_outside_cli payinvoice -f \
    --pay_req "$payment_request"

  # Check for settled
  retry 15 1 check_for_ln_initiated_settled "$token_name" "$payment_hash"

  # Check for subscriber event
  check_for_ln_update "$payment_hash" || exit 1

  # Get transaction by hash
  variables=$(
    jq -n \
    --arg wallet_id "$(read_value $btc_wallet_name)" \
    --arg payment_hash "$payment_hash" \
    '{walletId: $wallet_id, paymentHash: $payment_hash}'
  )

  exec_graphql "$token_name" 'transactions-for-wallet-by-payment-hash' "$variables"

  query_payment_hash="$(graphql_output '.data.me.defaultAccount.walletById.transactionsByPaymentHash[0].initiationVia.paymentHash')"
  [[ "${query_payment_hash}" == "${payment_hash}" ]] || exit 1

  query_payment_request="$(graphql_output '.data.me.defaultAccount.walletById.transactionsByPaymentHash[0].initiationVia.paymentRequest')"
  [[ "${query_payment_request}" == "${payment_request}" ]] || exit 1

  transaction_id="$(graphql_output '.data.me.defaultAccount.walletById.transactionsByPaymentHash[0].id')"

  # Get transaction by tx id
  variables=$(
    jq -n \
    --arg wallet_id "$(read_value $btc_wallet_name)" \
    --arg transaction_id "$transaction_id" \
    '{walletId: $wallet_id, transactionId: $transaction_id}'
  )
  exec_graphql "$token_name" 'transaction-for-wallet-by-id' "$variables"
  query_transaction_id="$(graphql_output '.data.me.defaultAccount.walletById.transactionById.id')"
  [[ "${query_transaction_id}" == "${transaction_id}" ]] || exit 1

  # Ensure invoice status is paid
  variables=$(
    jq -n \
    --arg wallet_id "$(read_value $btc_wallet_name)" \
    --arg payment_hash "$payment_hash" \
    '{walletId: $wallet_id, paymentHash: $payment_hash}'
  )
  exec_graphql "$token_name" 'invoice-for-wallet-by-payment-hash' "$variables"
  invoice_status="$(graphql_output '.data.me.defaultAccount.walletById.invoiceByPaymentHash.paymentStatus')"
  [[ "${invoice_status}" == "PAID" ]] || exit 1

  # Check for callback
  num_callback_events_after=$(cat_callback | grep "$account_id" | wc -l)
  [[ "$num_callback_events_after" -gt "$num_callback_events_before" ]] || exit 1
}
