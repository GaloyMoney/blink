import { InactiveAccountError, InvalidWalletId } from "@domain/errors"

import { AccountStatus } from "./primitives"

export const AccountValidator = (
  account: Account,
): AccountValidator | ValidationError => {
  if (account.status !== AccountStatus.Active) {
    return new InactiveAccountError(account.id)
  }

  const validateWalletForAccount = <S extends WalletCurrency>(
    wallet: WalletDescriptor<S>,
  ): true | ValidationError => {
    if (wallet.accountId !== account.id)
      return new InvalidWalletId(
        JSON.stringify({ accountId: account.id, accountIdFromWallet: wallet.accountId }),
      )

    return true
  }

  return { validateWalletForAccount }
}
