import { default as axios } from 'axios';
import { getChainBalance, getChainTransactions, getChannelBalance, getChannels, getClosedChannels, getForwards, getHeight, getPendingChainBalance, getWalletInfo } from "lightning";
import _ from "lodash";
import { baseLogger } from "./logger";
import { DbMetadata } from "./schema";
import { MainBook } from "./mongodb";
import { escrowAccountingPath, lndAccountingPath, lndFeePath, revenueFeePath } from "./ledger/ledger";
import { DbError } from "./error";
import { LOOK_BACK } from "./utils";
import assert from 'assert';
import { ILndParamsAuthed, ILndParamsLightningAuthed, nodeType, params } from "./lndAuth";

// milliseconds in a day
const MS_PER_DAY = 864e5

export const lndsBalances = async () => {
  const data = await Promise.all(getLnds().map(({lnd}) => lndBalances({lnd})))
  return { 
    total: _.sumBy(data, "total"), 
    onChain: _.sumBy(data, "onChain"), 
    offChain: _.sumBy(data, "offChain"), 
    opening_channel_balance: _.sumBy(data, "opening_channel_balance"), 
    closing_channel_balance: _.sumBy(data, "closing_channel_balance")
  }
}

export const lndBalances = async ({ lnd }) => {
  // Onchain
  const { chain_balance } = await getChainBalance({lnd})
  const { channel_balance, pending_balance: opening_channel_balance } = await getChannelBalance({lnd})

  //FIXME: This can cause incorrect balance to be reported in case an unconfirmed txn is later cancelled/double spent
  // bitcoind seems to have a way to report this correctly. does lnd have?
  const { pending_chain_balance } = await getPendingChainBalance({lnd})

  // get pending closed
  const { channels: closedChannels } = await getClosedChannels({ lnd })

  // FIXME: there can be issue with channel not closed completely from lnd 
  // https://github.com/alexbosworth/ln-service/issues/139
  baseLogger.debug({ closedChannels }, "getClosedChannels")
  const closing_channel_balance = _.sumBy(closedChannels, channel => _.sumBy(
    (channel as any).close_payments, payment => (payment as any).is_pending ? (payment as any).tokens : 0)
  )

  const total = chain_balance + channel_balance + pending_chain_balance + opening_channel_balance + closing_channel_balance
  return { total, onChain: chain_balance + pending_chain_balance, offChain: channel_balance, opening_channel_balance, closing_channel_balance }
}

export async function nodeStats({ lnd }) {
  const result = await getWalletInfo({ lnd })
  const peersCount = result.peers_count
  const channelsCount = result.active_channels_count
  const id = result.public_key
  return {
    peersCount,
    channelsCount,
    id
  }
}

export const nodesStats = async () => {
  const data = getAllOffchainLnd.map(({lnd}) => nodeStats({lnd}))
  // TODO: try if we don't need a Promise.all()
  return await Promise.all(data)
}

export async function getBosScore() {
  try {
    const { data } = await axios.get('https://bos.lightning.jorijn.com/data/export.json')

    // FIXME: manage multiple nodes
    const { lnd } = getActiveLnd() 
    const publicKey = (await getWalletInfo({lnd})).public_key;
    const bosScore = _.find(data.data, { publicKey })
    if (!bosScore) {
      baseLogger.info("key is not in bos list")
    }
    return bosScore.score
  } catch (err) {
    return 0
  }
}

export const getRoutingFees = async ({ lnd, before, after }): Promise<Record<string, number>> => {
  const forwardsList = await getForwards({ lnd, before, after })
  let next = forwardsList.next
  let forwards = forwardsList.forwards

  let finishedFetching = false
  if(!next || !forwards || forwards.length <= 0) {
    finishedFetching = true;
  }

  while(!finishedFetching) {
    if(next) {
      const moreForwards = await getForwards({ lnd, token: next })
      forwards = [...forwards, ...moreForwards.forwards];
      next = moreForwards.next;
    } else {
      finishedFetching = true;
    }
  }

  // groups each forward object by date
  const dateGroupedForwards = _.groupBy(forwards, e => new Date(e.created_at).toDateString())

  // returns revenue for each date by reducing all forwards for each date
  return (_.mapValues(dateGroupedForwards, e => e.reduce((sum, {fee_mtokens}) => sum + +fee_mtokens, 0) / 1000))
}

