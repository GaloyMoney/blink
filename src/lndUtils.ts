import _ from "lodash";
import { lnd } from "./lndConfig"
import { baseLogger } from "./utils";
import * as lnService from "ln-service"
import { default as axios } from 'axios';
import { getChannelBalance, getClosedChannels, getWalletInfo } from "lightning"


export const lndBalances = async () => {
  // Onchain
  const { chain_balance } = await lnService.getChainBalance({lnd})
  const { channel_balance, pending_balance: opening_channel_balance } = await getChannelBalance({lnd})

  //FIXME: This can cause incorrect balance to be reported in case an unconfirmed txn is later cancelled/double spent
  // bitcoind seems to have a way to report this correctly. does lnd have?
  const { pending_chain_balance } = await lnService.getPendingChainBalance({lnd})

  // get pending closed
  const { channels: closedChannels } = await getClosedChannels({lnd})

  // FIXME: there can be issue with channel not closed completely from lnd 
  // https://github.com/alexbosworth/ln-service/issues/139
  baseLogger.debug({closedChannels}, "getClosedChannels")
  const closing_channel_balance = _.sumBy(closedChannels, channel => _.sumBy(
    (channel as any).close_payments, payment => (payment as any).is_pending ? (payment as any).tokens : 0 )
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

export async function getBosScore() {
  try {
    const { data } = await axios.get('https://bos.lightning.jorijn.com/data/export.json')

    const publicKey = (await getWalletInfo({lnd})).public_key;
    const bosScore = _.find(data.data, { publicKey })
    return bosScore.score
  } catch (err) {
    // err2: err.toJson() does not work
    baseLogger.error({ err }, `issue getting bos rank`)
  }
}