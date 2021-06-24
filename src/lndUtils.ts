import { default as axios } from "axios"
import {
  getChainBalance,
  getChannelBalance,
  getClosedChannels,
  getForwards,
  getPendingChainBalance,
  getWalletInfo,
} from "lightning"
import _ from "lodash"
import { lnd } from "./lndConfig"
import { baseLogger } from "./logger"
import { DbMetadata } from "./schema"
import { MainBook } from "./mongodb"
import { lndAccountingPath, revenueFeePath } from "./ledger/ledger"
import { DbError } from "./error"

// milliseconds in a day
const MS_PER_DAY = 864e5

export const lndBalances = async () => {
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
  const closing_channel_balance = _.sumBy(closedChannels, (channel) =>
    _.sumBy(channel.close_payments, (payment) =>
      payment.is_pending ? payment.tokens : 0,
    ),
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

export async function nodeStats({ lnd }) {
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

export async function getBosScore() {
  try {
    const { data } = await axios.get("https://bos.lightning.jorijn.com/data/export.json")
    const publicKey = (await getWalletInfo({ lnd })).public_key
    const bosScore = _.find(data.data, { publicKey })
    if (!bosScore) {
      baseLogger.info("key is not in bos list")
    }
    return bosScore.score
  } catch (err) {
    return 0
  }
}

export const getRoutingFees = async ({
  lnd,
  before,
  after,
}): Promise<Array<Record<string, number>>> => {
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
  const dateGroupedForwards = _.groupBy(forwards, (e) =>
    new Date(e.created_at).toDateString(),
  )

  // returns revenue for each date by reducing all forwards for each date
  const feePerDate = _.mapValues(
    dateGroupedForwards,
    (e) => e.reduce((sum, { fee_mtokens }) => sum + +fee_mtokens, 0) / 1000,
  )

  // returns an array of objects where each object has key = date and value = fees
  return _.map(feePerDate, (v, k) => ({ [k]: v }))
}

export const updateRoutingFees = async () => {
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

  const endDate = new Date(Date.now() - MS_PER_DAY)

  // Done to remove effect of timezone
  endDate.setUTCHours(0, 0, 0, 0)

  const before = endDate.toISOString()

  // Only record fee if it has been 1d+ since last record
  if ((endDate.getTime() - lastDate.getTime()) / MS_PER_DAY < 1) {
    return
  }

  const type = "routing_fee"
  const metadata = { type, currency: "BTC", pending: false }

  // get fee collected day wise
  const forwards = await getRoutingFees({ lnd, before, after })

  for (const forward of forwards) {
    const [[day, fee]] = Object.entries(forward)
    try {
      await MainBook.entry("routing fee")
        .credit(revenueFeePath, fee, { ...metadata, feesCollectedOn: day })
        .debit(lndAccountingPath, fee, { ...metadata, feesCollectedOn: day })
        .commit()
    } catch (err) {
      throw new DbError("Unable to record routing revenue", {
        forwardToClient: false,
        logger: baseLogger,
        level: "error",
      })
    }
  }

  endDate.setDate(endDate.getDate() + 1)
  const endDay = endDate.toDateString()
  await DbMetadata.findOneAndUpdate(
    {},
    { $set: { routingFeeLastEntry: endDay } },
    { upsert: true },
  )
}
