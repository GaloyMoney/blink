load "../../helpers/user.bash"

setup_file() {
  create_user_with_metadata 'alice'
  create_user_with_metadata 'bob'
}

@test "account: sets username" {
  suffix="$RANDOM"
  username_to_set=$"alice_$suffix"
  username_to_set_upper=$"Alice_$suffix"

  # Sets a username
  local variables=$(
    jq -n \
    --arg username "$username_to_set" \
    '{input: {username: $username}}'
  )
  exec_graphql 'alice' 'user-update-username' "$variables"
  num_errors="$(graphql_output '.data.userUpdateUsername.errors | length')"
  [[ "$num_errors" == "0" ]] || exit 1

  # Cannot set same username on different user
  exec_graphql 'bob' 'user-update-username' "$variables"
  error_msg="$(graphql_output '.data.userUpdateUsername.errors[0].message')"
  [[ "$error_msg" == "username not available" ]] || exit 1

  # Cannot set same username with different case on different user
  local variables=$(
    jq -n \
    --arg username "$username_to_set_upper" \
    '{input: {username: $username}}'
  )
  exec_graphql 'bob' 'user-update-username' "$variables"
  error_msg="$(graphql_output '.data.userUpdateUsername.errors[0].message')"
  [[ "$error_msg" == "username not available" ]] || exit 1

  # Cannot change username
  new_username_to_set="alice_$RANDOM"
  local variables=$(
    jq -n \
    --arg username "$new_username_to_set" \
    '{input: {username: $username}}'
  )
  exec_graphql 'alice' 'user-update-username' "$variables"
  error_msg="$(graphql_output '.data.userUpdateUsername.errors[0].message')"
  [[ "$error_msg" == "username is immutable" ]] || exit 1
}
