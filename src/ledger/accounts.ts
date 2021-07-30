// an accounting reminder:
// https://en.wikipedia.org/wiki/Double-entry_bookkeeping

import { User } from "../schema"

// assets:
export const assetsMainAccount = "Assets"
export const bitcoindAccountingPath = `${assetsMainAccount}:Reserve:Bitcoind`
export const lndAccountingPath = `${assetsMainAccount}:Reserve:Lightning` // TODO: rename to Assets:Lnd
export const escrowAccountingPath = `${assetsMainAccount}:Reserve:Escrow` // TODO: rename to Assets:Lnd:Escrow

// liabilities
export const liabilitiesMainAccount = "Liabilities"
export const accountPath = (uid) => `${liabilitiesMainAccount}:${uid}`
export const resolveAccountId = (accountPath: string | string[]) => {
  let id: string | null = null

  if (!accountPath) {
    return id
  }

  let path = accountPath

  if (typeof accountPath === "string") {
    path = accountPath.split(":")
  }

  if (
    Array.isArray(path) &&
    path.length === 2 &&
    path[0] === liabilitiesMainAccount &&
    path[1]
  ) {
    id = path[1]
  }

  return id
}

let cacheDealerPath: string
let cachebankOwnerPath: string

export const dealerAccountPath = async () => {
  if (cacheDealerPath) {
    return cacheDealerPath
  }

  const dealer = await User.findOne({ role: "dealer" })
  cacheDealerPath = accountPath(dealer._id)
  return cacheDealerPath
}

export const bankOwnerAccountPath = async () => {
  if (cachebankOwnerPath) {
    return cachebankOwnerPath
  }

  const bank = await User.findOne({ role: "bankowner" })
  cachebankOwnerPath = accountPath(bank._id)
  return cachebankOwnerPath
}
