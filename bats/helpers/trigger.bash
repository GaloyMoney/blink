CURRENT_FILE=${BASH_SOURCE:-bats/helpers/.}
source "$(dirname "$CURRENT_FILE")/_common.bash"

TRIGGER_STOP_FILE="$BATS_ROOT_DIR/.stop_trigger"

trigger_is_stopped() {
  local NUM_LINES=2
  cat $TILT_LOG_FILE | grep 'api-trigger │' \
    | tail -n $NUM_LINES \
    | grep "Successfully stopped trigger"

  return "$?"
}

trigger_is_started() {
  local NUM_LINES=18
  cat $TILT_LOG_FILE | grep 'api-trigger │' \
    | tail -n $NUM_LINES \
    | grep "Successfully stopped trigger"

  if [[ "$?" == "0" ]]; then
    return 1
  else
    return 0
  fi
}
