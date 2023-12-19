#!/usr/bin/env bats

load "../../helpers/cli.bash"
load "../../helpers/ledger.bash"
load "../../helpers/ln.bash"
load "../../helpers/onchain.bash"
load "../../helpers/user.bash"

ALICE='alice'

setup_file() {
  lnd1_balance=$(lnd_cli channelbalance | jq -r '.balance')
  if [[ $lnd1_balance == "0" ]]; then
    create_user 'lnd_funding'
    fund_user_lightning 'lnd_funding' 'lnd_funding.btc_wallet_id' '5000000'
  fi

  create_user "$ALICE"
  fund_user_onchain "$ALICE" 'btc_wallet'
}

teardown() {
  if [[ "$(balance_for_check)" != 0 ]]; then
    fail "Error: balance_for_check failed"
  fi
}

btc_amount=1000
usd_amount=50

@test "ln-send: lightning settled - lnInvoicePaymentSend from btc" {
  token_name="$ALICE"
  btc_wallet_name="$token_name.btc_wallet_id"

  initial_lnd1_balance=$(lnd_cli channelbalance | jq -r '.balance')

  invoice_response="$(lnd_outside_cli addinvoice --amt $btc_amount)"
  payment_request="$(echo $invoice_response | jq -r '.payment_request')"
  payment_hash=$(echo $invoice_response | jq -r '.r_hash')
  [[ "${payment_request}" != "null" ]] || exit 1

  variables=$(
    jq -n \
    --arg wallet_id "$(read_value $btc_wallet_name)" \
    --arg payment_request "$payment_request" \
    '{input: {walletId: $wallet_id, paymentRequest: $payment_request}}'
  )

  exec_graphql "$token_name" 'ln-invoice-fee-probe' "$variables"
  fee_amount="$(graphql_output '.data.lnInvoiceFeeProbe.amount')"
  [[ "${fee_amount}" = "0" ]] || exit 1

  exec_graphql "$token_name" 'ln-invoice-payment-send' "$variables"
  send_status="$(graphql_output '.data.lnInvoicePaymentSend.status')"
  [[ "${send_status}" = "SUCCESS" ]] || exit 1

  transaction_payment_hash="$(graphql_output '.data.lnInvoicePaymentSend.transaction.initiationVia.paymentHash')"
  [[ "${transaction_payment_hash}" == "${payment_hash}" ]] || exit 1

  transaction_payment_request="$(graphql_output '.data.lnInvoicePaymentSend.transaction.initiationVia.paymentRequest')"
  [[ "${transaction_payment_request}" == "${payment_request}" ]] || exit 1

  # Check for settled
  retry 15 1 check_for_ln_initiated_settled "$token_name" "$payment_hash"

  final_lnd1_balance=$(lnd_cli channelbalance | jq -r '.balance')
  lnd1_diff="$(( $initial_lnd1_balance - $final_lnd1_balance ))"
  [[ "$lnd1_diff" == "$btc_amount" ]] || exit 1
}
