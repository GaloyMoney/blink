import { authenticatedLndGrpc, getWalletInfo } from 'lightning';
import _ from "lodash";
import { baseLogger } from "./logger";
import { ILndParamsAuthed } from "./lndAuth"

const refresh_time = 5000 // ms

// TODO replace with
// const asyncForever = require('async/forever');
const loop = async ({socket, params}: {socket: string, params: ILndParamsAuthed}) => {
  try {
    await isUp({socket, params})
  } finally {
    setTimeout(async function () {
      // TODO check if this could lead to a stack overflow
      loop({socket, params})
    }, refresh_time);
  }
}

export const isUp = async ({socket, params}): Promise<void> => {
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
  _.find(params, {socket})!.active = active
  baseLogger.info({socket, active}, "lnd pulse")
}

// launching a loop to update whether lnd are active or not
// params.forEach(loop)