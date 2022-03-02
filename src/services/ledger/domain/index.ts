import { WalletCurrency } from "@domain/shared"
export * from "./entry-builder"
export * from "./accounts"

export const liabilitiesMainAccount = "Liabilities"
export const toLedgerAccountId = (walletId: WalletId): LedgerAccountId =>
  `${liabilitiesMainAccount}:${walletId}` as LedgerAccountId

export const paymentAmountFromSats = (sats: Satoshis): BtcPaymentAmount => {
  return {
    currency: WalletCurrency.Btc,
    amount: BigInt(sats),
  }
}

export const paymentAmountFromCents = (cents: UsdCents): UsdPaymentAmount => {
  return {
    currency: WalletCurrency.Usd,
    amount: BigInt(cents),
  }
}
