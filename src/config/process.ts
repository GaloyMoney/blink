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

export const isRunningJest = typeof jest !== "undefined"

export const getLoopConfig = () => {
  if (getCronConfig().swapEnabled) {
    if (!env.LND1_LOOP_TLS) throw new ConfigError("Missing LND1_LOOP_TLS config")
    if (!env.LND2_LOOP_TLS) throw new ConfigError("Missing LND2_LOOP_TLS config")
    if (!env.LND1_LOOP_MACAROON)
      throw new ConfigError("Missing LND1_LOOP_MACAROON config")
    if (!env.LND2_LOOP_MACAROON)
      throw new ConfigError("Missing LND2_LOOP_MACAROON config")
    return {
      lnd1LoopTls: env.LND1_LOOP_TLS,
      lnd1LoopMacaroon: env.LND1_LOOP_MACAROON as Macaroon,
      lnd2LoopTls: env.LND2_LOOP_TLS,
      lnd2LoopMacaroon: env.LND2_LOOP_MACAROON as Macaroon,
    }
  }
  throw new ConfigError("getLoopConfig() was called though swapEnabled is false")
}
