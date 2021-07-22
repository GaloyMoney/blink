// an accounting reminder:
// https://en.wikipedia.org/wiki/Double-entry_bookkeeping

import { User } from "../schema"

// assets:

export const bitcoindAccountingPath = "Assets:Reserve:Bitcoind"
export const lndAccountingPath = "Assets:Reserve:Lightning" // TODO: rename to Assets:Lnd
export const escrowAccountingPath = "Assets:Reserve:Escrow" // TODO: rename to Assets:Lnd:Escrow

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

// use for topping up lightning node that doesn't act at bitcoin wallet
// only used during test for now
export const liabilitiesReserve = `Liabilities:Reserve:Lightning`

// expenses

// FIXME Bitcoin --> Lnd
export const lndFeePath = "Expenses:Bitcoin:Fees"

export const bitcoindFeePath = "Expenses:Bitcoin:Fees"

// revenue
export const onchainRevenuePath = "Revenue:Bitcoin:Fees"
export const revenueFeePath = "Revenue:Lightning:Fees"
