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
const networks = ["mainnet", "testnet", "regtest"]
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
  const config = {
    id: process.env.GEETEST_ID,
    key: process.env.GEETEST_KEY,
  }
  // FIXME: Geetest should be optional.
  if (!config.id || !config.key) {
    throw new ConfigError("Geetest config not found")
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

// FIXME: we have process.env.NODE_ENV === "production" | "development" | "test"
// "test" might not be needed

export const isProd = process.env.NODE_ENV === "production"
export const isDev = process.env.NODE_ENV === "development"
export const isRunningJest = typeof jest !== "undefined"

export const DropboxAccessToken = process.env.DROPBOX_ACCESS_TOKEN
export const GcsApplicationCredentials = process.env.GCS_APPLICATION_CREDENTIALS
