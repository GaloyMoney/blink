#!/bin/bash
git_ref_sha="${1}"
git_url="${2}"

DIR="$(dirname "$(readlink -f "$BASH_SOURCE")")"

TMPDIR=""
TMPDIR=$(mktemp -d -t repipe.XXXXXX)
trap "rm -rf ${TMPDIR}" INT TERM QUIT EXIT

sed "s/^galoy_git_ref:.*/galoy_git_ref: ${git_ref_sha}/" ${DIR}/../vendir/values.yml > ${TMPDIR}/new_values.yml
mv ${TMPDIR}/new_values.yml ${DIR}/../vendir/values.yml

sed "s/^galoy_repo_url:.*/galoy_repo_url: ${git_url}/" ${DIR}/../vendir/values.yml > ${TMPDIR}/new_values.yml
mv ${TMPDIR}/new_values.yml ${DIR}/../vendir/values.yml
