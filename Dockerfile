FROM node:14-alpine AS BUILD_IMAGE

WORKDIR /app

RUN apk update && apk add git

COPY ./*.json ./yarn.lock ./

RUN yarn install --frozen-lockfile  --production

COPY ./src ./src

RUN yarn global add typescript
RUN find ./src -type d -depth -name '__tests__' -exec rm -r {} \; -prune

RUN yarn build

FROM gcr.io/distroless/nodejs:14
COPY --from=BUILD_IMAGE /app/lib /app/lib
COPY --from=BUILD_IMAGE /app/node_modules /app/node_modules

WORKDIR /app
COPY ./*.js ./default.yaml ./package.json ./tsconfig.json ./yarn.lock ./.env ./

USER 1000

CMD ["lib/entrypoint/graphql.js"]
