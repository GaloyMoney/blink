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

  create_user 'bob'
  user_update_username 'bob'
  fund_user_onchain 'bob' 'btc_wallet'
}

@test "lnurl-send: send to lnurl" {
  btc_wallet_name="bob.btc_wallet_id"

  lnurl="invalidlnurl" # To do find a bech32 cli to generate a valid lnurl

  variables=$(
    jq -n \
    --arg wallet_id "$(read_value $btc_wallet_name)" \
    --arg amount 200 \
    --arg lnurl $lnurl \
    '{input: {walletId: $wallet_id, amount: $amount, lnurl: $lnurl }}'
  )
  exec_graphql 'bob' 'lnurl-payment-send' "$variables"
  lnurl_payment_send_status="$(graphql_output '.data.lnurlPaymentSend.status')"
  [[ "${lnurl_payment_send_status}" == "SUCCESS" ]] || exit 1
}
