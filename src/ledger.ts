// an accounting reminder:
// https://en.wikipedia.org/wiki/Double-entry_bookkeeping

// assets:

import { User } from "./mongodb"

export const bitcoindAccountingPath = 'Assets:Reserve:Bitcoind'
export const lndAccountingPath = 'Assets:Reserve:Lightning' // TODO: rename to Assets:Lnd
export const accountDealerFtxPath = 'Assets:Dealer:FTX' // this should be updated with a cron job taking into consideration profit/loss 
export const escrowAccountingPath = 'Assets:Reserve:Escrow' // TODO: rename to Assets:Lnd:Escrow

// liabilities
export const customerPath = (uid) => `Liabilities:Customer:${uid}`

let cacheDealerPath: string

export const dealerMediciPath = async () => {
  if (!!cacheDealerPath) {
    return cacheDealerPath
  }

  const dealer = await User.findOne({ role: "dealer" })
  cacheDealerPath = customerPath(dealer._id)
  return cacheDealerPath
}   


// export const dealerPathLnd = `Liabilities:Customer:uid` --> normal account
export const dealerPath = `Liabilities:Dealer` // used for USD
export const liabilitiesDealerFtxPath = `Liabilities:Dealer:Ftx`

// expenses

// FIXME Bitcoin --> Lnd
export const lndFeePath = 'Expenses:Bitcoin:Fees'

export const bitcoindFeePath = 'Expenses:Bitcoin:Fees'

// revenue
// export const revenueFees = 'Revenue:Lightning:Fees'
