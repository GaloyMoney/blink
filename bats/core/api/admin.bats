#!/usr/bin/env bats

load "../../helpers/_common.bash"
load "../../helpers/user.bash"
load "../../helpers/admin.bash"

setup_file() {
  clear_cache

  create_user 'tester'
  user_update_username 'tester'

  create_user 'tester2'

  login_admin
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

@test "admin: can query account details by account id" {
  admin_token="$(read_value 'admin.token')"
  id="$(read_value 'tester.id')"

  variables=$(
    jq -n \
    --arg accountId "$id" \
    '{accountId: $accountId}'
  )
  exec_admin_graphql "$admin_token" 'account-details-by-account-id' "$variables"
  returned_id="$(graphql_output '.data.accountDetailsByAccountId.id')"
  [[ "$returned_id" == "$id" ]] || exit 1

  user_id="$(graphql_output '.data.accountDetailsByAccountId.owner.id')"
  cache_value 'tester.user_id' "$user_id"
}

@test "admin: can query account details by user id" {
  admin_token="$(read_value 'admin.token')"
  user_id="$(read_value 'tester.user_id')"

  variables=$(
    jq -n \
    --arg user_id "$user_id" \
    '{userId: $user_id}'
  )
  exec_admin_graphql "$admin_token" 'account-details-by-user-id' "$variables"
  returned_id="$(graphql_output '.data.accountDetailsByUserId.owner.id')"
  [[ "$returned_id" == "$user_id" ]] || exit 1
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

@test "admin: non-admin user cannot delete locked account" {
  exec_graphql 'tester' 'account-delete'
  delete_error_message="$(graphql_output '.errors[0].message')"
  [[ "$delete_error_message" == "Not authorized" ]] || exit 1
}

@test "admin: cannot update phone on locked account" {
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
  update_error_message="$(graphql_output '.data.userUpdatePhone.errors[0].message')"
  [[ "$update_error_message" == "Account is inactive." ]] || exit 1
}

@test "admin: can get filtered user count" {
  admin_token="$(read_value 'admin.token')"

  # all users
  variables=$(
    jq -n \
    '{}'
  )
  exec_admin_graphql "$admin_token" 'filtered-user-count' "$variables"
  count="$(graphql_output '.data.filteredUserCount')"
  [[ "$count" -gt 1 ]] || exit 1

  # single user
  variables=$(
    jq -n \
    --arg userId "$(read_value 'tester.user_id')" \
    '{
      userIdsFilter: [$userId]
    }'
  )

  exec_admin_graphql "$admin_token" 'filtered-user-count' "$variables"
  count="$(graphql_output '.data.filteredUserCount')"
  [[ "$count" -eq 1 ]] || exit 1
}

@test "admin: can trigger marketing notification" {
  admin_token="$(read_value 'admin.token')"

  variables=$(
    jq -n \
    '{
      input: {
        localizedNotificationContents: [
          {
            language: "en",
            title: "Test title",
            body: "test body"
          }
        ],
        shouldSendPush: false,
        shouldAddToHistory: true,
        shouldAddToBulletin: true,
      }
    }'
  )
  exec_admin_graphql "$admin_token" 'marketing-notification-trigger' "$variables"
  num_errors="$(graphql_output '.data.marketingNotificationTrigger.errors | length')"
  success="$(graphql_output '.data.marketingNotificationTrigger.success')"
  [[ "$num_errors" == "0" && "$success" == "true" ]] || exit 1
}

# TODO: add check by email

# TODO: business update map info
