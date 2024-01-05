#!/bin/bash

set -e

cd repo

if [[ -z "${SSL_CERT_FILE}" ]]; then
  buck2 "${BUCK_CMD}" "${BUCK_TARGET}"
else
  buck2 "${BUCK_CMD}" "${BUCK_TARGET}" -- --env SSL_CERT_FILE="${SSL_CERT_FILE}"
fi
