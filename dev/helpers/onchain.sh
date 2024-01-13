DEV_DIR="$(dirname "$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")")"
source "${DEV_DIR}/helpers/gql.sh"


check_for_onchain_initiated_settled() {
  local token_name=$1
  local wallet_id=$2
  local first=${3:-"1"}

  variables=$(
  jq -n \
  --argjson first "$first" \
  '{"first": $first}'
  )
  transactions="$(exec_graphql "$token_name" "transactions" "$variables")"
  echo "$transactions"
}


retry() {
  local attempts=$1
  shift
  local delay=$1
  shift
  local i

  for ((i = 0; i < attempts; i++)); do
    run "$@"

    if [[ "$status" -eq 0 ]]; then
      return 0
    fi
    sleep "$delay"
  done

  echo "Command \"$*\" failed $attempts times. Output: $output"
  false
}

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
  echo "Executing GraphQL query for on-chain address creation"
  response=$(exec_graphql "$token" 'on-chain-address-create' "$variables")
  echo "Parsing address from the response"
  address=$(echo "$response" | jq -r '.data.onChainAddressCreate.address')
  [[ "${address}" != "null" ]] || exit 1

  echo "Sending BTC to address: $address"
  bitcoin_signer_cli -generate 101
  bitcoin_signer_cli sendtoaddress "$address" "$btc_amount_in_btc"
  bitcoin_signer_cli -generate 101
  check_for_onchain_initiated_settled $token $wallet_id
}
