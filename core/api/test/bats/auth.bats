#!/usr/bin/env bats

load "helpers/setup-and-teardown"

setup_file() {
  start_server
}

teardown_file() {
  stop_server
}

randomPhone() {
    local phone_number=""
    phone_number=$((1 + RANDOM % 9))

    for _ in {1..9}; do
        phone_number+=${RANDOM:0:1}
    done
    echo "+1${phone_number}"
}


randomEmail() {
  local random_string
  # Generate a random hex string of length 40 (equivalent to 20 bytes)
  random_string=$(openssl rand -hex 20)
  echo "${random_string}@galoy.io"
}

TOKEN_NAME="charlie"
PHONE=$(randomPhone)

getEmailCode() {
  local email="$1"
  local query="SELECT body FROM courier_messages WHERE recipient='${email}' ORDER BY created_at DESC LIMIT 1;"

  local result=$(psql $KRATOS_PG_CON -t -c "${query}")

  # If no result is found, exit with an error
  if [[ -z "$result" ]]; then
    echo "No message for email ${email}" >&2
    exit 1
  fi

  # Extract the code from the body
  local code=$(echo "$result" | grep -Eo '[0-9]{6}' | head -n1)

  echo "$code"
}

generateTotpCode() {
  local secret=$1
  node test/bats/helpers/generate-totp.js "$secret"
}

@test "auth: adding totp" {
  login_user \
    "$TOKEN_NAME" \
    "$PHONE" \
    "$CODE"
  authToken=$(read_value "$TOKEN_NAME")

  sleep 2

  # Initiate TOTP Registration
  exec_graphql 'charlie' 'user-totp-registration-initiate' 

  totpRegistrationId="$(graphql_output '.data.userTotpRegistrationInitiate.totpRegistrationId')"
  [[ "$totpRegistrationId" =~ ^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$ ]] || exit 1

  totpSecret="$(graphql_output '.data.userTotpRegistrationInitiate.totpSecret')"
  [ -n "$totpSecret" ] || exit 1

  # Validate TOTP Registration
  totpCode=$(generateTotpCode "$totpSecret")
  variables="{\"input\": {\"totpCode\": \"$totpCode\", \"totpRegistrationId\": \"$totpRegistrationId\", \"authToken\": \"$authToken\"}}"
  exec_graphql 'charlie' 'user-totp-registration-validate' "$variables"

  # Checking the response structure
  totpEnabled="$(graphql_output '.data.userTotpRegistrationValidate.me.totpEnabled')"
  [ "$totpEnabled" == "true" ] || exit 1
}

@test "auth: log in with email with totp activated" {
  email=$(randomEmail)
  variables="{\"input\": {\"email\": \"$email\"}}"
  exec_graphql 'charlie' 'user-email-registration-initiate' "$variables"

  # code request
  variables="{\"email\": \"$email\"}"
  curl_request "http://${GALOY_ENDPOINT}/auth/email/code" "$variables"
  emailLoginId="$(curl_output '.result')"
  [ "$emailLoginId" != "null" ]

  code=$(getEmailCode "$email")
  [ "$code" != "" ]

  # validating email with code
  variables="{\"code\": \"$code\", \"emailLoginId\": \"$emailLoginId\"}"
  curl_request "http://${GALOY_ENDPOINT}/auth/email/login" "$variables"
  authToken="$(curl_output '.result.authToken')"
  totpRequired="$(curl_output '.result.totpRequired')"
  [ "$authToken" != "" ]
  [ "$totpRequired" == "true" ]

  totpCode=$(generateTotpCode "$totpSecret")
  variables="{\"totpCode\": \"$totpCode\", \"authToken\": \"$authToken\"}"
  curl_request "http://${GALOY_ENDPOINT}/auth/totp/validate" "$variables"

  exec_graphql 'charlie' 'identity'
  [[ "$(graphql_output '.data.me.totpEnabled')" = "true" ]] || exit 1
}
