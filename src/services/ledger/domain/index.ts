import { WalletCurrency } from "@domain/shared"
export * from "./entry-builder"
export * from "./accounts"

export const liabilitiesMainAccount = "Liabilities"
export const toLedgerAccountId = (walletId: WalletId): LedgerAccountId =>
  `${liabilitiesMainAccount}:${walletId}` as LedgerAccountId

export const paymentAmountFromSats = (sats: Satoshis): PaymentAmount<"BTC"> => {
  return {
    currency: WalletCurrency.Btc,
    amount: BigInt(sats),
  }
}
