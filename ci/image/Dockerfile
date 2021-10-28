FROM node:14-alpine

RUN apk update \
  && apk add bash make git docker curl python jq rsync openssh wget \
  && apk add yq --repository=http://dl-cdn.alpinelinux.org/alpine/edge/community

# Install gcloud
RUN curl -sSL https://sdk.cloud.google.com | bash
ENV PATH $PATH:/root/google-cloud-sdk/bin

RUN mkdir ghcli && cd ghcli \
  && wget https://github.com/cli/cli/releases/download/v2.0.0/gh_2.0.0_linux_386.tar.gz -O ghcli.tar.gz \
  && tar --strip-components=1 -xf ghcli.tar.gz \
  && mv bin/gh /usr/local/bin && cd ../ && rm -rf ./ghcli
