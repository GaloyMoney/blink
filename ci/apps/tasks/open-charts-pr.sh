#!/bin/bash

set -eu

export digest=$(cat ./edge-image/digest)
export ref=$(cat ./repo/.git/short_ref)

pushd charts-repo

git checkout "${BRANCH}"

old_digest=$(yq e "${YAML_PATH}" "./charts/${CHART}/values.yaml")

github_url=$(grep "digest: \"${old_digest}\"" "./charts/${CHART}/values.yaml" \
  | sed -n 's/.*repository=\([^;]*\);.*/\1/p' | tr -d ' \n')
old_ref=$(grep "digest: \"${old_digest}\"" "./charts/${CHART}/values.yaml" \
  | sed -n 's/.*commit_ref=\([^;]*\);.*/\1/p' | tr -d ' \n')

pushd ../repo

if [[ -z $(git config --global user.email) ]]; then
  git config --global user.email "bot@galoy.io"
fi
if [[ -z $(git config --global user.name) ]]; then
  git config --global user.name "CI Bot"
fi

git checkout ${old_ref}
app_src_files=($(buck2 uquery 'inputs(deps("'"//apps/${APP}:"'"))' 2>/dev/null))

# create a branch with the old state of the app
git checkout --orphan ${APP}-${old_ref}
git rm -rf . > /dev/null
for file in "${app_src_files[@]}"; do
  git checkout "$old_ref" -- "$file"
done
git commit -m "Commit state of \`${APP}\` at \`${old_ref}\`"

# create a branch from the old state
git branch ${APP}-${ref}
git checkout ${ref}
app_src_files=($(buck2 uquery 'inputs(deps("'"//apps/${APP}:"'"))' 2>/dev/null))

# commit the new state of the app
git checkout ${APP}-${ref}
for file in "${app_src_files[@]}"; do
  git checkout "$ref" -- "$file"
done
git commit -m "Commit state of \`${APP}\` at \`${ref}\`"

cat <<EOF >> ../body.md
# Bump ${APP} image

Code diff contained in this image:

${github_url}/compare/${APP}-${old_ref}...${APP}-${ref}

The ${APP} image will be bumped to digest:
\`\`\`
${digest}
\`\`\`
EOF

pushd ../repo
  git cliff --config ../pipeline-tasks/ci/vendor/config/git-cliff.toml ${old_ref}..${ref} > ../charts-repo/release_notes.md
popd

export GH_TOKEN="$(gh-token generate -b "${GH_APP_PRIVATE_KEY}" -i "${GH_APP_ID}" | jq -r '.token')"

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
