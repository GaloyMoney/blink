#!/bin/bash

export REPO_ROOT=$(git rev-parse --show-toplevel)
source "${REPO_ROOT}/bats/helpers/setup-and-teardown.bash"

TILT_PID_FILE=$REPO_ROOT/bats/.tilt_pid

setup_suite() {
  background buck2 run //dev:up -- --bats=True > "${REPO_ROOT}/bats/.e2e-tilt.log"
  echo $! > "$TILT_PID_FILE"
  await_api_is_up
}

teardown_suite() {
  if [[ -f "$TILT_PID_FILE" ]]; then
    kill "$(cat "$TILT_PID_FILE")" > /dev/null || true
  fi

  buck2 run //dev:down
}
