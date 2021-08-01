// an accounting reminder:
// https://en.wikipedia.org/wiki/Double-entry_bookkeeping

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

const throwError = (account) => Promise.reject(`Invalid ${account}AccountPath`)
let bankOwnerResolver = (): Promise<string> => throwError("bankOwner")
let dealerResolver = (): Promise<string> => throwError("dealer")

export function setBankOwnerAccountResolver(resolver: () => Promise<string>) {
  bankOwnerResolver = resolver
}

export function setDealerAccountResolver(resolver: () => Promise<string>) {
  dealerResolver = resolver
}

export const dealerAccountPath = async () => {
  if (cacheDealerPath) {
    return cacheDealerPath
  }

  const dealerId = await dealerResolver()
  cacheDealerPath = accountPath(dealerId)
  return cacheDealerPath
}

export const bankOwnerAccountPath = async () => {
  if (cachebankOwnerPath) {
    return cachebankOwnerPath
  }

  const bankOwnerId = await bankOwnerResolver()
  cachebankOwnerPath = accountPath(bankOwnerId)
  return cachebankOwnerPath
}
