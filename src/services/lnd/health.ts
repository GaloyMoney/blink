import { getWalletInfo } from "lightning"

import { baseLogger } from "@services/logger"

import { params } from "./auth"

/* eslint-disable @typescript-eslint/no-var-requires */
const EventEmitter = require("events")

const refresh_time = 10000 // ms

const isUpLoop = (param) => setInterval(() => isUp(param), refresh_time)

export const isUp = async (param): Promise<void> => {
  let active
  const { lnd, socket } = param

  try {
    // will throw if there is an error
    await getWalletInfo({ lnd })
    active = true
  } catch (err) {
    baseLogger.warn({ err }, `can't get wallet info from ${socket}`)
    active = false
  }

  if (active && !param.active) {
    lndStatusEvent.emit("started", param)
  }

  if (!active && param.active) {
    lndStatusEvent.emit("stopped", param)
  }

  param.active = active
  baseLogger.debug({ socket, active }, "lnd pulse")
}

// launching a loop to update whether lnd are active or not
export const activateLndHealthCheck = () => params.forEach(isUpLoop)

class LndStatusEventEmitter extends EventEmitter {}
export const lndStatusEvent = new LndStatusEventEmitter()
