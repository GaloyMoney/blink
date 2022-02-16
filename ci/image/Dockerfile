FROM taylorsilva/dcind

RUN apt-get update && apt-get install -y \
  make git curl python3 jq rsync wget ca-certificates gnupg lsb-release

RUN wget https://github.com/mikefarah/yq/releases/download/v4.17.2/yq_linux_386.tar.gz -O - |\
  tar xz && mv yq_linux_386 /usr/bin/yq
