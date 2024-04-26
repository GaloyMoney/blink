#!/bin/bash

set -xe

source "bats/helpers/_common.bash"
source "bats/helpers/user.bash"
source "bats/helpers/onchain.bash"

NOTIFICATIONS_GRPC_ENDPOINT="localhost:6685"
IMPORT_PATH="${REPO_ROOT}/core/notifications/proto"
NOTIFICATIONS_PROTO_FILE="${REPO_ROOT}/core/notifications/proto/notifications.proto"

  # update_user_locale_method="services.notifications.v1.NotificationsService/UpdateUserLocale"

  # for i in $(seq 1 10000); do
  #   request_data=$(jq -n --arg userId "$i" --arg locale "es" '{
  #   "userId": $userId,
  #   "locale": $locale
  #   }')
  #   grpcurl_request $IMPORT_PATH $NOTIFICATIONS_PROTO_FILE $NOTIFICATIONS_GRPC_ENDPOINT "$update_user_locale_method" "$request_data"

  # done
  localized_content_en='{"title": "Hello", "body": "World"}'
  localized_content_es='{"title": "Hola", "body": "World"}'
  # Generate user_ids array from "1" to "10000"
user_ids=($(seq -f "%04g" 1 8000))

# Convert user_ids array to a JSON array of strings
user_ids=$(printf '%s\n' "${user_ids[@]}" | jq -R . | jq -s .)

# Create the JSON request payload using jq
request_data=$(jq -n \
  --argjson user_ids "$user_ids" \
  --argjson localized_content_en "$localized_content_en" \
  --argjson localized_content_es "$localized_content_es" \
  '{
    "event": {
      "marketingNotificationTriggered": {
        "user_ids": $user_ids,
        "localized_push_content": {
          "en": $localized_content_en,
          "es": $localized_content_es
        }
      }
    }
}')

echo $request_data | jq
# Specify the GRPC method to call
handle_notification_event_method="services.notifications.v1.NotificationsService/HandleNotificationEvent"

# Make the GRPC request using grpcurl
grpcurl_request $IMPORT_PATH $NOTIFICATIONS_PROTO_FILE $NOTIFICATIONS_GRPC_ENDPOINT "$handle_notification_event_method" "$request_data"

