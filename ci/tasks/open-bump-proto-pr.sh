#!/bin/bash

set -eu

cd repo

gh pr close ${BOT_BRANCH} || true
git checkout ${BRANCH}
gh pr create \
  --title "chore(deps): bump ${MODULE} proto" \
  --body "" \
  --base ${BRANCH} \
  --head ${BOT_BRANCH} \
  --label galoybot
