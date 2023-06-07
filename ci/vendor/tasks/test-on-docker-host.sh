#!/bin/bash

set -eu

export CI_ROOT=$(pwd)

host_name=$(cat docker-host/metadata | jq -r '.docker_host_name')
echo "Running on host: ${host_name}"
host_zone=$(cat docker-host/metadata | jq -r '.docker_host_zone')
gcp_project=$(cat docker-host/metadata | jq -r '.docker_host_project')

gcloud_ssh() {
  gcloud compute ssh ${host_name} \
    --zone=${host_zone} \
    --project=${gcp_project} \
    --ssh-key-file=${CI_ROOT}/login.ssh \
    --tunnel-through-iap \
    --command "$@"
}

cat <<EOF > ${CI_ROOT}/gcloud-creds.json
${GOOGLE_CREDENTIALS}
EOF
cat <<EOF > ${CI_ROOT}/login.ssh
${SSH_PRIVATE_KEY}
EOF
chmod 600 ${CI_ROOT}/login.ssh
cat <<EOF > ${CI_ROOT}/login.ssh.pub
${SSH_PUB_KEY}
EOF
gcloud auth activate-service-account --key-file ${CI_ROOT}/gcloud-creds.json

gcloud_ssh "docker ps -qa | xargs docker rm -fv || true; sudo rm -rf ${REPO_PATH}"

pushd ${REPO_PATH}

make create-tmp-env-ci || true

gcloud compute scp --ssh-key-file=${CI_ROOT}/login.ssh \
  --recurse $(pwd) ${host_name}:${REPO_PATH} \
  --tunnel-through-iap \
  --zone=${host_zone} \
  --project=${gcp_project} > /dev/null

gcloud_ssh "cd ${REPO_PATH}; export TMP_ENV_CI=tmp.env.ci; export COMPOSE_PROJECT_NAME=${REPO_PATH}; docker compose pull; docker compose -f docker-compose.yml up ${TEST_CONTAINER}"

container_id=$(gcloud_ssh "docker ps -q -f status=exited -f name=${PWD##*/}-${TEST_CONTAINER}-")
test_status=$(gcloud_ssh "docker inspect $container_id --format='{{.State.ExitCode}}'")

gcloud_ssh "cd ${REPO_PATH}; docker compose down --remove-orphans --timeout 1"

exit $test_status
