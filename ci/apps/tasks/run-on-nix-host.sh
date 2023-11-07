#!/bin/bash

set -eu

export PACKAGE_DIR="${PACKAGE_DIR:-.}"
export CI_ROOT=$(pwd)

host_name=$(cat nix-host/metadata | jq -r '.docker_host_name')
echo "Running on host: ${host_name}"
host_zone=$(cat nix-host/metadata | jq -r '.docker_host_zone')
gcp_project=$(cat nix-host/metadata | jq -r '.docker_host_project')

gcloud_ssh() {
  gcloud compute ssh "${host_name}" \
    --zone="${host_zone}" \
    --project="${gcp_project}" \
    --ssh-key-file="${CI_ROOT}/login.ssh" \
    --tunnel-through-iap \
    --command "$@" 2> /dev/null
}

cat <<EOF > "${CI_ROOT}/gcloud-creds.json"
${GOOGLE_CREDENTIALS}
EOF
cat <<EOF > "${CI_ROOT}/login.ssh"
${SSH_PRIVATE_KEY}
EOF
chmod 600 "${CI_ROOT}/login.ssh"
cat <<EOF > "${CI_ROOT}/login.ssh.pub"
${SSH_PUB_KEY}
EOF
gcloud auth activate-service-account --key-file "${CI_ROOT}/gcloud-creds.json" 2> /dev/null

gcloud_ssh "docker ps -qa | xargs docker rm -fv || true; sudo rm -rf ${REPO_PATH} || true; mkdir -p ${REPO_PATH} && cd ${REPO_PATH}/../ && rmdir $(basename "${REPO_PATH}")"

pushd "${REPO_PATH}"

gcloud compute scp --ssh-key-file="${CI_ROOT}/login.ssh" \
  --recurse "$(pwd)" "${host_name}:${REPO_PATH}" \
  --tunnel-through-iap \
  --zone="${host_zone}" \
  --project="${gcp_project}" > /dev/null

gcloud_ssh "cd ${REPO_PATH}; cd ${PACKAGE_DIR}; nix develop -c buck2 clean && nix develop -c ${CMD} 2>&1"
