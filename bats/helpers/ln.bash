CURRENT_FILE=${BASH_SOURCE:-bats/helpers/.}
source "$(dirname "$CURRENT_FILE")/_common.bash"
source "$(dirname "$CURRENT_FILE")/cli.bash"

export SUBSCRIBER_LOG_FILE="${BATS_ROOT_DIR}/.e2e-subscriber.log"

create_new_lnd_onchain_address() {
  local wallet_name=$1
  local wallet_id=$(read_value $wallet_name)

  insert_lnd1_address() {
    local wallet_id=$1
    local address=$2
    pubkey=$(lnd_cli getinfo | jq -r '.identity_pubkey')

    mongo_command=$(echo "db.wallets.updateOne(
      { id: \"$wallet_id\" },
      {
        \$push: {
          onchain: {
            address: \"$address\",
            pubkey: \"$pubkey\"
          }
        }
      }
    );" | tr -d '[:space:]')

    mongo_cli "$mongo_command"
  }

  address=$(lnd_cli newaddress p2wkh | jq -r '.address')
  insert_lnd1_address "$wallet_id" "$address" > /dev/null

  echo $address
}

get_from_transaction_by_ln_hash_and_status() {
  payment_hash="$1"
  expected_status="$2"
  property_query="$3"

  jq_query='
    .data.me.defaultAccount.transactions.edges[]
    | select(.node.initiationVia.paymentHash == $payment_hash)
    | select(.node.status == $expected_status)
    .node'

  echo $output \
    | jq -r \
      --arg payment_hash "$payment_hash" \
      --arg expected_status "$expected_status" \
      "$jq_query" \
    | jq -r "$property_query" \
    | head -n 1
}

check_for_ln_initiated_status() {
  local expected_status=$1
  local token_name=$2
  local payment_hash=$3
  local first=${4:-"2"}

  variables=$(
  jq -n \
  --argjson first "$first" \
  '{"first": $first}'
  )
  exec_graphql "$token_name" 'transactions' "$variables"

  status="$(get_from_transaction_by_ln_hash_and_status $payment_hash $expected_status '.status')"
  [[ "${status}" == "${expected_status}" ]] || return 1
}

check_for_ln_initiated_settled() {
  check_for_ln_initiated_status "SUCCESS" "$@"
}

check_for_ln_update() {
  payment_hash=$1

  retry 10 1 \
    grep "Data.*LnUpdate.*$payment_hash" "$SUBSCRIBER_LOG_FILE" \
    | awk '{print $2}' \
    | jq -r --arg hash "$payment_hash" 'select(.data.myUpdates.update.paymentHash == $hash)'

  paid_status=$( \
    grep 'Data.*LnUpdate' "$SUBSCRIBER_LOG_FILE" \
    | awk '{print $2}' \
    | jq -r --arg hash "$payment_hash" 'select(.data.myUpdates.update.paymentHash == $hash) .data.myUpdates.update.status'
  )

  [[ "$paid_status" == "PAID" ]] || exit 1
}
