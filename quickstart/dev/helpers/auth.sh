#!/bin/bash

AUTH_ENDPOINT="http://localhost:4455/auth/phone/login"

login_user() {
  phone="$1"

  login_response=$(curl \
    -s \
    -X POST $AUTH_ENDPOINT \
    -H "Content-Type: application/json" \
    -d '{"phone": "'$phone'", "code":"000000"}')

  echo "$login_response" | jq -r '.authToken'
}
