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

export GH_TOKEN="$(gh-token generate -b "${GH_APP_PRIVATE_KEY}" -i "${GH_APP_ID}" | jq -r '.token')"
gh auth setup-git
# switch to https to use the token
git remote set-url origin ${github_url}

git config remote.origin.fetch "+refs/heads/*:refs/remotes/origin/*"

git checkout ${ref}
app_src_files=($(buck2 uquery 'inputs(deps("'"//apps/${APP}:"'"))' 2>/dev/null))

declare -A relevant_commits
relevant_commits=()
for commit in $(git log --format="%H" ${old_ref}..${ref}); do
  changed_files=$(git diff-tree --no-commit-id --name-only -r $commit)

  for file in ${changed_files[@]}; do
    if printf '%s\n' "${app_src_files[@]}" | grep -Fxq "$file"; then
      commit_message=$(git log --format="%s" -n 1 $commit)
      pr_number=$(echo "$commit_message" | grep -oE '#[0-9]+' | tail -1 | sed 's/#//')

      if [[ -n "$pr_number" ]]; then
        pr_link="${github_url}/pull/${pr_number}"
        commit_message="${commit_message/ (#$pr_number)/}"
        relevant_commits[$commit]="[$commit_message (#$pr_number)]($pr_link)"
      else
        relevant_commits[$commit]="$commit_message"
      fi

      break
    fi
  done
done

# create a branch from the old state and commit the new state of the app
set +e
git fetch origin ${APP}-${old_ref}
# if the above exits with 128, it means the branch doesn't exist yet
if [[ $? -eq 128 ]]; then
  git checkout --orphan ${APP}-${old_ref}
  git rm -rf . > /dev/null
  for file in "${app_src_files[@]}"; do
    git checkout "$old_ref" -- "$file"
  done
  git commit -m "Commit state of \`${APP}\` at \`${old_ref}\`"
  git push -fu origin ${APP}-${old_ref}
fi
set -e

git checkout ${APP}-${old_ref}
git checkout -b ${APP}-${ref}
for file in "${app_src_files[@]}"; do
  git checkout "$ref" -- "$file"
done

git commit -m "Commit state of \`${APP}\` at \`${ref}\`" --allow-empty
git push -fu origin ${APP}-${ref}

cat <<EOF >> ../body.md
# Bump ${APP} image

EOF

if [[ "${#relevant_commits[@]}" -eq 0 ]]; then
  echo "No relevant changes" >> ../body.md
else
  cat > ../body.md <<- EOF
	Code diff contained in this image:

	${github_url}/compare/${APP}-${old_ref}...${APP}-${ref}

	Relevant commits:
	EOF
  for commit in "${!relevant_commits[@]}"; do
    echo "- ${github_url}/commit/${commit} - ${relevant_commits[$commit]}" >> ../body.md
  done
fi

cat <<EOF >> ../body.md

The ${APP} image will be bumped to digest:
\`\`\`
${digest}
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
  --title "chore(deps): bump-${APP}-image-${ref}" \
  --body-file ../body.md \
  --base ${BRANCH} \
  --head ${BOT_BRANCH} \
  --label galoybot \
  --label galoy ${breaking}
