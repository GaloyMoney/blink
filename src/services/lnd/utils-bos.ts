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

  const lnds = getLnds({ type: "offchain", active: true })

  for (const lnd of lnds) {
    await reconnect({ lnd })
  }
}

export const rebalancingInternalChannels = async () => {
  const lndService = LndService()
  if (lndService instanceof Error) throw lndService

  const lnds = getLnds({ type: "offchain", active: true })

  if (lnds.length !== 2) {
    // TODO: rebalancing algo for more than 2 internal nodes
    baseLogger.warn("rebalancing needs 2 active internal nodes")
    return
  }

  const selfLnd = lnds[0].lnd
  const otherLnd = lnds[1].lnd
  const selfPubkey = lnds[0].pubkey
  const otherPubkey = lnds[1].pubkey

  const { channels } = await getDirectChannels({ lnd: selfLnd, otherPubkey })
  for (const channel of channels) {
    console.log({ channel })
    const diff = channel.capacity / 2 /* half point */ - channel.local_balance

    const settings = {
      avoid: [],
      fs: { getFile: readFile },
      logger: baseLogger /* expecting winston logger but pino should be api compatible */,
      max_fee: 0,
      quiz_answers: [],
      request: simpleRequest,
      amount: String(Math.abs(diff)),
      is_omitting_message_from: false,
    }

    console.log({ selfPubkey, otherPubkey })

    if (diff > 0) {
      // there is more liquidity on the other node
      await pushPayment({
        lnd: otherLnd,
        destination: selfPubkey,
        ...settings,
      })
    } else {
      console.log({ otherPubkey, settings })

      // there is more liquidity on the local node
      await pushPayment({
        lnd: selfLnd,
        destination: otherPubkey,
        ...settings,
      })
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
