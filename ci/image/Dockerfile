FROM node:16-stretch

RUN apt-get update && apt-get install -y \
  make git docker curl python3 jq rsync wget

RUN wget https://github.com/mikefarah/yq/releases/download/v4.17.2/yq_linux_386.tar.gz -O - |\
  tar xz && mv yq_linux_386 /usr/bin/yq

RUN mkdir -p /usr/local/lib/docker/cli-plugins \
  && curl -SL https://github.com/docker/compose/releases/download/v2.0.1/docker-compose-linux-x86_64 -o /usr/local/lib/docker/cli-plugins/docker-compose \
  && chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

# Install gcloud
RUN curl -sSL https://sdk.cloud.google.com | bash
ENV PATH $PATH:/root/google-cloud-sdk/bin

RUN mkdir ghcli && cd ghcli \
  && wget https://github.com/cli/cli/releases/download/v2.0.0/gh_2.0.0_linux_386.tar.gz -O ghcli.tar.gz \
  && tar --strip-components=1 -xf ghcli.tar.gz \
  && mv bin/gh /usr/local/bin && cd ../ && rm -rf ./ghcli
