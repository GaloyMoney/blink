import { InvalidWalletId } from "@domain/errors"
export * from "./deposit-fee-calculator"
export { WalletTransactionHistory } from "./tx-history"
export * from "./tx-methods"
export * from "./tx-status"
export * from "./withdrawal-fee-calculator"
export * from "./payment-input-validator"
export * from "./primitives"

const UuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export const WalletIdRegex = UuidRegex

export const checkedToWalletId = (walletId: string): WalletId | ValidationError => {
  if (!walletId.match(WalletIdRegex)) {
    return new InvalidWalletId(walletId)
  }
  return walletId as WalletId
}

export const WithdrawalFeePriceMethod = {
  flat: "flat",
  proportionalOnImbalance: "proportionalOnImbalance",
} as const
