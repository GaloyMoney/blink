#!/bin/bash

set -e

set -x

DEV_DIR="$(dirname "$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")")"
source "${DEV_DIR}/helpers/auth.sh"
source "${DEV_DIR}/helpers/gql.sh"

user_phone="+16505554350"
email="test@galoy.com"  

auth_token="$(login_user "${user_phone}")"

register_email_to_user "${auth_token}" "${email}"
