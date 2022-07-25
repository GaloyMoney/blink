#!/bin/bash

echo "COMMITHASH=$(cat repo/.git/ref)" >> repo/.env
echo "BUILDTIME=$(date -u '+%F-%T')" >> repo/.env
