// an accounting reminder:
// https://en.wikipedia.org/wiki/Double-entry_bookkeeping

// assets:
export const assetsMainAccount = "Assets"
export const bitcoindAccountingPath = `${assetsMainAccount}:Reserve:Bitcoind`
export const lndAccountingPath = `${assetsMainAccount}:Reserve:Lightning` // TODO: rename to Assets:Lnd
export const escrowAccountingPath = `${assetsMainAccount}:Reserve:Escrow` // TODO: rename to Assets:Lnd:Escrow

// liabilities
export const liabilitiesMainAccount = "Liabilities"
export const walletPath = (walletId) => `${liabilitiesMainAccount}:${walletId}`
export const resolveWalletId = (walletPath: string | string[]): WalletId | null => {
  let id: WalletId | null = null

  if (!walletPath) {
    return null
  }

  let path = walletPath

  if (typeof walletPath === "string") {
    path = walletPath.split(":")
  }

  if (
    Array.isArray(path) &&
    path.length === 2 &&
    path[0] === liabilitiesMainAccount &&
    path[1]
  ) {
    id = path[1] as WalletId
  }

  return id
}

let cacheDealerPath: string
let cachebankOwnerPath: string

const throwError = (wallet) => Promise.reject(`Invalid ${wallet}WalletPath`)
let bankOwnerResolver = (): Promise<string> => throwError("bankOwner")
let dealerResolver = (): Promise<string> => throwError("dealer")

export function setbankOwnerWalletResolver(resolver: () => Promise<string>) {
  bankOwnerResolver = resolver
}

export function setdealerWalletResolver(resolver: () => Promise<string>) {
  dealerResolver = resolver
}

export const dealerAccountPath = async () => {
  if (cacheDealerPath) {
    return cacheDealerPath
  }

  const dealerId = await dealerResolver()
  cacheDealerPath = walletPath(dealerId)
  return cacheDealerPath
}

export const bankOwnerAccountPath = async () => {
  if (cachebankOwnerPath) {
    return cachebankOwnerPath
  }

  const bankOwnerId = await bankOwnerResolver()
  cachebankOwnerPath = walletPath(bankOwnerId)
  return cachebankOwnerPath
}
