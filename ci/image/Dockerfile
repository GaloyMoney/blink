FROM node:16-alpine

RUN apk update \
  && apk add bash make git docker curl python3 jq rsync openssh wget \
  && apk add yq --repository=http://dl-cdn.alpinelinux.org/alpine/edge/community

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
