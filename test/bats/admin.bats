#!/usr/bin/env bats

load "helpers/setup-and-teardown"

username="user1"

setup_file() {
  start_server

  login_user \
    "$ADMIN_TOKEN_NAME" \
    "$ADMIN_PHONE" \
    "$CODE"

  login_user \
    "$TESTER_TOKEN_NAME" \
    "$TESTER_PHONE"  \
    "$CODE"

  variables=$(
      jq -n \
      --arg username "$username" \
      '{input: {username: $username}}'
  )

  exec_graphql "$TESTER_TOKEN_NAME" 'user-update-username' "$variables"

}

teardown_file() {
  stop_server
}

random_phone() {
  printf "+1%010d\n" $(( ($RANDOM * 1000000) + ($RANDOM % 1000000) ))
}

ADMIN_TOKEN_NAME="editor"
ADMIN_PHONE="+16505554336"

TESTER_TOKEN_NAME="tester"
TESTER_PHONE="+19876543210"

@test "admin: update user phone" {
  token_name="$ADMIN_TOKEN_NAME"
  phone="$TESTER_PHONE"

  variables=$(
    jq -n \
    --arg phone "$phone" \
    '{phone: $phone}'
  )
  exec_admin_graphql "$token_name" 'account-details-by-user-phone' "$variables"
  id="$(graphql_output '.data.accountDetailsByUserPhone.id')"
  [[ "$id" != "null" ]] || exit 1

  new_phone="$(random_phone)"
  variables=$(
    jq -n \
    --arg phone "$new_phone" \
    --arg uid "$id" \
    '{input: {phone: $phone, uid: $uid}}'
  )
  exec_admin_graphql $token_name 'user-update-phone' "$variables"
  num_errors="$(graphql_output '.data.userUpdatePhone.errors | length')"
  [[ "$num_errors" == "0" ]] || exit 1

  variables=$(
    jq -n \
    --arg phone "$new_phone" \
    '{phone: $phone}'
  )
  exec_admin_graphql "$token_name" 'account-details-by-user-phone' "$variables"
  refetched_id="$(graphql_output '.data.accountDetailsByUserPhone.id')"
  [[ "$refetched_id" == "$id" ]] || exit 1

  variables=$(
    jq -n \
    --arg username "$username" \
    '{username: $username}'
  )

  exec_admin_graphql "$token_name" 'account-details-by-username' "$variables"
  refetched_id="$(graphql_output '.data.accountDetailsByUsername.id')"
  [[ "$refetched_id" == "$id" ]] || exit 1
  
  variables=$(
    jq -n \
    --arg level "TWO" \
    --arg uid "$id" \
    '{input: {level: $level, uid: $uid}}'
  )

  exec_admin_graphql "$token_name" 'account-status-level-update' "$variables"
  refetched_id="$(graphql_output '.data.accountUpdateLevel.accountDetails.id')"
  [[ "$refetched_id" == "$id" ]] || exit 1
  level="$(graphql_output '.data.accountUpdateLevel.accountDetails.level')"
  [[ "$level" == "TWO" ]] || exit 1

  variables=$(
    jq -n \
    --arg status "LOCKED" \
    --arg uid "$id" \
    --arg comment "Test lock of the account" \
    '{input: {status: $status, uid: $uid, comment: $comment}}'
  )

  exec_admin_graphql "$token_name" 'account-update-status' "$variables"
  refetched_id="$(graphql_output '.data.accountUpdateStatus.accountDetails.id')"
  [[ "$refetched_id" == "$id" ]] || exit 1
  account_status="$(graphql_output '.data.accountUpdateStatus.accountDetails.status')"
  [[ "$account_status" == "LOCKED" ]] || exit 1

  # TODO: add check by email
  
  # TODO: business update map info
}