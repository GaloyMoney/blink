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

@test "support: default support message result" {
  exec_graphql 'alice' 'support-messages'
  language="$(graphql_output '.data.me.supportChat')"
  
  # expect an empty array
  [[ "$language" == "[]" ]] || exit 1
}

@test "support: ask 2 questions" {
  local variables=$(
    jq -n \
    '{input: {message: "Hello"}}'
  )
  exec_graphql 'alice' 'support-chat-message-add' "$variables"
  language="$(graphql_output '.data.supportChatMessageAdd.supportMessage')"
  length=$(echo "$language" | jq '. | length')
  [[ $length -eq 2 ]] || exit 1

  local variables=$(
    jq -n \
    '{input: {message: "My transaction is stuck"}}'
  )
  exec_graphql 'alice' 'support-chat-message-add' "$variables"
  language="$(graphql_output '.data.supportChatMessageAdd.supportMessage')"
  length=$(echo "$language" | jq '. | length')
  [[ $length -eq 4 ]] || exit 1
}
