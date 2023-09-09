FROM node:20-alpine AS BUILD_IMAGE

WORKDIR /app

RUN apk update && apk add git

COPY ./*.json ./yarn.lock ./

RUN yarn install --frozen-lockfile

COPY ./src ./src

RUN yarn build

RUN yarn install --frozen-lockfile --production

FROM gcr.io/distroless/nodejs20-debian11
COPY --from=BUILD_IMAGE /app/lib /app/lib
COPY --from=BUILD_IMAGE /app/src/config/locales /app/lib/config/locales
COPY --from=BUILD_IMAGE /app/node_modules /app/node_modules

WORKDIR /app
COPY ./*.js ./package.json ./tsconfig.json ./yarn.lock ./.env ./

USER 1000

ARG COMMITHASH
ENV COMMITHASH ${COMMITHASH}

CMD ["lib/servers/graphql-main-server.js"]
