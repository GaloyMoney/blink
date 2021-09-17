import assert from "assert"
import { default as axios } from "axios"
import { parsePaymentRequest } from "invoices"
import {
  getChainBalance,
  getChainTransactions,
  getChannelBalance,
  getChannels,
  getClosedChannels,
  getForwards,
  getHeight,
  getPendingChainBalance,
  getInvoice,
  getWalletInfo,
  SubscribeToChannelsChannelClosedEvent,
  SubscribeToChannelsChannelOpenedEvent,
} from "lightning"
import _ from "lodash"
import { Logger } from "pino"

import {
  getGaloyInstanceName,
  MS_PER_DAY,
  ONCHAIN_LOOK_BACK_CHANNEL_UPDATE,
} from "@config/app"

import { baseLogger } from "@services/logger"
import { ledger } from "@services/mongodb"
import { DbMetadata } from "@services/mongoose/schema"

import { DbError, LndOfflineError, ValidationInternalError } from "@core/error"
import { LoggedError } from "@core/utils"

import { FEECAP, FEEMIN, params } from "./auth"
import { WalletInvoicesRepository } from "@services/mongoose"

export const deleteExpiredInvoiceUser = async () => {
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

export const deleteFailedPaymentsAllLnds = async () => {
  baseLogger.warn("only run deleteFailedPayments on lnd 0.13")
  return Promise.resolve()
  // try {
  //   const lnds = offchainLnds
  //   for (const { lnd } of lnds)
  //     await deleteFailedPayments({lnd})
  //   }
  // } catch (err) {
  //   baseLogger.warn({ err }, "error deleting failed payment")
  // }
}

export const lndsBalances = async () => {
  const data = await Promise.all(getLnds().map(({ lnd }) => lndBalances({ lnd })))
  return {
    total: _.sumBy(data, "total"),
    onChain: _.sumBy(data, "onChain"),
    offChain: _.sumBy(data, "offChain"),
    opening_channel_balance: _.sumBy(data, "opening_channel_balance"),
    closing_channel_balance: _.sumBy(data, "closing_channel_balance"),
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

  const selfInitatedChannels = _.filter(channels, { is_partner_initiated: false })
  const escrowInLnd = _.sumBy(selfInitatedChannels, "commit_transaction_fee")

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
  const { current_block_height } = await getHeight({ lnd })
  const after = Math.max(0, current_block_height - ONCHAIN_LOOK_BACK_CHANNEL_UPDATE) // this is necessary for tests, otherwise after may be negative
  const { transactions } = await getChainTransactions({ lnd, after })
  // end dedupe

  const tx = _.find(transactions, { id: txid })

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
    result = _.filter(result, (item) => item.type.some((item) => item === type))
  }

  if (active) {
    result = _.filter(result, { active })
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
  const lnd = _.filter(lnds, { pubkey })
  if (!lnd) {
    throw new LndOfflineError(`lnd with pubkey:${pubkey} is offline`)
  } else {
    return lnd[0]
  }
}

export const validate = async ({
  params,
  logger,
}: {
  params: IFeeRequest
  logger: Logger
}) => {
  let isPushPayment = false
  let tokens
  let expires_at
  let features
  let cltv_delta
  let payment
  let destination, id, description
  let routeHint
  let messages
  let username

  if (params.invoice) {
    // TODO: use msat instead of sats for the db?

    // used as an alternative to parsePaymentRequest
    // const {lnd} = getActiveLnd()

    try {
      ;({
        id,
        safe_tokens: tokens,
        destination,
        description,
        routes: routeHint,
        payment,
        cltv_delta,
        expires_at,
        features,
      } = await parsePaymentRequest({ request: params.invoice }))
    } catch (err) {
      const error = `Error decoding the invoice`
      logger.error({ params, success: false, error }, error)
      throw new LoggedError(error)
    }

    // TODO: if expired_at expired, thrown an error
  } else {
    if (!params.username) {
      const galoyInstanceName = getGaloyInstanceName()
      const error = `a username is required for push payment to the ${galoyInstanceName}`
      throw new ValidationInternalError(error, { logger })
    }

    isPushPayment = true
    username = params.username
  }

  if (!!params.amount && !!tokens) {
    const error = `Invoice contains non-zero amount, but amount was also passed separately`
    // FIXME: create a new error. this is a not a graphl error.
    // throw new ValidationInternalError(error, {logger})

    throw new ValidationInternalError(error, { logger })
  }

  if (!params.amount && !tokens) {
    const error =
      "Invoice is a zero-amount invoice, or pushPayment is being used, but no amount was passed separately"
    // FIXME: create a new error. this is a not a graphl error.
    // throw new ValidationInternalError(error, {logger})

    throw new ValidationInternalError(error, { logger })
  }

  tokens = tokens ? tokens : params.amount

  if (tokens <= 0) {
    logger.error("A negative amount was passed")
    throw Error("amount can't be negative")
  }

  const max_fee = Math.floor(Math.max(FEECAP * tokens, FEEMIN))

  return {
    // FIXME String: https://github.com/alexbosworth/lightning/issues/24
    tokens,
    mtokens: String(tokens * 1000),
    destination,
    isPushPayment,
    id,
    routeHint,
    messages,
    max_fee,
    memoInvoice: description,
    payment,
    cltv_delta,
    expires_at,
    features,
    username,
  }
}
