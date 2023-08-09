#!/bin/bash

DIR="$(dirname "$(readlink -f "$BASH_SOURCE")")"

TMPDIR=""
TMPDIR=$(mktemp -d -t repipe.XXXXXX)
trap "rm -rf ${TMPDIR}" INT TERM QUIT EXIT

sed "s/^galoy_git_ref:.*/galoy_git_ref: ${1}/" ${DIR}/../vendir/values.yml > ${TMPDIR}/new_values.yml

mv ${TMPDIR}/new_values.yml ${DIR}/../vendir/values.yml
