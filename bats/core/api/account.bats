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
}
