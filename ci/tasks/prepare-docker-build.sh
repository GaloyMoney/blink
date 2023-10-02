#!/bin/bash

echo "COMMITHASH=$(cat repo/.git/ref)" > repo/core/api/.build-args
