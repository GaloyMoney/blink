#!/bin/bash

# Handle 'core' dependency
for LABEL in "$@"; do
  case "$LABEL" in
    core|dashboard|consent|pay|admin-panel|map|voucher)
      BUILD_ARGS+=" //core/api:prod_build"
      BUILD_ARGS+=" //core/notifications:notifications"

      break
      ;;
  esac
done

# Handle root 'node_modules' dependency
for LABEL in "$@"; do
  case "$LABEL" in
    dashboard|consent|pay|admin-panel|map|voucher)
      BUILD_ARGS+=" "//:node_modules""

      break
      ;;
  esac
done

# Handle 'consent' dependencies
for LABEL in "$@"; do
  case "$LABEL" in
    dashboard|voucher)
      BUILD_ARGS+=" //apps/consent:consent"
      BUILD_ARGS+=" //core/api-keys:api-keys"

      break
      ;;
  esac
done

# Handle other labels
for LABEL in "$@"; do
  case "$LABEL" in
    core)
      ARGS+=" $LABEL"
      ;;
  esac

  case "$LABEL" in
    dashboard|consent|admin-panel|map|voucher)
      ARGS+=" $LABEL"
      BUILD_ARGS+=" //apps/$LABEL:$LABEL"
      ;;

    pay)
      ARGS+=" $LABEL"
      BUILD_ARGS+=" //apps/$LABEL:$LABEL-ci"
      ;;
  esac
done

echo "args=$ARGS"
echo "build_args=$BUILD_ARGS"
