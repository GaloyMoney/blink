#!/bin/bash

set -e

TARGETS=(
    "//dev:update-supergraph"
    "//dev:update-core-supergraph"
    "//core/api:update-public-schema"
    "//core/api:update-admin-schema"
    "//core/api-keys:update-schema"
    "//core/notifications:update-schema"
)

buck2 build "${TARGETS[@]}"

for TARGET in "${TARGETS[@]}"; do
  buck2 run "$TARGET"
done
