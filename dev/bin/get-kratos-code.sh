#!/bin/bash

set -e

DEV_DIR="$(dirname "$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")")"
source "${DEV_DIR}/helpers/cli.sh"

email="${1:-test@galoy.io}"
kratos_pg -c "SELECT body FROM courier_messages WHERE recipient='$email' ORDER BY created_at DESC LIMIT 1;"
