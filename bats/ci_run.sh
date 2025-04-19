#!/bin/bash

echo "Running rust builds..."
buck2 build //core/api-keys //core/notifications

echo "Running api builds..."
buck2 build //core/api
buck2 build //core/api-ws-server //core/api-trigger //core/api-exporter

echo "Running apps builds..."
buck2 build //apps/dashboard //apps/consent //apps/pay //apps/admin-panel //apps/map //apps/voucher

echo "Running bats helpers builds..."
buck2 build //bats/helpers/callback:run //bats/helpers/subscriber:run //bats/helpers/totp:generate

echo "Running bats tests..."
if [ "$1" != "" ]; then
  # Run BATS for specific component
  bats --setup-suite-file bats/ci_setup_suite.bash -t bats/core/"$1"
else
  bats --setup-suite-file bats/ci_setup_suite.bash -t bats/core/**
fi
