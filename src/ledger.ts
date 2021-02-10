// an accounting reminder:
// https://en.wikipedia.org/wiki/Double-entry_bookkeeping

// assets:

import { User } from "./mongodb"

export const lndAccountingPath = 'Assets:Reserve:Lightning' // TODO: rename to Assets:Lnd
export const bitcoindAccountingPath = (walletName) => `Assets:Bitcoind:${walletName}` // TODO
export const accountBrokerFtxPath = 'Assets:Broker:FTX' // this should be updated with a cron job taking into consideration profit/loss 
export const escrowAccountingPath = 'Assets:Reserve:Escrow' // TODO: rename to Assets:Lnd:Escrow

// liabilities
export const customerPath = (uid) => `Liabilities:Customer:${uid}`

let cacheBrokerPath: string

export const brokerMediciPath = async () => {
  if (!!cacheBrokerPath) {
    return cacheBrokerPath
  }

  const broker = await User.findOne({ role: "broker" })
  cacheBrokerPath = customerPath(broker._id)
  return cacheBrokerPath
}   

// export const brokerPathLnd = `Liabilities:Customer:uid` --> normal account
export const brokerPath = `Liabilities:Broker` // used for USD
export const liabilitiesBrokerFtxPath = `Liabilities:Broker:Ftx`

// expenses

// FIXME Bitcoin --> Lnd
export const lndFeePath = 'Expenses:Bitcoin:Fees'

export const bitcoindFeePath = 'Expenses:Bitcoin:Fees'

// revenue
// export const revenueFees = 'Revenue:Lightning:Fees'
