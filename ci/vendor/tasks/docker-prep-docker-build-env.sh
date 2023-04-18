#!/bin/bash

#! Auto synced from Shared CI Resources repository
#! Don't change this file, instead change it in github.com/GaloyMoney/concourse-shared

echo "COMMITHASH=$(cat repo/.git/ref)" >> repo/.env
echo "BUILDTIME=$(date -u '+%F-%T')" >> repo/.env
