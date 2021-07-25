// an accounting reminder:
// https://en.wikipedia.org/wiki/Double-entry_bookkeeping

import { User } from "../schema"

// assets:

export const bitcoindAccountingPath = "Assets:Reserve:Bitcoind"
export const lndAccountingPath = "Assets:Reserve:Lightning" // TODO: rename to Assets:Lnd
export const escrowAccountingPath = "Assets:Reserve:Escrow" // TODO: rename to Assets:Lnd:Escrow

// liabilities
export const accountPath = (uid) => `Liabilities:${uid}`

let cacheDealerPath: string
let cachebankOwnerPath: string

export const dealerMediciPath = async () => {
  if (cacheDealerPath) {
    return cacheDealerPath
  }

  const dealer = await User.findOne({ role: "dealer" })
  cacheDealerPath = accountPath(dealer._id)
  return cacheDealerPath
}

export const bankOwnerMediciPath = async () => {
  if (cachebankOwnerPath) {
    return cachebankOwnerPath
  }

  const bank = await User.findOne({ role: "bankowner" })
  cachebankOwnerPath = accountPath(bank._id)
  return cachebankOwnerPath
}
