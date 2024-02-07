#!/bin/bash

set -e

TARGETS=(
    "//apps/admin-panel:codegen"
    "//apps/consent:codegen"
    "//apps/dashboard:codegen"
    "//apps/pay:codegen"
)

buck2 build "${TARGETS[@]}"

for TARGET in "${TARGETS[@]}"; do
  buck2 run "$TARGET"
done
