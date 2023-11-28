# Galoy Pay

## What is it for?

This repo is a web application that can be used to send tips or payments to users.

It's packaged as a docker image, and is automatically installed as part of the Galoy helm charts.

With a default installation, Galoy-Pay can be accessed under `pay.domain.com`.

Galoy-Pay uses query, mutation, and subscription operations from the Galoy's graphql API endpoints `api.domain.com` as defined in [schema.graphql](https://github.com/GaloyMoney/galoy/blob/main/src/graphql/public/schema.graphql)

## How to run this repo locally ?

`.env.local` is set with values that works for local dev.

for staging, use `.env.local` with the following properties

```
NEXT_PUBLIC_GRAPHQL_URL='https://api.staging.galoy.io/graphql'
NEXT_PUBLIC_GRAPHQL_WEBSOCKET_URL='wss://ws.staging.galoy.io/graphql'
GRAPHQL_URL_INTERNAL="http://api.galoy-staging-galoy.svc.cluster.local"
```

then run

```sh
yarn install
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will automatically reload when you make edits.

You will also see any lint errors in the console.

## How to run this repo in docker?

In your terminal, run

```sh
yarn build:docker
```

then run

```sh
yarn dev:docker
```

This will spin up an instance of a galoy-pay docker container running on <http://localhost:3000>

This will also run the app in production mode.

## How to build for production?

In the project directory, you can run:

```sh
yarn install
yarn build
```

This will build the app for production under a `build` folder. It will bundle React in production mode and optimize the build for the best performance. The build will be minified, and the bundled files will include unique hashes in their names.

## Test lnurlp


This environment variable is needed for getting the lnurlp endpoint working.

curl localhost:3000/.well-known/lnurlp/alice
curl localhost:3000/.well-known/lnurlp/alice?amount=1234
