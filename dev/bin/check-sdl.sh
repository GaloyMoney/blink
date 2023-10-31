#!/bin/bash

FILES=(
    "dev/config/apollo-federation/supergraph.graphql"
    "core/api/src/graphql/admin/schema.graphql"
    "core/api/src/graphql/public/schema.graphql"
)

for FILE in "${FILES[@]}"; do
    if git diff --name-only | grep -q "$FILE"; then
        echo "Error: $FILE has changes, run 'buck2 run //dev:update-supergraph' and re-recommit" >&2
        exit 1
    fi
done