export const updateRoutingFees = async () => {
  
  const dbMetadata = await DbMetadata.findOne({})
  let lastDate

  if(dbMetadata?.routingFeeLastEntry) {
    lastDate = new Date(dbMetadata.routingFeeLastEntry)
  } else {
    lastDate = new Date(0)
    baseLogger.info('Running the routing fee revenue cronjob for the first time')
  }

  // Done to remove effect of timezone
  lastDate.setUTCHours(0, 0, 0, 0)

  const after = lastDate.toISOString()

  const endDate = new Date(Date.now() - MS_PER_DAY);
  
  // Done to remove effect of timezone
  endDate.setUTCHours(0, 0, 0, 0)

  const before = endDate.toISOString()
  
  // Only record fee if it has been 1d+ since last record
  if((endDate.getTime() - lastDate.getTime()) / MS_PER_DAY < 1) {
    return
  }
  
  const type = "routing_fee"
  const metadata = { type, currency: "BTC", pending: false }

  // console.log({after, before})
  // get fee collected day wise
  const { lnd } = getActiveLnd()  
  const forwards = await getRoutingFees({ lnd, before, after })

  // iterate over object and record fee day wise in our books
  _.forOwn(forwards, async (fee, day) => {
    try {
      await MainBook.entry("routing fee")
      .credit(revenueFeePath, fee, { ...metadata, feesCollectedOn: day})
      .debit(lndAccountingPath, fee, { ...metadata, feesCollectedOn: day })
      .commit()
    } catch(err) {
      throw new DbError('Unable to record routing revenue', {forwardToClient: false, logger: baseLogger, level: 'error'})
    }
  })
  
  endDate.setDate(endDate.getDate() + 1)
  const endDay = endDate.toDateString()
  await DbMetadata.findOneAndUpdate({}, { $set: { routingFeeLastEntry: endDay } }, { upsert: true })
}


export const updateEscrows = async () => {
  const type = "escrow"
  const metadata = { type, currency: "BTC", pending: false }

  // FIXME: update escrow of all the node
  const { lnd } = getActiveLnd()
  const { channels } = await getChannels({lnd})

  const selfInitatedChannels = _.filter(channels, {is_partner_initiated: false})
  const escrowInLnd = _.sumBy(selfInitatedChannels, 'commit_transaction_fee')

  const { balance: escrowInMongodb } = await MainBook.balance({
    account: escrowAccountingPath,
    currency: "BTC",
  })

  // escrowInMongodb is negative
  // diff will equal 0 if there is no change
  const diff = escrowInLnd + escrowInMongodb

  baseLogger.info({diff, escrowInLnd, escrowInMongodb, channels}, "escrow recording")

  if (diff > 0) {
    await MainBook.entry("escrow")
      .credit(lndAccountingPath, diff, {...metadata})
      .debit(escrowAccountingPath, diff, {...metadata})
      .commit()
  } else if (diff < 0) {
    await MainBook.entry("escrow")
      .debit(lndAccountingPath, - diff, {...metadata})
      .credit(escrowAccountingPath, - diff, {...metadata})
      .commit()
  }
}


export const onChannelUpdated = async ({ channel, lnd, stateChange }: { channel: any, lnd: any, stateChange: "opened" | "closed" }) => {
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
    ({ transaction_id: txid } = channel)
  } else if (stateChange === "closed") {
    ({ close_transaction_id: txid } = channel)
  }
  
  // TODO: dedupe from onchain
  const { current_block_height } = await getHeight({ lnd })
  const after = Math.max(0, current_block_height - LOOK_BACK) // this is necessary for tests, otherwise after may be negative
  const { transactions } = await getChainTransactions({ lnd, after })
  // end dedupe

  const tx = _.find(transactions, { id: txid })

  if (!tx?.fee) {
    baseLogger.error({transactions}, "fee doesn't exist")
    return
  }

  const fee = tx.fee

  // let tx
  // try {
  //   tx = await bitcoindDefaultClient.getRawTransaction(txid, true /* include_watchonly */ )
  // } catch (err) {
  //   logger.error({err}, "can't fetch fee for closing tx")
  // }
  
  // TODO: there is no fee currently given by bitcoind for raw transaction
  // either calculate it from the input, or use an indexer 
  // const { fee } = tx.fee

  const metadata = { currency: "BTC", txid, type: "fee", pending: false }

  assert(fee > 0)

  await MainBook.entry(`channel ${stateChange} onchain fee`)
    .debit(lndFeePath, fee, { ...metadata, })
    .credit(lndAccountingPath, fee, { ...metadata })
    .commit()

  baseLogger.info({ channel, fee, ...metadata }, `${stateChange} channel fee added to mongodb`)
}


export const getLnds = ({type, active}: {type?: nodeType, active?: boolean} = {}): ILndParamsAuthed[] => {
  let result = params

  if (!!type) {
    result = _.filter(result, item => item.type.some(item => item === type))
  }

  if (!!active) {
    result = _.filter(result, {active})
  }

  return result
}

export const getAllOffchainLnd = getLnds({type: "offchain"}) as ILndParamsLightningAuthed[]

// only returning the first one for now
export const getActiveLnd = () => {
  const lnds = getLnds({active: true, type: "offchain"})
  if (lnds.length === 0) {
    throw Error("no active lnd to send/receive a payment")
  }
  // this favor lnd1
  return lnds[0] as ILndParamsLightningAuthed

  // an alternative that would load balance would be: 
  // const index = Math.floor(Math.random() * lnds.length)
  // return lnds[index]
}

// there is only one lnd responsible for onchain tx
export const getOnchainLnd = getLnds({type: "onchain"})[0]

export const nodesPubKey = getAllOffchainLnd.map(item => item.pubkey)
export const isMyNode = ({pubkey}) => _.includes(nodesPubKey, pubkey)

export const getLndFromPubkey = ({ pubkey }: {pubkey: string}) => {
  const lnds = getLnds({active: true})
  const lnd = _.filter(lnds, { pubkey })
  if (!lnd) {
    throw Error("lnd is offline")
  } else {
    return lnd[0]
  }
}
