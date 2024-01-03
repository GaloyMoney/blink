import { WalletCurrency } from "@/services/graphql/generated"

export const getCurrencyFromWalletType = (walletType: WalletCurrency) => {
  return walletType === WalletCurrency.Usd ? "cents" : "sats"
}

export const dollarsToCents = (amount: number) => {
  return amount * 100
}

export const centsToDollars = (amount: number) => {
  return amount / 100
}
