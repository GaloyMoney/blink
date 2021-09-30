import { InvalidPublicWalletId } from "@domain/errors"

export { WalletTransactionHistory } from "./tx-history"
export * from "./tx-methods"
export * from "./tx-status"
export * from "./deposit-fee-calculator"
export * from "./withdrawal-fee-calculator"

export const WalletPublicIdRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export const checkedToWalletPublicId = (
  walletPublicId: string,
): WalletPublicId | ValidationError => {
  if (!walletPublicId.match(WalletPublicIdRegex)) {
    return new InvalidPublicWalletId(walletPublicId)
  }
  return walletPublicId as WalletPublicId
}
