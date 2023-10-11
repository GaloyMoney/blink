#!/bin/bash

set -eu

export digest=$(cat ./edge-image/digest)
export exporter_digest=$(cat ./exporter-edge-image/digest)
export trigger_digest=$(cat ./trigger-edge-image/digest)
export cron_digest=$(cat ./cron-edge-image/digest)
export migrate_digest=$(cat ./migrate-edge-image/digest)
export websocket_digest=$(cat ./websocket-edge-image/digest)
export ref=$(cat ./repo/.git/short_ref)
export app_version=$(cat version/version)

mkdir -p charts-repo/charts/galoy/apollo-router
cp ./repo/core/api/dev/apollo-federation/supergraph.graphql ./charts-repo/charts/galoy/apollo-router/supergraph.graphql

pushd charts-repo

yq -i e '.galoy.images.app.digest = strenv(digest)' ./charts/galoy/values.yaml
yq -i e '.galoy.images.app.git_ref = strenv(ref)' ./charts/galoy/values.yaml
yq -i e '.galoy.images.mongodbMigrate.digest = strenv(migrate_digest)' ./charts/galoy/values.yaml
yq -i e '.galoy.images.websocket.digest = strenv(websocket_digest)' ./charts/galoy/values.yaml
yq -i e '.galoy.images.exporter.digest = strenv(exporter_digest)' ./charts/galoy/values.yaml
yq -i e '.galoy.images.trigger.digest = strenv(trigger_digest)' ./charts/galoy/values.yaml
yq -i e '.galoy.images.cron.digest = strenv(cron_digest)' ./charts/galoy/values.yaml
yq -i e '.appVersion = strenv(app_version)' ./charts/galoy/Chart.yaml

if [[ -z $(git config --global user.email) ]]; then
  git config --global user.email "bot@galoy.io"
fi
if [[ -z $(git config --global user.name) ]]; then
  git config --global user.name "CI Bot"
fi

(
  cd $(git rev-parse --show-toplevel)
  git merge --no-edit ${BRANCH}
  git add -A
  git status
  git commit -m "chore(deps): bump galoy image to '${digest}'"
)
