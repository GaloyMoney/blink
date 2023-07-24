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
