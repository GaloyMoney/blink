// an accounting reminder:
// https://en.wikipedia.org/wiki/Double-entry_bookkeeping

import { User } from "../schema"

// assets:

export const bitcoindAccountingPath = "Assets:Reserve:Bitcoind"
export const lndAccountingPath = "Assets:Reserve:Lightning" // TODO: rename to Assets:Lnd
export const escrowAccountingPath = "Assets:Reserve:Escrow" // TODO: rename to Assets:Lnd:Escrow

export const accountDealerFtxPath = "Assets:Dealer:FTX" // this should be updated with a cron job taking into consideration profit/loss

// liabilities
export const customerPath = (uid) => `Liabilities:Customer:${uid}`

let cacheDealerPath: string

export const dealerMediciPath = async () => {
  if (cacheDealerPath) {
    return cacheDealerPath
  }

  const dealer = await User.findOne({ role: "dealer" })
  cacheDealerPath = customerPath(dealer._id)
  return cacheDealerPath
}

export const liabilitiesDealerFtxPath = `Liabilities:Dealer:Ftx`

// expenses

// FIXME Bitcoin --> Lnd
export const lndFeePath = "Expenses:Bitcoin:Fees"

export const bitcoindFeePath = "Expenses:Bitcoin:Fees"

// revenue
export const onchainRevenuePath = "Revenue:Bitcoin:Fees"
export const revenueFeePath = "Revenue:Lightning:Fees"
