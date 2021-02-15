import { sumBy } from "lodash";
import { lnd } from "./lndConfig"
import { baseLogger } from "./utils";
const lnService = require('ln-service');

export const lndBalances = async () => {
  const { chain_balance } = await lnService.getChainBalance({lnd})
  const { channel_balance, pending_balance: opening_channel_balance } = await lnService.getChannelBalance({lnd})

  //FIXME: This can cause incorrect balance to be reported in case an unconfirmed txn is later cancelled/double spent
  // bitcoind seems to have a way to report this correctly. does lnd have?
  const { pending_chain_balance } = await lnService.getPendingChainBalance({lnd})

  const { channels: closedChannels } = await lnService.getClosedChannels({lnd})

  // FIXME: calculation seem wrong (seeing the grafana graph, need to double check)
  baseLogger.debug({closedChannels}, "lnService.getClosedChannels")
  const closing_channel_balance = sumBy(closedChannels, channel => sumBy(
    (channel as any).close_payments, payment => (payment as any).is_pending ? (payment as any).tokens : 0 )
  )
  
  const total = chain_balance + channel_balance + pending_chain_balance + opening_channel_balance + closing_channel_balance
  return { total, onChain: chain_balance + pending_chain_balance, offChain: channel_balance, opening_channel_balance, closing_channel_balance } 
}