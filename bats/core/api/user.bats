load "../../helpers/user.bash"

setup_file() {
  create_user 'alice'
}

@test "account: updates language" {
  local new_language="de"

  exec_graphql 'alice' 'user-details'
  language="$(graphql_output '.data.me.language')"
  [[ "$language" == "" ]] || exit 1

  local variables=$(
    jq -n \
    --arg language "$new_language" \
    '{input: {language: $language}}'
  )
  exec_graphql 'alice' 'user-update-language' "$variables"
  changed_language="$(graphql_output '.data.userUpdateLanguage.user.language')"
  [[ "$changed_language" == "$new_language" ]] || exit 1

  exec_graphql 'alice' 'user-details'
  language="$(graphql_output '.data.me.language')"
  [[ "$language" == "$new_language" ]] || exit 1
}
