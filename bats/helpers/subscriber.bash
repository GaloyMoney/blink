CURRENT_FILE=${BASH_SOURCE:-bats/helpers/.}
source "$(dirname "$CURRENT_FILE")/_common.bash"

export SUBSCRIBER_PID_FILE="${BATS_ROOT_DIR}/.gql_subscriber_pid"
export SUBSCRIBER_LOG_FILE="${BATS_ROOT_DIR}/.e2e-subscriber.log"

subscribe_to() {
  stop_subscriber > /dev/null 2>&1 || true
  rm -f "$SUBSCRIBER_LOG_FILE" "$SUBSCRIBER_PID_FILE" || true

  token_name=$1
  if [[ -n "$token_name" && "$token_name" != 'anon' ]]; then
     token="$(read_value "$token_name")"
  fi
  gql_filename=$2
  variables=$3

  background \
    buck2 run //bats/helpers/subscriber:run -- \
    "ws://${OATHKEEPER_PROXY}/graphqlws" \
    "$(gql_file "$gql_filename")" \
    "$token" \
    "$variables" \
    > "${SUBSCRIBER_LOG_FILE}"
  echo $! > "$SUBSCRIBER_PID_FILE"
}

stop_subscriber() {
  [[ -f "$SUBSCRIBER_PID_FILE" ]] && kill $(cat $SUBSCRIBER_PID_FILE) > /dev/null || true
}

subscriber_is_up() {
  grep "Data:" "$SUBSCRIBER_LOG_FILE"
  return "$?"
}
