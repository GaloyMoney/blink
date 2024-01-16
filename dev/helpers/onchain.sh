DEV_DIR="$(dirname "$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")")"
source "${DEV_DIR}/helpers/gql.sh"
source "${DEV_DIR}/helpers/cli.sh"


fund_user_onchain() {
  local token=$1
  local wallet_currency=$2
  local btc_amount_in_btc=${3:-"0.01"}

  response="$(exec_graphql "$token" "wallets-for-account")"
  wallet_id=$(echo "$response" | jq -r --arg wc "$wallet_currency" '.data.me.defaultAccount.wallets[] | select(.walletCurrency == $wc) .id')

  echo "Creating variables for GraphQL query for :====> $wallet_id wallet ID i.e :===> $wallet_currency"
  variables=$(
    jq -n \
    --arg wallet_id "$wallet_id" \
    '{input: {walletId: $wallet_id}}'
  )

  response=$(exec_graphql "$token" 'on-chain-address-create' "$variables")
  address=$(echo "$response" | jq -r '.data.onChainAddressCreate.address')
  [[ "${address}" != "null" ]] || exit 1

  bitcoin_cli sendtoaddress "$address" "$btc_amount_in_btc"
  bitcoin_cli -generate 4

  variables=$(
  jq -n \
  --argjson first "1" \
  '{"first": $first}'
  )
  local success=false
  for i in {1..60}; do
    response=$(exec_graphql "$token" 'transactions' "$variables")
    echo "$response"
    jq_query='.data.me.defaultAccount.transactions.edges[] | select(.node.initiationVia.address == $address) .node'
    transaction_info=$(echo $response \
      | jq -r --arg address "$address" "$jq_query")
    
    settled_status=$(echo "$transaction_info" | jq -r ".status")
    settled_currency=$(echo "$transaction_info" | jq -r ".settlementCurrency")

    if [[ "${settled_status}" == "SUCCESS" && "${settled_currency}" == "$wallet_currency" ]]; then
      echo "Transaction successful with correct settlement currency"
      success=true
      break
    fi

    sleep 1
  done

  if [[ $success != true ]]; then
    echo "Failed to fund user"
  fi
}
