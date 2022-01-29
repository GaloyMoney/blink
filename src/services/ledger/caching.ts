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
