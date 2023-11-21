CURRENT_FILE=${BASH_SOURCE:-bats/helpers/.}
source "$(dirname "$CURRENT_FILE")/_common.bash"

fund_wallet_intraledger() {
  local from_token_name=$1
  local from_wallet_name=$2
  local wallet_name=$3
  local amount=$4

  variables=$(
    jq -n \
    --arg wallet_id "$(read_value $from_wallet_name)" \
    --arg recipient_wallet_id "$(read_value $wallet_name)" \
    --arg amount "$amount" \
    '{input: {walletId: $wallet_id, recipientWalletId: $recipient_wallet_id, amount: $amount}}'
  )
  exec_graphql "$from_token_name" 'intraledger-payment-send' "$variables"
  send_status="$(graphql_output '.data.intraLedgerPaymentSend.status')"
  [[ "${send_status}" = "SUCCESS" ]]
}
