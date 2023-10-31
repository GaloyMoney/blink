#!/bin/bash

set -e

REPO_ROOT=$(git rev-parse --show-toplevel)

# Write out core api sdl
buck2 run //core/api:write-sdl -- "${REPO_ROOT}/core/api"

# Write out keys sdl
buck2 run //core/api-keys:write-sdl > "${REPO_ROOT}/core/api-keys/subgraph/schema.graphql"

buck2 run //dev/rover:rover_bin -- \
  supergraph compose \
  --config "${REPO_ROOT}/dev/config/apollo-federation/supergraph-config.yaml" \
  --elv2-license accept \
  > "${REPO_ROOT}/dev/config/apollo-federation/supergraph.graphql"

# Copy back to core api as long as the legacy docker compose setup is still in use
cp "${REPO_ROOT}/dev/config/apollo-federation/supergraph.graphql" "${REPO_ROOT}/core/api/dev/apollo-federation/supergraph.graphql"
