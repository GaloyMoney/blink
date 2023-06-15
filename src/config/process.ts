import { getCronConfig } from "./yaml"

import { ConfigError } from "./error"

type TwilioConfig = {
  accountSid: string
  authToken: string
  verifyService: string
}

export const GALOY_API_KEEPALIVE_TIMEOUT_MS = parseInt(
  process.env.GALOY_API_KEEPALIVE_TIMEOUT || "30000",
  10,
)
export const GALOY_API_PORT = process.env.GALOY_API_PORT || 4012
export const GALOY_ADMIN_PORT = process.env.GALOY_ADMIN_PORT || 4001

const jwtSecret = process.env.JWT_SECRET
if (!jwtSecret) {
  throw new ConfigError("missing JWT_SECRET")
}

export const JWT_SECRET = jwtSecret

const btcNetwork = process.env.NETWORK
const networks = ["mainnet", "testnet", "signet", "regtest"]
if (!!btcNetwork && !networks.includes(btcNetwork)) {
  throw new ConfigError(`missing or invalid NETWORK: ${btcNetwork}`)
}

export const BTC_NETWORK = btcNetwork as BtcNetwork

export const tracingConfig = {
  jaegerHost: process.env.JAEGER_HOST || "localhost",
  jaegerPort: parseInt(process.env.JAEGER_PORT || "6832", 10),
  tracingServiceName: process.env.TRACING_SERVICE_NAME || "galoy-dev",
}

export const getGaloyBuildInformation = () => {
  return {
    commitHash: process.env.COMMITHASH,
    buildTime: process.env.BUILDTIME,
    helmRevision: process.env.HELMREVISION,
  }
}

export const getBriaPartialConfigFromProcess = () => {
  const briaUrl = process.env.BRIA_HOST ?? "localhost"
  const briaPort = process.env.BRIA_PORT ?? "2742"

  const BRIA_PROFILE_API_KEY =
    process.env.BRIA_PROFILE_API_KEY || "bria_dev_000000000000000000000"

  if (!BRIA_PROFILE_API_KEY) {
    throw new ConfigError(`missing or invalid bria api key: ${BRIA_PROFILE_API_KEY}`)
  }

  return {
    endpoint: `${briaUrl}:${briaPort}`,
    apiKey: BRIA_PROFILE_API_KEY,
  }
}
export const getGeetestConfig = () => {
  // FIXME: Geetest should be optional.
  if (!process.env.GEETEST_ID || !process.env.GEETEST_KEY) {
    throw new ConfigError("Geetest config not found")
  }
  const config = {
    id: process.env.GEETEST_ID,
    key: process.env.GEETEST_KEY,
  }
  return config
}

export const getTwilioConfig = (): TwilioConfig => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const verifyService = process.env.TWILIO_VERIFY_SERVICE_ID

  if (!accountSid || !authToken || !verifyService) {
    throw new ConfigError("missing auth credentials for twilio")
  }

  return {
    accountSid,
    authToken,
    verifyService,
  }
}

export const getDealerPriceConfig = () => {
  return {
    port: process.env.PRICE_SERVER_PORT ?? "3325",
    host: process.env.PRICE_SERVER_HOST ?? "localhost",
  }
}

// FIXME: we have process.env.NODE_ENV === "production" | "development" | "test"
// "test" might not be needed

export const isProd = process.env.NODE_ENV === "production"
export const isCI = process.env.IS_CI === "true"
export const isRunningJest = typeof jest !== "undefined"

export const DropboxAccessToken = process.env.DROPBOX_ACCESS_TOKEN
export const GcsApplicationCredentials = process.env.GCS_APPLICATION_CREDENTIALS
export const Nextcloudurl = process.env.NEXTCLOUD_URL
export const Nextclouduser = process.env.NEXTCLOUD_USER
export const Nextcloudpassword = process.env.NEXTCLOUD_PASSWORD

export const getBitcoinCoreRPCConfig = () => {
  return {
    network: process.env.NETWORK,
    username: process.env.BITCOINDRPCUSER || "rpcuser",
    password: process.env.BITCOINDRPCPASS || "rpcpassword",
    host: process.env.BITCOINDADDR,
    port: parseInt(process.env.BITCOINDPORT || "8332", 10),
    timeout: parseInt(process.env.BITCOINDTIMEOUT || "20000", 10),
    version: "24.0.0",
  }
}

export const LND_HEALTH_REFRESH_TIME_MS = parseInt(
  process.env.LND_HEALTH_REFRESH_TIME_MS || "20000",
  10,
)

export const getLoopConfig = () => {
  if (getCronConfig().swapEnabled) {
    if (!process.env.LND1_LOOP_TLS) throw new ConfigError("Missing LND1_LOOP_TLS config")
    if (!process.env.LND2_LOOP_TLS) throw new ConfigError("Missing LND2_LOOP_TLS config")
    if (!process.env.LND1_LOOP_MACAROON)
      throw new ConfigError("Missing LND1_LOOP_MACAROON config")
    if (!process.env.LND2_LOOP_MACAROON)
      throw new ConfigError("Missing LND2_LOOP_MACAROON config")
    return {
      lnd1LoopTls: process.env.LND1_LOOP_TLS,
      lnd1LoopMacaroon: process.env.LND1_LOOP_MACAROON as Macaroon,
      lnd2LoopTls: process.env.LND2_LOOP_TLS,
      lnd2LoopMacaroon: process.env.LND2_LOOP_MACAROON as Macaroon,
    }
  }
  throw new ConfigError("getLoopConfig() was called though swapEnabled is false")
}

export const getKratosPasswords = () => {
  if (!process.env.KRATOS_MASTER_USER_PASSWORD) {
    throw new ConfigError("KRATOS_MASTER_USER_PASSWORD env not found")
  }
  if (!process.env.KRATOS_CALLBACK_API_KEY) {
    throw new ConfigError("KRATOS_CALLBACK_API_KEY env not found")
  }
  return {
    masterUserPassword: process.env.KRATOS_MASTER_USER_PASSWORD,
    callbackApiKey: process.env.KRATOS_CALLBACK_API_KEY,
  }
}

// The value GOOGLE_APPLICATION_CREDENTIALS should be set in production
// This value defined the path of the config file that include the key/password
// more info at https://firebase.google.com/docs/admin/setup
// TODO: mock up the function for devnet
export const googleApplicationCredentialsIsSet = (): boolean => {
  return !!process.env.GOOGLE_APPLICATION_CREDENTIALS
}

export const mongodbCredentials = () => {
  const user = process.env.MONGODB_USER
  const password = process.env.MONGODB_PASSWORD
  const address = process.env.MONGODB_ADDRESS ?? "mongodb"
  const db = process.env.MONGODB_DATABASE ?? "galoy"

  return { user, password, address, db }
}
