#!/bin/bash

set -eu

cd repo

gh pr close ${BOT_BRANCH} || true
gh pr create \
  --title "chore(deps): bump dealer proto" \
  --body ""
  --base ${BRANCH} \
  --head ${BOT_BRANCH} \
  --label galoybot
