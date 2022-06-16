import { getWalletStatus } from "lightning"
import { baseLogger } from "@services/logger"

import { LND_HEALTH_REFRESH_TIME_MS } from "@config"

import { params as unauthParams } from "./unauth"
import { params as authParams } from "./auth"

/*

	Check the status of the wallet and emit current state

*/

/* eslint-disable @typescript-eslint/no-var-requires */
const EventEmitter = require("events")

const intervals: NodeJS.Timer[] = []

const isUpLoop = async (param: LndParamsUnAuthed) => {
  await isUp(param)
  const interval = setInterval(async () => {
    await isUp(param)
  }, LND_HEALTH_REFRESH_TIME_MS)
  intervals.push(interval)
}

const isLndUp = async (param: LndParamsUnAuthed): Promise<void> => {
  let active = false
  const { lnd, socket, active: isParamActive } = param

  try {
    // will throw if there is an error
    const { is_active, is_ready } = await getWalletStatus({ lnd })
    active = !!is_active && !!is_ready
  } catch (err) {
    baseLogger.warn({ err }, `can't get wallet info from ${socket}`)
    active = false
  }

  const authParam = authParams.find((p) => p.socket === socket)
  if (authParam) {
    authParam.active = active
  }
  param.active = active

  if (active && !isParamActive) {
    lndStatusEvent.emit("started", authParam || param)
  }

  if (!active && isParamActive) {
    lndStatusEvent.emit("stopped", authParam || param)
  }

  baseLogger.debug({ socket, active }, "lnd pulse")
}

export const isUp = isLndUp

// launching a loop to update whether lnd are active or not
export const activateLndHealthCheck = () => unauthParams.forEach(isUpLoop)

export const stopLndHealthCheck = () => intervals.forEach(clearInterval)

class LndStatusEventEmitter extends EventEmitter {}
export const lndStatusEvent = new LndStatusEventEmitter()
