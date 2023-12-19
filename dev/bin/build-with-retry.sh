#!/bin/bash

DEV_DIR="$(dirname "$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")")"
source "${DEV_DIR}/bin/_retry.sh"

retry 3 1 buck2 build "$1" || exit 1
