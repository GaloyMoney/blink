import assert from "assert"

import { MS_PER_DAY, ONCHAIN_SCAN_DEPTH_CHANNEL_UPDATE, ONE_DAY } from "@config"
import { toSats } from "@domain/bitcoin"
import {
  defaultTimeToExpiryInSeconds,
  NoValidNodeForPubkeyError,
  OffChainServiceUnavailableError,
} from "@domain/bitcoin/lightning"
import { OnChainServiceUnavailableError } from "@domain/bitcoin/onchain"
import { CouldNotFindError } from "@domain/errors"

import {
  addLndChannelOpeningOrClosingFee,
  addLndRoutingRevenue,
  updateLndEscrow,
} from "@services/ledger/admin-legacy"
import { baseLogger } from "@services/logger"
import { WalletInvoicesRepository, PaymentFlowStateRepository } from "@services/mongoose"
import { DbMetadata } from "@services/mongoose/schema"

import { timestampDaysAgo } from "@utils"

import { default as axios } from "axios"
import {
  deleteFailedPayAttempts,
  getChainBalance,
  getChainTransactions,
  getChannelBalance,
  getChannels,
  getClosedChannels,
  getForwards,
  getPendingChainBalance,
  getWalletInfo,
  SubscribeToChannelsChannelClosedEvent,
  SubscribeToChannelsChannelOpenedEvent,
} from "lightning"
import groupBy from "lodash.groupby"
import map from "lodash.map"
import mapValues from "lodash.mapvalues"
import sumBy from "lodash.sumby"

import { params } from "./auth"

export const deleteExpiredWalletInvoice = async (): Promise<number> => {
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

  // adds 330 sats for every selfInitiatedChannel even if not all channels use anchor
  const { channels } = await getChannels({ lnd })
  const selfInitiatedChannels = channels.filter(
    ({ is_partner_initiated }) => is_partner_initiated === false,
  )
  const satsAnchorOutput = 330
  const anchorBalance = selfInitiatedChannels.length * satsAnchorOutput

  const total =
    chain_balance +
    anchorBalance +
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

export async function getBosScore() {
  try {
    const { data } = await axios.get("https://bos.lightning.jorijn.com/data/export.json")

    // FIXME: manage multiple nodes
    const activeNode = getActiveLnd()
    if (activeNode instanceof Error) return 0

    const bosScore = data.data.find(
      ({ publicKey }: { publicKey: string }) => publicKey === activeNode.pubkey,
    )
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
  const escrowInLnd = toSats(sumBy(selfInitiatedChannels, "commit_transaction_fee"))

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

  assert(fee > 0)

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

export const getLnds = ({
  type,
  active,
}: { type?: NodeType; active?: boolean } = {}): LndParamsAuthed[] => {
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
export const getActiveLnd = (): LndParamsAuthed | LightningServiceError => {
  const lnds = getLnds({ active: true, type: "offchain" })
  if (lnds.length === 0) {
    return new OffChainServiceUnavailableError("no active lightning node (for offchain)")
  }
  return lnds[0]

  // an alternative that would load balance would be:
  // const index = Math.floor(Math.random() * lnds.length)
  // return lnds[index]
}

export const getActiveOnchainLnd = (): LndParamsAuthed | OnChainServiceError => {
  const lnds = getLnds({ active: true, type: "onchain" })
  if (lnds.length === 0) {
    return new OnChainServiceUnavailableError("no active lightning node (for onchain)")
  }
  return lnds[0]
}

export const onchainLnds = getLnds({ type: "onchain" })

export const nodesPubKey = offchainLnds.map((item) => item.pubkey)

export const getLndFromPubkey = ({
  pubkey,
}: {
  pubkey: string
}): AuthenticatedLnd | LightningServiceError => {
  const lnds = getLnds({ active: true })
  const lndParams = lnds.find(({ pubkey: nodePubKey }) => nodePubKey === pubkey)
  return (
    lndParams?.lnd ||
    new NoValidNodeForPubkeyError(`lnd with pubkey:${pubkey} is offline`)
  )
}

// A rough description of the error type we get back from the
// 'lightning' library can be described as:
//
// [
//   0: <Error Classification Code Number>
//   1: <Error Type String>
//   2: {
//     err?: <Error Code Details Object>
//     failures?: [
//       [
//         0: <Error Code Number>
//         1: <Error Code Message String>
//         2: {
//           err?: <Error Code Details Object>
//         }
//       ]
//     ]
//   }
// ]
//
// where '<Error Code Details Object>' is an Error object with
// the usual 'message', 'stack' etc. properties and additional
// properties: 'code', 'details', 'metadata'.
/* eslint @typescript-eslint/ban-ts-comment: "off" */
// @ts-ignore-next-line no-implicit-any error
export const parseLndErrorDetails = (err) =>
  err[2]?.err?.details || err[2]?.failures?.[0]?.[2]?.err?.details || err[1]
