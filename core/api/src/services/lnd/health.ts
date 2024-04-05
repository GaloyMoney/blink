import { EventEmitter } from "events"

import { getWalletStatus } from "lightning"

import { lndsConnect } from "./auth"

import { baseLogger } from "@/services/logger"

/*
	Check the status of the wallet and emit current state
*/

const intervals: NodeJS.Timeout[] = []

const refreshTime = 20000

const isUpLoop = async (param: LndConnect): Promise<void> => {
  await isUp(param)
  const interval = setInterval(async () => {
    await isUp(param)
  }, refreshTime)
  intervals.push(interval)
}

const isLndUp = async (param: LndConnect): Promise<void> => {
  let active = false
  const { lndGrpcUnauth: lnd, socket, active: pastStateActive } = param

  try {
    const { is_active, is_ready } = await getWalletStatus({ lnd })
    active = !!is_active && !!is_ready
  } catch (err) {
    baseLogger.warn({ err }, `can't get wallet info from ${socket}`)
    active = false
  }

  param.active = active

  if (active && !pastStateActive) {
    lndStatusEvent.emit("started", param)
  }

  if (!active && pastStateActive) {
    lndStatusEvent.emit("stopped", param)
  }

  baseLogger.trace({ socket, active, pastStateActive }, "lnd pulse")
}

export const isUp = isLndUp

// launching a loop to update whether lnd are active or not
export const activateLndHealthCheck = () => lndsConnect.forEach(isUpLoop)

export const checkAllLndHealth = async () => {
  for (const param of lndsConnect) {
    await isLndUp(param)
  }
}

export const stopLndHealthCheck = () => intervals.forEach(clearInterval)

class LndStatusEventEmitter extends EventEmitter {}
export const lndStatusEvent = new LndStatusEventEmitter()
