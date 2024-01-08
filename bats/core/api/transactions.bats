#!/usr/bin/env bats

load "../../helpers/_common.bash"
load "../../helpers/onchain.bash"
load "../../helpers/user.bash"

setup_file() {
  clear_cache

  create_user 'alice'
  fund_user_onchain 'alice' 'btc_wallet'
  fund_user_onchain 'alice' 'usd_wallet'
}

count_transactions_by_currency() {
  transactions_array_query=$1
  currency=$2

  echo $output \
    | jq -r "$transactions_array_query" \
    | jq -r --arg currency "$currency" 'select(.node.settlementCurrency == $currency)' \
    | jq -s "length"
}

currency_for_wallet() {
  idx=$1

  echo $output \
    | jq -r --argjson idx "$idx" '.data.me.defaultAccount.wallets[$idx].walletCurrency'
}

@test "transactions: by account" {
  token_name='alice'
  account_transactions_query='.data.me.defaultAccount.transactions.edges[]'

  exec_graphql "$token_name" 'transactions' '{"first": 3}'
  usd_count="$(count_transactions_by_currency \
    $account_transactions_query \
    'USD' \
  )"
  [[ "$usd_count" -gt "0" ]] || exit 1
  btc_count="$(count_transactions_by_currency \
    $account_transactions_query \
    'BTC' \
  )"
  [[ "$btc_count" -gt "0" ]] || exit 1
}

@test "transactions: by account, filtered by wallet" {
  token_name='alice'
  usd_wallet_name="$token_name.usd_wallet_id"
  account_transactions_query='.data.me.defaultAccount.transactions.edges[]'

  variables=$(
    jq -n \
    --arg wallet_id "$(read_value $usd_wallet_name)" \
    '{"first": 3, walletIds: [$wallet_id]}'
  )
  exec_graphql "$token_name" 'transactions' "$variables"
  usd_count="$(count_transactions_by_currency \
    $account_transactions_query \
    'USD' \
  )"
  [[ "$usd_count" -gt "0" ]] || exit 1
  btc_count="$(count_transactions_by_currency \
    $account_transactions_query \
    'BTC' \
  )"
  [[ "$btc_count" == "0" ]] || exit 1
}

@test "transactions: by wallet" {
  token_name='alice'
  btc_wallet_name="$token_name.btc_wallet_id"
  usd_wallet_name="$token_name.usd_wallet_id"

  exec_graphql "$token_name" 'transactions-by-wallet' '{"first": 3}'

  # Check for BTC wallet
  wallet_0_currency="$(currency_for_wallet 0)"
  [[ "$wallet_0_currency" == "BTC" ]] || exit 1

  wallet_0_transactions_query='.data.me.defaultAccount.wallets[0].transactions.edges[]'

  wallet_0_btc_count="$(count_transactions_by_currency \
    $wallet_0_transactions_query \
    'BTC' \
  )"
  [[ "$wallet_0_btc_count" -gt "0" ]] || exit 1

  # Check for USD wallet
  wallet_1_currency="$(currency_for_wallet 1)"
  [[ "$wallet_1_currency" == "USD" ]] || exit 1

  wallet_1_transactions_query='.data.me.defaultAccount.wallets[1].transactions.edges[]'

  wallet_1_usd_count="$(count_transactions_by_currency \
    $wallet_1_transactions_query \
    'USD' \
  )"
  [[ "$wallet_1_usd_count" -gt "0" ]] || exit 1
}
