#!/usr/bin/env bats

load "../../helpers/_common.bash"
load "../../helpers/user.bash"

KRATOS_ADMIN_API="http://localhost:4434"
KRATOS_PG_CON="postgres://dbuser:secret@localhost:5432/default?sslmode=disable"

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
