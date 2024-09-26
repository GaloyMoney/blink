CURRENT_FILE=${BASH_SOURCE:-bats/helpers/.}
source "$(dirname "$CURRENT_FILE")/_common.bash"

fund_user_onchain() {
  local token_name=$1
  local wallet_id_name="$token_name.${2}_id" # btc_wallet or usd_wallet
  local btc_amount_in_btc=${3:-"0.01"}

  variables=$(
    jq -n \
    --arg wallet_id "$(read_value $wallet_id_name)" \
    '{input: {walletId: $wallet_id}}'
  )
  exec_graphql "$token_name" 'on-chain-address-create' "$variables"
  address="$(graphql_output '.data.onChainAddressCreate.address')"
  [[ "${address}" != "null" ]] || exit 1

  bitcoin_cli sendtoaddress "$address" "$btc_amount_in_btc"
  bitcoin_cli -generate 2
  retry 30 1 check_for_onchain_initiated_settled "$token_name" "$address"
}

get_from_transaction_by_address() {
  property_query=$2

  jq_query='.data.me.defaultAccount.transactions.edges[] | select(.node.initiationVia.address == $address) .node'
  echo $output \
    | jq -r --arg address "$1" "$jq_query" \
    | jq -r "$property_query"
}

get_from_pending_transaction_by_address() {
  property_query=$2

  jq_query='.data.me.defaultAccount.pendingIncomingTransactions[] | select(.initiationVia.address == $address)'
  echo $output \
    | jq -r --arg address "$1" "$jq_query" \
    | jq -r "$property_query"
}

check_for_incoming_broadcast() {
  local token_name=$1
  local address=$2

  exec_graphql "$token_name" 'pending-incoming-transactions'

  tx="$(get_from_pending_transaction_by_address "$address" '.')"
  [[ -n "${tx}" && "${tx}" != "null" ]] || exit 1
  txid="$(echo $tx | jq -r '.settlementVia.transactionHash')"
  [[ "${txid}" != "null" ]] || exit 1
  status="$(echo $tx | jq -r '.status')"
  [[ "${status}" == "PENDING" ]] || exit 1

  bitcoin_cli gettransaction "$txid" || exit 1
}

check_for_outgoing_broadcast() {
  local token_name=$1
  local address=$2
  local first=${3:-"1"}

  variables=$(
  jq -n \
  --argjson first "$first" \
  '{"first": $first}'
  )
  exec_graphql "$token_name" 'transactions' "$variables"

  tx="$(get_from_transaction_by_address "$address" '.')"
  [[ -n "${tx}" && "${tx}" != "null" ]] || exit 1
  txid="$(echo $tx | jq -r '.settlementVia.transactionHash')"
  [[ "${txid}" != "null" ]] || exit 1
  status="$(echo $tx | jq -r '.status')"
  [[ "${status}" == "PENDING" ]] || exit 1

  bitcoin_cli gettransaction "$txid" || exit 1
}

check_for_onchain_initiated_settled() {
  local token_name=$1
  local address=$2
  local first=${3:-"1"}

  variables=$(
  jq -n \
  --argjson first "$first" \
  '{"first": $first}'
  )
  exec_graphql "$token_name" 'transactions' "$variables"

  settled_status="$(get_from_transaction_by_address $address '.status')"
  [[ "${settled_status}" = "SUCCESS" ]] || exit 1
}
