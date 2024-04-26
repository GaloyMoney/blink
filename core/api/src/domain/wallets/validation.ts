import { UuidRegex } from "@/domain/shared"
import { InvalidWalletId } from "@/domain/errors"

export const WalletIdRegex = UuidRegex

export const checkedToWalletId = (walletId: string): WalletId | ValidationError => {
  if (!walletId.match(WalletIdRegex)) {
    return new InvalidWalletId(walletId)
  }
  return walletId as WalletId
}
