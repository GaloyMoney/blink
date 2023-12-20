#!/bin/bash

curl -fsS https://raw.githubusercontent.com/GaloyMoney/galoy-mobile/main/app/graphql/generated.gql -o main.gql

echo Checking compatibility with current main branch of galoy-mobile
npx @graphql-inspector/cli validate ./main.gql repo/core/api/src/graphql/public/schema.graphql --apollo --noStrictFragments
if [ $? -ne 0 ]; then
  echo "Schema is not compatible with galoy-mobile"
  exit 1
fi

for file in mobile-deployments/deployed-schemas/*
do
  filename=$(basename "$file")
  echo Checking compatibility with ${filename%.*}
  npx @graphql-inspector/cli validate $file repo/core/api/src/graphql/public/schema.graphql --apollo --noStrictFragments
  if [ $? -ne 0 ]; then
    echo "Schema is not compatible with ${filename%.*}"
    exit 1
  fi
done
