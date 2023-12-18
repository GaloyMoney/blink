#!/usr/bin/env bats

load "helpers/setup-and-teardown"

setup_file() {
  start_server
}

teardown_file() {
  stop_server
}

TESTER_TOKEN_NAME="tester"
TESTER_PHONE="+19876543210"
username="user1"

@test "admin: perform admin queries/mutations" {
  client=$(curl -L -s -X POST $HYDRA_ADMIN_API/admin/clients \
    -H 'Content-Type: application/json' \
    -d '{
          "grant_types": ["client_credentials"]
        }')

  client_id=$(echo $client | jq -r '.client_id')
  client_secret=$(echo $client | jq -r '.client_secret')

  # get token from client_id and client_secret
  admin_token=$(curl -s -X POST $HYDRA_PUBLIC_API/oauth2/token \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -u "$client_id:$client_secret" \
  -d "grant_type=client_credentials" | jq -r '.access_token'
  )

  echo "admin_token: $admin_token"

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

  variables=$(
    jq -n \
    --arg phone "$TESTER_PHONE" \
    '{phone: $phone}'
  )

  exec_admin_graphql $admin_token 'account-details-by-user-phone' "$variables"
  id="$(graphql_output '.data.accountDetailsByUserPhone.id')"
  [[ "$id" != "null" && "$id" != "" ]] || exit 1

  echo "id: $id"

  new_phone="$(random_phone)"
  variables=$(
    jq -n \
    --arg phone "$new_phone" \
    --arg accountId "$id" \
    '{input: {phone: $phone, accountId:$accountId}}'
  )

  exec_admin_graphql $admin_token 'user-update-phone' "$variables"
  num_errors="$(graphql_output '.data.userUpdatePhone.errors | length')"
  [[ "$num_errors" == "0" ]] || exit 1

  variables=$(
    jq -n \
    --arg phone "$new_phone" \
    '{phone: $phone}'
  )

  exec_admin_graphql "$admin_token" 'account-details-by-user-phone' "$variables"
  refetched_id="$(graphql_output '.data.accountDetailsByUserPhone.id')"
  [[ "$refetched_id" == "$id" ]] || exit 1

  variables=$(
    jq -n \
    --arg username "$username" \
    '{username: $username}'
  )

  exec_admin_graphql "$admin_token" 'account-details-by-username' "$variables"
  refetched_id="$(graphql_output '.data.accountDetailsByUsername.id')"
  [[ "$refetched_id" == "$id" ]] || exit 1

  variables=$(
    jq -n \
    --arg level "TWO" \
    --arg accountId "$id" \
    '{input: {level: $level, accountId: $accountId}}'
  )

  exec_admin_graphql "$admin_token" 'account-status-level-update' "$variables"
  refetched_id="$(graphql_output '.data.accountUpdateLevel.accountDetails.id')"
  [[ "$refetched_id" == "$id" ]] || exit 1
  level="$(graphql_output '.data.accountUpdateLevel.accountDetails.level')"
  [[ "$level" == "TWO" ]] || exit 1

  variables=$(
    jq -n \
    --arg account_status "LOCKED" \
    --arg accountId "$id" \
    --arg comment "Test lock of the account" \
    '{input: {status: $account_status, accountId: $accountId, comment: $comment}}'
  )

  exec_admin_graphql "$admin_token" 'account-update-status' "$variables"
  refetched_id="$(graphql_output '.data.accountUpdateStatus.accountDetails.id')"
  [[ "$refetched_id" == "$id" ]] || exit 1
  account_status="$(graphql_output '.data.accountUpdateStatus.accountDetails.status')"
  [[ "$account_status" == "LOCKED" ]] || exit 1

  # User cannot delete the account if it is locked
  exec_graphql "$TESTER_TOKEN_NAME" 'account-delete'
  delete_error_message="$(graphql_output '.errors[0].message')"
  [[ "$delete_error_message" == "Not authorized" ]] || exit 1

  # Admin cannot update the phone if it is locked
  new_phone="$(random_phone)"
  variables=$(
    jq -n \
    --arg phone "$new_phone" \
    --arg accountId "$id" \
    '{input: {phone: $phone, accountId:$accountId}}'
  )
  exec_admin_graphql $admin_token 'user-update-phone' "$variables"
  update_error_message="$(graphql_output '.data.userUpdatePhone.errors[0].message')"
  [[ "$update_error_message" == "Account is inactive." ]] || exit 1

  variables=$(
    jq -n \
    --arg accountId "$id" \
    '{accountId: $accountId}'
  )

  exec_admin_graphql "$admin_token" 'account-details-by-account-id' "$variables"
  returnedId="$(graphql_output '.data.accountDetailsByAccountId.id')"
  [[ "$returnedId" == "$id" ]] || exit 1

  userId="$(graphql_output '.data.accountDetailsByAccountId.owner.id')"
  echo "userId: $userId"

  variables=$(
    jq -n \
    --arg userId "$userId" \
    '{userId: $userId}'
  )

  exec_admin_graphql "$admin_token" 'account-details-by-user-id' "$variables"
  returnedId="$(graphql_output '.data.accountDetailsByUserId.owner.id')"
  [[ "$returnedId" == "$userId" ]] || exit 1


  # TODO: add check by email

  # TODO: business update map info
}
