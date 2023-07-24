#!/usr/bin/env bats

load "helpers/setup-and-teardown"

setup_file() {
  start_server
}

teardown_file() {
  stop_server
}

TOKEN_NAME="charlie"
PHONE="+16505554354"
CODE="321321"

randomEmail() {
  local random_string
  # Generate a random hex string of length 40 (equivalent to 20 bytes)
  random_string=$(openssl rand -hex 20)
  echo "${random_string}@galoy.io"
}

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

getEmailCount() {
  local email="$1"
  local table="courier_messages"
  local query="SELECT COUNT(*) FROM $table WHERE recipient = '$email';"

  # Make the query
  local count=$(psql $KRATOS_PG_CON -t -c "${query}")

  echo $count
}

@test "auth: create user" {
  login_user \
    "$TOKEN_NAME" \
    "$PHONE" \
    "$CODE"

  exec_graphql 'charlie' 'identity'
  [[ "$(graphql_output '.data.me.phone')" = "+16505554354" ]] || exit 1
}

@test "auth: add email" {
  email=$(randomEmail)
  cache_value "email" "$email"

  variables="{\"input\": {\"email\": \"$email\"}}"

  exec_graphql 'charlie' 'user-email-registration-initiate' "$variables"
  emailRegistrationId="$(graphql_output '.data.userEmailRegistrationInitiate.emailRegistrationId')"

  code=$(getEmailCode "$email")
  echo "The code is: $code"

  exec_graphql 'charlie' 'identity'
  [[ "$(graphql_output '.data.me.email.address')" = "$email" ]] || exit 1
  [[ "$(graphql_output '.data.me.email.verified')" = "false" ]] || exit 1

  exec_graphql 'charlie' 'user-email-registration-initiate' "$variables"
  error_message="$(graphql_output '.data.userEmailRegistrationInitiate.errors[0].message')"
  expected_message="An email is already attached to this account. It's only possible to attach one email per account"
  [[ "$error_message" == "$expected_message" ]] || exit 1

  variables="{\"input\": {\"code\": \"$code\", \"emailRegistrationId\": \"$emailRegistrationId\"}}"
  exec_graphql 'charlie' 'user-email-registration-validate' "$variables"
  address="$(graphql_output '.data.userEmailRegistrationValidate.me.email.address')"
  [[ "$address" == "$email" ]] || exit 1
  verified="$(graphql_output '.data.userEmailRegistrationValidate.me.email.verified')"
  [[ "$verified" == "true" ]] || exit 1
}

@test "auth: log in with email" {
  email=$(read_value "email")

  # code request
  curl_request "http://${OATHKEEPER_HOST}:${OATHKEEPER_PORT}/auth/email/code" "{ \"email\": \"$email\" }"
  emailLoginId=$(curl_output '.result')
  [ -n "$emailLoginId" ] || fail "Expected emailLoginId not to be null"

  code=$(getEmailCode "$email")
  [ -n "$code" ] || fail "Expected code not to be null"

  # validate code
  curl_request "http://${OATHKEEPER_HOST}:${OATHKEEPER_PORT}/auth/email/login" "{ \"code\": \"$code\", \"emailLoginId\": \"$emailLoginId\" }"
  authToken=$(curl_output '.result.authToken')
  [ -n "$authToken" ] || fail "Expected authToken not to be null"

  authTokenLength=$(echo -n "$authToken" | wc -c)
  [ "$authTokenLength" -eq 39 ] || fail "Expected authToken length to be 39, but was $authTokenLength"

  # TODO: check the response when the login request has expired
}

@test "auth: remove email" {
  email=$(read_value "email")
  countInit=$(getEmailCount "$email")
  echo "count for $email is: $countInit"
  [ "$countInit" -eq 2 ] || exit 1

  exec_graphql 'charlie' 'user-email-delete'
  address="$(graphql_output '.data.userEmailDelete.me.email.address')"
  [[ "$address" == "null" ]] || exit 1
  verified="$(graphql_output '.data.userEmailDelete.me.email.verified')"
  [[ "$verified" == "false" ]] || exit 1

  curl_request "http://${OATHKEEPER_HOST}:${OATHKEEPER_PORT}/auth/email/code" "{ \"email\": \"${email}\" }"
  flowId=$(curl_output '.result')
  [[ "$flowId" =~ ^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$ ]] || exit 1

  exec_graphql 'charlie' 'identity'
  [[ "$(graphql_output '.data.me.email.address')" == "null" ]] || exit 1
  [[ "$(graphql_output '.data.me.totpEnabled')" == "false" ]] || exit 1

  count=$(getEmailCount "$email")
  [[ "$count" -eq "$countInit" ]] || exit 1

  # TODO: email to the sender highlighting the email was removed
}
