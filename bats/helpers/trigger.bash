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
    lastLineNum=$(grep -n 'Successfully stopped trigger' "$TILT_LOG_FILE" | tail -1 | cut -d: -f1)
    if [[ -z "$lastLineNum" ]]; then lastLineNum=0; fi

    tail -n +$((lastLineNum + 1)) "$TILT_LOG_FILE" | grep -q 'finish updating pending invoices'
    return $?
}

cat_trigger() {
  cat "$TILT_LOG_FILE" | grep 'api-trigger │ '
}

grep_in_trigger_logs() {
  cat_trigger \
    | awk -F'│ ' '{print $2}' \
    | grep $1
  return "$?"
}
