FROM alpine

RUN apk update \
  && apk add bash make git docker curl py-pip jq rsync openssh

# Install gcloud
RUN curl -sSL https://sdk.cloud.google.com | bash
ENV PATH $PATH:/root/google-cloud-sdk/bin

# Install kubectl
RUN curl -LO https://dl.k8s.io/release/v1.18.20/bin/linux/amd64/kubectl
RUN install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
