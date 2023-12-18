#!/bin/bash

set -eu

export digest=$(cat ./edge-image/digest)
export exporter_digest=$(cat ./exporter-edge-image/digest)
export trigger_digest=$(cat ./trigger-edge-image/digest)
export cron_digest=$(cat ./cron-edge-image/digest)
export migrate_digest=$(cat ./migrate-edge-image/digest)
export websocket_digest=$(cat ./websocket-edge-image/digest)
export api_keys_digest=$(cat ./api-keys-edge-image/digest)
export github_url=https://github.com/GaloyMoney/galoy

pushd charts-repo

ref=$(yq e '.galoy.images.app.git_ref' charts/galoy/values.yaml)
git checkout ${BRANCH}
old_ref=$(yq e '.galoy.images.app.git_ref' charts/galoy/values.yaml)

pushd ../repo

if [[ -z $(git config --global user.email) ]]; then
  git config --global user.email "bot@galoy.io"
fi
if [[ -z $(git config --global user.name) ]]; then
  git config --global user.name "CI Bot"
fi

export GH_TOKEN="$(gh-token generate -b "${GH_APP_PRIVATE_KEY}" -i "${GH_APP_ID}" | jq -r '.token')"
gh auth setup-git
# switch to https to use the token
git remote set-url origin ${github_url}

git config remote.origin.fetch "+refs/heads/*:refs/remotes/origin/*"

git checkout ${ref}
app_src_files=($(buck2 uquery 'inputs(deps("//core/..."))' 2>/dev/null))

# create a branch from the old state and commit the new state of core
git fetch origin core-${old_ref}
git checkout core-${old_ref}
git checkout -b core-${ref}
for file in "${app_src_files[@]}"; do
  git checkout "$ref" -- "$file"
done

git commit -m "Commit state of \`core\` at \`${ref}\`" --allow-empty
git push -fu origin core-${ref}

cat <<EOF >> ../body.md
# Bump galoy image

Code diff contained in this image:

${github_url}/compare/core-${old_ref}...core-${ref}

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

The api-keys image will be bumped to digest:
\`\`\`
${api_keys_digest}
\`\`\`
EOF

git cliff --config ../pipeline-tasks/ci/vendor/config/git-cliff.toml ${old_ref}..${ref} > ../charts-repo/release_notes.md

popd

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
