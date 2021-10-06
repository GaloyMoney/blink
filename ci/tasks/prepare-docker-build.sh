#!/bin/bash

echo "COMMITHASH=$CIRCLE_SHA1" >> repo/.env
echo "BUILDTIME=$(date -u '+%F-%T')" >> repo/.env
