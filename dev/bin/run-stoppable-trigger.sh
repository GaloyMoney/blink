#!/bin/bash

buck_target="$1"

REPO_ROOT=$(git rev-parse --show-toplevel)
BATS_DIR="${REPO_ROOT}/bats"

TRIGGER_PID_FILE="$BATS_DIR/.trigger_pid"

CONTROL_FILE="$BATS_DIR/.stop_trigger"
rm "$CONTROL_FILE"

start_trigger() {
  buck2 run "$buck_target" &
  echo "$!" > "$TRIGGER_PID_FILE"
}

trigger_is_running() {
  SERVER_PID=$(head -n 1 "$TRIGGER_PID_FILE")
  if ps -p "$SERVER_PID" > /dev/null; then
    return 0
  fi
  return 1
}

while true; do
  if [[ -f "$CONTROL_FILE" ]]; then
    if trigger_is_running > /dev/null; then
      echo "Stopping server..."
      kill -15 $SERVER_PID
      if [[ "$?" == "0" ]]; then
        echo "Successfully stopped trigger"
      else
        echo "Could not stop trigger, exiting..."
        exit 1
      fi
    fi
  else
    if ! trigger_is_running > /dev/null; then
      start_trigger
    fi
  fi
  sleep 2
done
