// an accounting reminder:
// https://en.wikipedia.org/wiki/Double-entry_bookkeeping

import { liabilitiesMainAccount } from "@domain/ledger"

// assets:
export const assetsMainAccount = "Assets"
export const bitcoindAccountingPath = `${assetsMainAccount}:Reserve:Bitcoind`
export const lndAccountingPath = `${assetsMainAccount}:Reserve:Lightning` // TODO: rename to Assets:Lnd
export const escrowAccountingPath = `${assetsMainAccount}:Reserve:Escrow` // TODO: rename to Assets:Lnd:Escrow

export const resolveWalletId = (walletPath: string | string[]) => {
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

  return id as WalletId
}

let cacheDealerWalletId: WalletId
let cacheBankOwnerWalletId: WalletId
let cacheFunderWalletId: WalletId

const throwError = (wallet) => Promise.reject(`Invalid ${wallet}WalletPath`)
let bankOwnerResolver = (): Promise<WalletId> => throwError("bankOwner")
let dealerResolver = (): Promise<WalletId> => throwError("dealer")
let funderResolver = (): Promise<WalletId> => throwError("funder")

export function setBankOwnerWalletResolver(resolver: () => Promise<WalletId>) {
  bankOwnerResolver = resolver
}

export function setDealerWalletResolver(resolver: () => Promise<WalletId>) {
  dealerResolver = resolver
}

export function setFunderWalletResolver(resolver: () => Promise<WalletId>) {
  funderResolver = resolver
}

export const getDealerWalletId = async () => {
  if (cacheDealerWalletId) {
    return cacheDealerWalletId
  }

  const dealerId = await dealerResolver()
  cacheDealerWalletId = dealerId
  return cacheDealerWalletId
}

export const getBankOwnerWalletId = async () => {
  if (cacheBankOwnerWalletId) {
    return cacheBankOwnerWalletId
  }

  const bankOwnerId = await bankOwnerResolver()
  cacheBankOwnerWalletId = bankOwnerId
  return cacheBankOwnerWalletId
}

export const getFunderWalletId = async () => {
  if (cacheFunderWalletId) {
    return cacheFunderWalletId
  }

  const funderId = await funderResolver()
  cacheFunderWalletId = funderId
  return cacheFunderWalletId
}
