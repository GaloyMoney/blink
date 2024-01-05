import { MeQuery, RealtimePriceQuery, WalletCurrency } from "@/services/graphql/generated"

export const getCurrencyFromWalletType = (walletType: WalletCurrency) => {
  return walletType === WalletCurrency.Usd ? "cents" : "sats"
}

export const dollarsToCents = (amount: number) => {
  return Math.round(amount * 100)
}

export const centsToDollars = (amount: number) => {
  return parseFloat((amount / 100).toFixed(2))
}

export const getBTCWallet = (user: MeQuery) => {
  return user.me?.defaultAccount.wallets.find(
    (wallet) => wallet.walletCurrency === WalletCurrency.Btc,
  )
}
export const getUSDWallet = (user: MeQuery) => {
  return user.me?.defaultAccount.wallets.find(
    (wallet) => wallet.walletCurrency === WalletCurrency.Usd,
  )
}

export const getDefaultWallet = (user: MeQuery) => {
  return {
    currency: user.me?.defaultAccount.displayCurrency,
    id: user.me?.defaultAccount.defaultWalletId,
  }
}

export const convertUsdToBtcSats = (
  usdAmount: number,
  realtimePrice: RealtimePriceQuery,
): number => {
  const { btcSatPrice } = realtimePrice.realtimePrice
  const { base: btcSatBase, offset: btcSatOffset } = btcSatPrice
  const current = btcSatBase / 10 ** btcSatOffset
  return Math.floor((100 * usdAmount) / current)
}
