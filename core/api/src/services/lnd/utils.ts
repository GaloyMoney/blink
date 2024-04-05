import { assert } from "console"

import {
  SubscribeToChannelsChannelClosedEvent,
  SubscribeToChannelsChannelOpenedEvent,
  deleteFailedPayAttempts,
  getChainBalance,
  getChainTransactions,
  getChannelBalance,
  getChannels,
  getClosedChannels,
  getForwards,
  getPendingChainBalance,
  getWalletInfo,
} from "lightning"

import groupBy from "lodash.groupby"

import map from "lodash.map"

import mapValues from "lodash.mapvalues"

import sumBy from "lodash.sumby"

import { getActiveLnd, getLnds, offchainLnds } from "./config"

import { MS_PER_DAY, ONCHAIN_SCAN_DEPTH_CHANNEL_UPDATE, ONE_DAY } from "@/config"
import { toSats } from "@/domain/bitcoin"
import { defaultTimeToExpiryInSeconds } from "@/domain/bitcoin/lightning"
import { CouldNotFindError } from "@/domain/errors"

import {
  addLndChannelOpeningOrClosingFee,
  addLndRoutingRevenue,
  updateLndEscrow,
} from "@/services/ledger/admin-legacy"
import { baseLogger } from "@/services/logger"
import { PaymentFlowStateRepository } from "@/services/mongoose"
import { DbMetadata } from "@/services/mongoose/schema"

import { timestampDaysAgo } from "@/utils"

export const deleteFailedPaymentsAttemptAllLnds = async () => {
  const lnds = offchainLnds
  for (const { lnd, socket } of lnds) {
    try {
      baseLogger.info({ socket }, "running deleteFailedPaymentsAttempt")
      await deleteFailedPayAttempts({ lnd })
    } catch (err) {
      baseLogger.warn({ err }, "error deleting failed payment")
    }
  }
}

export const deleteExpiredLightningPaymentFlows = async (): Promise<number> => {
  const paymentFlowRepo = PaymentFlowStateRepository(defaultTimeToExpiryInSeconds)

  const deleted = await paymentFlowRepo.deleteExpiredLightningPaymentFlows()
  if (deleted instanceof Error) {
    if (!(deleted instanceof CouldNotFindError)) {
      baseLogger.error({ error: deleted }, "error deleting expired payment flows")
    }
    return 0
  }
  return deleted
}

export const lndsBalances = async () => {
  const data = await Promise.all(getLnds().map(({ lnd }) => lndBalances(lnd)))
  return {
    total: toSats(sumBy(data, "total")),
    onChain: toSats(sumBy(data, "onChain")),
    offChain: toSats(sumBy(data, "offChain")),
    opening_channel_balance: toSats(sumBy(data, "opening_channel_balance")),
    closing_channel_balance: toSats(sumBy(data, "closing_channel_balance")),
  }
}

export const lndBalances = async (lnd: AuthenticatedLnd) => {
  // Onchain
  const { chain_balance } = await getChainBalance({ lnd })
  const { channel_balance, pending_balance: opening_channel_balance } =
    await getChannelBalance({ lnd })

  //FIXME: This can cause incorrect balance to be reported in case an unconfirmed txn is later cancelled/double spent
  // bitcoind seems to have a way to report this correctly. does lnd have?
  const { pending_chain_balance } = await getPendingChainBalance({ lnd })

  // get pending closed
  const { channels: closedChannels } = await getClosedChannels({ lnd })

  // FIXME: there can be issue with channel not closed completely from lnd
  // https://github.com/alexbosworth/ln-service/issues/139
  baseLogger.debug({ closedChannels }, "getClosedChannels")
  const closing_channel_balance = sumBy(closedChannels, (channel) =>
    sumBy(channel.close_payments, (payment) => (payment.is_pending ? payment.tokens : 0)),
  )

  const total =
    chain_balance +
    channel_balance +
    pending_chain_balance +
    opening_channel_balance +
    closing_channel_balance
  return {
    total,
    onChain: chain_balance + pending_chain_balance,
    offChain: channel_balance,
    opening_channel_balance,
    closing_channel_balance,
  }
}

export async function nodeStats(lnd: AuthenticatedLnd) {
  // FIXME: only return the public key from process.env
  // this would avoid a round trip to lnd
  const result = await getWalletInfo({ lnd })
  const peersCount = result.peers_count
  const channelsCount = result.active_channels_count
  const id = result.public_key
  return {
    peersCount,
    channelsCount,
    id,
  }
}

export const nodesStats = async () => {
  const data = offchainLnds.map(({ lnd }) => nodeStats(lnd))
  // TODO: try if we don't need a Promise.all()
  return Promise.all(data)
}

export const getRoutingFees = async ({
  lnd,
  before,
  after,
}: {
  lnd: AuthenticatedLnd
  before: string // FIXME should be Date?
  after: string // FIXME should be Date?
}): Promise<Array<Record<string, Satoshis>>> => {
  const forwardsList = await getForwards({ lnd, before, after })
  let next = forwardsList.next
  let forwards = forwardsList.forwards

  let finishedFetching = false
  if (!next || !forwards || forwards.length <= 0) {
    finishedFetching = true
  }

  while (!finishedFetching) {
    if (next) {
      const moreForwards = await getForwards({ lnd, token: next })
      forwards = [...forwards, ...moreForwards.forwards]
      next = moreForwards.next
    } else {
      finishedFetching = true
    }
  }

  // groups each forward object by date
  const dateGroupedForwards = groupBy(forwards, (e) =>
    new Date(e.created_at).toDateString(),
  )

  // returns revenue for each date by reducing all forwards for each date
  const feePerDate = mapValues(dateGroupedForwards, (e) =>
    toSats(e.reduce((sum, { fee_mtokens }) => sum + +fee_mtokens, 0) / 1000),
  )

  // returns an array of objects where each object has key = date and value = fees
  return map(feePerDate, (v, k) => ({ [k]: v }))
}

