CURRENT_FILE=${BASH_SOURCE:-bats/helpers/.}
source "$(dirname "$CURRENT_FILE")/_common.bash"

add_callback() {
  local token_name=$1

  local variables=$(
    jq -n \
    --arg url "$SVIX_CALLBACK_URL" \
    '{input: {url: $url}}'
  )
  exec_graphql "$token_name" 'callback-endpoint-add' "$variables"
}

cat_callback() {
  cat "$TILT_LOG_FILE" | grep 'callback │ '
}
