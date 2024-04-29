#!/bin/bash

set -e
set -x

DEV_DIR="$(dirname "$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")")"
echo "Sourcing helper files from ${DEV_DIR}"
source "${DEV_DIR}/helpers/auth.sh"
source "${DEV_DIR}/helpers/gql.sh"

user_a="+16505554320" 
user_a_username="test_user_a"

user_b="+16505554323" 
user_b_username="test_user_b"

user_c="+16505554324"
user_c_username="test_user_c"

user_d="+16505554350"
user_d_username="test_user_d"

update_username() {
  echo "Updating username for user: $2"
  local auth_token="$1"
  local username="$2"

  local variables="{\"input\": {\"username\": \"$username\"}}"
  local response=$(exec_graphql "$auth_token" "update-username" "$variables")
  echo "GraphQL response for $username: $response"
}

echo "Starting main execution"

echo "Logging in user $user_a"
auth_token_a=$(login_user "${user_a}")
echo "Auth token for $user_a: $auth_token_a"  

echo "Logging in user $user_b"
auth_token_b=$(login_user "${user_b}")
echo "Auth token for $user_b: $auth_token_b"

echo "Logging in user $user_c"
auth_token_c=$(login_user "${user_c}")
echo "Auth token for $user_c: $auth_token_c"

echo "Logging in user $user_d"
auth_token_d=$(login_user "${user_d}")
echo "Auth token for $user_d: $auth_token_d"

update_username "$auth_token_a" "$user_a_username"
update_username "$auth_token_b" "$user_b_username"
update_username "$auth_token_c" "$user_c_username"
update_username "$auth_token_d" "$user_d_username"

echo "Username update process completed"
