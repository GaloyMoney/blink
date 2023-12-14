import { env } from "../env"
export const USD_INVOICE_EXPIRE_INTERVAL = 60 * 5
export const MAX_INPUT_VALUE_LENGTH = 14
export const APP_DESCRIPTION = "Blink official lightning network node"

// TODO get rid of this by removing the use of build time env vars in the client
export const getClientSideGqlConfig = () => {
  const hostname = new URL(window.location.href).hostname

  let coreGqlUrl

  // Allow overriding the coreGqlUrl for local development, otherwise use the default in the URL
  if (env.NEXT_PUBLIC_CORE_GQL_URL || typeof window === "undefined") {
    coreGqlUrl = env.NEXT_PUBLIC_CORE_GQL_URL
  } else {
    const hostPartsApi = hostname.split(".")
    hostPartsApi[0] = "api"
    coreGqlUrl = `https://${hostPartsApi.join(".")}/graphql`
  }

  let coreGqlWebSocketUrl

  // Allow overriding the coreGqlWebSocketUrl for local development, otherwise use the default in the URL
  if (env.NEXT_PUBLIC_CORE_GQL_WEB_SOCKET_URL || typeof window === "undefined") {
    coreGqlWebSocketUrl = env.NEXT_PUBLIC_CORE_GQL_WEB_SOCKET_URL
  } else {
    const hostPartsWs = hostname.split(".")
    hostPartsWs[0] = "ws"
    coreGqlWebSocketUrl = `wss://${hostPartsWs.join(".")}/graphql`
  }

  return {
    coreGqlUrl: coreGqlUrl || "",
    coreGqlWebSocketUrl: coreGqlWebSocketUrl || "",
  }
}

export const getClientSidePayDomain = () => {
  if (env.NEXT_PUBLIC_PAY_DOMAIN || typeof window === "undefined") {
    return env.NEXT_PUBLIC_PAY_DOMAIN
  } else {
    return new URL(window.location.href).hostname.split(".").slice(-2).join(".") // Return the last two parts of the hostname (e.g. "blink.sv")
  }
}
