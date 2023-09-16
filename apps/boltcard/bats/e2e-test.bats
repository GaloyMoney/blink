
@test "auth: create card" {
  accountId="b12871e9-01e7-4aec-8597-873ebab7df1f"

  RESPONSE=$(curl -s "http://localhost:3000/createboltcard?accountId=${accountId}")
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

  # Making the follow-up curl request
  curl -s "${CALLBACK_URL}?k1=${K1_VALUE}"
}
