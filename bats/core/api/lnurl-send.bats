#!/usr/bin/env bats

load "../../helpers/cli.bash"
load "../../helpers/user.bash"
load "../../helpers/onchain.bash"
load "../../helpers/wallet.bash"
load "../../helpers/ledger.bash"

setup_file() {\
  create_user 'bob'
  user_update_username 'bob'
  fund_user_onchain 'bob' 'btc_wallet'
  ensure_username_is_present "xyz_zap_receiver"
}

@test "lnurl-send: send to lnurl" {
  btc_wallet_name="bob.btc_wallet_id"

  lnurl="lnurl1dp68gup69uhkcmmrv9kxsmmnwsarxvpsxghjuam9d3kz66mwdamkutmvde6hymrs9au8j7jl0fshqhmjv43k26tkv4eq5ndl2y" # http://localhost:3002/.well-known/lnurlp/xyz_zap_receiver

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
