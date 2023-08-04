import { getCronConfig } from "./yaml"

import { ConfigError } from "./error"
import { env } from "./env"

export const getGeetestConfig = () => {
  const id = env.GEETEST_ID
  const key = env.GEETEST_KEY

  if (!id) throw new ConfigError("Missing GEETEST_ID config")
  if (!key) throw new ConfigError("Missing GEETEST_KEY config")

  const config = { id, key }
  return config
}

export const isProd = process.env.NODE_ENV === "production"
export const isRunningJest = typeof jest !== "undefined"

export const DropboxAccessToken = process.env.DROPBOX_ACCESS_TOKEN
export const GcsApplicationCredentials = process.env.GCS_APPLICATION_CREDENTIALS
export const Nextcloudurl = process.env.NEXTCLOUD_URL
export const Nextclouduser = process.env.NEXTCLOUD_USER
export const Nextcloudpassword = process.env.NEXTCLOUD_PASSWORD

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

export const defaultLoginCode = () => {
  const code = process.env.UNSECURE_DEFAULT_LOGIN_CODE
  return {
    enabled: !!code,
    code,
  }
}

export const feedback = {
  mattermostWebhookUrl: process.env.MATTERMOST_WEBHOOK_URL,
}
