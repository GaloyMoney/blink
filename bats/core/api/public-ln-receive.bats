#!/usr/bin/env bats

load "../../helpers/user.bash"
load "../../helpers/onchain.bash"
load "../../helpers/_common.bash"

setup_file() {
  create_user 'alice'
  user_update_username 'alice'
  fund_user_onchain 'alice' 'btc_wallet'
  fund_user_onchain 'alice' 'usd_wallet'
}

btc_amount=1000
usd_amount=50

@test "public-ln-receive: account details - can fetch with btc default wallet-id from username" {
  btc_wallet_name="alice.btc_wallet_id"
  usd_wallet_name="alice.usd_wallet_id"

  # Change default wallet to btc
  variables=$(
    jq -n \
    --arg wallet_id "$(read_value $btc_wallet_name)" \
    '{input: {walletId: $wallet_id}}'
  )
  exec_graphql 'alice' 'account-update-default-wallet-id' "$variables"
  updated_wallet_id="$(graphql_output '.data.accountUpdateDefaultWalletId.account.defaultWalletId')"
  [[ "$updated_wallet_id" == "$(read_value $btc_wallet_name)" ]] || exit 1

  # Fetch btc-wallet-id from username
  variables=$(
    jq -n \
    --arg username 'alice' \
    '{username: $username}'
  )
  exec_graphql 'anon' 'account-default-wallet' "$variables"
  receiver_wallet_id="$(graphql_output '.data.accountDefaultWallet.id')"
  [[ "$receiver_wallet_id" == "$(read_value $btc_wallet_name)" ]] || exit 1

  # Fetch usd-wallet-id from username
  variables=$(
    jq -n \
    --arg username 'alice' \
    '{username: $username, walletCurrency: "USD"}'
  )
  exec_graphql 'anon' 'account-default-wallet' "$variables"
  receiver_wallet_id="$(graphql_output '.data.accountDefaultWallet.id')"
  [[ "$receiver_wallet_id" == "$(read_value $usd_wallet_name)" ]] || exit 1
}