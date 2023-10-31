#!/bin/bash

set -e

REPO_ROOT=$(git rev-parse --show-toplevel)

pushd "${REPO_ROOT}"

cat <<EOF > vendir/values.yml
#@data/values
---
buck2_git_ref: "${BUCK2_VERSION#*-}" #! echo "\${BUCK2_VERSION#*-}"
ring_fixup_git_ref: f3c685667ef22d0130687003012b6960abec6b3b #! commit for using ring 0.17.5
EOF

ytt -f vendir > vendir.yml
vendir sync

git apply third-party/patches/nix_rustc_action.py.patch
