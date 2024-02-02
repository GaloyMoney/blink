#!/bin/bash

REPO_ROOT=$(git rev-parse --show-toplevel)

ARGS_STRING=""
for app in "$@"; do
  ARGS_STRING+=" --test $app"
done
IFS=' ' read -r -a ARGS <<< "$ARGS_STRING"

tilt --file "${REPO_ROOT}/dev/Tiltfile" ci -- "${ARGS[@]}" \
  | tee "${REPO_ROOT}/dev/.e2e-tilt.log" \
  | grep -- '^\s*test-.* │'
status=${PIPESTATUS[0]}

if [[ $status -eq 0 ]]; then
  echo "Tilt CI passed"
fi

exit "$status"
