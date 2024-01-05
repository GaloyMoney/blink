#!/usr/bin/env bats

load "../../helpers/_common.bash"
load "../../helpers/user.bash"

setup_file() {
  clear_cache

  create_user 'tester'
  user_update_username 'tester'
}

HYDRA_PUBLIC_API="http://localhost:4444"
HYDRA_ADMIN_API="http://localhost:4445"


@test "admin: can retrieve admin token" {
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
  [[ -n "$admin_token" ]] || exit 1
  cache_value 'admin.token' "$admin_token"
}

@test "admin: can query account details by phone" {
  admin_token="$(read_value 'admin.token')"
  variables=$(
    jq -n \
    --arg phone "$(read_value 'tester.phone')" \
    '{phone: $phone}'
  )
  exec_admin_graphql $admin_token 'account-details-by-user-phone' "$variables"
  id="$(graphql_output '.data.accountDetailsByUserPhone.id')"
  [[ "$id" != "null" && "$id" != "" ]] || exit 1
  cache_value 'tester.id' "$id"
}

@test "admin: can update user phone number" {
  admin_token="$(read_value 'admin.token')"
  id="$(read_value 'tester.id')"
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
}

@test "admin: can query account details by username" {
  admin_token="$(read_value 'admin.token')"
  id="$(read_value 'tester.id')"
  username="$(read_value 'tester.username')"

  variables=$(
    jq -n \
    --arg username "$username" \
    '{username: $username}'
  )
  exec_admin_graphql "$admin_token" 'account-details-by-username' "$variables"
  refetched_id="$(graphql_output '.data.accountDetailsByUsername.id')"
  [[ "$refetched_id" == "$id" ]] || exit 1
}

@test "admin: can upgrade account level" {
  admin_token="$(read_value 'admin.token')"
  id="$(read_value 'tester.id')"

  variables=$(
    jq -n \
    --arg level "TWO" \
    --arg accountId "$id" \
    '{input: {level: $level, accountId: $accountId}}'
  )
  exec_admin_graphql "$admin_token" 'account-update-level' "$variables"
  refetched_id="$(graphql_output '.data.accountUpdateLevel.accountDetails.id')"
  [[ "$refetched_id" == "$id" ]] || exit 1
  level="$(graphql_output '.data.accountUpdateLevel.accountDetails.level')"
  [[ "$level" == "TWO" ]] || exit 1
}

@test "admin: can lock account" {
  admin_token="$(read_value 'admin.token')"
  id="$(read_value 'tester.id')"

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
}
