#!/bin/bash

set -eu

. pipeline-tasks/ci/tasks/helpers.sh

CI_ROOT=$(pwd)

unpack_deps

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
gcloud compute os-login ssh-keys add --key-file=${CI_ROOT}/login.ssh.pub > /dev/null

mkdir ~/.ssh
cp ${CI_ROOT}/login.ssh ~/.ssh/id_rsa
cp ${CI_ROOT}/login.ssh.pub ~/.ssh/id_rsa.pub

export DOCKER_HOST_USER="sa_$(cat ${CI_ROOT}/gcloud-creds.json  | jq -r '.client_id')"
export ADDITIONAL_SSH_OPTS="-o StrictHostKeyChecking=no -i ${CI_ROOT}/login.ssh"

# Compiled js files are owned by root because they were created in a container. They must be deleted with "sudo".
ssh ${ADDITIONAL_SSH_OPTS} ${DOCKER_HOST_USER}@${DOCKER_HOST_IP} \
  "cd ${REPO_PATH}; sudo rm -rf lib"

echo "Syncing repo to docker-host... "
rsync --delete -avr -e "ssh -l ${DOCKER_HOST_USER} ${ADDITIONAL_SSH_OPTS}" \
  ${REPO_PATH}/ ${DOCKER_HOST_IP}:${REPO_PATH} > /dev/null
echo "Done!"

ssh ${ADDITIONAL_SSH_OPTS} ${DOCKER_HOST_USER}@${DOCKER_HOST_IP} \
  "cd ${REPO_PATH}; docker compose down --volumes --remove-orphans --timeout 1; DOCKER_HOST_IP=${DOCKER_HOST_IP} docker compose -f docker-compose.yml up integration-deps -d"

export DOCKER_HOST=ssh://${DOCKER_HOST_USER}@${DOCKER_HOST_IP}

pushd ${REPO_PATH}

make create-tmp-env-ci
echo "Syncing repo to docker-host... "
rsync --delete -avr -e "ssh -l ${DOCKER_HOST_USER} ${ADDITIONAL_SSH_OPTS}" \
  ./ ${DOCKER_HOST_IP}:${REPO_PATH} > /dev/null
echo "Done!"

ssh ${ADDITIONAL_SSH_OPTS} ${DOCKER_HOST_USER}@${DOCKER_HOST_IP} \
  "cd ${REPO_PATH}; TMP_ENV_CI=tmp.env.ci docker compose -f docker-compose.yml up e2e-tests"

container_id=$(docker ps -q -f status=exited -f name="${PWD##*/}-e2e-tests-")
test_status=$(docker inspect $container_id --format='{{.State.ExitCode}}')

ssh ${ADDITIONAL_SSH_OPTS} ${DOCKER_HOST_USER}@${DOCKER_HOST_IP} \
  "cd ${REPO_PATH}; docker compose down --volumes --remove-orphans --timeout 1"

exit $test_status
