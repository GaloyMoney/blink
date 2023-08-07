#!/bin/bash

curl -fsS https://raw.githubusercontent.com/GaloyMoney/galoy-mobile/main/app/graphql/generated.gql -o main.gql

echo Checking compatibility with current main branch of galoy-mobile
npx @graphql-inspector/cli validate ./main.gql repo/src/graphql/public/schema.graphql --apollo --noStrictFragments

for file in mobile-deployments/deployed-schemas/*
do
  filename=$(basename "$file")
  echo Checking compatibility with ${filename%.*}
  npx @graphql-inspector/cli validate $file repo/src/graphql/public/schema.graphql --apollo --noStrictFragments
done
