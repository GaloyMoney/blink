import { authenticatedLndGrpc, getWalletInfo } from 'lightning';
import _ from "lodash";
import { baseLogger } from "./logger";
import { params } from "./lndAuth"

const refresh_time = 5000 // ms

// TODO replace with
// const asyncForever = require('async/forever');
export const isUpLoop = async (param): Promise<void> => {
  let active
  const { lnd, socket } = param

  try {
    // will throw if there is an error
    await getWalletInfo({lnd})
    active = true
  } catch (err) {
    baseLogger.warn({err}, `can't get wallet info from ${socket}`)

    // if we get disconnected, we need to recreate the lnd object
    param.lnd = authenticatedLndGrpc(param).lnd

    active = false
  }

  console.log({active, param: param.active})

  if (active && !param.active) {
    lndStatusEvent.emit("started", param)
  }

  if (!active && param.active) {
    lndStatusEvent.emit("stopped", param)
  }

  param.active = active
  baseLogger.info({socket, active}, "lnd pulse")

  setTimeout(async function () {
    // TODO check if this could lead to a stack overflow
    isUpLoop(param)
  }, refresh_time);
}

// launching a loop to update whether lnd are active or not
export const activateLndHealthCheck = () => params.forEach(isUpLoop)

const EventEmitter = require('events');
class LndStatusEventEmitter extends EventEmitter{}
export const lndStatusEvent = new LndStatusEventEmitter();
