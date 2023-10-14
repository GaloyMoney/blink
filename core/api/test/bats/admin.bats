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

exec_admin_graphql() {
  local token=$1
  local query_name=$2
  local variables=${3:-"{}"}
  echo "GQL query -  token: ${token} -  query: ${query_name} -  vars: ${variables}"
  echo "{\"query\": \"$(gql_admin_query $query_name)\", \"variables\": $variables}"

  if [[ "${BATS_TEST_DIRNAME}" != "" ]]; then
    run_cmd="run"
  else
    run_cmd=""
  fi

  gql_route="admin/graphql"

  ${run_cmd} curl -s \
    -X POST \
    -H "Oauth2-Token: $token" \
    -H "Content-Type: application/json" \
    -d "{\"query\": \"$(gql_admin_query $query_name)\", \"variables\": $variables}" \
    "${GALOY_ENDPOINT}/${gql_route}"

  echo "GQL output: '$output'"
}

gql_admin_query() {
  cat "$(gql_admin_file $1)" | tr '\n' ' ' | sed 's/"/\\"/g'
}

gql_admin_file() {
  echo "${BATS_TEST_DIRNAME:-${CORE_ROOT}/test/bats}/admin-gql/$1.gql"
}


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

  variables=$(
    jq -n \
    --arg accountId "$id" \
    '{accountId: $accountId}'
  )

  exec_admin_graphql "$admin_token" 'account-details-by-account-id' "$variables"
  returnedId="$(graphql_output '.data.accountDetailsByAccountId.id')"
  [[ "$returnedId" == "$id" ]] || exit 1

  # TODO: add check by email
  
  # TODO: business update map info
}
