#!/bin/bash

echo "COMMITHASH=$(cat repo/.git/ref)" > repo/.build-args
