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

@test "support: ask 2 questions and then reset the chat" {
  exec_graphql 'alice' 'support-chat'
  messages="$(graphql_output '.data.me.supportChat')"
  [[ "$messages" == "[]" ]] || exit 1

  local variables=$(
    jq -n \
    '{input: {message: "Hello"}}'
  )
  exec_graphql 'alice' 'support-chat-message-add' "$variables"
  messages="$(graphql_output '.data.supportChatMessageAdd.supportMessage')"
  length=$(echo "$messages" | jq '. | length')
  [[ $length -eq 4 ]] || exit 1

  local variables=$(
    jq -n \
    '{input: {message: "My transaction is stuck"}}'
  )
  exec_graphql 'alice' 'support-chat-message-add' "$variables"
  messages="$(graphql_output '.data.supportChatMessageAdd.supportMessage')"
  length=$(echo "$messages" | jq '. | length')
  [[ $length -eq 6 ]] || exit 1

  exec_graphql 'alice' 'support-chat-reset' "$variables"
  success="$(graphql_output '.data.supportChatReset.success')"
  [[ "$success" == "true" ]] || exit 1

  exec_graphql 'alice' 'support-chat'
  messages="$(graphql_output '.data.me.supportChat')"
  length=$(echo "$messages" | jq '. | length')
  [[ $length -eq 2 ]] || exit 1
}
