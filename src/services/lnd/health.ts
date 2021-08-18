import { getWalletStatus } from "lightning"

import { baseLogger } from "@services/logger"

import { params } from "./auth"

/*

	Check the status of the wallet and emit current state

	Wallet can be in the following states:
		NON_EXISTING
    LOCKED
    UNLOCKED
    RPC_ACTIVE
    WAITING_TO_START

*/

/* eslint-disable @typescript-eslint/no-var-requires */
const EventEmitter = require("events")

const refresh_time = 10000 // ms

const isUpLoop = (param) => setInterval(() => isUp(param), refresh_time)

export const isUp = async (param): Promise<void> => {
  let active
  const { lnd, socket } = param

  try {
    // will throw if there is an error
    var { state } = await getWalletStatus({ lnd })
    active = true
  } catch (err) {
    baseLogger.warn({ err }, `can't get wallet info from ${socket}`)
    active = false
  }

  if (state == "RPC_ACTIVE") {
    lndStatusEvent.emit("started", param)
  } else {
    lndStatusEvent.emit("stopped", param)
	}

  param.active = active
  baseLogger.debug({ socket, active }, "lnd pulse")
}

// launching a loop to update whether lnd are active or not
export const activateLndHealthCheck = () => params.forEach(isUpLoop)

class LndStatusEventEmitter extends EventEmitter {}
export const lndStatusEvent = new LndStatusEventEmitter()
