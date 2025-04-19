#!/bin/bash

echo "Running build..."
buck2 build \
  //core/api //core/api-ws-server //core/api-trigger //core/api-exporter \
  //apps/dashboard //apps/consent //apps/pay //apps/admin-panel //apps/map //apps/voucher \
  //core/api-keys //core/notifications \
  //bats/helpers/callback:run //bats/helpers/subscriber:run //bats/helpers/totp:generate

echo "Running bats tests..."
if [ "$1" != "" ]; then
  # Run BATS for specific component
  bats --setup-suite-file bats/ci_setup_suite.bash -t bats/core/"$1"
else
  bats --setup-suite-file bats/ci_setup_suite.bash -t bats/core/**
fi
