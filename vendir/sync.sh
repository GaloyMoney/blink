#!/bin/bash

set -e

REPO_ROOT=$(git rev-parse --show-toplevel)

pushd "${REPO_ROOT}"

cat <<EOF > vendir/values.yml
#@data/values
---
buck2_git_ref: "${BUCK2_VERSION#*-}" #! echo "\${BUCK2_VERSION#*-}"
EOF

ytt -f vendir > vendir.yml
vendir sync

git apply third-party/patches/nix_rustc_action.py.patch
