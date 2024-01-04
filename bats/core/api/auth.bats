#!/usr/bin/env bats

load "../../helpers/_common.bash"
load "../../helpers/user.bash"

KRATOS_ADMIN_API="http://localhost:4434"
KRATOS_PG_CON="postgres://dbuser:secret@localhost:5432/default?sslmode=disable"
GALOY_ENDPOINT="localhost:4455"

setup_file() {
  clear_cache
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

generateTotpCode() {
  local secret=$1
  buck2 run //bats/helpers/totp:generate "$secret" | tail -n 1
}


@test "auth: create user" {
  create_user 'charlie'

  exec_graphql 'charlie' 'identity'
  [[ "$(graphql_output '.data.me.phone')" = "$(read_value charlie.phone)" ]] || exit 1
}

@test "auth: logout user" {
  exec_graphql 'charlie' 'identity'
  id="$(graphql_output '.data.me.id')"

  sessions_before_logout=$(curl -s $KRATOS_ADMIN_API/admin/identities/$id/sessions | jq '[.[] | select(.active == true)] | length')
  [[ "$sessions_before_logout" -eq 1 ]] || exit 1

  exec_graphql 'charlie' 'logout'
  [[ "$(graphql_output '.data.userLogout.success')" = "true" ]] || exit 1

  sessions_after_logout=$(curl -s $KRATOS_ADMIN_API/admin/identities/$id/sessions | jq '[.[] | select(.active == true)] | length')
  [[ "$sessions_after_logout" -eq 0 ]] || exit 1
}

@test "auth: add email" {
  create_user 'charlie'
  user_update_username 'charlie'
  email="$(read_value charlie.username)@galoy.io"
  cache_value "charlie.email" "$email"

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
  [[ "$(graphql_output '.data.userEmailRegistrationValidate.me.email.address')" == "$email" ]] || exit 1
  [[ "$(graphql_output '.data.userEmailRegistrationValidate.me.email.verified')" == "true" ]] || exit 1
}

@test "auth: log in with email" {
  email=$(read_value 'charlie.email')

  # code request
  variables="{\"email\": \"$email\"}"
  curl_request "http://${GALOY_ENDPOINT}/auth/email/code" "$variables"
  emailLoginId=$(curl_output '.result')
  [ -n "$emailLoginId" ] || exit 1

  code=$(getEmailCode "$email")
  [ -n "$code" ] || exit 1

  # validate code
  variables="{\"code\": \"$code\", \"emailLoginId\": \"$emailLoginId\"}"
  curl_request "http://${GALOY_ENDPOINT}/auth/email/login" "$variables"
  authToken=$(curl_output '.result.authToken')
  [ -n "$authToken" ] || exit 1

  authTokenLength=$(echo -n "$authToken" | wc -c)
  [ "$authTokenLength" -eq 39 ] || exit 1

  # TODO: check the response when the login request has expired
}

@test "auth: remove email" {
  email=$(read_value 'charlie.email')
  countInit=$(getEmailCount "$email")
  echo "count for $email is: $countInit"
  [ "$countInit" -eq 2 ] || exit 1

  exec_graphql 'charlie' 'user-email-delete'
  [[ "$(graphql_output '.data.userEmailDelete.me.email.address')" == "null" ]] || exit 1
  [[ "$(graphql_output '.data.userEmailDelete.me.email.verified')" == "false" ]] || exit 1

  curl_request "http://${GALOY_ENDPOINT}/auth/email/code" "{ \"email\": \"${email}\" }"
  flowId=$(curl_output '.result')
  [[ "$flowId" =~ ^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$ ]] || exit 1

  exec_graphql 'charlie' 'identity'
  [[ "$(graphql_output '.data.me.email.address')" == "null" ]] || exit 1
  [[ "$(graphql_output '.data.me.totpEnabled')" == "false" ]] || exit 1

  count=$(getEmailCount "$email")
  [[ "$count" -eq "$countInit" ]] || exit 1

  # TODO: email to the sender highlighting the email was removed
}

@test "auth: remove phone login" {
  email=$(read_value 'charlie.email')

  variables="{\"input\": {\"email\": \"$email\"}}"
  exec_graphql 'charlie' 'user-email-registration-initiate' "$variables"
  emailRegistrationId="$(graphql_output '.data.userEmailRegistrationInitiate.emailRegistrationId')"

  code=$(getEmailCode "$email")
  echo "The code is: $code"

  variables="{\"input\": {\"code\": \"$code\", \"emailRegistrationId\": \"$emailRegistrationId\"}}"
  exec_graphql 'charlie' 'user-email-registration-validate' "$variables"
  [[ "$(graphql_output '.data.userEmailRegistrationValidate.me.email.address')" == "$email" ]] || exit 1
  [[ "$(graphql_output '.data.userEmailRegistrationValidate.me.email.verified')" == "true" ]] || exit 1

  # Remove phone.
  exec_graphql "charlie" "user-phone-delete"
  [[ "$(graphql_output '.data.userPhoneDelete.me.phone')" == "null" ]] || exit 1
}

@test "auth: adding totp" {
  authToken=$(read_value 'charlie')

  # Initiate TOTP Registration
  exec_totp_initiate() {
    exec_graphql 'charlie' 'user-totp-registration-initiate'
    num_errors="$(graphql_output '.data.userTotpRegistrationInitiate.errors | length')"
    cache_value 'totp.initiate' $output
    [[ "$num_errors" == "0" ]] || return 1
  }
  retry 5 1 exec_totp_initiate
  output=$(read_value 'totp.initiate')

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
  email=$(read_value 'charlie.email')

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
  [ -n "$authToken" ] || exit 1
  totpRequired="$(curl_output '.result.totpRequired')"
  [ "$totpRequired" == "true" ] || exit 1

  totpCode=$(generateTotpCode "$totpSecret")
  variables="{\"totpCode\": \"$totpCode\", \"authToken\": \"$authToken\"}"
  curl_request "http://${GALOY_ENDPOINT}/auth/totp/validate" "$variables"

  exec_graphql 'charlie' 'identity'
  [[ "$(graphql_output '.data.me.totpEnabled')" = "true" ]] || exit 1
}

@test "auth: removing totp" {
  exec_graphql 'charlie' 'user-totp-delete'
  [[ "$(graphql_output '.data.userTotpDelete.me.totpEnabled')" = "false" ]] || exit 1
}

@test "auth: add new phone mutation" {
  local code="000000"
  local phone="$(read_value 'charlie.phone')"

  # First mutation: UserPhoneRegistrationInitiate
  variables="{\"input\": {\"phone\": \"$phone\"}}"
  exec_graphql "charlie" "user-phone-registration-initiate" "$variables"
  [[ "$(graphql_output '.data.userPhoneRegistrationInitiate.success')" = "true" ]] || exit 1

  # Second mutation: UserPhoneRegistrationValidate
  variables="{\"input\": {\"phone\": \"$phone\", \"code\": \"$code\"}}"
  exec_graphql "charlie" "user-phone-registration-validate" "$variables"
  [[ "$(graphql_output '.data.userPhoneRegistrationValidate.me.phone')" = "$phone" ]] || exit 1
}
