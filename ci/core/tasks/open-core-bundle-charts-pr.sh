#!/bin/bash

set -eu

export digest=$(cat ./api-edge-image/digest)
export exporter_digest=$(cat ./api-exporter-edge-image/digest)
export trigger_digest=$(cat ./api-trigger-edge-image/digest)
export cron_digest=$(cat ./api-cron-edge-image/digest)
export migrate_digest=$(cat ./api-migrate-edge-image/digest)
export websocket_digest=$(cat ./api-ws-server-edge-image/digest)
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
app_src_files=($(buck2 uquery 'inputs(deps("//core/api:")) + inputs(deps("//core/api-ws-server:")) + inputs(deps("//core/api-trigger:")) + inputs(deps("//core/api-exporter:")) + inputs(deps("//core/api-cron:"))' 2>/dev/null))

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

# create a branch from the old state and commit the new state of core
set +e
git fetch origin core-${old_ref}
# if the above exits with 128, it means the branch doesn't exist yet
if [[ $? -eq 128 ]]; then
  git checkout --orphan core-${old_ref}
  git rm -rf . > /dev/null
  for file in "${app_src_files[@]}"; do
    git checkout "$old_ref" -- "$file"
  done
  git commit -m "Commit state of \`core\` at \`${old_ref}\`"
  git push -fu origin core-${old_ref}
fi
set -e

git checkout core-${old_ref}
git checkout -b core-${ref}
for file in "${app_src_files[@]}"; do
  git checkout "$ref" -- "$file"
done

git commit -m "Commit state of \`core\` at \`${ref}\`" --allow-empty
git push -fu origin core-${ref}

cat <<EOF >> ../body.md
# Bump galoy core bundle images

Code diff contained in this image:

${github_url}/compare/core-${old_ref}...core-${ref}

Relevant commits:
EOF

if [[ "${#relevant_commits[@]}" -eq 0 ]]; then
  echo "- No relevant commits found" >> ../body.md
else
  for commit in "${!relevant_commits[@]}"; do
    cat <<-EOF >> ../body.md
		- ${github_url}/commit/${commit} - ${relevant_commits[$commit]}
		EOF
  done
fi

cat <<EOF >> ../body.md

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

git cliff --config ../pipeline-tasks/ci/vendor/config/git-cliff.toml ${old_ref}..${ref} > ../charts-repo/release_notes.md

popd

breaking=""
if [[ $(cat release_notes.md | grep breaking) != '' ]]; then
  breaking="--label breaking"
fi

gh pr close ${BOT_BRANCH} || true
gh pr create \
  --title "chore(deps): bump-core-bundle-images-${ref}" \
  --body-file ../body.md \
  --base ${BRANCH} \
  --head ${BOT_BRANCH} \
  --label galoybot \
  --label galoy ${breaking}
