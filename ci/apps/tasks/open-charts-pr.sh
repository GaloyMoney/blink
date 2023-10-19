#!/bin/bash

set -eu

export digest=$(cat ./edge-image/digest)
export ref=$(cat ./repo/.git/short_ref)

pushd charts-repo

git checkout "${BRANCH}"

old_digest=$(yq -i e "${YAML_PATH}" "./charts/${CHART}/values.yaml")

github_url=$(grep "digest: \"${old_digest}\"" "./charts/${CHART}/values.yaml" \
  | sed 's|digest:.*:: repository=\(.*\);.*$|\1|' | tr -d ' \n')
old_ref=$(grep "digest: \"${old_digest}\"" "./charts/${CHART}/values.yaml" \
  | sed 's|digest:.*:: ;commit_ref=\(.*\)$|\1|' | tr -d ' \n')

cat <<EOF >> ../body.md
# Bump ${APP} image

Code diff contained in this image:

${github_url}/compare/${old_ref}...${ref}

The ${APP} image will be bumped to digest:
\`\`\`
${digest}
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
  --title "chore(deps): bump-${APP}-image-${ref}" \
  --body-file ../body.md \
  --base ${BRANCH} \
  --head ${BOT_BRANCH} \
  --label galoybot \
  --label galoy ${breaking}
