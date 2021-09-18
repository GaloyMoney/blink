#!/bin/bash

set -eu

digest=$(cat ./edge-image/digest)

pushd charts-repo

ref=$(grep '# git_ref' charts/galoy/values.yaml | sed -E 's/.*"(.*)"/\1/')
git checkout ${BRANCH}
old_ref=$(grep '# git_ref' charts/galoy/values.yaml | sed -E 's/.*"(.*)"/\1/')

cat <<EOF >> ../body.md
# Bump galoy image

The galoy image will be bumped to digest:
```
${digest}
```

Code diff contained in this image:

https://github.com/GaloyMoney/galoy/compare/${old_ref}...${ref}
EOF

gh pr close ${BOT_BRANCH} || true
gh pr create \
  --title bump-galoy-image-${ref} \
  --body-file ../body.md \
  --base ${BRANCH} \
  --head ${BOT_BRANCH} \
  --label galoybot
