import { InvalidAccountStatusError, InvalidWalletId } from "@domain/errors"

import { AccountStatus } from "."

export const AccountValidator = (): AccountValidator => {
  const validateAccount = ({
    account,
    accountIdFromWallet,
  }: {
    account: Account
    accountIdFromWallet: AccountId
  }): true | ValidationError => {
    if (account.status !== AccountStatus.Active) {
      return new InvalidAccountStatusError()
    }

    if (accountIdFromWallet !== account.id) return new InvalidWalletId()

    return true
  }

  return { validateAccount }
}
