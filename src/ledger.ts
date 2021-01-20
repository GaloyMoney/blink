// assets:

import { User } from "./mongodb"

export const bitcoindAccountingPath = 'Assets:Reserve:Bitcoind' // TODO: rename to Assets:Lnd
export const lightningAccountingPath = 'Assets:Reserve:Lightning' // TODO: rename to Assets:Lnd
export const accountBrokerFtxPath = 'Assets:Broker:FTX' // this should be updated with a cron job taking into consideration profit/loss 
export const escrowAccountingPath = 'Assets:Reserve:Escrow' // TODO: rename to Assets:Lnd:Escrow

// liabilities
export const customerPath = (uid) => `Liabilities:Customer:${uid}`

export const brokerLndPath = async () => {
  const broker = await User.findOne({ role: "broker" })
  return customerPath(broker._id)
}   

// export const brokerPathLnd = `Liabilities:Customer:uid` --> normal account
export const brokerPath = `Liabilities:Broker` // used for USD
export const liabilitiesBrokerFtxPath = `Liabilities:Broker:Ftx`

// expenses
export const accountingExpenses = "Expenses"
export const lndFee = 'Expenses:Bitcoin:Fees'

// revenue
// export const revenueFees = 'Revenue:Lightning:Fees'
