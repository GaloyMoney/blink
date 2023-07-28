#!/usr/bin/env bats

load "helpers/setup-and-teardown"

setup_file() {
  start_server

  login_user \
    "$ADMIN_TOKEN_NAME" \
    "$ADMIN_PHONE" \
    "$ADMIN_CODE"

  login_user \
    "$TESTER_TOKEN_NAME" \
    "$TESTER_PHONE" \
    "$TESTER_CODE"
}

teardown_file() {
  stop_server
}

random_phone() {
  printf "+1%010d\n" $(( ($RANDOM * 1000000) + ($RANDOM % 1000000) ))
}

ADMIN_TOKEN_NAME="editor"
ADMIN_PHONE="+16505554336"
ADMIN_CODE="321321"

TESTER_TOKEN_NAME="tester"
TESTER_PHONE="+19876543210"
TESTER_CODE="321321"

@test "admin: update user phone" {
  token_name="$ADMIN_TOKEN_NAME"
  phone="$TESTER_PHONE"

  variables=$(
    jq -n \
    --arg phone "$phone" \
    '{phone: $phone}'
  )
  exec_graphql "$token_name" 'account-details-by-user-phone' "$variables" 'admin'
  id="$(graphql_output '.data.accountDetailsByUserPhone.id')"
  [[ "$id" != "null" ]] || exit 1

  new_phone="$(random_phone)"
  variables=$(
    jq -n \
    --arg phone "$new_phone" \
    --arg uid "$id" \
    '{input: {phone: $phone, uid: $uid}}'
  )
  exec_graphql $token_name 'user-update-phone' "$variables" 'admin'
  num_errors="$(graphql_output '.data.userUpdatePhone.errors | length')"
  [[ "$num_errors" == "0" ]] || exit 1

  variables=$(
    jq -n \
    --arg phone "$new_phone" \
    '{phone: $phone}'
  )
  exec_graphql "$token_name" 'account-details-by-user-phone' "$variables" 'admin'
  refetched_id="$(graphql_output '.data.accountDetailsByUserPhone.id')"
  [[ "$refetched_id" == "$id" ]] || exit 1
}
