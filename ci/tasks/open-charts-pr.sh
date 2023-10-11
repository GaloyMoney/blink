#!/bin/bash

set -eu

export digest=$(cat ./edge-image/digest)
export exporter_digest=$(cat ./exporter-edge-image/digest)
export trigger_digest=$(cat ./trigger-edge-image/digest)
export cron_digest=$(cat ./cron-edge-image/digest)
export migrate_digest=$(cat ./migrate-edge-image/digest)
export websocket_digest=$(cat ./websocket-edge-image/digest)

pushd charts-repo

ref=$(yq e '.galoy.images.app.git_ref' charts/galoy/values.yaml)
git checkout ${BRANCH}
old_ref=$(yq e '.galoy.images.app.git_ref' charts/galoy/values.yaml)

cat <<EOF >> ../body.md
# Bump galoy image

Code diff contained in this image:

https://github.com/GaloyMoney/galoy/compare/${old_ref}...${ref}

The galoy api image will be bumped to digest:
\`\`\`
${digest}
\`\`\`

The galoy trigger image will be bumped to digest:
\`\`\`
${trigger_digest}
\`\`\`

The galoy exporter image will be bumped to digest:
\`\`\`
${exporter_digest}
\`\`\`

The galoy cron image will be bumped to digest:
\`\`\`
${cron_digest}
\`\`\`

The mongodbMigrate image will be bumped to digest:
\`\`\`
${migrate_digest}
\`\`\`

The websocket image will be bumped to digest:
\`\`\`
${websocket_digest}
\`\`\`
EOF

pushd ../repo
  git cliff --config ../pipeline-tasks/ci/vendor/config/git-cliff.toml ${old_ref}..${ref} > ../charts-repo/release_notes.md
popd

export GH_TOKEN="$(ghtoken generate -b "${GH_APP_PRIVATE_KEY}" -i "${GH_APP_ID}" | jq -r '.token')"

breaking=""
if [[ $(cat release_notes.md | grep breaking) != '' ]]; then
  breaking="--label breaking"
fi

gh pr close ${BOT_BRANCH} || true
gh pr create \
  --title "chore(deps): bump-galoy-image-${ref}" \
  --body-file ../body.md \
  --base ${BRANCH} \
  --head ${BOT_BRANCH} \
  --label galoybot \
  --label galoy ${breaking}
