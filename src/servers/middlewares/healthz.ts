import express from "express"
import mongoose from "mongoose"
import { redis } from "@services/redis"
import { lndStatusEvent } from "@services/lnd/health"

type HealthzArgs = {
  checkDbConnectionStatus: boolean
  checkRedisStatus: boolean
  checkLndsStatus: boolean
}

type EventLndActive = {
  pubkey: string
  active: boolean
}

export default function ({
  checkDbConnectionStatus,
  checkRedisStatus,
  checkLndsStatus,
}: HealthzArgs) {
  const lndStatus: { [key: string]: boolean } = {}
  if (checkLndsStatus) {
    lndStatusEvent.on("started", ({ pubkey, active }: EventLndActive) => {
      lndStatus[pubkey] = active
    })

    lndStatusEvent.on("stopped", ({ pubkey, active }: EventLndActive) => {
      lndStatus[pubkey] = active
    })
  }

  return async (_req: express.Request, res: express.Response) => {
    const isMongoAlive = !checkDbConnectionStatus || mongoose.connection.readyState === 1
    const isRedisAlive = !checkRedisStatus || (await isRedisAvailable())
    const statuses = Object.values(lndStatus)
    const areLndsAlive =
      !checkLndsStatus || (statuses.length > 0 && statuses.some((s) => s))
    res.status(isMongoAlive && isRedisAlive && areLndsAlive ? 200 : 503).send()
  }
}

const isRedisAvailable = async (): Promise<boolean> => {
  try {
    return (await redis.ping()) === "PONG"
  } catch {
    return false
  }
}
