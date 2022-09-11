import { readFile } from "fs"

import { baseLogger } from "@services/logger"

import { getChannels, GetChannelsResult } from "lightning"

import { pushPayment, reconnect } from "balanceofsatoshis/network"

import { simpleRequest } from "balanceofsatoshis/commands"

import { getLnds } from "./utils"

import { LndService } from "."

export const reconnectNodes = async () => {
  const lndService = LndService()
  if (lndService instanceof Error) throw lndService

  const lndsParamsAuth = getLnds({ type: "offchain", active: true })

  for (const lndParamsAuth of lndsParamsAuth) {
    const { lnd } = lndParamsAuth
    await reconnect({ lnd })
  }
}

export const rebalancingInternalChannels = async () => {
  const lndService = LndService()
  if (lndService instanceof Error) throw lndService

  const lndsParamsAuth = getLnds({ type: "offchain", active: true })

  if (lndsParamsAuth.length !== 2) {
    // TODO: rebalancing algo for more than 2 internal nodes
    baseLogger.warn("rebalancing needs 2 active internal nodes")
    return
  }

  const selfLnd = lndsParamsAuth[0].lnd
  const otherLnd = lndsParamsAuth[1].lnd
  const selfPubkey = lndsParamsAuth[0].pubkey
  const otherPubkey = lndsParamsAuth[1].pubkey

  const { channels } = await getDirectChannels({ lnd: selfLnd, otherPubkey })

  if (channels.length === 0) {
    baseLogger.warn("need at least one active channel to rebalance")
    return
  }

  // TODO:
  // we currently only rebalancing the biggest channel between both peers.

  // we need to be able to specify the channel for when we have many direct channels
  // but pushPayment doesn't take a channelId currently
  const largestChannel = [channels.sort((a, b) => (a.capacity > b.capacity ? -1 : 1))[0]]

  for (const channel of largestChannel) {
    const diff = channel.capacity / 2 /* half point */ - channel.local_balance

    const settings = {
      avoid: [],
      fs: { getFile: readFile },
      logger: baseLogger /* expecting winston logger but pino should be api compatible */,
      max_fee: 0,
      quiz_answers: [],
      request: simpleRequest,
      amount: String(Math.abs(diff)),
    }

    if (diff > 0) {
      // there is more liquidity on the other node
      await pushPayment({
        lnd: otherLnd,
        destination: selfPubkey,
        ...settings,
      })
    } else if (diff < 0) {
      // there is more liquidity on the local node
      await pushPayment({
        lnd: selfLnd,
        destination: otherPubkey,
        ...settings,
      })
    } else {
      baseLogger.info("no rebalancing needed")
    }
  }
}

const getDirectChannels = async ({
  lnd,
  otherPubkey,
}: {
  lnd: AuthenticatedLnd
  otherPubkey: Pubkey
}): Promise<GetChannelsResult> => getChannels({ lnd, partner_public_key: otherPubkey })
