#!/bin/bash

set -eu

export digest="$(cat ./edge-image/digest)"
export ref=$(cat ./repo/.git/short_ref)

pushd charts-repo

yq -i e "${YAML_PATH} = strenv(digest)" "./charts/${CHART}/values.yaml"

buck_target_pattern=$(grep -o 'buck_target_pattern=[^;]*' "./charts/${CHART}/values.yaml")
sed -i "s|\(${YAML_PATH##*.}: \"${digest}\"\).*$|\1 # METADATA:: repository=https://github.com/GaloyMoney/galoy;commit_ref=${ref};app=${APP};${buck_target_pattern}|g" "./charts/${CHART}/values.yaml"

if [[ -z $(git config --global user.email) ]]; then
  git config --global user.email "bot@galoy.io"
fi
if [[ -z $(git config --global user.name) ]]; then
  git config --global user.name "CI Bot"
fi

(
  cd "$(git rev-parse --show-toplevel)"
  git merge --no-edit "${BRANCH}"
  git add -A
  git status
  git commit -m "chore(deps): bump '${APP}' image to '${digest}'"
)
