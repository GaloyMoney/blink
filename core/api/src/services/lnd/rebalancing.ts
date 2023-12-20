import {
  GetChannelsResult,
  createInvoice,
  getChannels,
  payViaPaymentRequest,
} from "lightning"

import { getLnds } from "./config"

import { LndService } from "."

import { delayWhile } from "@/utils"

import { baseLogger } from "@/services/logger"
import { addAttributesToCurrentSpan } from "@/services/tracing"

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

  const internalChannelsHavePendingHtlcs = async () => {
    const { channels } = await getDirectChannels({ lnd: selfLnd, otherPubkey })
    let count = 0
    for (const chan of channels) {
      count += chan.pending_payments.length
    }
    return count === 0
  }

  for (const channel of largestChannel) {
    const diff = channel.capacity / 2 /* half point */ - channel.local_balance
    const amount = Math.abs(diff)

    if (diff > 0) {
      const { id, request } = await createInvoice({
        lnd: selfLnd,
        tokens: amount,
        is_including_private_channels: true,
      })

      await payViaPaymentRequest({
        lnd: otherLnd,
        request,
      })

      addAttributesToCurrentSpan({
        "payment.request.hash": id,
        "payment.request.amount": amount,
        "payment.request": request,
      })

      await delayWhile({ func: internalChannelsHavePendingHtlcs, maxRetries: 10 })
    } else if (diff < 0) {
      const { id, request } = await createInvoice({
        lnd: otherLnd,
        tokens: amount,
        is_including_private_channels: true,
      })

      await payViaPaymentRequest({
        lnd: selfLnd,
        request,
      })

      addAttributesToCurrentSpan({
        "payment.request.hash": id,
        "payment.request.amount": amount,
        "payment.request": request,
      })

      await delayWhile({ func: internalChannelsHavePendingHtlcs, maxRetries: 10 })
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
