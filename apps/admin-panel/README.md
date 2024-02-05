# Admin-Panel

## What is it for?

Admin Panel lets the support team access users and internal transaction information.

Admin Panel is packaged as a docker image, and is automatically installed as part of the galoy helm charts.

With a default installation, Admin Panel can be accessed with `admin.domain.com`. Admin-Panel fetches information from a dedicated graphql API endpoint `admin-api.domain.com` defined in [graphql-admin-server](https://github.com/GaloyMoney/galoy/blob/main/src/servers/graphql-admin-server.ts)

## How to run this repo locally?

copy `.env` to `.env.local`. and edit environment variable accordingly.

```
yarn install
export PORT=3004
yarn dev
```

Runs the app in the development mode.
Open [http://localhost:3004](http://localhost:3004) to view it in the browser.

The page will reload if you make edits.
You will also see any lint errors in the console.

### `yarn build`

Builds the app for production to the `build` folder.
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.
Your app is ready to be deployed!

### Development mode credentials

- username: `admin`
- password: `admin`
