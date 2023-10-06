import express from "express"
import mongoose from "mongoose"

import { redis } from "@/services/redis"
import { lndStatusEvent } from "@/services/lnd/health"
import { OnChainService } from "@/services/bria"

type HealthzArgs = {
  checkDbConnectionStatus: boolean
  checkRedisStatus: boolean
  checkLndsStatus: boolean
  checkBriaStatus: boolean
}

type EventLndActive = {
  pubkey: string
  active: boolean
}

export default function ({
  checkDbConnectionStatus,
  checkRedisStatus,
  checkLndsStatus,
  checkBriaStatus,
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
    const isBriaAlive = !checkBriaStatus || (await isBriaAvailable())
    const statuses = Object.values(lndStatus)
    const areLndsAlive =
      !checkLndsStatus || (statuses.length > 0 && statuses.some((s) => s))
    res
      .status(isMongoAlive && isRedisAlive && isBriaAlive && areLndsAlive ? 200 : 503)
      .send()
  }
}

const isRedisAvailable = async (): Promise<boolean> => {
  try {
    return (await redis.ping()) === "PONG"
  } catch {
    return false
  }
}

const isBriaAvailable = async (): Promise<boolean> => {
  try {
    // TODO: replace by bria health check query or other bria method
    const service = OnChainService()
    const response = await service.getHotBalance()
    return !(response instanceof Error)
  } catch {
    return false
  }
}
