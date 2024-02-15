import { env } from "../env"

export const USD_INVOICE_EXPIRE_INTERVAL = 60 * 5
export const MAX_INPUT_VALUE_LENGTH = 14
export const APP_DESCRIPTION = "Blink official lightning network node"

// TODO get rid of this by removing the use of build time env vars in the client
export const getClientSideGqlConfig = () => {
  let hostname: string | null = null
  let coreGqlUrl: string | null = null
  let coreGqlWebSocketUrl: string | null = null

  if (typeof window !== "undefined") {
    hostname = new URL(window.location.href).hostname
  }

  if (env.NEXT_PUBLIC_CORE_GQL_URL) {
    coreGqlUrl = env.NEXT_PUBLIC_CORE_GQL_URL
  } else if (hostname) {
    const hostPartsApi = hostname.split(".")
    hostPartsApi[0] = "api"
    coreGqlUrl = `https://${hostPartsApi.join(".")}/graphql`
  }

  if (env.NEXT_PUBLIC_CORE_GQL_WEB_SOCKET_URL) {
    coreGqlWebSocketUrl = env.NEXT_PUBLIC_CORE_GQL_WEB_SOCKET_URL
  } else if (hostname) {
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
  if (env.NEXT_PUBLIC_PAY_DOMAIN) {
    return env.NEXT_PUBLIC_PAY_DOMAIN
  } else if (typeof window !== "undefined") {
    // Return the last two parts of the hostname (e.g. "blink.sv")
    return new URL(window.location.href).hostname.split(".").slice(-2).join(".")
  } else {
    return ""
  }
}
