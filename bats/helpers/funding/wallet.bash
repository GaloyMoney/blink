balance_for_wallet() {
  local token_name="$1"
  local wallet="$2"

  exec_graphql "$token_name" 'wallets-for-account' > /dev/null
  if [[ "$wallet" == "USD" ]]; then
    graphql_output '.data.me.defaultAccount.wallets[] | select(.walletCurrency == "USD") .balance'
  else
    graphql_output '.data.me.defaultAccount.wallets[] | select(.walletCurrency == "BTC") .balance'
  fi
}
