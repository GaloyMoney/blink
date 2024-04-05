#!/bin/bash

set -e

TARGETS=(
    "//dev:update-supergraph"
    "//core/api:update-public-schema"
    "//core/api:update-admin-schema"
    "//core/api-keys:update-schema"
    "//core/notifications:update-schema"
    "//apps/admin-panel:update-codegen"
    "//apps/consent:update-codegen"
    "//apps/dashboard:update-codegen"
    "//apps/map:update-codegen"
    "//apps/pay:update-codegen"
)

buck2 build "${TARGETS[@]}"

for TARGET in "${TARGETS[@]}"; do
  buck2 run "$TARGET"
done
