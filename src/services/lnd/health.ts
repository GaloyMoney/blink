import { getWalletStatus } from "lightning"
import { baseLogger } from "@services/logger"

import { params } from "./unauth"

/*

	Check the status of the wallet and emit current state

*/

/* eslint-disable @typescript-eslint/no-var-requires */
const EventEmitter = require("events")

const refresh_time = 10000 // ms

const isUpLoop = (param) =>
  setInterval(async () => {
    await isUp(param)
  }, refresh_time)

export const isUp = async (param): Promise<void> => {
  let active = false
  const { lnd, socket } = param

  try {
    // will throw if there is an error
    const { is_active } = await getWalletStatus({ lnd })
    active = !!is_active
  } catch (err) {
    baseLogger.warn({ err }, `can't get wallet info from ${socket}`)
    active = false
  }

  const event = active ? "started" : "stopped"

  param.active = active
  lndStatusEvent.emit(event, param)

  baseLogger.debug({ socket, active }, "lnd pulse")
}

// launching a loop to update whether lnd are active or not
export const activateLndHealthCheck = () => params.forEach(isUpLoop)

class LndStatusEventEmitter extends EventEmitter {}
export const lndStatusEvent = new LndStatusEventEmitter()
