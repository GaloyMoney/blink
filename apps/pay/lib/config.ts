let GRAPHQL_URL = process.env.NEXT_PUBLIC_GRAPHQL_URL as string
let GRAPHQL_WEBSOCKET_URL = process.env.NEXT_PUBLIC_GRAPHQL_WEBSOCKET_URL as string

// we need an internal dns to properly propagate the ip related headers to api
// if we use the api endpoints, nginx will rewrite the header to prevent spoofing
// for example: "api.galoy-name-galoy.svc.cluster.local"
const GRAPHQL_URL_INTERNAL = process.env.GRAPHQL_URL_INTERNAL

// from https://nextjs.org/docs/pages/building-your-application/configuring/environment-variables
// Note: After being built, your app will no longer respond to changes to these environment variables.
// For instance, if you use a Heroku pipeline to promote slugs built in one environment to another environment,
// or if you build and deploy a single Docker image to multiple environments, all NEXT_PUBLIC_ variables will be frozen with the value evaluated at build time,
// so these values need to be set appropriately when the project is built. If you need access to runtime environment values,
// you'll have to setup your own API to provide them to the client (either on demand or during initialization).

// so we always assume the api is on the same domain as the frontend
if (!GRAPHQL_URL || !GRAPHQL_WEBSOCKET_URL) {
  if (typeof window !== "undefined") {
    const hostname = new URL(window.location.href).hostname
    const hostPartsApi = hostname.split(".")
    const hostPartsWs = hostname.split(".")

    hostPartsApi[0] = "api"
    hostPartsWs[0] = "ws"

    GRAPHQL_URL = `https://${hostPartsApi.join(".")}/graphql`
    GRAPHQL_WEBSOCKET_URL = `wss://${hostPartsWs.join(".")}/graphql`
  } else {
    console.log("window is undefined")
  }
}

const NOSTR_PUBKEY = process.env.NOSTR_PUBKEY

const PAY_SERVER = GRAPHQL_URL?.replace("/graphql", "")?.replace("api", "pay")

export {
  GRAPHQL_URL,
  GRAPHQL_WEBSOCKET_URL,
  GRAPHQL_URL_INTERNAL,
  NOSTR_PUBKEY,
  PAY_SERVER,
}
