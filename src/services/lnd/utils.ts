import assert from "assert"

import { MS_PER_DAY, ONCHAIN_SCAN_DEPTH_CHANNEL_UPDATE } from "@config"
import { DbError, LndOfflineError } from "@core/error"
import { baseLogger } from "@services/logger"
import { ledger } from "@services/mongodb"
import { WalletInvoicesRepository } from "@services/mongoose"
import { DbMetadata } from "@services/mongoose/schema"
import { default as axios } from "axios"
import {
  deleteFailedPayAttempts,
  getChainBalance,
  getChainTransactions,
  getChannelBalance,
  getChannels,
  getClosedChannels,
  getForwards,
  getInvoice,
  getPendingChainBalance,
  getWalletInfo,
  SubscribeToChannelsChannelClosedEvent,
  SubscribeToChannelsChannelOpenedEvent,
} from "lightning"
import sumBy from "lodash.sumby"
import groupBy from "lodash.groupby"
import mapValues from "lodash.mapvalues"
import map from "lodash.map"

import { params } from "./auth"

export const deleteExpiredWalletInvoice = async () => {
  const walletInvoicesRepo = WalletInvoicesRepository()

  // this should be longer than the invoice validity time
  const delta = 90 // days

  const date = new Date(Date.now())
  date.setDate(date.getDate() - delta)

  const result = await walletInvoicesRepo.deleteUnpaidOlderThan(date)
  if (result instanceof Error) {
    baseLogger.error({ error: result }, "error deleting expired invoices")
    return 0
  }

  return result
}

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

export const lndsBalances = async () => {
  const data = await Promise.all(getLnds().map(({ lnd }) => lndBalances({ lnd })))
  return {
    total: sumBy(data, "total"),
    onChain: sumBy(data, "onChain"),
    offChain: sumBy(data, "offChain"),
    opening_channel_balance: sumBy(data, "opening_channel_balance"),
    closing_channel_balance: sumBy(data, "closing_channel_balance"),
  }
}

export const lndBalances = async ({ lnd }) => {
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

export async function nodeStats({ lnd }) {
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
  const data = offchainLnds.map(({ lnd }) => nodeStats({ lnd }))
  // TODO: try if we don't need a Promise.all()
  return Promise.all(data)
}

export async function getBosScore() {
  try {
    const { data } = await axios.get("https://bos.lightning.jorijn.com/data/export.json")

    // FIXME: manage multiple nodes
    const { lnd } = getActiveLnd()
    const pubKey = (await getWalletInfo({ lnd })).public_key
    const bosScore = data.data.find(({ publicKey }) => publicKey === pubKey)
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
  const dateGroupedForwards = groupBy(forwards, (e) =>
    new Date(e.created_at).toDateString(),
  )

  // returns revenue for each date by reducing all forwards for each date
  const feePerDate = mapValues(
    dateGroupedForwards,
    (e) => e.reduce((sum, { fee_mtokens }) => sum + +fee_mtokens, 0) / 1000,
  )

  // returns an array of objects where each object has key = date and value = fees
  return map(feePerDate, (v, k) => ({ [k]: v }))
}

export const getInvoiceAttempt = async ({ lnd, id }) => {
  try {
    const result = await getInvoice({ lnd, id })
    return result
  } catch (err) {
    const invoiceNotFound = "unable to locate invoice"
    if (err.length === 3 && err[2]?.err?.details === invoiceNotFound) {
      return null
    }
    // must be wrapped error?
    throw err
  }
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

  // get fee collected day wise
  const { lnd } = getActiveLnd()
  const forwards = await getRoutingFees({ lnd, before, after })

  for (const forward of forwards) {
    const [[day, fee]] = Object.entries(forward)
    try {
      await ledger.addLndRoutingFee({ amount: fee, collectedOn: day })
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

export const updateEscrows = async () => {
  // FIXME: update escrow of all the node
  const { lnd } = getActiveLnd()
  const { channels } = await getChannels({ lnd })

  const selfInitiatedChannels = channels.filter(
    ({ is_partner_initiated }) => is_partner_initiated === false,
  )
  const escrowInLnd = sumBy(selfInitiatedChannels, "commit_transaction_fee")

  const result = await ledger.updateLndEscrow({ amount: escrowInLnd })

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

  const fee = tx.fee

  // let tx
  // try {
  //   tx = await bitcoindDefaultClient.getRawTransaction(txid, true /* include_watchonly */ )
  // } catch (err) {
  //   baseLogger.error({err}, "can't fetch fee for closing tx")
  // }

  // TODO: there is no fee currently given by bitcoind for raw transaction
  // either calculate it from the input, or use an indexer
  // const { fee } = tx.fee

  assert(fee > 0)

  await ledger.addLndChannelFee({
    description: `channel ${stateChange} onchain fee`,
    amount: fee,
    metadata: { txid },
  })

  baseLogger.info({ channel, fee, txid }, `${stateChange} channel fee added to ledger`)
}

export const getLnds = ({
  type,
  active,
}: { type?: nodeType; active?: boolean } = {}): LndParamsAuthed[] => {
  let result = params

  if (type) {
    result = result.filter((node) => node.type.some((nodeType) => nodeType === type))
  }

  if (active) {
    result = result.filter(({ active }) => active)
  }

  return result
}

export const offchainLnds = getLnds({ type: "offchain" })

// only returning the first one for now
export const getActiveLnd = () => {
  const lnds = getLnds({ active: true, type: "offchain" })
  if (lnds.length === 0) {
    throw new LndOfflineError("no active lightning node (for offchain)")
  }
  return lnds[0]

  // an alternative that would load balance would be:
  // const index = Math.floor(Math.random() * lnds.length)
  // return lnds[index]
}

export const getActiveOnchainLnd = () => {
  const lnds = getLnds({ active: true, type: "onchain" })
  if (lnds.length === 0) {
    throw new LndOfflineError("no active lightning node (for onchain)")
  }
  return lnds[0]
}

export const onchainLnds = getLnds({ type: "onchain" })

export const nodesPubKey = offchainLnds.map((item) => item.pubkey)

export const getLndFromPubkey = ({ pubkey }: { pubkey: string }) => {
  const lnds = getLnds({ active: true })
  const lnd = lnds.filter(({ pubkey: nodePubKey }) => nodePubKey === pubkey)
  if (!lnd) {
    throw new LndOfflineError(`lnd with pubkey:${pubkey} is offline`)
  } else {
    return lnd[0]
  }
}
