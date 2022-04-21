#!/bin/bash

set -eu

git clone ${SRC_REPO} src-repo

cp src-repo/${PROTO_FILE_SRC_PATH} repo/${PROTO_FILE_DEST_PATH}
