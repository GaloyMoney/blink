import { InvalidWalletname } from "@domain/errors"

export { WalletTransactionHistory } from "./tx-history"
export * from "./tx-methods"

export const WalletnameRegex = /(?!^(1|3|bc1|lnbc1))^[0-9a-z_]+$/i

export const checkedToWalletname = (walletname): Walletname | ValidationError => {
  if (!walletname.match(WalletnameRegex)) {
    return new InvalidWalletname(walletname)
  }
  return walletname as Walletname
}
