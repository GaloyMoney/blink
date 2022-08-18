#!/bin/bash

set -eu

export digest=$(cat ./edge-image/digest)

pushd charts-repo

ref=$(yq e '.image.git_ref' charts/${CHARTS_SUBDIR}/values.yaml)
git checkout ${BRANCH}
old_ref=$(yq e '.image.git_ref' charts/${CHARTS_SUBDIR}/values.yaml)

cat <<EOF >> ../body.md
# Bump ${CHARTS_SUBDIR} image

The ${CHARTS_SUBDIR} image will be bumped to digest:
```
${digest}
```

Code diff contained in this image:

https://github.com/GaloyMoney/${CHARTS_SUBDIR}/compare/${old_ref}...${ref}
EOF

gh pr close ${BOT_BRANCH} || true
gh pr create \
  --title chore-bump-${CHARTS_SUBDIR}-image-${ref} \
  --body-file ../body.md \
  --base ${BRANCH} \
  --head ${BOT_BRANCH} \
  --label galoybot \
  --label ${CHARTS_SUBDIR}
