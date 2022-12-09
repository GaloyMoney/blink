#!/bin/bash

set -eu
pushd src-repo
apt install -y jq curl;
APP_VERSION=$(curl "https://raw.githubusercontent.com/GaloyMoney/galoy-mobile/version/version");
ANDROID_BROWSERSTACK_APP_ID=$(
  curl -u "$BROWSERSTACK_USER:$BROWSERSTACK_ACCESS_KEY" \
    -X GET "https://api-cloud.browserstack.com/app-automate/recent_group_apps" | \
    APP_VERSION=$APP_VERSION jq '
      first( .[]
        | select(.app_version == env.APP_VERSION)
        | select(.app_name | contains("apk"))
      ) | .app_url
    '
);
echo $ANDROID_BROWSERSTACK_APP_ID;
yarn install;
BROWSERSTACK_USER="$BROWSERSTACK_USER" \
  BROWSERSTACK_ACCESS_KEY="$BROWSERSTACK_ACCESS_KEY" \
  BROWSERSTACK_BUILD="Concourse" \
  BROWSERSTACK_BUILD_VERSION="$APP_VERSION" \
  BROWSERSTACK_APP_ID="$ANDROID_BROWSERSTACK_APP_ID" \
  E2E_DEVICE="android" \
  GALOY_TOKEN="$GALOY_TOKEN" \
  GALOY_TOKEN_2="$GALOY_TOKEN_2" \
  ./node_modules/.bin/wdio e2e/config/browserstack.conf.js | tee browserstack_output.log;
SESSION_ID=$(cat browserstack_output.log | grep sessionId | head -n1 | sed -n "s/^.*'\(.*\)'.*$/\1/ p");
VIDEO_URL=$(curl -u "$BROWSERSTACK_USER:$BROWSERSTACK_ACCESS_KEY" -X GET "https://api-cloud.browserstack.com/app-automate/sessions/$SESSION_ID.json" | jq '.automation_session.video_url');
echo $VIDEO_URL
mkdir -p video-url
echo $VIDEO_URL > video-url/video-url