export const updateRoutingRevenues = async () => {
  // TODO: move to a service
  const dbMetadata = await DbMetadata.findOne({})
  let lastDate

  if (dbMetadata?.routingFeeLastEntry) {
    lastDate = new Date(dbMetadata.routingFeeLastEntry)
  } else {
    lastDate = new Date(0)
    baseLogger.info("Running the routing fee revenue cronjob for the first time")
  }

  // Done to remove effect of timezone
  lastDate.setUTCHours(0, 0, 0, 0)

  const after = lastDate.toISOString()

  const endDate = timestampDaysAgo(ONE_DAY)
  if (endDate instanceof Error) throw endDate

  // Done to remove effect of timezone
  endDate.setUTCHours(0, 0, 0, 0)

  const before = endDate.toISOString()

  // Only record fee if it has been 1d+ since last record
  if ((endDate.getTime() - lastDate.getTime()) / MS_PER_DAY < 1) {
    return
  }

  // get fee collected day wise
  const activeNode = getActiveLnd()
  if (activeNode instanceof Error) throw activeNode

  const lnd = activeNode.lnd
  const forwards = await getRoutingFees({ lnd, before, after })

  for (const forward of forwards) {
    const [[day, fee]] = Object.entries(forward)
    const result = await addLndRoutingRevenue({
      amount: fee,
      collectedOn: day,
    })
    if (result instanceof Error) {
      baseLogger.error("Unable to record routing revenue", {
        forwardToClient: false,
        logger: baseLogger,
        level: "error",
      })
    }
  }

  endDate.setDate(endDate.getDate() + 1)
  const endDay = endDate.toDateString()

  // TODO: move to a service
  await DbMetadata.findOneAndUpdate(
    {},
    { $set: { routingFeeLastEntry: endDay } },
    { upsert: true },
  )
}

export const updateEscrows = async () => {
  // FIXME: update escrow of all the node
  const activeNode = getActiveLnd()
  if (activeNode instanceof Error) throw activeNode

  const lnd = activeNode.lnd
  const { channels } = await getChannels({ lnd })

  const selfInitiatedChannels = channels.filter(
    ({ is_partner_initiated }) => is_partner_initiated === false,
  )
  const escrowInLnd = toSats(
    selfInitiatedChannels.reduce(
      (acc, chan) =>
        acc +
        (chan.capacity -
          (chan.local_balance + chan.remote_balance + chan.unsettled_balance)),
      0,
    ),
  )

  const result = await updateLndEscrow(escrowInLnd)

  baseLogger.info({ ...result, channels }, "escrow recording")
}

export const onChannelUpdated = async ({
  channel,
  lnd,
  stateChange,
}: {
  channel: SubscribeToChannelsChannelClosedEvent | SubscribeToChannelsChannelOpenedEvent
  lnd: AuthenticatedLnd
  stateChange: "opened" | "closed"
}) => {
  baseLogger.info({ channel, stateChange }, `channel update`)

  if (channel.is_partner_initiated) {
    // FIXME: this assume legacy channel, ie: non-anchored channel type
    // with anchor channels, the closing fees are not paid necessarily by the channel opener
    // but by whoever is closing the channel
    return
  }

  if (stateChange === "closed") {
    // FIXME: need to account for channel closing
    return
  }

  const { transaction_id: txid } = channel as SubscribeToChannelsChannelOpenedEvent

  // TODO: dedupe from onchain
  const { current_block_height } = await getWalletInfo({ lnd })
  const after = Math.max(0, current_block_height - ONCHAIN_SCAN_DEPTH_CHANNEL_UPDATE) // this is necessary for tests, otherwise after may be negative
  const { transactions } = await getChainTransactions({ lnd, after })
  // end dedupe

  const tx = transactions.find(({ id }) => id === txid)

  if (!tx?.fee) {
    baseLogger.error({ transactions }, "fee doesn't exist")
    return
  }

  const fee = toSats(tx.fee)

  // let tx
  // try {
  //   tx = await bitcoindDefaultClient.getRawTransaction(txid, true /* include_watchonly */ )
  // } catch (err) {
  //   baseLogger.error({err}, "can't fetch fee for closing tx")
  // }

  // TODO: there is no fee currently given by bitcoind for raw transaction
  // either calculate it from the input, or use an indexer
  // const { fee } = tx.fee

  assert(fee > 0, "fee not positive")

  const data = {
    description: `channel ${stateChange} onchain fee`,
    fee,
    metadata: { txid },
  }

  const success = await addLndChannelOpeningOrClosingFee(data)
  if (success instanceof Error) {
    baseLogger.error(data, "error onChannelUpdated")
  } else {
    baseLogger.info({ channel, fee, txid }, `${stateChange} channel fee added to ledger`)
  }
}
