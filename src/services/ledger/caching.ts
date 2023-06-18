let cacheDealerBtcWalletId: WalletId
let cacheDealerUsdWalletId: WalletId
let cacheBankOwnerWalletId: WalletId
let cacheFunderWalletId: WalletId

const throw2Error = (wallet: string) => Promise.reject(`Invalid ${wallet}WalletPath`)
let bankOwnerResolver = (): Promise<WalletId> => throw2Error("bankOwner")
let dealerBtcResolver = (): Promise<WalletId> => throw2Error("dealerBtc")
let dealerUsdResolver = (): Promise<WalletId> => throw2Error("dealerUsd")
let funderResolver = (): Promise<WalletId> => throw2Error("funder")

export function setBankOwnerWalletResolver(resolver: () => Promise<WalletId>) {
  bankOwnerResolver = resolver
}

export function setDealerBtcWalletResolver(resolver: () => Promise<WalletId>) {
  dealerBtcResolver = resolver
}

export function setDealerUsdWalletResolver(resolver: () => Promise<WalletId>) {
  dealerUsdResolver = resolver
}

export function setFunderWalletResolver(resolver: () => Promise<WalletId>) {
  funderResolver = resolver
}

export const getDealerBtcWalletId = async () => {
  if (cacheDealerBtcWalletId) {
    return cacheDealerBtcWalletId
  }

  const dealerBtcId = await dealerBtcResolver()
  cacheDealerBtcWalletId = dealerBtcId
  return cacheDealerBtcWalletId
}

export const getDealerUsdWalletId = async () => {
  if (cacheDealerUsdWalletId) {
    return cacheDealerUsdWalletId
  }

  const dealerUsdId = await dealerUsdResolver()
  cacheDealerUsdWalletId = dealerUsdId
  return cacheDealerUsdWalletId
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

export const getDealerWalletIds = async () => ({
  dealerBtc: await getDealerBtcWalletId(),
  dealerUsd: await getDealerUsdWalletId(),
})

export const getNonEndUserWalletIds = async () => ({
  ...(await getDealerWalletIds()),
  bankOwner: await getBankOwnerWalletId(),
  funder: await getFunderWalletId(),
})
