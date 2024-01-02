import { WalletCurrency } from "@/services/graphql/generated"

export const getCurrencyFromWalletType = (walletType: WalletCurrency) => {
  return walletType === WalletCurrency.Usd ? "cents" : "sats"
}
