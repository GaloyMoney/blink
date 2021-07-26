import assert from "assert"
import { default as axios } from "axios"
import { parsePaymentRequest } from "invoices"
import {
  AuthenticatedLnd,
  getChainBalance,
  getChainTransactions,
  getChannelBalance,
  getChannels,
  getClosedChannels,
  getForwards,
  getHeight,
  getPendingChainBalance,
  getWalletInfo,
  SubscribeToChannelsChannelClosedEvent,
  SubscribeToChannelsChannelOpenedEvent,
} from "lightning"
import _ from "lodash"
import { Logger } from "pino"
import { yamlConfig } from "./config"
import { DbError, LndOfflineError, ValidationInternalError } from "./error"
import {
  escrowAccountingPath,
  lndAccountingPath,
  lndFeePath,
  revenueFeePath,
} from "./ledger/ledger"
import { FEECAP, FEEMIN, ILndParamsAuthed, nodeType, params } from "./lndAuth"
import { baseLogger } from "./logger"
import { MainBook } from "./mongodb"
import { DbMetadata, InvoiceUser } from "./schema"
import { LoggedError, LOOK_BACK } from "./utils"

// milliseconds in a day
const MS_PER_DAY = 864e5

export const deleteExpiredInvoices = async () => {
  // this should be longer than the invoice validity time
  // only useful for users that have not logged in back
  // because the expired invoices are otherwise deleted on the fly
  // from lnd, and the InvoiceUser collection are being deleted on user request
  const delta = 30 // days

  const date = new Date()
  date.setDate(date.getDate() - delta)
  await InvoiceUser.deleteMany({ timestamp: { lt: date } })
}

export const deleteFailedPaymentsAllLnds = async () => {
  baseLogger.warn("only run deleteFailedPayments on lnd 0.13")
  return await Promise.resolve()
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
  return await Promise.all(data)
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
  const { lnd } = getActiveLnd()
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

export const updateEscrows = async () => {
  const type = "escrow"
  const metadata = { type, currency: "BTC", pending: false }

  // FIXME: update escrow of all the node
  const { lnd } = getActiveLnd()
  const { channels } = await getChannels({ lnd })

  const selfInitatedChannels = _.filter(channels, { is_partner_initiated: false })
  const escrowInLnd = _.sumBy(selfInitatedChannels, "commit_transaction_fee")

  const { balance: escrowInMongodb } = await MainBook.balance({
    account: escrowAccountingPath,
    currency: "BTC",
  })

  // escrowInMongodb is negative
  // diff will equal 0 if there is no change
  const diff = escrowInLnd + escrowInMongodb

  baseLogger.info({ diff, escrowInLnd, escrowInMongodb, channels }, "escrow recording")

  if (diff > 0) {
    await MainBook.entry("escrow")
      .credit(lndAccountingPath, diff, { ...metadata })
      .debit(escrowAccountingPath, diff, { ...metadata })
      .commit()
  } else if (diff < 0) {
    await MainBook.entry("escrow")
      .debit(lndAccountingPath, -diff, { ...metadata })
      .credit(escrowAccountingPath, -diff, { ...metadata })
      .commit()
  }
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

  let txid

  if (stateChange === "opened") {
    ;({ transaction_id: txid } = channel as SubscribeToChannelsChannelOpenedEvent)
  } else if (stateChange === "closed") {
    ;({ close_transaction_id: txid } = channel as SubscribeToChannelsChannelClosedEvent)
  }

  // TODO: dedupe from onchain
  const { current_block_height } = await getHeight({ lnd })
  const after = Math.max(0, current_block_height - LOOK_BACK) // this is necessary for tests, otherwise after may be negative
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

  const metadata = { currency: "BTC", txid, type: "fee", pending: false }

  assert(fee > 0)

  await MainBook.entry(`channel ${stateChange} onchain fee`)
    .debit(lndFeePath, fee, { ...metadata })
    .credit(lndAccountingPath, fee, { ...metadata })
    .commit()

  baseLogger.info(
    { channel, fee, ...metadata },
    `${stateChange} channel fee added to mongodb`,
  )
}

export const getLnds = ({
  type,
  active,
}: { type?: nodeType; active?: boolean } = {}): ILndParamsAuthed[] => {
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
export const isMyNode = ({ pubkey }) => _.includes(nodesPubKey, pubkey)

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
      const error = `a username is required for push payment to the ${yamlConfig.name}`
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
