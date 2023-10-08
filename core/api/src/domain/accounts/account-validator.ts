import { AccountStatus } from "./primitives"

import { InactiveAccountError, InvalidWalletId } from "@/domain/errors"

export const AccountValidator = (
  account: Account,
): AccountValidator | ValidationError => {
  if (account.status !== AccountStatus.Active) {
    return new InactiveAccountError(account.uuid)
  }

  const validateWalletForAccount = <S extends WalletCurrency>(
    wallet: WalletDescriptor<S>,
  ): true | ValidationError => {
    if (wallet.accountUuid !== account.uuid)
      return new InvalidWalletId(
        JSON.stringify({
          accountUuid: account.uuid,
          accountUuidFromWallet: wallet.accountUuid,
        }),
      )

    return true
  }

  return { validateWalletForAccount }
}
