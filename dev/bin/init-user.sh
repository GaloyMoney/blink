#!/bin/bash

set -e

set -x

DEV_DIR="$(dirname "$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")")"
source "${DEV_DIR}/helpers/auth.sh"
source "${DEV_DIR}/helpers/gql.sh"
source "${DEV_DIR}/helpers/cli.sh"

user_phone="+16505554350"
email="test@galoy.io"

auth_token="$(login_user "${user_phone}")"

register_email_to_user "${auth_token}" "${email}"

# Add phone metadata
mongo_command=$(echo "db.users.updateOne(
      { phone: \"$user_phone\" },
      {
        \$set: {
          phoneMetadata: {
            carrier: { type: \"mobile\" },
            countryCode: \"SV\"
          }
        }
      }
    );" | tr -d '[:space:]')
mongo_cli "$mongo_command"

# Add IP metadata
account_id=$(
  exec_graphql "$auth_token" 'default-account' \
    | jq -r '.data.me.defaultAccount.id'
)

mongo_command=$(echo "db.accountips.insertOne(
      {
        ip: \"138.186.249.229\",
        accountId: \"$account_id\",
        metadata: {
          isoCode: \"SV\",
          asn: \"AS27773\"
        }
      }
    );" | tr -d '[:space:]')
mongo_cli "$mongo_command"
