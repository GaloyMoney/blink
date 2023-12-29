#!/usr/bin/env bats

load "../../helpers/_common.bash"
load "../../helpers/cli.bash"
load "../../helpers/ledger.bash"
load "../../helpers/subscriber.bash"
load "../../helpers/user.bash"

ALICE='alice'

setup_file() {
  clear_cache

  create_user "$ALICE"
  user_update_username "$ALICE"
}

teardown() {
  if [[ "$(balance_for_check)" != 0 ]]; then
    fail "Error: balance_for_check failed"
  fi
}

btc_amount=1000
usd_amount=50

@test "public-ln-receive: account details - can fetch with btc default wallet-id from username" {
  token_name=$ALICE
  btc_wallet_name="$token_name.btc_wallet_id"
  usd_wallet_name="$token_name.usd_wallet_id"
  local username="$(read_value $token_name.username)"

  # Change default wallet to btc
  variables=$(
    jq -n \
    --arg wallet_id "$(read_value $btc_wallet_name)" \
    '{input: {walletId: $wallet_id}}'
  )
  exec_graphql "$token_name" 'account-update-default-wallet-id' "$variables"
  updated_wallet_id="$(graphql_output '.data.accountUpdateDefaultWalletId.account.defaultWalletId')"
  [[ "$updated_wallet_id" == "$(read_value $btc_wallet_name)" ]] || exit 1

  # Fetch btc-wallet-id from username
  variables=$(
    jq -n \
    --arg username "$username" \
    '{username: $username}'
  )
  exec_graphql 'anon' 'account-default-wallet' "$variables"
  receiver_wallet_id="$(graphql_output '.data.accountDefaultWallet.id')"
  [[ "$receiver_wallet_id" == "$(read_value $btc_wallet_name)" ]] || exit 1

  # Fetch usd-wallet-id from username
  variables=$(
    jq -n \
    --arg username "$username" \
    '{username: $username, walletCurrency: "USD"}'
  )
  exec_graphql 'anon' 'account-default-wallet' "$variables"
  receiver_wallet_id="$(graphql_output '.data.accountDefaultWallet.id')"
  [[ "$receiver_wallet_id" == "$(read_value $usd_wallet_name)" ]] || exit 1
}
