BASH_SOURCE=${BASH_SOURCE:-test/bats/helpers/.}
source $(dirname "$BASH_SOURCE")/_common.bash

bitcoind_init() {
  bitcoin_cli createwallet "outside" || true
  bitcoin_cli -generate 200 > /dev/null 2>&1

  bitcoin_signer_cli createwallet "dev" || true
  bitcoin_signer_cli -rpcwallet=dev importdescriptors "$(cat ${CORE_ROOT}/test/bats/bitcoind_signer_descriptors.json)"
}

bitcoin_signer_cli() {
  docker exec "${COMPOSE_PROJECT_NAME}-bitcoind-signer-1" bitcoin-cli $@
}

get_from_transaction_by_address() {
  property_query=$2

  jq_query='.data.me.defaultAccount.transactions.edges[] | select(.node.initiationVia.address == $address) .node'
  echo $output \
    | jq -r --arg address "$1" "$jq_query" \
    | jq -r "$property_query"
}

check_for_broadcast() {
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
