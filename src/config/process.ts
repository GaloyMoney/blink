import { ConfigError } from "./error"

type TwilioConfig = {
  accountSid: string
  authToken: string
  twilioPhoneNumber: string
}

export const GALOY_API_PORT = process.env.GALOY_API_PORT || 4002
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
  const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER

  if (!accountSid || !authToken || !twilioPhoneNumber) {
    throw new ConfigError("missing key for twilio")
  }

  return {
    accountSid,
    authToken,
    twilioPhoneNumber,
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
export const isDev = process.env.NODE_ENV === "development"
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
    password: process.env.BITCOINDRPCPASS,
    host: process.env.BITCOINDADDR,
    port: process.env.BITCOINDPORT,
    version: "0.22.0",
  }
}

export const LND_HEALTH_REFRESH_TIME_MS = parseInt(
  process.env.LND_HEALTH_REFRESH_TIME_MS || "20000",
  10,
)
