FROM node:14-alpine

RUN apk update \
  && apk add bash make git docker curl python jq rsync openssh

# Install gcloud
RUN curl -sSL https://sdk.cloud.google.com | bash
ENV PATH $PATH:/root/google-cloud-sdk/bin
