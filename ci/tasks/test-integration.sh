#!/bin/bash

set -eu

. pipeline-tasks/ci/tasks/helpers.sh

unpack_deps

CI_ROOT=$(pwd)

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

echo "Syncing repo to docker-host... "
rsync --delete -avr -e "ssh -l ${DOCKER_HOST_USER} ${ADDITIONAL_SSH_OPTS}" \
  repo/ ${DOCKER_HOST_IP}:repo > /dev/null
echo "Done!"

ssh ${ADDITIONAL_SSH_OPTS} ${DOCKER_HOST_USER}@${DOCKER_HOST_IP} \
  "cd repo; docker ps -aq | xargs docker rm -vf; DOCKER_HOST_IP=${DOCKER_HOST_IP} docker-compose up -d"

export DOCKER_HOST=ssh://${DOCKER_HOST_USER}@${DOCKER_HOST_IP}

pushd repo

make integration-in-ci
