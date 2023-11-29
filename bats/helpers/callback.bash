CURRENT_FILE=${BASH_SOURCE:-bats/helpers/.}
source "$(dirname "$CURRENT_FILE")/_common.bash"

export CALLBACK_PID_FILE="${BATS_ROOT_DIR}/.gql_subscriber_pid"
export CALLBACK_LOG_FILE="${BATS_ROOT_DIR}/.e2e-callback.log"

add_callback() {
  local token_name=$1

  local variables=$(
    jq -n \
    --arg url "$SVIX_CALLBACK_URL" \
    '{input: {url: $url}}'
  )
  exec_graphql "$token_name" 'callback-endpoint-add' "$variables"
}

start_callback() {
  stop_callback > /dev/null 2>&1 || true
  rm -f "$CALLBACK_LOG_FILE" "$CALLBACK_PID_FILE" || true

  background \
    buck2 run //bats/helpers/callback:run
    > "${CALLBACK_LOG_FILE}"
  echo $! > "$CALLBACK_PID_FILE"
}

stop_callback() {
  [[ -f "$CALLBACK_PID_FILE" ]] && kill $(cat $CALLBACK_PID_FILE) > /dev/null || true
}

