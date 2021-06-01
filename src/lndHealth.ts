import { authenticatedLndGrpc, getWalletInfo } from 'lightning';
import _ from "lodash";
import { baseLogger } from "./logger";

const refresh_time = 5000 // ms

// TODO replace with
// const asyncForever = require('async/forever');
export const isUpLoop = async ({socket, params}): Promise<void> => {
  let active
  try {
    // @ts-ignore
    const { lnd } = _.find(params, {socket})

    // will throw if there is an error
    await getWalletInfo({lnd})
    active = true
  } catch (err) {
    baseLogger.warn({err}, `can't get wallet info from ${socket}`)

    // if we get disconnected, we need to recreate the lnd object
    const paramIndex = _.findIndex(params, {socket})
    params[paramIndex] = {
      ...params[paramIndex],
      lnd: authenticatedLndGrpc(params[paramIndex]).lnd
    }

    active = false
  }
  _.find(params, {socket}).active = active
  baseLogger.info({socket, active}, "lnd pulse")

  setTimeout(async function () {
    // TODO check if this could lead to a stack overflow
    isUpLoop({socket, params})
  }, refresh_time);
}

// launching a loop to update whether lnd are active or not
// params.forEach(isUpLoop)