#!/bin/bash

#! Auto synced from Shared CI Resources repository
#! Don't change this file, instead change it in github.com/GaloyMoney/concourse-shared

if [[ -f version/version ]]; then
  echo "VERSION=$(cat version/version)" >> repo/.env
fi

echo "COMMITHASH=$(cat repo/.git/ref)" >> repo/.env
echo "BUILDTIME=$(date -u '+%F-%T')" >> repo/.env
