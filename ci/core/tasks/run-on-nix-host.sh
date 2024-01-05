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

gcloud_ssh "docker ps -qa | xargs docker rm -fv || true;"

login_user="sa_$(cat "${CI_ROOT}/gcloud-creds.json" | jq -r '.client_id')"

gcloud compute start-iap-tunnel "${host_name}" --zone="${host_zone}" --project="${gcp_project}" 22 --local-host-port=localhost:2222 &
tunnel_pid="$!"

# Retry loop with a 1-second sleep to wait for the rsync command to succeed
rsync_ready=false
for i in {1..30}; do
  rsync -avr --delete --exclude="buck-out/**" --exclude="**/node_modules/**" \
    -e "ssh -o StrictHostKeyChecking=no -i ${CI_ROOT}/login.ssh -p 2222" \
    "${REPO_PATH}/" \
    "${login_user}@localhost:${REPO_PATH}" && {
    rsync_ready=true
    break
  } || {
    echo "rsync command failed, retrying in 1 second (attempt $i/30)..."
    sleep 1
  }
done

if [ "$rsync_ready" = false ]; then
  echo "rsync command failed after 30 attempts. Exiting."
  exit 1
fi

kill "${tunnel_pid}"

gcloud_ssh "cd ${REPO_PATH}; cd ${PACKAGE_DIR}; nix develop -c ${CMD} 2>&1"
