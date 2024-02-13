load "../../../core/api/test/bats/helpers/setup-and-teardown"
load "../../../core/api/test/bats/helpers/ln"

random_phone() {
  printf "+1%010d\n" $(( ($RANDOM * 1000000) + ($RANDOM % 1000000) ))
}

@test "auth: create user" {
  login_user "alice" "$(random_phone)" "000000"
}

@test "auth: initiate and callback" {
  echo "TOKEN_ALICE=$(read_value "alice")"
  export TOKEN_ALICE=$(read_value "alice")

  RESPONSE=$(curl -s "http://localhost:3000/api/initiate?token=${TOKEN_ALICE}")
  CALLBACK_API_URL=$(echo $RESPONSE | jq -r '.apiActivationUrl')
  CALLBACK_UI_URL=$(echo $RESPONSE | jq -r '.uiActivationUrl')

  echo "RESPONSE: $RESPONSE"
  echo "CALLBACK_API_URL: $CALLBACK_API_URL"
  echo "CALLBACK_UI_URL: $CALLBACK_UI_URL"

  [[ $(echo $CALLBACK_API_URL) != "null" ]] || exit 1
  [[ $(echo $CALLBACK_UI_URL) != "null" ]] || exit 1
  
  # TODO: test CALLBACK_UI_URL

  # Making the follow-up curl request
  RESPONSE=$(curl -s "${CALLBACK_API_URL}")
  echo "$RESPONSE"
  [[ $(echo $RESPONSE | jq -r '.protocol_name') == "create_bolt_card_response" ]] || exit 1

  K1_VALUE=$(echo $RESPONSE | jq -r '.k1')
  K2_VALUE=$(echo $RESPONSE | jq -r '.k2')
  cardId=$(echo $RESPONSE | jq -r '.cardId')

  cache_value "k1" "$K1_VALUE"
  cache_value "k2" "$K2_VALUE"
  cache_value "cardId" "$cardId"
}

@test "payment: first ln call" {
  K1=$(read_value "k1")
  K2=$(read_value "k2")

  uid=$(openssl rand -hex 7)
  RESPONSE=$(bun run bats/script/getpandc.ts $uid $K1 $K2)

  P_VALUE=$(echo $RESPONSE | jq -r '.p')
  C_VALUE=$(echo $RESPONSE | jq -r '.c')

  RESPONSE=$(curl -s "http://localhost:3000/api/ln?p=${P_VALUE}&c=${C_VALUE}")
  echo "$RESPONSE"

  CALLBACK_URL=$(echo $RESPONSE | jq -r '.callback')
  K1_CALLBACK=$(echo $RESPONSE | jq -r '.k1')
  [[ $(echo $K1_CALLBACK) != "null" ]] || exit 1

  echo "K1_CALLBACK: $K1_CALLBACK"
  cache_value "k1_callback" "$K1_CALLBACK"
}

# todo: a second ln call; the paths are different

@test "onchain funding" {
  cardId=$(read_value "cardId")
  address=$(curl -s http://localhost:3000/api/card/${cardId} | jq -r '.onchainAddress')

  amount="0.001"
  token_name=$(read_value "alice")

  bitcoin_cli sendtoaddress "$address" "$amount"
  bitcoin_cli -generate 2

  # retry 30 1 check_for_onchain_initiated_settled "$token_name" "$address"
  sleep 5
}

@test "callback" {
  K1_VALUE=$(read_value "k1_callback")
  CALLBACK_URL=http://localhost:3000/api/payment

  echo "K1_VALUE: $K1_VALUE"

  invoice_response="$(lnd_outside_2_cli addinvoice --amt 1000)"
  payment_request=$(echo $invoice_response | jq -r '.payment_request')
  echo $payment_request

  result=$(curl -s "${CALLBACK_URL}?k1=${K1_VALUE}&pr=${payment_request}")
  echo "$result"
  [[ $(echo $result | jq -r '.status') == "OK" ]] || exit 1
}

@test "card ui" {
  cardId=$(read_value "cardId")
  http_status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/card/${cardId})
  [[ "$http_status" -eq 200 ]] || exit 1
}

@test "wipecard" {
  cardId=$(read_value "cardId")
  result=$(curl -s http://localhost:3000/api/wipe?cardId=${cardId})
  [[ $(echo $result | jq -r '.k1') != "null" ]] || exit 1
}

@test "transactions" {
  cardId=$(read_value "cardId")

  response=$(curl -s http://localhost:3000/api/card/$cardId/transactions)

  echo "$response"
  count=$(echo "$response" | jq 'length')
  [[ "$count" -ge 2 ]] || exit 1
}