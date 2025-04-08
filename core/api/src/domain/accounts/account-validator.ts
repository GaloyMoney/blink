import { AccountStatus } from "./primitives"

import { InactiveAccountError, InvalidWalletId } from "@/domain/errors"

export const AccountValidator = (
  account: Account,
): AccountValidator | ValidationError => {
  const allowedStatuses: AccountStatus[] = [AccountStatus.Active, AccountStatus.Invited]

  if (!allowedStatuses.includes(account.status)) {
    return new InactiveAccountError(account.id)
  }

  const validateWalletForAccount = <S extends WalletCurrency>(
    wallet: WalletDescriptor<S>,
  ): true | ValidationError => {
    if (wallet.accountId !== account.id)
      return new InvalidWalletId(
        JSON.stringify({
          accountId: account.id,
          AccountIdFromWallet: wallet.accountId,
        }),
      )

    return true
  }

  return { validateWalletForAccount }
}
