#!/bin/bash

set -eu

pushd repo

yarn audit --level critical
