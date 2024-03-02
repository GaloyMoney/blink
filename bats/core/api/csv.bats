#!/usr/bin/env bats

load "../../helpers/callback.bash"
load "../../helpers/cli.bash"
load "../../helpers/ledger.bash"
load "../../helpers/ln.bash"
load "../../helpers/onchain.bash"
load "../../helpers/subscriber.bash"
load "../../helpers/trigger.bash"
load "../../helpers/user.bash"

ALICE='alice'

setup_file() {
  create_user "$ALICE"
  add_callback "$ALICE"
  fund_user_onchain "$ALICE" 'btc_wallet'
}

btc_amount=1000
usd_amount=50

@test "ln-receive: settle via ln for USD wallet, invoice with amount" {
  # Generate invoice
  token_name="$ALICE"
  usd_wallet_name="$token_name.usd_wallet_id"

  variables=$(
    jq -n \
    --arg wallet_id "$(read_value $usd_wallet_name)" \
    --arg amount "$usd_amount" \
    '{input: {walletId: $wallet_id, amount: $amount}}'
  )
  exec_graphql "$token_name" 'ln-usd-invoice-create' "$variables"
  invoice="$(graphql_output '.data.lnUsdInvoiceCreate.invoice')"

  payment_request="$(echo $invoice | jq -r '.paymentRequest')"
  [[ "${payment_request}" != "null" ]] || exit 1
  payment_hash="$(echo $invoice | jq -r '.paymentHash')"
  [[ "${payment_hash}" != "null" ]] || exit 1

  # Receive payment
  lnd_outside_cli payinvoice -f \
    --pay_req "$payment_request"

  # Check for settled
  retry 15 1 check_for_ln_initiated_settled "$token_name" "$payment_hash"
}

@test "testing csv" {
  token_name="$ALICE"
  
  exec_graphql "$token_name" 'wallet-csv-transactions'
  content="$(graphql_output '.data.csvReportGenerate.content')"

  echo "content: $content"

  if [ "$content" = "null" ]; then
    echo "The content is null."
    exit 1
  fi

  if echo "$content" | base64 --decode; then
    decoded_content="$(echo "$content" | base64 --decode)"
    echo "Decoded content: $decoded_content"
  else
    echo "The content is not valid base64 encoded data."
    exit 1
  fi
}
