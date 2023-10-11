#!/bin/bash

DIR="$(dirname "$(readlink -f "$BASH_SOURCE")")"

TMPDIR=""
TMPDIR=$(mktemp -d -t repipe.XXXXXX)
trap "rm -rf ${TMPDIR}" INT TERM QUIT EXIT

sed "s/^#@ galoy_${1}_image_digest = \".*\"/#@ galoy_${1}_image_digest = \"${2}\"/" ${DIR}/../docker-compose.tmpl.yml > ${TMPDIR}/docker-compose.tmpl.yml

mv ${TMPDIR}/docker-compose.tmpl.yml ${DIR}/../docker-compose.tmpl.yml
