FROM node:14-alpine AS BUILD_IMAGE

WORKDIR /usr/src/app

RUN apk update && apk add git

COPY ./package.json ./tsconfig.json ./yarn.lock ./

RUN yarn install --frozen-lockfile

FROM node:14-alpine

RUN apk update && apk add curl

WORKDIR /usr/src/app
RUN mkdir artifacts
RUN chown 1000:1000 artifacts

COPY --from=BUILD_IMAGE /usr/src/app/node_modules ./node_modules

COPY ./*.js ./default.yaml ./package.json ./tsconfig.json ./yarn.lock ./.env ./
COPY "./src/" "./src"

CMD sleep infinity
