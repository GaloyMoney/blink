#!/bin/bash

# Use PROJECT_ROOT env var if set, otherwise assume current directory
: ${PROJECT_ROOT:="."}

# Define paths relative to PROJECT_ROOT
TELEGRAM_PASSPORT_SCRIPT="${PROJECT_ROOT}/bats/helpers/telegram-passport/index.js"
TELEGRAM_PASSPORT_KEYS_DIR="${PROJECT_ROOT}/dev/config/telegram-passport"
TELEGRAM_BOT_API_TOKEN="MTExMTExMTExMTpUZUxlR3JBbUJvVHRPa0Vu"
GALOY_ENDPOINT="localhost:4455"

simulateTelegramPassportWebhook() {
  local nonce="$1"
  local phone="$2"

  echo "Simulating Telegram Passport webhook data for nonce: $nonce and phone: $phone"
  echo "Using script path: $TELEGRAM_PASSPORT_SCRIPT"
  echo "Using keys directory: $TELEGRAM_PASSPORT_KEYS_DIR"

  # Create a temporary file to store the webhook payload and response
  local tempPayload=$(mktemp)
  local tempResponse=$(mktemp)

  # Generate the properly encrypted Telegram Passport data using our script
  node "$TELEGRAM_PASSPORT_SCRIPT" --phone "$phone" --nonce "$nonce" --keys-dir "$TELEGRAM_PASSPORT_KEYS_DIR" --quiet > "$tempPayload"

  # Check if payload was generated successfully
  if [ -s "$tempPayload" ]; then
    # Calculate the request hash
    request_hash=$(echo -n "$TELEGRAM_BOT_API_TOKEN" | base64 -d | sha256sum | awk '{print $1}')

    # Call the webhook endpoint with the generated payload
    curl -s -X POST -H "Content-Type: application/json" \
      -d @"$tempPayload" \
      "http://${GALOY_ENDPOINT}/auth/telegram-passport/webhook?hash=${request_hash}" > "$tempResponse"

    # Log results for debugging
    echo "Webhook response:"
    cat "$tempResponse"

    # Clean up
    rm -f "$tempPayload"
    rm -f "$tempResponse"

    return 0
  else
    echo "Error: Failed to generate Telegram Passport webhook payload"
    rm -f "$tempPayload"
    rm -f "$tempResponse"
    return 1
  fi
}
