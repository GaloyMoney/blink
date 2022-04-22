#!/bin/bash

set -eu

gh pr close ${BOT_BRANCH} || true
gh pr create \
  --title "chore(deps): bump dealer proto" \
  --base ${BRANCH} \
  --head ${BOT_BRANCH} \
  --label galoybot \
