#!/bin/bash

echo "Running node_modules build..."
buck2 build //:node_modules --verbose 4

echo "Running rust builds..."
buck2 build //core/api-keys:api-keys //core/notifications:notifications

echo "Running api builds..."
buck2 build //core/api:api //core/api-ws-server:api-ws-server //core/api-trigger:api-trigger //core/api-exporter:api-exporter --verbose 4

# echo "Running apps builds..."
# buck2 build //apps/dashboard:dashboard //apps/consent:consent //apps/pay:pay-ci //apps/admin-panel:admin-panel //apps/map:map //apps/voucher:voucher --verbose 4

echo "Running bats helpers builds..."
buck2 build //bats/helpers/callback:run //bats/helpers/subscriber:run //bats/helpers/totp:generate --verbose 4

echo "Running bats tests..."
if [ "$1" != "" ]; then
  # Run BATS for specific component
  bats --setup-suite-file bats/ci_setup_suite.bash -t bats/core/"$1"
else
  bats --setup-suite-file bats/ci_setup_suite.bash -t bats/core/**
fi
