load "../../../test/bats/helpers/setup-and-teardown"
load "../../../test/bats/helpers/ln"

@test "auth: create user" {
  login_user "alice" "+16505554321" "000000"
}

@test "auth: create card" {
  echo "TOKEN_ALICE=$(read_value "alice")"
  export TOKEN_ALICE=$(read_value "alice")

  RESPONSE=$(curl -s "http://localhost:3000/createboltcard?token=${TOKEN_ALICE}")
  CALLBACK_URL=$(echo $RESPONSE | jq -r '.url')

  # Making the follow-up curl request
  RESPONSE=$(curl -s "${CALLBACK_URL}")
  echo "$RESPONSE"
  [[ $(echo $RESPONSE | jq -r '.PROTOCOL_NAME') == "create_bolt_card_response" ]] || exit 1
}

@test "auth: create payment and follow up" {
  P_VALUE="4E2E289D945A66BB13377A728884E867"
  C_VALUE="E19CCB1FED8892CE"

  RESPONSE=$(curl -s "http://localhost:3000/ln?p=${P_VALUE}&c=${C_VALUE}")
  echo "$RESPONSE"

  CALLBACK_URL=$(echo $RESPONSE | jq -r '.callback')
  K1_VALUE=$(echo $RESPONSE | jq -r '.k1')

  echo "CALLBACK_URL: $CALLBACK_URL"
  echo "K1_VALUE: $K1_VALUE"

  cache_value "k1" "$K1_VALUE"
  cache_value "CALLBACK_URL" "$CALLBACK_URL"
}

@test "callback" {
  K1_VALUE=$(read_value "k1")
  CALLBACK_URL=$(read_value "CALLBACK_URL")

  invoice_response="$(lnd_outside_2_cli addinvoice --amt 1000)"
  payment_request=$(echo $invoice_response | jq -r '.payment_request')
  echo $payment_request

  result=$(curl -s "${CALLBACK_URL}?k1=${K1_VALUE}&pr=${payment_request}")
  [[ result.status == "OK" ]] || exit 1
}